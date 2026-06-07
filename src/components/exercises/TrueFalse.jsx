import { useState } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

export default function TrueFalse({ exercise, onComplete }) {
  const { items, instruction, context } = exercise;
  const [results, setResults] = useState(Array(items.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    const r = items.map((item, i) => {
      const correct = results[i] === item.correctAnswer;
      return { correct, given: results[i], expected: item.correctAnswer };
    });
    setSubmitted(true);
    const allCorrect = r.every(x => x.correct);
    if (onComplete) onComplete({ correct: allCorrect, score: r.filter(x => x.correct).length, total: r.length });
  }

  const allAnswered = results.every(r => r !== null);

  return (
    <div>
      {instruction && <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 8 }}>{instruction}</p>}
      {context && <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, marginBottom: 14, fontSize: 14 }}>{context}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ padding: '12px', borderRadius: 10, border: '1px solid var(--divider)', background: submitted ? (item.correctAnswer === results[i] ? '#ECFDF5' : '#FEF2F2') : 'var(--surface)' }}>
            <p style={{ fontSize: 15, color: NAVY, marginBottom: 10, lineHeight: 1.5 }}>{item.statement || item.prompt}</p>
            
            <div style={{ display: 'flex', gap: 8 }}>
              {['true', 'false'].map(val => (
                <button
                  key={val}
                  onClick={() => !submitted && (() => {
                    const next = [...results];
                    next[i] = val === 'true';
                    setResults(next);
                  })()}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 6, border: '1.5px solid',
                    cursor: submitted ? 'default' : 'pointer',
                    backgroundColor: submitted ? (results[i] === (val === 'true') ? '#059669' : 'transparent') : (results[i] === (val === 'true') ? TEAL : 'transparent'),
                    color: submitted ? '#fff' : 'var(--text)',
                    borderColor: submitted ? (results[i] === (val === 'true') ? '#059669' : 'var(--border)') : (results[i] === (val === 'true') ? TEAL : 'var(--border)'),
                    textTransform: 'capitalize', fontWeight: 600
                  }}
                >
                  {val}
                </button>
              ))}
            </div>

            {submitted && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#374151', fontStyle: 'italic' }}>
                {item.explanation || item.modelExplanation || ''}
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            cursor: allAnswered ? 'pointer' : 'not-allowed',
            background: allAnswered ? `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` : 'var(--border)',
            color: '#fff', fontWeight: 600, opacity: allAnswered ? 1 : 0.5,
          }}
        >
          Submit
        </button>
      ) : (
        <div style={{ textAlign: 'center', color: results.every(r => r) && results.every((r, i) => r === items[i].correctAnswer) ? '#065F46' : '#991B1B', fontWeight: 600 }}>
          {results.every((r, i) => r === items[i].correctAnswer) ? 'Perfect!' : 'Review your answers above.'}
        </div>
      )}
    </div>
  );
}
