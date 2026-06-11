import { useState, useCallback } from 'react';
import { Icon } from '../shared.jsx';
import { loadExercises } from './validateExercise.js';
import MultipleChoice from './MultipleChoice.jsx';
import FillBlank from './FillBlank.jsx';
import ShortAnswer from './ShortAnswer.jsx';
import OrderSentences from './OrderSentences.jsx';
import ErrorCorrection from './ErrorCorrection.jsx';
import Listening from './Listening.jsx';
import ReadExercise from './ReadExercise.jsx';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

const TYPE_LABELS = {
  multiple_choice: 'Multiple Choice',
  multiple_choice_single: 'Multiple Choice',
  multiple_choice_multiple: 'Multiple Choice',
  fill_blank: 'Fill in the Blank',
  short_answer: 'Speaking Practice',
  order_sentences: 'Order Sentences',
  error_correction: 'Error Correction',
  drag_and_drop_matching: 'Matching',
  true_false_with_explanation: 'True/False',
  interactive_scenario_case_study: 'Scenario',
  timed_quick_fire: 'Quick Fire',
  mcq: 'Multiple Choice',
  blank: 'Fill in the Blank',
  short: 'Speaking Practice',
  order: 'Ordering',
  fix: 'Error Correction',
  listen: 'Listening',
  read: 'Reading',
};

function InvalidExercise({ reason }) {
  return (
    <div style={{ padding: '14px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 0, color: '#991B1B', fontSize: 13.5, lineHeight: 1.6 }}>
      <strong>This exercise could not be loaded</strong> — {reason}
    </div>
  );
}

function deriveHints(exercise) {
  if (exercise.hints?.length > 0) return exercise.hints;
  const type = exercise.type;
  if (type === 'mcq' || type === 'multiple_choice' || type === 'multiple_choice_single' || type === 'multiple_choice_multiple') {
    return [
      'What key concept or rule does this question test?',
      'Try eliminating options that are clearly wrong. What makes each remaining option plausible or not?',
      'The correct answer addresses the main point — not just a familiar-sounding word.',
    ];
  }
  if (type === 'blank' || type === 'fill_blank') {
    const firstAnswer = exercise.blanks?.[0]?.answer || '';
    return [
      'What type of word fits here — verb, noun, adjective, or connector?',
      'Think about the grammar structure around the blank. What form is needed?',
      firstAnswer ? `The first missing word begins with: "${firstAnswer[0].toUpperCase()}…"` : 'Re-read the full sentence for context clues.',
    ];
  }
  if (type === 'short' || type === 'short_answer' || type === 'speak') {
    return [
      'Start with one clear main point, then support it with a reason or example.',
      'Use vocabulary that is specific and relevant to the topic.',
      exercise.rubric ? `Key criteria: ${String(exercise.rubric).slice(0, 100)}` : 'Aim for 2–3 complete sentences with clear reasoning.',
    ];
  }
  if (type === 'fix' || type === 'error_correction') {
    return [
      'Read each sentence aloud. Does anything sound unnatural?',
      'Common error types: verb tense, missing or wrong article (a/an/the), wrong preposition.',
      'Check subject–verb agreement and word form (noun vs. adjective vs. verb).',
    ];
  }
  if (type === 'order' || type === 'order_sentences' || type === 'ordering_sequencing') {
    return [
      'Think about logical flow: introduction → main points → conclusion.',
      'Look for connecting words (first, then, however, therefore) that signal position.',
      'Which sentence introduces the overall topic? Start there.',
    ];
  }
  return [
    'What key concept or vocabulary does this exercise test?',
    'Look for context clues in the question itself.',
    'Think about grammar rules or vocabulary you have practised recently.',
  ];
}

function ExerciseCard({ exercise, index, total, result, onComplete, onNext, recallMode }) {
  const label = TYPE_LABELS[exercise.type] || exercise.type;
  const skill = exercise.skill || exercise.focus || null;
  const done = result != null;

  const [recallText, setRecallText] = useState('');
  const [recallDone, setRecallDone] = useState(!recallMode);
  const [hintLevel, setHintLevel] = useState(0);
  const hints = deriveHints(exercise);

  function renderExercise() {
    const props = { exercise, onComplete };
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
      background: '#fff', borderRadius: 0, overflow: 'hidden',
      border: '1px solid rgba(153,176,255,0.35)',
      boxShadow: '0 4px 20px -8px rgba(14,31,92,0.18), 0 1px 4px rgba(18,40,121,0.06)',
    }}>
      {/* Card header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--divider)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: 'linear-gradient(135deg, #F0FDFA 0%, #F8FAFF 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 0,
            background: TEAL, color: '#fff',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {label}
          </span>
          {skill && (
            <span style={{
              padding: '3px 10px', borderRadius: 0,
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

      {/* Recall gate — shown before exercise when recallMode is on */}
      {!recallDone && (
        <div style={{ padding: '20px 20px 24px', borderBottom: '1px solid var(--divider)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: NAVY, marginBottom: 6 }}>
            Before you begin — what do you already know?
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>
            Try to recall what you know about this topic before seeing the question. Even partial ideas are useful.
          </div>
          <textarea
            value={recallText}
            onChange={e => setRecallText(e.target.value)}
            placeholder="Write anything you remember — words, rules, examples…"
            rows={3}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 0, fontSize: 'var(--text-sm)', lineHeight: 1.6, resize: 'vertical', fontFamily: 'var(--font-ui)', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => setRecallDone(true)}
              style={{ padding: '8px 18px', borderRadius: 0, border: 'none', cursor: 'pointer', background: `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`, color: '#fff', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-ui)' }}
            >
              {recallText.trim() ? "I'm ready — show the exercise" : 'Skip recall — show the exercise'}
            </button>
          </div>
        </div>
      )}

      {/* Exercise body */}
      {recallDone && (
        <div style={{ padding: '20px 20px 24px' }}>
          {renderExercise()}
        </div>
      )}

      {/* Progressive hint ladder */}
      {recallDone && !done && (
        <div style={{ padding: '0 20px 16px' }}>
          {hintLevel > 0 && (
            <div style={{ marginBottom: 8, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 0, fontSize: 'var(--text-xs)', color: '#92400E', lineHeight: 1.5 }}>
              <strong>Hint {hintLevel}:</strong> {hints[hintLevel - 1]}
            </div>
          )}
          {hintLevel < hints.length && (
            <button
              onClick={() => setHintLevel(l => l + 1)}
              style={{ padding: '5px 14px', borderRadius: 0, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
            >
              {hintLevel === 0 ? 'Need a hint?' : 'Next hint →'}
            </button>
          )}
        </div>
      )}

      {/* Next / Finish button */}
      {done && (
        <div style={{ padding: '0 20px 20px' }}>
          <button
            onClick={onNext}
            style={{
              padding: '10px 24px', borderRadius: 0, border: 'none', cursor: 'pointer',
              background: `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
              color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-ui)',
            }}
          >
            {index < total - 1 ? 'Next exercise →' : 'Finish session →'}
          </button>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>
        <span>Progress</span>
        <span>{current} of {total} completed</span>
      </div>
      <div style={{ height: 6, borderRadius: 0, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 0, background: `linear-gradient(90deg, ${TEAL}, ${NAVY})`,
          width: '100%',
          transform: `scaleX(${pct / 100})`,
          transformOrigin: 'left',
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
    </div>
  );
}

function ScoreSummary({ results, total }) {
  const closed = results.filter(r => r.correct !== null && r.correct !== undefined);
  const correct = closed.filter(r => r.correct === true).length;
  const open = results.filter(r => r.submitted && r.correct === null).length;
  const pct = closed.length > 0 ? Math.round((correct / closed.length) * 100) : null;

  return (
    <div style={{
      padding: '24px', borderRadius: 0, background: '#F0FDFA',
      border: `2px solid ${TEAL}`, textAlign: 'center',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Session Complete
      </div>
      {pct !== null && (
        <div style={{ fontSize: 48, fontWeight: 800, color: NAVY, lineHeight: 1, marginBottom: 4 }}>
          {pct}%
        </div>
      )}
      <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 16 }}>
        {closed.length > 0 && <span>{correct} of {closed.length} scored exercises correct</span>}
        {open > 0 && closed.length > 0 && <span> · </span>}
        {open > 0 && <span>{open} open-response {open === 1 ? 'task' : 'tasks'} submitted for review</span>}
      </div>
      <div style={{ fontSize: 14, color: '#065F46', fontWeight: 500 }}>
        {pct === 100 ? 'Perfect score — excellent work!' : pct >= 70 ? 'Good work. Review any missed answers above.' : 'Keep practising — consistency builds confidence.'}
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
export default function ExercisePlayer({ exercises: raw, title, onSessionComplete, recallMode = false }) {
  const { exercises, errors } = loadExercises(Array.isArray(raw) ? raw : (raw || []));

  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState([]); // { index, correct, ... }
  const [done, setDone] = useState(false);

  const handleComplete = useCallback((result) => {
    setResults(prev => {
      const next = [...prev];
      next[current] = { ...result, index: current };
      return next;
    });
  }, [current]);

  const handleNext = useCallback(() => {
    const nextIdx = current + 1;
    if (nextIdx >= exercises.length) {
      setDone(true);
      if (onSessionComplete) {
        const closed = results.filter(r => r && r.correct !== null && r.correct !== undefined);
        const score = closed.length > 0 ? Math.round((closed.filter(r => r.correct).length / closed.length) * 100) : null;
        onSessionComplete({ results, score });
      }
    } else {
      setCurrent(nextIdx);
    }
  }, [current, exercises.length, results, onSessionComplete]);

  // Errors only (nothing valid loaded)
  if (errors.length > 0 && exercises.length === 0) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>
        {title && <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xl)', fontWeight: 700, color: NAVY, marginBottom: 16 }}>{title}</h2>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {errors.map((e, i) => <InvalidExercise key={i} reason={e} />)}
        </div>
      </div>
    );
  }

  const completedCount = results.filter(Boolean).length;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>
      {title && (
        <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xl)', fontWeight: 700, color: NAVY, marginBottom: 6 }}>{title}</h2>
      )}

      {/* Load errors (partial — some valid exercises exist) */}
      {errors.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {errors.map((e, i) => (
            <div key={i} style={{ padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 0, fontSize: 13, color: '#92400E' }}>
              <Icon.warning size={12} /> {e}
            </div>
          ))}
        </div>
      )}

      <ProgressBar current={completedCount} total={exercises.length} />

      {!done ? (
        <ExerciseCard
          key={current}
          exercise={exercises[current]}
          index={current}
          total={exercises.length}
          result={results[current]}
          onComplete={handleComplete}
          onNext={handleNext}
          recallMode={recallMode}
        />
      ) : (
        <>
          <ScoreSummary results={results.filter(Boolean)} total={exercises.length} />
          <button
            onClick={() => { setCurrent(0); setResults([]); setDone(false); }}
            style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 0,
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-2)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
            }}
          >
            Restart exercises
          </button>
        </>
      )}
    </div>
  );
}

