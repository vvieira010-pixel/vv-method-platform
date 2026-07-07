export const VOICES = {
  female: {
    elevenlabs: '21m00Tcm4TlvDq8ikWAM',
    deepgram:   'aura-2-thalia-en',
    openai:     'nova',
    gemini:     'Kore',
  },
  male: {
    elevenlabs: 'pNInz6obpgDQGcFmaJgB',
    deepgram:   'aura-2-asteria-en',
    openai:     'onyx',
    gemini:     'Puck',
  },
};

function lsGet(key) { try { return localStorage.getItem(key) || ''; } catch { return ''; } }
const getElKey     = () => lsGet('vv:elevenlabs_api_key');
const getDeepgramKey = () => lsGet('vv:deepgram_api_key');
const getOpenAIKey = () => lsGet('vv:openai_api_key');
const getPiperUrl  = () => lsGet('vv:piper_server_url');
const getGeminiKey = () => { const v = lsGet('vv:gemini_api_key'); return v ? v.split(',')[0].trim() : ''; };

function getSessionToken() {
  try {
    const raw = localStorage.getItem('vv:supabase_session');
    if (!raw) return '';
    const s = JSON.parse(raw);
    return s?.access_token || '';
  } catch { return ''; }
}

async function fetchServerAudio(text, gender = 'female') {
  const token = getSessionToken();
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ text, gender }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Server TTS error ${res.status}`);
  }
  const blob = await res.blob();
  if (!blob.type.startsWith('audio/')) {
    throw new Error(`Server returned invalid audio format: ${blob.type}`);
  }
  return URL.createObjectURL(blob);
}

async function fetchElevenLabsAudio(text, apiKey, gender = 'female') {
  const voice = VOICES[gender]?.elevenlabs || VOICES.female.elevenlabs;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
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

async function fetchOpenAIAudio(text, apiKey, gender = 'female') {
  const voice = VOICES[gender]?.openai || VOICES.female.openai;
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', input: text, voice }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI TTS error ${res.status}`);
  }
  return URL.createObjectURL(await res.blob());
}

async function fetchDeepgramAudio(text, apiKey, gender = 'female') {
  const model = VOICES[gender]?.deepgram || VOICES.female.deepgram;
  const res = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`, {
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

async function fetchGeminiAudio(text, apiKey, gender = 'female') {
  const voiceName = VOICES[gender]?.gemini || VOICES.female.gemini;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
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

export async function fetchAudio(text) {
  try { return await fetchServerAudio(text); } catch (e) { console.warn('[tts] Server proxy failed:', e.message); }
  const elKey = getElKey();
  if (elKey) { try { return await fetchElevenLabsAudio(text, elKey); } catch (e) { console.warn('[tts] ElevenLabs failed:', e.message); } }
  const deepgramKey = getDeepgramKey();
  if (deepgramKey) { try { return await fetchDeepgramAudio(text, deepgramKey); } catch (e) { console.warn('[tts] Deepgram failed:', e.message); } }
  const oaiKey = getOpenAIKey();
  if (oaiKey) { try { return await fetchOpenAIAudio(text, oaiKey); } catch (e) { console.warn('[tts] OpenAI failed:', e.message); } }
  const geminiKey = getGeminiKey();
  if (geminiKey) { try { return await fetchGeminiAudio(text, geminiKey); } catch (e) { console.warn('[tts] Gemini failed:', e.message); } }
  const piperUrl = getPiperUrl();
  if (piperUrl) { try { return await fetchPiperAudio(text, piperUrl); } catch (e) { console.warn('[tts] Piper failed:', e.message); } }
  return null;
}

export async function fetchAudioWithGender(text, gender = 'female') {
  try { return await fetchServerAudio(text, gender); } catch (e) { console.warn('[tts] Server proxy failed:', e.message); }
  const elKey = getElKey();
  if (elKey) { try { return await fetchElevenLabsAudio(text, elKey, gender); } catch (e) { console.warn('[tts] ElevenLabs failed:', e.message); } }
  const deepgramKey = getDeepgramKey();
  if (deepgramKey) { try { return await fetchDeepgramAudio(text, deepgramKey, gender); } catch (e) { console.warn('[tts] Deepgram failed:', e.message); } }
  const oaiKey = getOpenAIKey();
  if (oaiKey) { try { return await fetchOpenAIAudio(text, oaiKey, gender); } catch (e) { console.warn('[tts] OpenAI failed:', e.message); } }
  const geminiKey = getGeminiKey();
  if (geminiKey) { try { return await fetchGeminiAudio(text, geminiKey, gender); } catch (e) { console.warn('[tts] Gemini failed:', e.message); } }
  const piperUrl = getPiperUrl();
  if (piperUrl) { try { return await fetchPiperAudio(text, piperUrl); } catch (e) { console.warn('[tts] Piper failed:', e.message); } }
  return null;
}

function audioBufferToWav(buffer) {
  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const data = buffer.getChannelData(0);
  const dataLen = data.length * (bitDepth / 8);
  const headerLen = 44;
  const totalLen = headerLen + dataLen;
  const arrayBuffer = new ArrayBuffer(totalLen);
  const view = new DataView(arrayBuffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLen - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numCh * (bitDepth / 8), true);
  view.setUint16(32, numCh * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLen, true);
  let idx = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(idx, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    idx += 2;
  }
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

export async function fetchConversationAudio(utterances) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const buffers = [];
  for (const u of utterances) {
    const url = await fetchAudioWithGender(u.text, u.gender || 'female');
    if (!url) continue;
    const resp = await fetch(url);
    const ab = await resp.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(ab);
    buffers.push(decoded);
    URL.revokeObjectURL(url);
  }
  if (buffers.length === 0) return null;
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const out = audioCtx.createBuffer(1, totalLength, audioCtx.sampleRate);
  let offset = 0;
  for (const buf of buffers) {
    out.copyToChannel(buf.getChannelData(0), 0, offset);
    offset += buf.length;
  }
  const wavBlob = audioBufferToWav(out);
  return URL.createObjectURL(wavBlob);
}
