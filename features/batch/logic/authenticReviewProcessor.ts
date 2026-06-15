import { BatchJob, ProcessStatus } from '../../../types';
import { getAI, callWithRetry } from '../../../lib/gemini';
import { fileToBase64, optimizeImagePayload } from '../../../lib/utils';
import { executeManagedTask, getExecutionTiers } from '../../../lib/tieredExecutor';
import { MODELS } from '../../../config/models';

export const processAuthenticReview = async (
  job: BatchJob,
  config: any,
  updateStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
  let reviewText: string | undefined = job.extractedText;
  let checkinPhotos: string[] = job.checkinPhotos || [];
  let photoPrompts: string[] = job.state?.photoPrompts || [];

  try {
    let optImage = '';
    if (job.originalUrl) {
      optImage = await optimizeImagePayload(job.originalUrl, 'generation');
    }

    if (!reviewText || photoPrompts.length === 0) {
      updateStatus(job.id, 'analyzing_context', { progressMessage: "Analyzing image for authentic review..." });

      const targetAudience = config.brandVibe || "Gen Z (Trẻ trung, trendy)";
      const reviewTone = config.packType || "Khen ngợi & Góp ý nhẹ";
      const highlightPoint = config.targetText || "Không có điểm nhấn cụ thể, tự do sáng tạo.";

      const systemInstruction = `Bạn là một người trải nghiệm thực tế (reviewer) chuyên nghiệp nhưng có phong cách viết rất đời thường, trẻ trung và chân thật.
Nhiệm vụ của bạn là xem xét hình ảnh/video của một không gian (quán cafe, homestay, studio, v.v.) và viết một bài review như một người bạn đang kể chuyện cho bạn bè nghe, ĐỒNG THỜI đề xuất 2 góc chụp ảnh "check-in" để làm bằng chứng cho bài review.

YÊU CẦU QUAN TRỌNG:
1. "Đôi mắt" tinh tế: Đừng chỉ khen "đẹp". Hãy bóc tách các chi tiết nhỏ mà chỉ người thực sự ở đó mới để ý:
   - Ánh sáng (ví dụ: "Góc này nắng chiều đổ vào cực chill, lên hình không cần chỉnh filter.")
   - Tiện ích (ví dụ: "Ổ cắm điện bố trí ngay dưới chân bàn, rất hiểu ý mấy đứa hay mang laptop đi làm việc.")
   - Vệ sinh/Không gian (ví dụ: "Sàn nhà gỗ lau kỹ, đi chân trần thấy mát rượi, không bị rít.")
2. Đối tượng hướng đến (Target Audience): ${targetAudience} - Hãy dùng ngôn từ và cách xưng hô phù hợp với nhóm đối tượng này.
3. Tone giọng (Review Tone): ${reviewTone} - Hãy điều chỉnh mức độ khen/chê cho phù hợp với tone giọng này.
4. Điểm nhấn bắt buộc (Highlight): ${highlightPoint} - Bắt buộc phải nhắc đến hoặc xoay quanh chi tiết này trong bài review.
5. Cấu trúc "Khen - Chê - Mẹo" (Praise - Critique - Tip):
   - Khen: Cảm xúc tích cực, điểm nhấn ấn tượng nhất.
   - Chê: Nhận xét thực tế về một điểm trừ nhỏ (ví dụ: "Hơi ồn vào giờ cao điểm", "Chỗ để xe hơi hẹp"). Điều này làm bài review đáng tin hơn.
   - Mẹo: Lời khuyên hữu ích cho người đến sau (ví dụ: "Nên đi tầm 3h chiều để có nắng đẹp", "Nhớ thử món trà vải ở đây").
6. Ngôn từ: Sử dụng ngôn ngữ mạng xã hội, gần gũi, giàu cảm xúc (ví dụ: "vãi", "cực kỳ", "đỉnh", "trộm vía", "thực sự", "mê chữ ê kéo dài").
7. Định dạng: Ngắn gọn, dễ đọc, xuống dòng hợp lý, sử dụng emoji phù hợp nhưng không lạm dụng.
8. Bằng chứng Check-in: Dựa vào bài review, hãy tạo ra 4 prompt (bằng tiếng Anh) để AI vẽ ảnh (Image Generation) tạo ra các bức ảnh check-in thực tế. Các bức ảnh này phải trông như được chụp bằng điện thoại (phone photo, casual, POV, instagram story style). Ví dụ: "POV shot holding a matcha latte in a cozy cafe, natural sunlight, shot on iPhone, instagram story style".

ĐẦU RA MONG MUỐN (JSON FORMAT):
{
  "reviewText": "Nội dung bài review hoàn chỉnh...",
  "photoPrompts": [
    "prompt 1...",
    "prompt 2...",
    "prompt 3...",
    "prompt 4..."
  ]
}`;

      const prompt = `Hãy phân tích không gian trong hình ảnh này và viết một bài review chân thật theo đúng phong cách đã hướng dẫn. Chú ý vào các chi tiết nhỏ về ánh sáng, tiện ích, không gian, cảm giác mang lại và đối tượng phù hợp nhất.`;

      const parts: any[] = [{ text: prompt }];

      if (optImage) {
        parts.push({
          inlineData: {
            data: optImage.split(',')[1],
            mimeType: "image/png"
          }
        });
      }

      updateStatus(job.id, 'drafting_content', { progressMessage: "V1 Agent: Drafting Authentic Review..." });

      const resultJson = await executeManagedTask('COPYWRITING_FAST', async () => {
        const ai = getAI();
        const response = await callWithRetry<any>(
          () => ai.models.generateContent({
            model: MODELS.TEXT_PRIMARY,
            contents: [{ role: 'user', parts }],
            config: {
              systemInstruction,
              temperature: 0.7,
              responseMimeType: "application/json",
            }
          }),
          2, 1000, 'Review-Draft',
          [() => ai.models.generateContent({
            model: MODELS.TEXT_FAST,
            contents: [{ role: 'user', parts }],
            config: {
              systemInstruction,
              temperature: 0.7,
              responseMimeType: "application/json",
            }
          })]
        );

        const text = response.text;
        if (!text) throw new Error("Failed to generate review text.");
        return JSON.parse(text);
      });

      reviewText = resultJson.reviewText;
      photoPrompts = resultJson.photoPrompts || [];
      
      // Save checkpoint
      updateStatus(job.id, 'drafting_content', { 
        extractedText: reviewText,
        state: { ...job.state, photoPrompts }
      });
    }

    updateStatus(job.id, 'rendering_visuals', { progressMessage: `V2 Agent: Rendering Check-in Photos (${checkinPhotos.length}/${photoPrompts.length})...` });

    const tiers = getExecutionTiers();
    const BATCH_SIZE = tiers.BATCH.concurrency;
    const delay = tiers.BATCH.tierDelay;

    // Batch processing for photo prompts
    const startIndex = checkinPhotos.length;
    for (let i = startIndex; i < photoPrompts.length; i += BATCH_SIZE) {
        const batch = photoPrompts.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (pPrompt, idx) => {
            const globalIdx = i + idx;
            return executeManagedTask('IMAGE_GEN_BATCH', async () => {
                const ai = getAI();
                const imgParts: any[] = [];
                if (optImage) {
                    imgParts.push({
                        inlineData: {
                            data: optImage.split(',')[1],
                            mimeType: "image/png"
                        }
                    });
                }
                imgParts.push({ text: `Generate a new photo from a different angle or perspective based on the provided reference image of the location. Description: ${pPrompt}. It is CRITICAL that the interior design, colors, lighting vibe, and architectural style match the reference image exactly so it looks like the exact same place.` });

                const imgResponse = await callWithRetry<any>(
                    () => ai.models.generateContent({
                        model: MODELS.IMAGE_PRIMARY,
                        contents: { parts: imgParts },
                        config: { imageConfig: { aspectRatio: "3:4" } }
                    }),
                    2, 1000, 'Review-Photo',
                    [() => ai.models.generateContent({
                        model: MODELS.IMAGE_FAST,
                        contents: { parts: imgParts },
                        config: { imageConfig: { aspectRatio: "3:4" } }
                    })]
                );
                
                let img: string | undefined;
                if (imgResponse.generatedImages?.[0]?.image?.imageBytes) {
                    img = `data:image/png;base64,${imgResponse.generatedImages[0].image.imageBytes}`;
                } else {
                    imgResponse.candidates?.[0]?.content?.parts?.forEach((part: any) => {
                        if (part.inlineData) img = `data:image/png;base64,${part.inlineData.data}`;
                    });
                }
                return img;
            });
        });

        const results = await Promise.all(batchPromises);
        results.forEach(img => {
            if (img) checkinPhotos.push(img);
        });

        updateStatus(job.id, 'rendering_visuals', { 
            progressMessage: `V2 Agent: Rendering Check-in Photos (${Math.min(i + BATCH_SIZE, photoPrompts.length)}/${photoPrompts.length})...`,
            checkinPhotos: checkinPhotos
        });

        if (i + BATCH_SIZE < photoPrompts.length) {
            await new Promise(r => setTimeout(r, delay));
        }
    }

    updateStatus(job.id, 'completed', {
      progressMessage: "Review & Check-in Photos Ready!",
      extractedText: reviewText,
      checkinPhotos: checkinPhotos,
      resultUrl: job.originalUrl
    });

  } catch (error: any) {
    console.error("Authentic Review Error:", error);
    updateStatus(job.id, 'failed', { 
      error: error.message || "Failed to generate authentic review",
      extractedText: reviewText,
      checkinPhotos: checkinPhotos,
      state: { ...job.state, photoPrompts }
    });
  }
};

import { globalAgentRegistry } from './registry';

globalAgentRegistry.register({
    id: 'authentic-review',
    name: 'Authentic Review',
    description: 'Tạo review chân thực và ảnh check-in tự nhiên.',
    icon: 'Star',
    category: 'Marketing',
    priority: 20,
    processFn: processAuthenticReview
});

