import { useState } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';
const GREEN = '#1A5C2A';

export default function LevelUp({ exercise, onComplete }) {
  const {
    b1 = '',
    b2 = '',
    c1 = '',
    options = [],
    correct = 0,
    keywords = [],
    explanation = '',
    imageUrl = '',
    image = '',
    imageSrc = '',
  } = exercise;

  const imgSrc = imageUrl || image || imageSrc || '';

  const [selected, setSelected]   = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [sandbox, setSandbox]     = useState('');

  function handleSubmit() {
    if (selected == null) return;
    setSubmitted(true);
    if (onComplete) onComplete({ correct: selected === correct });
  }

  const isCorrect = submitted && selected === correct;

  function highlightKeywords(text) {
    if (!keywords.length || !text) return text;
    const re = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(re);
    return parts.map((part, i) =>
      re.test(part)
        ? <mark key={i} style={{ background: 'rgba(26,92,42,.15)', color: GREEN, borderRadius: 3, padding: '0 2px', fontWeight: 700 }}>{part}</mark>
        : part
    );
  }

  return (
    <div>
      {/* Image */}
      {imgSrc && (
        <img
          src={imgSrc} alt="Exercise visual"
          style={{ width: '100%', borderRadius: 10, marginBottom: 16, maxHeight: 240, objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* B1 sentence */}
      <div style={{
        padding: '14px 16px', marginBottom: 18, borderRadius: 10,
        background: 'rgba(26,92,42,.06)', border: '1.5px solid rgba(26,92,42,.25)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: GREEN, textTransform: 'uppercase', marginBottom: 8 }}>
          B1 — Upgrade this sentence
        </div>
        <p style={{ fontSize: 15.5, color: NAVY, lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
          "{b1}"
        </p>
      </div>

      {/* MCQ */}
      <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 12, lineHeight: 1.5 }}>
        Which is the best B2 upgrade?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {options.map((opt, i) => {
          let borderColor = 'var(--border)', bg = 'var(--surface)', color = 'var(--text)';
          if (!submitted) {
            if (selected === i) { borderColor = TEAL; bg = '#F0FDFA'; color = NAVY; }
          } else {
            if (i === correct)                         { borderColor = '#059669'; bg = '#ECFDF5'; color = '#065F46'; }
            else if (i === selected && i !== correct)  { borderColor = 'var(--danger)'; bg = '#FEF2F2'; color = '#991B1B'; }
            else                                        { borderColor = 'var(--divider)'; color = 'var(--muted)'; }
          }
          return (
            <button key={i}
              onClick={() => !submitted && setSelected(i)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 16px', borderRadius: 10,
                border: `1.5px solid ${borderColor}`,
                cursor: submitted ? 'default' : 'pointer',
                background: bg, color,
                transition: 'all 0.15s', fontSize: 14, lineHeight: 1.55,
                fontFamily: 'var(--font-ui)', textAlign: 'left', width: '100%',
                opacity: submitted && i !== correct && i !== selected ? 0.55 : 1,
              }}
              aria-pressed={selected === i}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                display: 'grid', placeItems: 'center',
                fontSize: 12, fontWeight: 700,
                background: submitted && i === correct ? '#059669'
                  : submitted && i === selected && i !== correct ? 'var(--danger)'
                  : 'transparent',
                color: submitted && (i === correct || (i === selected && i !== correct)) ? '#fff' : 'inherit',
              }}>
                {submitted
                  ? (i === correct ? '✓' : i === selected ? '✗' : String.fromCharCode(65 + i))
                  : (selected === i ? '◉' : String.fromCharCode(65 + i))}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Feedback */}
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: isCorrect ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${isCorrect ? '#A7F3D0' : '#FECACA'}`,
            fontSize: 14, color: isCorrect ? '#065F46' : '#991B1B', fontWeight: 600,
          }}>
            {isCorrect ? '✓ Correct — well done.' : '✗ Not quite. See the correct B2 version below.'}
          </div>

          {/* B2 model answer */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(26,92,42,.06)', border: '1.5px solid rgba(26,92,42,.25)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: GREEN, textTransform: 'uppercase', marginBottom: 8 }}>
              B2 — Model answer
            </div>
            <p style={{ fontSize: 15, color: NAVY, lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
              {highlightKeywords(b2)}
            </p>
            {c1 && (
              <p style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-2)' }}>C1:</strong> {c1}
              </p>
            )}
          </div>

          {/* Explanation */}
          {explanation && (
            <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13.5, color: '#374151', lineHeight: 1.65 }}>
              {explanation}
            </div>
          )}

          {/* Free-write sandbox */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
              Practise — write your own B2 version:
            </label>
            <textarea
              value={sandbox}
              onChange={e => setSandbox(e.target.value)}
              placeholder="Try writing the sentence in your own words…"
              rows={2}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, resize: 'vertical',
                border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-ui)',
                outline: 'none', background: '#fff', color: 'var(--text)', lineHeight: 1.6,
              }}
            />
            {sandbox && keywords.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--muted)' }}>
                {keywords.filter(k => sandbox.toLowerCase().includes(k.toLowerCase())).map(k => (
                  <mark key={k} style={{ background: 'rgba(26,92,42,.15)', color: GREEN, borderRadius: 3, padding: '1px 5px', marginRight: 4, fontWeight: 600 }}>{k} ✓</mark>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
