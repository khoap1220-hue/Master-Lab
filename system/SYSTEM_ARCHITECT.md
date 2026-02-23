
# HỒ SƠ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECT BLUEPRINT)
## DỰ ÁN: TIỆM ẢNH TỨC THỜI (VISUAL EMPATHY ASSISTANT)

**Phiên bản:** 9.3.0
**Codename:** Flow-State-Architect
**Vai trò:** Tài liệu tham chiếu kỹ thuật (Engineering Reference)
**Ngôn ngữ Core:** TypeScript / React / Gemini SDK

---

### I. TỔNG QUAN KIẾN TRÚC (HIGH-LEVEL ARCHITECTURE)

Hệ thống vận hành theo mô hình **Service-First Client Orchestration**. Logic nghiệp vụ được tách biệt hoàn toàn khỏi UI State.

#### Sơ đồ luồng dữ liệu (Data Flow):
```
[USER INPUT + BRAND KIT] 
    ⬇
[HOOKS LAYER] (UI State Only)
    ├── useChat (Message Stream)
    ├── useAutomation (Workflow State)
    └── useEditorFlow (Canvas State)
    ⬇ ⚡ (Delegation)
[ORCHESTRATOR SERVICES] (Business Logic Brain)
    ├── automationOrchestrator.ts (Quy trình Branding/SOP/Batch)
    ├── editorOrchestrator.ts (Điều phối sửa ảnh/Masking/Mockup)
    └── orchestratorService.ts (Chiến lược ngành dọc)
    ⬇
[TIERED EXECUTOR] (Global Queue & Rate Limit)
    ⬇
[AGENT LAYER] (Specialized Workers)
    ├── MasterOrchestrator (Lập chiến lược)
    ├── UXDirector (Product/User Flow Architect) [NEW]
    ├── VideoEngine (Veo 3.1 Neural Extension)
    ├── PixelSmith (Thao tác điểm ảnh & 360 Gen)
    └── ContextVision (Phân tích vật thể)
    ⬇
[GEMINI 3 API] (Google Cloud / AI Studio)
```

---

### II. GIAO THỨC SAO (SEQUENTIAL-AGENT ORCHESTRATION) - v4.1

Nâng cấp để hỗ trợ **Deep Thinking**, **Economic Safety** và **Context Injection**:

1.  **Identity Injection:** Brand Kit (Màu sắc, Vibe) được tiêm (Inject) trực tiếp vào Context của mọi Agent để đảm bảo tính nhất quán thương hiệu.
2.  **Thinking Phase:** Agent chiến lược (Gemini 3 Pro) sử dụng `thinkingBudget: 32000` để lập kế hoạch chi tiết trước khi thực thi.
3.  **Safety Lock:** Các tác vụ tốn kém (Video Render) được bảo vệ bởi Mutex Lock ở tầng UI.
4.  **Retina Rendering:** Canvas sử dụng cơ chế Double-Buffering (Offscreen Canvas) để đảm bảo độ sắc nét trên màn hình High-DPI mà không chặn Main Thread.

---

### III. HỆ THỐNG ĐIỀU PHỐI HIỆU SUẤT (IPC v5.0.1)

| Tier Name | Model sử dụng | Delay (ms) | Mục đích |
| :--- | :--- | :--- | :--- |
| **HEAVY** | Gemini 3 Pro | 8,000 | Phân tích sâu, 4K Upscale, Strategy Planning (Deep Think), UX Architecture. |
| **VIDEO** | Veo 3.1 Fast | 10,000 | Render video nối tiếp (Sequential Render). |
| **BATCH** | Gemini 2.5 Flash | 1,500 | 360 Product Shoot (Throttled), UX Screen Generation (Parallel). |
| **MEDIUM** | Gemini 2.5 Flash | 2,000 | Image Edit, Masking, Keyframe generation. |
| **LIGHT** | Gemini 3 Flash | 500 | Chat, Context ID, Brainstorming. |

---

### IV. YÊU CẦU PHÁT TRIỂN BẮT BUỘC (MANDATES)

1.  **Service Isolation:** Không viết logic gọi API trong `useEffect`. Phải thông qua Service Orchestrator.
2.  **Retina Ready:** Mọi thao tác Canvas phải hỗ trợ `devicePixelRatio`.
3.  **Undo/Redo:** Mọi thao tác chỉnh sửa hủy hoại (Destructive Edit) phải có Stack History.
4.  **Brand Consistency:** Mọi lệnh sinh ảnh (Image Gen) phải kiểm tra xem có Brand Context (Color/Vibe) hay không trước khi gửi Prompt.

---
*Tài liệu này dành cho Kỹ sư trưởng và đội ngũ bảo trì hệ thống.*
