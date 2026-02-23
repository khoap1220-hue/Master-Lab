
import { Type, GenerateContentResponse, Part } from "@google/genai";
import { getAI, callWithRetry } from '../../lib/gemini';
import { SmartAction, ChatMessage, MemoryInsight } from '../../types';
import { cleanJson } from '../orchestrator/utils';
import { optimizeImagePayload } from '../../lib/utils';
import { LANGUAGE_PROTOCOL } from '../prompts';

export const executeChatFlow = async (
  currentInput: string, 
  history: ChatMessage[], 
  memory: MemoryInsight
) => {
  const ai = getAI();
  const model = "gemini-3.1-pro-preview"; // Multimodal Pro Model
  
  // 1. EXTRACT VISUAL CONTEXT
  let visualContextBase64: string | undefined = undefined;
  
  for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.image && !msg.imageExpired) {
          visualContextBase64 = msg.image;
          break; 
      }
  }

  // 2. Build Text Context (Last 10 turns)
  const recentHistory = history.slice(-10).map(msg => 
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text.substring(0, 300)}...`
  ).join('\n');

  const instruction = `
    [SYSTEM ROLE: SENIOR CREATIVE STRATEGIST & VISUAL PARTNER]
    
    ${LANGUAGE_PROTOCOL}

    *** NEURAL LOGIC CENTER INTEGRATION ***
    You are connected to a persistent memory core called "Neural Logic Center".
    You must use the data below to personalize your response.
    
    LOGIC STATE:
    - Current Creative Drift (Creativity Level): ${memory.semanticKB?.creativeDrift}/10
    - Aesthetic Phase: ${memory.semanticKB?.aestheticEvolution || 'N/A'}
    - Key Style Trends: ${memory.semanticKB?.styleTrends.join(', ') || 'None'}
    - Strategic Goals: ${memory.semanticKB?.strategicGoals.join(', ') || 'None'}
    
    ${visualContextBase64 ? "- VISUAL CONTEXT: An image is attached." : "- No active visual context."}
    
    CONVERSATION HISTORY:
    ${recentHistory}
    
    CURRENT USER INPUT: "${currentInput}"
    
    TASK:
    1. Analyze user intent.
    2. CONSULT THE NEURAL LOGIC: How does the current 'Drift' or 'Phase' affect your answer? 
       (e.g., if Drift is high, suggest wild ideas. If low, be safe).
    3. Provide a helpful, professional response matching the USER'S LANGUAGE.
    4. Suggest "Smart Actions".
    
    OUTPUT JSON FORMAT:
    {
      "reply": "Conversational response (Matched Language)...",
      "neural_trace": {
         "driftUsed": ${memory.semanticKB?.creativeDrift || 5},
         "memoryAccessed": ["List 1-2 keywords from SemanticKB used here"],
         "adaptationStrategy": "Briefly explain how you adapted to the user style (e.g. 'High drift detected, suggesting abstract concept')",
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

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              neural_trace: {
                  type: Type.OBJECT,
                  properties: {
                      driftUsed: { type: Type.NUMBER },
                      memoryAccessed: { type: Type.ARRAY, items: { type: Type.STRING } },
                      adaptationStrategy: { type: Type.STRING },
                      confidence: { type: Type.NUMBER }
                  }
              },
              suggested_actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    type: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["reply", "suggested_actions", "neural_trace"]
          }
        }
      }),
      2, 3000, model
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
            model: 'Gemini 3 Pro Vision',
            intent: 'CONSULTATION'
        },
        neuralTrace: data.neural_trace // Pass the trace back
    };

  } catch (e) {
    console.error("Chat Flow Error:", e);
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
