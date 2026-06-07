import { useState } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

export default function Scenario({ exercise, onComplete }) {
  const { scenario, task, modelResponse, successCriteria, instruction, context } = exercise;
  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    setSubmitted(true);
    // For simulation purposes, we consider any response > 10 chars as "submitted"
    // In a real app, this would call an AI service for semantic evaluation.
    const isCorrect = response.length > 10; 
    if (onComplete) onComplete({ 
      correct: isCorrect, 
      submitted: true,
      text: response 
    });
  }

  return (
    <div>
      {instruction && <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 8 }}>{instruction}</p>}
      {context && <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, marginBottom: 14, fontSize: 14 }}>{context}</div>}

      <div style={{ padding: '20px', borderRadius: 12, background: '#F8FAFC', border: '1px solid var(--border)', marginBottom: 20 }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: NAVY, marginBottom: 12 }}>{scenario}</p>
        <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.5 }}><strong>Task:</strong> {task}</p>
      </div>

      {!submitted ? (
        <>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your response here..."
            style={{
              width: '100%', minHeight: 120, padding: '12px', borderRadius: 8,
              border: '1.5px solid var(--border)', fontFamily: 'var(--font-ui)',
              fontSize: 15, marginBottom: 16, resize: 'vertical'
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={response.trim().length < 5}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              cursor: response.trim().length < 5 ? 'not-allowed' : 'pointer',
              background: `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
              color: '#fff', fontWeight: 600, opacity: response.trim().length < 5 ? 0.5 : 1,
            }}
          >
            Submit Response
          </button>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '16px', borderRadius: 10, background: '#F0FDFA', border: '1px solid #A7F3D0' }}>
            <h4 style={{ margin: '0 0 8px', color: '#065F46' }}>Model Response:</h4>
            <p style={{ margin: 0, fontSize: 14.5, fontStyle: 'italic', lineHeight: 1.6 }}>{modelResponse}</p>
          </div>

          {successCriteria && (
            <div style={{ padding: '12px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#92400E' }}>Self-Check Checklist:</h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: '#92400E' }}>
                {successCriteria.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
