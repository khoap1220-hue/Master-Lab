
# HỒ SƠ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECT BLUEPRINT)
## DỰ ÁN: TIỆM ẢNH TỨC THỜI (VISUAL EMPATHY ASSISTANT)

**Phiên bản:** 11.0
**Codename:** Agentic-Workflow-Architect
**Vai trò:** Tài liệu tham chiếu kỹ thuật (Engineering Reference)
**Ngôn ngữ Core:** TypeScript / React / Gemini SDK

---

### I. TỔNG QUAN KIẾN TRÚC (HIGH-LEVEL ARCHITECTURE)

Hệ thống vận hành theo mô hình **Agentic Workflow & Intelligent Pipeline**. Logic nghiệp vụ được tách biệt hoàn toàn khỏi UI State.

#### Sơ đồ luồng dữ liệu (Data Flow):
```
[USER INPUT + BRAND KIT] 
    ⬇
[HOOKS LAYER] (UI State Only)
    ├── useChat (Message Stream)
    ├── useAutomation (Workflow State)
    └── useEditorFlow (Canvas State)
    ⬇ ⚡ (Delegation)
[ORCHESTRATOR SERVICES] (Intelligent Pipeline)
    ├── automationOrchestrator.ts (Quy trình Branding/SOP/Batch)
    ├── editorOrchestrator.ts (Điều phối sửa ảnh/Masking/Mockup)
    └── projectFlow.ts (Định tuyến chiến lược)
    ⬇
[TIERED EXECUTOR] (Global Queue & Rate Limit)
    ⬇
[AGENT LAYER] (Specialized Workers)
    ├── MasterOrchestrator (Lập chiến lược - Gemini 3.1 Pro)
    ├── UXDirector (Product/User Flow Architect)
    ├── VideoEngine (Veo 3.1 Neural Extension)
    ├── PixelSmith (Thao tác điểm ảnh & 360 Gen - Gemini 3.1 Flash Image)
    └── ContextVision (Phân tích vật thể)
    ⬇
[GEMINI 3.1 API] (Google Cloud / AI Studio)
```

---

### II. GIAO THỨC SAO (SEQUENTIAL-AGENT ORCHESTRATION) - v5.0

Nâng cấp để hỗ trợ **Intelligent Pipeline**, **Deep Research** và **Pre-Audit**:

1.  **Deep Research:** Hệ thống tự động phân tích chuyên sâu ý tưởng thô bằng `Gemini 3.1 Pro` với `ThinkingLevel.HIGH` để mở rộng ngữ cảnh.
2.  **Strategic Auto-Routing:** Tự động gọi đúng Agent chuyên gia (Logo, Packaging, Marketing, UX/UI) để lập kế hoạch chiến lược (Structured Brief & Visual Prompt).
3.  **Pre-Audit System:** Chấm điểm độ trưởng thành (Maturity Score) của bản chiến lược trước khi tốn tài nguyên render ảnh.
4.  **Context-Aware Execution:** Tự động chèn Mode Modifiers (VD: `[PAGE 1/40]`, `[ASSET VARIATION 1]`) vào prompt để đảm bảo tính nhất quán trong Batch Generation.
5.  **Safety Lock:** Các tác vụ tốn kém (Video Render, 4K Image) được bảo vệ bởi Mutex Lock ở tầng UI và Tiered Executor.

---

### III. HỆ THỐNG ĐIỀU PHỐI HIỆU SUẤT (TIERED EXECUTOR)

| Tier Name | Model sử dụng | Delay (ms) | Mục đích |
| :--- | :--- | :--- | :--- |
| **STRATEGY_PLANNING** | Gemini 3.1 Pro | 8,000 | Phân tích sâu, Lập kế hoạch chiến lược, UX Architecture, Deep Research. |
| **VIDEO_GEN** | Veo 3.1 | 10,000 | Render video nối tiếp (Sequential Render). |
| **IMAGE_GEN_4K** | Gemini 3.1 Flash Image | 5,000 | Sinh ảnh 4K, Upscale chất lượng cao. |
| **IMAGE_GEN_BATCH** | Gemini 3.1 Flash Image | 2,000 | 360 Product Shoot, Batch Generation, UI Screens. |
| **ANALYSIS_FAST** | Gemini 3.1 Flash | 500 | Chat, Context ID, Brainstorming, Pre-Audit. |

---

### IV. YÊU CẦU PHÁT TRIỂN BẮT BUỘC (MANDATES)

1.  **Service Isolation:** Không viết logic gọi API trong `useEffect`. Phải thông qua Service Orchestrator.
2.  **Agentic Mindset:** Mọi tính năng mới nên được thiết kế theo luồng: Research -> Plan -> Audit -> Execute.
3.  **Undo/Redo:** Mọi thao tác chỉnh sửa hủy hoại (Destructive Edit) phải có Stack History.
4.  **Brand Consistency:** Mọi lệnh sinh ảnh (Image Gen) phải kiểm tra xem có Brand Context (Color/Vibe) hay không trước khi gửi Prompt.

---
*Tài liệu này dành cho Kỹ sư trưởng và đội ngũ bảo trì hệ thống.*
