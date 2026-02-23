
# TÀI LIỆU YÊU CẦU SẢN PHẨM (FRD) - ĐỊNH HƯỚNG TƯƠNG LAI
## DỰ ÁN: TIỆM ẢNH TỨC THỜI (VISUAL EMPATHY ASSISTANT)

**Phiên bản tài liệu:** 1.0 (Visionary Draft)
**Phạm vi:** Phiên bản v9.0 -> v10.0
**Trọng tâm:** Mở rộng Hệ sinh thái Agent (Agent Ecosystem Expansion)
**Ngày lập:** 2025-06-27

---

### I. TẦM NHÌN CHIẾN LƯỢC (STRATEGIC VISION)

Từ **"Thấu cảm Thị giác Tĩnh"** (Static Visual Empathy) chuyển dịch sang **"Thấu cảm Đa giác quan Động"** (Kinetic & Sensory Empathy).

Hệ thống sẽ không chỉ dừng lại ở việc chỉnh sửa ảnh 2D, mà sẽ trở thành một **Creative Studio tự hành**, nơi người dùng đóng vai trò Giám đốc Sáng tạo (Creative Director), còn AI thực thi mọi tác vụ từ dựng phim, lồng tiếng, đến dựng mô hình 3D.

---

### II. ĐỘI NGŨ AGENT MỚI (NEW AGENT ROSTER)

Để hiện thực hóa tầm nhìn trên, hệ thống cần tuyển dụng thêm các "Nhân sự AI" chuyên biệt sau vào kiến trúc Modular:

#### 1. MotionMaster (Agent Chuyển Động) - v9.0
*   **Vai trò:** Chuyên gia dựng phim & Motion Graphic.
*   **Năng lực cốt lõi:**
    *   **Image-to-Video:** Biến ảnh tĩnh (Sản phẩm, Logo) thành video ngắn 5-10s (Cinemagraph, Zoom, Pan).
    *   **Auto-Editing:** Tự động cắt ghép footage thô thành video quảng cáo hoàn chỉnh dựa trên nhạc nền (Beat sync).
*   **Công nghệ:** Gemini Veo / Imagen Video API.
*   **Tích hợp:** Nằm trong `Batch Studio` (Xử lý render tốn thời gian).

#### 2. VoiceSynergy (Agent Hội Thoại Thực) - v9.2
*   **Vai trò:** Trợ lý giao tiếp thời gian thực & Voice-off Artist.
*   **Năng lực cốt lõi:**
    *   **Real-time Collaboration:** Người dùng vừa vẽ vừa ra lệnh bằng giọng nói ("Làm chỗ này tối đi", "Thêm ánh sáng vàng vào đây").
    *   **TTS Empathy:** Đọc kịch bản quảng cáo với cảm xúc chỉ định (Vui vẻ, Trầm ấm, Gấp gáp).
*   **Công nghệ:** Gemini Live API (WebSockets), Multimodal Streaming.

#### 3. SpatialArchitect (Agent Không Gian) - v9.5
*   **Vai trò:** Kỹ sư 3D & Quy hoạch không gian.
*   **Năng lực cốt lõi:**
    *   **2D to 3D Conversion:** Chuyển đổi mặt bằng 2D (Floor Plan) thành mô hình 3D thô (Blockout) có thể xoay 360 độ.
    *   **Texture Mapping:** Tự động ốp vật liệu (Gỗ, Đá, Vải) vào các khối 3D dựa trên prompt.
*   **Công nghệ:** Three.js + Gemini 3D Object Understanding.

#### 4. BrandGuardian (Agent Bộ Nhớ Dài Hạn) - v10.0
*   **Vai trò:** Quản gia thương hiệu (Brand Custodian).
*   **Năng lực cốt lõi:**
    *   **Vector Memory (RAG):** Ghi nhớ *mọi* thiết kế cũ, mã màu, và quy tắc của người dùng. Không bao giờ hỏi lại "Logo của tôi màu gì?".
    *   **Consistency Check:** Tự động cảnh báo nếu thiết kế mới vi phạm quy chuẩn thương hiệu đã lưu.
*   **Công nghệ:** Vector Database (Pinecone/ChromaDB) tích hợp sâu vào `useNeuralMemory`.

---

### III. LỘ TRÌNH TÍNH NĂNG (FEATURE ROADMAP)

#### Giai đoạn 1: Kỷ nguyên Chuyển động (The Kinetic Era) - v9.0
*   **Mục tiêu:** Đưa Video vào quy trình làm việc.
*   **Tính năng:**
    *   [ ] **Motion Brush:** Tô vào vùng nước/mây trong ảnh tĩnh -> Tạo hiệu ứng chuyển động lặp (Loop).
    *   [ ] **AI Video Generator:** Nhập Prompt -> Tạo Video 4s (Sử dụng mô hình Veo).
    *   [ ] **Storyboard Animator:** Biến chuỗi ảnh Storyboard hiện tại thành Animatic Video (Video nháp).

#### Giai đoạn 2: Giao tiếp Đa thức (Multimodal Live) - v9.2
*   **Mục tiêu:** Xóa bỏ rào cản bàn phím.
*   **Tính năng:**
    *   [ ] **Voice Command Layer:** Nút Micro luôn hiện. Ra lệnh sửa ảnh bằng giọng nói tiếng Việt.
    *   [ ] **Live Canvas:** AI nhìn thấy trỏ chuột của bạn. Bạn chỉ vào đâu, AI hiểu ngữ cảnh ở đó.

#### Giai đoạn 3: Không gian & Chiều sâu (Spatial Depth) - v9.5
*   **Mục tiêu:** Thoát khỏi mặt phẳng 2D.
*   **Tính năng:**
    *   [ ] **3D Product Viewer:** Tải lên 4 góc chụp sản phẩm -> AI dựng lại khối 3D xoay được trên web.
    *   [ ] **AR Preview:** Quét mã QR để ướm thử biển hiệu/tranh vào tường nhà thật thông qua camera điện thoại.

---

### IV. YÊU CẦU KỸ THUẬT (TECHNICAL REQUIREMENTS)

Để hỗ trợ các Agent mới, kiến trúc hệ thống cần nâng cấp:

1.  **Hạ tầng Streaming (Cho VoiceSynergy):**
    *   Nâng cấp `lib/gemini.ts` để hỗ trợ WebSocket (Live API).
    *   Xử lý Audio Buffer (PCM Encoding/Decoding) ngay tại Client.

2.  **Bộ nhớ Vector (Cho BrandGuardian):**
    *   Cần tích hợp một Client-side Vector Store (như Voy hoặc TensorFlow.js embedding) để tìm kiếm ngữ nghĩa nhanh trong lịch sử chat.

3.  **WebGL Renderer (Cho SpatialArchitect):**
    *   Tích hợp `React Three Fiber` vào `EditorCanvas` để hiển thị nội dung 3D song song với 2D.

4.  **Tối ưu hóa Batch (Cho MotionMaster):**
    *   Video Rendering rất nặng. Cần cơ chế **"Background Job"** thực thụ (Service Worker) để người dùng có thể đóng tab mà tác vụ vẫn chạy (hoặc Resume được).

---

### V. KẾT LUẬN

Phiên bản v8.3.0 đã hoàn thiện nền móng "Modular Core". Các phiên bản tiếp theo sẽ là sự bùng nổ về **Công năng (Modality)**. Chúng ta không xây dựng lại móng, mà xây thêm các tầng tháp mới trên nền tảng vững chắc này.

*Tài liệu này dùng để định hướng R&D cho đội ngũ phát triển.*
