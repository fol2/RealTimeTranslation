import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

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
    host: true, // Listen on all network interfaces
    https: {
      key: fs.readFileSync('../certs/key.pem'),
      cert: fs.readFileSync('../certs/cert.pem'),
    },
    proxy: {
      '/api': {
        target: 'https://192.168.50.177:38221',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/socket.io': {
        target: 'https://192.168.50.177:38221',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
