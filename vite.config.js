import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return {
    plugins: [react(), anthropicDevApi(env), ttsDevApi(env)],
    cacheDir: '.vite-cache-v2',
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

function ttsDevApi(env) {
  return {
    name: 'vv-tts-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        try {
          const body = await readJsonBody(req);
          const text = String(body?.text || '').trim();
          if (!text) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: { message: 'Missing "text".' } }));
            return;
          }

          const audio = await fetchDevTtsAudio(env, text);
          res.statusCode = 200;
          res.setHeader('Content-Type', audio.contentType);
          res.setHeader('Cache-Control', 'no-store');
          res.end(Buffer.from(await audio.response.arrayBuffer()));
        } catch (error) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: { message: error?.message || 'TTS request failed.' } }));
        }
      });
    },
  };
}

async function fetchDevTtsAudio(env, text) {
  const elevenKey = env.ELEVENLABS_API_KEY || env.VITE_ELEVENLABS_API_KEY || '';
  if (elevenKey) {
    const voice = env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (response.ok) return { response, contentType: response.headers.get('content-type') || 'audio/mpeg' };
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail?.message || `ElevenLabs error ${response.status}`);
  }

  const deepgramKey = env.DEEPGRAM_API_KEY || env.VITE_DEEPGRAM_API_KEY || '';
  if (deepgramKey) {
    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(env.DEEPGRAM_TTS_MODEL || 'aura-2-thalia-en')}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${deepgramKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    if (response.ok) return { response, contentType: response.headers.get('content-type') || 'audio/mpeg' };
    const err = await response.json().catch(() => ({}));
    throw new Error(err.err_msg || err.message || `Deepgram TTS error ${response.status}`);
  }

  const openAiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || '';
  if (!openAiKey) throw new Error('No ELEVENLABS_API_KEY, DEEPGRAM_API_KEY, or OPENAI_API_KEY configured in .env.');

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_TTS_MODEL || 'tts-1',
      input: text,
      voice: env.OPENAI_TTS_VOICE || 'nova',
    }),
  });
  if (response.ok) return { response, contentType: response.headers.get('content-type') || 'audio/mpeg' };
  const err = await response.json().catch(() => ({}));
  throw new Error(err.error?.message || `OpenAI TTS error ${response.status}`);
}

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
