
import { MemoryInsight, WorkflowTask } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { MODELS } from "../../config/models";

// MODULE NÀY CHỈ CHỨA LOGIC BÁO CÁO CHUNG (GENERIC REPORTING).
// LOGIC CHUYÊN NGÀNH (PACKAGING, INTERIOR, SIGNAGE) ĐÃ ĐƯỢC TÁCH RA FILE RIÊNG.

export const generateTaskCompletionMessage = async (task: WorkflowTask, projectName: string, memoryInsight: MemoryInsight) => {
  const ai = getAI();
  const model = MODELS.TEXT_FAST;
  const response = await callWithRetry<any>(
    () => ai.models.generateContent({ model, contents: `Agent ${task.assignedAgent} đã xong ${task.name}.` }),
    2, 1000, model,
    [] // Empty array for no fallbacks
  );
  return response.text || "Nhiệm vụ hoàn tất.";
};

export const generateWorkflowSummary = async (projectName: string, tasks: WorkflowTask[], memoryInsight: MemoryInsight) => {
  const ai = getAI();
  const model = MODELS.TEXT_FAST;
  const response = await callWithRetry<any>(
    () => ai.models.generateContent({ model, contents: `Tổng kết dự án ${projectName}.` }),
    2, 1000, model,
    [] // Empty array for no fallbacks
  );
  return response.text || "Dự án đã kết thúc thành công.";
};
