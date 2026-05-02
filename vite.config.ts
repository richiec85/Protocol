// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Protocol/',  // Change this to your repo name
  build: {
    outDir: 'dist',
  },
});
