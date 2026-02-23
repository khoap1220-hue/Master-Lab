
import { Stroke } from '../types';
import { ThinkingLevel } from '../types';

// ... (Existing canvas utils: createMaskFromStrokes, createCompositeImage, etc.) ...

export const createMaskFromStrokes = (
  width: number,
  height: number,
  strokes: Stroke[]
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return "";

  // Background BLACK (No Selection)
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  strokes.forEach(stroke => {
    if (stroke.points.length === 0) return;

    // Eraser = Paint BLACK (Un-select) over existing white strokes
    if (stroke.color === 'erase') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'black';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'white'; // Selection = White
    }

    ctx.lineWidth = stroke.width;

    if (stroke.points.length < 2) {
      ctx.beginPath();
      ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  });

  return canvas.toDataURL('image/png');
};

export const createCompositeImage = (
  width: number,
  height: number,
  strokes: Stroke[],
  originalImage: HTMLImageElement
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return "";

  // 1. Draw Original Image (Base Layer)
  ctx.drawImage(originalImage, 0, 0, width, height);

  // 2. Prepare Overlay Layer (Strokes) on a separate canvas
  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = width;
  overlayCanvas.height = height;
  const overlayCtx = overlayCanvas.getContext('2d');
  if (!overlayCtx) return canvas.toDataURL('image/png');

  overlayCtx.lineCap = 'round';
  overlayCtx.lineJoin = 'round';

  strokes.forEach(stroke => {
    if (stroke.points.length === 0) return;

    if (stroke.color === 'erase') {
      // Eraser -> Cut hole in overlay (Restore transparency to reveal base image)
      overlayCtx.globalCompositeOperation = 'destination-out'; 
      overlayCtx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      // Paint -> Add color to overlay
      overlayCtx.globalCompositeOperation = 'source-over'; 
      overlayCtx.strokeStyle = stroke.color; 
    }

    overlayCtx.lineWidth = stroke.width;

    if (stroke.points.length < 2) {
      overlayCtx.beginPath();
      overlayCtx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
      overlayCtx.fill();
    } else {
      overlayCtx.beginPath();
      overlayCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        overlayCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      overlayCtx.stroke();
    }
  });

  // 3. Merge Overlay onto Main Canvas
  ctx.drawImage(overlayCanvas, 0, 0);

  return canvas.toDataURL('image/png');
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const sanitizeAspectRatio = (ratio: string): string => {
  const allowed = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
  return allowed.includes(ratio) ? ratio : '1:1';
};

export const getClosestAspectRatio = (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn("Aspect ratio detection timed out, defaulting to 1:1");
      resolve("1:1");
    }, 2000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timeout);
      
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      
      if (w === 0 || h === 0) {
          resolve("1:1");
          return;
      }

      const ratio = w / h;
      
      const targets = [
        { label: "1:1", value: 1 },
        { label: "2:3", value: 2 / 3 },
        { label: "3:2", value: 3 / 2 },
        { label: "3:4", value: 3 / 4 },
        { label: "4:3", value: 4 / 3 },
        { label: "4:5", value: 4 / 5 },
        { label: "5:4", value: 5 / 4 },
        { label: "9:16", value: 9 / 16 },
        { label: "16:9", value: 16 / 9 },
        { label: "21:9", value: 21 / 9 },
      ];
      
      const closest = targets.reduce((prev, curr) => 
        Math.abs(curr.value - ratio) < Math.abs(prev.value - ratio) ? curr : prev
      );
      
      resolve(closest.label);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve("1:1"); 
    };
    img.src = base64;
  });
};

export const cropImage = (
  base64Image: string,
  ymin: number,
  xmin: number,
  ymax: number,
  xmax: number,
  targetSize: number = 0 
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Crop operation timed out")), 5000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timeout);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Cannot get canvas context"));
        return;
      }

      const nyMin = Number(ymin);
      const nxMin = Number(xmin);
      const nyMax = Number(ymax);
      const nxMax = Number(xmax);

      const is1000Scale = nyMin > 1 || nxMin > 1 || nyMax > 1 || nxMax > 1;
      const scale = is1000Scale ? 1000 : 1;
      const wImg = img.naturalWidth;
      const hImg = img.naturalHeight;

      let x = (nxMin / scale) * wImg;
      let y = (nyMin / scale) * hImg;
      let w = ((nxMax - nxMin) / scale) * wImg;
      let h = ((nyMax - nyMin) / scale) * hImg;

      x = Math.max(0, x);
      y = Math.max(0, y);
      
      if (x + w > wImg) w = wImg - x;
      if (y + h > hImg) h = hImg - y;

      const cleanW = Math.max(1, Math.floor(w));
      const cleanH = Math.max(1, Math.floor(h));

      if (targetSize > 0) {
          canvas.width = targetSize;
          canvas.height = targetSize;
          // Scale to fit
          ctx.drawImage(img, x, y, cleanW, cleanH, 0, 0, targetSize, targetSize);
      } else {
          canvas.width = cleanW;
          canvas.height = cleanH;
          ctx.drawImage(img, x, y, cleanW, cleanH, 0, 0, cleanW, cleanH);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => {
      clearTimeout(timeout);
      reject(e);
    };
    img.src = base64Image;
  });
};

export const removeWhiteBackground = (base64: string, tolerance: number = 20): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Transparency processing timed out")), 5000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timeout);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (r > 255 - tolerance && g > 255 - tolerance && b > 255 - tolerance) {
          data[i + 3] = 0; 
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => {
      clearTimeout(timeout);
      reject(new Error("Failed to load image for transparency processing"));
    };
    img.src = base64;
  });
};

export const applyMaskToImage = (originalUrl: string, maskUrl: string, featherPx: number = 2): Promise<string> => {
  return new Promise((resolve, reject) => {
     const original = new Image();
     const mask = new Image();
     
     original.crossOrigin = "anonymous";
     mask.crossOrigin = "anonymous";

     let loadedCount = 0;
     const checkLoad = () => {
       loadedCount++;
       if (loadedCount === 2) process();
     };

     original.onload = checkLoad;
     mask.onload = checkLoad;
     original.onerror = () => reject(new Error("Failed to load original"));
     mask.onerror = () => reject(new Error("Failed to load mask"));

     original.src = originalUrl;
     mask.src = maskUrl;

     function process() {
        const width = original.naturalWidth;
        const height = original.naturalHeight;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("No context"));

        // 1. Prepare Mask Layer
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return reject(new Error("No mask context"));

        maskCtx.drawImage(mask, 0, 0, width, height);
        
        const maskData = maskCtx.getImageData(0, 0, width, height);
        const data = maskData.data;
        for (let i = 0; i < data.length; i += 4) {
             const red = data[i]; 
             const green = data[i+1];
             const blue = data[i+2];
             
             const luma = 0.299 * red + 0.587 * green + 0.114 * blue;
             data[i + 3] = luma; 
        }
        maskCtx.putImageData(maskData, 0, 0);

        if (featherPx > 0) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            if (tempCtx) {
                tempCtx.filter = `blur(${featherPx}px)`;
                tempCtx.drawImage(maskCanvas, 0, 0);
                
                maskCtx.clearRect(0, 0, width, height);
                maskCtx.drawImage(tempCanvas, 0, 0);
            }
        }

        // 2. Composition
        ctx.drawImage(original, 0, 0, width, height);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(maskCanvas, 0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';

        resolve(canvas.toDataURL('image/png'));
     }
  });
};

export const fetchRemoteAsset = async (url: string): Promise<{ mimeType: string, data: string }> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
    
    const blob = await response.blob();
    const mimeType = blob.type;
    
    if (!mimeType.startsWith('image/') && mimeType !== 'application/pdf') {
       console.warn(`Warning: MIME type ${mimeType} might not be supported for visual analysis.`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const rawBase64 = base64String.split(',')[1];
        resolve({ mimeType, data: rawBase64 });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching remote asset:", error);
    throw error;
  }
};

export type OptimizationTask = 'vision' | 'generation' | 'upscale_input' | 'editing' | 'masking' | 'general' | 'vector_trace';

const TASK_PROFILES: Record<OptimizationTask, { maxDim: number, preserveTransparency: boolean }> = {
  'vision': { maxDim: 768, preserveTransparency: false }, 
  'upscale_input': { maxDim: 1024, preserveTransparency: false }, 
  'generation': { maxDim: 1280, preserveTransparency: false }, 
  'editing': { maxDim: 1536, preserveTransparency: true }, 
  'masking': { maxDim: 1536, preserveTransparency: false }, 
  'general': { maxDim: 1280, preserveTransparency: true },
  'vector_trace': { maxDim: 800, preserveTransparency: false } 
};

export const optimizeImagePayload = (base64Str: string, task: OptimizationTask = 'general'): Promise<string> => {
  const profile = TASK_PROFILES[task];
  return resizeImage(base64Str, profile.maxDim, profile.preserveTransparency);
};

export const resizeImage = (
  base64Str: string, 
  maxDimension: number = 1536,
  preserveTransparency: boolean = false
): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || typeof base64Str !== 'string') {
        resolve(base64Str);
        return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width <= maxDimension && height <= maxDimension) {
        if (preserveTransparency && base64Str.startsWith('data:image/png')) {
           resolve(base64Str);
           return;
        }
      }

      if (width > height) {
        if (width > maxDimension) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          if (preserveTransparency) {
              resolve(canvas.toDataURL('image/png'));
          } else {
              resolve(canvas.toDataURL('image/jpeg', 0.85));
          }
      } else {
          resolve(base64Str);
      }
    };
    img.onerror = () => {
      console.warn("Resize failed (Image Load Error), returning original.");
      resolve(base64Str);
    };
  });
};

/**
 * CALCULATE THINKING BUDGET (Smart Regulation)
 * Returns the token count based on User Preference and Task Complexity.
 */
export const calculateThinkingBudget = (userPref: ThinkingLevel = 'BALANCED'): number => {
    switch (userPref) {
        case 'FAST': return 0; // Disable thinking for speed
        case 'BALANCED': return 8192; // 8k - Good for general analysis
        case 'DEEP': return 16384; // 16k - Good for complex reasoning
        case 'MAXIMUM': return 32768; // 32k - Max capacity for heavy strategy
        default: return 8192;
    }
};

/**
 * Creates a Flat Dieline Layout (Side-Front-Side-Back)
 * Stitches extracted Front with generated Back/Side into a print-ready canvas.
 */
export const createFlatDielineLayout = async (
  frontB64: string, 
  backB64: string, 
  sideB64: string
): Promise<string> => {
  return new Promise((resolve) => {
    // Helper to load image
    const load = (src: string) => new Promise<HTMLImageElement>((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });

    Promise.all([load(frontB64), load(backB64), load(sideB64)]).then(([front, back, side]) => {
      const h = front.naturalHeight;
      const wFront = front.naturalWidth;
      
      // Calculate scaling factors to match Height of Front
      const scaleBack = h / back.naturalHeight;
      const wBack = back.naturalWidth * scaleBack;
      
      const scaleSide = h / side.naturalHeight;
      const wSide = side.naturalWidth * scaleSide;

      // Layout: [Side Left] - [Front] - [Side Right] - [Back]
      const totalW = wSide + wFront + wSide + wBack;
      const totalH = h + 150; // Extra vertical space for labels/bleeds

      const canvas = document.createElement('canvas');
      canvas.width = totalW;
      canvas.height = totalH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(frontB64); return; }

      // Fill white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, totalW, totalH);

      let currentX = 0;
      const contentY = 80;

      // --- UTILS for Drawing Lines ---
      const drawCutLine = (x: number, y: number, w: number, h: number) => {
          ctx.strokeStyle = '#ef4444'; // Red for CUT
          ctx.lineWidth = 4;
          ctx.setLineDash([]);
          ctx.strokeRect(x, y, w, h);
      };
      
      const drawFoldLine = (x: number, y1: number, y2: number) => {
          ctx.beginPath(); 
          ctx.moveTo(x, y1); 
          ctx.lineTo(x, y2);
          ctx.strokeStyle = '#3b82f6'; // Blue for FOLD
          ctx.lineWidth = 3; 
          ctx.setLineDash([15, 10]); // Dashed
          ctx.stroke();
      };

      const drawLabel = (text: string, x: number, y: number) => {
          ctx.fillStyle = '#64748b'; 
          ctx.font = 'bold 32px sans-serif'; 
          ctx.textAlign = 'center';
          ctx.fillText(text, x, y);
      };

      // 1. Draw Side Left (Using Side Image)
      // Mirror side image horizontally for the "Left" side if needed, but for packaging usually okay
      ctx.save();
      // Optional: transform for left side
      ctx.drawImage(side, 0, 0, side.naturalWidth, side.naturalHeight, currentX, contentY, wSide, h);
      ctx.restore();
      
      drawLabel('CẠNH TRÁI', currentX + wSide/2, 50);
      drawFoldLine(currentX + wSide, contentY, contentY + h);
      currentX += wSide;

      // 2. Draw Front (The Anchor)
      ctx.drawImage(front, 0, 0, front.naturalWidth, front.naturalHeight, currentX, contentY, wFront, h);
      drawLabel('MẶT TRƯỚC (GỐC)', currentX + wFront/2, 50);
      drawFoldLine(currentX + wFront, contentY, contentY + h);
      currentX += wFront;

      // 3. Draw Side Right (Using Side Image)
      ctx.drawImage(side, 0, 0, side.naturalWidth, side.naturalHeight, currentX, contentY, wSide, h);
      drawLabel('CẠNH PHẢI', currentX + wSide/2, 50);
      drawFoldLine(currentX + wSide, contentY, contentY + h);
      currentX += wSide;

      // 4. Draw Back (Using Back Image)
      ctx.drawImage(back, 0, 0, back.naturalWidth, back.naturalHeight, currentX, contentY, wBack, h);
      drawLabel('MẶT SAU', currentX + wBack/2, 50);

      // Draw Outer Cut Line around the whole block
      ctx.strokeStyle = '#ef4444'; 
      ctx.lineWidth = 5; 
      ctx.setLineDash([]);
      ctx.strokeRect(0, contentY, totalW, h);

      // Add Info Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`TOTAL WIDTH: ${Math.round(totalW)}px | HEIGHT: ${Math.round(h)}px | GENERATED BY VISUAL EMPATHY AI`, 20, totalH - 20);

      resolve(canvas.toDataURL('image/png'));
    });
  });
};
