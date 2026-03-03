import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin, loadEnv } from 'vite';
import fs from 'fs';

// A simple Vite plugin to handle /api routes locally
function apiMiddleware(): Plugin {
  return {
    name: 'api-middleware',
    configureServer(server) {
      // Load environment variables and merge them into process.env
      const env = loadEnv(server.config.mode, server.config.root, '');
      Object.assign(process.env, env);

      console.log('[API Middleware] ADMIN_PASSWORD loaded:', process.env.ADMIN_PASSWORD ? 'Yes (length: ' + process.env.ADMIN_PASSWORD.length + ')' : 'No');

      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const apiPath = url.pathname.replace(/^\/api\//, '');
            const filePath = path.resolve(__dirname, 'api', `${apiPath}.ts`);

            if (fs.existsSync(filePath)) {
              // Load the module using Vite's SSR loading
              const module = await server.ssrLoadModule(filePath);
              const handler = module.default;

              if (typeof handler === 'function') {
                // Execute the handler
                // req and res are already IncomingMessage and ServerResponse
                await handler(req, res);
                return;
              }
            }
          } catch (error) {
            console.error('API Middleware Error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  // base '/' is required for Vercel — relative paths break client-side routing
  base: '/',
  plugins: [react(), tailwindcss(), apiMiddleware()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
