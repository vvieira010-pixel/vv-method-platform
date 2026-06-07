/**
 * Listening.jsx — Student-facing listening exercise component.
 *
 * TTS cascade (keys stored in localStorage, never in the client bundle):
 *   1. ElevenLabs  — vv:elevenlabs_api_key  — highest quality
 *   2. OpenAI TTS  — vv:openai_api_key      — good quality, reuses AI key
 *   3. Browser speechSynthesis              — always available, no key needed
 *
 * Flow:
 *   Student presses ▶ → audio plays (limit: exercise.plays, default 2)
 *   After first play → question + options appear
 *   Student selects an option → submits → instant feedback + explanation
 */
import { useState, useRef, useCallback } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';
const EL_VOICE    = '21m00Tcm4TlvDq8ikWAM'; // ElevenLabs — Rachel, natural American English
const OPENAI_VOICE = 'nova';                  // OpenAI TTS — nova (female, clear, neutral)

/* ── Key helpers ──────────────────────────────────────────────── */
function lsGet(key) { try { return localStorage.getItem(key) || ''; } catch { return ''; } }
const getElKey     = () => lsGet('vv:elevenlabs_api_key');
const getOpenAIKey = () => lsGet('vv:openai_api_key');
const getPiperUrl  = () => lsGet('vv:piper_server_url');
const getGeminiKey = () => { const v = lsGet('vv:gemini_api_key'); return v ? v.split(',')[0].trim() : ''; };

/* ── TTS helpers ──────────────────────────────────────────────── */
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

/** ElevenLabs → OpenAI TTS → Gemini TTS → Piper (local) → null */
async function fetchAudio(text) {
  const elKey = getElKey();
  if (elKey) return fetchElevenLabsAudio(text, elKey);
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
      padding: '12px 16px', borderRadius: 10,
      border: '1.5px solid', cursor: submitted ? 'default' : 'pointer',
      transition: 'all 0.15s', fontSize: 14.5, lineHeight: 1.5,
      fontFamily: 'var(--font-ui)', textAlign: 'left', width: '100%',
    };
    if (!submitted) {
      return selected === i
        ? { ...base, borderColor: TEAL, background: '#F0FDFA', color: NAVY }
        : { ...base, borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' };
    }
    if (i === correct) return { ...base, borderColor: '#059669', background: '#ECFDF5', color: '#065F46' };
    if (i === selected && !isCorrect) return { ...base, borderColor: 'var(--danger)', background: '#FEF2F2', color: '#991B1B' };
    return { ...base, borderColor: 'var(--divider)', background: 'var(--surface)', color: 'var(--muted)', opacity: 0.6 };
  }

  function markerLabel(i) {
    if (!submitted) return selected === i ? '◉' : '○';
    if (i === correct) return '✓';
    if (i === selected && !isCorrect) return '✗';
    return String.fromCharCode(65 + i);
  }

  const playsLeft = maxPlays === Infinity ? null : maxPlays - playCount;

  return (
    <div style={{ padding: '16px 20px' }}>

      {/* Picture hint (context clue before listening) */}
      {pictureHint && (
        <div style={{
          padding: '8px 12px', marginBottom: 16, borderRadius: 8,
          background: 'var(--accent-subtle)', color: 'var(--muted)',
          fontSize: 13, fontStyle: 'italic', lineHeight: 1.5, border: '1px solid var(--accent-soft)',
        }}>
          🖼 {pictureHint}
        </div>
      )}

      {/* Audio player */}
      <div style={{
        padding: '20px 16px', borderRadius: 14, marginBottom: 20,
        background: 'linear-gradient(135deg, #F0FDFA 0%, #EEF2FF 100%)',
        border: '1.5px solid rgba(13,148,136,.22)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: '#0E5F6B', textTransform: 'uppercase',
        }}>
          🎧 Listening Exercise
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
          {loading ? '⏳' : playing ? '⏹' : '▶'}
        </button>

        {/* Play status */}
        <div style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
          {loading
            ? (audioSrc ? 'Loading audio…' : 'Generating audio…')
            : playing
              ? 'Playing — press ⏹ to stop'
              : playCount === 0
                ? `Press ▶ to listen${playsLeft != null ? ` — ${playsLeft} play${playsLeft > 1 ? 's' : ''} allowed` : ''}`
                : playsLeft === 0
                  ? 'Maximum plays reached'
                  : `${playsLeft} play${playsLeft > 1 ? 's' : ''} remaining — press ▶ to replay`}
        </div>

        {error && (
          <div style={{ fontSize: 12.5, color: 'var(--danger)', textAlign: 'center' }}>
            ⚠ {error} You can read the transcript below to answer.
          </div>
        )}
      </div>

      {/* Transcript — shown after answering (learning moment) or when audio fails
          (accessibility fallback). Hidden during the normal listening challenge. */}
      {audioText && (submitted || error) && (
        <div style={{
          padding: '12px 14px', marginBottom: 16, borderRadius: 8,
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
                    ? '#059669'
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
                padding: '10px 24px', borderRadius: 10, border: 'none',
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
              padding: '12px 16px', borderRadius: 10,
              background: isCorrect ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${isCorrect ? '#A7F3D0' : '#FECACA'}`,
              fontSize: 14,
            }}>
              <div style={{
                color: isCorrect ? '#065F46' : '#991B1B',
                fontWeight: 600,
                marginBottom: explanation ? 6 : 0,
              }}>
                {isCorrect ? '✓ Correct — well done.' : '✗ Not quite. Review the correct answer above.'}
              </div>
              {explanation && (
                <div style={{ color: '#374151', fontWeight: 400, fontSize: 13.5, lineHeight: 1.65 }}>
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
