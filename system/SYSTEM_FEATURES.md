
# HỒ SƠ TÍNH NĂNG & TRẢI NGHIỆM ĐỀ XUẤT (SYSTEM FEATURES ROADMAP)
## DỰ ÁN: TIỆM ẢNH TỨC THỜI (VISUAL EMPATHY ASSISTANT)

**Phiên bản tài liệu:** 2.4
**Hệ thống tương thích:** v9.3.1 (Smart-Refresh)
**Trạng thái:** Living Document (Tài liệu sống - Cập nhật liên tục)

---

### I. CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI (IMPLEMENTED CORE)

#### 1. Smart Semantic Refresh - v9.3.1 (NEW)
*   **Mô tả:** Chế độ làm mới ảnh (Refresh) thông minh hơn nhờ bước phân tích ngữ nghĩa trước khi thực thi.
*   **Cơ chế:**
    *   **Forensic Scan:** Quét ảnh đầu vào để hiểu loại tài liệu (Flyer, Poster, Banner).
    *   **Auto-Prompt:** Tự động tạo prompt nâng cấp dựa trên Brand Vibe mà không cần người dùng mô tả chi tiết.

#### 2. UX Flow Engine - v9.3.0
*   **Mô tả:** Hệ thống tự động thiết kế luồng trải nghiệm người dùng (User Journey) cho ứng dụng Mobile/Web.
*   **Cơ chế:**
    *   **UX Director Agent:** Phân tích yêu cầu nghiệp vụ -> Đề xuất danh sách màn hình (Screens).
    *   **Parallel Batching:** Sinh đồng thời 3-6 màn hình UI High-fidelity dựa trên Brand Kit.
    *   **Brand Injection:** Đồng bộ màu sắc và vibe thương hiệu vào từng pixel.

#### 3. Master Board 4K - v9.3.0
*   **Mô tả:** Chế độ sinh ảnh đơn khổ lớn (4K) chứa toàn bộ hệ thống thiết kế (User Flow + UI Screens + Design System) trên một bảng thuyết trình.
*   **Mục đích:** Dùng cho thuyết trình khách hàng hoặc làm Overview.

#### 4. 360° Neural Shoot - v10.3.0
*   **Mô tả:** Tự động tạo bộ ảnh sản phẩm 7 góc độ (Trước, Sau, Trái, Phải, Trên, Chéo, Chi tiết) từ một ảnh gốc duy nhất.
*   **Cơ chế:** Sử dụng `gemini-3-pro-image-preview` cho chất lượng cao nhất hoặc `gemini-2.5-flash-image` cho tốc độ, kết hợp prompt kỹ thuật về góc máy (Camera Angle).

#### 5. Modular Batch Engine - v8.3.0
*   **Mô tả:** Tách biệt hoàn toàn logic xử lý hàng loạt (Batch Processing) khỏi giao diện người dùng (UI Hook).
*   **Cơ chế:** Sử dụng `batchProcessors.ts` làm tầng trung gian xử lý nghiệp vụ.

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
*   **Mô tả:** Đã hoàn tất việc tách logic nghiệp vụ ra khỏi React Components.

#### 2. Lazy Loading Architecture
*   **Mô tả:** Áp dụng `React.lazy` và `Suspense` cho toàn bộ các module lớn, giảm Bundle Size ban đầu.

---
*Tài liệu này là kim chỉ nam cho đội ngũ phát triển, đảm bảo mọi tính năng mới đều kế thừa và phát huy sức mạnh của kiến trúc Core hiện tại.*
