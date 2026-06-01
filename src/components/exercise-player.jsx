/**
 * exercise-player.jsx — Student-facing interactive renderers for all 7 exercise types.
 * Each type renders the exercise as the student experiences it.
 */
import { useState, useRef, useEffect } from 'react';
import { Icon, Card, Button, Pill } from './shared.jsx';
import { getExType, parseBlankTemplate, shuffleArray, autoGrade } from '../lib/exercise-types.js';
import { ExTypeBadge } from './exercise-editor.jsx';

const EXERCISE_LABELS = {
  mcq: 'Listening Comprehension',
  blank: 'Fill the Blank',
  short: 'Written Response',
  speak: 'Speaking Response',
  order: 'Sentence Order',
  fix: 'Error Correction',
  flash: 'Flashcards',
};

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

  let content = null;
  switch (exercise.type) {
    case 'mcq':   content = <MCQPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />; break;
    case 'blank': content = <BlankPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />; break;
    case 'short': content = <ShortPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />; break;
    case 'speak': content = <SpeakPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />; break;
    case 'order': content = <OrderPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />; break;
    case 'fix':   content = <FixPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />; break;
    case 'flash': content = <FlashPlayer ex={exercise} res={response} update={update} readOnly={readOnly} />; break;
    default:
      content = (
        <div style={{ padding: 14, fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
          {exercise.instruction || exercise.prompt || 'Exercise content'}
        </div>
      );
      break;
  }

  const checklist = buildPracticeChecklist(exercise);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {content}
      <WhatYouPracticed checklist={checklist} />
    </div>
  );
}

function exerciseLabel(type) {
  return EXERCISE_LABELS[type] || 'Exercise';
}

function hasCompletedResponse(ex, res = {}) {
  switch (ex?.type) {
    case 'mcq':
      return res.selected !== undefined && res.selected !== null;
    case 'blank': {
      const expected = Math.max(ex.blanks?.length || 0, parseBlankTemplate(ex.template || '').filter(s => s.type === 'blank').length);
      return expected === 0 || (res.blanks || []).filter(Boolean).length >= expected;
    }
    case 'short':
      return Boolean((res.text || '').trim());
    case 'speak':
      return Boolean(res.audioB64 || (res.transcript || '').trim());
    case 'order':
      return Array.isArray(res.order) && res.order.length === (ex.sentences || []).length;
    case 'fix':
      return Boolean((res.text || '').trim()) && res.text !== ex.errorText;
    case 'flash':
      return (res.learned || 0) > 0 || (res.idx || 0) > 0;
    default:
      return true;
  }
}

function WhatYouPracticed({ checklist }) {
  return (
    <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 12 }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
        What You Practiced
      </div>
      <div style={{ display: 'grid', gap: 7 }}>
        {checklist.map((item, idx) => (
          <label key={`${item.label}-${idx}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--text-2)' }}>
            <input type="checkbox" checked readOnly />
            <span><strong>{item.label}:</strong> {item.value}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function buildPracticeChecklist(ex) {
  const mainSkill = {
    mcq: 'Listening and reading comprehension',
    blank: 'Vocabulary and grammar accuracy',
    short: 'Written communication and idea development',
    speak: 'Spoken fluency and answer organization',
    order: 'Cohesion and logical sequencing',
    fix: 'Grammar editing and self-correction',
    flash: 'Vocabulary recall and active usage',
  }[ex?.type] || 'Target language practice';

  const subskill = {
    mcq: 'Finding key clues and selecting evidence-based answers',
    blank: 'Choosing precise words or forms in context',
    short: 'Building clear answers with support',
    speak: 'Delivering complete MET-style responses',
    order: 'Connecting ideas in the right order',
    fix: 'Noticing and correcting recurring mistakes',
    flash: 'Retrieving meaning quickly under time pressure',
  }[ex?.type] || 'Applying language with control';

  const usefulLanguage = normalizePracticeText(
    ex?.modelResponse ||
    ex?.example ||
    ex?.explanation ||
    ex?.prompt ||
    ex?.question
  ) || 'Useful language from this task to reuse in your next response.';

  const grammarVocabStrategy = {
    mcq: 'Strategy: remove options with weak evidence before choosing.',
    blank: 'Grammar/Vocabulary: check collocation and sentence fit before finalizing.',
    short: 'Strategy: plan statement + reason + support before writing.',
    speak: 'Strategy: pause briefly, then answer in complete ideas.',
    order: 'Strategy: find sequence markers (first, then, however, finally).',
    fix: 'Grammar: compare your correction with the original error pattern.',
    flash: 'Vocabulary: say each term in a real sentence to keep it active.',
  }[ex?.type] || 'Use one grammar or vocabulary upgrade in your next attempt.';

  const metOrRealConnection = normalizePracticeText(
    ex?.metConnection ||
    ex?.realCommunicationConnection
  ) || defaultConnection(ex?.type);

  return [
    { label: 'Main skill', value: mainSkill },
    { label: 'Subskill', value: subskill },
    { label: 'Useful language', value: usefulLanguage },
    { label: 'Grammar/Vocabulary/Strategy', value: grammarVocabStrategy },
    { label: 'MET or real communication connection', value: metOrRealConnection },
  ];
}

function normalizePracticeText(text) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= 150) return clean;
  return `${clean.slice(0, 147)}...`;
}

function defaultConnection(type) {
  switch (type) {
    case 'mcq':
      return 'Supports MET listening/reading choices and everyday evidence-based decisions.';
    case 'blank':
      return 'Builds accuracy you need for MET tasks and clear professional messages.';
    case 'short':
      return 'Helps you write stronger MET responses and clearer real-world messages.';
    case 'speak':
      return 'Improves MET speaking timing and confident communication in real conversations.';
    case 'order':
      return 'Improves coherence for MET speaking/writing and natural communication flow.';
    case 'fix':
      return 'Builds editing habits for MET accuracy and professional communication.';
    case 'flash':
      return 'Strengthens quick word access for MET performance and daily communication.';
    default:
      return 'Connects directly to stronger MET performance and clearer communication.';
  }
}

/* ─── 1. MULTIPLE CHOICE ────────────────────────────────────── */
function MCQPlayer({ ex, res, update, readOnly }) {
  const pick = res?.selected ?? null;
  const showResult = pick !== null;

  return (
    <div>
      <p className="hw-prompt-title">
        {ex.question}
      </p>
      <div className="hw-choice-list">
        {(ex.options || []).map((opt, i) => {
          const selected = pick === i;
          const isRight = i === ex.correct;

          return (
            <button
              key={i}
              onClick={() => !readOnly && update({ selected: i })}
              type="button"
              className={'hw-choice' + (selected ? ' is-selected' : '')}
              disabled={readOnly}
            >
              <span className="hw-choice-dot" />
              <span>{opt}</span>
              {showResult && isRight && <Icon.check size={16} color="var(--success)" />}
            </button>
          );
        })}
      </div>
      {showResult && (
        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 14,
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
      <p className="hw-prompt-title">
        {ex.prompt}
      </p>
      {ex.rubric && (
        <p className="hw-soft-note">
          {ex.rubric}
        </p>
      )}
      <textarea
        className="hw-textarea" rows={6} value={text}
        onChange={e => update({ text: e.target.value })}
        disabled={readOnly}
        placeholder="Type your response here..."
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)' }}>{wc} words</span>
        <span style={{ fontSize: 'var(--text-xs)', color: wc >= target * 0.8 ? 'var(--success)' : 'var(--muted)' }}>
          target {target} words {wc >= target * 0.8 ? '· you\'re there' : `· ${target - wc} to go`}
        </span>
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

  const level = status === 'recording'
    ? 38 + Math.round(Math.abs(Math.sin(seconds * 1.2)) * 46)
    : status === 'done'
      ? 100
      : 8;

  return (
    <div className="speak-shell">
      <div className="speak-segment" aria-label="Response mode">
        <button type="button" className="is-active">Speaking</button>
        <button type="button">Writing</button>
      </div>

      <div className="speak-panel">
        <h3>{status === 'done' ? 'Review Your Response' : 'Record Your Response'}</h3>
        <p>{ex.prompt}</p>
        <p>Click the microphone to start recording your answer. Max duration: {target}s.</p>

        {status !== 'done' && (
          <button
            type="button"
            className={'speak-record' + (status === 'recording' ? ' is-recording' : '')}
            onClick={status === 'recording' ? stop : start}
            disabled={readOnly}
            aria-label={status === 'recording' ? 'Stop recording' : 'Start recording'}
          >
            {status === 'recording' ? (
              <span style={{ width: 22, height: 22, borderRadius: 5, background: '#fff' }} />
            ) : (
              <Icon.mic size={42} />
            )}
          </button>
        )}

        {status === 'done' && res?.audioB64 && (
          <div className="speak-audio">
            <audio controls src={res.audioB64} style={{ width: '100%', height: 36 }} />
          </div>
        )}

        <div className="speak-level">
          <div className="speak-level-row">
            <span>Audio Level</span>
            <span>{fmt(seconds)} / {fmt(target)}</span>
          </div>
          <div className="speak-level-track">
            <div className="speak-level-fill" style={{ width: `${Math.min(100, level)}%` }} />
          </div>
        </div>

        {status === 'done' && (
          <textarea
            className="hw-textarea"
            rows={3}
            value={res?.transcript || ''}
            onChange={e => update({ transcript: e.target.value })}
            disabled={readOnly}
            placeholder="Optional transcript..."
            style={{ minHeight: 92, maxWidth: 420 }}
          />
        )}
      </div>

      {!readOnly && (
        <div className="speak-actions">
          <button type="button" className="speak-reset" onClick={reset}>
            <Icon.refresh size={14} /> Reset
          </button>
          <span style={{ color: '#5c7585', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
            {status === 'recording' ? 'Recording now' : status === 'done' ? 'Ready to submit' : 'Waiting to record'}
          </span>
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

      {/* Main actions: 2 clear buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => setFlipped(f => !f)} style={{ flex: 1 }}>
          <Icon.refresh size={12} /> Flip card
        </Button>
        {!readOnly && (
          <Button variant="primary" size="sm" onClick={mark} style={{ flex: 1 }}>
            <Icon.check size={12} /> I learned this
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={prev} disabled={idx === 0}>
          <Icon.arrowL size={12} /> Previous
        </Button>
        <Button variant="ghost" size="sm" onClick={next} disabled={idx === pairs.length - 1}>
          Next <Icon.arrowR size={12} />
        </Button>
      </div>
    </div>
  );
}

/* ─── HOMEWORK STEP-THROUGH WRAPPER ─────────────────────────── */

/**
 * HomeworkStepThrough — renders exercises one at a time with progress bar + navigation.
 * Used in the student dashboard to walk through a homework set.
 */
export function HomeworkStepThrough({ exercises, responses, onResponse, onSubmit, readOnly = false, homework = null }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!exercises || exercises.length === 0) return null;

  const total = exercises.length;
  const current = exercises[currentIdx];
  const currentRes = responses?.[current?.id] || {};
  const progress = ((currentIdx + 1) / total) * 100;
  const completedCount = exercises.filter(ex => hasCompletedResponse(ex, responses?.[ex.id])).length;
  const canSubmit = readOnly || completedCount === total;
  const estimatedMinutes = homework?.estimatedTime || homework?.estimatedMinutes || Math.max(8, total * 4);

  const goPrev = () => setCurrentIdx(i => Math.max(i - 1, 0));
  const goNext = () => setCurrentIdx(i => Math.min(i + 1, total - 1));
  const isLast = currentIdx === total - 1;

  return (
    <div className="hw-workspace">
      <div className="hw-player-head">
        <div>
          <div className="hw-player-kicker">Level B2 / Academic Practice</div>
          <div className="hw-player-title">{homework?.title || 'Homework Workspace'}</div>
        </div>
        <div className="hw-time-pill">
          <Icon.practice size={15} /> {estimatedMinutes} min focus
        </div>
      </div>

      <div className="hw-audio-strip" aria-label="Homework activity player">
        <div className="hw-play-orb">
          <Icon.arrowR size={22} />
        </div>
        <div>
          <div className="hw-strip-label">Task focus: {exerciseLabel(current.type)}</div>
          <div className="hw-wave" aria-hidden="true">
            {Array.from({ length: 54 }).map((_, i) => (
              <span
                key={i}
                className={i <= Math.round((currentIdx + 1) / total * 54) ? 'is-hot' : ''}
                style={{ height: 8 + Math.abs(Math.sin(i * 0.65)) * 24 }}
              />
            ))}
          </div>
        </div>
        <div className="hw-strip-progress">
          <span>{String(currentIdx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          <div className="hw-volume-track"><div className="hw-volume-fill" /></div>
        </div>
      </div>

      <div className="hw-stage-grid">
        <section className="hw-question-card">
          <div className="hw-question-top">
            <span className="hw-question-number">{currentIdx + 1}</span>
            <div className="hw-question-type">{exerciseLabel(current.type)}</div>
          </div>
          <ExercisePlayer
            exercise={current}
            response={currentRes}
            onResponse={(updated) => onResponse?.(current.id, updated)}
            readOnly={readOnly}
          />
        </section>

        <aside className="hw-side-card">
          <div className="hw-side-label">Progress</div>
          <div className="hw-step-list">
            {exercises.map((ex, i) => {
              const done = hasCompletedResponse(ex, responses?.[ex.id]);
              return (
                <div
                  key={ex.id || i}
                  className={'hw-step-dot' + (i === currentIdx ? ' is-current' : '') + (done ? ' is-done' : '')}
                >
                  <span>{done ? <Icon.check size={11} /> : i + 1}</span>
                  <span>{exerciseLabel(ex.type)}</span>
                </div>
              );
            })}
          </div>
          <div className="hw-progress-track">
            <div className="hw-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p style={{ margin: '14px 0 0', color: '#5c7585', fontSize: 'var(--text-xs)', lineHeight: 1.55 }}>
            Complete each response, then submit it for teacher review.
          </p>
        </aside>
      </div>

      <div className="hw-workspace-footer">
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="hw-nav-button" onClick={goPrev} disabled={currentIdx === 0}>
            <Icon.arrowL size={12} /> Previous
          </button>
          {!isLast && (
            <button type="button" className="hw-nav-button" onClick={goNext}>
              Next <Icon.arrowR size={12} />
            </button>
          )}
        </div>
        {isLast ? (
          <button type="button" className="hw-submit-button" onClick={onSubmit} disabled={!canSubmit}>
            <Icon.check size={13} /> Submit Homework
          </button>
        ) : (
          <span style={{ color: '#5c7585', fontSize: 'var(--text-xs)', fontWeight: 700, alignSelf: 'center' }}>
            {completedCount}/{total} complete
          </span>
        )}
      </div>
    </div>
  );
}
