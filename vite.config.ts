
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Construct a safe process.env object to expose to the client
  // We explicitly include GEMINI_API_KEY and API_KEY from the system environment
  const processEnv = {
    ...env,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || env.GEMINI_API_KEY,
    API_KEY: process.env.API_KEY || env.API_KEY,
    NODE_ENV: process.env.NODE_ENV || mode,
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      'process.env': processEnv
    },
    server: {
      port: 3000,
      host: true
    },
    build: {
      target: 'esnext', // Support Top-level await
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-gemini': ['@google/genai'],
            'vendor-utils': ['jspdf', 'jszip', 'opentype.js'],
            // Split heavy feature components into separate chunks
            'feature-editor': [
              './features/editor/EditorCanvas/index.tsx',
              './features/editor/EditorCanvas/MaskLayer.tsx'
            ],
            'feature-batch': [
              './features/batch/BatchStudio.tsx',
              './features/batch/components/BatchPreview.tsx'
            ]
          }
        }
      }
    },
    optimizeDeps: {
      include: ['@google/genai', 'react', 'react-dom', 'jspdf', 'jszip']
    }
  };
});
