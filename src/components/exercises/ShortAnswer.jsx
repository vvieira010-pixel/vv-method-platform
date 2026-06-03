import { useState } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

const REFLECTION_CHECKS = [
  'Did I give a clear opinion?',
  'Did I give one reason?',
  'Did I give one example?',
  'Did I finish with a consequence or conclusion?',
];

export default function ShortAnswer({ exercise, onComplete }) {
  const { prompt, rubric, context } = exercise;
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [checks, setChecks] = useState(Array(REFLECTION_CHECKS.length).fill(false));

  function handleSubmit() {
    if (!text.trim()) return;
    setSubmitted(true);
    if (onComplete) onComplete({ submitted: true, correct: null });
  }

  function toggleCheck(i) {
    setChecks(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  const rubricItems = Array.isArray(rubric) ? rubric : [rubric];

  return (
    <div>
      {context && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, marginBottom: 14, fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)' }}>
          {context}
        </div>
      )}

      <p style={{ fontSize: 15.5, fontWeight: 600, color: NAVY, marginBottom: 14, lineHeight: 1.6 }}>{prompt}</p>

      {/* Rubric guidance box */}
      <div style={{ padding: '12px 16px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          What a strong answer includes:
        </div>
        <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rubricItems.map((item, i) => (
            <li key={i} style={{ fontSize: 13.5, color: '#065F46', lineHeight: 1.6 }}>{item}</li>
          ))}
        </ul>
      </div>

      <textarea
        value={text}
        onChange={e => !submitted && setText(e.target.value)}
        disabled={submitted}
        rows={6}
        placeholder="Write your answer here…"
        aria-label="Your answer"
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 10,
          border: `1.5px solid ${submitted ? 'var(--border)' : text.trim() ? TEAL : 'var(--border)'}`,
          fontSize: 14.5, fontFamily: 'var(--font-ui)', lineHeight: 1.7,
          resize: 'vertical', outline: 'none', color: 'var(--text)',
          background: submitted ? 'var(--bg)' : '#fff',
          transition: 'border-color 0.15s',
        }}
      />

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          style={{
            marginTop: 10, padding: '10px 24px', borderRadius: 10, border: 'none',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            background: text.trim() ? `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` : 'var(--border)',
            color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-ui)',
            opacity: text.trim() ? 1 : 0.5, transition: 'all 0.15s',
          }}
        >
          Submit response
        </button>
      ) : (
        <div style={{ marginTop: 12 }}>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: 14, fontWeight: 500, color: '#065F46', marginBottom: 16 }}>
            Good response submitted. Now check your structure below.
          </div>

          {/* Reflection checklist */}
          <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Self-check your answer:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REFLECTION_CHECKS.map((label, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    onChange={() => toggleCheck(i)}
                    style={{ width: 17, height: 17, marginTop: 2, accentColor: TEAL, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 14, color: checks[i] ? '#065F46' : 'var(--text)', lineHeight: 1.5, fontWeight: checks[i] ? 600 : 400 }}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
            {checks.every(Boolean) && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#ECFDF5', borderRadius: 8, fontSize: 13, color: '#065F46', fontWeight: 600 }}>
                Great structure — your teacher will review your response.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
