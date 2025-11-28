import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // 调高警告阈值到 1000kb
    rollupOptions: {
      output: {
        manualChunks: {
          // 将大库单独打包
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          utils: ['html2canvas', '@google/genai', '@supabase/supabase-js']
        }
      }
    }
  }
});