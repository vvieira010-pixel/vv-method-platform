import { useState } from 'react';

const TEAL = 'var(--accent)';
const NAVY = 'var(--primary-ink)';

// MET section hints for ordering exercises — from met_test_basics_task_breakdown.md
const MET_ORDER_CONFIG = {
  writing_t2: {
    label: 'Writing Task 2 — Essay Structure',
    structure: 'Introduction → Body Paragraph 1 → Body Paragraph 2 → Conclusion',
    tip: 'Introduction: paraphrase + main idea. Body: reason → explanation → example. Conclusion: restate + final comment.',
  },
  writing_t1: {
    label: 'Writing Task 1 — Response Structure',
    structure: 'Answer → Reason → Support/Example',
    tip: 'Answer the question directly first, then give a reason, then add a specific example or consequence.',
  },
  speaking_q2: {
    label: 'Speaking Q2 — Personal Experience',
    structure: 'When/where → What happened → Result/feeling',
    tip: 'Tell a specific story with a setup, an event, and an outcome. Use past tense connectors: at first, after that, in the end.',
  },
  speaking_q4: {
    label: 'Speaking Q4 — Advantages & Disadvantages',
    structure: 'Introduction → Advantages → Disadvantages → Balanced conclusion',
    tip: 'Both sides must be covered in roughly equal time. Use a clear transition pivot: "However, there are also disadvantages…"',
  },
  speaking_q5: {
    label: 'Speaking Q5 — Persuasive Argument',
    structure: 'Recommendation → Reasons → Benefits → Respectful closing',
    tip: 'State your position first, then support it. Formal register throughout. End with a polite call to action.',
  },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function OrderSentences({ exercise, onComplete }) {
  const { sentences, context, instruction, metSection } = exercise;
  const [order, setOrder] = useState(() => shuffle(sentences.map((_, i) => i)));
  const [submitted, setSubmitted] = useState(false);

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
        padding: '12px 14px', borderRadius: 'var(--radius-sm)',
        border: '1.5px solid var(--border)', background: 'var(--surface)',
        cursor: 'grab', transition: 'all 0.15s',
      };
    }
    const correct = origIdx === pos;
    return {
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 'var(--radius-sm)',
      border: `1.5px solid ${correct ? 'var(--ex-correct-border)' : 'var(--ex-wrong-border)'}`,
      background: correct ? 'var(--ex-correct-bg)' : 'var(--ex-wrong-bg)',
      transition: 'all 0.15s',
    };
  }

  const allCorrect = submitted && order.every((origIdx, pos) => origIdx === pos);
  const sectionConfig = metSection ? MET_ORDER_CONFIG[metSection] : null;

  return (
    <div>
      {/* MET section banner */}
      {sectionConfig && (
        <div style={{ padding: '10px 14px', background: 'var(--ex-cat-blue-bg)', border: '1px solid var(--ex-cat-blue-border)', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ex-cat-blue-text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {sectionConfig.label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ex-cat-blue-strong)', marginBottom: 4 }}>{sectionConfig.structure}</div>
          <div style={{ fontSize: 13, color: 'var(--ex-cat-blue-strong)', lineHeight: 1.55 }}>{sectionConfig.tip}</div>
        </div>
      )}

      {instruction && <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.6 }}>{instruction}</p>}
      {context && (
        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)' }}>
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
                background: isCorrect ? 'var(--ex-correct-strong)' : isWrong ? 'var(--danger)' : 'var(--bg-deep)',
                color: isCorrect || isWrong ? '#fff' : 'var(--muted)',
              }}>
                {pos + 1}
              </span>

              <span style={{ flex: 1, fontSize: 14.5, lineHeight: 1.6, color: isCorrect ? 'var(--ex-correct-text)' : isWrong ? 'var(--ex-wrong-text)' : NAVY }}>
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
                      background: pos === 0 ? 'var(--divider)' : 'var(--surface)', cursor: pos === 0 ? 'not-allowed' : 'pointer',
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
                      background: pos === order.length - 1 ? 'var(--divider)' : 'var(--surface)',
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
                  should be #{origIdx + 1}
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
            padding: '10px 24px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
            background: `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
            color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-ui)',
          }}
        >
          Check order
        </button>
      ) : (
        <div>
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, marginBottom: 12,
            background: allCorrect ? 'var(--ex-correct-bg)' : 'var(--ex-hint-bg)',
            border: `1px solid ${allCorrect ? 'var(--ex-correct-border)' : 'var(--ex-hint-border)'}`,
            color: allCorrect ? 'var(--ex-correct-text)' : 'var(--ex-hint-text)',
          }}>
            {allCorrect
              ? 'Correct — well done. The order is perfect.'
              : 'Not quite. Highlighted sentences are out of place. Try again.'}
          </div>
          {!allCorrect && (
            <button
              onClick={handleReset}
              style={{
                padding: '9px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', cursor: 'pointer',
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

