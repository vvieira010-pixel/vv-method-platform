import { useState, useEffect } from 'react';
import { MOCK_TEST_1, getCefrLevel, getCefrColor } from '../../data/mock-test-1/index.js';
import { scoreReading, scoreListening } from '../../lib/mock-test-scoring.js';
import { saveMockTestResult } from '../../lib/workflow.js';
import { uploadMockTestAudio } from '../../lib/supabase-db.js';

const CEFR_LEVELS = [
  { id: 'Below B1', label: 'A1–A2', desc: 'Beginner / Elementary', color: '#e74c3c' },
  { id: 'B1', label: 'B1', desc: 'Intermediate', color: '#f1c40f' },
  { id: 'B2', label: 'B2', desc: 'Upper-Intermediate', color: '#2ecc71' },
  { id: 'C1', label: 'C1', desc: 'Advanced', color: '#3498db' },
];

const CEFR_DESCRIPTIONS = {
  'Below B1': 'Can understand basic phrases and familiar topics. Needs foundational work to reach B1.',
  'B1': 'Can understand the main points of clear standard input on familiar matters. Ready to push toward B2.',
  'B2': 'Can understand the main ideas of complex text on both concrete and abstract topics. Strong foundation for C1.',
  'C1': 'Can understand a wide range of demanding, longer texts. Excellent progress toward mastery.',
};

const CEFR_LONG_LABELS = {
  'Below B1': 'Beginner / Elementary (Below B1)',
  'B1': 'Intermediate (Independent User)',
  'B2': 'Upper-Intermediate (Independent User)',
  'C1': 'Advanced (Proficient User)',
};

export default function MockTestThanks({ answers, student, onBack }) {
  const [status, setStatus] = useState('saving');
  const [readingScore, setReadingScore] = useState(null);
  const [listeningScore, setListeningScore] = useState(null);
  const [error, setError] = useState(null);
  const [savedResult, setSavedResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus('saving');

        const reading = scoreReading(answers);
        const listening = scoreListening(answers);
        if (!cancelled) { setReadingScore(reading); setListeningScore(listening); }

        const combinedTotal = reading.total + listening.total;
        const combinedMax = reading.max + listening.max;
        const cefr = getCefrLevel(combinedTotal, combinedMax);

        const speakingRecordings = {};
        const speakingTasks = answers && Object.keys(answers).filter(k =>
          !isNaN(Number(k)) && typeof answers[k] === 'string' && answers[k].startsWith('blob:')
        );

        for (const idx of speakingTasks) {
          try {
            const resp = await fetch(answers[idx]);
            const blob = await resp.blob();
            const path = `mock1/${student?.email || 'anon'}/speaking_task${idx}_${Date.now()}.webm`;
            const savedPath = await uploadMockTestAudio(blob, path);
            speakingRecordings[idx] = savedPath;
          } catch {
            speakingRecordings[idx] = null;
          }
        }

        const payload = {
          studentId: student?.local_id || student?.id || '',
          studentName: student?.name || student?.firstName || '',
          studentEmail: student?.email || '',
          testId: 'mock-test-1',
          testTitle: MOCK_TEST_1.title,
          answers,
          scores: {
            reading: { total: reading.total, max: reading.max, details: reading.details, cefr: getCefrLevel(reading.total, reading.max) },
            listening: { total: listening.total, max: listening.max, details: listening.details, cefr: getCefrLevel(listening.total, listening.max) },
          },
          cefr,
          speakingRecordings,
          submittedAt: new Date().toISOString(),
        };

        try {
          await saveMockTestResult(payload);
        } catch (e) {
          console.warn('[MockTestThanks] Supabase save failed, keeping localStorage:', e.message);
        }

        try {
          localStorage.setItem('met:mock1:submission', JSON.stringify(payload));
        } catch {}

        MOCK_TEST_1.sections.forEach(s => {
          try { localStorage.removeItem(`met:timer:${s.id}`); } catch {}
          try { sessionStorage.removeItem(`met:section:${s.id}:answers`); } catch {}
        });

        if (!cancelled) { setSavedResult(payload); setStatus('done'); }
      } catch (e) {
        if (!cancelled) { setError(e.message); setStatus('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [answers, student]);

  if (status !== 'done') {
    const msg = status === 'saving' ? 'Saving your test results...'
      : status === 'error' ? `Error: ${error}` : '';
    return (
      <div className="mtr-container">
        <div className="mtr-header"><p style={{ color: '#7f8c8d', padding: '40px 0', textAlign: 'center' }}>{msg}</p></div>
      </div>
    );
  }

  const combinedTotal = (readingScore?.total || 0) + (listeningScore?.total || 0);
  const combinedMax = (readingScore?.max || 0) + (listeningScore?.max || 0);
  const cefr = getCefrLevel(combinedTotal, combinedMax);
  const cefrColor = getCefrColor(cefr);

  const readingPct = readingScore?.max > 0 ? Math.round((readingScore.total / readingScore.max) * 100) : 0;
  const listeningPct = listeningScore?.max > 0 ? Math.round((listeningScore.total / listeningScore.max) * 100) : 0;

  return (
    <div className="mtr-container">
      <div className="mtr">
        <div className="mtr-header">
          <h1 className="mtr-header__title">Mock Test Results</h1>
          <p className="mtr-header__sub">{MOCK_TEST_1.title}</p>

          <div className="mtr-badge" style={{ background: cefrColor }}>{cefr}</div>
          <div className="mtr-score">{combinedTotal} / {combinedMax}</div>
          <p className="mtr-label">{CEFR_LONG_LABELS[cefr] || cefr}</p>

          <div className="mtr-bar">
            {CEFR_LEVELS.map(l => (
              <div
                key={l.id}
                className={`mtr-bar__level ${l.id === cefr ? 'mtr-bar__level--active' : ''}`}
                style={{ background: l.color }}
              >
                <span className="mtr-bar__lbl">{l.label}</span>
                <span className="mtr-bar__desc">{l.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mtr-message">
          You've completed your mock test. Your score is a starting point, not a final judgment.
          This result shows us exactly where to focus next. Together, we'll analyse your performance
          by skill area, identify the gaps, and build a targeted plan to close them before exam day.
          Every mistake here is a mistake you won't make in the real test.
        </div>

        <div className="mtr-skills">
          <SkillCard
            label="Listening"
            score={listeningScore}
            pct={listeningPct}
            cefr={listeningScore ? getCefrLevel(listeningScore.total, listeningScore.max) : null}
          />
          <SkillCard
            label="Reading & Grammar"
            score={readingScore}
            pct={readingPct}
            cefr={readingScore ? getCefrLevel(readingScore.total, readingScore.max) : null}
          />
        </div>

        <div className="mtr-action">
          <h2 className="mtr-action__title">Next Steps</h2>
          <div className="mtr-action__item">
            <span className="mtr-action__priority mtr-action__priority--high">HIGH</span>
            <div className="mtr-action__text">
              <strong>Review your mistakes</strong>
              Look at the questions you got wrong and understand why. Each incorrect answer reveals a specific gap to work on.
            </div>
          </div>
          <div className="mtr-action__item">
            <span className="mtr-action__priority mtr-action__priority--med">MEDIUM</span>
            <div className="mtr-action__text">
              <strong>Focus on your weaker skill</strong>
              {cefr === 'Below B1' || cefr === 'B1'
                ? 'Prioritise building foundational vocabulary and grammar through daily practice exercises.'
                : 'Practise with authentic materials at or slightly above your current level to push toward the next band.'}
            </div>
          </div>
          <div className="mtr-action__item">
            <span className="mtr-action__priority mtr-action__priority--low">NEXT</span>
            <div className="mtr-action__text">
              <strong>Take another mock test</strong>
              Track your progress over time. Aim to move up one CEFR band with each practice cycle.
            </div>
          </div>
        </div>

        <button className="mtr-btn" onClick={onBack}>Return to Dashboard</button>
      </div>

      <style>{`
        .mtr-container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', system-ui, sans-serif; color: var(--text, #2c3e50); }
        .mtr { background: var(--surface, #fff); border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; }

        .mtr-header { padding: 32px 24px 20px; text-align: center; }
        .mtr-header__title { font-size: 1.5rem; margin: 0 0 4px; font-weight: 800; }
        .mtr-header__sub { color: var(--text-muted, #7f8c8d); font-size: 0.95rem; margin: 0 0 20px; }
        .mtr-badge { display: inline-block; padding: 12px 36px; border-radius: 50px; font-size: 1.8rem; font-weight: 800; color: #fff; }
        .mtr-score { font-size: 2.2rem; font-weight: 800; margin-top: 8px; }
        .mtr-label { font-size: 0.85rem; color: var(--text-muted, #7f8c8d); margin-top: 6px; }

        .mtr-bar { display: flex; gap: 4px; margin-top: 20px; border-radius: 10px; overflow: hidden; }
        .mtr-bar__level { flex: 1; padding: 10px 4px; text-align: center; font-size: 0.75rem; font-weight: 700; color: #fff; position: relative; transition: transform 0.2s; }
        .mtr-bar__level--active { transform: scaleY(1.15); box-shadow: 0 -2px 8px rgba(0,0,0,0.2); z-index: 1; }
        .mtr-bar__lbl { display: block; font-size: 0.9rem; }
        .mtr-bar__desc { display: block; font-size: 0.6rem; opacity: 0.85; margin-top: 2px; }

        .mtr-message { background: #eaf6ff; border-left: 4px solid #3498db; border-radius: 0 12px 12px 0; padding: 16px 20px; margin: 0 24px 20px; font-size: 0.9rem; line-height: 1.6; }

        .mtr-skills { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 24px 20px; }
        .mtr-skill { background: var(--bg, #f8f9fa); border-radius: 12px; padding: 20px; }
        .mtr-skill__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 1rem; font-weight: 700; }
        .mtr-skill__badge { padding: 4px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; color: #fff; }
        .mtr-skill__score { font-size: 1.4rem; font-weight: 800; margin-bottom: 8px; }
        .mtr-skill__bar { height: 10px; border-radius: 5px; background: #eee; overflow: hidden; margin-bottom: 8px; }
        .mtr-skill__fill { height: 100%; border-radius: 5px; }
        .mtr-skill__desc { font-size: 0.8rem; color: var(--text-muted, #7f8c8d); line-height: 1.4; }

        .mtr-action { padding: 0 24px 20px; }
        .mtr-action__title { font-size: 1.2rem; margin: 0 0 16px; font-weight: 700; }
        .mtr-action__item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border, #e0e0e0); }
        .mtr-action__item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .mtr-action__priority { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: #fff; white-space: nowrap; }
        .mtr-action__priority--high { background: #e74c3c; }
        .mtr-action__priority--med { background: #f1c40f; color: #333; }
        .mtr-action__priority--low { background: #2ecc71; }
        .mtr-action__text { font-size: 0.88rem; line-height: 1.4; }
        .mtr-action__text strong { display: block; margin-bottom: 2px; }

        .mtr-btn { display: block; width: calc(100% - 48px); margin: 0 24px 24px; padding: 12px 0; border: none; border-radius: 12px; background: var(--primary, #148891); color: #fff; cursor: pointer; font: inherit; font-size: 15px; font-weight: 700; text-align: center; }
        .mtr-btn:hover { background: var(--primary-hover, #0f6b73); }

        @media (max-width: 600px) {
          .mtr-skills { grid-template-columns: 1fr; }
          .mtr-badge { font-size: 1.4rem; padding: 10px 24px; }
          .mtr-bar__desc { display: none; }
        }
      `}</style>
    </div>
  );
}

function SkillCard({ label, score, pct, cefr }) {
  if (!score) return null;
  const color = getCefrColor(cefr);
  return (
    <div className="mtr-skill">
      <div className="mtr-skill__header">
        {label}
        <span className="mtr-skill__badge" style={{ background: color }}>{cefr}</span>
      </div>
      <div className="mtr-skill__score">{score.total} / {score.max}</div>
      <div className="mtr-skill__bar">
        <div className="mtr-skill__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="mtr-skill__desc">{CEFR_DESCRIPTIONS[cefr] || ''}</p>
    </div>
  );
}
