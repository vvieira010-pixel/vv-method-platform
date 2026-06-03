import { useState } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

export default function MultipleChoice({ exercise, onComplete }) {
  const { question, options, correct, skill, context } = exercise;
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === correct;

  function handleSubmit() {
    if (selected == null) return;
    setSubmitted(true);
    if (onComplete) onComplete({ correct: isCorrect });
  }

  function getOptionStyle(i) {
    const base = {
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 10,
      border: '1.5px solid', cursor: submitted ? 'default' : 'pointer',
      transition: 'all 0.15s', fontSize: 14.5, lineHeight: 1.5,
      fontFamily: 'var(--font-ui)',
    };
    if (!submitted) {
      if (selected === i) {
        return { ...base, borderColor: TEAL, background: '#F0FDFA', color: NAVY };
      }
      return { ...base, borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' };
    }
    if (i === correct) return { ...base, borderColor: '#059669', background: '#ECFDF5', color: '#065F46' };
    if (i === selected && !isCorrect) return { ...base, borderColor: 'var(--danger)', background: '#FEF2F2', color: '#991B1B' };
    return { ...base, borderColor: 'var(--divider)', background: 'var(--surface)', color: 'var(--muted)', opacity: 0.6 };
  }

  function getMarker(i) {
    if (!submitted) return selected === i ? '◉' : '○';
    if (i === correct) return '✓';
    if (i === selected && !isCorrect) return '✗';
    return String.fromCharCode(65 + i);
  }

  return (
    <div>
      {context && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>{context}</p>
      )}
      <p style={{ fontSize: 15.5, fontWeight: 600, color: NAVY, marginBottom: 16, lineHeight: 1.6 }}>{question}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !submitted && setSelected(i)}
            style={getOptionStyle(i)}
            aria-pressed={selected === i}
          >
            <span style={{
              width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
              background: submitted && i === correct ? '#059669' : submitted && i === selected && !isCorrect ? 'var(--danger)' : 'transparent',
              color: submitted && (i === correct || (i === selected && !isCorrect)) ? '#fff' : 'inherit',
            }}>
              {getMarker(i)}
            </span>
            <span>{opt}</span>
          </button>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selected == null}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: selected == null ? 'not-allowed' : 'pointer',
            background: selected == null ? 'var(--border)' : `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
            color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-ui)',
            opacity: selected == null ? 0.5 : 1, transition: 'all 0.15s',
          }}
        >
          Submit answer
        </button>
      ) : (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: isCorrect ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${isCorrect ? '#A7F3D0' : '#FECACA'}`,
          color: isCorrect ? '#065F46' : '#991B1B',
          fontSize: 14, fontWeight: 500,
        }}>
          {isCorrect
            ? 'Correct — well done.'
            : `Not quite. Review the correct answer above.`}
        </div>
      )}
    </div>
  );
}
