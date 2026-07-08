import { useState, useEffect } from 'react';
import { Icon, SectionHeader } from '../components/shared.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import MockTestEngine from '../components/mock-test/MockTestEngine.jsx';
import { getMockTestResults } from '../lib/workflow.js';
import { getCefrColor } from '../data/mock-test-1/index.js';

export default function MockTestPage({ student }) {
  const [activeTest, setActiveTest] = useState(null);
  const [pastResults, setPastResults] = useState([]);

  useEffect(() => {
    if (student?.id) {
      getMockTestResults(student.id).then(setPastResults).catch(e => console.warn('[mock-test] failed to load results:', e));
    } else if (student.local_id) {
      getMockTestResults(student.local_id).then(setPastResults).catch(e => console.warn('[mock-test] failed to load results:', e));
    }
  }, [student]);

  if (activeTest) {
    return <MockTestEngine student={student} onBack={() => setActiveTest(null)} />;
  }

  return (
    <div className="page-shell">
      <div className="hero-section" style={{ marginBottom: 'var(--space-5)' }}>
        <SectionHeader
          title="Mock Tests"
          subtitle="Full-length MET practice exams"
        />
      </div>

      <div className="split-grid">
        <Card className="card-p-5" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Icon.practice size={24} />
            <div>
              <div className="row-title">MET Mock Test 1</div>
              <div className="row-sub">Full-length practice exam · ~2 h 35 min</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
            <span className="pill pill--accent">Reading &amp; Grammar (65 min)</span>
            <span className="pill pill--accent">Listening (35 min)</span>
            <span className="pill pill--accent">Speaking (10 min)</span>
            <span className="pill pill--accent">Writing (45 min)</span>
          </div>
          <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
            Complete MET practice exam covering all four competencies.
          </p>
          <Button variant="primary" onClick={() => setActiveTest('mock-test-1')}>
            <Icon.practice size={14} /> Start Mock Test
          </Button>
        </Card>
      </div>

      {pastResults.length > 0 && (
        <div className="mtr-student" style={{ maxWidth: 720, margin: '24px auto 0', padding: '0 20px' }}>
          <h3 className="mtr-student__title">Past Results</h3>
          <div className="mtr-student__list">
            {pastResults.map(r => {
              const score = r.scores?.reading?.total + r.scores?.listening?.total || 0;
              const max = r.scores?.reading?.max + r.scores?.listening?.max || 0;
              const pct = max > 0 ? Math.round((score / max) * 100) : 0;
              return (
                <div key={r.id} className="mtr-student__row">
                  <span className="mtr-student__date">{new Date(r.submittedAt).toLocaleDateString()}</span>
                  <span className="mtr-student__score">{score}/{max} ({pct}%)</span>
                  {r.cefr && <span className="mtr-student__cefr" style={{ background: getCefrColor(r.cefr) }}>{r.cefr}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .mtr-student__title { font-size: 16px; font-weight: 700; color: var(--text); margin: 0 0 12px; }
        .mtr-student__list { display: flex; flex-direction: column; gap: 6px; }
        .mtr-student__row { display: flex; align-items: center; gap: 16px; padding: 10px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; }
        .mtr-student__date { color: var(--text-muted); min-width: 90px; }
        .mtr-student__score { font-weight: 600; color: var(--text); flex: 1; }
        .mtr-student__cefr { padding: 2px 10px; border-radius: 999px; color: #fff; font-weight: 700; font-size: 11px; }
      `}</style>
    </div>
  );
}
