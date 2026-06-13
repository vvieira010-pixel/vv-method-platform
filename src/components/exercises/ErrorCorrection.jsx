import { useState } from 'react';
import { Icon } from '../shared.jsx';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

function normalize(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export default function ErrorCorrection({ exercise, onComplete }) {
  const { errorText, correctedText, hint, context, imageUrl, image, imageSrc } = exercise;
  const imgSrc = imageUrl || image || imageSrc || '';
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitted(true);
    const correct = normalize(answer) === normalize(correctedText);
    if (onComplete) onComplete({ correct });
  }

  const isCorrect = submitted && normalize(answer) === normalize(correctedText);

  return (
    <div>
      {context && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, marginBottom: 14, fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)' }}>
          {context}
        </div>
      )}

      {/* Image */}
      {imgSrc && (
        <img
          src={imgSrc} alt="Exercise visual"
          style={{ width: '100%', borderRadius: 10, marginBottom: 14, maxHeight: 260, objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Level Up challenge */}
      <div style={{ padding: '14px 16px', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Level Up — spot and fix the error
        </div>
        <p style={{ fontSize: 15.5, color: '#7F1D1D', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{errorText}"</p>
      </div>

      {/* Hint */}
      {hint && (
        <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon.info size={15} />
          <span style={{ fontSize: 13.5, color: '#92400E', lineHeight: 1.6 }}><strong>Hint:</strong> {hint}</span>
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
          width: '100%', padding: '12px 14px', borderRadius: 10,
          border: `1.5px solid ${submitted ? (isCorrect ? '#059669' : 'var(--danger)') : answer.trim() ? TEAL : 'var(--border)'}`,
          fontSize: 14.5, fontFamily: 'var(--font-ui)', outline: 'none',
          background: submitted ? (isCorrect ? '#ECFDF5' : '#FEF2F2') : '#fff',
          color: submitted ? (isCorrect ? '#065F46' : '#991B1B') : 'var(--text)',
          transition: 'border-color 0.15s, background 0.15s',
          marginBottom: 14,
        }}
      />

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            cursor: answer.trim() ? 'pointer' : 'not-allowed',
            background: answer.trim() ? `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` : 'var(--border)',
            color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-ui)',
            opacity: answer.trim() ? 1 : 0.5, transition: 'all 0.15s',
          }}
        >
          Submit correction
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
            background: isCorrect ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${isCorrect ? '#A7F3D0' : '#FECACA'}`,
            color: isCorrect ? '#065F46' : '#991B1B',
          }}>
            {isCorrect ? 'Correct — well done.' : 'Not quite. Review the correct answer below.'}
          </div>

          {!isCorrect && (
            <div style={{ padding: '12px 16px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Correct version
              </div>
              <p style={{ fontSize: 15, color: '#065F46', fontWeight: 600, margin: 0 }}>"{correctedText}"</p>
              {answer && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #A7F3D0' }}>
                  <div style={{ display: 'flex', gap: 8, fontSize: 13.5, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--muted)' }}>Your answer:</span>
                    <span style={{ color: '#991B1B', textDecoration: 'line-through' }}>{answer}</span>
                  </div>
                </div>
              )}
            </div>
          )}
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
