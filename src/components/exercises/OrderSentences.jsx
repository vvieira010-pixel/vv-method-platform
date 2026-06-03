import { useState, useEffect } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function OrderSentences({ exercise, onComplete }) {
  const { sentences, context, instruction } = exercise;
  const [order, setOrder] = useState(() => shuffle(sentences.map((_, i) => i)));
  const [submitted, setSubmitted] = useState(false);

  // re-shuffle on mount only
  useEffect(() => {
    setOrder(shuffle(sentences.map((_, i) => i)));
  }, []);

  function move(fromIdx, dir) {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= order.length) return;
    const next = [...order];
    [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
    setOrder(next);
  }

  function handleSubmit() {
    setSubmitted(true);
    const correct = order.every((origIdx, pos) => origIdx === pos);
    if (onComplete) onComplete({ correct });
  }

  function handleReset() {
    setOrder(shuffle(sentences.map((_, i) => i)));
    setSubmitted(false);
  }

  function itemStyle(origIdx, pos) {
    if (!submitted) {
      return {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 10,
        border: '1.5px solid var(--border)', background: 'var(--surface)',
        cursor: 'grab', transition: 'all 0.15s',
      };
    }
    const correct = origIdx === pos;
    return {
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 10,
      border: `1.5px solid ${correct ? '#A7F3D0' : '#FECACA'}`,
      background: correct ? '#ECFDF5' : '#FEF2F2',
      transition: 'all 0.15s',
    };
  }

  const allCorrect = submitted && order.every((origIdx, pos) => origIdx === pos);

  return (
    <div>
      {instruction && <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.6 }}>{instruction}</p>}
      {context && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, marginBottom: 14, fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)' }}>
          {context}
        </div>
      )}

      <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 14 }}>
        Use the arrows to put the sentences in the correct order.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {order.map((origIdx, pos) => {
          const isCorrect = submitted && origIdx === pos;
          const isWrong = submitted && origIdx !== pos;
          return (
            <div key={origIdx} style={itemStyle(origIdx, pos)}>
              {/* Position number */}
              <span style={{
                width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: isCorrect ? '#059669' : isWrong ? 'var(--danger)' : 'var(--bg-deep)',
                color: isCorrect || isWrong ? '#fff' : 'var(--muted)',
              }}>
                {pos + 1}
              </span>

              <span style={{ flex: 1, fontSize: 14.5, lineHeight: 1.6, color: isCorrect ? '#065F46' : isWrong ? '#991B1B' : NAVY }}>
                {sentences[origIdx]}
              </span>

              {/* Move buttons (only before submit) */}
              {!submitted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={() => move(pos, -1)}
                    disabled={pos === 0}
                    aria-label="Move up"
                    style={{
                      width: 28, height: 24, border: '1px solid var(--border)', borderRadius: 5,
                      background: pos === 0 ? 'var(--divider)' : '#fff', cursor: pos === 0 ? 'not-allowed' : 'pointer',
                      display: 'grid', placeItems: 'center', fontSize: 11, color: 'var(--muted)',
                      opacity: pos === 0 ? 0.4 : 1,
                    }}
                  >▲</button>
                  <button
                    onClick={() => move(pos, 1)}
                    disabled={pos === order.length - 1}
                    aria-label="Move down"
                    style={{
                      width: 28, height: 24, border: '1px solid var(--border)', borderRadius: 5,
                      background: pos === order.length - 1 ? 'var(--divider)' : '#fff',
                      cursor: pos === order.length - 1 ? 'not-allowed' : 'pointer',
                      display: 'grid', placeItems: 'center', fontSize: 11, color: 'var(--muted)',
                      opacity: pos === order.length - 1 ? 0.4 : 1,
                    }}
                  >▼</button>
                </div>
              )}

              {/* Correct position hint after submit */}
              {submitted && isWrong && (
                <span style={{ fontSize: 12, color: 'var(--danger)', flexShrink: 0 }}>
                  pos {sentences.indexOf(sentences[origIdx]) + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
            color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-ui)',
          }}
        >
          Check order
        </button>
      ) : (
        <div>
          <div style={{
            padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, marginBottom: 12,
            background: allCorrect ? '#ECFDF5' : '#FFFBEB',
            border: `1px solid ${allCorrect ? '#A7F3D0' : '#FDE68A'}`,
            color: allCorrect ? '#065F46' : '#92400E',
          }}>
            {allCorrect
              ? 'Correct — well done. The order is perfect.'
              : 'Not quite. Highlighted sentences are out of place. Try again.'}
          </div>
          {!allCorrect && (
            <button
              onClick={handleReset}
              style={{
                padding: '9px 20px', borderRadius: 10, border: '1.5px solid var(--border)', cursor: 'pointer',
                background: 'var(--surface)', color: 'var(--text-2)', fontWeight: 600, fontSize: 13.5,
                fontFamily: 'var(--font-ui)',
              }}
            >
              Reset and try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
