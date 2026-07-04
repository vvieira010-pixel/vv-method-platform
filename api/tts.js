/**
 * api/tts.js — server-side TTS proxy for listening exercises.
 * Refactored using V3 DDD Architecture.
 */

import { verifySupabaseSession } from './_supabase-auth.js';

// ── Infrastructure Layer: Configuration ──
const env = (name) => process.env[name] || process.env[`VITE_${name}`] || '';

const CONFIG = {
  elevenLabs: {
    voiceId: env('ELEVENLABS_VOICE_ID') || '21m00Tcm4TlvDq8ikWAM',
    model: env('ELEVENLABS_MODEL') || 'eleven_monolingual_v1',
  },
  deepgram: {
    model: env('DEEPGRAM_TTS_MODEL') || 'aura-2-thalia-en',
  },
  openAi: {
    model: env('OPENAI_TTS_MODEL') || 'tts-1',
    voice: env('OPENAI_TTS_VOICE') || 'nova',
  },
  cambAi: {
    voiceId: env('CAMBAI_VOICE_ID') || '586ae584-4a72-44d3-bebb-f31894c0f761',
  },
};

async function fetchT(url, init, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ── Domain Layer: TTS Providers ──

/** @interface */
class TtsProvider {
  async generate(text) { throw new Error('Not implemented'); }
  getId() { throw new Error('Not implemented'); }
}

class CambAiProvider extends TtsProvider {
  getId() { return 'cambai'; }
  async generate(text) {
    const key = env('CAMBAI_API_KEY');
    if (!key) throw new Error('Camb.ai key is not configured.');

    const params = new URLSearchParams();
    params.append('voice_id[]', CONFIG.cambAi.voiceId);
    params.append('transcribe_text[]', text);

    const r = await fetchT('https://aivoov.com/api/v8/create', {
      method: 'POST',
      headers: {
        'X-API-KEY': key,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }, 15000);

    const data = await r.json().catch(() => ({}));
    if (!data.status || !data.audio) {
      throw new Error(data.message || `Camb.ai error ${r.status}`);
    }
    return { bytes: Buffer.from(data.audio, 'base64'), contentType: 'audio/mpeg' };
  }
}

class ElevenLabsProvider extends TtsProvider {
  getId() { return 'elevenlabs'; }
  async generate(text) {
    const key = env('ELEVENLABS_API_KEY');
    if (!key) throw new Error('ElevenLabs key is not configured.');

    const r = await fetchT(`https://api.elevenlabs.io/v1/text-to-speech/${CONFIG.elevenLabs.voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: CONFIG.elevenLabs.model,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.detail?.message || `ElevenLabs error ${r.status}`);
    }
    return { bytes: Buffer.from(await r.arrayBuffer()), contentType: r.headers.get('content-type') || 'audio/mpeg' };
  }
}

class OpenAiProvider extends TtsProvider {
  getId() { return 'openai'; }
  async generate(text) {
    const key = env('OPENAI_API_KEY');
    if (!key) throw new Error('OpenAI key is not configured.');

    const r = await fetchT('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: CONFIG.openAi.model, input: text, voice: CONFIG.openAi.voice }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error?.message || `OpenAI TTS error ${r.status}`);
    }
    return { bytes: Buffer.from(await r.arrayBuffer()), contentType: r.headers.get('content-type') || 'audio/mpeg' };
  }
}

class DeepgramProvider extends TtsProvider {
  getId() { return 'deepgram'; }
  async generate(text) {
    const key = env('DEEPGRAM_API_KEY');
    if (!key) throw new Error('Deepgram key is not configured.');

    const r = await fetchT(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(CONFIG.deepgram.model)}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.err_msg || e.message || `Deepgram TTS error ${r.status}`);
    }
    return { bytes: Buffer.from(await r.arrayBuffer()), contentType: r.headers.get('content-type') || 'audio/mpeg' };
  }
}

// ── Application Layer: TTS Service ──

class TtsService {
  constructor() {
    this.providers = [
      new CambAiProvider(),
      new ElevenLabsProvider(),
      new OpenAiProvider(),
      new DeepgramProvider(),
    ];
  }

  async synthesize(text, preferredProviderId = null) {
    const errors = [];
    const attempts = preferredProviderId 
      ? this.providers.filter(p => p.getId() === preferredProviderId)
      : this.providers;

    for (const provider of attempts) {
      try {
        return await provider.generate(text);
      } catch (e) {
        errors.push(`${provider.getId()}: ${e.message}`);
      }
    }
    throw new Error(`TTS failed: ${errors.join(' | ')}`);
  }
}

const ttsService = new TtsService();

// ── Presentation Layer: Vercel Handler ──

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); }
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  if (!await verifySupabaseSession(req)) {
    return res.status(401).json({ error: { message: 'Unauthorized — valid session required.' } });
  }

  const body = await readBody(req);
  const text = String(body?.text || '').trim();
  const providerId = String(body?.provider || '').trim().toLowerCase();
  
  if (!text) return res.status(400).json({ error: { message: 'Missing "text".' } });
  if (text.length > 5000) return res.status(400).json({ error: { message: 'Text is too long for TTS.' } });

  try {
    const { bytes, contentType } = await ttsService.synthesize(text, providerId);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(bytes);
  } catch (e) {
    return res.status(502).json({ error: { message: e.message } });
  }
}
