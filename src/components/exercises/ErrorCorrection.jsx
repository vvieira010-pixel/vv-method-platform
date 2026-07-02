import { useState } from 'react';
import { Icon } from '../shared.jsx';

const TEAL = 'var(--accent)';
const NAVY = 'var(--accent-text)';

const RUBRIC_CATEGORIES = [
  { id: 'grammatical_accuracy', label: 'Grammatical Accuracy', description: 'Tense, agreement, sentence structure' },
  { id: 'vocabulary', label: 'Vocabulary', description: 'Word choice, appropriacy, misuse' },
  { id: 'mechanics', label: 'Mechanics', description: 'Spelling, punctuation, sentence boundaries' },
  { id: 'cohesion', label: 'Cohesion & Organization', description: 'Linking, connectives, logical flow' },
  { id: 'task_completion', label: 'Task Completion', description: 'Register, relevance, completing the task' },
];

function normalize(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export default function ErrorCorrection({ exercise, onComplete }) {
  const { errorText, correctedText, hint, context, instruction, rubricCategory, explanation } = exercise;
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [categoryGuess, setCategoryGuess] = useState(null);

  function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitted(true);
    const correct = normalize(answer) === normalize(correctedText);
    if (onComplete) onComplete({ correct });
  }

  const isCorrect = submitted && normalize(answer) === normalize(correctedText);
  const correctCategory = rubricCategory
    ? RUBRIC_CATEGORIES.find(c => c.id === rubricCategory || c.label === rubricCategory)
    : null;
  const guessedCategory = categoryGuess
    ? RUBRIC_CATEGORIES.find(c => c.id === categoryGuess)
    : null;
  const categoryCorrect = correctCategory && guessedCategory && correctCategory.id === guessedCategory.id;

  return (
    <div>
      {instruction && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>{instruction}</p>
      )}
      {context && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)' }}>
          {context}
        </div>
      )}

      {/* Incorrect sentence */}
      <div style={{ padding: '14px 16px', background: 'var(--ex-wrong-bg)', border: '1.5px solid var(--ex-wrong-border)', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Level Up — spot and fix the error
        </div>
        <p style={{ fontSize: 15.5, color: 'var(--ex-wrong-text)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{errorText}"</p>
      </div>

      {/* Hint */}
      {hint && (
        <div style={{ padding: '10px 14px', background: 'var(--ex-hint-bg)', border: '1px solid var(--ex-hint-border)', borderRadius: 'var(--radius-sm)', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon.bulb size={15} />
          <span style={{ fontSize: 13.5, color: 'var(--ex-hint-text)', lineHeight: 1.6 }}><strong>Hint:</strong> {hint}</span>
        </div>
      )}

      <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: NAVY, marginBottom: 8 }}>
        Write the corrected sentence:
      </label>
      <input
        type="text"
        value={answer}
        onChange={e => !submitted && setAnswer(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !submitted && answer.trim() && handleSubmit()}
        disabled={submitted}
        placeholder="Type the corrected sentence…"
        aria-label="Corrected sentence"
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${submitted ? (isCorrect ? 'var(--ex-correct-strong)' : 'var(--danger)') : answer.trim() ? TEAL : 'var(--border)'}`,
          fontSize: 14.5, fontFamily: 'var(--font-sans)', outline: 'none',
          background: submitted ? (isCorrect ? 'var(--ex-correct-bg)' : 'var(--ex-wrong-bg)') : 'var(--surface)',
          color: submitted ? (isCorrect ? 'var(--ex-correct-text)' : 'var(--ex-wrong-text)') : 'var(--text)',
          transition: 'border-color 0.15s, background 0.15s',
          marginBottom: 14,
        }}
      />

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          style={{
            padding: '10px 24px', borderRadius: 'var(--radius-sm)', border: 'none',
            cursor: answer.trim() ? 'pointer' : 'not-allowed',
            background: answer.trim() ? `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` : 'var(--border)',
            color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-sans)',
            opacity: answer.trim() ? 1 : 0.5, transition: 'all 0.15s',
          }}
        >
          Submit correction
        </button>
      ) : (
        <div role="status" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500,
            background: isCorrect ? 'var(--ex-correct-bg)' : 'var(--ex-wrong-bg)',
            border: `1px solid ${isCorrect ? 'var(--ex-correct-border)' : 'var(--ex-wrong-border)'}`,
            color: isCorrect ? 'var(--ex-correct-text)' : 'var(--ex-wrong-text)',
          }}>
            {isCorrect ? 'Correct — well done.' : 'Not quite. Review the correct answer below.'}
          </div>

          {!isCorrect && (
            <div style={{ padding: '12px 16px', background: 'var(--ex-correct-bg)', border: '1px solid var(--ex-correct-border)', borderRadius: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Correct version
              </div>
              <p style={{ fontSize: 15, color: 'var(--ex-correct-text)', fontWeight: 600, margin: 0 }}>"{correctedText}"</p>
              {answer && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--ex-correct-border)' }}>
                  <div style={{ display: 'flex', gap: 8, fontSize: 13.5, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--muted)' }}>Your answer:</span>
                    <span style={{ color: 'var(--ex-wrong-text)', textDecoration: 'line-through' }}>{answer}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {explanation && (
            <div style={{ fontSize: 13.5, color: 'var(--ex-panel-text)', lineHeight: 1.65, padding: '10px 14px', background: 'var(--ex-panel-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--ex-panel-border)' }}>
              {explanation}
            </div>
          )}

          {/* Rubric category labelling */}
          <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Which MET scoring category does this error affect?
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
              Name the rule — this is how examiners categorise errors.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {RUBRIC_CATEGORIES.map(cat => {
                const isSelected = categoryGuess === cat.id;
                const isRevealed = categoryGuess !== null;
                const isActualAnswer = correctCategory?.id === cat.id;
                let bg = 'var(--surface)';
                let border = 'var(--border)';
                let labelColor = NAVY;
                if (isRevealed && isActualAnswer) { bg = 'var(--ex-correct-bg)'; border = 'var(--ex-correct-strong)'; labelColor = 'var(--ex-correct-text)'; }
                else if (isRevealed && isSelected && !isActualAnswer) { bg = 'var(--ex-wrong-bg)'; border = 'var(--danger)'; labelColor = 'var(--ex-wrong-text)'; }
                return (
                  <button
                    key={cat.id}
                    onClick={() => !categoryGuess && setCategoryGuess(cat.id)}
                    disabled={!!categoryGuess}
                    style={{
                      display: 'flex', alignItems: 'baseline', gap: 8,
                      padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${isSelected || (isRevealed && isActualAnswer) ? border : 'var(--border)'}`,
                      background: isRevealed && (isSelected || isActualAnswer) ? bg : isSelected ? 'var(--ex-selected-bg)' : 'var(--surface)',
                      cursor: categoryGuess ? 'default' : 'pointer',
                      textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: isRevealed && (isSelected || isActualAnswer) ? labelColor : NAVY, flexShrink: 0 }}>
                      {cat.label}
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.4 }}>
                      {cat.description}
                    </span>
                    {isRevealed && isActualAnswer && (
                      <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--ex-correct-strong)', flexShrink: 0 }}>✓ correct</span>
                    )}
                    {isRevealed && isSelected && !isActualAnswer && (
                      <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--danger)', flexShrink: 0 }}>✗</span>
                    )}
                  </button>
                );
              })}
            </div>
            {categoryGuess && !correctCategory && (
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, padding: '8px 12px', background: 'var(--ex-panel-bg)', border: '1px solid var(--border)', borderRadius: 0 }}>
                Good thinking — no single correct category is set for this exercise, but naming the rule is the key habit.
              </div>
            )}
            {categoryGuess && correctCategory && (
              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                background: categoryCorrect ? 'var(--ex-correct-bg)' : 'var(--ex-hint-bg)',
                border: `1px solid ${categoryCorrect ? 'var(--ex-correct-border)' : 'var(--ex-hint-border)'}`,
                color: categoryCorrect ? 'var(--ex-correct-text)' : 'var(--ex-hint-text)',
              }}>
                {categoryCorrect
                  ? `Correct — this error affects ${correctCategory.label}. Naming the category is what separates a learner from a thinker.`
                  : `The examiner would score this under ${correctCategory.label} (${correctCategory.description}). Keep connecting errors to their categories.`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
