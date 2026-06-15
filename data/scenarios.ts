
import { Scenario } from '../types';

export const SCENARIO_LIBRARY: Scenario[] = [
  { 
    id: 'wf-branding', 
    title: 'New Brand Identity', 
    icon: '🏢', 
    category: 'Branding', 
    description: 'Quy trình đa Agent để khởi tạo nhận diện thương hiệu từ con số 0.', 
    prompt: 'Tôi muốn bắt đầu quy trình [TẠO THƯƠNG HIỆU MỚI]. Hãy kích hoạt WorkflowMaster để thu thập thông tin.',
    isWorkflow: true 
  },
  { 
    id: 'wf-sop-master', 
    title: 'Master Agent SOP', 
    icon: '🧩', 
    category: 'SOP Management', 
    description: 'Kích hoạt khung làm việc 4 Agent: Strategy, Product, Branding, Marketing.', 
    prompt: 'Kích hoạt Master Agent Framework để xây dựng thương hiệu mới theo đúng quy trình SOP.',
    isWorkflow: true 
  },
  { 
    id: 'wf-doc-master', 
    title: 'Product Documentation', 
    icon: '📝', 
    category: 'Product Document', 
    description: 'Tạo tài liệu mô tả sản phẩm (PRD), hướng dẫn sử dụng, và thông số kỹ thuật.', 
    prompt: 'Tôi cần viết tài liệu mô tả chi tiết cho sản phẩm này.',
    isWorkflow: true 
  },
  { 
    id: 'wf-signage-pro', 
    title: 'Signage & Facade', 
    icon: '🏪', 
    category: 'Signage', 
    description: 'Thiết kế bảng hiệu mặt tiền, biển quảng cáo ngoài trời chuẩn thi công.', 
    prompt: 'Lên phương án thiết kế bảng hiệu mặt tiền.',
    isWorkflow: true 
  },
  { 
    id: 'wf-floorplan-pro', 
    title: 'Advanced Floor Plan', 
    icon: '📐', 
    category: 'Floor Plan', 
    description: 'Thiết kế mặt bằng bố trí nội thất, quy hoạch không gian chuyên sâu.', 
    prompt: 'Lên phương án mặt bằng bố trí nội thất tối ưu công năng.',
    isWorkflow: true 
  },
  { 
    id: 'wf-interior', 
    title: 'Space Planning', 
    icon: '🏠', 
    category: 'Real Estate', 
    description: 'Quy trình thiết kế không gian và nội thất chuyên sâu.', 
    prompt: 'Kích hoạt quy trình [THIẾT KẾ KHÔNG GIAN]. Tôi cần Agent Kiến Trúc và Bố Cục hỗ trợ.',
    isWorkflow: true 
  },
  { id: 'st1', title: 'Match Lighting', icon: '💡', category: 'Style Transfer', description: 'Áp dụng ánh sáng từ ảnh mẫu vào ảnh gốc.', prompt: 'Hãy điều chỉnh ánh sáng và bầu không khí của ảnh chính sao cho giống hệt với ảnh mẫu này.' },
  { id: 'st2', title: 'Color Palette', icon: '🎨', category: 'Style Transfer', description: 'Đổi màu theo tông của ảnh mẫu.', prompt: 'Áp dụng bảng màu (Color Palette) từ ảnh mẫu sang ảnh chính một cách chuyên nghiệp.' },
  { id: 'char-1', title: 'Character Concept', icon: '👤', category: 'Character Design', description: 'Tạo ý tưởng nhân vật chi tiết.', prompt: 'Thiết kế một nhân vật độc đáo với đầy đủ trang phục và phụ kiện.' },
  { id: 'icon-1', title: 'App Icon Set', icon: '🖼️', category: 'App Icon Design', description: 'Thiết kế bộ icon ứng dụng hiện đại.', prompt: 'Tạo bộ icon ứng dụng theo phong cách hiện đại, tối giản và dễ nhận diện.' },
  { id: '3d-1', title: 'Product 3D Render', icon: '🧊', category: '3D Rendering', description: 'Render sản phẩm 3D siêu thực.', prompt: 'Tạo bản render 3D siêu thực cho sản phẩm này với ánh sáng studio chuyên nghiệp.' },
  { id: 'vec-1', title: 'Vector Illustration', icon: '✒️', category: 'Vector Art', description: 'Minh họa vector sắc nét.', prompt: 'Tạo một bản minh họa vector phẳng, hiện đại cho ý tưởng này.' },
  { id: 'vid-1', title: 'Cinematic Shot', icon: '🎥', category: 'Cinematic Video', description: 'Tạo cảnh quay điện ảnh.', prompt: 'Thiết kế một cảnh quay điện ảnh với góc máy và ánh sáng chuyên nghiệp.' },
  { id: 'int-1', title: 'Interior Styling', icon: '🛋️', category: 'Interior Design', description: 'Thiết kế phong cách nội thất.', prompt: 'Lên ý tưởng thiết kế nội thất cho không gian này với phong cách hiện đại.' },
  { id: 'ps2', title: 'Object Remover', icon: '🧽', category: 'Creative Studio', description: 'Xóa vật thể không mong muốn.', prompt: 'Xóa vật thể không mong muốn tại vùng chọn.' }
];
