
import opentype from 'opentype.js';
import { parseSVGPathRobust } from "../../batch/utils/traceUtils";
import { GlyphData } from "../../../types";

export const runFontEngineer = async (
  fontName: string,
  glyphsData: GlyphData[]
): Promise<{ url: string, cssFontName: string }> => {
    
    const cssFontName = `NF_${fontName.replace(/\s+/g, '_')}_${Date.now()}`;
    const finalGlyphs: opentype.Glyph[] = [];
    
    // 1. Create .notdef glyph (Required for valid font)
    const notdefPath = new opentype.Path();
    notdefPath.moveTo(100, 0); notdefPath.lineTo(100, 700); notdefPath.lineTo(550, 700); notdefPath.lineTo(550, 0); notdefPath.close();
    finalGlyphs.push(new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 650, path: notdefPath }));

    // 2. Process all Glyphs
    glyphsData.forEach(item => {
        try {
            const commands = parseSVGPathRobust(item.path);
            if (commands.length < 2) return; 
            
            const otPath = new opentype.Path();
            commands.forEach(cmd => {
                if (cmd.type === 'M') otPath.moveTo(cmd.x, cmd.y);
                else if (cmd.type === 'L') otPath.lineTo(cmd.x, cmd.y);
                else if (cmd.type === 'Q') otPath.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
                else if (cmd.type === 'C') otPath.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
                else if (cmd.type === 'Z') otPath.close();
            });
            
            const unicodeVal = item.char.codePointAt(0) || 0;
            
            finalGlyphs.push(new opentype.Glyph({ 
                name: item.char, 
                unicode: unicodeVal, 
                advanceWidth: item.width || 600, 
                path: otPath 
            }));
        } catch (e) {
            console.warn("Font Engineer: Skipped bad glyph", item.char);
        }
    });

    // 3. Build Font Object
    const font = new opentype.Font({ 
        familyName: cssFontName, 
        styleName: 'Medium', 
        unitsPerEm: 1000, 
        ascender: 850, 
        descender: -150, 
        glyphs: finalGlyphs 
    });

    // 4. Export Buffer
    const buffer = font.toArrayBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: 'font/otf' }));
    
    // 5. Register in Browser
    try {
        const fontFace = new FontFace(cssFontName, `url(${url})`);
        const loadedFace = await fontFace.load();
        (document.fonts as any).add(loadedFace);
        console.log(`[Agent 4] Font Engine Mounted: ${cssFontName}`);
    } catch(e) { 
        console.error("Font Registration Failed:", e); 
    }

    return { url, cssFontName };
};
