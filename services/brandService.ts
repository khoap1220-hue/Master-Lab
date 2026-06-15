import { getAI, callWithRetry } from "../lib/gemini";

export const extractBrandColors = async (imageUrl: string, maxColors: number = 5): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }

      // Resize image for faster processing while maintaining aspect ratio
      const maxSize = 100;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = Math.floor(width);
      canvas.height = Math.floor(height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Extract RGB values, ignoring transparent pixels
        const pixels: [number, number, number][] = [];
        const allOpaquePixels: [number, number, number][] = [];
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          if (a >= 125) {
            allOpaquePixels.push([r, g, b]);
            // Ignore near white or near black for better brand color extraction
            const isNearWhite = r > 240 && g > 240 && b > 240;
            const isNearBlack = r < 15 && g < 15 && b < 15;
            if (!isNearWhite && !isNearBlack) {
              pixels.push([r, g, b]);
            }
          }
        }

        // Fallback if the logo is entirely black/white
        const activePixels = pixels.length > 0 ? pixels : allOpaquePixels;

        if (activePixels.length === 0) {
          resolve([]);
          return;
        }

        // K-Means Clustering
        const k = Math.min(maxColors, activePixels.length);
        let centroids: [number, number, number][] = [];
        
        // Initialize centroids randomly from existing pixels
        const usedIndices = new Set<number>();
        while (centroids.length < k) {
          const idx = Math.floor(Math.random() * activePixels.length);
          if (!usedIndices.has(idx)) {
            usedIndices.add(idx);
            centroids.push([...activePixels[idx]]);
          }
        }

        const maxIterations = 10;
        let assignments = new Array(activePixels.length).fill(0);

        for (let iter = 0; iter < maxIterations; iter++) {
          let changed = false;
          const newCentroids: [number, number, number][] = Array.from({ length: k }, () => [0, 0, 0]);
          const counts = new Array(k).fill(0);

          // Assign pixels to nearest centroid
          for (let i = 0; i < activePixels.length; i++) {
            const p = activePixels[i];
            let minDist = Infinity;
            let bestK = 0;

            for (let j = 0; j < k; j++) {
              const c = centroids[j];
              // Euclidean distance squared
              const dist = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
              if (dist < minDist) {
                minDist = dist;
                bestK = j;
              }
            }

            if (assignments[i] !== bestK) {
              changed = true;
              assignments[i] = bestK;
            }

            newCentroids[bestK][0] += p[0];
            newCentroids[bestK][1] += p[1];
            newCentroids[bestK][2] += p[2];
            counts[bestK]++;
          }

          // Update centroids
          for (let j = 0; j < k; j++) {
            if (counts[j] > 0) {
              centroids[j] = [
                Math.round(newCentroids[j][0] / counts[j]),
                Math.round(newCentroids[j][1] / counts[j]),
                Math.round(newCentroids[j][2] / counts[j])
              ];
            }
          }

          if (!changed) break;
        }

        // Sort centroids by cluster size (most dominant first)
        const clusterSizes = new Array(k).fill(0);
        for (let i = 0; i < assignments.length; i++) {
          clusterSizes[assignments[i]]++;
        }

        const sortedCentroids = centroids
          .map((color, index) => ({ color, count: clusterSizes[index] }))
          .sort((a, b) => b.count - a.count)
          .map(item => item.color);

        // Convert to HEX
        const rgbToHex = (r: number, g: number, b: number) => {
          return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
        };

        const hexColors = sortedCentroids.map(c => rgbToHex(c[0], c[1], c[2]));
        resolve(hexColors);

      } catch (error) {
        console.error("Error extracting colors:", error);
        resolve([]);
      }
    };
    
    img.onerror = (err) => {
      console.error("Error loading image for color extraction:", err);
      resolve([]);
    };
    
    img.src = imageUrl;
  });
};

export const generateLogo = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const response = await callWithRetry<any>(
    () => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Create a minimalist, professional logo for: ${prompt}. Return only the image.`,
          },
        ],
      },
      config: {
        imageConfig: {
              aspectRatio: "1:1"
          },
      },
    }),
    2, 1000, 'Gemini-2.5-Flash-Image',
    [] // Empty array for no fallbacks
  );
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return "";
};
