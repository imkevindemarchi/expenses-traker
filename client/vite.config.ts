import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, fileURLToPath(new URL('../server', import.meta.url)), 'PORT');
  const apiPort = serverEnv.PORT || '4000';
  return {
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0', port: 3000, strictPort: true, proxy: { '/api': `http://127.0.0.1:${apiPort}` } },
  };
});
