import { useState } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

// MET Reading part banners — from met_test_basics_task_breakdown.md
const MET_READING_CONFIG = {
  P2: {
    label: 'Reading Part 2 — Single Text',
    tip: 'Find: main idea · specific detail · vocabulary in context · reference words (it / they / this) · inference · author purpose · text organization.',
    trap: 'Reading too slowly and spending too much time on one text.',
  },
  P3: {
    label: 'Reading Part 3 — Multiple Texts',
    tip: 'Three related texts — look for: which text says a specific idea · how texts are similar or different · what writers agree or disagree about · inference across texts · purpose of each text.',
    trap: 'Treating the three texts separately and missing cross-text questions.',
  },
};

export default function ReadExercise({ exercise, onComplete }) {
  const { passage, source, questions, hidePassage, metPart } = exercise;
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const results = (questions || []).map(q => ({
    correct: answers[q.id] === q.correct,
    selected: answers[q.id],
  }));
  const hits = results.filter(r => r.correct).length;
  const total = (questions || []).length;
  const allAnswered = (questions || []).every(q => answers[q.id] != null);

  function handleSubmit() {
    if (!allAnswered) return;
    setSubmitted(true);
    if (hidePassage) setShowTranscript(true);
    if (onComplete) onComplete({ correct: hits === total, score: total > 0 ? hits / total : 0, answers, total });
  }

  function optionStyle(qIdx, oIdx) {
    const base = {
      padding: '8px 12px', borderRadius: 0, border: '1.5px solid', cursor: submitted ? 'default' : 'pointer',
      fontSize: 14, lineHeight: 1.5, fontFamily: 'var(--font-ui)', textAlign: 'left', width: '100%',
      background: 'var(--surface)', color: 'var(--text)',
      transition: 'all 0.1s',
    };
    const q = questions[qIdx];
    if (!q) return base;
    const sel = answers[q.id];
    if (!submitted) {
      if (sel === oIdx) return { ...base, borderColor: TEAL, background: '#F0FDFA' };
      return { ...base, borderColor: 'var(--border)' };
    }
    if (oIdx === q.correct) return { ...base, borderColor: '#059669', background: '#ECFDF5', color: '#065F46' };
    if (oIdx === sel && sel !== q.correct) return { ...base, borderColor: 'var(--danger)', background: '#FEF2F2', color: '#991B1B' };
    return { ...base, borderColor: 'var(--divider)', color: 'var(--muted)', opacity: 0.5 };
  }

  const partConfig = metPart ? MET_READING_CONFIG[metPart] : null;

  return (
    <div>
      {/* MET part banner */}
      {partConfig && (
        <div style={{ padding: '10px 14px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 0, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {partConfig.label}
          </div>
          <div style={{ fontSize: 13, color: '#064E3B', lineHeight: 1.55 }}>{partConfig.tip}</div>
          <div style={{ marginTop: 5, fontSize: 12, color: '#92400E' }}>
            <strong>Watch out:</strong> {partConfig.trap}
          </div>
        </div>
      )}

      {passage && !hidePassage && (
        <div style={{ padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 0, marginBottom: 20, fontSize: 14.5, lineHeight: 1.7, color: '#1E293B', whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>
          {passage}
          {source && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>{source}</div>}
        </div>
      )}

      {passage && hidePassage && submitted && showTranscript && (
        <div style={{ padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 0, marginBottom: 20, fontSize: 14.5, lineHeight: 1.7, color: '#1E293B', whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: '#92400E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Transcript (revealed after answering)</div>
          {passage}
        </div>
      )}

      {hidePassage && !submitted && (
        <div style={{ padding: '14px 16px', background: '#F0FDFA', border: '1px dashed #0D9488', borderRadius: 0, marginBottom: 20, fontSize: 13, color: '#0F766E', textAlign: 'center' }}>
          Listen to the audio, then answer the questions below. The transcript will be revealed after you check your answers.
        </div>
      )}

      {(questions || []).map((q, qi) => (
        <div key={q.id} style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 14.5, fontWeight: 600, color: NAVY, marginBottom: 8, lineHeight: 1.5 }}>{qi + 1}. {q.question}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(q.options || []).map((opt, oi) => (
              <button key={oi} onClick={() => { if (!submitted) setAnswers(prev => ({ ...prev, [q.id]: oi })); }} style={optionStyle(qi, oi)}>
                <span style={{ fontWeight: 700, marginRight: 8, color: submitted && oi === q.correct ? '#059669' : submitted && oi === answers[q.id] && oi !== q.correct ? 'var(--danger)' : 'inherit' }}>
                  {String.fromCharCode(65 + oi)}.
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button onClick={handleSubmit} disabled={!allAnswered} style={{
          padding: '10px 24px', borderRadius: 0, border: 'none', cursor: allAnswered ? 'pointer' : 'not-allowed',
          background: allAnswered ? `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` : 'var(--border)',
          color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-ui)',
          opacity: allAnswered ? 1 : 0.5, transition: 'all 0.15s',
        }}>
          Check answers
        </button>
      ) : (
        <div style={{ padding: '12px 16px', borderRadius: 0, background: hits === total ? '#ECFDF5' : '#FFFBEB', border: `1px solid ${hits === total ? '#A7F3D0' : '#FDE68A'}`, color: hits === total ? '#065F46' : '#92400E', fontSize: 14, fontWeight: 500 }}>
          {hits === total ? 'All answers correct!' : `${hits} of ${total} correct.`}
        </div>
      )}
    </div>
  );
}
