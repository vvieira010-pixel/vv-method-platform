import { useState } from 'react';

const TEAL = 'var(--accent)';
const NAVY = '#0B1F3A';

function optionBase(submitted, selected, correct, i) {
  const base = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid', cursor: submitted ? 'default' : 'pointer',
    transition: 'all 0.15s', fontSize: 14.5, lineHeight: 1.5,
    fontFamily: 'var(--font-ui)', textAlign: 'left', width: '100%',
    background: 'var(--surface)',
  };
  if (!submitted) {
    return selected === i
      ? { ...base, borderColor: TEAL, background: 'var(--ex-selected-bg)', color: NAVY }
      : { ...base, borderColor: 'var(--border)', color: 'var(--text)' };
  }
  if (i === correct) return { ...base, borderColor: 'var(--ex-correct-strong)', background: 'var(--ex-correct-bg)', color: 'var(--ex-correct-text)' };
  if (i === selected && i !== correct) return { ...base, borderColor: 'var(--danger)', background: 'var(--ex-wrong-bg)', color: 'var(--ex-wrong-text)' };
  return { ...base, borderColor: 'var(--divider)', color: 'var(--muted)', opacity: 0.6 };
}

export default function Reading({ exercise, onComplete }) {
  const {
    passage = '',
    audioText = '',
    question = '',
    options = [],
    correct = null,
    explanation = '',
    imageUrl = '',
    image = '',
    imageSrc = '',
  } = exercise;

  const text   = passage || audioText || '';
  const imgSrc = imageUrl || image || imageSrc || '';

  const [selected, setSelected]   = useState(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (selected == null) return;
    setSubmitted(true);
    if (onComplete) onComplete({ correct: selected === correct });
  }

  const isCorrect = submitted && selected === correct;

  function markerLabel(i) {
    if (!submitted) return selected === i ? '◉' : '○';
    if (i === correct) return '✓';
    if (i === selected && !isCorrect) return '✗';
    return String.fromCharCode(65 + i);
  }

  return (
    <div>
      {/* Image */}
      {imgSrc && (
        <img
          src={imgSrc} alt="Exercise visual"
          style={{ width: '100%', borderRadius: 10, marginBottom: 16, maxHeight: 260, objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Passage */}
      {text && (
        <div style={{
          padding: '16px 18px', marginBottom: 20, borderRadius: 10,
          background: 'var(--bg)', border: '1px solid var(--border)',
          fontSize: 15, lineHeight: 1.75, color: 'var(--text)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
            color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10,
          }}>
            Read the passage
          </div>
          {text}
        </div>
      )}

      {/* Question */}
      <p style={{ fontSize: 15.5, fontWeight: 600, color: NAVY, marginBottom: 14, lineHeight: 1.6 }}>
        {question}
      </p>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !submitted && setSelected(i)}
            style={optionBase(submitted, selected, correct, i)}
            aria-pressed={selected === i}
          >
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'grid', placeItems: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
              background: submitted && i === correct
                ? 'var(--ex-correct-strong)'
                : submitted && i === selected && !isCorrect
                  ? 'var(--danger)'
                  : 'transparent',
              color: submitted && (i === correct || (i === selected && !isCorrect)) ? '#fff' : 'inherit',
            }}>
              {markerLabel(i)}
            </span>
            <span>{opt}</span>
          </button>
        ))}
      </div>

      {/* Submit / Feedback */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selected == null}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            cursor: selected == null ? 'not-allowed' : 'pointer',
            background: selected == null
              ? 'var(--border)'
              : `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
            color: '#fff', fontWeight: 600, fontSize: 14,
            fontFamily: 'var(--font-ui)',
            opacity: selected == null ? 0.5 : 1, transition: 'all 0.15s',
          }}
        >
          Submit answer
        </button>
      ) : (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: isCorrect ? 'var(--ex-correct-bg)' : 'var(--ex-wrong-bg)',
          border: `1px solid ${isCorrect ? 'var(--ex-correct-border)' : 'var(--ex-wrong-border)'}`,
          fontSize: 14,
        }}>
          <div style={{
            color: isCorrect ? 'var(--ex-correct-text)' : 'var(--ex-wrong-text)',
            fontWeight: 600,
            marginBottom: explanation ? 6 : 0,
          }}>
            {isCorrect ? '✓ Correct — well done.' : '✗ Not quite. Review the correct answer above.'}
          </div>
          {explanation && (
            <div style={{ color: 'var(--ex-panel-text)', fontWeight: 400, fontSize: 13.5, lineHeight: 1.65 }}>
              {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
