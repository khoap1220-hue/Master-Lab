
import { Type, GenerateContentResponse } from "@google/genai";
import { getAI, callWithRetry } from "../../lib/gemini";
import { cleanJson } from "../orchestrator/utils";
import { optimizeImagePayload } from "../../lib/utils";
import { MODELS } from "../../config/models";

// --- TYPES ---
export interface PackagingStyle {
  colorPalette: string[];
  typography: {
    primary: string;
    secondary: string;
  };
  vibeKeywords: string[];
  patternMotif: string;
  // NEW: OCR Data extraction
  textContent: {
    brandName: string;
    productName: string;
    slogans: string[];
    netWeight: string;
    certifications: string[]; // ISO, Organic, etc.
  };
}

export interface PanelContent {
  color: string;
  textureUrl?: string;
  elements: {
    type: 'text' | 'logo' | 'barcode' | 'icon' | 'image';
    content: string;
    position: 'center' | 'top' | 'bottom' | 'top-left' | 'bottom-left' | 'middle';
    style?: string;
  }[];
}

export interface SurfacePlan {
  front: PanelContent;
  back: PanelContent;
  left: PanelContent;
  right: PanelContent;
  top: PanelContent;
  bottom: PanelContent;
  flaps: PanelContent;
  masterTextureUrl?: string;
}

// --- AGENT 1: VISION EXTRACTOR & OCR ---
export const extractPackagingStyle = async (imageContent: string): Promise<PackagingStyle> => {
  const ai = getAI();
  const primaryModel = MODELS.TEXT_FAST; 
  const backupModel = MODELS.TEXT_FAST;

  // Use slightly higher resolution for OCR
  const optImage = await optimizeImagePayload(imageContent, 'generation');

  const prompt = `
    [ROLE: PACKAGING FORENSIC ANALYST]
    Analyze the packaging mockup. Extract visual DNA AND EXACT TEXT CONTENT.
    
    CRITICAL: READ THE TEXT ON THE PACKAGING EXACTLY AS IT APPEARS.
    
    OUTPUT JSON:
    {
      "colorPalette": ["#Hex1", "#Hex2"],
      "typography": { "primary": "Font class (Serif/Sans)", "secondary": "Font class" },
      "vibeKeywords": ["Minimalist", "Organic"],
      "patternMotif": "Description of texture",
      "textContent": {
         "brandName": "Exact Brand Name visible",
         "productName": "Exact Product Name visible",
         "slogans": ["Visible slogan 1", "Visible slogan 2"],
         "netWeight": "Visible weight (e.g. 500g)",
         "certifications": ["USDA", "ISO"]
      }
    }
  `;

  const config = {
    responseMimeType: "application/json"
  };

  const response = await callWithRetry<GenerateContentResponse>(
    () => ai.models.generateContent({
      model: primaryModel,
      contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
      config
    }), 2, 1000, primaryModel,
    [() => ai.models.generateContent({
      model: backupModel,
      contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
      config
    })]
  );

  return JSON.parse(cleanJson(response.text || "{}"));
};

// --- AGENT 2: SURFACE COMPOSER ---
export const composeSurfacePlan = async (
  style: PackagingStyle,
  dimensions: { w: number, h: number, d: number },
  productContext: string
): Promise<SurfacePlan> => {
  const ai = getAI();
  const primaryModel = MODELS.TEXT_FAST; 
  const backupModel = MODELS.TEXT_FAST;

  const prompt = `
    [ROLE: PACKAGING STRUCTURAL DESIGNER]
    TASK: Map content to the flat dieline surfaces.
    
    INPUT DATA (FROM AGENT 1):
    - Brand: "${style.textContent.brandName}"
    - Product: "${style.textContent.productName}"
    - Slogans: ${JSON.stringify(style.textContent.slogans)}
    - Weight: "${style.textContent.netWeight}"
    
    STYLE: ${JSON.stringify(style.vibeKeywords)}
    
    RULES:
    1. **FRONT**: MUST include Brand Name, Product Name, and Main Slogan.
    2. **BACK**: Hallucinate ingredients list if missing, include Usage Instructions, Barcode.
    3. **SIDES**: Logo icon or Slogan.
    4. **FLAPS**: Website URL (hallucinated based on brand name) or solid color.
    
    OUTPUT JSON (SurfacePlan):
    Return 'PanelContent' for: front, back, left, right, top, bottom, flaps.
  `;

  const panelSchema = {
    type: Type.OBJECT,
    properties: {
        color: { type: Type.STRING },
        textureUrl: { type: Type.STRING },
        elements: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    content: { type: Type.STRING },
                    position: { type: Type.STRING },
                    style: { type: Type.STRING }
                }
            } 
        }
    },
    required: ["color", "elements"]
  };

  const config = { 
      responseMimeType: "application/json"
  };

  const response = await callWithRetry<GenerateContentResponse>(
    () => ai.models.generateContent({
      model: primaryModel,
      contents: { parts: [{ text: prompt }] },
      config
    }), 
    2, 
    1000, 
    primaryModel,
    [() => ai.models.generateContent({
      model: backupModel,
      contents: { parts: [{ text: prompt }] },
      config
    })],
    45000
  );

  return JSON.parse(cleanJson(response.text || "{}"));
};
