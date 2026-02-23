
# TÀI LIỆU HỆ THỐNG TỔNG THỂ - TIỆM ẢNH TỨC THỜI
## (MASTER SYSTEM DOCUMENTATION - VISUAL EMPATHY ASSISTANT)

**Phiên bản:** 8.6.0 (Optimization-Prime)
**Codename:** Optimization-Prime
**Ngày cập nhật:** 2025-06-30
**Trạng thái:** Production Ready - High Performance

---

### I. TÀI LIỆU YÊU CẦU SẢN PHẨM (FRD)

Hệ thống tuân thủ nghiêm ngặt các tiêu chuẩn v8.6:

1.  **360° Product Consistency:** Tính năng chụp sản phẩm 360 độ phải giữ nguyên đặc điểm nhận diện (Màu sắc, Logo, Hình dáng) của sản phẩm gốc thông qua cơ chế `refImage` injection.
2.  **Performance Throttling:** Mọi tác vụ sinh ảnh hàng loạt (Batch Generation) phải tuân thủ giới hạn Rate Limit của API thông qua cơ chế hàng đợi so le (Staggered Queue).
3.  **Lazy Architecture:** Giảm thời gian tải trang đầu tiên (FCP) bằng cách Lazy Load các module nặng (Batch Studio, Editor Canvas).

---

### II. KIẾN TRÚC KỸ THUẬT (TECHNICAL ARCHITECTURE)

*Tham khảo chi tiết tại: `SYSTEM_ARCHITECT.md`*

#### 1. Mô hình Sequential Neural Extension (Video)
- Thay thế việc Render video độc lập bằng Render mở rộng (Extend). Mỗi shot mới là sự kế thừa từ shot cũ về cả không gian và thời gian.

#### 2. Throttled Multi-View Generator (Batch)
- `services/pixel/generation.ts`: Chia nhỏ các yêu cầu sinh ảnh 360 độ thành các tiểu lô (Sub-batches) kích thước 3, có độ trễ 1s giữa các lô.

#### 3. Workflow Orchestrator
- `viral/workflow.ts`: Quản lý vòng đời từ Hook -> Body -> Ending.
- `viral/engine.ts`: Chịu trách nhiệm sáng tạo kịch bản (Strategy).
- `viral/video.ts`: Chịu trách nhiệm thực thi Neural Render (Execution).

---

### III. QUY TẮC TỒN TẠI VĨNH VIỄN (PERSISTENCE)

1.  **Single Source of Truth (SSoT):** Mọi thay đổi về logic Video và Batch Processing phải được cập nhật vào Manifest trước khi triển khai code.
2.  **Fail-Safe:** Nếu Batch Job thất bại do lỗi mạng, trạng thái phải được lưu lại để người dùng Retry mà không mất dữ liệu đã nhập.

---
*Tài liệu này là tài sản vĩnh viễn của Hệ thống Tiệm Ảnh Tức Thời. Không được xóa.*
