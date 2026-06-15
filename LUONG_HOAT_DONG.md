# 🌌 Tiệm Ảnh Tức Thời (AI Creative Studio) - Tài liệu Luồng Hoạt động Hệ thống

Tài liệu này mô tả chi tiết kiến trúc, các luồng nghiệp vụ cốt lõi, và cơ chế tự động hóa thông minh (**Agentic Workflow & Intelligent Pipeline**) đang vận hành trong hệ thống **Tiệm Ảnh Tức Thời (Visual Empathy Assistant) v11.0**.

---

## 1. ⚙️ Quy trình Đồng bộ hóa & Xác thực API Key (Mới cập nhật)

Hệ thống hỗ trợ cơ chế xác thực kết hợp (Hybrid Authentication) linh hoạt giữa môi trường máy chủ (Server-side) và môi trường tích hợp Google AI Studio (Client-side) nhằm đảm bảo chế độ hoạt động chuyên nghiệp (Pro Mode):

```
       ┌────────────────────────────────────────────────────────┐
       │                 Bắt đầu kiểm tra API Key               │
       └───────────────────────────┬────────────────────────────┘
                                   │
                     Is GEMINI_API_KEY configured?
                                   ├──────────────────────────┐
                                   │ Có                       │ Không
                                   ▼                          ▼
                       ┌──────────────────────┐  Is window.aistudio available?
                       │  hasApiKey = true    │               ├──────────────────────────┐
                       │  (Chế độ Pro tự động) │               │ Có                       │ Không
                       └───────────┬──────────┘               ▼                          ▼
                                   │              ┌────────────────────────┐         ┌──────────────────────┐
                                   │              │ Gọi: hasSelectedApiKey │         │  hasApiKey = true    │
                                   │              └───────────┬────────────┘         │  (Fallback mặc định) │
                                   │                          │                      └───────────┬──────────┘
                                   │                Is Key Selected?                     │
                                   │               ┌──────────┴──────────┐               │
                                   │               │ Có                  │ Không         │
                                   ▼               ▼                     ▼               ▼
                      ┌────────────────────────────────────────────────────────────────────┐
                      │    Cập nhật UI & Lưu trạng thái: Pro Mode vs. Free Mode            │
                      └────────────────────────────────────────────────────────────────────┘
```

### Cơ chế hoạt động:
1. **Kiểm tra môi trường máy chủ (`GEMINI_API_KEY`)**: 
   - Khi khởi động, hệ thống kiểm tra sự hiện diện của biến môi trường bí mật `process.env.GEMINI_API_KEY` ở backend. 
   - Nếu có, hệ thống tự động xác nhận chế độ Pro (Pro Mode), hiển thị thông điệp: *"Đang sử dụng chế độ Pro (Đã kết nối API Key tự động từ Google AI Studio)."*
2. **Liên kết Client-side với Google AI Studio (`window.aistudio`)**:
   - Nếu không có khoá máy chủ, ứng dụng kiểm tra môi trường nhúng của Google AI Studio bằng phương thức `window.aistudio.hasSelectedApiKey()`.
   - Nếu người dùng đã chọn/kết nối khóa thành công, trạng thái khóa của dự án sẽ được ghi nhận và lưu dưới `localStorage` để tối ưu hóa hiệu năng trong suốt phiên làm việc.
3. **Bỏ qua Xác thực cho Tác vụ Nâng cao (Ví dụ: Veo Video Rendering)**:
   - Các luồng xử lý video nâng cao (như phim ngắn, kịch bản reels) trong `/features/batch/logic/viral/video.ts` được tối ưu hóa: Nếu phát hiện khóa máy chủ `GEMINI_API_KEY` đã được cấu hình và hoạt động tốt, hệ thống sẽ bỏ qua bước cảnh báo thiếu khóa thủ công và tiến hành kết xuất thẳng qua Gemini API để không cắt đứt trải nghiệm của người dùng.

---

## 2. 🧠 Luồng Agentic Workflow & Intelligent Pipeline

Một trong những thiết kế cốt lõi của Tiệm Ảnh Tức Thời v11.0 là mô hình **Agentic Co-op (Hợp tác Tác tử)**, định hướng công việc theo luồng phân rã tự động:

```
Ý tưởng thô ──► [Deep Research] ──► [Strategic Auto-Routing] ──► [Pre-Audit SYSTEM] ──► [Context-Aware Execution]
                 (Gemini 3.1 Pro)    (Lựa chọn Agent chuyên gia)    (Maturity Score)       (Batch Image Engine)
```

### Bước 1: Deep Research (Nghiên cứu Nghiệp vụ & Thương hiệu)
- **Tác vụ**: Đón nhận mô tả ngắn từ phía khách hàng và làm giàu ngữ cảnh nền tảng.
- **Vận hành**: Sử dụng **Gemini 3.1 Pro** với cấp độ suy nhẫm cao (`ThinkingLevel.HIGH`) để mở rộng ý tưởng thành một phong cách nghệ thuật, bảng màu (primary, secondary, accent-colors) và các định hướng chiến lược bán hàng thực tế.

### Bước 2: Strategic Auto-Routing (Định hướng Kế hoạch Tự động)
- **Tác vụ**: Khởi tạo bản tóm tắt sản xuất thiết kế (Structured Brief).
- **Vận hành**: Module `projectFlow.ts` hoạt động như một bộ định tuyến chính xác, tự động bàn giao tài liệu cho các Agent đầu ngành tương ứng dựa trên danh mục dự án:
  - **Logo Design Agent (`planLogoDesign`)**: Tập trung vào biểu tượng, tính tương phản và tính đối xứng.
  - **Packaging Agent (`planPackagingProject`)**: Định hình cấu trúc 3 chiều (W x H x D), vật liệu vỏ ngoài và bố cục mặt trước/sau.
  - **Marketing Agent (`planMarketingCampaign`)**: Thiết kế thông điệp quảng cáo, nhóm đối tượng mục tiêu, và chiến dịch truyền thông đa kênh.

### Bước 3: Pre-Audit System (Thẩm định Chất lượng Kế hoạch)
- **Tác vụ**: Chấm điểm mức độ sẵn sàng thực tế (Maturity Score) của kế hoạch trước khi tiến hành vẽ ảnh.
- **Vận hành**: Hệ thống chuyển bản thảo chiến lược qua hàm kiểm tra `evaluateMaturity`. Điểm số được xếp hạng từ `A+` đến `D` kèm các tiêu chí chi tiết giúp thiết kế viên nắm bắt các điểm yếu cần tối ưu thêm.

### Bước 4: Context-Aware Execution (Kết xuất Đa bối cảnh)
- **Tác vụ**: Sinh bộ ảnh đồng nhất nhưng đa dạng góc độ/phiên bản.
- **Vận hành**: Tận dụng **Gemini 3.1 Flash Image** kết hợp với các bộ tăng sửa ngữ cảnh ("Mode Modifiers", ví dụ: `[PAGE X/Y]`, `[ASSET VARIATION Z]`) để đảm bảo các tệp tin hình ảnh sinh ra trong cùng một lượt xử lý hàng loạt có sự thống nhất về mặt thương điệu nhưng không bị trùng lặp thiết kế.

---

## 3. 🧩 Luồng Xử lý Hàng loạt của Batch Studio

**Batch Studio** là trung tâm sản xuất tự động công suất cao, hỗ trợ quản lý hiệu năng cực kỳ chặt chẽ:

### Cơ chế Lưu trữ & Khôi phục (Resilience & Memory Hygiene)
- **Bền vững dữ liệu**: Toàn bộ tiến trình làm việc và dữ liệu nhị phân (Blobs/Files) của các tác vụ thiết kế (`BatchJob`) đều được tự động lưu trữ xuống trình duyệt thông qua **IndexedDB** (`idb-keyval`).
- **Khôi phục thông minh**: Khi trang ứng dụng bị làm mới (F5) hoặc kết nối bị gián đoạn, hệ thống tự động quét các tác vụ có trạng thái lơ lửng (`preprocessing`, `rendering_video`, v.v.), chuyển chúng về trạng thái lỗi `failed` kèm thông điệp khôi phục tinh tế, đồng thời **tạo mới toàn bộ Object URLs** từ dữ liệu nhị phân thô gốc (Blobs) được nén trong IndexedDB để tránh hiện tượng rò rỉ bộ nhớ hoặc chết liên kết tĩnh.

### Trung tâm Kiểm soát Tài nguyên (Tiered Executor)
Mọi cuộc gọi AI đều phải khai báo và đăng ký thông qua cơ chế quản trị tập trung `executeManagedTask` thuộc thư viện `/lib/tieredExecutor.ts`. Các tầng phân hạng bao gồm:
*   **Tier BATCH**: Dành cho tác vụ sinh ảnh song song với giới hạn concurrency nghiêm ngặt để cân bằng Rate-limit của API.
*   **Tier VIDEO_GEN**: Tác vụ sản xuất video đòi hỏi tính toán khóa Mutex đơn nhất tại một thời điểm để giữ an toàn tài nguyên.

---

## 4. 📹 Luồng Tạo Video & Viral Story Master

Khi hoạt động trong chế độ thiết kế nội dung lan truyền (Viral Story & Video Workflows):

1. **Khởi tạo Kịch bản & Visual Hook**: Hệ thống phân tích đối tượng từ nền tảng mạng xã hội đã chọn (TikTok, Instagram, v.v.) rồi đề xuất 3 dạng kịch kịch bản/hook ngắn độc đáo.
2. **Sinh Visual Quote & Ý tưởng Cảnh**: Tạo ra các câu trích dẫn thiết kế dạng đồ họa nghệ thuật (`generateQuoteVisual`).
3. **Kết xuất Chuyển động (Veo 3.1)**: Biến hóa bức ảnh tĩnh trung tâm thành phim ngắn sống động thông qua tiến trình `generateVeoVideo`.

---

## 5. 🛠️ Bản đồ Phân bổ Mã nguồn (System Modules Map)

Các nhóm tệp tin cộng tác với nhau theo một trật tự kiến trúc chuẩn hóa:

*   `/types/index.ts`: Định nghĩa hệ thống loại dữ liệu vững chắc (`BatchJob`, `ProcessStatus`, `ViralStoryPlan`, `MaturityScore`).
*   `/features/batch/BatchStudio.tsx`: Giao diện tương tác máy tính, quản lý các thông số thiết kế (dimensions, style, brand asset).
*   `/features/batch/hooks/useBatchProcessing.ts`: Bộ điều khiển trung tâm quản lý hàng đợi, đồng bộ IndexedDB và kích hoạt các Agent xử lý.
*   `/features/batch/logic/`: Thư mục chứa các bộ xử lý chuyên môn hóa cho từng kịch bản nghiệp vụ:
    - `productShootProcessor.ts`: Ráp phôi sản phẩm trong không gian 3D bối cảnh mới.
    - `adCampaignProcessor.ts`: Tách xuất nội dung và thiết kế banner quảng cáo hàng loạt.
    - `floorplanProcessor.ts`: Vẽ và phân tích sơ đồ sàn.
    - `viral/video.ts`: Tác vụ kết xuất hình ảnh/video qua Veo 3.1 và quản trị khóa API Key.
    - `viral/workflow.ts`: Tiến trình thiết lập kịch bản mạng xã hội.

---
*Bản quyền phát triển thuộc về Tiệm Ảnh Tức Thời © 2026. Tối ưu hóa trên nền tảng Google Gemini API tiên tiến.*
