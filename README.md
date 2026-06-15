
# 🌌 Tiệm Ảnh Tức Thời (Visual Empathy Assistant) v11.0

> **"Agentic Workflow & Intelligent Pipeline - The Ultimate Creative Studio."**

Một hệ thống **Siêu Trợ Lý Sáng Tạo (AI Creative Studio)** vận hành hoàn toàn trên trình duyệt, được hỗ trợ bởi hệ sinh thái Google Gemini 3.1. Ứng dụng cho phép người dùng thiết kế, chỉnh sửa ảnh, dựng video và lên chiến lược thương hiệu thông qua giao tiếp đa phương thức (Văn bản, Hình ảnh, Giọng nói) với kiến trúc **Agentic Workflow** tiên tiến.

---

## 🚀 Tính năng Cốt lõi (Core Features)

### 1. 🧠 Intelligent Pipeline & Agentic Workflow (MỚI)
*   **Deep Research Mode:** Tự động phân tích chuyên sâu ý tưởng thô và Branding để mở rộng ngữ cảnh bằng Gemini 3.1 Pro (ThinkingLevel.HIGH).
*   **Strategic Auto-Routing:** Tự động gọi đúng Agent chuyên gia dựa trên danh mục (Logo, Packaging, Marketing, UX/UI, v.v.) để lập kế hoạch chiến lược trước khi thực thi.
*   **Pre-Audit System:** Chấm điểm độ trưởng thành (Maturity Score) của bản chiến lược để đảm bảo tính khả thi trước khi tốn tài nguyên render ảnh.
*   **Context-Aware Execution:** Tự động nhận diện chế độ (Brand Bible, Campaign, Blueprint) để điều chỉnh prompt cho từng ảnh trong batch, đảm bảo tính nhất quán và đa dạng.

### 2. 🎨 PixelSmith Engine (Visual)
*   **Retina Canvas:** Công cụ vẽ Mask và chỉnh sửa ảnh hỗ trợ màn hình độ phân giải cao.
*   **Smart Scan & Dewarp:** Tự động tách nền, nắn phẳng tài liệu/bao bì từ ảnh chụp nghiêng.
*   **4K Upscale:** Nâng cấp độ phân giải ảnh với độ chi tiết vật lý (Physicality) cao sử dụng Gemini 3.1 Flash Image.

### 3. 📹 MotionMaster (Video)
*   **Neural Extension:** Tạo video từ ảnh tĩnh hoặc mở rộng video có sẵn bằng mô hình **Veo 3.1**.
*   **Viral Story Engine:** Tự động lên kịch bản và render video ngắn (Shorts/Reels) theo 3 phong cách Hook khác nhau.

### 4. 🗣️ xLive Mode (Fenrir)
*   **Real-time Voice:** Giao tiếp thời gian thực với AI qua giọng nói (Gemini Live API).
*   **Action Bridge:** Ra lệnh sửa ảnh, vẽ hình trực tiếp bằng lời nói.

### 5. 🧩 Batch Studio (Automation)
*   **Product 360:** Tự động tạo bộ ảnh sản phẩm 7 góc độ.
*   **UX Flow:** Tự động thiết kế luồng màn hình UI/UX.
*   **Ad Campaign:** Tạo hàng loạt banner quảng cáo đa kích thước.

---

## 🛠️ Cài đặt & Vận hành

### Yêu cầu tiên quyết
*   Node.js v18+
*   Google Gemini API Key (Có quyền truy cập Gemini 3.1 Pro/Flash, Gemini 3.1 Flash Image, Veo 3.1, và Live API).

### Các bước cài đặt

1.  **Clone dự án:**
    ```bash
    git clone https://github.com/your-repo/visual-empathy-assistant.git
    cd visual-empathy-assistant
    ```

2.  **Cài đặt thư viện:**
    ```bash
    npm install
    ```

3.  **Cấu hình môi trường:**
    *   Tạo file `.env` tại thư mục gốc.
    *   Thêm API Key:
        ```env
        API_KEY=your_google_gemini_api_key_here
        ```
    *   *Lưu ý:* Đối với tính năng Veo Video, hệ thống sẽ yêu cầu người dùng chọn Key OAuth trả phí trực tiếp trên giao diện để đảm bảo an toàn kinh tế.

4.  **Khởi chạy (Development):**
    ```bash
    npm run dev
    ```

5.  **Đóng gói (Production Build):**
    ```bash
    npm run build
    ```

---

## 🏗️ Kiến trúc Hệ thống (Agentic Workflow)

Hệ thống sử dụng kiến trúc **Tiered Executor** kết hợp với **Intelligent Pipeline** để quản lý luồng công việc:

1. **Deep Research:** Mở rộng ý tưởng thô.
2. **Strategic Planning:** Lập kế hoạch chuyên sâu bởi các Agent chuyên biệt.
3. **Pre-Audit:** Đánh giá chất lượng kế hoạch.
4. **Execution:** Render hình ảnh/tài liệu dựa trên kế hoạch đã duyệt.

*(Xem chi tiết tại `docs/ARCHITECTURE.md`)*

---

## 🛡️ Tiêu chuẩn Chất lượng (Gold Standard)

*   **Anti-Laziness:** AI bị cấm trả lời chung chung. Phải đưa ra giải pháp cụ thể, chi tiết.
*   **Economic Safety:** Các tác vụ tốn kém (Video, 4K Image) có khóa an toàn (Mutex Lock) và hệ thống hàng đợi (Queue) để tránh spam request.
*   **Memory Hygiene:** Tự động dọn dẹp bộ nhớ ảnh cũ để tránh tràn RAM trình duyệt.

---

**© 2026 Tiệm Ảnh Tức Thời. Powered by Google Gemini.**
