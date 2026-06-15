# HỒ SƠ NGHIÊN CỨU KỸ THUẬT V12 (V12 TECHNICAL RESEARCH & R&D)
## DỰ ÁN: TIỆM ẢNH TỨC THỜI (VISUAL EMPATHY ASSISTANT)

**Người lập:** Chief Architect
**Mục tiêu:** Giải quyết triệt để các nút thắt cổ chai (Bottlenecks) của v11.0 và chuẩn bị nền tảng hạ tầng cho v12.0 (Codename: **Resilient-Omni**).

---

### 1. Kiến trúc Local-First & Quản lý Bộ nhớ (Memory Management)
**Vấn đề hiện tại:** Lưu trữ Base64 trong React State gây phình RAM, dễ dẫn đến Out of Memory (OOM) khi xử lý Batch hoặc Video.
**Kỹ thuật nghiên cứu:**
*   **IndexedDB & Blob Storage:** Thay vì giữ Base64 trong RAM, ngay khi nhận kết quả từ API, hệ thống sẽ chuyển đổi thành `Blob` và lưu xuống `IndexedDB` (sử dụng thư viện `idb` hoặc `localforage`).
*   **Object URL Lifecycle:** React component chỉ lưu trữ chuỗi `blob:http://...` được tạo từ `URL.createObjectURL()`. 
*   **Garbage Collection Hook:** Xây dựng một custom hook `useBlobCleanup` để tự động gọi `URL.revokeObjectURL()` khi component unmount hoặc khi ảnh bị xóa khỏi lịch sử, giải phóng RAM ngay lập tức.

### 2. Phục hồi Tiến trình (Resilient Pipeline & Checkpointing)
**Vấn đề hiện tại:** Intelligent Pipeline 4 bước nếu đứt gãy ở bước 3 sẽ phải chạy lại từ đầu.
**Kỹ thuật nghiên cứu:**
*   **State Machine (XState) / Persistent Redux:** Chuyển đổi luồng Pipeline thành một Cỗ máy trạng thái hữu hạn (Finite State Machine).
*   **Checkpointing:** Mỗi khi hoàn thành một bước (VD: xong Deep Research), trạng thái (Context) được serialize và lưu vào LocalStorage/IndexedDB với một `jobId`.
*   **Auto-Resume:** Khi người dùng mở lại trang hoặc bấm "Thử lại", hệ thống đọc `jobId`, nạp lại Context và tiếp tục thực thi từ node bị lỗi (VD: bỏ qua Research và Planning, chạy thẳng vào Pre-Audit).

### 3. Đồng bộ Hàng đợi Đa Tab (Cross-Tab Concurrency)
**Vấn đề hiện tại:** Tiered Executor chỉ hoạt động trên 1 tab. Mở 3 tab render cùng lúc sẽ dội bom API (API Bombing).
**Kỹ thuật nghiên cứu:**
*   **BroadcastChannel API:** Tạo một kênh giao tiếp nội bộ giữa các tab trình duyệt (`new BroadcastChannel('gemini_queue')`).
*   **Distributed Lock (Khóa phân tán):** Khi Tab A chuẩn bị gọi API Video (tốn kém), nó gửi tín hiệu `LOCK_VIDEO_TIER`. Tab B nhận được sẽ tự động đưa tác vụ Video của nó vào trạng thái `WAITING_FOR_OTHER_TAB`. Khi Tab A xong, gửi `UNLOCK`, Tab B mới bắt đầu chạy.
*   **SharedWorker (Alternative):** Đưa toàn bộ logic của `Tiered Executor` vào một `SharedWorker`. Tất cả các tab sẽ gửi message đến Worker này, Worker sẽ duy trì một hàng đợi (Queue) duy nhất cho toàn bộ trình duyệt.

### 4. Giao diện Bất đồng bộ (Non-blocking UX & Task Tray)
**Vấn đề hiện tại:** Render Video (Veo 3.1) khóa màn hình quá lâu.
**Kỹ thuật nghiên cứu:**
*   **Background Task Manager:** Thiết kế một UI Component dạng "Khay hệ thống" (Task Tray) ở góc màn hình.
*   **Detached Execution:** Khi người dùng bấm Render Video, tác vụ được đẩy vào Task Tray. Màn hình chat chính được giải phóng ngay lập tức để người dùng có thể chat tiếp hoặc làm việc khác.
*   **Picture-in-Picture (PiP) Notifications:** Khi video render xong, hiển thị một Toast Notification có kèm video preview nhỏ, bấm vào để xem full.

### 5. Kiến trúc Full-Stack (Bảo mật API Key)
**Vấn đề hiện tại:** API Key nằm ở Frontend.
**Kỹ thuật nghiên cứu:**
*   **Express + Vite Integration:** Chuyển đổi dự án sang mô hình Full-Stack. Sử dụng Express.js làm Backend proxy.
*   **BFF (Backend-For-Frontend):** Frontend không gọi trực tiếp Google GenAI SDK. Thay vào đó, gọi `POST /api/generate`. Backend Express sẽ giữ API Key, thực hiện gọi Google API, và stream kết quả (Server-Sent Events - SSE) về lại Frontend.
*   **Lợi ích:** Bảo mật tuyệt đối API Key, có thể tích hợp Database thật (Firestore/PostgreSQL) sau này để lưu trữ tài khoản người dùng.

---

### LỘ TRÌNH TRIỂN KHAI ĐỀ XUẤT (V12 ROADMAP)

*   **Phase 1 (Hạ tầng):** Triển khai IndexedDB Blob Storage và dọn dẹp RAM.
*   **Phase 2 (Đồng bộ):** Tích hợp BroadcastChannel cho Tiered Executor.
*   **Phase 3 (Trải nghiệm):** Xây dựng Background Task Manager (Task Tray) cho Video/Batch.
*   **Phase 4 (Bảo mật & Phục hồi):** Xây dựng Checkpointing System cho Pipeline. (Tùy chọn: Chuyển đổi Full-Stack nếu có yêu cầu bảo mật cấp doanh nghiệp).
