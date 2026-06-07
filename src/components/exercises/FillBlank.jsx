import { useState } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

export default function FillBlank({ exercise, onComplete }) {
  const { template, blanks, context, instruction } = exercise;

  // Split template on ___ placeholders
  const parts = template.split('___');
  const blankCount = parts.length - 1;
  const [values, setValues] = useState(() => Array(blankCount).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);

  function normalize(str) {
    return (str || '').toLowerCase().trim();
  }

  function handleSubmit() {
    const r = values.map((v, i) => {
      const expected = blanks[i] || '';
      const correct = normalize(v) === normalize(expected);
      return { correct, expected, given: v };
    });
    setResults(r);
    setSubmitted(true);
    const allCorrect = r.every(x => x.correct);
    if (onComplete) onComplete({ correct: allCorrect, score: r.filter(x => x.correct).length, total: r.length });
  }

  const allFilled = values.every(v => v.trim() !== '');

  function inputStyle(i) {
    const base = {
      display: 'inline-block', minWidth: 90, maxWidth: 160,
      padding: '3px 8px', margin: '0 3px',
      borderRadius: 6, border: '2px solid', fontSize: 14.5,
      fontFamily: 'var(--font-ui)', outline: 'none',
      verticalAlign: 'middle', background: '#fff',
      transition: 'border-color 0.15s',
    };
    if (!submitted) return { ...base, borderColor: values[i] ? TEAL : 'var(--border)' };
    if (results[i]?.correct) return { ...base, borderColor: '#059669', background: '#ECFDF5', color: '#065F46' };
    return { ...base, borderColor: 'var(--danger)', background: '#FEF2F2', color: '#991B1B' };
  }

  return (
    <div>
      {instruction && (
        <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.6 }}>{instruction}</p>
      )}
      {context && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, marginBottom: 14, fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)' }}>
          {context}
        </div>
      )}

      {/* Sentence with inline inputs */}
      <div style={{ fontSize: 15.5, lineHeight: 2.2, color: NAVY, fontWeight: 500, marginBottom: 20 }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blankCount && (
              <input
                type="text"
                value={values[i]}
                onChange={e => {
                  if (submitted) return;
                  const next = [...values];
                  next[i] = e.target.value;
                  setValues(next);
                }}
                disabled={submitted}
                aria-label={`Blank ${i + 1}`}
                style={inputStyle(i)}
              />
            )}
          </span>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allFilled}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
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
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8,
              background: r.correct ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${r.correct ? '#A7F3D0' : '#FECACA'}`,
              fontSize: 14,
            }}>
              <span style={{ fontWeight: 700, color: r.correct ? '#059669' : 'var(--danger)', flexShrink: 0 }}>
                {r.correct ? '✓' : '✗'}
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
          ))}
          <div style={{
            marginTop: 4, padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            background: results.every(r => r.correct) ? '#ECFDF5' : '#FFFBEB',
            color: results.every(r => r.correct) ? '#065F46' : '#92400E',
            border: `1px solid ${results.every(r => r.correct) ? '#A7F3D0' : '#FDE68A'}`,
          }}>
            {results.every(r => r.correct)
              ? 'Correct — well done.'
              : `${results.filter(r => r.correct).length} of ${results.length} correct. Review the answers above.`}
          </div>
          {exercise.explanation && (
            <div style={{ marginTop: 8, fontSize: 13.5, color: '#374151', lineHeight: 1.65, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              {exercise.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
