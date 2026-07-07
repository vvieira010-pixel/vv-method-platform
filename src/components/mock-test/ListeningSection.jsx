import { useState, useCallback, useRef, useEffect } from 'react';
import { LISTENING_PART1, LISTENING_PART2, LISTENING_PART3 } from '../../data/mock-test-1/listening.js';
import { callAI } from '../../lib/callAI.js';
import { fetchConversationAudio, fetchAudioWithGender } from '../../lib/tts-utils.js';

const PART3_VOICE_MAP = { 0: 'female', 1: 'male', 2: 'female', 3: 'male' };

function flattenQuestions() {
  const qs = [];
  LISTENING_PART1.questions.forEach(q => qs.push({
    ...q, audio: q.audio, isConversation: true, conversationId: `part1_${q.id}`,
    scriptContext: q.text + ' ' + q.options.join(' ')
  }));
  LISTENING_PART2.conversations.forEach(c => {
    const ctx = (c.questions || []).map(q => q.text + ' ' + q.options.join(' ')).join(' ');
    c.questions.forEach(q => qs.push({
      ...q, audio: c.audio, isConversation: true, conversationId: c.title,
      scriptContext: ctx
    }));
  });
  LISTENING_PART3.talks.forEach((t, i) => {
    const ctx = (t.questions || []).map(q => q.text + ' ' + q.options.join(' ')).join(' ');
    t.questions.forEach(q => qs.push({
      ...q, audio: t.audio, isConversation: false, conversationId: t.title,
      scriptContext: ctx, talkVoice: PART3_VOICE_MAP[i] || 'female'
    }));
  });
  return qs;
}

const QUESTIONS = flattenQuestions();
const CACHE_PREFIX = 'met:listening:audio:';

async function generateScript(context) {
  const prompt = `Write a very short, natural English conversation (2-4 lines) between two speakers for a listening test. Use "A:" and "B:" prefixes. The conversation should relate to this context: ${context}. Keep each line under 15 words. Output ONLY the script lines, one per line.`;
  const res = await callAI(prompt, { system: 'You write short natural English conversation scripts for language tests. Output only the script lines.', temperature: 0.5, max_tokens: 500 });
  const text = res?.content?.[0]?.text || res?.text || '';
  return text.split('\n').filter(l => l.trim()).map(l => {
    const m = l.trim().match(/^([AB]):\s*(.+)/i);
    if (!m) return null;
    return { speaker: m[1].toUpperCase(), text: m[2] };
  }).filter(Boolean);
}

function utterancesFromScript(script) {
  return script.map(u => ({
    text: u.text,
    gender: u.speaker === 'A' ? 'female' : 'male'
  }));
}

async function generateTalkAudio(context, gender) {
  const prompt = `Write a short English monologue (3-5 sentences) for a listening test. Topic context: ${context}. Keep it natural and under 60 words.`;
  const res = await callAI(prompt, { system: 'You write short natural English monologues for language tests. Output only the monologue text.', temperature: 0.5, max_tokens: 500 });
  const text = res?.content?.[0]?.text || res?.text || '';
  const clean = text.replace(/^["']|["']$/g, '').trim();
  return fetchAudioWithGender(clean, gender);
}

export default function ListeningSection({ onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});
  const [playing, setPlaying] = useState(null);
  const [generating, setGenerating] = useState(null);
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

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
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

  const playAudio = useCallback(async (src) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlaying(src);

    try {
      const audio = new Audio(src);
      audioRef.current = audio;
      await audio.play();
      audio.addEventListener('ended', () => setPlaying(null));
    } catch {
      setPlaying(null);
    }
  }, []);

  const handlePlay = useCallback(async (q) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    const cacheKey = CACHE_PREFIX + q.id;
    let cachedUrl = null;
    try { cachedUrl = sessionStorage.getItem(cacheKey); } catch {}

    if (cachedUrl) {
      await playAudio(cachedUrl);
      return;
    }

    setGenerating(q.id);

    try {
      let url = null;

      if (q.isConversation) {
        const scriptCacheKey = CACHE_PREFIX + 'script:' + q.conversationId;
        let script = null;
        try {
          const cached = sessionStorage.getItem(scriptCacheKey);
          if (cached) script = JSON.parse(cached);
        } catch {}

        if (!script) {
          script = await generateScript(q.scriptContext);
          if (script && script.length > 0) {
            try { sessionStorage.setItem(scriptCacheKey, JSON.stringify(script)); } catch {}
          }
        }

        if (script && script.length > 0) {
          const utterances = utterancesFromScript(script);
          url = await fetchConversationAudio(utterances);
        }
      } else {
        url = await generateTalkAudio(q.scriptContext, q.talkVoice || 'female');
      }

      if (url) {
        try { sessionStorage.setItem(cacheKey, url); } catch {}
        await playAudio(url);
      } else {
        await playAudio(q.audio);
      }
    } catch {
      await playAudio(q.audio);
    }

    setGenerating(null);
  }, [playAudio]);

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
          {QUESTIONS.map((qq, i) => (
            <button
              key={qq.id}
              className={`ls__sq ${currentIdx === i ? 'ls__sq--cur' : ''} ${answered[qq.id] ? 'ls__sq--done' : ''}`}
              onClick={() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlaying(null); } setCurrentIdx(i); }}
            >{i + 1}</button>
          ))}
        </div>
      </div>
      <div className="ls__main">
        <div className="ls__q-label">Question {currentIdx + 1} of {total}</div>

        <div className="ls__audio-row">
          <button
            className={`ls__play-btn ${playing ? 'ls__play-btn--playing' : ''}`}
            onClick={() => handlePlay(q)}
            disabled={generating === q.id}
          >
            {generating === q.id ? '\u23F3' : playing ? '\uD83C\uDFB5' : '\u25B6'} {generating === q.id ? 'Generating...' : playing ? 'Playing' : 'Play Audio'}
          </button>
          {q.isConversation && (
            <span className="ls__voice-badge">Multi-voice</span>
          )}
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
          <button className="ls__nav-btn" disabled={currentIdx === 0} onClick={() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlaying(null); } setCurrentIdx(i => i - 1); }}>&larr; Previous</button>
          <span className="ls__nav-progress">{answeredCount}/{total} answered</span>
          {currentIdx < total - 1 ? (
            <button className="ls__nav-btn ls__nav-btn--primary" onClick={() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlaying(null); } setCurrentIdx(i => i + 1); }}>Next &rarr;</button>
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
        .ls__audio-row { margin: 4px 0; display: flex; align-items: center; gap: 8px; }
         .ls__play-btn { padding: 8px 20px; border: 1px solid var(--primary); border-radius: var(--radius-pill); background: var(--surface); color: var(--primary); cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; transition: background-color, border-color, color, opacity, transform .12s; display: inline-flex; align-items: center; gap: 6px; }
        .ls__play-btn:hover:not(:disabled) { background: var(--primary-light); }
        .ls__play-btn:disabled { opacity: .6; cursor: wait; }
        .ls__play-btn--playing { background: var(--primary); color: #fff; }
        .ls__voice-badge { display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 2px 8px; border-radius: 99px; background: #7c3aed1a; color: #7c3aed; border: 1px solid #7c3aed33; }
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
