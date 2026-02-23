
import { Type, GenerateContentResponse } from "@google/genai";
import { getAI, callWithRetry } from "../../../lib/gemini";
import { cleanJson } from "../../../services/orchestrator/utils";
import { extractMoldsWithOpenCV, traceMold } from "../../batch/utils/traceUtils";
import { GlyphData } from "../../../types";

// Helper: Create a grid image (Sprite Sheet) from multiple base64 images
// This allows Gemini to verify many glyphs in a single API call (Token efficient)
const createIdentityBatch = async (
  molds: Array<{char: string, moldUrl: string, pixelWidth?: number}>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const cols = 5; 
    const rows = Math.ceil(molds.length / cols);
    const cellSize = 200; 
    
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(""); return; }

    // Fill white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let loadedCount = 0;
    if (molds.length === 0) { resolve(""); return; }

    molds.forEach((mold, idx) => {
        const img = new Image();
        img.onload = () => {
            const c = idx % cols;
            const r = Math.floor(idx / cols);
            // Draw image fit in cell
            ctx.drawImage(img, c * cellSize, r * cellSize, cellSize, cellSize);
            
            // Draw Index Number overlay (Green) for AI to reference
            ctx.fillStyle = "green";
            ctx.font = "bold 40px Arial";
            ctx.fillText(`${idx}`, c * cellSize + 10, r * cellSize + 40);

            loadedCount++;
            if (loadedCount === molds.length) {
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            }
        };
        img.src = mold.moldUrl;
    });
  });
};

// Sub-task: Ask Gemini to identify items in the sprite sheet
const identifyGlyphBatch = async (
  spriteSheet: string, 
  count: number
): Promise<Array<{index: number, identifiedChar: string, status: string}>> => {
    const ai = getAI();
    const model = "gemini-3-flash-preview"; // Use 3.0 Flash for speed & vision accuracy

    const prompt = `
      [SYSTEM ROLE: WAREHOUSE QUALITY CONTROL (QC)]
      TASK: Audit the grid image (Cells 0 to ${count - 1}).
      
      STRICT QC RULES (SINGLE CHAR POLICY):
      1. CHECK DENSITY: Does the cell contain EXACTLY ONE character?
         - If it contains TWO or MORE distinct letters touching or close (e.g., 'AB', 'rn', 'll'), label status as "MERGED".
         - If it contains only a fragment, dot, or stray line, label status as "NOISE".
         - If it contains a complete, single character (including its accent marks), label status as "VALID".
      
      2. IDENTIFY: If status is VALID, tell me the character.
      
      OUTPUT JSON ARRAY:
      [
        { "index": 0, "identifiedChar": "A", "status": "VALID" },
        { "index": 1, "identifiedChar": "MERGED", "status": "MERGED" },
        { "index": 2, "identifiedChar": "NOISE", "status": "NOISE" }
      ]
    `;

    try {
        const response = await callWithRetry<GenerateContentResponse>(
            () => ai.models.generateContent({
                model,
                contents: { 
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "image/jpeg", data: spriteSheet.split(',')[1] } }
                    ]
                },
                config: {
                    responseMimeType: "application/json"
                }
            }), 3, 2000, model
        );
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) {
        console.error("Batch Identity Check Failed", e);
        return [];
    }
};

export const runVectorCleaner = async (
  specimenUrl: string,
  charSet: string,
  onProgress?: (msg: string) => void,
  onGlyphReady?: (glyph: GlyphData) => void
): Promise<GlyphData[]> => {
  
  // 1. EXTRACT MOLDS (Raw Cut)
  if (onProgress) onProgress("[AGENT 5] Cắt thô (Segmentation)...");
  const allMolds = await extractMoldsWithOpenCV(specimenUrl, charSet);
  
  if (allMolds.length === 0) {
    throw new Error("Vector Cleaner: Không tìm thấy ký tự nào.");
  }

  // 2. IDENTITY VERIFICATION (Warehouse Check)
  const BATCH_SIZE = 20;
  const verifiedMolds: Array<{char: string, moldUrl: string, pixelWidth: number}> = [];
  
  if (onProgress) onProgress(`[AGENT 5] Kiểm định kho hàng (${allMolds.length} mẫu)...`);

  for (let i = 0; i < allMolds.length; i += BATCH_SIZE) {
      const batchMolds = allMolds.slice(i, i + BATCH_SIZE);
      const batchSprite = await createIdentityBatch(batchMolds);
      
      // Call Gemini Vision
      const identities = await identifyGlyphBatch(batchSprite, batchMolds.length);

      // Process Results with "Transfer" & "Reject" Logic
      identities.forEach(idResult => {
          const originalMold = batchMolds[idResult.index];
          if (!originalMold) return;

          const { identifiedChar, status } = idResult;

          if (status === 'MERGED') {
              // REJECT: Two chars stuck together (e.g., 'li' becoming one block)
              console.warn(`[Agent 5] Rejected Index ${i + idResult.index}: Merged Artifact.`);
          } 
          else if (status === 'NOISE' || identifiedChar === 'NOISE') {
              // REJECT: Garbage
          } 
          else {
              // VALID -> TRANSFER TO CORRECT SLOT
              verifiedMolds.push({
                  char: identifiedChar, // Use the detected char identity
                  moldUrl: originalMold.moldUrl,
                  pixelWidth: originalMold.pixelWidth || 600
              });
          }
      });
      
      if (onProgress) onProgress(`[AGENT 5] Đã phân loại ${Math.min(i + BATCH_SIZE, allMolds.length)}/${allMolds.length}...`);
  }

  // 3. TRACE (Vectorize only verified items)
  if (onProgress) onProgress(`[AGENT 5] Vector hóa ${verifiedMolds.length} mẫu sạch...`);
  const finalGlyphs: GlyphData[] = [];

  for (let j = 0; j < verifiedMolds.length; j++) {
    const item = verifiedMolds[j];
    try {
        const traced = await traceMold(item.moldUrl, item.char, item.pixelWidth);
        if (traced) {
            finalGlyphs.push(traced);
            if (onGlyphReady) onGlyphReady(traced);
        }
    } catch (traceErr) {
        console.warn(`Failed to trace char ${item.char}`, traceErr);
    }
    await new Promise(r => setTimeout(r, 5)); // Yield UI
  }

  // 4. DEDUPLICATE (Consolidate Warehouse)
  const uniqueGlyphs = finalGlyphs.reduce((acc, current) => {
      const existing = acc.find(g => g.char === current.char);
      if (!existing) {
          acc.push(current);
      } else {
          // If duplicate found, keep the one with wider width (heuristic for completeness)
          if (current.width > existing.width) {
              const idx = acc.indexOf(existing);
              acc[idx] = current;
          }
      }
      return acc;
  }, [] as GlyphData[]);

  return uniqueGlyphs;
};
