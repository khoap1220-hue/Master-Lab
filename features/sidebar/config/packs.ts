
/**
 * Standardized branding and asset packages used for smart suggestions.
 */
export const BRANDING_PACKS = [
  { title: 'Identity Basic', items: ['Logo Chính', 'Bảng màu', 'Font chữ', 'Brand Guideline Mini'] },
  { title: 'Stationery', items: ['Danh thiếp', 'Phong bì thư', 'Tiêu đề thư', 'Chữ ký Email'] },
  { title: 'Marketing POSM', items: ['Standee', 'Poster', 'Flyer', 'Banner FB/Google'] },
  { title: 'Corporate Identity', items: ['Thẻ nhân viên', 'Đồng phục', 'Huy hiệu', 'Túi giấy'] }
];

export const CATEGORY_PACKS: Record<string, any[]> = {
  'Branding': BRANDING_PACKS,
  'Packaging': [
    { title: 'Primary Packaging', items: ['Vỏ hộp (Box)', 'Nhãn chai (Label)', 'Túi giấy (Bag)', 'Tem niêm phong'] },
    { title: 'Unboxing Experience', items: ['Thư cảm ơn', 'Giấy lót (Tissue Paper)', 'Sticker trang trí', 'Hướng dẫn sử dụng'] },
    { title: 'Shipping & Bulk', items: ['Thùng Carton 3 lớp', 'Băng keo thương hiệu', 'Màng co'] }
  ],
  'Product Design': [
    { title: 'R&D Concept', items: ['Bản vẽ 2D (Blueprint)', 'Sơ đồ UX/Ergonomic', 'Mô phỏng vật liệu (CMF)', 'Phối cảnh 360 độ'] }
  ],
  'Floor Plan': [
    { title: 'Technical Drawings', items: ['Mặt bằng bố trí nội thất', 'Sơ đồ điện nước (ME)', 'Mặt đứng chi tiết', 'Mặt cắt kỹ thuật'] },
    { title: 'Interior Styling', items: ['Moodboard vật liệu', 'Danh sách đồ nội thất (BOQ)', 'Phối cảnh 3D cắt lớp (Cutaway)'] }
  ],
  'Signage': [
    { title: 'Mockup & Render', items: ['Phối cảnh Ngày', 'Phối cảnh Đêm (Đèn LED)', 'Góc nhìn người đi đường'] },
    { title: 'Production Files', items: ['Bản vẽ kỹ thuật thi công', 'File Vector cắt CNC', 'Spec vật liệu chi tiết'] }
  ],
  'Fashion': [
    { title: 'Collection Development', items: ['Moodboard', 'Fashion Sketch (Phác thảo)', 'Technical Flat (Bản vẽ phẳng)', 'Pattern (Rập)'] },
    { title: 'Production Specs', items: ['Tech Pack', 'Bảng thông số size (Size Chart)', 'Định mức vải (Fabric Consumption)'] }
  ],
  'Logo Design': [
    { title: 'Identity System', items: ['Logo Chính (Primary)', 'Logo Phụ (Secondary)', 'Biểu tượng (Favicon/Icon)', 'Wordmark'] },
    { title: 'Guidelines', items: ['Quy chuẩn lưới (Grid System)', 'Vùng an toàn (Clearspace)', 'Bảng màu (Color Palette)', 'Font hệ thống'] }
  ],
  'Print Design': [
    { title: 'Commercial Print', items: ['Brochure (Gấp 3)', 'Flyer (Tờ rơi)', 'Catalogue', 'Voucher/Coupon'] },
    { title: 'Publication', items: ['Bìa sách', 'Tạp chí', 'Menu nhà hàng', 'Photobook'] }
  ],
  'Real Estate': [
    { title: 'Visual Staging', items: ['Phối cảnh nội thất (Render)', 'Phối cảnh ngoại thất', 'Ảnh 360 Panorama', 'Virtual Tour Keyframes'] },
    { title: 'Sales Kit', items: ['Mặt bằng bán hàng', 'Brochure dự án', 'Flyer giới thiệu', 'Bảng vật liệu (Material Board)'] }
  ],
  'Multimedia': [
    { title: 'Video Production', items: ['Storyboard (Phân cảnh)', 'Moodboard điện ảnh', 'Character Sheet', 'Shot List'] },
    { title: 'Social Content', items: ['Thumbnail Youtube', 'Story Board (TikTok)', 'Carousel Instagram', 'Key Visual'] }
  ],
  'Product Document': [
    { title: 'Hồ sơ pháp lý', items: ['Giấy phép lưu hành', 'Công bố chất lượng', 'Chứng chỉ ISO', 'Kiểm định an toàn'] },
    { title: 'Hồ sơ thương mại', items: ['Bảng giá chi tiết', 'Chính sách bảo hành', 'Hợp đồng mẫu', 'Catalogue kỹ thuật'] }
  ],
  'UX/UI Design': [
    { title: 'System Architecture', items: ['Sitemap (Cấu trúc tin)', 'User Flow (Luồng nghiệp vụ)', 'Database Schema (Sơ đồ dữ liệu)', 'Permission Matrix (Ma trận phân quyền)'] },
    { title: 'Core UI', items: ['Dashboard Screen', 'List View (Data Grid)', 'Detail View (Form)', 'Settings/Profile'] },
    { title: 'Design System', items: ['Color Tokens', 'Typography Scale', 'Component Library (Button, Input)', 'Icon Set'] }
  ]
};
