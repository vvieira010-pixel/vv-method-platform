import { useState, useRef, useEffect } from 'react';
import { MET_TASK_CONFIG } from '../../lib/met-task-spec.js';
import { getDbContext, uploadSubmissionAudio } from '../../lib/supabase-db.js';

const TEAL = 'var(--accent)';
const NAVY = 'var(--accent-text)';

const SCORE_DESCRIPTORS = [
  { score: 4, label: 'Fully relevant — extensive supporting detail' },
  { score: 3, label: 'Relevant — completes task, general detail only' },
  { score: 2, label: 'Mostly relevant — some difficulty completing task' },
  { score: 1, label: 'Short or simple — difficulty completing task' },
  { score: 0, label: 'No response or completely irrelevant' },
];

// MET_TASK_CONFIG now lives in src/lib/met-task-spec.js (single source of truth).

const DEFAULT_CHECKS = [
  'Did I give a clear opinion?',
  'Did I give one reason?',
  'Did I give one example?',
  'Did I finish with a consequence or conclusion?',
];

function SpeakingRecorder({ exercise, taskConfig, reflectionChecks, onComplete }) {
  const { prompt, context, instruction, imageUrl, imageAlt, imageDescription } = exercise;
  const [status, setStatus] = useState('idle'); // idle | recording | done
  const [seconds, setSeconds] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [selfScore, setSelfScore] = useState(null);
  const [checks, setChecks] = useState(Array(reflectionChecks.length).fill(false));
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    mediaRef.current?.stream?.getTracks().forEach(t => t.stop());
  }, []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setPlaybackUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        setStatus('done');
        const ctx = getDbContext();
        if (ctx) {
          const rand = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
          const path = `${ctx.authUid}/${rand}/${exercise.id || 'speaking'}.webm`;
          try {
            await uploadSubmissionAudio(blob, path);
            if (onComplete) onComplete({ submitted: true, correct: null, audioPath: path, audioB64: null });
          } catch (e) {
            console.warn('[speak] audio upload failed:', e.message);
            if (blob.size < 500_000) {
              const reader = new FileReader();
              reader.onloadend = () => { if (onComplete) onComplete({ submitted: true, correct: null, audioB64: reader.result, audioPath: null }); };
              reader.readAsDataURL(blob);
            } else {
              if (onComplete) onComplete({ submitted: true, correct: null, audioB64: null, audioPath: null });
            }
          }
        } else {
          const reader = new FileReader();
          reader.onloadend = () => { if (onComplete) onComplete({ submitted: true, correct: null, audioB64: reader.result }); };
          reader.readAsDataURL(blob);
        }
      };
      mediaRef.current.start();
      setStatus('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      window.toast?.('Microphone access denied. Check browser permissions.', 'warn');
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    mediaRef.current?.stop();
  }

  function reset() {
    clearInterval(timerRef.current);
    setSeconds(0);
    setStatus('idle');
    setPlaybackUrl(null);
    setSelfScore(null);
    setChecks(Array(reflectionChecks.length).fill(false));
  }

  return (
    <div>
      {instruction && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>{instruction}</p>
      )}
      {context && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm, 6px)', marginBottom: 14, fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--text-2)' }}>
          {context}
        </div>
      )}
      {imageUrl ? (
        <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)', overflow: 'hidden' }}>
          <img src={imageUrl} alt={imageAlt || imageDescription || 'Picture for this task'} loading="lazy" style={{ maxWidth: '100%', maxHeight: 360, display: 'block', margin: '0 auto' }} />
          {imageDescription && (
            <p style={{ margin: 0, padding: '8px 12px', fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>{imageDescription}</p>
          )}
        </div>
      ) : imageDescription ? (
        <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--accent-border, var(--border))' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Picture to describe</div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text)', lineHeight: 1.6 }}>{imageDescription}</p>
        </div>
      ) : null}

      {taskConfig && (
        <div style={{ border: '1px solid var(--ex-cat-blue-border)', borderRadius: 'var(--radius-sm, 6px)', marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: 'var(--ex-cat-blue-text)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {taskConfig.label}
            </span>
          </div>
          <div style={{ background: 'var(--ex-cat-blue-bg)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ex-cat-blue-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Best structure</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ex-cat-blue-strong)', fontWeight: 600 }}>{taskConfig.structure}</div>
            </div>
            {taskConfig.frames?.length > 0 && (
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ex-cat-blue-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Useful phrases</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {taskConfig.frames.map((f, i) => (
                    <span key={i} style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', background: 'var(--ex-cat-blue-chip)', color: 'var(--ex-cat-blue-strong)', borderRadius: 'var(--radius-sm, 6px)', fontStyle: 'italic' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
            {taskConfig.trap && (
              <div style={{ padding: '8px 12px', background: 'var(--ex-wrong-bg)', border: '1px solid var(--ex-wrong-border)', borderRadius: 'var(--radius-sm, 6px)' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Common mistake: </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ex-wrong-text)' }}>{taskConfig.trap}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: NAVY, marginBottom: 16, lineHeight: 1.6 }}>{prompt}</p>

      {/* Record controls */}
      {status === 'idle' && (
        <button
          onClick={startRecording}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 'var(--radius-sm, 6px)', border: 'none',
            background: `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
            color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer',
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF4D4D', display: 'inline-block' }} />
          Start recording
        </button>
      )}

      {status === 'recording' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={stopRecording}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', borderRadius: 'var(--radius-sm, 6px)', border: 'none',
              background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer',
            }}
          >
            <span style={{ width: 10, height: 10, background: '#fff', display: 'inline-block', borderRadius: 2 }} />
            Stop recording
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF4D4D', display: 'inline-block', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>{fmt(seconds)}</span>
          </div>
        </div>
      )}

      {status === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.22s ease-out both' }}>
          {playbackUrl && (
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Your recording</div>
              <audio controls src={playbackUrl} style={{ width: '100%', height: 40 }} />
            </div>
          )}

          <button
            onClick={reset}
            style={{
              background: 'none', border: `1.5px solid ${TEAL}`, color: TEAL,
              borderRadius: 99, padding: '6px 16px', fontSize: 'var(--text-sm)',
              fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
            }}
          >
            ↺ Record again
          </button>

          {taskConfig && (
            <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: NAVY, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Score your Task Completion (0–4):
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setSelfScore(n)} style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-sm, 6px)',
                    border: `2px solid ${selfScore === n ? TEAL : 'var(--border)'}`,
                    background: selfScore === n ? TEAL : 'var(--surface)',
                    color: selfScore === n ? '#fff' : NAVY,
                    fontWeight: 700, fontSize: 'var(--text-base)', cursor: 'pointer', transition: 'all 0.15s',
                  }}>{n}</button>
                ))}
              </div>
              {selfScore !== null && (
                <div style={{ marginTop: 10, fontSize: 'var(--text-sm)', color: 'var(--ex-panel-text)', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>{selfScore}: </span>
                  {SCORE_DESCRIPTORS.find(d => d.score === selfScore)?.label}
                </div>
              )}
            </div>
          )}

          <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: NAVY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Self-check your answer:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reflectionChecks.map((label, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checks[i]} onChange={() => setChecks(prev => prev.map((v, idx) => idx === i ? !v : v))}
                    style={{ width: 17, height: 17, marginTop: 2, accentColor: TEAL, flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--text-sm)', color: checks[i] ? 'var(--ex-correct-text)' : 'var(--text)', lineHeight: 1.5, fontWeight: checks[i] ? 600 : 400 }}>{label}</span>
                </label>
              ))}
            </div>
            {checks.every(Boolean) && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--ex-correct-bg)', borderRadius: 'var(--radius-sm, 6px)', fontSize: 'var(--text-sm)', color: 'var(--ex-correct-text)', fontWeight: 600 }}>
                All task requirements checked.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShortAnswer({ exercise, onComplete }) {
  const { prompt, rubric, context, instruction, imageUrl, imageAlt, metTaskType } = exercise;
  const taskConfig = metTaskType ? MET_TASK_CONFIG[metTaskType] : null;
  const reflectionChecks = taskConfig ? taskConfig.checks : DEFAULT_CHECKS;

  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [selfScore, setSelfScore] = useState(null);
  const [checks, setChecks] = useState(Array(reflectionChecks.length).fill(false));

  if (exercise.type === 'speak') {
    return <SpeakingRecorder exercise={exercise} taskConfig={taskConfig} reflectionChecks={reflectionChecks} onComplete={onComplete} />;
  }

  function handleSubmit() {
    if (!text.trim()) return;
    setSubmitted(true);
    if (onComplete) onComplete({ submitted: true, correct: null });
  }

  function toggleCheck(i) {
    setChecks(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  const rubricItems = Array.isArray(rubric) ? rubric : rubric ? [rubric] : [];

  return (
    <div>
      {instruction && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>{instruction}</p>
      )}
      {context && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm, 6px)', marginBottom: 14, fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--text-2)' }}>
          {context}
        </div>
      )}

      {imageUrl && (
        <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)', overflow: 'hidden', background: 'var(--ex-panel-bg)', textAlign: 'center' }}>
          <img src={imageUrl} alt={imageAlt || 'Picture for this task'} loading="lazy" style={{ maxWidth: '100%', maxHeight: 360, display: 'block', margin: '0 auto' }} />
        </div>
      )}

      {taskConfig && !submitted && (
        <div style={{ border: '1px solid var(--ex-cat-blue-border)', borderRadius: 'var(--radius-sm, 6px)', marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: 'var(--ex-cat-blue-text)', borderRadius: 'var(--radius-sm, 6px) var(--radius-sm, 6px) 0 0' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {taskConfig.label}
            </span>
          </div>

          <div style={{ background: 'var(--ex-cat-blue-bg)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ex-cat-blue-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Best structure
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ex-cat-blue-strong)', fontWeight: 600 }}>{taskConfig.structure}</div>
            </div>

            {taskConfig.frames && taskConfig.frames.length > 0 && (
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ex-cat-blue-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Useful phrases
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {taskConfig.frames.map((f, i) => (
                    <span key={i} style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', background: 'var(--ex-cat-blue-chip)', color: 'var(--ex-cat-blue-strong)', borderRadius: 'var(--radius-sm, 6px)', fontStyle: 'italic' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {taskConfig.trap && (
              <div style={{ padding: '8px 12px', background: 'var(--ex-wrong-bg)', border: '1px solid var(--ex-wrong-border)', borderRadius: 'var(--radius-sm, 6px)' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Common mistake: </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ex-wrong-text)' }}>{taskConfig.trap}</span>
              </div>
            )}

            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ex-cat-blue-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Task Completion score (0–4)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {SCORE_DESCRIPTORS.map(({ score, label }) => (
                  <div key={score} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 'var(--text-xs)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--ex-cat-blue-text)', minWidth: 14, flexShrink: 0 }}>{score}</span>
                    <span style={{ color: 'var(--ex-cat-blue-strong)', lineHeight: 1.5 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {rubricItems.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'var(--ex-selected-bg)', border: '1px solid var(--ex-selected-border)', borderRadius: 'var(--radius-sm, 6px)', marginBottom: 16 }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            What a strong answer includes:
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rubricItems.map((item, i) => (
              <li key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--ex-correct-text)', lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: NAVY, marginBottom: 14, lineHeight: 1.6 }}>{prompt}</p>

      <textarea
        value={text}
        onChange={e => !submitted && setText(e.target.value)}
        disabled={submitted}
        rows={6}
        placeholder="Write your answer here…"
        aria-label="Your answer"
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm, 6px)',
          border: `1.5px solid ${submitted ? 'var(--border)' : text.trim() ? TEAL : 'var(--border)'}`,
          fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', lineHeight: 1.7,
          resize: 'vertical', outline: 'none', color: 'var(--text)',
          background: submitted ? 'var(--bg)' : 'var(--surface)',
          transition: 'border-color 0.15s',
        }}
      />

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          style={{
            marginTop: 10, padding: '10px 24px', borderRadius: 'var(--radius-sm, 6px)', border: 'none',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            background: text.trim() ? `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` : 'var(--border)',
            color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
             opacity: text.trim() ? 1 : 0.5, transition: 'opacity 0.15s',

          }}
        >
          Submit response
        </button>
      ) : (
        <div role="status" aria-live="polite" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.22s ease-out both' }}>
          <div style={{
            borderRadius: 'var(--radius-sm, 6px)', overflow: 'hidden',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              padding: '9px 14px', background: NAVY, color: '#fff',
              fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Your answer
            </div>
            <div style={{
              padding: '12px 14px', fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--ex-panel-text)',
              background: 'var(--ex-panel-bg)', whiteSpace: 'pre-wrap',
            }}>
              {text || '(no response)'}
            </div>
          </div>

          {rubricItems.length > 0 && (
            <div style={{
              borderRadius: 'var(--radius-sm, 6px)', overflow: 'hidden',
              border: '1px solid var(--ex-selected-border)',
            }}>
              <div style={{
                padding: '9px 14px', background: TEAL, color: '#fff',
                fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                What a strong answer includes
              </div>
              <div style={{ padding: '12px 14px', background: 'var(--ex-selected-bg)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
                <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {rubricItems.map((item, i) => (
                    <li key={i} style={{ color: 'var(--ex-correct-text)', lineHeight: 1.6 }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {exercise.explanation && (
            <div style={{
              padding: '11px 14px', background: 'var(--ex-hint-bg)', borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--ex-hint-border)', fontSize: 'var(--text-sm)', color: 'var(--ex-hint-text)', lineHeight: 1.6,
            }}>
              <strong>Why this matters: </strong>
              {exercise.explanation}
            </div>
          )}

          {taskConfig && (
            <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: NAVY, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Score your Task Completion (0–4):
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setSelfScore(n)}
                    style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-sm, 6px)',
                      border: `2px solid ${selfScore === n ? TEAL : 'var(--border)'}`,
                      background: selfScore === n ? TEAL : 'var(--surface)',
                      color: selfScore === n ? '#fff' : NAVY,
                      fontWeight: 700, fontSize: 'var(--text-base)', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {selfScore !== null && (
                <div style={{ marginTop: 10, fontSize: 'var(--text-sm)', color: 'var(--ex-panel-text)', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>{selfScore}: </span>
                  {SCORE_DESCRIPTORS.find(d => d.score === selfScore)?.label}
                  {' — '}
                  <span style={{ color: 'var(--muted)' }}>your teacher will compare this to their assessment.</span>
                </div>
              )}
            </div>
          )}

          <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: NAVY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Self-check your answer:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reflectionChecks.map((label, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    onChange={() => toggleCheck(i)}
                    style={{ width: 17, height: 17, marginTop: 2, accentColor: TEAL, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', color: checks[i] ? 'var(--ex-correct-text)' : 'var(--text)', lineHeight: 1.5, fontWeight: checks[i] ? 600 : 400 }}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
            {checks.every(Boolean) && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--ex-correct-bg)', borderRadius: 'var(--radius-sm, 6px)', fontSize: 'var(--text-sm)', color: 'var(--ex-correct-text)', fontWeight: 600 }}>
                {taskConfig ? 'All task requirements checked — your teacher will review your response.' : 'All criteria met — your teacher will review your response.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
