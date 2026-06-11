import { useState } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

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
      display: 'inline-block', minWidth: 90, maxWidth: 160,
      padding: '3px 8px', margin: '0 3px',
      borderRadius: 0, border: '2px solid', fontSize: 14.5,
      fontFamily: 'var(--font-ui)', outline: 'none',
      verticalAlign: 'middle', background: '#fff',
      transition: 'border-color 0.15s',
    };
    if (!submitted) return { ...base, borderColor: values[i] ? TEAL : 'var(--border)' };
    if (results[i]?.correct) return { ...base, borderColor: '#059669', background: '#ECFDF5', color: '#065F46' };
    return { ...base, borderColor: 'var(--danger)', background: '#FEF2F2', color: '#991B1B' };
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
            let bg = '#fff';
            let border = 'var(--border)';
            let color = NAVY;
            if (!submitted && selected) { bg = '#F0FDFA'; border = TEAL; color = TEAL; }
            if (isResult && isCorrectChoice) { bg = '#ECFDF5'; border = '#059669'; color = '#065F46'; }
            if (isWrongSelected) { bg = '#FEF2F2'; border = 'var(--danger)'; color = '#991B1B'; }
            return (
              <button
                key={ci}
                onClick={() => setValue(i, choice)}
                disabled={submitted}
                style={{
                  padding: '2px 10px', borderRadius: 0, border: `2px solid ${selected || (isResult && isCorrectChoice) ? border : 'var(--border)'}`,
                  background: selected || (isResult && isCorrectChoice) ? bg : '#fff',
                  color: selected || (isResult && isCorrectChoice) ? color : 'var(--text)',
                  fontWeight: selected ? 600 : 400, fontSize: 14, fontFamily: 'var(--font-ui)',
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
    <div>
      {instruction && (
        <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.6 }}>{instruction}</p>
      )}
      {context && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 0, marginBottom: 14, fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)' }}>
          {context}
        </div>
      )}

      {/* Sentence with inline inputs or choice buttons */}
      <div style={{ fontSize: 15.5, lineHeight: 2.4, color: NAVY, fontWeight: 500, marginBottom: 20 }}>
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
            padding: '10px 24px', borderRadius: 0, border: 'none',
            cursor: allFilled ? 'pointer' : 'not-allowed',
            background: allFilled ? `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` : 'var(--border)',
            color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-ui)',
            opacity: allFilled ? 1 : 0.5, transition: 'all 0.15s',
          }}
        >
          Check answers
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map((r, i) => (
            <div key={i} style={{ borderRadius: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: r.correct ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${r.correct ? '#A7F3D0' : '#FECACA'}`,
                fontSize: 14,
              }}>
                <span style={{ fontWeight: 700, color: r.correct ? '#059669' : 'var(--danger)', flexShrink: 0 }}>
                  {r.correct ? 'OK' : 'NO'}
                </span>
                <span style={{ color: 'var(--muted)' }}>Blank {i + 1}:</span>
                {!r.correct && (
                  <>
                    <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{r.given || '(empty)'}</span>
                    <span style={{ color: 'var(--muted)' }}>→</span>
                    <span style={{ fontWeight: 600, color: '#065F46' }}>{r.expected}</span>
                  </>
                )}
                {r.correct && <span style={{ fontWeight: 600, color: '#065F46' }}>{r.expected}</span>}
              </div>
              {/* Register/choice explanation shown when wrong */}
              {!r.correct && r.isChoice && r.choiceExplanation && (
                <div style={{ padding: '9px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderTop: 'none', fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
                  <strong>Why:</strong> {r.choiceExplanation}
                </div>
              )}
            </div>
          ))}
          <div style={{
            marginTop: 4, padding: '10px 14px', borderRadius: 0, fontSize: 14, fontWeight: 500,
            background: results.every(r => r.correct) ? '#ECFDF5' : '#FFFBEB',
            color: results.every(r => r.correct) ? '#065F46' : '#92400E',
            border: `1px solid ${results.every(r => r.correct) ? '#A7F3D0' : '#FDE68A'}`,
          }}>
            {results.every(r => r.correct)
              ? 'Correct — well done.'
              : `${results.filter(r => r.correct).length} of ${results.length} correct. Review the answers above.`}
          </div>
          {exercise.explanation && (
            <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.65, padding: '10px 14px', background: '#F8FAFC', borderRadius: 0, border: '1px solid #E2E8F0' }}>
              {exercise.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
