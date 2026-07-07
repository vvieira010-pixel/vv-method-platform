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
import { fetchAudio, fetchConversationAudio, fetchAudioWithGender } from '../../lib/tts-utils.js';
import { callAI } from '../../lib/callAI.js';

const TEAL = 'var(--accent)';
const NAVY = 'var(--accent-text)';

/* ── Browser speech synthesis fallback */
let _synthVoices = [];
if (typeof window !== 'undefined' && window.speechSynthesis) {
  _synthVoices = speechSynthesis.getVoices();
  if (!_synthVoices.length) {
    speechSynthesis.onvoiceschanged = () => { _synthVoices = speechSynthesis.getVoices(); };
  }
}
function pickBestVoice() {
  return _synthVoices.find(v =>
    /Google US English|Samantha|Microsoft.*David|Microsoft.*Zira|Microsoft.*Jenny|Microsoft.*Aria|Microsoft.*Guy|Google.*UK/i.test(v.name)
  ) || _synthVoices.find(v => v.lang.startsWith('en') && v.name.includes('Female'))
    || _synthVoices.find(v => v.lang.startsWith('en')) || null;
}
function speakBrowser(text) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return; }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.85;
    utter.pitch = 1;
    utter.onend = resolve;
    utter.onerror = resolve;
    const preferred = pickBestVoice();
    if (preferred) utter.voice = preferred;
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

/* ── AI script generation for multi-voice conversations ──────── */
const CACHE_PREFIX = 'prac:listening:script:';
const CONVERSATION_PARTS = ['P1', 'P2'];

async function generateScript(context) {
  const prompt = `Write a very short natural English conversation (2-4 lines) between two speakers for a listening test. Use "A:" and "B:" prefixes. The conversation should relate to this context: ${context}. Keep each line under 15 words. Output ONLY the script lines, one per line.`;
  const res = await callAI(prompt, { system: 'You write short natural English conversation scripts for language tests. Output only the script lines.', temperature: 0.5, max_tokens: 500 });
  const text = res?.content?.[0]?.text || res?.text || '';
  return text.split('\n').filter(l => l.trim()).map(l => {
    const m = l.trim().match(/^([AB]):\s*(.+)/i);
    if (!m) return null;
    return { speaker: m[1].toUpperCase(), text: m[2] };
  }).filter(Boolean);
}

function utterancesFromScript(script) {
  return script.map(u => ({
    text: u.text,
    gender: u.speaker === 'A' ? 'female' : 'male'
  }));
}

/* ── Component ────────────────────────────────────────────────── */
export default function Listening({ exercise = {}, onComplete }) {
  const {
    audioText = '',
    audioSrc = '',   // pre-recorded URL — skips TTS when set
    script = null,   // optional multi-speaker script [{ speaker: 'A'|'B', text: '...' }]
    question = '',
    options = [],
    correct = null,
    explanation = '',
    plays = 0,
    pictureHint = '',
    metPart = '',    // 'P1' | 'P2' | 'P3' — optional MET context
    instruction = '',
    vocabulary = [],
  } = exercise;

  const [playCount, setPlayCount] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError]         = useState('');
  const [audioUrl, setAudioUrl]   = useState(null);
  const [playing, setPlaying]     = useState(false);
  const [revealed, setRevealed]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  const isMultiVoice = script && script.length > 0;
  const maxPlays = plays === 0 ? Infinity : plays;
  const canPlay  = !playing && !submitted && playCount < maxPlays;

  const handlePlay = useCallback(async () => {
    if (!canPlay) return;
    setError('');
    setLoading(true);

    try {
      let url = audioUrl;

      if (!url) {
        if (script && script.length > 0) {
          // Multi-voice conversation from predefined script
          const utterances = utterancesFromScript(script);
          url = await fetchConversationAudio(utterances);
        } else if (audioSrc) {
          url = audioSrc;
        } else {
          // Try generating conversation script for conversation parts
          if (CONVERSATION_PARTS.includes(metPart) && audioText && !script) {
            setGenerating(true);
            const cacheKey = CACHE_PREFIX + (exercise.text || exercise.question || audioText || '').slice(0, 40);
            let generated = null;
            try {
              const cached = sessionStorage.getItem(cacheKey);
              if (cached) generated = JSON.parse(cached);
            } catch {}
            if (!generated) {
              generated = await generateScript(exercise.question || audioText);
              if (generated && generated.length > 0) {
                try { sessionStorage.setItem(cacheKey, JSON.stringify(generated)); } catch {}
              }
            }
            setGenerating(false);
            if (generated && generated.length > 0) {
              const utterances = utterancesFromScript(generated);
              url = await fetchConversationAudio(utterances);
            }
          }
          // Fallback to single-voice TTS
          if (!url) {
            url = await fetchAudio(audioText);
          }
        }
        if (url) setAudioUrl(url);
      }

      setLoading(false);
      setPlaying(true);
      setPlayCount(c => c + 1);

      if (url) {
        try {
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.playbackRate = playbackRate;
          audio.onended = () => { setPlaying(false); setRevealed(true); };
          audio.onerror = (e) => {
            setPlaying(false);
            setError('Audio format not supported or file corrupted. Try again.');
            console.error('Audio playback error:', e);
          };
          await audio.play();
        } catch (e) {
          setPlaying(false);
          setError(`Playback blocked: ${e.message}`);
        }
      } else {
        await speakBrowser(audioText);
        setPlaying(false);
        setRevealed(true);
      }
    } catch (e) {
      setLoading(false);
      setGenerating(false);
      setPlaying(false);
      setError(e.message || 'Could not play audio.');
      setRevealed(true);
    }
  }, [canPlay, audioText, audioSrc, audioUrl, playbackRate, script, metPart, exercise]);

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
      fontFamily: 'var(--font-sans)', textAlign: 'left', width: '100%',
    };
    if (!submitted) {
      return selected === i
        ? { ...base, borderColor: TEAL, background: 'var(--ex-selected-bg)', color: NAVY }
        : { ...base, borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' };
    }
    if (i === correct) return { ...base, borderColor: 'var(--ex-panel-border)', background: 'var(--ex-panel-bg)', color: 'var(--text)' };
    return { ...base, borderColor: 'var(--divider)', background: 'var(--surface)', color: 'var(--muted)', opacity: 0.6 };
  }

  function markerLabel(i) {
    if (!submitted) return selected === i ? '◉' : '○';
    return String.fromCharCode(65 + i);
  }

  const playsLeft = maxPlays === Infinity ? null : maxPlays - playCount;
  const partConfig = metPart ? MET_LISTENING_CONFIG[metPart] : null;

  return (
    <div style={{ padding: '16px 20px' }} onKeyDown={e => { if (e.key === 'Enter' && !submitted && selected != null) { e.preventDefault(); handleSubmit(); } }}>

      {/* Exercise Title */}
      {exercise.title && (
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 16, lineHeight: 1.2 }}>
          {exercise.title}
        </div>
      )}

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

      {/* Vocabulary preview */}
      {vocabulary.length > 0 && (
        <div style={{
          padding: '8px 12px', marginBottom: 14,
          background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-xs)', border: '1px solid var(--accent-soft)',
        }}>
          <strong style={{ color: 'var(--primary)', marginRight: 6 }}>Key vocabulary:</strong>
          {vocabulary.map((word, i) => (
            <span key={i} style={{
              display: 'inline-block', background: 'var(--white)', padding: '2px 8px',
              borderRadius: 0, marginRight: 4, marginBottom: 2,
              border: '1px solid var(--accent-soft)', fontWeight: 600,
              color: 'var(--text)',
            }}>{typeof word === 'string' ? word : word.word || word.term || ''}</span>
          ))}
        </div>
      )}

      {/* Picture hint (context clue before listening) */}
      {pictureHint && (
        /^https?:\/\//.test(pictureHint) || pictureHint.startsWith('/') ? (
          <div style={{ marginBottom: 16 }}>
            <img src={pictureHint} alt="Listening context" style={{ width: '100%', maxWidth: 480, borderRadius: 'var(--radius-sm)', display: 'block', margin: '0 auto' }} />
          </div>
        ) : (
          <div style={{
            padding: '8px 12px', marginBottom: 16, borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-subtle)', color: 'var(--muted)',
            fontSize: 13, fontStyle: 'italic', lineHeight: 1.5, border: '1px solid var(--accent-soft)',
          }}>
            <Icon.image size={14} /> {pictureHint}
          </div>
        )
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
          <Icon.headphones size={14} /> Listening Practice Studio
        </div>

        {/* Play / Stop button */}
        <button
          onClick={playing ? handleStop : handlePlay}
          disabled={loading || generating || (!canPlay && !playing)}
          aria-label={loading ? 'Loading audio…' : generating ? 'Generating script…' : playing ? 'Stop' : 'Play audio'}
          style={{
            width: 64, height: 64, borderRadius: '50%', border: 'none',
            background: loading ? 'var(--border)' : playing ? '#EF4444' : TEAL,
            color: '#fff',
            cursor: (loading || generating || (!canPlay && !playing)) ? 'not-allowed' : 'pointer',
            fontSize: 24, display: 'grid', placeItems: 'center',
            boxShadow: playing ? '0 0 0 6px rgba(239,68,68,.15)' : '0 4px 14px rgba(13,148,136,.3)',
            transition: 'all 0.18s var(--ease)',
            opacity: (loading || generating || (!canPlay && !playing)) ? 0.45 : 1,
          }}
        >
          {loading || generating ? '...' : playing ? <Icon.stop size={20} /> : <Icon.play size={20} />}
        </button>

        {/* Play status */}
        <div style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
          {loading || generating
            ? (generating ? 'Generating conversation script...' : audioSrc ? 'Loading audio…' : 'Generating audio…')
            : playing
              ? 'Playing — press Stop to stop'
              : playCount === 0
                ? `Press Play to listen${playsLeft != null ? ` — ${playsLeft} play${playsLeft > 1 ? 's' : ''} allowed` : ''}`
                : playsLeft === 0
                  ? 'Maximum plays reached'
                  : `${playsLeft} play${playsLeft > 1 ? 's' : ''} remaining — press Play to replay`}
        </div>

        {isMultiVoice && (
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
            padding: '2px 8px', borderRadius: 99, background: '#7c3aed1a', color: '#7c3aed',
            border: '1px solid #7c3aed33',
          }}>Multi-voice</span>
        )}

        {error && (
          <div style={{ fontSize: 12.5, color: 'var(--danger)', textAlign: 'center' }}>
            <Icon.warning size={12} /> {error} You can read the transcript below to answer.
          </div>
        )}

        {/* Speed control */}
        {!submitted && !error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <span>Speed:</span>
            {[0.75, 1, 1.25, 1.5].map(s => (
              <button
                key={s}
                onClick={() => {
                  setPlaybackRate(s);
                  if (audioRef.current) audioRef.current.playbackRate = s;
                }}
                aria-pressed={playbackRate === s}
                style={{
                  padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${playbackRate === s ? 'var(--accent)' : 'var(--border)'}`,
                  background: playbackRate === s ? 'var(--accent-subtle)' : 'transparent',
                  color: playbackRate === s ? 'var(--primary)' : 'var(--muted)',
                  cursor: 'pointer', fontWeight: playbackRate === s ? 700 : 400,
                  fontFamily: 'var(--font-sans)', fontSize: 11,
                  transition: 'all 0.12s',
                }}
              >{s}x</button>
            ))}
          </div>
        )}
      </div>



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
                  background: 'transparent',
                  color: 'inherit',
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
                fontFamily: 'var(--font-sans)',
                opacity: selected == null ? 0.5 : 1, transition: 'all 0.15s',
              }}
            >
              Submit answer
            </button>
          ) : (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              background: 'var(--ex-panel-bg)',
              border: '1px solid var(--ex-panel-border)',
              fontSize: 14,
            }}>
              <div style={{
                color: 'var(--text)',
                fontWeight: 600,
                marginBottom: explanation ? 6 : 0,
              }}>
                Answer shown above
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


