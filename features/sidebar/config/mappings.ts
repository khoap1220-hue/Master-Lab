
import { ScenarioCategory } from '../../../types';

export interface CategoryConfigDef {
  title: string;
  descLabel: string;
  placeholder: string;
  assetLabel: string;
  scaleLabel: string;
  actionBtn: string;
  variantBtn: string | null;
  icon: string;
  contextLabel?: string;
  contextOptions?: string[];
  injectors: string[];
  deliverablesLabel?: string;
  deliverablesPlaceholder?: string;
  formatOptions?: { label: string, desc: string }[];
  techniqueOptions?: { label: string, group: string, desc: string }[];
  quickStarters?: string[]; // NEW: Quick prompt suggestions
}

export const DEFAULT_CONFIG: CategoryConfigDef = {
  title: 'Creative Studio',
  descLabel: 'Mô tả yêu cầu',
  placeholder: 'Nhập yêu cầu của bạn...',
  assetLabel: 'Ảnh gốc',
  scaleLabel: 'Quy mô',
  actionBtn: 'Thực hiện',
  variantBtn: null,
  icon: '✨',
  injectors: [],
  quickStarters: ['Xóa vật thể thừa', 'Thay nền trời xanh', 'Làm nét ảnh mờ', 'Biến thành tranh vẽ']
};

// --- CONFIGURATION DICTIONARY (Tách biệt từng danh mục) ---
export const CONFIG_MAP: Partial<Record<ScenarioCategory, CategoryConfigDef>> = {
  'Signage': {
    title: 'Chuyên gia Bảng hiệu & Mặt tiền',
    descLabel: 'Nội dung & Yêu cầu kỹ thuật',
    placeholder: 'Nội dung trên bảng: "Tên Shop + Slogan + SĐT".\nMàu sắc mong muốn: "Nền đỏ, chữ vàng".\nYêu cầu đặc biệt: "Cần hộp đèn tròn vẫy, LED sáng chân chữ".',
    assetLabel: 'Ảnh hiện trạng mặt tiền',
    scaleLabel: 'Số phương án Mockup',
    actionBtn: 'Lên thiết kế & Spec thi công',
    variantBtn: null,
    icon: '🏪',
    contextLabel: 'Vật liệu thi công (Material)',
    contextOptions: ['Alu Chữ Nổi (Cao cấp)', 'Hộp đèn Mica hút nổi', 'Bạt Hiflex (Tiết kiệm)', 'Đèn LED Neon Sign', 'Tôn sóng (Retro)', 'Gỗ thông Pallet'],
    injectors: [
      'LED Module', 'Chữ Inox Vàng', 'Mica Hút Nổi', 
      'Đèn Pha Chiếu', 'Biển Vẫy Tròn', 'Viền LED Chạy',
      'Sơn Giả Cổ'
    ],
    deliverablesLabel: 'Thông tin bổ sung',
    deliverablesPlaceholder: 'Ghi rõ: Chiều rộng mặt tiền (m), Có cần thêm SĐT/Zalo không?...',
    quickStarters: ['Thiết kế bảng hiệu Spa sang trọng', 'Làm biển vẫy Cafe Neon', 'Mockup bảng Alu chữ nổi', 'Cải tạo mặt tiền Shop quần áo']
  },
  'Floor Plan': {
    title: 'Kiến Trúc Sư Quy Hoạch',
    descLabel: 'Thông số không gian & Yêu cầu',
    placeholder: 'Mô tả chi tiết mặt bằng...\nVD: "Căn hộ 2 phòng ngủ, 80m2. Phòng khách liền bếp. Phong cách Japandi tối giản. Yêu cầu có bàn đảo bếp và khu làm việc riêng."',
    assetLabel: 'Sơ đồ hiện trạng / Kích thước đất',
    scaleLabel: 'Số phương án bố trí',
    actionBtn: 'Quy Hoạch Mặt Bằng',
    variantBtn: 'Đổi Style Nội Thất',
    icon: '📐',
    contextLabel: 'Kiểu hiển thị (View Mode)',
    contextOptions: ['2D Technical CAD (Bản vẽ kỹ thuật)', '3D Top-down Render (Đổ màu)', '3D Cutaway (Cắt lớp)', 'Blueprint Sketch (Phác thảo)'],
    injectors: [
      'AutoCAD Style', 'Watercolor Render', 'Realistic Lighting', 
      'Blueprint Blue', 'Minimalist Black/White', 'Hand-drawn Ink',
      'Annotated Dimensions'
    ],
    deliverablesLabel: 'Hạng mục hồ sơ thiết kế',
    deliverablesPlaceholder: 'Ghi thêm: Chi tiết tủ bếp, Sơ đồ lát sàn...',
    quickStarters: ['Bố trí căn hộ 2PN 70m2', 'Mặt bằng văn phòng 20 người', 'Sơ đồ công năng nhà phố', 'Cải tạo phòng ngủ Master']
  },
  'Real Estate': {
    title: 'ArchViz & Virtual Staging AI',
    descLabel: 'Hiện trạng & Mong muốn cải tạo',
    placeholder: 'Mô tả cải tạo: "Biến phòng khách thô (sàn bê tông) thành phong cách Wabi-Sabi. Giữ nguyên cửa sổ, thay sàn gỗ óc chó, thêm sofa vải linen màu kem và cây xanh."',
    assetLabel: 'Ảnh hiện trạng (Thô/Cũ)',
    scaleLabel: 'Số phương án Render',
    actionBtn: 'Dựng Phối Cảnh (Staging)',
    variantBtn: 'Đổi Vật Liệu/Ánh Sáng',
    icon: '🏠',
    contextLabel: 'Loại không gian (Space Type)',
    contextOptions: [
        'Phòng Khách (Living Room)', 'Phòng Ngủ (Bedroom)', 'Bếp & Ăn (Kitchen)', 
        'Phòng Tắm (Bathroom)', 'Mặt tiền (Facade)', 'Sân vườn (Landscape)', 
        'Văn phòng (Office)', 'Showroom'
    ],
    injectors: [
      // Styles
      'Japandi', 'Modern Luxury', 'Indochine', 'Minimalist', 'Industrial', 'Scandinavian',
      // Lighting
      'Golden Hour (Giờ vàng)', 'Blue Hour (Chạng vạng)', 'Natural Sunlight (Nắng tự nhiên)', 'Warm Interior Light (Đèn ấm)',
      // Materials
      'Marble Floor', 'Herringbone Wood', 'Polished Concrete', 'Velvet Fabric'
    ],
    deliverablesLabel: 'Yêu cầu hoàn thiện (Fit-out)',
    deliverablesPlaceholder: 'VD: Loại gỗ sàn, Mã màu sơn tường, Thương hiệu thiết bị...',
    quickStarters: ['Staging phòng khách Japandi', 'Cải tạo bếp hiện đại', 'Render phòng ngủ luxury', 'Sân vườn nhiệt đới']
  },
  'Fashion': {
    title: 'Nhà Thiết Kế Thời Trang',
    descLabel: 'Ý tưởng & Form dáng',
    placeholder: 'Mô tả bộ sưu tập...\nVD: "Áo dài cách tân, chất liệu lụa tơ tằm, tay phồng nhẹ. Họa tiết hoa sen thêu tay. Màu pastel nhẹ nhàng."',
    assetLabel: 'Phác thảo / Moodboard',
    scaleLabel: 'Số lượng mẫu (Look)',
    actionBtn: 'Thiết kế Collection',
    variantBtn: 'Đổi Chất Liệu',
    icon: '👗',
    contextLabel: 'Loại trang phục (Category)',
    contextOptions: ['Haute Couture (Cao cấp)', 'Ready-to-wear (Ứng dụng)', 'Streetwear (Đường phố)', 'Activewear (Thể thao)', 'Uniform (Đồng phục)'],
    injectors: [
      'Silk Satin', 'Denim Wash', 'French Lace', 
      'Velvet Texture', 'Digital Print', 'Hand Embroidery',
      'Draping Effect'
    ],
    deliverablesLabel: 'Yêu cầu kỹ thuật may',
    deliverablesPlaceholder: 'Ghi rõ: Loại chỉ, Kỹ thuật viền, Nút cài...',
    quickStarters: ['BST Áo dài cách tân', 'Streetwear GenZ', 'Váy dạ hội lụa đỏ', 'Đồng phục công sở hiện đại']
  },
  'Logo Design': {
    title: 'Kiến Trúc Sư Nhận Diện (Identity Architect)',
    descLabel: 'Tên thương hiệu & Ý nghĩa',
    placeholder: 'Tên Brand: "ZENITH"\nLĩnh vực: Bất động sản cao cấp.\nÝ nghĩa: Đỉnh cao, Vững chãi.\nMong muốn: Biểu tượng ngọn núi cách điệu hình chữ Z.',
    assetLabel: 'Phác thảo tay / Ý tưởng',
    scaleLabel: 'Số lượng Concept',
    actionBtn: 'Thiết kế Logo System',
    variantBtn: 'Phát triển Biến thể',
    icon: '💠',
    contextLabel: 'Phong cách biểu tượng (Logotype)',
    contextOptions: ['Pictorial Mark (Hình tượng)', 'Wordmark (Chữ cách điệu)', 'Monogram (Chữ cái lồng)', 'Abstract (Trừu tượng)', 'Mascot (Linh vật)', 'Emblem (Huy hiệu)'],
    injectors: [
      'Minimalist Line Art', 'Golden Ratio Grid', 'Negative Space', 
      'Geometric Solid', 'Gradient Mesh', 'Hand-drawn Organic',
      'Luxury Serif'
    ],
    deliverablesLabel: 'Hạng mục bàn giao',
    deliverablesPlaceholder: 'VD: Logo âm bản, Logo đen trắng, Favicon...',
    quickStarters: ['Logo quán Cafe tối giản', 'Logo Bất động sản sang trọng', 'Rebrand lại logo cũ', 'Logo Shop thời trang']
  },
  'Print Design': {
    title: 'Chuyên gia In ấn & Xuất bản (Pre-press)',
    descLabel: 'Nội dung ấn phẩm',
    placeholder: 'Loại ấn phẩm: Menu Nhà hàng.\nNội dung: Danh sách món khai vị, món chính, đồ uống.\nPhong cách: Vintage, giấy Kraft nâu.',
    assetLabel: 'Nội dung text / Hình ảnh',
    scaleLabel: 'Số trang / Mặt',
    actionBtn: 'Dàn trang & Mockup',
    variantBtn: 'Đổi Chất liệu Giấy',
    icon: '🖨️',
    contextLabel: 'Quy cách thành phẩm (Format)',
    contextOptions: ['A4 (21x29.7cm)', 'A5 (14.8x21cm)', 'Danh thiếp (9x5.5cm)', 'Gấp 3 (Trifold)', 'Vuông (20x20cm)', 'Khổ lớn (Poster A2/A1)'],
    injectors: [
      'Gold Foil Stamp (Ép kim)', 'Spot UV (Phủ bóng)', 'Embossing (Dập nổi)', 
      'Die-cut Shape (Bế hình)', 'Kraft Paper Texture', 'Matte Lamination'
    ],
    deliverablesLabel: 'Yêu cầu kỹ thuật in',
    deliverablesPlaceholder: 'Ghi rõ: Chừa xén (Bleed), Hệ màu (CMYK/Pantone)...',
    quickStarters: ['Menu nhà hàng', 'Brochure gấp 3', 'Poster sự kiện', 'Namecard tối giản']
  },
  'Multimedia': {
    title: 'Đạo Diễn Hình Ảnh & Phim (Cinematography)',
    descLabel: 'Kịch bản & Bối cảnh',
    placeholder: 'Mô tả cảnh quay: "Cảnh chàng trai ngồi uống cafe dưới mưa tại Paris. Góc máy rộng, màu phim buồn (Blue tone). Ánh sáng Neon phản chiếu cửa kính."',
    assetLabel: 'Kịch bản thô / Storyboard tay',
    scaleLabel: 'Số Frame / Shot',
    actionBtn: 'Tạo Storyboard / Key Visual',
    variantBtn: 'Đổi Color Grading',
    icon: '🎬',
    contextLabel: 'Tỷ lệ khung hình (Aspect Ratio)',
    contextOptions: ['16:9 (Cinematic)', '9:16 (TikTok/Reels)', '2.35:1 (Anamorphic)', '4:3 (Vintage TV)', '1:1 (Social Post)'],
    injectors: [
      'Cyberpunk Neon', 'Vintage Kodak Film', 'Noir Black & White', 
      'Wes Anderson Symmetry', 'Ghibli Anime Style', 'Dreamy Bokeh'
    ],
    deliverablesLabel: 'Yêu cầu Shot List',
    deliverablesPlaceholder: 'VD: Cận cảnh (Close-up), Toàn cảnh (Wide shot), Flycam...',
    quickStarters: ['Cảnh quay Cinematic', 'Storyboard TVC', 'Phim hoạt hình Ghibli', 'Ảnh bìa Youtube']
  },
  'Style Transfer': {
    title: 'Phù Thủy Phong Cách (Style Alchemist)',
    descLabel: 'Mô tả đích đến',
    placeholder: 'Mô tả mong muốn: "Biến bức ảnh chụp điện thoại này thành tranh sơn dầu phong cách Van Gogh". Hoặc "Chuyển ảnh này thành style Anime Nhật Bản."',
    assetLabel: 'Ảnh gốc (Cấu trúc)',
    scaleLabel: 'Mức độ biến đổi (1-3)',
    actionBtn: 'Chuyển Đổi Phong Cách',
    variantBtn: 'Thử Style Khác',
    icon: '🪄',
    contextLabel: 'Chế độ chuyển đổi (Transfer Mode)',
    contextOptions: ['Giữ nguyên cấu trúc (Structure Keep)', 'Biến đổi tự do (Creative Flow)', 'Chỉ lấy màu (Color Only)', 'Chỉ lấy ánh sáng (Lighting Only)'],
    injectors: [
      'Oil Painting', 'Watercolor', '3D Pixar Render', 
      'Cyberpunk Digital Art', 'Pencil Sketch', 'Ukiyo-e'
    ],
    deliverablesLabel: 'Ghi chú thêm',
    deliverablesPlaceholder: 'VD: Giữ lại khuôn mặt, thay đổi quần áo...',
    quickStarters: ['Biến thành Anime', 'Tranh sơn dầu Van Gogh', 'Phác thảo chì (Sketch)', 'Cyberpunk Neon']
  },
  'Product Document': {
    title: 'Biên tập viên Kỹ thuật (Technical Writer)',
    descLabel: 'Tên sản phẩm & Yêu cầu',
    placeholder: 'Nhập tên sản phẩm...\nVD: "Máy lọc không khí thông minh", "Serum phục hồi da". Hệ thống sẽ tự động tổng hợp thông số và soạn thảo hồ sơ chuẩn.',
    assetLabel: 'Ảnh sản phẩm / Bản vẽ',
    scaleLabel: 'Độ chi tiết',
    actionBtn: 'Soạn thảo tài liệu',
    variantBtn: null,
    icon: '📝',
    contextLabel: 'Loại tài liệu (Doc Type)',
    contextOptions: ['Strategic Brief (FRD)', 'Technical Specs Sheet', 'User Manual (Hướng dẫn)', 'Marketing Brochure Copy'],
    injectors: ['ISO Standard', 'Military Spec (MIL-STD)', 'Consumer Grade', 'Medical Grade', 'Luxury Branding'],
    deliverablesLabel: 'Hạng mục bổ sung',
    deliverablesPlaceholder: 'VD: Cảnh báo an toàn, Chính sách bảo hành...',
    quickStarters: ['Viết PRD App Mobile', 'Thông số kỹ thuật Gadget', 'Hướng dẫn sử dụng Mỹ phẩm', 'Hồ sơ năng lực công ty']
  },
  'Product Design': {
    title: 'Kỹ Sư R&D & Trải Nghiệm Sản Phẩm',
    descLabel: 'Mục tiêu Sản phẩm & Bài toán UX',
    placeholder: 'Mô tả ý tưởng cốt lõi...\nVD: "Nước uống đóng chai Roma. Cần nhỏ gọn, dành cho dân chơi thể thao Pickleball, nhấn mạnh yếu tố sạch và công nghệ ion bạc."',
    assetLabel: 'Bản vẽ thô / Moodboard',
    scaleLabel: 'Số lượng Concept',
    actionBtn: 'Phát triển R&D & Kiểu dáng',
    variantBtn: 'Đổi CMF (Vật liệu)',
    icon: '⚙️',
    contextLabel: 'Phong cách Công nghiệp',
    contextOptions: ['Minimalist (Dieter Rams)', 'Bio-morphic (Zaha Hadid)', 'Industrial (Cyberpunk)', 'Retro-Futurism', 'Luxury & Craft'],
    injectors: [
      'Eco-Material', 'Carbon Fiber', 'Brushed Aluminum', 
      'Soft-touch Silicone', 'Modular Design', 'Ergonomic Grips',
      'Hidden Interface', 'Transparent Tech'
    ],
    deliverablesLabel: 'Hạng mục R&D cần lên chi tiết',
    deliverablesPlaceholder: 'Ghi thêm đối tượng (vd: Cho người già, Cho vận động viên)...',
    quickStarters: ['Thiết kế chai nước thể thao', 'Ghế văn phòng Ergonomic', 'Tai nghe Bluetooth trong suốt', 'Bao bì mỹ phẩm Eco']
  },
  'Branding': {
    title: 'Chuyên gia Thương hiệu',
    descLabel: 'Tầm nhìn & Sứ mệnh',
    placeholder: 'Mô tả thương hiệu của bạn (Tên, giá trị cốt lõi, phong cách)...',
    assetLabel: 'Logo hiện tại',
    scaleLabel: 'Số lượng Concept',
    actionBtn: 'Thiết kế nhận diện',
    variantBtn: 'Biến thể Style',
    icon: '💼',
    contextLabel: 'Cá tính thương hiệu',
    contextOptions: ['Sáng tạo (The Creator)', 'Anh hùng (The Hero)', 'Người chăm sóc (The Caregiver)', 'Kẻ nổi loạn (The Outlaw)', 'Sang trọng (The Ruler)'],
    injectors: ['Minimalism', 'Bold Typography', 'Abstract Symbol', 'Classic Serif', 'Hand-drawn', 'Swiss Style', 'Negative Space'],
    deliverablesLabel: 'Hạng mục POSM',
    deliverablesPlaceholder: 'Ghi thêm các hạng mục cần thiết (vd: Đồng phục, Menu)...',
    quickStarters: ['Bộ nhận diện Spa', 'Thương hiệu Cafe tối giản', 'Rebrand công ty công nghệ', 'Bộ quà tặng doanh nghiệp']
  },
  'Marketing & Ads': {
    title: 'Marketing & Quảng cáo',
    descLabel: 'Chiến dịch Marketing',
    placeholder: 'Mô tả chiến dịch, khuyến mãi hoặc sản phẩm cần đẩy mạnh...',
    assetLabel: 'Tài nguyên gốc',
    scaleLabel: 'Số lượng biến thể',
    actionBtn: 'Lên Plan & Design',
    variantBtn: null,
    icon: '📢',
    contextLabel: 'Mục tiêu chiến dịch',
    contextOptions: ['Brand Awareness (Nhận diện)', 'Conversion (Chuyển đổi)', 'Traffic (Lưu lượng)', 'Engagement (Tương tác)', 'App Install'],
    injectors: ['Social Media Optimized', 'Outdoor Billboard', 'Print Magazine Ad', 'Street Style', 'Cyber Monday Vibe', 'Luxury Editorial'],
    formatOptions: [
      { label: 'FB Square', desc: '1080x1080 (Feed)' },
      { label: 'IG Story', desc: '1080x1920 (9:16)' },
      { label: 'Landscape', desc: '1200x628 (Web)' },
      { label: 'Portrait', desc: '4:5 (Mobile)' }
    ],
    techniqueOptions: [
      { label: 'Bento Grid', group: 'Layout', desc: 'Sắp xếp thông tin dạng ô hiện đại' },
      { label: 'Golden Hour', group: 'Lighting', desc: 'Ánh sáng vàng ấm áp, thấu cảm' },
      { label: 'Vibrant Pop', group: 'Color', desc: 'Màu sắc tương phản mạnh, bắt mắt' },
      { label: 'Product Hero', group: 'Focus', desc: 'Sản phẩm phóng to, nền tối giản' }
    ],
    deliverablesLabel: 'Kênh phân phối (Channel)',
    deliverablesPlaceholder: 'VD: Facebook Ads, Google Display, Email Marketing...',
    quickStarters: ['Banner Facebook Sale 50%', 'Instagram Story ra mắt sản phẩm', 'Poster sự kiện khai trương', 'Quảng cáo Google Display']
  },
  'Packaging': {
    title: 'Chuyên gia Bao bì',
    descLabel: 'Yêu cầu đóng gói',
    placeholder: 'Mô tả bao bì (Sản phẩm là gì? Đối tượng khách hàng?)...',
    assetLabel: 'Logo/Nhãn mẫu',
    scaleLabel: 'Số lượng mẫu thử',
    actionBtn: 'Thiết kế & Bóc tách',
    variantBtn: 'Đổi Material',
    icon: '📦',
    contextLabel: 'Kiểu dáng hộp (Box Type)',
    contextOptions: ['Hộp nắp gài (Tuck End)', 'Hộp âm dương (Rigid Box)', 'Túi Zip (Pouch)', 'Chai lọ (Bottle/Jar)', 'Hộp Pizza (Mailer Box)'],
    injectors: ['Kraft Paper', 'Plastic Matte', 'Tin Box', 'Glass bottle', 'Luxury Box', 'Embossed Gold', 'Holographic Foil'],
    deliverablesLabel: 'Hạng mục đóng gói',
    deliverablesPlaceholder: 'VD: Tem phụ, Hướng dẫn sử dụng, Thẻ bảo hành...',
    quickStarters: ['Hộp bánh trung thu', 'Hộp mỹ phẩm cao cấp', 'Túi giấy thời trang', 'Nhãn chai nước ép']
  },
  'UX/UI Design': {
    title: 'Product UX/UI Architect',
    descLabel: 'Vấn đề & Vai trò (Role)',
    placeholder: 'Mô tả bài toán vận hành:\nVD: "Hệ thống ERP cho công ty xây dựng. Cần quản lý vật tư, chấm công thợ. Người dùng là Kỹ sư công trường (hay dùng điện thoại). Yêu cầu đơn giản, nút to, ít thao tác."',
    assetLabel: 'Wireframe / Sitemap',
    scaleLabel: 'Số màn hình chính',
    actionBtn: 'Lên Concept & Logic',
    variantBtn: 'Master Board (4K)', // NEW: Added capability for single 4K Board
    icon: '🖥️',
    contextLabel: 'Loại hệ thống (System Type)',
    contextOptions: [
        'ERP / CRM (Doanh nghiệp)', 
        'EdTech / LMS (Giáo dục)', 
        'POS / F&B (Nhà hàng)', 
        'E-commerce / Marketplace',
        'Healthcare / Hospital', 
        'Fintech / Banking'
    ],
    injectors: [
      'Mobile App (iOS/Android)', 
      'Web Dashboard (Desktop)', 
      'Tablet / POS (iPad)', 
      'Responsive Web', 
      'Landing Page (Marketing)',
      'Dark Mode (Dev Tools)', 
      'Ant Design System'
    ],
    techniqueOptions: [
      { label: 'Role-Based Access', group: 'Logic', desc: 'Thiết kế phân quyền chặt chẽ' },
      { label: 'Audit Trail', group: 'Compliance', desc: 'Lịch sử thao tác (Log)' },
      { label: 'Bulk Action', group: 'Desktop', desc: 'Thao tác hàng loạt (Excel-like)' },
      { label: 'Bottom Nav', group: 'Mobile', desc: 'Điều hướng ngón cái (Thumb zone)' },
      { label: 'Offline Mode', group: 'Tech', desc: 'Hoạt động khi mất mạng' }
    ],
    deliverablesLabel: 'Hạng mục bàn giao',
    deliverablesPlaceholder: 'VD: User Flow, Design System, Specs cho Dev...',
    quickStarters: ['App bán hàng thời trang', 'Dashboard quản lý kho', 'Website tin tức', 'Landing page bất động sản']
  },
  'Interior Design': {
    title: 'Kiến Trúc Sư Nội Thất',
    descLabel: 'Không gian & Phong cách',
    placeholder: 'Mô tả không gian: "Phòng khách 30m2, trần cao. Phong cách Indochine kết hợp hiện đại. Sử dụng vật liệu mây tre đan và gỗ tự nhiên."',
    assetLabel: 'Ảnh hiện trạng / Mặt bằng',
    scaleLabel: 'Số phương án',
    actionBtn: 'Thiết kế nội thất',
    variantBtn: 'Đổi phong cách',
    icon: '🛋️',
    contextLabel: 'Loại phòng',
    contextOptions: ['Phòng khách', 'Phòng ngủ', 'Bếp & Ăn', 'Phòng làm việc', 'Phòng tắm', 'Ban công'],
    injectors: ['Indochine', 'Modern Classic', 'Minimalist', 'Scandinavian', 'Wabi-sabi', 'Industrial'],
    quickStarters: ['Phòng khách Indochine', 'Phòng ngủ Japandi', 'Bếp hiện đại tối giản', 'Góc làm việc chill']
  },
  'Character Design': {
    title: 'Họa Sĩ Thiết Kế Nhân Vật',
    descLabel: 'Đặc điểm nhân vật',
    placeholder: 'Mô tả nhân vật: "Một chiến binh tương lai, mặc giáp nano màu bạc. Vũ khí là kiếm laser. Khuôn mặt lạnh lùng, có vết sẹo ở mắt trái."',
    assetLabel: 'Phác thảo / Moodboard',
    scaleLabel: 'Số lượng Concept',
    actionBtn: 'Tạo nhân vật',
    variantBtn: 'Đổi trang phục',
    icon: '👤',
    contextLabel: 'Thể loại',
    contextOptions: ['Fantasy (Kỳ ảo)', 'Sci-fi (Viễn tưởng)', 'Cyberpunk', 'Anime / Manga', 'Realistic (Tả thực)', 'Stylized (Cách điệu)'],
    injectors: ['Detailed Armor', 'Glowing Eyes', 'Dynamic Pose', 'Cinematic Lighting', 'Concept Art Style'],
    quickStarters: ['Chiến binh Cyberpunk', 'Pháp sư Fantasy', 'Nhân vật Anime nữ', 'Quái vật không gian']
  },
  'App Icon Design': {
    title: 'Chuyên Gia Thiết Kế App Icon',
    descLabel: 'Ý tưởng & Biểu tượng',
    placeholder: 'Mô tả icon: "Icon cho app nghe nhạc. Hình đĩa than cách điệu với sóng âm. Màu sắc gradient tím xanh. Phong cách Glassmorphism."',
    assetLabel: 'Logo / Phác thảo',
    scaleLabel: 'Số lượng mẫu',
    actionBtn: 'Thiết kế Icon',
    variantBtn: 'Đổi Style',
    icon: '🖼️',
    contextLabel: 'Phong cách',
    contextOptions: ['Flat Design', 'Skeuomorphism', 'Glassmorphism', '3D Isometric', 'Minimalist', 'Line Art'],
    injectors: ['Soft Shadows', 'Vibrant Gradients', 'Glossy Finish', 'Rounded Corners', 'High Contrast'],
    quickStarters: ['Icon App Tài chính', 'Icon App Sức khỏe', 'Icon Game 3D', 'Icon App Camera']
  },
  '3D Rendering': {
    title: 'Chuyên Gia Render 3D',
    descLabel: 'Vật thể & Môi trường',
    placeholder: 'Mô tả cảnh render: "Một chiếc đồng hồ cơ lộ máy đặt trên mặt kính đen. Ánh sáng studio tập trung vào các bánh răng. Độ chi tiết cực cao."',
    assetLabel: 'Model / Phác thảo',
    scaleLabel: 'Chất lượng Render',
    actionBtn: 'Thực hiện Render',
    variantBtn: 'Đổi Ánh sáng',
    icon: '🧊',
    contextLabel: 'Loại Render',
    contextOptions: ['Product Shot', 'Architectural Exterior', 'Interior Render', 'Character Portrait', 'Abstract Art'],
    injectors: ['Ray Tracing', 'Global Illumination', 'Depth of Field', 'Subsurface Scattering', 'Octane Render Style'],
    quickStarters: ['Render iPhone 15 Pro', 'Render xe hơi thể thao', 'Render kiến trúc biệt thự', 'Render trang sức kim cương']
  },
  'Vector Art': {
    title: 'Nghệ Sĩ Vector',
    descLabel: 'Nội dung minh họa',
    placeholder: 'Mô tả minh họa: "Một thành phố tương lai với xe bay và nhà chọc trời. Phong cách vector phẳng, màu sắc tươi sáng, ít chi tiết thừa."',
    assetLabel: 'Phác thảo / Ảnh chụp',
    scaleLabel: 'Độ phức tạp',
    actionBtn: 'Tạo Vector Art',
    variantBtn: 'Đổi bảng màu',
    icon: '✒️',
    contextLabel: 'Phong cách Vector',
    contextOptions: ['Flat Illustration', 'Isometric Art', 'Line Art', 'Low Poly', 'Corporate Memphis', 'Vintage Poster'],
    injectors: ['Clean Lines', 'Geometric Shapes', 'Solid Colors', 'Minimalist Detail', 'Scalable Graphics'],
    quickStarters: ['Minh họa Startup', 'Icon Vector Set', 'Poster du lịch phẳng', 'Avatar Vector']
  },
  'E-commerce': {
    title: 'Chuyên gia E-commerce',
    descLabel: 'Sản phẩm & Yêu cầu',
    placeholder: 'Mô tả sản phẩm: "Giày thể thao nam, màu trắng đen. Cần ảnh nền trắng chuẩn Shopee/Amazon và ảnh lifestyle mang trên chân."',
    assetLabel: 'Ảnh sản phẩm thô',
    scaleLabel: 'Số lượng ảnh',
    actionBtn: 'Tạo bộ ảnh E-commerce',
    variantBtn: 'Đổi Concept',
    icon: '🛒',
    contextLabel: 'Loại hình ảnh',
    contextOptions: ['Nền trắng (Studio)', 'Lifestyle (Đời sống)', 'Infographic (Tính năng)', 'Banner Khuyến mãi'],
    injectors: ['Clean White Background', 'Soft Shadow', 'High Contrast', 'Commercial Quality'],
    quickStarters: ['Ảnh nền trắng chuẩn Amazon', 'Banner Flash Sale Shopee', 'Ảnh Lifestyle thời trang', 'Infographic tính năng sản phẩm']
  },
  'Social Media': {
    title: 'Content Creator Social',
    descLabel: 'Nội dung & Nền tảng',
    placeholder: 'Mô tả bài đăng: "Bài post Instagram về ra mắt bộ sưu tập son môi mới. Tone màu hồng đào, phong cách trẻ trung, năng động."',
    assetLabel: 'Ảnh/Video gốc',
    scaleLabel: 'Số lượng bài',
    actionBtn: 'Tạo Content Social',
    variantBtn: 'Đổi Format',
    icon: '📱',
    contextLabel: 'Nền tảng',
    contextOptions: ['Instagram Square (1:1)', 'Instagram Story/Reels (9:16)', 'Facebook Post (4:5)', 'YouTube Thumbnail (16:9)', 'TikTok Video'],
    injectors: ['Trendy Vibe', 'Viral Hook', 'Aesthetic Filter', 'Engaging Typography'],
    quickStarters: ['Bài đăng Instagram Aesthetic', 'Thumbnail YouTube bắt mắt', 'Story Facebook tương tác', 'Video TikTok Viral']
  },
  'Event & Wedding': {
    title: 'Chuyên gia Sự kiện & Cưới hỏi',
    descLabel: 'Chủ đề & Yêu cầu',
    placeholder: 'Mô tả sự kiện: "Đám cưới ngoài trời phong cách Rustic. Tone màu gỗ, trắng và xanh lá. Cần thiết kế thiệp mời và backdrop."',
    assetLabel: 'Ảnh tham khảo',
    scaleLabel: 'Số lượng hạng mục',
    actionBtn: 'Thiết kế Sự kiện',
    variantBtn: 'Đổi Tone màu',
    icon: '🎉',
    contextLabel: 'Hạng mục thiết kế',
    contextOptions: ['Thiệp mời (Invitation)', 'Backdrop / Photobooth', 'Menu / Table Card', 'Welcome Board', 'Sơ đồ chỗ ngồi'],
    injectors: ['Elegant Script Font', 'Floral Elements', 'Gold Foil Texture', 'Romantic Lighting'],
    quickStarters: ['Thiệp cưới Rustic', 'Backdrop sự kiện công ty', 'Menu tiệc cưới sang trọng', 'Bảng Welcome Board hoa tươi']
  },
  'Food & Beverage': {
    title: 'Food Stylist & Nhiếp ảnh',
    descLabel: 'Món ăn & Concept',
    placeholder: 'Mô tả món ăn: "Bát phở bò bốc khói nghi ngút. Chụp góc 45 độ. Nền gỗ tối màu, có thêm rau thơm và ớt tươi làm điểm nhấn."',
    assetLabel: 'Ảnh món ăn thô',
    scaleLabel: 'Số lượng góc chụp',
    actionBtn: 'Tạo ảnh Food & Beverage',
    variantBtn: 'Đổi Concept',
    icon: '🍔',
    contextLabel: 'Phong cách chụp',
    contextOptions: ['Dark Food Photography', 'Bright & Airy', 'Rustic / Vintage', 'Modern Minimalist', 'Action Shot (Rót, rắc)'],
    injectors: ['Appetizing Colors', 'Steam Effects', 'Crisp Details', 'Shallow Depth of Field'],
    quickStarters: ['Chụp món ăn Dark Mood', 'Ảnh menu nhà hàng sáng sủa', 'Chụp đồ uống có đá lạnh', 'Chụp bánh ngọt phong cách Hàn Quốc']
  },
  'Enterprise': {
    title: 'Chuyên gia Doanh nghiệp',
    descLabel: 'Tài liệu & Yêu cầu',
    placeholder: 'Mô tả tài liệu: "Báo cáo thường niên năm 2024. Phong cách chuyên nghiệp, hiện đại. Sử dụng màu xanh dương của công ty."',
    assetLabel: 'Số liệu / Logo',
    scaleLabel: 'Số trang',
    actionBtn: 'Thiết kế Tài liệu',
    variantBtn: 'Đổi Layout',
    icon: '🏢',
    contextLabel: 'Loại tài liệu',
    contextOptions: ['Báo cáo thường niên (Annual Report)', 'Hồ sơ năng lực (Company Profile)', 'Pitch Deck / Presentation', 'Tài liệu nội bộ'],
    injectors: ['Corporate Blue', 'Clean Infographics', 'Professional Typography', 'Data Visualization'],
    quickStarters: ['Thiết kế Company Profile', 'Làm Slide Pitch Deck', 'Báo cáo tài chính Infographic', 'Tài liệu đào tạo nội bộ']
  },
  'SOP Management': {
    title: 'Chuyên gia Quy trình (SOP)',
    descLabel: 'Quy trình & Yêu cầu',
    placeholder: 'Mô tả quy trình: "Quy trình phục vụ khách hàng tại nhà hàng. Cần sơ đồ khối (Flowchart) rõ ràng và hướng dẫn chi tiết từng bước."',
    assetLabel: 'Tài liệu thô',
    scaleLabel: 'Độ chi tiết',
    actionBtn: 'Tạo SOP',
    variantBtn: 'Đổi Format',
    icon: '📋',
    contextLabel: 'Định dạng SOP',
    contextOptions: ['Sơ đồ khối (Flowchart)', 'Tài liệu văn bản (Text Doc)', 'Checklist', 'Video Hướng dẫn (Kịch bản)'],
    injectors: ['Clear Hierarchy', 'Step-by-step Visuals', 'Standardized Icons', 'Easy to Read'],
    quickStarters: ['Sơ đồ quy trình bán hàng', 'Checklist dọn dẹp phòng', 'Tài liệu hướng dẫn nhân viên mới', 'Kịch bản video đào tạo']
  },
  'Cinematic Video': {
    title: 'Đạo Diễn Phim Điện Ảnh',
    descLabel: 'Cảnh quay & Cảm xúc',
    placeholder: 'Mô tả cảnh quay: "Một phi hành gia đứng trên đỉnh núi đá đỏ của sao Hỏa, nhìn về phía trái đất xa xôi. Gió thổi bụi cát. Ánh sáng hoàng hôn cam cháy."',
    assetLabel: 'Storyboard / Keyframe',
    scaleLabel: 'Thời lượng / Số Shot',
    actionBtn: 'Tạo Cinematic Shot',
    variantBtn: 'Đổi Color Grade',
    icon: '🎥',
    contextLabel: 'Góc máy (Camera)',
    contextOptions: ['Wide Shot (Toàn cảnh)', 'Close-up (Cận cảnh)', 'Bird\'s Eye (Từ trên cao)', 'Low Angle (Góc thấp)', 'Tracking Shot'],
    injectors: ['Anamorphic Lens', 'Film Grain', 'Dynamic Motion Blur', 'Epic Scale', 'IMAX Quality'],
    quickStarters: ['Cảnh hành động kịch tính', 'Phong cảnh thiên nhiên hùng vĩ', 'Cận cảnh cảm xúc nhân vật', 'Cảnh Sci-fi hoành tráng']
  }
};
