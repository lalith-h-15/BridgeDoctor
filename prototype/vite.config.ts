import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static, backend-free build. `base: './'` lets the dist/ folder be opened from any path.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 900 },
});
