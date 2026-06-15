
# HỒ SƠ TÍNH NĂNG & TRẢI NGHIỆM ĐỀ XUẤT (SYSTEM FEATURES ROADMAP)
## DỰ ÁN: TIỆM ẢNH TỨC THỜI (VISUAL EMPATHY ASSISTANT)

**Phiên bản tài liệu:** 3.0
**Hệ thống tương thích:** v11.0 (Agentic Workflow)
**Trạng thái:** Living Document (Tài liệu sống - Cập nhật liên tục)

---

### I. CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI (IMPLEMENTED CORE)

#### 1. Intelligent Pipeline & Agentic Workflow - v11.0 (NEW)
*   **Mô tả:** Hệ thống tự động hóa thông minh đa bước, biến ứng dụng thành một Creative Agency thu nhỏ.
*   **Cơ chế:**
    *   **Deep Research:** Phân tích chuyên sâu ý tưởng thô bằng Gemini 3.1 Pro (ThinkingLevel.HIGH).
    *   **Strategic Auto-Routing:** Tự động gọi đúng Agent chuyên gia (Logo, Packaging, Marketing, UX/UI) để lập kế hoạch.
    *   **Pre-Audit System:** Chấm điểm độ trưởng thành (Maturity Score) của bản chiến lược trước khi render.
    *   **Context-Aware Execution:** Tự động chèn Mode Modifiers vào prompt để đảm bảo tính nhất quán trong Batch Generation.

#### 2. Smart Semantic Refresh - v9.3.1
*   **Mô tả:** Chế độ làm mới ảnh (Refresh) thông minh hơn nhờ bước phân tích ngữ nghĩa trước khi thực thi.
*   **Cơ chế:**
    *   **Forensic Scan:** Quét ảnh đầu vào để hiểu loại tài liệu (Flyer, Poster, Banner).
    *   **Auto-Prompt:** Tự động tạo prompt nâng cấp dựa trên Brand Vibe mà không cần người dùng mô tả chi tiết.

#### 3. UX Flow Engine & Master Board 4K - v9.3.0
*   **Mô tả:** Hệ thống tự động thiết kế luồng trải nghiệm người dùng (User Journey) và sinh ảnh đơn khổ lớn (4K) chứa toàn bộ hệ thống thiết kế.
*   **Cơ chế:**
    *   **UX Director Agent:** Phân tích yêu cầu nghiệp vụ -> Đề xuất danh sách màn hình (Screens).
    *   **Parallel Batching:** Sinh đồng thời các màn hình UI High-fidelity dựa trên Brand Kit.

#### 4. 360° Neural Shoot - v10.3.0
*   **Mô tả:** Tự động tạo bộ ảnh sản phẩm 7 góc độ từ một ảnh gốc duy nhất.
*   **Mô hình ngôn ngữ:** Sử dụng `Gemini 3.1 Pro` cho các tác vụ suy luận phức tạp và `Gemini 3.1 Flash` cho các tác vụ văn bản nhanh.
*   **Mô hình hình ảnh:** Sử dụng `Gemini 3.1 Flash Image` cho chất lượng cao nhất.
*   **Mô hình video:** Sử dụng `Veo 3.1` cho các tác vụ tạo và mở rộng video.

#### 5. Tiered Executor & Economic Safety - v10.5.0
*   **Mô tả:** Quản lý hàng đợi và giới hạn tốc độ (Rate Limiting) cho các API tốn kém.
*   **Cơ chế:** Phân chia các tác vụ thành các Tier (ANALYSIS_FAST, STRATEGY_PLANNING, IMAGE_GEN_BATCH, IMAGE_GEN_4K, VIDEO_GEN) với cấu hình Concurrency và Timeout riêng biệt.

---

### II. NÂNG CẤP TRẢI NGHIỆM TƯƠNG TÁC (UX EVOLUTION)

#### 1. Smart Grid & Zip Downloader
*   **Mô tả:** Giao diện lưới tự động thích ứng với loại tài sản (Layered vs Single Image) và hỗ trợ tải xuống hàng loạt dưới dạng file ZIP.

#### 2. Real-time Telemetry Dashboard
*   **Mô tả:** Hiển thị trực quan trạng thái của từng "Neural Thread" đang chạy ngầm trong Batch Studio (Processing -> Rendering -> Completed).

---

### III. MỞ RỘNG KHẢ NĂNG XỬ LÝ (TECHNICAL EXTENSIONS)

#### 1. Neural AR Preview (WebXR)
*   **Đề xuất:** Sử dụng Camera Feed làm Context động để Overlay trực tiếp Logo/Poster vào không gian thực.

#### 2. Vector Magic Extension
*   **Đề xuất:** Tích hợp bộ chuyển đổi Bitmap-to-Vector mạnh mẽ hơn (Potrace WASM) ngay tại Client.

---

### IV. TỐI ƯU HÓA HIỆU SUẤT (PERFORMANCE)

#### 1. Logic Processors Layer
*   **Mô tả:** Tách biệt hoàn toàn logic nghiệp vụ ra khỏi React Components (sử dụng `services/flows/` và `services/orchestrator/`).

#### 2. Lazy Loading Architecture
*   **Mô tả:** Áp dụng `React.lazy` và `Suspense` cho toàn bộ các module lớn, giảm Bundle Size ban đầu.

---
*Tài liệu này là kim chỉ nam cho đội ngũ phát triển, đảm bảo mọi tính năng mới đều kế thừa và phát huy sức mạnh của kiến trúc Core hiện tại.*
