
import { MemoryInsight, ScenarioCategory, SmartAction, GroundingSource } from '../../types';
import * as orchestratorService from '../orchestratorService';

export const executeProjectPlanningFlow = async (
  text: string,
  memory: MemoryInsight,
  category: ScenarioCategory
) => {
    let researchResult: {
        visualPrompt: string;
        sources: GroundingSource[];
        audienceProfile?: string;
        structuredBrief?: string;
    } = { visualPrompt: text, sources: [] };

    // --- ROUTING LOGIC FOR STRATEGIC PLANNING ---
    if (category === 'Signage') {
         const plan = await orchestratorService.planSignageProject(text, "Theo yêu cầu", "Tự động phân tích ảnh", null); 
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    } 
    else if (category === 'Packaging') {
         const plan = await orchestratorService.planPackagingProject(text, "Tự động xác định");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Floor Plan') {
         const plan = await orchestratorService.planInteriorProject(text, "2D Technical");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Real Estate') {
         const plan = await orchestratorService.planRealEstateRenovation(text, "Căn hộ", "Hiện đại");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Fashion') {
         const plan = await orchestratorService.planFashionCollection(text, "Ready-to-wear");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Marketing & Ads') {
         const plan = await orchestratorService.planMarketingCampaign(text, "Đa kênh");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Multimedia') {
         const plan = await orchestratorService.planMultimediaShoot(text, "16:9", "Cinematic");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Logo Design') {
         const plan = await orchestratorService.planLogoDesign(text, "Pictorial Mark", []);
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Print Design') {
         const plan = await orchestratorService.planPrintDesign(text, "A4/Tùy chỉnh", []);
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Style Transfer') {
         const plan = await orchestratorService.planStyleTransfer(text, "Giữ cấu trúc");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'UX/UI Design') {
         // NEW ROUTING FOR MULTI-DISCIPLINARY AGENT
         const plan = await orchestratorService.planProductUX(text, "System/App", "User");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Interior Design') {
         const plan = await orchestratorService.planInteriorProject(text, "3D Render");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Character Design') {
         const plan = await orchestratorService.planCharacterDesign(text, "Fantasy");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'App Icon Design') {
         const plan = await orchestratorService.planAppIconDesign(text, "Glassmorphism");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === '3D Rendering') {
         const plan = await orchestratorService.plan3DRender(text, "Product Shot");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Vector Art') {
         const plan = await orchestratorService.planVectorArt(text, "Flat Illustration");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else if (category === 'Cinematic Video') {
         const plan = await orchestratorService.planCinematicVideo(text, "16:9");
         researchResult = { visualPrompt: plan.visualPrompt, sources: [], structuredBrief: plan.structuredBrief };
    }
    else {
         // Default Product/Branding Research
         const research = await orchestratorService.researchProductTrends(text, memory, category);
         researchResult = research;
    }

    const isDocsOnly = category === 'Product Document';
    const executionPrompt = researchResult.structuredBrief 
       ? `${researchResult.structuredBrief}\n\n---\n**TÓM TẮT ĐỂ VẼ (VISUAL SUMMARY):**\n${researchResult.visualPrompt}`
       : researchResult.visualPrompt;

    let actionLabel = 'PHÊ DUYỆT & RENDER 🎨';
    if (category === 'Signage') actionLabel = 'RENDER MOCKUP THỰC TẾ 🏪';
    else if (category === 'Floor Plan') actionLabel = 'XUẤT BẢN VẼ MẶT BẰNG 📐';
    else if (category === 'Real Estate') actionLabel = 'DỰNG PHỐI CẢNH (STAGING) 🏠';
    else if (category === 'Packaging') actionLabel = 'RENDER NGUYÊN MẪU 📦';
    else if (category === 'Fashion') actionLabel = 'RENDER BỘ SƯU TẬP 👗';
    else if (category === 'Logo Design') actionLabel = 'VẼ LOGO (VECTOR STYLE) 💠';
    else if (category === 'Print Design') actionLabel = 'DÀN TRANG (LAYOUT) 🖨️';
    else if (category === 'Multimedia') actionLabel = 'TẠO KEY VISUAL 🎬';
    else if (category === 'Style Transfer') actionLabel = 'BIẾN ĐỔI PHONG CÁCH 🪄';
    else if (category === 'UX/UI Design') actionLabel = 'THIẾT KẾ UI SYSTEM 🖥️';
    else if (category === 'Interior Design') actionLabel = 'RENDER NỘI THẤT 🛋️';
    else if (category === 'Character Design') actionLabel = 'VẼ NHÂN VẬT 👤';
    else if (category === 'App Icon Design') actionLabel = 'RENDER ICON 🖼️';
    else if (category === '3D Rendering') actionLabel = 'RENDER 3D 🧊';
    else if (category === 'Vector Art') actionLabel = 'VẼ VECTOR ✒️';
    else if (category === 'Cinematic Video') actionLabel = 'TẠO CẢNH QUAY 🎥';

    return {
        text: isDocsOnly 
            ? "Đã hoàn tất soạn thảo tài liệu kỹ thuật. Bạn có thể sao chép nội dung bên dưới." 
            : "Đã hoàn tất phân tích chiến lược. Vui lòng xem xét **Tài liệu Yêu cầu (Brief)** bên dưới trước khi tiến hành Render.",
        image: undefined, 
        sources: researchResult.sources,
        audienceProfile: researchResult.audienceProfile,
        structuredBrief: researchResult.structuredBrief,
        smartActions: [
            {
                id: 'approve_render',
                label: isDocsOnly ? 'MINH HỌA (RENDER)' : actionLabel,
                description: isDocsOnly ? 'Tạo ảnh minh họa cho tài liệu này' : 'Chấp thuận thiết kế và tạo hình ảnh',
                icon: isDocsOnly ? '🖼️' : '✅',
                prompt: `[EXECUTE_VISUAL]: ${executionPrompt}`, 
                type: 'primary'
            },
            {
                id: 'regenerate_brief',
                label: 'VIẾT LẠI NỘI DUNG 📝',
                description: 'Yêu cầu viết lại với văn phong khác',
                icon: '🔄',
                prompt: `Hãy viết lại tài liệu thiết kế cho "${text}" với phong cách chuyên sâu hơn.`,
                type: 'creative'
            }
        ] as SmartAction[]
    };
};
