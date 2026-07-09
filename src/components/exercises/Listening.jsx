/**
 * Listening.jsx — Student-facing listening exercise component.
 *
 * TTS priority:
 *   1. ElevenLabs (VITE_ELEVENLABS_API_KEY env var or vv:elevenlabs_api_key in localStorage)
 *   2. Browser speechSynthesis (always available, no key needed)
 *
 * Flow:
 *   Student presses ▶ → audio plays (limit: exercise.plays, default 2)
 *   After first play → question + options appear
 *   Student selects an option → submits → instant feedback + explanation
 */
import { useState, useRef, useCallback, useEffect } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';
const EL_VOICE = '21m00Tcm4TlvDq8ikWAM'; // ElevenLabs — Rachel, natural American English

/* ── TTS helpers ──────────────────────────────────────────────── */
// TTS removed as per user request.
// The component now functions as a text-based listening/reading exercise.
// Students can read the transcript to answer the question.

/* ── Component ────────────────────────────────────────────────── */
export default function Listening({ exercise, onComplete }) {
  const {
    audioText = '',
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
  const [playing, setPlaying]     = useState(false);
  const [revealed, setRevealed]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [audioUrl, setAudioUrl]   = useState(null);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const audioRef = useRef(null);

  const maxPlays = plays === 0 ? Infinity : plays;
  const canPlay  = !playing && !submitted && playCount < maxPlays;

  const playAudio = useCallback(async () => {
    if (audioUrl) {
      audioRef.current?.play();
      return;
    }

    setIsFetchingAudio(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: audioText }),
      });
      const data = await res.json();
      if (data.audioB64) {
        setAudioUrl(data.audioB64);
        // Small delay to ensure audio element is updated before playing
        setTimeout(() => {
          audioRef.current?.play();
        }, 100);
      } else {
        setError(data.error?.message || 'Failed to fetch audio');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsFetchingAudio(false);
    }
  }, [audioText, audioUrl]);

  const handleAction = useCallback(async () => {
    if (!canPlay) return;

    if (!revealed) {
      setRevealed(true);
      await playAudio();
      setPlayCount(c => c + 1);
    } else {
      await playAudio();
      setPlayCount(c => c + 1);
    }
  }, [canPlay, revealed, playAudio]);

  function handleStop() {
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
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        style={{ display: 'none' }}
      />

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

      {/* Transcript / Audio player replacement */}
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

        {/* Action button (Play / Reveal) */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleAction}
            disabled={isFetchingAudio || !audioText || !canPlay}
            aria-label={isFetchingAudio ? 'Loading audio...' : (revealed ? 'Play audio' : 'Reveal & Play')}
            style={{
              width: 64, height: 64, borderRadius: '50%', border: 'none',
              background: isFetchingAudio ? 'var(--border)' : TEAL,
              color: '#fff',
              cursor: (isFetchingAudio || !audioText || !canPlay) ? 'not-allowed' : 'pointer',
              fontSize: 24, display: 'grid', placeItems: 'center',
              boxShadow: playing ? '0 0 0 6px rgba(239,68,68,.15)' : '0 4px 14px rgba(13,148,136,.3)',
              transition: 'all 0.18s var(--ease)',
              opacity: (isFetchingAudio || !audioText || !canPlay) ? 0.45 : 1,
            }}
          >
            {isFetchingAudio ? '⏳' : (revealed ? '▶' : '👁')}
          </button>
        </div>

        {/* Status */}
        <div style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
          {isFetchingAudio
            ? 'Loading audio...'
            : revealed
              ? 'Transcript revealed'
              : playCount === 0
                ? 'Click 👁 to reveal the transcript'
                : playsLeft === 0
                  ? 'Maximum plays reached'
                  : `${playsLeft} play${playsLeft > 1 ? 's' : ''} remaining — click 👁 to replay`}
        </div>
      </div>

      {/* Transcript — shown after reveal */}
      {audioText && (revealed || error) && (
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

      {/* Question — revealed after reveal */}
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
            Read the transcript to answer the question.
          </p>
        )
      )}
    </div>
  );
}
