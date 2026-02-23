
import { extractMoldsWithOpenCV, traceMold } from "../../batch/utils/traceUtils";
import { GlyphData } from "../../../types";

export const runVectorCleaner = async (
  specimenUrl: string,
  charSet: string,
  onProgress?: (msg: string) => void,
  onGlyphReady?: (glyph: GlyphData) => void
): Promise<GlyphData[]> => {
  
  if (onProgress) onProgress("[AGENT 3] Extracting Molds with OpenCV (Laser Grid)...");
  
  // 1. Extract Images (Molds) from the big sheet using OpenCV
  // Includes "Warehouse Gatekeeper" logic (Smart Noise Filtering)
  const allMolds = await extractMoldsWithOpenCV(specimenUrl, charSet);
  
  if (allMolds.length === 0) {
    throw new Error("Vector Cleaner: Failed to extract any characters.");
  }

  if (onProgress) onProgress(`[AGENT 3] Tracing ${allMolds.length} Vectors...`);

  const finalGlyphs: GlyphData[] = [];

  // 2. Trace Bitmaps to Vectors
  for (let j = 0; j < allMolds.length; j++) {
    const item = allMolds[j];
    try {
        const traced = await traceMold(item.moldUrl, item.char, item.pixelWidth);
        if (traced) {
            finalGlyphs.push(traced);
            if (onGlyphReady) onGlyphReady(traced);
        }
    } catch (traceErr) {
        console.warn(`Failed to trace char ${item.char}`, traceErr);
    }
    
    // Yield to main thread to prevent UI freeze
    await new Promise(r => setTimeout(r, 10));
  }

  return finalGlyphs;
};
