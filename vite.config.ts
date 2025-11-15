import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/test_web_game/', // GitHub Pages 배포를 위한 base path
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
});
