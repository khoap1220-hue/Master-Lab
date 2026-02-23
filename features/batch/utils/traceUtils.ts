
// --- VECTOR TRACING DISABLED FOR PERFORMANCE ---
// The user requested removal of vector/trace logic to prevent system lag.
// These functions are now stubs to maintain type compatibility without executing heavy logic.

export const FONT_SCALE = 1.95; 

export async function extractMoldsWithOpenCV(imageUrl: string, charSet: string): Promise<Array<{char: string, moldUrl: string, pixelWidth?: number}>> {
    console.warn("Vector extraction is disabled for performance.");
    return [];
}

export async function traceMold(moldUrl: string, char: string, targetWidth?: number): Promise<{id: string, char: string, path: string, width: number} | null> {
    console.warn("Vector tracing is disabled for performance.");
    return null;
}

export function parseSVGPathRobust(d: string): any[] {
    return [];
}
