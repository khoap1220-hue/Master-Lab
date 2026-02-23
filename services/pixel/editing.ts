
import { Part, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { MemoryInsight, ScenarioCategory } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { getVisionarySystemInstruction, REALISM_ENFORCER, CONTENT_STRATEGIST_PROMPT, ANTI_LAZINESS_PROTOCOL } from "../prompts";
import { getEmpathyInstruction } from "../memoryService";
import { getClosestAspectRatio, sanitizeAspectRatio, optimizeImagePayload } from "../../lib/utils";

export const pixelSmithEdit = async (
  prompt: string,
  memoryInsight: MemoryInsight,
  imageContent: string,
  imageLabel: string,
  targetDescription: string,
  category: ScenarioCategory = 'Creative Studio',
  maskContent?: string,
  compositeContent?: string | null,
  refImageContent?: string,
  contextImages: {label: string, data: string}[] = []
): Promise<{ image?: string; text: string }> => {
  return executeManagedTask('IMAGE_EDIT_COMPLEX', async () => {
    const ai = getAI();
    const detectedRatio = await getClosestAspectRatio(imageContent);
    const ratio = sanitizeAspectRatio(detectedRatio);
    
    const isLogoMode = category === 'Logo Design';
    const isCompositing = !!refImageContent || contextImages.length > 0;

    // SMART PRE-OPTIMIZATION (v2)
    const promises: Promise<any>[] = [optimizeImagePayload(imageContent, 'editing')];
    
    if (maskContent) promises.push(optimizeImagePayload(maskContent, 'masking')); else promises.push(Promise.resolve(null));
    if (compositeContent) promises.push(optimizeImagePayload(compositeContent, 'editing')); else promises.push(Promise.resolve(null));
    if (refImageContent) promises.push(optimizeImagePayload(refImageContent, 'editing')); else promises.push(Promise.resolve(null));
    
    if (contextImages.length > 0) {
        contextImages.forEach(img => promises.push(optimizeImagePayload(img.data, 'editing')));
    }

    const optimizedResults = await Promise.all(promises);
    
    const optImage = optimizedResults[0];
    const optMask = optimizedResults[1];
    const optComposite = optimizedResults[2];
    const optRefImage = optimizedResults[3];
    const optContextImages = contextImages.map((img, idx) => ({
        label: img.label,
        data: optimizedResults[4 + idx]
    }));

    const systemPrompt = `
      ${getEmpathyInstruction(memoryInsight)}
      ${getVisionarySystemInstruction(category)}
      ${ANTI_LAZINESS_PROTOCOL}
      ${CONTENT_STRATEGIST_PROMPT}
      ${isLogoMode ? '' : REALISM_ENFORCER}
      
      [VAI TRÒ: BIÊN TẬP VIÊN HÌNH ẢNH & NGHỆ SĨ PHỐI CẢNH]
      [LỆNH: SINH_ẢNH_CHỈNH_SỬA]
      
      NHIỆM VỤ: Chỉnh sửa hoặc nhúng yếu tố thương hiệu vào [${imageLabel}].
      YÊU CẦU: "${prompt}"
      MỤC TIÊU KỸ THUẬT: ${targetDescription}
      TỶ LỆ KHUNG HÌNH: ${ratio}
      
      CRITICAL RULE: DO NOT RENDER any metadata text (like 'Drift: 5', 'Phase') onto the image.
      
      ${isCompositing ? `
      *** CHẾ ĐỘ PHỐI CẢNH NEURAL (COMPOSITING) KÍCH HOẠT ***
      Đầu vào: ẢNH NỀN + CÁC TÀI SẢN THƯƠNG HIỆU THAM CHIẾU.
      LOGIC: Nhúng các tài sản này vào cảnh một cách vật lý. 
      - Integration Physics: Tạo bóng đổ (Contact Shadows), Phản xạ môi trường (Environment Reflections), và Hiệu ứng Fresnel.
      - Material Match: Nếu bề mặt có vân (gỗ, tường, vải), phải áp dụng phép biến dạng (Displacement) hoặc hòa trộn (Multiply/Overlay) để thấy rõ chất liệu.
      - DO NOT just paste the logo flatly. It must curve with the surface.
      ` : `
      QUY TẮC:
      1. TÍCH HỢP: Vùng chỉnh sửa phải hòa hợp hoàn hảo với ánh sáng, phối cảnh.
      2. TUÂN THỦ MASK: Chỉ được thay đổi các điểm ảnh trong vùng MASK TRẮNG.
      3. DETAIL BOOST: Khi chỉnh sửa, hãy thêm các chi tiết ngẫu nhiên (bụi, xước, vân) để tăng tính chân thực.
      `}
    `;

    const parts: Part[] = [{ text: systemPrompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }];
    
    if (optMask) parts.push({ text: "MASK (White = Target area, Black = Protect):" }, { inlineData: { mimeType: "image/png", data: optMask.split(',')[1] } });
    if (optComposite) parts.push({ text: "VISUAL GUIDE (Context overlay):" }, { inlineData: { mimeType: "image/png", data: optComposite.split(',')[1] } });
    
    if (optRefImage) {
      parts.push({ text: "PRIMARY BRAND LOGO/ASSET:" });
      parts.push({ inlineData: { mimeType: "image/png", data: optRefImage.split(',')[1] } });
    }

    if (optContextImages.length > 0) {
      parts.push({ text: "BRAND IDENTITY BUNDLE (Style & Elements references):" });
      optContextImages.forEach((img) => {
        parts.push({ text: `REFERENCE: ${img.label}` });
        parts.push({ inlineData: { mimeType: "image/png", data: img.data.split(',')[1] } });
      });
    }

    const sharedSafety = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
    ];

    // UPGRADE: Gemini 3 Pro Image is PRIMARY.
    const performPro = () => ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: { parts },
        config: { imageConfig: { aspectRatio: ratio as any, imageSize: "1K" }, safetySettings: sharedSafety }
    });

    const performFlashBackup = () => ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts },
        config: { imageConfig: { aspectRatio: ratio as any }, safetySettings: sharedSafety }
    });

    const response = await callWithRetry<GenerateContentResponse>(
      performPro, 
      5, 
      2000, 
      'Gemini-3-Pro-Edit', 
      [performFlashBackup] 
    );

    let image: string | undefined;
    let text = "";
    response.candidates?.[0]?.content?.parts?.forEach(part => {
      if (part.inlineData) image = `data:image/png;base64,${part.inlineData.data}`;
      else if (part.text) text += part.text;
    });
    
    if (!image) throw new Error("Mô hình không trả về ảnh chỉnh sửa.");
    return { image, text: text.trim() || "Chỉnh sửa hoàn tất (Pro Engine)." };
  });
};
