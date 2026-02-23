
# 🌌 Tiệm Ảnh Tức Thời (Visual Empathy Assistant) v10.0

> **"The Final 1% - Extreme Polish & Economic Safety."**

Một hệ thống **Siêu Trợ Lý Sáng Tạo (AI Creative Studio)** vận hành hoàn toàn trên trình duyệt, được hỗ trợ bởi hệ sinh thái Google Gemini 3. Ứng dụng cho phép người dùng thiết kế, chỉnh sửa ảnh, dựng video và lên chiến lược thương hiệu thông qua giao tiếp đa phương thức (Văn bản, Hình ảnh, Giọng nói).

---

## 🚀 Tính năng Cốt lõi (Core Features)

### 1. 🧠 Master Intelligence (Neural Core)
*   **Sequential-Agent Orchestration (SAO v4.2):** Hệ thống tự động phân rã yêu cầu phức tạp thành các tác vụ nhỏ và giao cho các Agent chuyên biệt (Strategy, Visual, UX, Audit).
*   **Dual-Router:** Phân loại ý định người dùng (Vẽ mới, Sửa ảnh, Viết tài liệu) với độ chính xác >98%.
*   **Deep Thinking:** Sử dụng Gemini 3 Pro với `thinkingBudget: 32k` cho các tác vụ lập kế hoạch chiến lược.

### 2. 🎨 PixelSmith Engine (Visual)
*   **Retina Canvas:** Công cụ vẽ Mask và chỉnh sửa ảnh hỗ trợ màn hình độ phân giải cao (Double-buffering).
*   **Smart Scan & Dewarp:** Tự động tách nền, nắn phẳng tài liệu/bao bì từ ảnh chụp nghiêng.
*   **4K Upscale:** Nâng cấp độ phân giải ảnh với độ chi tiết vật lý (Physicality) cao.

### 3. 📹 MotionMaster (Video)
*   **Neural Extension:** Tạo video từ ảnh tĩnh hoặc mở rộng video có sẵn bằng mô hình **Veo 3.1**.
*   **Viral Story Engine:** Tự động lên kịch bản và render video ngắn (Shorts/Reels) theo 3 phong cách Hook khác nhau.

### 4. 🗣️ Live Mode (Fenrir)
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
*   Google Gemini API Key (Có quyền truy cập Gemini 1.5 Pro/Flash, Gemini 3 Experimental, Veo, và Live API).

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

## 🏗️ Kiến trúc Hệ thống

```mermaid
graph TD
    User[User Input (Text/Voice/Image)] --> Hooks[React Hooks Layer]
    Hooks --> Orchestrator[Service Orchestrator]
    Orchestrator --> Router{Intent Router}
    
    Router -->|Deep Strategy| MasterAgent[Master (Gemini 3 Pro)]
    Router -->|Visual Task| PixelSmith[PixelSmith (Imagen/Gemini Image)]
    Router -->|Video Task| VeoEngine[Veo 3.1]
    Router -->|Batch Job| BatchEngine[Batch Processor]
    
    MasterAgent --> Executor[Tiered Executor]
    PixelSmith --> Executor
    
    Executor --> API[Google GenAI SDK]
```

---

## 🛡️ Tiêu chuẩn Chất lượng (Gold Standard)

*   **Anti-Laziness:** AI bị cấm trả lời chung chung. Phải đưa ra giải pháp cụ thể, chi tiết.
*   **Economic Safety:** Các tác vụ tốn kém (Video) có khóa an toàn (Mutex Lock) để tránh spam request.
*   **Memory Hygiene:** Tự động dọn dẹp bộ nhớ ảnh cũ để tránh tràn RAM trình duyệt.

---

**© 2025 Tiệm Ảnh Tức Thời. Powered by Google Gemini.**
