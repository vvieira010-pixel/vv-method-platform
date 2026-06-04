/**
 * exercise-player.jsx — Student-facing interactive renderers for all 7 exercise types.
 * Each type renders the exercise as the student experiences it.
 */
import { useState, useRef, useEffect } from 'react';
import { Icon, Card, Button, Pill } from './shared.jsx';
import { getExType, parseBlankTemplate, shuffleArray, autoGrade } from '../lib/exercise-types.js';
import { ExTypeBadge } from './exercise-editor.jsx';
import Listening from './exercises/Listening.jsx';

/**
 * ExercisePlayer — switches on exercise.type, renders the right interactive UI.
 * @param {{ exercise, response, onResponse, readOnly }} props
 *   exercise  — the exercise definition object
 *   response  — current student response state
 *   onResponse — (updatedResponse) => void
 *   readOnly  — if true, disable interactions (for teacher preview)
 */
export function ExercisePlayer({ exercise, response, onResponse, readOnly = false }) {
  if (!exercise) return null;

  const update = (patch) => {
    if (readOnly) return;
    onResponse?.({ ...response, ...patch });
  };

  switch (exercise.type) {
    case 'mcq':   return <MCQPlayer   ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'blank': return <BlankPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'short': return <ShortPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'speak': return <SpeakPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'order': return <OrderPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'fix':   return <FixPlayer   ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'flash': return <FlashPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />;
    case 'listen': return <Listening exercise={exercise} onComplete={(result) => update({ selected: result?.correct ? exercise.correct : -1 })} />;
    default:
      return (
        <div style={{ padding: 14, fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
          {exercise.instruction || exercise.prompt || 'Exercise content'}
        </div>
      );
  }
}

/* ─── 1. MULTIPLE CHOICE ────────────────────────────────────── */
function MCQPlayer({ ex, res, update, readOnly }) {
  const pick = res?.selected ?? null;
  const showResult = pick !== null;

  return (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text)', lineHeight: 1.55 }}>
        {ex.question}
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {(ex.options || []).map((opt, i) => {
          const selected = pick === i;
          const isRight = i === ex.correct;
          let borderColor = 'var(--border)';
          let bg = 'var(--surface)';
          if (showResult && selected && isRight)  { borderColor = 'var(--success)'; bg = 'var(--success-bg)'; }
          if (showResult && selected && !isRight)  { borderColor = 'var(--danger)'; bg = 'var(--danger-bg)'; }
          if (showResult && !selected && isRight)  { borderColor = 'var(--success)'; bg = 'var(--surface)'; }
          if (!showResult && selected)              { borderColor = 'var(--primary)'; bg = 'var(--accent-subtle)'; }

          return (
            <div
              key={i}
              onClick={() => !readOnly && update({ selected: i })}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 10,
                border: `1.5px solid ${borderColor}`, background: bg,
                cursor: readOnly ? 'default' : 'pointer',
                transition: 'all .15s var(--ease)',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                background: selected ? 'var(--primary)' : 'transparent',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', flex: 1 }}>{opt}</span>
              {showResult && isRight && <Icon.check size={16} color="var(--success)" />}
            </div>
          );
        })}
      </div>
      {showResult && (
        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 10,
          background: pick === ex.correct ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: pick === ex.correct ? 'var(--success)' : 'var(--danger)',
          fontSize: 'var(--text-sm)',
        }}>
          {pick === ex.correct ? '✓ Correct!' : 'Not quite — check the highlighted answer above.'}
        </div>
      )}
    </div>
  );
}

/* ─── 2. FILL THE BLANK ─────────────────────────────────────── */
function BlankPlayer({ ex, res, update, readOnly }) {
  const segments = parseBlankTemplate(ex.template);
  const studentBlanks = res?.blanks || [];
  const correctBlanks = ex.blanks || [];

  const getStatus = (blankIdx) => {
    const val = (studentBlanks[blankIdx] || '').trim().toLowerCase();
    if (!val) return null;
    const accepted = (correctBlanks[blankIdx] || '').split('|').map(a => a.trim().toLowerCase());
    return accepted.includes(val) ? 'ok' : 'warn';
  };

  return (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: 'var(--text-md)', lineHeight: 2.2, color: 'var(--text)' }}>
        {segments.map((seg, i) => {
          if (seg.type === 'text') return <span key={i}>{seg.value}</span>;
          const status = getStatus(seg.index);
          const color = status === 'ok' ? 'var(--success)' : status === 'warn' ? 'var(--warning)' : 'var(--primary)';
          return (
            <input
              key={i}
              value={studentBlanks[seg.index] || ''}
              onChange={e => {
                const blanks = [...studentBlanks];
                blanks[seg.index] = e.target.value;
                update({ blanks });
              }}
              disabled={readOnly}
              placeholder="___"
              style={{
                border: 'none', borderBottom: `2px solid ${color}`,
                outline: 'none', fontSize: 'var(--text-md)', width: 130,
                padding: '2px 6px', textAlign: 'center',
                fontFamily: 'var(--font-ui)', fontWeight: 600,
                color, background: 'transparent',
              }}
            />
          );
        })}
      </p>
    </div>
  );
}

/* ─── 3. SHORT ANSWER ──────────────────────────────────────── */
function ShortPlayer({ ex, res, update, readOnly }) {
  const text = res?.text || '';
  const wc = text.split(/\s+/).filter(Boolean).length;
  const target = ex.targetWords || 120;

  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text)', lineHeight: 1.55 }}>
        {ex.prompt}
      </p>
      {ex.rubric && (
        <p style={{ margin: '0 0 12px', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
          {ex.rubric}
        </p>
      )}
      <textarea
        className="input" rows={6} value={text}
        onChange={e => update({ text: e.target.value })}
        disabled={readOnly}
        placeholder="Start writing your answer…"
        style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)' }}>{wc} words</span>
        <span style={{ fontSize: 'var(--text-xs)', color: wc >= target * 0.8 ? 'var(--success)' : 'var(--muted)' }}>
          target {target} words {wc >= target * 0.8 ? '· you\'re there' : `· ${target - wc} to go`}
        </span>
      </div>
      <div style={{
        marginTop: 14, padding: '10px 14px', borderRadius: 10,
        background: 'var(--info-bg)', fontSize: 'var(--text-xs)', color: 'var(--info)',
      }}>
        After you submit, AI rates your response 1–5 and flags strengths + next step. Your teacher reviews before sending feedback.
      </div>
    </div>
  );
}

/* ─── 4. SPEAKING ──────────────────────────────────────────── */
function SpeakPlayer({ ex, res, update, readOnly }) {
  const [status, setStatus] = useState('idle'); // idle | recording | done
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const target = ex.targetSeconds || 60;

  const start = async () => {
    if (readOnly) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => update({ audioB64: reader.result, transcript: res?.transcript || '' });
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRef.current.start();
      setStatus('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      window.toast?.('Microphone access denied.', 'warn');
    }
  };

  const stop = () => {
    clearInterval(timerRef.current);
    mediaRef.current?.stop();
    setStatus('done');
  };

  const reset = () => {
    clearInterval(timerRef.current);
    setSeconds(0);
    setStatus('idle');
    update({ audioB64: null, transcript: '' });
  };

  useEffect(() => () => { clearInterval(timerRef.current); mediaRef.current?.stream?.getTracks().forEach(t => t.stop()); }, []);

  // If we already have audio from a previous session
  useEffect(() => { if (res?.audioB64) setStatus('done'); }, []);

  return (
    <div>
      <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Speaking prompt</div>
        <p style={{ margin: 0, fontSize: 'var(--text-md)', color: 'var(--text)', lineHeight: 1.55, fontWeight: 500 }}>
          {ex.prompt}
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}> Target: {target} seconds.</span>
        </p>
      </div>

      {status === 'idle' && (
        <Button variant="primary" onClick={start} disabled={readOnly}>
          <Icon.mic size={13} /> Start recording
        </Button>
      )}

      {status === 'recording' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button variant="danger" onClick={stop}>
            <span style={{ width: 8, height: 8, background: '#fff', display: 'inline-block', borderRadius: 2 }} />
            Stop · {fmt(seconds)}
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999, background: 'var(--danger)',
              animation: 'vv-pulse 1s ease-in-out infinite',
            }} />
            Recording
          </div>
          <style>{`@keyframes vv-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
          {/* Mini waveform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} style={{
                width: 2, height: 22,
                background: 'var(--primary)', borderRadius: 999,
                transform: `scaleY(${(4 + Math.abs(Math.sin(seconds * 0.7 + i * 0.4)) * 18) / 22})`,
                transformOrigin: 'bottom', transition: 'transform .2s',
              }} />
            ))}
          </div>
        </div>
      )}

      {status === 'done' && (
        <div>
          {res?.audioB64 && (
            <div style={{ marginBottom: 12, padding: 10, background: 'var(--bg)', borderRadius: 8 }}>
              <audio controls src={res.audioB64} style={{ width: '100%', height: 36 }} />
            </div>
          )}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Optional — type a transcript
            </span>
          </div>
          <textarea
            className="input" rows={3} value={res?.transcript || ''}
            onChange={e => update({ transcript: e.target.value })}
            disabled={readOnly}
            placeholder="Type what you said…"
            style={{ fontSize: 'var(--text-sm)' }}
          />
          {!readOnly && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Button variant="ghost" size="sm" onClick={reset}>Re-record</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── 5. ORDER SENTENCES ───────────────────────────────────── */
function OrderPlayer({ ex, res, update, readOnly }) {
  const sentences = ex.sentences || [];

  // Initialize shuffled order if not set
  const [order, setLocalOrder] = useState(() => {
    if (res?.order?.length === sentences.length) return res.order;
    const indices = sentences.map((_, i) => i);
    return shuffleArray(indices, ex.id);
  });

  // Sync order to response
  useEffect(() => {
    if (!readOnly && order.length > 0) update({ order });
  }, [order]);

  const move = (i, dir) => {
    if (readOnly) return;
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setLocalOrder(next);
  };

  const isCorrect = order.every((idx, i) => idx === i);

  return (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
        Put the sentences in the correct order. Use the arrows.
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {order.map((idx, i) => (
          <div key={idx} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center',
            padding: '12px 14px', borderRadius: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)',
              color: 'var(--accent)', width: 24, textAlign: 'center',
            }}>{i + 1}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', lineHeight: 1.5 }}>{sentences[idx]}</span>
            {!readOnly && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={orderArrowStyle(i === 0)}>↑</button>
                <button onClick={() => move(i, 1)} disabled={i === order.length - 1} style={orderArrowStyle(i === order.length - 1)}>↓</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {isCorrect && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: 'var(--success-bg)', color: 'var(--success)', fontSize: 'var(--text-sm)',
        }}>
          ✓ Correct order!
        </div>
      )}
    </div>
  );
}

function orderArrowStyle(disabled) {
  return {
    width: 24, height: 22, padding: 0, fontFamily: 'var(--font-ui)',
    fontSize: 12, border: '1px solid var(--border)', borderRadius: 6,
    background: 'var(--surface)', color: disabled ? 'var(--faint)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

/* ─── 6. ERROR CORRECTION ──────────────────────────────────── */
function FixPlayer({ ex, res, update, readOnly }) {
  const text = res?.text ?? ex.errorText;
  const corrected = (ex.correctedText || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const current = (text || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const isFixed = corrected && current === corrected;
  const hasChanged = text !== ex.errorText;

  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
        Find and correct all errors. Edit the text directly.
      </p>
      {ex.hint && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', background: 'var(--warning-bg)',
          color: 'var(--warning)', borderRadius: 999,
          fontSize: 'var(--text-xs)', marginBottom: 12,
        }}>
          <Icon.spark size={11} /> {ex.hint}
        </div>
      )}
      <textarea
        className="input" rows={4} value={text}
        onChange={e => update({ text: e.target.value })}
        disabled={readOnly}
        style={{ fontSize: 'var(--text-sm)', lineHeight: 1.75 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)' }}>
          Edit the text above to fix the errors.
        </span>
        {hasChanged && (
          <Pill tone={isFixed ? 'success' : 'warning'}>
            {isFixed ? '✓ All errors fixed' : 'Keep going'}
          </Pill>
        )}
      </div>
    </div>
  );
}

/* ─── 7. FLASHCARDS ─────────────────────────────────────────── */
function FlashPlayer({ ex, res, update, readOnly }) {
  const pairs = (ex.pairs || []).filter(p => p.term || p.def);
  const [idx, setIdx] = useState(res?.idx || 0);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState(res?.learned || 0);

  if (pairs.length === 0) return <p style={{ color: 'var(--muted)' }}>No flashcards defined.</p>;

  const card = pairs[Math.min(idx, pairs.length - 1)];

  const next = () => { setFlipped(false); setIdx(i => Math.min(i + 1, pairs.length - 1)); };
  const prev = () => { setFlipped(false); setIdx(i => Math.max(i - 1, 0)); };
  const mark = () => {
    const newLearned = learned + 1;
    setLearned(newLearned);
    if (!readOnly) update({ idx: Math.min(idx + 1, pairs.length - 1), learned: newLearned });
    next();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>{idx + 1} of {pairs.length}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--success)' }}>✓ {learned} learned</span>
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(f => !f)}
        style={{
          background: flipped ? 'var(--accent-deep)' : 'var(--surface)',
          color: flipped ? '#F0F6FC' : 'var(--text)',
          border: `2px solid ${flipped ? 'var(--accent-deep)' : 'var(--border)'}`,
          borderRadius: 14, padding: '40px 28px', textAlign: 'center',
          minHeight: 160, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transition: 'all .3s var(--ease)',
        }}
      >
        <div style={{
          fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em',
          color: flipped ? 'rgba(240,246,252,.55)' : 'var(--faint)',
          marginBottom: 14,
        }}>
          {flipped ? 'Definition' : 'Term'}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 600,
          fontSize: flipped ? 'var(--text-lg)' : 'var(--text-2xl)',
          lineHeight: 1.3, maxWidth: 480,
        }}>
          {flipped ? card.def : card.term}
        </div>
        <div style={{
          marginTop: 16, fontSize: 'var(--text-xs)',
          color: flipped ? 'rgba(240,246,252,.4)' : 'var(--faint)',
          letterSpacing: '.1em', textTransform: 'uppercase',
        }}>
          Click to flip
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={prev} disabled={idx === 0}>
          <Icon.arrowL size={12} /> Previous
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          {flipped && !readOnly && (
            <Button variant="primary" size="sm" onClick={mark}>
              <Icon.check size={12} /> Learned
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={next} disabled={idx === pairs.length - 1}>
            Next <Icon.arrowR size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── HOMEWORK STEP-THROUGH WRAPPER ─────────────────────────── */

/**
 * HomeworkStepThrough — renders exercises one at a time with progress bar + navigation.
 * Used in the student dashboard to walk through a homework set.
 */
export function HomeworkStepThrough({ exercises, responses, onResponse, onSubmit, readOnly = false }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!exercises || exercises.length === 0) return null;

  const total = exercises.length;
  const current = exercises[currentIdx];
  const currentRes = responses?.[current?.id] || {};
  const progress = ((currentIdx + 1) / total) * 100;

  const goPrev = () => setCurrentIdx(i => Math.max(i - 1, 0));
  const goNext = () => setCurrentIdx(i => Math.min(i + 1, total - 1));
  const isLast = currentIdx === total - 1;

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
          Exercise {currentIdx + 1} / {total}
        </span>
        <div style={{ flex: 1, height: 5, background: 'var(--divider)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 999, transform: `scaleX(${progress / 100})`, transformOrigin: 'left', transition: 'transform 0.3s var(--ease)' }} />
        </div>
      </div>

      {/* Current exercise */}
      <Card style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <ExTypeBadge typeId={current.type} size="md" />
        </div>
        <ExercisePlayer
          exercise={current}
          response={currentRes}
          onResponse={(updated) => onResponse?.(current.id, updated)}
          readOnly={readOnly}
        />
      </Card>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentIdx === 0}>
          <Icon.arrowL size={12} /> Previous
        </Button>
        {isLast ? (
          <Button variant="primary" onClick={onSubmit} disabled={readOnly}>
            <Icon.check size={13} /> Submit Homework
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={goNext}>
            Next <Icon.arrowR size={12} />
          </Button>
        )}
      </div>
    </div>
  );
}
