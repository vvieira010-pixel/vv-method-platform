import { useState, useCallback, useRef, useEffect } from 'react'; // ExercisePlayer
import { motion } from 'motion/react';
import { Icon } from '../shared.jsx';
import { loadExercises } from './validateExercise.js';
import { hintLimit, recallGateActive } from '../../lib/fading-manager.js';
import { callAI } from '../../lib/callAI.js';
import { withSkills } from '../../education-skills/active-skills.js';
import MultipleChoice from './MultipleChoice.jsx';
import FillBlank from './FillBlank.jsx';
import ShortAnswer from './ShortAnswer.jsx';
import OrderSentences from './OrderSentences.jsx';
import ErrorCorrection from './ErrorCorrection.jsx';
import Listening from './Listening.jsx';
import ReadExercise from './ReadExercise.jsx';
import EmbeddedLesson from './EmbeddedLesson.jsx';
import ConfidenceSlider from '../ConfidenceSlider.jsx';
import ErrorDiagnosisGate from '../ErrorDiagnosisGate.jsx';

const TEAL = 'var(--accent)';
const NAVY = 'var(--accent-text)';

const TYPE_LABELS = {
  multiple_choice: 'Multiple Choice',
  multiple_choice_single: 'Multiple Choice',
  multiple_choice_multiple: 'Multiple Choice',
  fill_blank: 'Fill in the Blank',
  short_answer: 'Speaking Practice',
  order_sentences: 'Order Sentences',
  error_correction: 'Level Up',
  drag_and_drop_matching: 'Matching',
  true_false_with_explanation: 'True/False',
  interactive_scenario_case_study: 'Scenario',
  timed_quick_fire: 'Quick Fire',
  mcq: 'Multiple Choice',
  blank: 'Fill in the Blank',
  short: 'Speaking Practice',
  order: 'Ordering',
  fix: 'Level Up',
  listen: 'Listening',
  read: 'Reading',
  embed: 'Embedded Lesson',
};

function InvalidExercise({ reason }) {
  return (
    <div style={{ padding: '14px 16px', background: 'var(--ex-wrong-bg)', border: '1px solid var(--ex-wrong-border)', borderRadius: 'var(--radius-sm, 6px)', color: 'var(--ex-wrong-text)', fontSize: 13.5, lineHeight: 1.6 }}>
      <strong>This exercise could not be loaded</strong> — {reason}
    </div>
  );
}

function useAIPoweredHints(exercise, scaffoldLevel) {
  const [hints, setHints] = useState(null);
  const [loading, setLoading] = useState(false);
  const maxHints = hintLimit(scaffoldLevel);

  useEffect(() => {
    if (exercise.hints?.length > 0) {
      setHints(exercise.hints.slice(0, maxHints));
      return;
    }
    if (maxHints === 0) return;

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const prompt = [
          `You are a MET tutor. Generate up to ${maxHints} progressive hints for this exercise.`,
          `Exercise type: ${exercise.type}`,
          `Question: ${exercise.prompt || exercise.question || ''}`,
          exercise.options ? `Options: ${JSON.stringify(exercise.options)}` : '',
          exercise.blanks ? `Blanks: ${JSON.stringify(exercise.blanks.map(b => ({ before: b.before, after: b.after })))}` : '',
          exercise.text ? `Text: ${exercise.text}` : '',
          `Correct answer: ${exercise.correct || exercise.answer || ''}`,
          '',
          'Rules:',
          '- Hint 1: conceptual nudge only — what concept or rule this tests',
          '- Hint 2: procedural guidance — how to approach solving it',
          '- Hint 3: concrete pointer — without giving the answer directly',
          'Return ONLY a JSON array of hint strings. Example: ["Hint one...", "Hint two...", "Hint three..."]',
        ].filter(Boolean).join('\n');

        const data = await callAI(prompt, await withSkills('practice', { temperature: 0.4, max_tokens: 500 }));
        const raw = data.content?.map(b => b.text || '').join('') || '';
        const match = raw.match(/\[[\s\S]*?\]/);
        const parsed = match ? JSON.parse(match[0]) : null;

        if (!cancelled) {
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHints(parsed.slice(0, maxHints));
          } else {
            setHints(null);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setHints(null); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [exercise.prompt, exercise.question, exercise.type, maxHints]);

  return { hints, loading };
}

function ExerciseCard({ exercise, index, total, result, onComplete, onNext, onBack, onSkip, scaffoldLevel = 4, onHintLevelChange, confidenceBefore, onConfidenceBefore }) {
  const label = TYPE_LABELS[exercise.type] || exercise.type;
  const skill = exercise.skill || exercise.focus || null;
  const done = result != null;

  const [hintLevel, setHintLevel] = useState(0);
  const [showErrorGate, setShowErrorGate] = useState(false);
  const [errorCategory, setErrorCategory] = useState(null);
  const [confidenceAfter, setConfidenceAfter] = useState(null);
  const [showConfidenceAfter, setShowConfidenceAfter] = useState(false);
  const { hints, loading: hintsLoading } = useAIPoweredHints(exercise, scaffoldLevel);
  const maxHints = hintLimit(scaffoldLevel);
  const actualHints = (hints || []).length > 0 ? hints : [];
  const hintCount = actualHints.length;

  const handleHintClick = useCallback(() => {
    if (!result || result.correct === false) {
      setShowErrorGate(true);
      return;
    }
    setHintLevel(l => {
      const next = l + 1;
      onHintLevelChange?.(next);
      return next;
    });
  }, [result, onHintLevelChange]);

  const handleDiagnose = useCallback((category) => {
    setErrorCategory(category);
    setShowErrorGate(false);
    setHintLevel(l => {
      const next = l + 1;
      onHintLevelChange?.(next);
      return next;
    });
  }, [onHintLevelChange]);

  const handleSkipGate = useCallback(() => {
    setShowErrorGate(false);
    setHintLevel(l => {
      const next = l + 1;
      onHintLevelChange?.(next);
      return next;
    });
  }, [onHintLevelChange]);

  const handleComplete = useCallback((answerResult) => {
    onComplete?.({ ...answerResult, errorCategory: errorCategory || null });
    if (answerResult && answerResult.correct !== null) {
      setShowConfidenceAfter(true);
    }
  }, [onComplete, errorCategory]);

  const handleConfidenceAfter = useCallback((val) => {
    setConfidenceAfter(val);
  }, []);

  const handleConfirmConfidence = useCallback(() => {
    setShowConfidenceAfter(false);
    if (confidenceAfter !== null && onComplete) {
      onComplete({ ...result, confidenceAfter });
    }
  }, [confidenceAfter, result, onComplete]);

  function renderExercise() {
    const props = { exercise, onComplete: handleComplete };
    switch (exercise.type) {
      case 'multiple_choice':
      case 'multiple_choice_single':
      case 'multiple_choice_multiple':
      case 'mcq': return <MultipleChoice {...props} />;
      case 'fill_blank':
      case 'blank':      return <FillBlank {...props} />;
      case 'short_answer':
      case 'short':
      case 'speak':      return <ShortAnswer {...props} />;
      case 'order_sentences':
      case 'ordering_sequencing':
      case 'order':      return <OrderSentences {...props} />;
      case 'error_correction':
      case 'fix':        return <ErrorCorrection {...props} />;
      case 'listen':     return <Listening {...props} />;
      case 'read':       return <ReadExercise {...props} />;
      case 'embed':      return <EmbeddedLesson {...props} />;
      // New types (stubs for now)
      case 'drag_and_drop_matching':
      case 'true_false_with_explanation':
      case 'interactive_scenario_case_study':
      case 'timed_quick_fire':
        return <InvalidExercise reason={`Component for type "${exercise.type}" is not yet implemented.`} />;
      default:       return <InvalidExercise reason={`Unknown type "${exercise.type}".`} />;
    }
  }

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius-md, 8px)', overflow: 'hidden',
      border: '1px solid var(--border, #e5e7eb)',
      boxShadow: '0 4px 20px -8px rgba(14,31,92,0.18), 0 1px 4px rgba(18,40,121,0.06)',
    }}>
      {/* Card header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--divider)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: 'var(--accent-subtle, #e3f5f4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 'var(--radius-sm, 6px)',
            background: TEAL, color: '#fff',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {label}
          </span>
          {skill && (
            <span style={{
              padding: '3px 10px', borderRadius: 'var(--radius-sm, 6px)',
              background: 'var(--accent-soft)', color: NAVY,
              fontSize: 11, fontWeight: 600,
            }}>
              {skill}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
          {index + 1} / {total}
        </span>
      </div>

      {/* Exercise body */}
      <div style={{ padding: '20px 20px 24px' }}>
        {renderExercise()}
      </div>

      {/* Error diagnosis gate — shown when wrong answer + hint clicked */}
      {!done && showErrorGate && (
        <div style={{ padding: '0 20px' }}>
          <ErrorDiagnosisGate onDiagnose={handleDiagnose} onSkip={handleSkipGate} />
        </div>
      )}

      {/* Confidence after — shown after submission */}
      {showConfidenceAfter && confidenceAfter === null && (
        <div style={{ padding: '0 20px 16px' }}>
          <ConfidenceSlider label="After seeing the answer, how confident are you in this topic?" onConfidence={handleConfidenceAfter} />
          <button
            type="button"
            onClick={handleConfirmConfidence}
            style={{ padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-xs)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            Confirm
          </button>
        </div>
      )}

      {/* Progressive hint ladder — AI-powered, controlled by scaffold level */}
      {!done && !showErrorGate && maxHints > 0 && (
        <div style={{ padding: '0 20px 16px' }}>
          {hintLevel > 0 && (
            <div role="status" aria-live="polite" style={{ marginBottom: 8, padding: '8px 12px', background: 'var(--ex-hint-bg)', border: '1px solid var(--ex-hint-border)', borderRadius: 'var(--radius-sm, 6px)', fontSize: 'var(--text-xs)', color: 'var(--ex-hint-text)', lineHeight: 1.5 }}>
              <strong>Hint {hintLevel}:</strong> {actualHints[hintLevel - 1] || 'Think about what rule or concept applies here.'}
            </div>
          )}
          {hintLevel < hintCount && (
            <button
              onClick={handleHintClick}
              disabled={hintsLoading}
              style={{ minHeight: 44, padding: '8px 16px', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: hintsLoading ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', opacity: hintsLoading ? 0.5 : 1 }}
            >
              {hintsLoading ? 'Generating hints…' : hintLevel === 0 ? 'Need a hint?' : 'Next hint →'}
            </button>
          )}
        </div>
      )}

      {/* Navigation footer */}
      <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button
          onClick={onBack}
          disabled={index === 0}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--border, #e5e7eb)', background: 'none',
            color: 'var(--text-2, var(--ex-panel-text))', fontSize: 13, fontWeight: 600,
            cursor: index === 0 ? 'default' : 'pointer', fontFamily: 'var(--font-sans)',
            opacity: index === 0 ? 0.5 : 1,
          }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!done && (
            <button
              onClick={onSkip}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm, 6px)',
                border: '1px solid var(--border, #e5e7eb)', background: 'none',
                color: 'var(--muted, #9ca3af)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              Skip →
            </button>
          )}
          {done && (
            <button
              onClick={onNext}
              style={{
                padding: '8px 22px', borderRadius: 'var(--radius-sm, 6px)', border: 'none',
                cursor: 'pointer', background: `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
                color: '#fff', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-sans)',
              }}
            >
              {index < total - 1 ? 'Next exercise →' : 'Finish session →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 500 }}>
        <span>Progress</span>
        <span>{current} of {total} completed</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${TEAL}, ${NAVY})`,
          width: '100%',
          transform: `scaleX(${pct / 100})`,
          transformOrigin: 'left',
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
    </div>
  );
}

function ScoreSummary({ results }) {
  const total = results.length;

  return (
    <div style={{
      padding: '24px', borderRadius: 'var(--radius-md, 8px)', background: 'var(--ex-selected-bg)',
      border: `2px solid ${TEAL}`, textAlign: 'center',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Session Complete
      </div>
      <div style={{ fontSize: 14, color: 'var(--ex-panel-text)', fontWeight: 500, lineHeight: 1.6 }}>
        You answered {total} {total === 1 ? 'question' : 'questions'}. Review the answers and explanations above to keep improving.
      </div>
    </div>
  );
}

/**
 * ExercisePlayer
 *
 * Props:
 *   exercises — raw JSON value (array or { exercises: [...] }) OR already-parsed array
 *   title — optional session title
 *   onSessionComplete — called with { results, score } when all done
 */
export default function ExercisePlayer({ exercises: raw, title, onSessionComplete, scaffoldLevel = 4 }) {
  const { exercises, errors } = loadExercises(Array.isArray(raw) ? raw : (raw || []));
  const recallMode = recallGateActive(scaffoldLevel);

  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const [sessionRecallText, setSessionRecallText] = useState('');
  const [sessionRecallDone, setSessionRecallDone] = useState(!recallMode);
  const [confidenceBefore, setConfidenceBefore] = useState(5);
  const currentRef = useRef(current);
  const totalRef = useRef(exercises.length);
  const onDoneRef = useRef(onSessionComplete);
  const resultsRef = useRef(results);
  const maxHintLevelRef = useRef(0);
  const exerciseConfidenceAfterRef = useRef({});
  useEffect(() => { currentRef.current = current; });
  useEffect(() => { totalRef.current = exercises.length; });
  useEffect(() => { onDoneRef.current = onSessionComplete; });
  useEffect(() => { resultsRef.current = results; });

  const handleHintLevelChange = useCallback((level) => {
    if (level > maxHintLevelRef.current) maxHintLevelRef.current = level;
  }, []);

  const handleComplete = useCallback((result) => {
    setResults(prev => {
      const next = [...prev];
      const idx = currentRef.current;
      const confAfter = exerciseConfidenceAfterRef.current[idx];
      next[idx] = { ...result, index: idx, confidenceAfter: confAfter || null };
      return next;
    });
  }, [setResults]);

  const handleNext = useCallback(() => {
    const idx = currentRef.current;
    const nextIdx = idx + 1;
    if (nextIdx >= totalRef.current) {
      setDone(true);
      const cb = onDoneRef.current;
      if (cb) {
        const live = resultsRef.current.filter(r => r && r.correct !== null && r.correct !== undefined);
        const score = live.length > 0 ? Math.round((live.filter(r => r.correct).length / live.length) * 100) : null;
        const maxHL = maxHintLevelRef.current;
        cb({
          results: resultsRef.current,
          score,
          maxHintLevel: maxHL,
          hintUsed: maxHL > 0,
          confidenceBefore,
        });
      }
    } else {
      maxHintLevelRef.current = 0;
      setCurrent(nextIdx);
    }
  }, [setCurrent, setDone, confidenceBefore]);

  const handleBack = useCallback(() => {
    if (currentRef.current > 0) setCurrent(c => c - 1);
  }, [setCurrent]);

  const handleSkip = useCallback(() => {
    const nextIdx = currentRef.current + 1;
    if (nextIdx >= totalRef.current) {
      setDone(true);
    } else {
      setCurrent(nextIdx);
    }
  }, [setCurrent, setDone]);

  // Errors only (nothing valid loaded)
  if (errors.length > 0 && exercises.length === 0) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
        {title && <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xl)', fontWeight: 700, color: NAVY, marginBottom: 16 }}>{title}</h2>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {errors.map((e, i) => <InvalidExercise key={i} reason={e} />)}
        </div>
      </div>
    );
  }

  const completedCount = results.filter(Boolean).length;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
      {title && (
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xl)', fontWeight: 700, color: NAVY, marginBottom: 6 }}>{title}</h2>
      )}

      {/* Load errors (partial — some valid exercises exist) */}
      {errors.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {errors.map((e, i) => (
            <div key={i} style={{ padding: '8px 12px', background: 'var(--ex-hint-bg)', border: '1px solid var(--ex-hint-border)', borderRadius: 'var(--radius-sm, 6px)', fontSize: 13, color: 'var(--ex-hint-text)' }}>
              <Icon.warning size={12} /> {e}
            </div>
          ))}
        </div>
      )}

      <ProgressBar current={completedCount} total={exercises.length} />

      {/* Session recall gate with confidence calibration — once per session */}
      {recallMode && !sessionRecallDone && (
        <div style={{ padding: '20px 20px 24px', marginBottom: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: NAVY, marginBottom: 6 }}>
            Before you begin — what do you already know about this topic?
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>
            Try to recall what you know before seeing the questions. Even partial ideas are useful — the act of recalling strengthens your memory.
          </div>
          <textarea
            value={sessionRecallText}
            onChange={e => setSessionRecallText(e.target.value)}
            placeholder="Write anything you remember — words, rules, examples…"
            rows={3}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)', fontSize: 'var(--text-sm)', lineHeight: 1.6, resize: 'vertical', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
          />
          <ConfidenceSlider label="How confident are you in this topic right now?" onConfidence={setConfidenceBefore} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => setSessionRecallDone(true)}
              style={{ padding: '8px 18px', borderRadius: 'var(--radius-sm, 6px)', border: 'none', cursor: 'pointer', background: `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`, color: '#fff', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-sans)' }}
            >
              {sessionRecallText.trim() ? "I'm ready — show the exercises" : 'Skip recall — show exercises'}
            </button>
          </div>
        </div>
      )}

      {recallMode && !sessionRecallDone ? null : !done ? (
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <ExerciseCard
            exercise={exercises[current]}
            index={current}
            total={exercises.length}
            result={results[current]}
            onComplete={handleComplete}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            scaffoldLevel={scaffoldLevel}
            onHintLevelChange={handleHintLevelChange}
            confidenceBefore={confidenceBefore}
            onConfidenceBefore={setConfidenceBefore}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <ScoreSummary results={results.filter(Boolean)} total={exercises.length} />
          <button
            onClick={() => { setCurrent(0); setResults([]); setDone(false); }}
            style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 'var(--radius-sm, 6px)',
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-2)', fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Restart exercises
          </button>
        </motion.div>
      )}
    </div>
  );
}

