
import { GenerateContentResponse } from "@google/genai";
import { ChatMessage, MemoryInsight } from "../types";
import { getAI, callWithRetry } from "../lib/gemini";
import { createEvent, saveEvent } from "./registryService"; // Import Registry
import { cleanJson } from "./orchestrator/utils";
import { MODELS } from "../config/models";

const MEMORY_KEY = "VISUAL_EMPATHY_MASTER_MEMORY_V6";
export const NEURAL_MEMORY_EVENT = 'NEURAL_MEMORY_UPDATE';

export const saveMemoryToLocal = (insight: MemoryInsight) => {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(insight));
    // Notify UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(NEURAL_MEMORY_EVENT));
    }
  } catch (e) {
    console.warn("Storage quota exceeded, could not save memory.", e);
  }
};

export const clearMemory = () => {
  localStorage.removeItem(MEMORY_KEY);
};

export const loadMemoryFromLocal = (): MemoryInsight | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(MEMORY_KEY);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const distillMemory = async (
  currentHistory: ChatMessage[],
  previousInsight?: MemoryInsight
): Promise<MemoryInsight> => {
  const ai = getAI();
  const primaryModel = MODELS.TEXT_FAST; // Use FAST model for memory distillation to save tokens
  const backupModel = MODELS.TEXT_PRIMARY; 

  // Reduce history to last 10 messages to save tokens
  const historyData = currentHistory.slice(-10).map(m => ({
    role: m.role.toUpperCase(),
    text: m.text.substring(0, 500) // Truncate long texts
  }));

  const prompt = `
    [ROLE: MEMORY KEEPER]
    OLD MEMORY: ${JSON.stringify(previousInsight || {})}
    NEW INTERACTIONS: ${JSON.stringify(historyData)}
    
    Update 'Semantic Knowledge Base'.
    - currentFocus: What is the user working on NOW?
    - styleTrends: Keywords about visual style mentioned.
    - aestheticEvolution: How has the design direction changed?
    - strategicGoals: What are they trying to achieve?
    
    OUTPUT JSON ONLY.
  `;

  try {
    const config = {
      responseMimeType: "application/json"
    };

    const startTime = Date.now();

    const performPrimary = () => ai.models.generateContent({
        model: primaryModel,
        contents: { parts: [{ text: prompt }] },
        config
    });

    const performBackup = () => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }] },
        config 
    });

    const response = await callWithRetry<GenerateContentResponse>(
        performPrimary, 
        2, 
        1000, 
        primaryModel, 
        [performBackup]
    );

    const newInsight = JSON.parse(cleanJson(response.text || "{}"));
    
    // Log event (Registry service will handle Firestore if updated)
    saveEvent(createEvent('MEMORY_DISTILL', { 
        model: primaryModel, 
        latency: Date.now() - startTime, 
        status: 'SUCCESS' 
    }, newInsight));

    return newInsight;
  } catch (error) {
    console.error("Memory Distill Failed:", error);
    return previousInsight || ({} as MemoryInsight);
  }
};

export const getEmpathyInstruction = (insight: MemoryInsight): string => {
  return `
    [INTERNAL_METADATA_DO_NOT_RENDER]
    >> AESTHETIC_PHASE: ${insight.semanticKB?.aestheticEvolution || 'STABLE'}
    >> DRIFT_FACTOR: ${insight.semanticKB?.creativeDrift || 5}
    >> USER_FOCUS: ${insight.currentFocus || 'General'}
    [/INTERNAL_METADATA_DO_NOT_RENDER]
  `;
};
