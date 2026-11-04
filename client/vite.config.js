import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'lucide-react': path.resolve(__dirname, './src/lib/lucide-react.jsx'),
      'framer-motion': path.resolve(__dirname, './src/lib/framer-motion.jsx'),
      'react-router-dom': path.resolve(__dirname, './src/lib/react-router-dom.jsx'),
      'axios': path.resolve(__dirname, './src/lib/axios.js'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/testSetup.js',
  },
});
