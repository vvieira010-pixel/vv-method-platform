/**
 * tts.js — Text-to-speech cascade shared by listening-style exercises.
 *
 * Resolution order (first that works wins):
 *   1. Pre-recorded audio URL passed by the caller (audioSrc)
 *   2. Server proxy — /api/tts (server-side ElevenLabs/OpenAI keys)
 *   3. ElevenLabs → Deepgram → OpenAI → Gemini → Piper (browser-stored keys)
 *   4. Browser speechSynthesis — always available, no key needed
 *
 * Extracted from Listening.jsx so the reading player can narrate hidden
 * passages too (audit E1). Both consumers import fetchAudio + speakBrowser.
 */

const EL_VOICE = '21m00Tcm4TlvDq8ikWAM'; // ElevenLabs — Rachel, natural American English
const DEEPGRAM_MODEL = 'aura-2-thalia-en'; // Deepgram Aura-2 — clear American English
const OPENAI_VOICE = 'nova';               // OpenAI TTS — nova (female, clear, neutral)

function lsGet(key) { try { return localStorage.getItem(key) || ''; } catch { return ''; } }
const getElKey = () => lsGet('vv:elevenlabs_api_key');
const getDeepgramKey = () => lsGet('vv:deepgram_api_key');
const getOpenAIKey = () => lsGet('vv:openai_api_key');
const getPiperUrl = () => lsGet('vv:piper_server_url');
const getGeminiKey = () => { const v = lsGet('vv:gemini_api_key'); return v ? v.split(',')[0].trim() : ''; };

async function fetchServerAudio(text) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Server TTS error ${res.status}`);
  }
  return URL.createObjectURL(await res.blob());
}

async function fetchElevenLabsAudio(text, apiKey) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail?.message || `ElevenLabs error ${res.status}`);
  }
  return URL.createObjectURL(await res.blob());
}

async function fetchOpenAIAudio(text, apiKey) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', input: text, voice: OPENAI_VOICE }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI TTS error ${res.status}`);
  }
  return URL.createObjectURL(await res.blob());
}

async function fetchDeepgramAudio(text, apiKey) {
  const res = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(DEEPGRAM_MODEL)}`, {
    method: 'POST',
    headers: { Authorization: `Token ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.err_msg || err.message || `Deepgram TTS error ${res.status}`);
  }
  return URL.createObjectURL(await res.blob());
}

async function fetchGeminiAudio(text, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini TTS error ${res.status}`);
  }
  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!part?.data) throw new Error('Gemini TTS: no audio in response');
  const bytes = Uint8Array.from(atob(part.data), c => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: part.mimeType || 'audio/wav' }));
}

async function fetchPiperAudio(text, serverUrl) {
  const res = await fetch(`${serverUrl}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Piper TTS error ${res.status}`);
  return URL.createObjectURL(await res.blob());
}

/** Server proxy → ElevenLabs → Deepgram → OpenAI → Gemini → Piper → null */
export async function fetchAudio(text) {
  try { return await fetchServerAudio(text); } catch (e) { console.warn('[tts] server proxy failed:', e.message); }
  const elKey = getElKey();
  if (elKey) return fetchElevenLabsAudio(text, elKey);
  const deepgramKey = getDeepgramKey();
  if (deepgramKey) return fetchDeepgramAudio(text, deepgramKey);
  const oaiKey = getOpenAIKey();
  if (oaiKey) return fetchOpenAIAudio(text, oaiKey);
  const geminiKey = getGeminiKey();
  if (geminiKey) return fetchGeminiAudio(text, geminiKey);
  const piperUrl = getPiperUrl();
  if (piperUrl) return fetchPiperAudio(text, piperUrl);
  return null;
}

/** Last-resort, no-key narration using the browser's built-in speech synthesis. */
export function speakBrowser(text) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return; }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.88;
    utter.pitch = 1;
    utter.onend = resolve;
    utter.onerror = resolve;
    speechSynthesis.speak(utter);
  });
}
