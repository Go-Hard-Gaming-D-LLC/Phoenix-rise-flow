import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      middlewareMode: false,
      proxy: {
        '/api/shopify': {
          target: 'https://7f5b22-4.myshopify.com', // Fallback - will be overridden by client
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/shopify/, ''),
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.error('Proxy error:', err);
            });
          }
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      outDir: 'dist', // We will copy from here to your theme
      rollupOptions: {
        output: {
          // These settings ensure the files are named consistently
          // so we can easily reference them in your Shopify Theme (Liquid)
          entryFileNames: 'merchant-copilot.js',
          assetFileNames: 'merchant-copilot.[ext]',
        }
      }
    }
  };
});
