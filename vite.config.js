import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return {
    plugins: [react(), anthropicDevApi(env)],
    cacheDir: '.vite-cache',
    build: {
      outDir: 'dist-build',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      hmr: true,
      watch: {
        ignored: ['**/node_modules_stub/**', '**/.tmp-vv-method/**'],
      },
    },
    resolve: {
      extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
    },
  };
});

function anthropicDevApi(env) {
  return {
    name: 'vv-anthropic-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/anthropic', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'ANTHROPIC_API_KEY is not configured in .env.' }));
          return;
        }

        try {
          const body = await readJsonBody(req);
          const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: env.ANTHROPIC_MODEL || body.model || 'claude-sonnet-4-6',
              max_tokens: body.max_tokens || 2048,
              ...(typeof body.temperature === 'number' ? { temperature: body.temperature } : {}),
              system: body.system || 'You are a helpful MET English teaching assistant.',
              messages: body.messages,
            }),
          });
          const data = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: error?.message || 'Anthropic request failed.' }));
        }
      });
    },
  };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}
