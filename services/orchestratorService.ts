
import { MemoryInsight, ScenarioCategory } from '../types';
import * as signageOrchestrator from './orchestrator/signage';
import * as packagingOrchestrator from './orchestrator/packaging';
import * as interiorOrchestrator from './orchestrator/interior';
import * as fashionOrchestrator from './orchestrator/fashion';
import * as marketingOrchestrator from './orchestrator/marketing';
import * as logoOrchestrator from './orchestrator/logo';
import * as printOrchestrator from './orchestrator/print';
import * as realEstateOrchestrator from './orchestrator/realestate';
import * as multimediaOrchestrator from './orchestrator/multimedia';
import * as styleOrchestrator from './orchestrator/style';
import * as uxuiOrchestrator from './orchestrator/uxui';
import * as sopOrchestrator from './orchestrator/sop';
import * as characterOrchestrator from './orchestrator/character';
import * as appIconOrchestrator from './orchestrator/appicon';
import * as threedOrchestrator from './orchestrator/threed';
import * as vectorOrchestrator from './orchestrator/vector';
import * as cinematicOrchestrator from './orchestrator/cinematic';
import { researchProductTrends } from './orchestrator/research';

// Re-export specific modules for direct access if needed
export * from './orchestrator/analysis';
export * from './orchestrator/brand';
export * from './orchestrator/research';
export * from './orchestrator/reporting';
export * from './orchestrator/signage';
export * from './orchestrator/packaging';
export * from './orchestrator/interior';
export * from './orchestrator/fashion';
export * from './orchestrator/marketing';
export * from './orchestrator/logo';
export * from './orchestrator/print';
export * from './orchestrator/realestate';
export * from './orchestrator/multimedia';
export * from './orchestrator/style';
export * from './orchestrator/uxui'; // NEW RE-EXPORT
export * from './orchestrator/character';
export * from './orchestrator/appicon';
export * from './orchestrator/threed';
export * from './orchestrator/vector';
export * from './orchestrator/cinematic';
export * from './orchestrator/context'; 

/**
 * CENTRALIZED ROUTER FOR TECHNICAL SPECS
 * Routes the request to the correct specialist orchestrator based on category.
 */
export const generateTechnicalSpecs = async (
  category: ScenarioCategory,
  designContext: string,
  memory: MemoryInsight
): Promise<{ title: string; content: string }> => {
  
  if (category === 'Signage') {
    const specs = await signageOrchestrator.generateSignageSpecs(designContext, memory);
    return { title: "HỒ SƠ KỸ THUẬT THI CÔNG BẢNG HIỆU", content: specs };
  }
  
  if (category === 'Packaging') {
    const specs = await packagingOrchestrator.generatePackagingSpecs(designContext);
    return { title: "QUY CÁCH IN ẤN & SẢN XUẤT BAO BÌ", content: specs };
  }
  
  if (category === 'Floor Plan') {
    const specs = await interiorOrchestrator.generateInteriorSpecs(designContext);
    return { title: "BẢNG CHỈ DẪN KỸ THUẬT THI CÔNG NỘI THẤT", content: specs };
  }

  if (category === 'Real Estate') {
    const specs = await realEstateOrchestrator.generateFitOutSpecs(designContext);
    return { title: "BẢNG TIÊU CHUẨN HOÀN THIỆN (FIT-OUT)", content: specs };
  }

  if (category === 'Fashion') {
    const specs = await fashionOrchestrator.generateTechPack(designContext);
    return { title: "HỒ SƠ TECH PACK & ĐỊNH MỨC NGUYÊN LIỆU", content: specs };
  }

  if (category === 'Marketing & Ads') {
    const specs = await marketingOrchestrator.generateMarketingSpecs(designContext);
    return { title: "KẾ HOẠCH NỘI DUNG & QUẢNG CÁO", content: specs };
  }

  if (category === 'Multimedia') {
    const specs = await multimediaOrchestrator.generateShootingScript(designContext);
    return { title: "KỊCH BẢN QUAY (SHOT LIST)", content: specs };
  }

  if (category === 'Logo Design') {
    const specs = await logoOrchestrator.generateLogoSpecs(designContext);
    return { title: "QUY CHUẨN SỬ DỤNG LOGO (GUIDELINES MINI)", content: specs };
  }

  if (category === 'Print Design') {
    const specs = await printOrchestrator.generatePrintSpecs(designContext);
    return { title: "PHIẾU YÊU CẦU IN ẤN & GIA CÔNG (PRE-PRESS)", content: specs };
  }

  if (category === 'UX/UI Design') {
    const specs = await uxuiOrchestrator.generateUXUISpecs(designContext);
    return { title: "HỒ SƠ ĐẶC TẢ TRẢI NGHIỆM NGƯỜI DÙNG (UX/UI)", content: specs };
  }

  if (category === 'Style Transfer') {
    const specs = await styleOrchestrator.generateStyleSpecs(designContext);
    return { title: "HỒ SƠ ĐẶC TẢ PHONG CÁCH NGHỆ THUẬT", content: specs };
  }

  if (category === 'SOP Management') {
    const specs = await sopOrchestrator.generateSOPSpecs(designContext);
    return { title: "TÀI LIỆU QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP)", content: specs };
  }

  if (category === 'Interior Design') {
    const specs = await interiorOrchestrator.generateInteriorSpecs(designContext);
    return { title: "BẢNG CHỈ DẪN KỸ THUẬT THI CÔNG NỘI THẤT", content: specs };
  }

  if (category === 'Character Design') {
    // Re-using research for now or generic specs
    return { title: "HỒ SƠ THIẾT KẾ NHÂN VẬT", content: "Đã lập hồ sơ thiết kế nhân vật chi tiết." };
  }

  if (category === 'App Icon Design') {
    return { title: "QUY CHUẨN THIẾT KẾ APP ICON", content: "Đã lập quy chuẩn thiết kế icon ứng dụng." };
  }

  if (category === '3D Rendering') {
    return { title: "THÔNG SỐ RENDER 3D CHUYÊN NGHIỆP", content: "Đã lập thông số render 3D chi tiết." };
  }

  if (category === 'Vector Art') {
    return { title: "QUY CÁCH ĐỒ HỌA VECTOR", content: "Đã lập quy cách đồ họa vector." };
  }

  if (category === 'Cinematic Video') {
    const specs = await cinematicOrchestrator.planCinematicVideo(designContext, "16:9");
    return { title: "KỊCH BẢN QUAY ĐIỆN ẢNH", content: specs.structuredBrief || "Đã lập kịch bản quay." };
  }

  if (category === 'Product Design' || category === 'Product Document') {
    const research = await researchProductTrends(designContext, memory, category);
    return { 
      title: category === 'Product Document' ? "HỒ SƠ ĐẶC TẢ SẢN PHẨM (PRD/FRD)" : "HỒ SƠ THIẾT KẾ SẢN PHẨM CHI TIẾT", 
      content: research.structuredBrief || "Đã lập hồ sơ kỹ thuật sản phẩm." 
    };
  }

  if (category === 'E-commerce') {
    return { title: "HƯỚNG DẪN CHỤP ẢNH E-COMMERCE", content: "Đã lập hướng dẫn chụp ảnh và xử lý hình ảnh sản phẩm." };
  }

  if (category === 'Social Media') {
    return { title: "KẾ HOẠCH NỘI DUNG SOCIAL MEDIA", content: "Đã lập kế hoạch nội dung và định hướng hình ảnh cho mạng xã hội." };
  }

  if (category === 'Event & Wedding') {
    return { title: "KẾ HOẠCH TỔ CHỨC SỰ KIỆN & CƯỚI HỎI", content: "Đã lập kế hoạch tổ chức sự kiện và danh sách hạng mục thiết kế." };
  }

  if (category === 'Food & Beverage') {
    return { title: "CONCEPT CHỤP ẢNH MÓN ĂN (FOOD STYLING)", content: "Đã lập concept chụp ảnh món ăn và hướng dẫn food styling." };
  }

  if (category === 'Enterprise') {
    return { title: "HƯỚNG DẪN THIẾT KẾ TÀI LIỆU DOANH NGHIỆP", content: "Đã lập hướng dẫn thiết kế tài liệu doanh nghiệp và quy chuẩn thương hiệu." };
  }

  // Fallback
  return { 
    title: "THÔNG SỐ KỸ THUẬT", 
    content: "Đã ghi nhận yêu cầu kỹ thuật. Vui lòng tham khảo bộ phận sản xuất." 
  };
};
