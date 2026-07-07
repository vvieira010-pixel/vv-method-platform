import { useState, useCallback, useEffect } from 'react';
import { WRITING_TASKS } from '../../data/mock-test-1/writing.js';

export default function WritingSection({ onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [texts, setTexts] = useState({});

  const { task1, task2 } = WRITING_TASKS;
  const pages = [
    ...task1.questions.map((q, i) => ({ type: 'short', ...q, pageIdx: i })),
    { type: 'essay', ...task2, pageIdx: task1.questions.length },
  ];
  const total = pages.length;
  const page = pages[currentIdx];

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('met:section:writing:answers') || '{}');
      if (Object.keys(saved).length > 0) setTexts(saved);
    } catch {}
  }, []);

  const persistTexts = useCallback((newTexts) => {
    try { sessionStorage.setItem('met:section:writing:answers', JSON.stringify(newTexts)); } catch {}
  }, []);

  const handleChange = useCallback((id, value) => {
    setTexts(prev => {
      const next = { ...prev, [id]: value };
      persistTexts(next);
      return next;
    });
  }, [persistTexts]);

  const wordCount = (id) => {
    const t = texts[id] || '';
    return t.trim() === '' ? 0 : t.trim().split(/\s+/).length;
  };

  const handleFinish = useCallback(() => {
    onComplete(texts);
  }, [texts, onComplete]);

  return (
    <div className="ws">
      <div className="ws__main">
        <div className="ws__header">
          <span className="ws__label">{page.type === 'essay' ? 'Task 2 — Formal Essay' : `Task 1 — Short Response (${page.pageIdx + 1} of 3)`}</span>
        </div>

        <p className="ws__prompt">{page.text || page.prompt}</p>

        <textarea
          className="ws__textarea"
          rows={page.rows || 10}
          value={texts[page.id] || ''}
          onChange={(e) => handleChange(page.id, e.target.value)}
          placeholder="Write your answer here..."
        />

        <div className="ws__wordcount">{wordCount(page.id)} words</div>

        <div className="ws__nav">
          <button className="ws__nav-btn" disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}>&larr; Previous</button>
          <span className="ws__nav-info">Question {currentIdx + 1} of {total}</span>
          {currentIdx < total - 1 ? (
            <button className="ws__nav-btn ws__nav-btn--primary" onClick={() => setCurrentIdx(i => i + 1)}>Next &rarr;</button>
          ) : (
            <button className="ws__nav-btn ws__nav-btn--finish" onClick={handleFinish}>Finish Writing</button>
          )}
        </div>
      </div>
      <style>{`
        .ws { display: flex; justify-content: center; padding: 24px; }
        .ws__main { max-width: 720px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
        .ws__header { }
        .ws__label { font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase; }
        .ws__prompt { font-size: 15px; line-height: 1.7; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; margin: 0; }
        .ws__textarea { width: 100%; padding: 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font: inherit; font-size: 14px; line-height: 1.6; resize: vertical; background: var(--surface); color: var(--text); outline: none; }
        .ws__textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(20,136,145,.1); }
        .ws__wordcount { font-size: 13px; color: var(--text-muted); text-align: right; }
        .ws__nav { display: flex; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border); }
        .ws__nav-btn { padding: 8px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); cursor: pointer; font: inherit; font-size: 13px; font-weight: 600; }
        .ws__nav-btn:disabled { opacity: .4; cursor: default; }
        .ws__nav-btn--primary { background: var(--primary); color: #fff; border-color: var(--primary); }
        .ws__nav-btn--finish { background: var(--accent); color: #fff; border-color: var(--accent); }
        .ws__nav-info { flex: 1; text-align: center; font-size: 13px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
