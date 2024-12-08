import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['microsoft-cognitiveservices-speech-sdk', 'react', 'react-dom']
  },
  build: {
    commonjsOptions: {
      include: [/microsoft-cognitiveservices-speech-sdk/, /node_modules/]
    }
  },
  server: {
    port: 38220,
    host: true // Listen on all network interfaces
  }
});
