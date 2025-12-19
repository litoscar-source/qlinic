
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

declare var process: any;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Isto permite que o código 'process.env.API_KEY' continue a funcionar
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
