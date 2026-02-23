
# HỒ SƠ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECT TEMPLATE)
## DỰ ÁN: {{PROJECT_NAME}}

**Phiên bản:** 2.0.0 (Modular Base)
**Codename:** {{CODENAME}}
**Core Model:** Google Gemini 3 (Pro/Flash)
**Kiến trúc:** Client-Side Orchestrated AI (Modular Architecture)

---

### I. CỐT LÕI VẬN HÀNH (CORE PHILOSOPHY)

1.  **Modularization (Mô-đun hóa):** Chia để trị. Tách biệt UI, State và Logic.
2.  **Context (Ngữ cảnh):** AI phải hiểu ngữ cảnh trước khi hành động.
3.  **Resilience (Bền bỉ):** Hệ thống không được sập khi API lỗi (luôn có Fallback).

---

### II. TỔNG QUAN KIẾN TRÚC (HIGH-LEVEL ARCHITECTURE)

#### Sơ đồ luồng dữ liệu (Data Flow):
```
[USER INPUT] 
    ⬇
[HOOKS LAYER] (State Management Only)
    ⬇ ⚡ (Delegation)
[LOGIC PROCESSORS] (Business Logic / Pure Functions)
    ├── processors/batch.ts
    ├── processors/analysis.ts
    └── services/orchestrator/
    ⬇
[TIERED EXECUTOR] (Global Queue & Rate Limit)
    ⬇
[SERVICE LAYER] (API Callers)
    ├── MasterOrchestrator
    ├── ContextOrchestrator
    └── PixelSmith
    ⬇
[AI GATEWAY] (Gemini API)
```

---

### III. CẤU TRÚC THƯ MỤC CHUẨN (STANDARD DIRECTORY)

*   `components/`: Chỉ chứa UI (Presentational Components).
*   `features/`: Chứa các tính năng lớn (Slice), bao gồm Components con và Logic riêng.
*   `hooks/`: Quản lý State và Lifecycle.
*   `services/`: Gọi API và xử lý dữ liệu thô.
*   `types/`: **BẮT BUỘC** chứa toàn bộ Type Definitions (`index.ts`).
*   `lib/`: Các hàm tiện ích dùng chung (Utils, Gemini Client).
*   `system/`: Tài liệu hệ thống.

---

### IV. YÊU CẦU KỸ THUẬT BẮT BUỘC

1.  **Single Source of Truth for Types:** Không khai báo interface rải rác. Import từ `types/index.ts`.
2.  **No Logic in UI:** Component không được chứa logic xử lý dữ liệu phức tạp. Hãy tách ra Hook hoặc Processor.
3.  **Strict Typing:** Không dùng `any`.
4.  **Clean Imports:** Không import vòng tròn.

---
*Template cập nhật theo chuẩn v8.3.0*
