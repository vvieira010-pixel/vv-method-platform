/**
 * api/tts.js — server-side TTS proxy for listening exercises.
 *
 * Keeps ElevenLabs/Deepgram/OpenAI keys out of the browser bundle. The client POSTs
 * { text, provider? } and receives an audio stream.
 */

const env = (name) => process.env[name] || process.env[`VITE_${name}`] || '';

const ELEVENLABS_VOICE = env('ELEVENLABS_VOICE_ID') || '21m00Tcm4TlvDq8ikWAM';
const ELEVENLABS_MODEL = env('ELEVENLABS_MODEL') || 'eleven_multilingual_v2';
const DEEPGRAM_MODEL = env('DEEPGRAM_TTS_MODEL') || 'aura-2-thalia-en';
const OPENAI_TTS_MODEL = env('OPENAI_TTS_MODEL') || 'tts-1';
const OPENAI_TTS_VOICE = env('OPENAI_TTS_VOICE') || 'nova';
const AIVOOV_VOICE = env('AIVOOV_VOICE_ID') || 'a9c6e858-cbcb-4380-91e5-21cea93be41f';

async function fetchT(url, init, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

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

async function aivoovTts(text) {
  const key = env('AIVOOV_API_KEY');
  if (!key) throw new Error('AiVOOV key is not configured.');

  const params = new URLSearchParams();
  params.append('voice_id[]', AIVOOV_VOICE);
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
    throw new Error(data.message || `AiVOOV error ${r.status}`);
  }
  return { bytes: Buffer.from(data.audio, 'base64'), contentType: 'audio/mpeg' };
}

async function elevenLabs(text) {
  const key = env('ELEVENLABS_API_KEY');
  if (!key) throw new Error('ElevenLabs key is not configured.');

  const r = await fetchT(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail?.message || `ElevenLabs error ${r.status}`);
  }
  return { bytes: Buffer.from(await r.arrayBuffer()), contentType: r.headers.get('content-type') || 'audio/mpeg' };
}

async function openAiTts(text) {
  const key = env('OPENAI_API_KEY');
  if (!key) throw new Error('OpenAI key is not configured.');

  const r = await fetchT('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: OPENAI_TTS_MODEL, input: text, voice: OPENAI_TTS_VOICE }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error?.message || `OpenAI TTS error ${r.status}`);
  }
  return { bytes: Buffer.from(await r.arrayBuffer()), contentType: r.headers.get('content-type') || 'audio/mpeg' };
}

async function deepgramTts(text) {
  const key = env('DEEPGRAM_API_KEY');
  if (!key) throw new Error('Deepgram key is not configured.');

  const r = await fetchT(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(DEEPGRAM_MODEL)}`, {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const body = await readBody(req);
  const text = String(body?.text || '').trim();
  const provider = String(body?.provider || '').trim().toLowerCase();
  if (!text) return res.status(400).json({ error: { message: 'Missing "text".' } });
  if (text.length > 5000) return res.status(400).json({ error: { message: 'Text is too long for TTS.' } });

  const errors = [];
  const attempts = provider === 'openai'
    ? [openAiTts]
    : provider === 'deepgram'
      ? [deepgramTts]
    : provider === 'elevenlabs'
      ? [elevenLabs]
    : provider === 'aivoov'
      ? [aivoovTts]
      : [aivoovTts, elevenLabs, deepgramTts, openAiTts];

  for (const run of attempts) {
    try {
      const { bytes, contentType } = await run(text);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(bytes);
    } catch (e) {
      errors.push(e.message);
    }
  }

  return res.status(502).json({ error: { message: `TTS failed: ${errors.join(' | ')}` } });
}
