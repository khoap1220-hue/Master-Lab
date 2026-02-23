
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
import * as uxuiOrchestrator from './orchestrator/uxui'; // NEW IMPORT

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

  // Fallback
  return { 
    title: "THÔNG SỐ KỸ THUẬT", 
    content: "Đã ghi nhận yêu cầu kỹ thuật. Vui lòng tham khảo bộ phận sản xuất." 
  };
};
