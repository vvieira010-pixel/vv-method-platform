import { useState, useCallback, useRef, useEffect } from 'react';
import { LISTENING_PART1, LISTENING_PART2, LISTENING_PART3 } from '../../data/mock-test-1/listening.js';

function flattenQuestions() {
  const qs = [];
  LISTENING_PART1.questions.forEach(q => qs.push({ ...q, audio: q.audio }));
  LISTENING_PART2.conversations.forEach(c => c.questions.forEach(q => qs.push({ ...q, audio: c.audio })));
  LISTENING_PART3.talks.forEach(t => t.questions.forEach(q => qs.push({ ...q, audio: t.audio })));
  return qs;
}

const QUESTIONS = flattenQuestions();

export default function ListeningSection({ onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});
  const [playing, setPlaying] = useState(null);
  const audioRef = useRef(null);

  const q = QUESTIONS[currentIdx];
  const total = QUESTIONS.length;
  const answeredCount = Object.keys(answered).length;

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('met:section:listening:answers') || '{}');
      const keys = Object.keys(saved);
      if (keys.length > 0) {
        const sel = {}; const ans = {};
        keys.forEach(k => { sel[k] = saved[k]; ans[k] = true; });
        setSelected(sel); setAnswered(ans);
      }
    } catch {}
  }, []);

  const persistAnswer = useCallback((qId, optIdx) => {
    setSelected(prev => ({ ...prev, [qId]: optIdx }));
    setAnswered(prev => ({ ...prev, [qId]: true }));
    try {
      const store = JSON.parse(sessionStorage.getItem('met:section:listening:answers') || '{}');
      store[qId] = optIdx;
      sessionStorage.setItem('met:section:listening:answers', JSON.stringify(store));
    } catch {}
  }, []);

  const handlePlay = useCallback((audioSrc) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const audio = new Audio(audioSrc);
    audioRef.current = audio;
    setPlaying(audioSrc);
    audio.play().catch(() => {});
    audio.addEventListener('ended', () => setPlaying(null));
  }, []);

  const handleFinish = useCallback(() => {
    const all = {};
    QUESTIONS.forEach(q => { if (selected[q.id] !== undefined) all[q.id] = selected[q.id]; });
    onComplete(all);
  }, [selected, onComplete]);

  return (
    <div className="ls">
      <div className="ls__sidebar">
        <div className="ls__sidebar-header">Questions</div>
        <div className="ls__sidebar-grid">
          {QUESTIONS.map((q, i) => (
            <button
              key={q.id}
              className={`ls__sq ${currentIdx === i ? 'ls__sq--cur' : ''} ${answered[q.id] ? 'ls__sq--done' : ''}`}
              onClick={() => setCurrentIdx(i)}
            >{i + 1}</button>
          ))}
        </div>
      </div>
      <div className="ls__main">
        <div className="ls__q-label">Question {currentIdx + 1} of {total}</div>

        <div className="ls__audio-row">
          <button
            className={`ls__play-btn ${playing === q.audio ? 'ls__play-btn--playing' : ''}`}
            onClick={() => handlePlay(q.audio)}
          >
            {playing === q.audio ? '\u{1F3B5}' : '\u{25B6}'} {playing === q.audio ? 'Playing' : 'Play Audio'}
          </button>
        </div>

        <p className="ls__q-text">{q.text}</p>

        <div className="ls__options">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`ls__opt ${selected[q.id] === i ? 'ls__opt--sel' : ''}`}
              onClick={() => persistAnswer(q.id, i)}
            >
              <span className="ls__opt-letter">{'ABCD'[i]}</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>

        <div className="ls__nav">
          <button className="ls__nav-btn" disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}>&larr; Previous</button>
          <span className="ls__nav-progress">{answeredCount}/{total} answered</span>
          {currentIdx < total - 1 ? (
            <button className="ls__nav-btn ls__nav-btn--primary" onClick={() => setCurrentIdx(i => i + 1)}>Next &rarr;</button>
          ) : (
            <button className="ls__nav-btn ls__nav-btn--finish" onClick={handleFinish}>Finish Section</button>
          )}
        </div>
      </div>
      <style>{`
        .ls { display: flex; height: 100%; }
        .ls__sidebar { width: 60px; background: var(--bg); border-right: 1px solid var(--border); padding: 12px 8px; overflow-y: auto; flex-shrink: 0; }
        .ls__sidebar-header { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; text-align: center; }
        .ls__sidebar-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
        .ls__sq { width: 100%; height: 32px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); cursor: pointer; font-size: 12px; font-weight: 600; color: var(--text); }
        .ls__sq--cur { border-color: var(--primary); background: var(--primary); color: #fff; }
        .ls__sq--done { background: var(--primary-light); border-color: var(--primary); }
        .ls__main { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
        .ls__q-label { font-size: 12px; font-weight: 700; color: var(--primary); }
        .ls__audio-row { margin: 4px 0; }
        .ls__play-btn { padding: 8px 20px; border: 1px solid var(--primary); border-radius: var(--radius-pill); background: var(--surface); color: var(--primary); cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; transition: all .12s; }
        .ls__play-btn:hover { background: var(--primary-light); }
        .ls__play-btn--playing { background: var(--primary); color: #fff; }
        .ls__q-text { font-size: 15px; font-weight: 600; color: var(--text); margin: 0; line-height: 1.5; }
        .ls__options { display: flex; flex-direction: column; gap: 8px; }
        .ls__opt { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); cursor: pointer; text-align: left; font: inherit; font-size: 14px; }
        .ls__opt:hover { border-color: var(--primary); }
        .ls__opt--sel { border-color: var(--primary); background: var(--primary-light); }
        .ls__opt-letter { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg); font-weight: 700; font-size: 13px; flex-shrink: 0; }
        .ls__opt--sel .ls__opt-letter { background: var(--primary); color: #fff; }
        .ls__nav { display: flex; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border); }
        .ls__nav-btn { padding: 8px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); cursor: pointer; font: inherit; font-size: 13px; font-weight: 600; }
        .ls__nav-btn:disabled { opacity: .4; cursor: default; }
        .ls__nav-btn--primary { background: var(--primary); color: #fff; border-color: var(--primary); }
        .ls__nav-btn--finish { background: var(--accent); color: #fff; border-color: var(--accent); }
        .ls__nav-progress { flex: 1; text-align: center; font-size: 13px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
