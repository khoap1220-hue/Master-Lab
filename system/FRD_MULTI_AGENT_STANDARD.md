
# TÀI LIỆU YÊU CẦU CHỨC NĂNG (FRD) - HỆ SINH THÁI ĐA TÁC VỤ
## (MULTI-AGENT ECOSYSTEM STANDARD SPECIFICATION)

**Dự án:** Tiệm Ảnh Tức Thời (Visual Empathy Assistant)
**Phiên bản:** 1.1 (Updated v9.3.0)
**Phạm vi:** Core v8.3.0 -> Flow v9.3.0
**Ngày lập:** 20/07/2025

---

### I. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

Hệ thống vận hành theo mô hình **"The Neural Agency"** - một công ty sáng tạo ảo nơi các Agent đóng vai trò như các nhân viên chuyên biệt, được điều phối bởi một kiến trúc sư trưởng.

**Nguyên tắc cốt lõi:**
1.  **Specialization (Chuyên môn hóa):** Mỗi Agent chỉ làm giỏi một việc.
2.  **Orchestration (Điều phối):** Không Agent nào làm việc độc lập; tất cả phải qua Router.
3.  **Fallback (Dự phòng):** Nếu Agent cấp cao (Pro) quá tải, Agent cấp thấp (Flash) sẽ thế chỗ.

---

### II. ĐỘI NGŨ NHÂN SỰ HIỆN TẠI (CURRENT ROSTER - v9.3.0)

#### 1. MasterOrchestrator (The Boss)
*   **Module:** `services/orchestratorService` & `router/intentRouter`
*   **Model:** Gemini 3 Pro (Planning) / Flash (Routing)
*   **Chức năng:**
    *   **Intent Classification:** Phân loại ý định (Vẽ, Sửa, Viết, Phân tích) qua Dual-Router.
    *   **Task Decomposition:** Chia nhỏ yêu cầu phức tạp.
    *   **Brand Injection:** Phân phối Brand Kit (Color, Vibe) xuống các Agent con.

#### 2. UXDirector (The Product Manager) - [NEW v9.3]
*   **Module:** `features/batch/logic/agents/uxDirector.ts`
*   **Model:** Gemini 3 Pro Preview (Reasoning)
*   **Chức năng:**
    *   **User Journey Mapping:** Lên kịch bản luồng người dùng (Login -> Home -> Detail).
    *   **Screen Logic:** Quyết định nội dung chi tiết cho từng màn hình UI.
    *   **Adaptive UX:** Điều chỉnh độ phức tạp của giao diện dựa trên đối tượng người dùng (Target Audience).

#### 3. PixelSmith (The Artist)
*   **Module:** `pixelService.ts`
*   **Model:** Gemini 3 Pro Image / Gemini 2.5 Flash Image
*   **Chức năng:**
    *   **Generative Fill:** Chỉnh sửa vùng chọn (Masking) thông minh.
    *   **Neural Mockup:** Nhúng logo vào ảnh thật với vật lý ánh sáng (Compositing).
    *   **Upscale 4K:** Nâng cấp độ phân giải và tái tạo chi tiết.
    *   **UI Rendering:** Vẽ giao diện High-fidelity phẳng (Flat Design) hoặc Mockup 3D.

#### 4. ContextVision (The Eye)
*   **Module:** `services/orchestrator/context.ts`
*   **Model:** Gemini 3 Flash (Vision Profile)
*   **Chức năng:**
    *   **Subject ID:** Xác định danh tính vật thể chính trong <1s.
    *   **Visual Audit:** Kiểm tra chất lượng ảnh đầu vào.

#### 5. FontEngine Squad (The Typographers)
*   **Module:** `features/font-maker/agents/*`
*   **Đội hình:** 6 Agent chuyên biệt xử lý Typography và Vector hóa.

---

### III. ĐỘI NGŨ NHÂN SỰ TƯƠNG LAI (FUTURE ROSTER - v10.0+)

#### 1. MotionMaster (The Animator)
*   **Core Model:** Gemini Veo 3.1
*   **Chức năng:** Tạo video từ ảnh tĩnh, Storyboard-to-Video.

#### 2. VoiceSynergy (The Communicator)
*   **Core Model:** Gemini Live API (WebSocket)
*   **Chức năng:** Giao tiếp thời gian thực, nhận lệnh giọng nói.

#### 3. BrandGuardian (The Keeper)
*   **Core Model:** Vector Database (RAG)
*   **Chức năng:** Ghi nhớ và bảo vệ tính nhất quán của thương hiệu qua các session.

---

### IV. GIAO THỨC GIAO TIẾP (INTER-AGENT PROTOCOL)

#### 1. Cấu trúc lệnh (Task Payload)
```json
{
  "taskId": "UUID-v4",
  "sourceAgent": "MasterOrchestrator",
  "targetAgent": "UXDirector",
  "priority": "HEAVY",
  "context": {
    "intent": "UX_FLOW",
    "brandKit": { "color": "#FF0000", "vibe": "Modern" }
  },
  "payload": {
    "goal": "E-commerce App for GenZ"
  }
}
```

#### 2. Cơ chế Handover (Chuyền bóng)
*   **Sync:** Master -> UXDirector (Lấy kịch bản màn hình).
*   **Parallel Async:** UXDirector -> PixelSmith (Render đồng thời 3-6 màn hình).

---

### V. TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA)

#### 1. Hiệu năng (Performance)
*   **UX Flow Planning:** < 3s.
*   **Screen Render:** < 10s/màn hình (Chạy song song).

#### 2. Chất lượng (Quality)
*   **Brand Match:** UI sinh ra phải đúng màu và vibe đã cấu hình.
*   **Logic:** Các màn hình phải khớp với luồng nghiệp vụ (Ví dụ: Màn hình Chi tiết phải có nút Mua hàng).

---
*Tài liệu này là chuẩn mực kỹ thuật cho hệ sinh thái Multi-Agent v9.3.0.*
