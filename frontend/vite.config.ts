import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = process.env.NODE_ENV === 'production' || mode === 'production';
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: isProduction ? undefined : {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        },
        '/ws': {
          target: 'ws://localhost:3001',
          ws: true,
          changeOrigin: true
        }
      }
    },
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || '')
    }
  };
});
