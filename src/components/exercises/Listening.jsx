/**
 * Listening.jsx — Student-facing listening exercise component.
 *
 * TTS cascade:
 *   1. Server proxy — /api/tts, using server-side ElevenLabs/OpenAI keys
 *   2. ElevenLabs   — vv:elevenlabs_api_key browser fallback
 *   3. Deepgram     — vv:deepgram_api_key browser fallback
 *   4. OpenAI TTS   — vv:openai_api_key browser fallback
 *   5. Browser speechSynthesis — always available, no key needed
 *
 * Flow:
 *   Student presses ▶ → audio plays (limit: exercise.plays, default 2)
 *   After first play → question + options appear
 *   Student selects an option → submits → instant feedback + explanation
 */
import { useState, useRef, useCallback } from 'react';
import { Icon } from '../shared.jsx';

const TEAL = 'var(--accent)';
const NAVY = 'var(--primary-ink)';
const EL_VOICE    = '21m00Tcm4TlvDq8ikWAM'; // ElevenLabs — Rachel, natural American English
const DEEPGRAM_MODEL = 'aura-2-thalia-en';    // Deepgram Aura-2 — clear American English
const OPENAI_VOICE = 'nova';                  // OpenAI TTS — nova (female, clear, neutral)

/* ── Key helpers ──────────────────────────────────────────────── */
function lsGet(key) { try { return localStorage.getItem(key) || ''; } catch { return ''; } }
const getElKey     = () => lsGet('vv:elevenlabs_api_key');
const getDeepgramKey = () => lsGet('vv:deepgram_api_key');
const getOpenAIKey = () => lsGet('vv:openai_api_key');
const getPiperUrl  = () => lsGet('vv:piper_server_url');
const getGeminiKey = () => { const v = lsGet('vv:gemini_api_key'); return v ? v.split(',')[0].trim() : ''; };

/* ── TTS helpers ──────────────────────────────────────────────── */
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

/** Server proxy → ElevenLabs → Deepgram → OpenAI TTS → Gemini TTS → Piper (local) → null */
async function fetchAudio(text) {
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

function speakBrowser(text) {
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

// MET Listening part banners — from met_test_basics_task_breakdown.md
const MET_LISTENING_CONFIG = {
  P1: {
    label: 'Listening Part 1 — Short Conversation',
    tip: 'Listen for: main point · speaker intention · detail · implied meaning · function of a phrase · what will happen next.',
    trap: 'Choosing an answer based on one word instead of the whole meaning.',
  },
  P2: {
    label: 'Listening Part 2 — Longer Conversation',
    tip: 'Listen for: main topic · sequence · problem and solution · speaker opinions · what a speaker will probably do next.',
    trap: 'Forgetting earlier information by the time the questions appear.',
  },
  P3: {
    label: 'Listening Part 3 — Short Talk',
    tip: 'Listen for: purpose of the talk · main idea · key detail · reason · speaker attitude · inference · next step.',
    trap: 'Missing the purpose and focusing only on isolated details.',
  },
};

/* ── Component ────────────────────────────────────────────────── */
export default function Listening({ exercise, onComplete }) {
  const {
    audioText = '',
    audioSrc = '',   // pre-recorded URL — skips TTS when set
    question = '',
    options = [],
    correct = null,
    explanation = '',
    plays = 0,
    pictureHint = '',
    metPart = '',    // 'P1' | 'P2' | 'P3' — optional MET context
    instruction = '',
  } = exercise;

  const [playCount, setPlayCount] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [audioUrl, setAudioUrl]   = useState(null); // cached blob URL from ElevenLabs
  const [playing, setPlaying]     = useState(false);
  const [revealed, setRevealed]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const audioRef = useRef(null);

  const maxPlays = plays === 0 ? Infinity : plays;
  const canPlay  = !playing && !submitted && playCount < maxPlays;

  const handlePlay = useCallback(async () => {
    if (!canPlay) return;
    setError('');
    setLoading(true);

    try {
      let url = audioUrl;

      // Fetch from TTS once, then reuse cached blob URL for replays
      if (!url) {
        url = audioSrc || await fetchAudio(audioText); // pre-recorded URL → TTS cascade → null
        if (url) setAudioUrl(url);
      }

      setLoading(false);
      setPlaying(true);
      setPlayCount(c => c + 1);

      if (url) {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setPlaying(false); setRevealed(true); };
        audio.onerror = () => { setPlaying(false); setError('Playback failed — try again.'); };
        await audio.play();
      } else {
        // Browser TTS fallback — no API key configured
        await speakBrowser(audioText);
        setPlaying(false);
        setRevealed(true);
      }
    } catch (e) {
      setLoading(false);
      setPlaying(false);
      setError(e.message || 'Could not play audio.');
      setRevealed(true);
    }
  }, [canPlay, audioText, audioSrc, audioUrl]);

  function handleStop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.cancel();
    }
    setPlaying(false);
    setRevealed(true);
  }

  function handleSubmit() {
    if (selected == null) return;
    setSubmitted(true);
    if (onComplete) onComplete({ correct: selected === correct });
  }

  const isCorrect = selected === correct;

  function optionStyle(i) {
    const base = {
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 'var(--radius-sm)',
      border: '1.5px solid', cursor: submitted ? 'default' : 'pointer',
      transition: 'all 0.15s', fontSize: 14.5, lineHeight: 1.5,
      fontFamily: 'var(--font-ui)', textAlign: 'left', width: '100%',
    };
    if (!submitted) {
      return selected === i
        ? { ...base, borderColor: TEAL, background: 'var(--ex-selected-bg)', color: NAVY }
        : { ...base, borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' };
    }
    if (i === correct) return { ...base, borderColor: 'var(--ex-correct-strong)', background: 'var(--ex-correct-bg)', color: 'var(--ex-correct-text)' };
    if (i === selected && !isCorrect) return { ...base, borderColor: 'var(--danger)', background: 'var(--ex-wrong-bg)', color: 'var(--ex-wrong-text)' };
    return { ...base, borderColor: 'var(--divider)', background: 'var(--surface)', color: 'var(--muted)', opacity: 0.6 };
  }

  function markerLabel(i) {
    if (!submitted) return selected === i ? '◉' : '○';
    if (i === correct) return '✓';
    if (i === selected && !isCorrect) return '✗';
    return String.fromCharCode(65 + i);
  }

  const playsLeft = maxPlays === Infinity ? null : maxPlays - playCount;
  const partConfig = metPart ? MET_LISTENING_CONFIG[metPart] : null;

  return (
    <div style={{ padding: '16px 20px' }}>

      {/* MET part banner */}
      {partConfig && (
        <div style={{ padding: '10px 14px', background: 'var(--ex-cat-sky-bg)', border: '1px solid var(--ex-cat-sky-border)', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ex-cat-sky-text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {partConfig.label}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ex-cat-sky-strong)', lineHeight: 1.55 }}>{partConfig.tip}</div>
          <div style={{ marginTop: 5, fontSize: 12, color: 'var(--ex-hint-text)' }}>
            <strong>Watch out:</strong> {partConfig.trap}
          </div>
        </div>
      )}

      {instruction && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>{instruction}</p>
      )}

      {/* Picture hint (context clue before listening) */}
      {pictureHint && (
        <div style={{
          padding: '8px 12px', marginBottom: 16, borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-subtle)', color: 'var(--muted)',
          fontSize: 13, fontStyle: 'italic', lineHeight: 1.5, border: '1px solid var(--accent-soft)',
        }}>
          <Icon.image size={14} /> {pictureHint}
        </div>
      )}

      {/* Audio player */}
      <div style={{
        padding: '20px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20,
        background: 'linear-gradient(135deg, var(--ex-selected-bg) 0%, var(--ex-cat-blue-bg) 100%)',
        border: '1.5px solid rgba(13,148,136,.22)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: 'var(--accent)', textTransform: 'uppercase',
        }}>
          <Icon.headphones size={14} /> Listening Exercise
        </div>

        {/* Play / Stop button */}
        <button
          onClick={playing ? handleStop : handlePlay}
          disabled={loading || (!canPlay && !playing)}
          aria-label={loading ? 'Loading audio…' : playing ? 'Stop' : 'Play audio'}
          style={{
            width: 64, height: 64, borderRadius: '50%', border: 'none',
            background: loading ? 'var(--border)' : playing ? '#EF4444' : TEAL,
            color: '#fff',
            cursor: (loading || (!canPlay && !playing)) ? 'not-allowed' : 'pointer',
            fontSize: 24, display: 'grid', placeItems: 'center',
            boxShadow: playing ? '0 0 0 6px rgba(239,68,68,.15)' : '0 4px 14px rgba(13,148,136,.3)',
            transition: 'all 0.18s var(--ease)',
            opacity: (loading || (!canPlay && !playing)) ? 0.45 : 1,
          }}
        >
          {loading ? '...' : playing ? <Icon.stop size={20} /> : <Icon.play size={20} />}
        </button>

        {/* Play status */}
        <div style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
          {loading
            ? (audioSrc ? 'Loading audio…' : 'Generating audio…')
            : playing
              ? 'Playing — press Stop to stop'
              : playCount === 0
                ? `Press Play to listen${playsLeft != null ? ` — ${playsLeft} play${playsLeft > 1 ? 's' : ''} allowed` : ''}`
                : playsLeft === 0
                  ? 'Maximum plays reached'
                  : `${playsLeft} play${playsLeft > 1 ? 's' : ''} remaining — press Play to replay`}
        </div>

        {error && (
          <div style={{ fontSize: 12.5, color: 'var(--danger)', textAlign: 'center' }}>
            <Icon.warning size={12} /> {error} You can read the transcript below to answer.
          </div>
        )}
      </div>

      {/* Transcript — shown after answering (learning moment) or when audio fails
          (accessibility fallback). Hidden during the normal listening challenge. */}
      {audioText && (submitted || error) && (
        <div style={{
          padding: '12px 14px', marginBottom: 16, borderRadius: 'var(--radius-sm)',
          background: 'var(--bg)', border: '1px solid var(--border)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6,
          }}>
            Transcript
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)' }}>
            {audioText}
          </div>
        </div>
      )}

      {/* Question — revealed after first listen */}
      {revealed ? (
        <div>
          <p style={{ fontSize: 15.5, fontWeight: 600, color: NAVY, marginBottom: 16, lineHeight: 1.6 }}>
            {question}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => !submitted && setSelected(i)}
                style={optionStyle(i)}
                aria-pressed={selected === i}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                  background: submitted && i === correct
                    ? 'var(--ex-correct-strong)'
                    : submitted && i === selected && !isCorrect
                      ? 'var(--danger)'
                      : 'transparent',
                  color: submitted && (i === correct || (i === selected && !isCorrect))
                    ? '#fff'
                    : 'inherit',
                }}>
                  {markerLabel(i)}
                </span>
                <span>{opt}</span>
              </button>
            ))}
          </div>

          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={selected == null}
              style={{
                padding: '10px 24px', borderRadius: 'var(--radius-sm)', border: 'none',
                cursor: selected == null ? 'not-allowed' : 'pointer',
                background: selected == null
                  ? 'var(--border)'
                  : `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
                color: '#fff', fontWeight: 600, fontSize: 14,
                fontFamily: 'var(--font-ui)',
                opacity: selected == null ? 0.5 : 1, transition: 'all 0.15s',
              }}
            >
              Submit answer
            </button>
          ) : (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              background: isCorrect ? 'var(--ex-correct-bg)' : 'var(--ex-wrong-bg)',
              border: `1px solid ${isCorrect ? 'var(--ex-correct-border)' : 'var(--ex-wrong-border)'}`,
              fontSize: 14,
            }}>
              <div style={{
                color: isCorrect ? 'var(--ex-correct-text)' : 'var(--ex-wrong-text)',
                fontWeight: 600,
                marginBottom: explanation ? 6 : 0,
              }}>
                {isCorrect ? '✓ Correct — well done.' : '✗ Not quite. Review the correct answer above.'}
              </div>
              {explanation && (
                <div style={{ color: 'var(--ex-panel-text)', fontWeight: 400, fontSize: 13.5, lineHeight: 1.65 }}>
                  {explanation}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        !playing && playCount === 0 && (
          <p style={{
            color: 'var(--muted)', fontSize: 13.5,
            textAlign: 'center', fontStyle: 'italic',
          }}>
            Listen to the audio first, then answer the question.
          </p>
        )
      )}
    </div>
  );
}

