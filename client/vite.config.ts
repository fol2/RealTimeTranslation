import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['microsoft-cognitiveservices-speech-sdk']
  },
  build: {
    commonjsOptions: {
      include: [/microsoft-cognitiveservices-speech-sdk/]
    }
  },
  server: {
    port: 38220,
    proxy: {
      '/api': {
        target: 'http://localhost:38221',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/socket.io': {
        target: 'http://localhost:38221',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
