import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Fix for __dirname not being available in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    // Load environment variables. Passing an empty string as the third argument 
    // allows loading variables without the VITE_ prefix.
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Map the correct platform environment variable to the key used in the code
        'process.env.API_KEY': JSON.stringify(env.API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
