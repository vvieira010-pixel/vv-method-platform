import { useState, useCallback, useEffect } from 'react';
import { READING_PART1, READING_PART2, READING_PART3 } from '../../data/mock-test-1/reading.js';

function getFlatQuestions() {
  const qs = [];
  READING_PART1.questions.forEach(q => qs.push({ ...q, part: 1 }));
  READING_PART2.passages.forEach(p => p.questions.forEach(q => qs.push({ ...q, part: 2 })));
  READING_PART3.textSets.forEach(ts => ts.questions.forEach(q => qs.push({ ...q, part: 3 })));
  return qs;
}

const QUESTIONS = getFlatQuestions();

export default function ReadingSection({ onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  const q = QUESTIONS[currentIdx];
  const total = QUESTIONS.length;
  const answeredCount = Object.keys(answered).length;

  const persistAnswer = useCallback((qId, optIdx) => {
    setSelected(prev => ({ ...prev, [qId]: optIdx }));
    setAnswered(prev => ({ ...prev, [qId]: true }));
    try {
      const store = JSON.parse(sessionStorage.getItem('met:section:reading:answers') || '{}');
      store[qId] = optIdx;
      sessionStorage.setItem('met:section:reading:answers', JSON.stringify(store));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('met:section:reading:answers') || '{}');
      const keys = Object.keys(saved);
      if (keys.length > 0) {
        const sel = {};
        const ans = {};
        keys.forEach(k => { sel[k] = saved[k]; ans[k] = true; });
        setSelected(sel);
        setAnswered(ans);
      }
    } catch {}
  }, []);

  const handleFinish = useCallback(() => {
    const all = {};
    QUESTIONS.forEach(q => {
      if (selected[q.id] !== undefined) all[q.id] = selected[q.id];
    });
    onComplete(all);
  }, [selected, onComplete]);

  return (
    <div className="rs">
      <div className="rs__sidebar">
        <div className="rs__sidebar-header">Questions</div>
        <div className="rs__sidebar-grid">
          {QUESTIONS.map((q, i) => (
            <button
              key={q.id}
              className={`rs__sq ${currentIdx === i ? 'rs__sq--cur' : ''} ${answered[q.id] ? 'rs__sq--done' : ''}`}
              onClick={() => setCurrentIdx(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      <div className="rs__main">
        <div className="rs__passage">
          {q.part === 1 && null}
          {q.part === 2 && (() => {
            const p = READING_PART2.passages.find(p => p.questions.some(pq => pq.id === q.id));
            return p ? <div><h4 className="rs__passage-title">{p.title}</h4><p className="rs__passage-text">{p.text}</p></div> : null;
          })()}
          {q.part === 3 && (() => {
            const ts = READING_PART3.textSets.find(ts => ts.questions.some(tq => tq.id === q.id));
            return ts ? <div>{ts.texts.map((t, i) => <div key={i}><h4 className="rs__passage-title">{t.label}: {t.title}</h4><p className="rs__passage-text">{t.text}</p></div>)}</div> : null;
          })()}
        </div>

        <div className="rs__question">
          <div className="rs__q-label">Question {currentIdx + 1} of {total}</div>
          <p className="rs__q-text">{q.text}</p>
          <div className="rs__options">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`rs__opt ${selected[q.id] === i ? 'rs__opt--sel' : ''}`}
                onClick={() => persistAnswer(q.id, i)}
              >
                <span className="rs__opt-letter">{'ABCD'[i]}</span>
                <span>{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rs__nav">
          <button className="rs__nav-btn" disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}>&larr; Previous</button>
          <span className="rs__nav-progress">{answeredCount}/{total} answered</span>
          {currentIdx < total - 1 ? (
            <button className="rs__nav-btn rs__nav-btn--primary" onClick={() => setCurrentIdx(i => i + 1)}>Next &rarr;</button>
          ) : (
            <button className="rs__nav-btn rs__nav-btn--finish" onClick={handleFinish}>Finish Section</button>
          )}
        </div>
      </div>
      <style>{`
        .rs { display: flex; height: 100%; }
        .rs__sidebar { width: 60px; background: var(--bg); border-right: 1px solid var(--border); padding: 12px 8px; overflow-y: auto; flex-shrink: 0; }
        .rs__sidebar-header { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; text-align: center; }
        .rs__sidebar-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
        .rs__sq { width: 100%; height: 32px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); cursor: pointer; font-size: 12px; font-weight: 600; color: var(--text); }
        .rs__sq--cur { border-color: var(--primary); background: var(--primary); color: #fff; }
        .rs__sq--done { background: var(--primary-light); border-color: var(--primary); }
        .rs__main { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .rs__passage { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; max-height: 260px; overflow-y: auto; }
        .rs__passage-title { font-size: 13px; font-weight: 700; color: var(--text); margin: 0 0 6px; }
        .rs__passage-text { font-size: 13px; line-height: 1.7; color: var(--text-muted); margin: 0 0 12px; }
        .rs__question { flex: 1; }
        .rs__q-label { font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 8px; }
        .rs__q-text { font-size: 15px; font-weight: 600; color: var(--text); margin: 0 0 16px; line-height: 1.5; }
        .rs__options { display: flex; flex-direction: column; gap: 8px; }
         .rs__opt { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); cursor: pointer; text-align: left; font: inherit; font-size: 14px; transition: background-color, border-color, color, opacity, transform .12s; }
        .rs__opt:hover { border-color: var(--primary); }
        .rs__opt--sel { border-color: var(--primary); background: var(--primary-light); }
        .rs__opt-letter { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg); font-weight: 700; font-size: 13px; flex-shrink: 0; }
        .rs__opt--sel .rs__opt-letter { background: var(--primary); color: #fff; }
        .rs__nav { display: flex; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border); }
        .rs__nav-btn { padding: 8px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); cursor: pointer; font: inherit; font-size: 13px; font-weight: 600; }
        .rs__nav-btn:disabled { opacity: .4; cursor: default; }
        .rs__nav-btn--primary { background: var(--primary); color: #fff; border-color: var(--primary); }
        .rs__nav-btn--finish { background: var(--accent); color: #fff; border-color: var(--accent); }
        .rs__nav-progress { flex: 1; text-align: center; font-size: 13px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
