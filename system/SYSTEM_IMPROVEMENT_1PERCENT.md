
# HỒ SƠ TỐI ƯU HÓA TRẢI NGHIỆM (THE FINAL 1% DOCTRINE)
## DỰ ÁN: TIỆM ẢNH TỨC THỜI (VISUAL EMPATHY ASSISTANT)

**Phiên bản:** 9.2.0 (Polished-Gem)
**Ngày lập:** 15/07/2025
**Trạng thái:** Đã triển khai (Deployed)

---

### I. TRIẾT LÝ: "THE FINAL 1%"

Sự khác biệt giữa một sản phẩm "tốt" và một sản phẩm "xuất sắc" nằm ở 1% cuối cùng: những chi tiết vi mô về cảm giác, độ mượt, và sự an tâm của người dùng. Phiên bản v9.2.0 tập trung giải quyết các vấn đề này.

---

### II. CÁC CẢI TIẾN TRỌNG YẾU

#### 1. Cỗ Máy Thời Gian (Universal Undo Protocol)
*   **Vấn đề:** Người dùng sợ vẽ sai Mask vì phải vẽ lại từ đầu.
*   **Giải pháp:**
    *   Cấu trúc dữ liệu: `Stack` (LIFO).
    *   Logic: Snapshot mảng `strokes` trước mỗi lần vẽ.
    *   Tác động: Tăng sự tự tin khi tương tác.

#### 2. Vật Lý Võng Mạc (Retina Physics)
*   **Vấn đề:** Canvas bị mờ, răng cưa trên màn hình iPhone/Mac (High DPI).
*   **Giải pháp:**
    *   **Double Buffering:** Vẽ lên Offscreen Canvas với kích thước thực (Physical Pixels = CSS Pixels * DPR).
    *   **Context Scaling:** Scale tọa độ vẽ để đồng bộ với kích thước hiển thị.
    *   Tác động: Hình ảnh sắc nét, chuyên nghiệp.

#### 3. Khóa An Toàn Kinh Tế (Economic Safety Lock)
*   **Vấn đề:** Người dùng bấm liên tục nút Render Video (Veo) khi mạng lag, gây tốn phí API cực lớn.
*   **Giải pháp:**
    *   **Mutex Lock:** Biến trạng thái `isRendering` khóa cứng nút bấm ngay lập tức.
    *   **Visual Warning:** Hiển thị cảnh báo chi phí (Cost Warning) rõ ràng.
    *   Tác động: Giảm thiểu rủi ro tài chính và lỗi Race Condition.

#### 4. Khởi Động Lại Sạch (Safe Neural Reset)
*   **Vấn đề:** Ứng dụng bị Crash khi Reset do xung đột dữ liệu cũ trong LocalStorage.
*   **Giải pháp:**
    *   **Protocol:** Clear Storage -> Async Wait (500ms) -> `window.location.reload()`.
    *   Tác động: Đảm bảo khả năng phục hồi hệ thống 100%.

---

### III. TIÊU CHUẨN KIỂM ĐỊNH MỚI

Mọi tính năng UI mới liên quan đến Canvas hoặc API tốn kém (Costly API) bắt buộc phải vượt qua các bài test sau:

1.  **DPI Test:** Có sắc nét trên màn hình Retina không?
2.  **Undo Test:** Có thể hoàn tác thao tác không?
3.  **Spam Test:** Bấm liên tục nút hành động có gây ra nhiều request không?

---
*Tài liệu này xác nhận hệ thống đã đạt chuẩn **Polish Level 100%** cho phiên bản v9.2.0.*
