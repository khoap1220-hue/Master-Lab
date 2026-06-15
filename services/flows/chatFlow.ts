
import { GenerateContentResponse, Part } from "@google/genai";
import { getAI, callWithRetry } from '../../lib/gemini';
import { SmartAction, ChatMessage, MemoryInsight } from '../../types';
import { cleanJson } from '../orchestrator/utils';
import { optimizeImagePayload } from '../../lib/utils';
import { LANGUAGE_PROTOCOL } from '../prompts';
import { MODELS } from '../../config/models';

export const executeChatFlow = async (
  currentInput: string, 
  history: ChatMessage[], 
  memory: MemoryInsight
) => {
  const ai = getAI();
  const model = MODELS.TEXT_PRIMARY; // Multimodal Pro Model
  
  // 1. EXTRACT VISUAL CONTEXT (Smart Selection)
  let visualContextBase64: string | undefined = undefined;
  
  // Check if currentInput mentions a specific image
  const mentions = currentInput.match(/@([a-zA-Z0-9-]+)/gi);
  if (mentions && mentions.length > 0) {
      const label = mentions[0].replace('@', '').trim().toUpperCase();
      const foundMsg = [...history].reverse().find(msg => msg.imageLabel && msg.imageLabel.toUpperCase() === label);
      if (foundMsg && foundMsg.image) visualContextBase64 = foundMsg.image;
  }

  // Fallback to latest image if no mention
  if (!visualContextBase64) {
      for (let i = history.length - 1; i >= 0; i--) {
          const msg = history[i];
          if (msg.image && !msg.imageExpired) {
              visualContextBase64 = msg.image;
              break; 
          }
      }
  }

  // 2. Build Text Context (Last 10 turns)
  const recentHistory = history.slice(-10).map(msg => 
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${(msg.text || "").substring(0, 300)}...`
  ).join('\n');

  const instruction = `
    [SYSTEM ROLE: SENIOR CREATIVE STRATEGIST & CHIEF EMPATHY OFFICER]
    
    ${LANGUAGE_PROTOCOL}

    *** NEURAL LOGIC CENTER INTEGRATION ***
    You are connected to a persistent memory core called "Neural Logic Center".
    You must use the data below to personalize your response.
    
    CRITICAL INSTRUCTION: Read between the lines. Understand the user's emotional state, their unstated goals, and the psychological drivers behind their request. Respond with deep empathy, demonstrating that you truly understand *why* they need this, not just *what* they are asking for.
    
    LOGIC STATE:
    - Current Creative Drift (Creativity Level): ${memory.semanticKB?.creativeDrift}/10
    - Aesthetic Phase: ${memory.semanticKB?.aestheticEvolution || 'N/A'}
    - Key Style Trends: ${memory.semanticKB?.styleTrends?.join(', ') || 'None'}
    - Strategic Goals: ${memory.semanticKB?.strategicGoals?.join(', ') || 'None'}
    
    ${visualContextBase64 ? "- VISUAL CONTEXT: An image is attached." : "- No active visual context."}
    
    CONVERSATION HISTORY:
    ${recentHistory}
    
    CURRENT USER INPUT: "${currentInput}"
    
    TASK:
    1. Analyze user intent and emotional state.
    2. CONSULT THE NEURAL LOGIC: How does the current 'Drift' or 'Phase' affect your answer? 
       (e.g., if Drift is high, suggest wild ideas. If low, be safe).
    3. Provide a helpful, deeply empathetic, and professional response matching the USER'S LANGUAGE. Acknowledge their underlying needs.
    4. Suggest "Smart Actions" that align with their psychological profile and goals.
    
    OUTPUT JSON FORMAT:
    {
      "reply": "Conversational, empathetic response (Matched Language)...",
      "neural_trace": {
         "driftUsed": ${memory.semanticKB?.creativeDrift || 5},
         "memoryAccessed": ["List 1-2 keywords from SemanticKB used here"],
         "adaptationStrategy": "Briefly explain how you adapted to the user style and emotional state",
         "userEmotionDetected": "The emotional state you detected (e.g., Frustrated, Excited, Urgent)",
         "confidence": 0.95
      },
      "suggested_actions": [ { "id": "...", "label": "...", "icon": "...", "prompt": "...", "type": "..." } ]
    }
  `;

  try {
    const parts: Part[] = [{ text: instruction }];
    
    if (visualContextBase64) {
        const optImage = await optimizeImagePayload(visualContextBase64, 'vision');
        parts.push({ 
            inlineData: { 
                mimeType: "image/png", 
                data: optImage.split(',')[1] 
            } 
        });
        console.log("[ChatFlow] Attached Visual Context to Prompt");
    }

    let usedModel: string = model;
    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          
          
        }
      }),
      2, 1000, model, undefined, 600000, false, (m) => usedModel = m
    );

    const data = JSON.parse(cleanJson(response.text || "{}"));

    const smartActions = (data.suggested_actions && data.suggested_actions.length > 0) 
      ? data.suggested_actions 
      : [];

    return {
        text: data.reply || "I am ready to assist with your next design.",
        image: undefined,
        sources: [],
        smartActions: smartActions as SmartAction[],
        structuredBrief: undefined,
        audienceProfile: undefined,
        meta: {
            agent: 'CreativeStrategist',
            model: usedModel,
            intent: 'CONSULTATION'
        },
        neuralTrace: data.neural_trace // Pass the trace back
    };

  } catch (e: any) {
    console.error("Chat Flow Error:", e);
    
    // Re-throw 403 errors so they can be handled by the caller (useChat)
    if (e.message && e.message.includes('403')) {
        throw e;
    }
    
    return { 
        text: "System syncing thought process. Please clarify your request.", 
        image: undefined, 
        sources: [], 
        smartActions: [],
        structuredBrief: undefined,
        audienceProfile: undefined
    };
  }
};
