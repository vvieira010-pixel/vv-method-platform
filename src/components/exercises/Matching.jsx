import { useState } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

export default function Matching({ exercise, onComplete }) {
  const { pairs, instruction, context } = exercise;
  const [leftItems, setLeftItems] = useState(pairs.map(p => ({ id: p.word, text: p.word })));
  const [rightItems, setRightItems] = useState(pairs.map(p => ({ id: p.definition, text: p.definition })));
  const [matches, setMatches] = useState({}); // { leftId: rightId }
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelectLeft = (id) => {
    if (submitted) return;
    setSelectedLeft(id);
  };

  const handleSelectRight = (id) => {
    if (submitted || !selectedLeft) return;
    setMatches(prev => ({
      ...prev,
      [selectedLeft]: id
    }));
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    const r = pairs.map(p => {
      const isCorrect = matches[p.word] === p.definition;
      return { correct: isCorrect, expected: p.definition, given: matches[p.word] || '' };
    });
    setSubmitted(true);
    const allCorrect = r.every(x => x.correct);
    if (onComplete) onComplete({ correct: allCorrect, score: r.filter(x => x.correct).length, total: r.length });
  };

  const reset = () => {
    setMatches({});
    setSelectedLeft(null);
    setSubmitted(false);
  };

  return (
    <div>
      {instruction && <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 8 }}>{instruction}</p>}
      {context && <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, marginBottom: 14, fontSize: 14 }}>{context}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leftItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleSelectLeft(item.id)}
              style={{
                padding: '12px', borderRadius: 8, border: '1.5px solid',
                cursor: submitted ? 'default' : 'pointer',
                backgroundColor: selectedLeft === item.id ? '#F0FDFA' : (matches[item.id] ? '#E0F2F1' : 'var(--surface)'),
                borderColor: selectedLeft === item.id ? TEAL : (matches[item.id] ? TEAL : 'var(--border)'),
                textAlign: 'left', fontWeight: 600
              }}
            >
              {item.text}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rightItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleSelectRight(item.id)}
              style={{
                padding: '12px', borderRadius: 8, border: '1.5px solid',
                cursor: submitted ? 'default' : 'pointer',
                backgroundColor: Object.values(matches).includes(item.id) ? '#E0F2F1' : 'var(--surface)',
                borderColor: 'var(--border)',
                textAlign: 'left', fontSize: 13, lineHeight: 1.4
              }}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(matches).length < pairs.length}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            cursor: Object.keys(matches).length === pairs.length ? 'pointer' : 'not-allowed',
            background: Object.keys(matches).length === pairs.length ? `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` : 'var(--border)',
            color: '#fff', fontWeight: 600, opacity: Object.keys(matches).length === pairs.length ? 1 : 0.5,
          }}
        >
          Check matches
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pairs.map(p => {
            const isCorrect = matches[p.word] === p.definition;
            return (
              <div key={p.word} style={{
                padding: '8px 12px', borderRadius: 6, fontSize: 14,
                background: isCorrect ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${isCorrect ? '#A7F3D0' : '#FECACA'}`,
                display: 'flex', justifyContent: 'space-between'
              }}>
                <span style={{ fontWeight: 600 }}>{p.word}</span>
                <span style={{ color: isCorrect ? '#065F46' : '#991B1B' }}>{isCorrect ? '✓' : `✗ ${p.definition}`}</span>
              </div>
            );
          })}
          <button onClick={reset} style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline' }}>Try again</button>
        </div>
      )}
    </div>
  );
}
