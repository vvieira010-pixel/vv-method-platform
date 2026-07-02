import { useState } from 'react';

const TEAL = 'var(--accent)';
const NAVY = 'var(--accent-text)';

function normalize(str) {
  return (str || '').toLowerCase().trim();
}

function isChoiceBlank(blank) {
  return blank && typeof blank === 'object' && Array.isArray(blank.choices);
}

export default function FillBlank({ exercise, onComplete }) {
  const { template, blanks, context, instruction } = exercise;

  const parts = template.split('___');
  const blankCount = parts.length - 1;
  const [values, setValues] = useState(() => Array(blankCount).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);

  function handleSubmit() {
    const r = values.map((v, i) => {
      const blank = blanks[i];
      if (isChoiceBlank(blank)) {
        const correct = normalize(v) === normalize(blank.correct);
        return { correct, expected: blank.correct, given: v, isChoice: true, choiceExplanation: blank.explanation || null };
      }
      const expected = blank || '';
      const accepted = expected.split('|').map(a => a.trim().toLowerCase());
      const correct = accepted.length > 1 ? accepted.includes(normalize(v)) : normalize(v) === normalize(expected);
      return { correct, expected, given: v, isChoice: false };
    });
    setResults(r);
    setSubmitted(true);
    const allCorrect = r.every(x => x.correct);
    if (onComplete) onComplete({ correct: allCorrect, score: r.filter(x => x.correct).length, total: r.length });
  }

  function setValue(i, v) {
    if (submitted) return;
    const next = [...values];
    next[i] = v;
    setValues(next);
  }

  const allFilled = values.every(v => v.trim() !== '');

  function textInputStyle(i) {
    const base = {
      display: 'inline-block', minWidth: 90,
      padding: '3px 8px', margin: '0 3px',
      borderRadius: 'var(--radius-sm, 6px)', border: '2px solid', fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-sans)', outline: 'none',
      verticalAlign: 'middle', background: 'var(--surface)',
      transition: 'border-color 0.15s',
    };
    if (!submitted) return { ...base, borderColor: values[i] ? TEAL : 'var(--border)' };
    if (results[i]?.correct) return { ...base, borderColor: 'var(--ex-correct-strong)', background: 'var(--ex-correct-bg)', color: 'var(--ex-correct-text)' };
    return { ...base, borderColor: 'var(--danger)', background: 'var(--ex-wrong-bg)', color: 'var(--ex-wrong-text)' };
  }

  function renderBlankInput(i) {
    const blank = blanks[i];
    if (isChoiceBlank(blank)) {
      return (
        <span key={`blank-${i}`} style={{ display: 'inline-flex', gap: 4, margin: '0 4px', verticalAlign: 'middle', flexWrap: 'wrap' }}>
          {blank.choices.map((choice, ci) => {
            const selected = values[i] === choice;
            const isResult = submitted && results[i];
            const isCorrectChoice = isResult && normalize(choice) === normalize(blank.correct);
            const isWrongSelected = isResult && selected && !results[i].correct;
            let bg = 'var(--surface)';
            let border = 'var(--border)';
            let color = NAVY;
            if (!submitted && selected) { bg = 'var(--ex-selected-bg)'; border = TEAL; color = TEAL; }
            if (isResult && isCorrectChoice) { bg = 'var(--ex-correct-bg)'; border = 'var(--ex-correct-strong)'; color = 'var(--ex-correct-text)'; }
            if (isWrongSelected) { bg = 'var(--ex-wrong-bg)'; border = 'var(--danger)'; color = 'var(--ex-wrong-text)'; }
            return (
              <button
                key={ci}
                onClick={() => setValue(i, choice)}
                disabled={submitted}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: `2px solid ${selected || (isResult && isCorrectChoice) ? border : 'var(--border)'}`,
                  background: selected || (isResult && isCorrectChoice) ? bg : 'var(--surface)',
                  color: selected || (isResult && isCorrectChoice) ? color : 'var(--text)',
                  fontWeight: selected ? 600 : 400, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
                  cursor: submitted ? 'default' : 'pointer', transition: 'all 0.12s',
                }}
              >
                {choice}
              </button>
            );
          })}
        </span>
      );
    }
    return (
      <input
        key={`blank-${i}`}
        type="text"
        value={values[i]}
        onChange={e => setValue(i, e.target.value)}
        disabled={submitted}
        aria-label={`Blank ${i + 1}`}
        style={textInputStyle(i)}
      />
    );
  }

  return (
    <div onKeyDown={e => { if (e.key === 'Enter' && !submitted && allFilled) { e.preventDefault(); handleSubmit(); } }}>
      {instruction && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginBottom: 8, lineHeight: 1.6 }}>{instruction}</p>
      )}
      {context && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm, 6px)', marginBottom: 14, fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--text-2)' }}>
          {context}
        </div>
      )}

      <div style={{ fontSize: 'var(--text-base)', lineHeight: 2.4, color: NAVY, fontWeight: 500, marginBottom: 20 }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blankCount && renderBlankInput(i)}
          </span>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allFilled}
          style={{
            padding: '10px 24px', borderRadius: 'var(--radius-sm, 6px)', border: 'none',
            cursor: allFilled ? 'pointer' : 'not-allowed',
            background: allFilled ? `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` : 'var(--border)',
            color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
            opacity: allFilled ? 1 : 0.5, transition: 'all 0.15s',
          }}
        >
          Check answers
        </button>
      ) : (
        <div role="status" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeUp 0.22s ease-out both' }}>
          {results.map((r, i) => (
            <div key={i} style={{ borderRadius: 'var(--radius-sm, 6px)', overflow: 'hidden' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: r.correct ? 'var(--ex-correct-bg)' : 'var(--ex-wrong-bg)',
                border: `1px solid ${r.correct ? 'var(--ex-correct-border)' : 'var(--ex-wrong-border)'}`,
                fontSize: 'var(--text-sm)',
              }}>
                <span style={{ fontWeight: 700, color: r.correct ? 'var(--ex-correct-strong)' : 'var(--danger)', flexShrink: 0 }}>
                  {r.correct ? '✓' : '✗'}
                </span>
                <span style={{ color: 'var(--muted)' }}>Blank {i + 1}:</span>
                {!r.correct && (
                  <>
                    <span style={{ color: 'var(--ex-wrong-text)' }}>{r.given || '(empty)'}</span>
                    <span style={{ color: 'var(--muted)' }}>→</span>
                    <span style={{ fontWeight: 600, color: 'var(--ex-correct-text)' }}>{r.expected}</span>
                  </>
                )}
                {r.correct && <span style={{ fontWeight: 600, color: 'var(--ex-correct-text)' }}>{r.expected}</span>}
              </div>
              {!r.correct && (
                <div style={{ padding: '9px 14px', background: 'var(--ex-hint-bg)', border: '1px solid var(--ex-hint-border)', borderTop: 'none', fontSize: 'var(--text-xs)', color: 'var(--ex-hint-text)', lineHeight: 1.6 }}>
                  <strong>Your answer:</strong> "{r.given}" &nbsp;→&nbsp; <strong>Correct:</strong> "{r.expected}"
                  {r.isChoice && r.choiceExplanation && (
                    <div style={{ marginTop: 4 }}><strong>Why:</strong> {r.choiceExplanation}</div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div style={{
            marginTop: 4, padding: '10px 14px', borderRadius: 'var(--radius-sm, 6px)', fontSize: 'var(--text-sm)', fontWeight: 500,
            background: results.every(r => r.correct) ? 'var(--ex-correct-bg)' : 'var(--ex-hint-bg)',
            color: results.every(r => r.correct) ? 'var(--ex-correct-text)' : 'var(--ex-hint-text)',
            border: `1px solid ${results.every(r => r.correct) ? 'var(--ex-correct-border)' : 'var(--ex-hint-border)'}`,
          }}>
            {results.every(r => r.correct)
              ? '✓ All correct — well done.'
              : `${results.filter(r => r.correct).length} of ${results.length} correct. Review below.`}
          </div>
          {exercise.explanation && (
            <div style={{
              fontSize: 'var(--text-sm)', color: 'var(--ex-panel-text)', lineHeight: 1.65,
              padding: '11px 14px', background: 'var(--ex-panel-bg)', borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--ex-panel-border)',
            }}>
              <span style={{ fontWeight: 700, color: NAVY }}>Why: </span>
              {exercise.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
