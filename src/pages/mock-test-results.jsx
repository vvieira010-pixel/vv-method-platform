import { useState, useEffect } from 'react';
import { getMockTestResults } from '../lib/workflow.js';
import { getMockTestAudioUrl } from '../lib/supabase-db.js';
import { getCefrLevel, getCefrColor } from '../data/mock-test-1/index.js';
import { getAllReadingQuestions, getAllListeningQuestions } from '../lib/mock-test-scoring.js';
import { Icon, SectionHeader } from '../components/shared.jsx';

const READING_QS = getAllReadingQuestions();
const LISTENING_QS = getAllListeningQuestions();

const Q_LOOKUP = {};
READING_QS.forEach(q => { Q_LOOKUP[q.id] = { ...q, section: 'reading' }; });
LISTENING_QS.forEach(q => { Q_LOOKUP[q.id] = { ...q, section: 'listening' }; });

const LABELS = ['A', 'B', 'C', 'D'];

export default function MockTestResults() {
  const [results, setResults] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [audioUrls, setAudioUrls] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getMockTestResults();
        setResults(data || []);
      } catch {}
    })();
  }, []);

  const toggleExpand = async (r) => {
    if (expanded === r.id) { setExpanded(null); return; }
    setExpanded(r.id);
    const urls = {};
    const recordings = r.speakingRecordings || r.answers?.speakingRecordings || {};
    for (const [idx, path] of Object.entries(recordings)) {
      if (path && typeof path === 'string' && !path.startsWith('blob:')) {
        try { urls[idx] = await getMockTestAudioUrl(path); } catch { urls[idx] = null; }
      }
    }
    setAudioUrls(urls);
  };

  return (
    <div className="page-shell">
      <div className="hero-section hero-section--inbox" style={{ marginBottom: 'var(--space-5)' }}>
        <SectionHeader title="Mock Test Results" subtitle="All student submissions" />
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-muted" style={{ padding: '32px 20px' }}>No submissions yet.</p>
      ) : (
        <div className="mtr-list">
          {results.map(r => (
            <div key={r.id} className="mtr-row" onClick={() => toggleExpand(r)}>
              <div className="mtr-row__header">
                <div className="mtr-row__student">{r.studentName || r.studentEmail || 'Unknown'}</div>
                <div className="mtr-row__meta">
                  <span>{new Date(r.submittedAt).toLocaleDateString()}</span>
                  {r.cefr && <span className="mtr-cefr-badge" style={{ background: getCefrColor(r.cefr) }}>{r.cefr}</span>}
                </div>
              </div>
              {expanded === r.id && (
                <div className="mtr-detail">
                  {r.scores?.reading && <ScoreSection label="Reading & Grammar" score={r.scores.reading} />}
                  {r.scores?.listening && <ScoreSection label="Listening" score={r.scores.listening} />}
                  {(r.speakingRecordings || r.answers?.speakingRecordings) && (
                    <div className="mtr-block">
                      <h4 className="mtr-block__title">Speaking Recordings</h4>
                      {Object.entries(r.speakingRecordings || r.answers?.speakingRecordings || {}).map(([idx, path]) => (
                        <div key={idx} className="mtr-audio-row">
                          <span>Task {Number(idx) + 1}:</span>
                          {audioUrls[idx] ? (
                            <audio controls src={audioUrls[idx]} style={{ height: 32 }} />
                          ) : path && !path.startsWith('blob:') ? (
                            <span className="text-muted">Loading...</span>
                          ) : (
                            <span className="text-muted">No recording</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {r.answers && (
                    <div className="mtr-block">
                      <h4 className="mtr-block__title">Writing Responses</h4>
                      {Object.entries(r.answers).filter(([k]) => k.startsWith('w')).map(([k, v]) => (
                        <div key={k} className="mtr-writing-row">
                          <span className="mtr-writing-id">{k}</span>
                          <p className="mtr-writing-text">{v || '(blank)'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {r.scores?.reading?.details && r.scores?.listening?.details && (
                    <div className="mtr-block">
                      <h4 className="mtr-block__title">All Questions</h4>
                      <div className="mtr-qs">
                        {[...(r.scores.reading.details), ...(r.scores.listening.details)].map(d => {
                          const q = Q_LOOKUP[d.qId];
                          return (
                            <div key={d.qId} className={`mtr-q ${d.correct ? 'mtr-q--ok' : 'mtr-q--miss'}`}>
                              <div className="mtr-q__id">{d.qId}</div>
                              <div className="mtr-q__detail">
                                {q && <div className="mtr-q__text">{q.text}</div>}
                                <div className="mtr-q__meta">
                                  <span>{d.correct ? '\u2713' : '\u2717'} {d.pts}/{d.max}pts</span>
                                  {d.selected !== undefined && q && (
                                    <span className="mtr-q__ans">
                                      Your answer: {LABELS[d.selected] || d.selected}
                                      {!d.correct && <span className="mtr-q__correct"> (correct: {LABELS[q.answer]})</span>}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .mtr-list { max-width: 800px; margin: 0 auto; padding: 0 20px 40px; display: flex; flex-direction: column; gap: 8px; }
        .mtr-row { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; overflow: hidden; }
        .mtr-row__header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; }
        .mtr-row__student { font-weight: 700; font-size: 15px; color: var(--text); }
        .mtr-row__meta { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-muted); }
        .mtr-cefr-badge { padding: 2px 10px; border-radius: 999px; color: #fff; font-weight: 700; font-size: 11px; }
        .mtr-detail { border-top: 1px solid var(--border); padding: 16px 20px; display: flex; flex-direction: column; gap: 16px; }
        .mtr-block { }
        .mtr-block__title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin: 0 0 8px; }
        .mtr-score-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
        .mtr-score-label { color: var(--text); }
        .mtr-score-value { font-weight: 600; }
        .mtr-audio-row { display: flex; align-items: center; gap: 12px; padding: 4px 0; font-size: 13px; }
        .mtr-writing-row { padding: 6px 0; border-bottom: 1px solid var(--border); }
        .mtr-writing-id { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        .mtr-writing-text { font-size: 13px; color: var(--text); margin: 2px 0 0; white-space: pre-wrap; }
        .mtr-qs { display: flex; flex-direction: column; gap: 6px; max-height: 400px; overflow-y: auto; }
        .mtr-q { display: flex; gap: 10px; padding: 8px 10px; border-radius: var(--radius-sm); font-size: 13px; }
        .mtr-q--ok { background: var(--success-bg, #ecfdf5); }
        .mtr-q--miss { background: var(--error-bg, #fef2f2); }
        .mtr-q__id { font-weight: 700; color: var(--text-muted); font-size: 11px; min-width: 32px; }
        .mtr-q__detail { flex: 1; }
        .mtr-q__text { color: var(--text); margin-bottom: 4px; }
        .mtr-q__meta { display: flex; gap: 12px; font-size: 12px; color: var(--text-muted); }
        .mtr-q__ans { }
        .mtr-q__correct { color: var(--success, #16a34a); font-weight: 600; }
      `}</style>
    </div>
  );
}

function ScoreSection({ label, score }) {
  if (!score) return null;
  const pct = score.max > 0 ? Math.round((score.total / score.max) * 100) : 0;
  return (
    <div className="mtr-score-row">
      <span className="mtr-score-label">{label}</span>
      <span className="mtr-score-value">{score.total} / {score.max} ({pct}%)</span>
    </div>
  );
}
