
import { MemoryInsight, WorkflowTask } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";

// MODULE NÀY CHỈ CHỨA LOGIC BÁO CÁO CHUNG (GENERIC REPORTING).
// LOGIC CHUYÊN NGÀNH (PACKAGING, INTERIOR, SIGNAGE) ĐÃ ĐƯỢC TÁCH RA FILE RIÊNG.

export const generateTaskCompletionMessage = async (task: WorkflowTask, projectName: string, memoryInsight: MemoryInsight) => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({ model, contents: `Agent ${task.assignedAgent} đã xong ${task.name}.` });
  return response.text || "Nhiệm vụ hoàn tất.";
};

export const generateWorkflowSummary = async (projectName: string, tasks: WorkflowTask[], memoryInsight: MemoryInsight) => {
  const ai = getAI();
  const model = "gemini-3.1-pro-preview";
  const response = await ai.models.generateContent({ model, contents: `Tổng kết dự án ${projectName}.` });
  return response.text || "Dự án đã kết thúc thành công.";
};
