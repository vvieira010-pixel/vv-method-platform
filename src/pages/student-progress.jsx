import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getDiagnoses } from '../lib/workflow.js';
import { asArray, getProgressStage, getSkillTrend, PROGRESS_STAGES, STAGE_DESCRIPTIONS } from './student-helpers.js';

function sectionToLabel(section) {
  if (!section) return '';
  return section.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Speaking/g, 'Sp.').replace(/Writing/g, 'Wr.').replace(/Grammar/g, 'Gr.')
    .replace(/Vocabulary/g, 'Voc.').replace(/Listening/g, 'Lis.').replace(/Reading/g, 'Read.').slice(0, 18);
}

function TrendChip({ trend }) {
  if (!trend || trend.dir === 'none') return null;
  const glyph = { up: '↑', down: '↓', steady: '→', new: '•' }[trend.dir] || '•';
  return <span className={`student-trend-chip student-trend-chip--${trend.dir}`}><span aria-hidden="true">{glyph}</span> {trend.label}</span>;
}

function SubskillRadar({ sectionData }) {
  const [RechartsComponents, setRechartsComponents] = useState(null);
  useEffect(() => { import('recharts').then(mod => setRechartsComponents(mod)); }, []);
  if (!RechartsComponents) return null;
  const { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } = RechartsComponents;
  return (
    <div style={{ width: '100%', height: 380, marginBottom: 24 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={sectionData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="var(--divider)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text-2)', fontSize: 11, fontFamily: 'var(--font-ui)' }} />
          <PolarRadiusAxis domain={[0, 80]} tick={{ fill: 'var(--muted)', fontSize: 10 }} tickCount={5} />
          {sectionData.some(d => d.previous != null) && (
            <Radar name="Previous" dataKey="previous" stroke="var(--muted)" strokeWidth={1} strokeDasharray="5 5" fill="var(--muted)" fillOpacity={0.15} isAnimationActive={true} animationDuration={900} />
          )}
          <Radar name="Current" dataKey="current" stroke="var(--accent)" strokeWidth={2} fill="var(--accent)" fillOpacity={0.25} isAnimationActive={true} animationDuration={1200} />
          <Radar name="Target" dataKey="target" stroke="var(--primary)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" isAnimationActive={true} animationDuration={1000} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-ui)', color: 'var(--text-2)' }} />
          <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 0, fontSize: 12, fontFamily: 'var(--font-ui)' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProgressProfileCard({ skill, trend }) {
  const score = Number(skill.score_0_80) || 0;
  if (score <= 0) return null;
  const stage = getProgressStage(score);
  const trendNote = trend?.dir === 'new' ? 'Evaluated once — your progress trend appears after the next class.'
    : trend?.dir === 'up' ? 'You are moving in the right direction since your last class.'
    : trend?.dir === 'down' ? 'Practice focus for next class.' : 'Holding steady — keep practising to reach the next stage.';

  return (
    <article className="student-progress-card">
      <div className="student-panel-head">
        <div><span className="student-panel-kicker">Skill progress</span><h2>{skill.section}</h2></div>
        {trend?.label === 'Moved up a stage' ? (
          <motion.span key={stage.label} className="student-stage-badge" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: [1, 1.25, 0.9, 1.08, 1], opacity: 1 }} transition={{ duration: 0.7 }}>{stage.label}</motion.span>
        ) : (
          <span className="student-stage-badge">{stage.label}</span>
        )}
      </div>

      <div className="student-stage-track student-stage-track--wide student-stage-track--animate" key={stage.label} aria-label={`${skill.section} stage: ${stage.label}`}>
        {PROGRESS_STAGES.map(item => (
          <span key={item.label} className={item.order <= stage.order ? 'active' : ''} title={item.label} />
        ))}
      </div>

      <div className="student-progress-trend">
        <TrendChip trend={trend} />
        <span className="student-progress-trend-note">{trendNote}</span>
      </div>

      <div className="student-progress-copy-grid">
        <div><strong>Current focus</strong><p>{skill.next_step || `Keep building more control in ${skill.section}.`}</p></div>
        <div><strong>Last assessed</strong><p>{stage.label} stage · {trend?.evaluations > 1 ? `based on ${trend.evaluations} classes` : 'based on your latest class'}.</p></div>
      </div>

      <div className="student-confidence-list">
        <div className="student-todo-row"><span className={`student-todo-check${stage.order >= 2 ? ' done' : ''}`}>{stage.order >= 2 ? '✓' : ''}</span><span><strong>I understand the {skill.section} task</strong><small>Foundation step</small></span></div>
        <div className="student-todo-row"><span className={`student-todo-check${stage.order >= 3 ? ' done' : ''}`}>{stage.order >= 3 ? '✓' : ''}</span><span><strong>I can complete it with support</strong><small>Building control</small></span></div>
        <div className="student-todo-row"><span className={`student-todo-check${stage.order >= 4 ? ' done' : ''}`}>{stage.order >= 4 ? '✓' : ''}</span><span><strong>I can do it more independently</strong><small>Consistency step</small></span></div>
        <div className="student-todo-row"><span className={`student-todo-check${stage.order >= 5 ? ' done' : ''}`}>{stage.order >= 5 ? '✓' : ''}</span><span><strong>I can try timed mock practice</strong><small>Ready for mock practice</small></span></div>
      </div>
    </article>
  );
}

export default function StudentProgress({ student }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [legendOpen, setLegendOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const dx = await getDiagnoses(student.id);
      const approved = (dx || []).filter(d => d.status === 'approved');
      setDiagnoses(approved);
    })();
  }, [student.id]);

  const sorted = [...diagnoses].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const latest = sorted[0];
  const skills = sorted.reduce((acc, d) => {
    if (acc.length > 0) return acc;
    const snap = asArray(d?.content?.section_snapshot);
    return snap.filter(s => s.evaluated || Number(s.score_0_80) > 0);
  }, []);

  return (
    <div className="student-progress-page">
      <section className="student-hero">
        <div>
          <p className="student-hero-kicker">MET progress profile</p>
          <h1>Your MET progress path</h1>
          <p>Progress stages show direction without turning your learning into a grade.</p>
        </div>
      </section>

      <div className="student-stage-legend">
        <button className="student-stage-legend-toggle" onClick={() => setLegendOpen(v => !v)} aria-expanded={legendOpen}>
          <span>What do the stages mean?</span>
          <span aria-hidden="true" style={{ fontSize: 10 }}>{legendOpen ? '▲' : '▼'}</span>
        </button>
        {legendOpen && (
          <div className="student-stage-legend-body">
            {PROGRESS_STAGES.map(s => (
              <div key={s.label} className="student-stage-legend-row">
                <span className="student-stage-legend-name">{s.label}</span>
                <span className="student-stage-legend-desc">{STAGE_DESCRIPTIONS[s.label]}</span>
              </div>
            ))}
            <div className="student-stage-legend-row student-stage-legend-row--goal">
              <span className="student-stage-legend-name">Your goal</span>
              <span className="student-stage-legend-desc">Stage 5 = Ready for Mock Practice = B2 performance on the MET. The actual exam requires 65/80 or higher across all sections.</span>
            </div>
          </div>
        )}
      </div>

      {diagnoses.length === 0 ? (
        <section className="student-panel student-panel--readiness">
          <div className="student-panel-head">
            <div><span className="student-panel-kicker">Starting point</span><h2>Your first progress steps</h2></div>
          </div>
          <div className="student-progress-starter">
            <p>No approved diagnosis is ready yet. You can still start building useful evidence for your teacher.</p>
            <div className="student-todo-row"><span className="student-todo-check" /><span><strong>Complete the next assigned homework</strong><small>Homework gives your teacher review evidence</small></span></div>
            <div className="student-todo-row"><span className="student-todo-check" /><span><strong>Prepare one speaking sample</strong><small>45 seconds with one clear example</small></span></div>
            <div className="student-todo-row"><span className="student-todo-check" /><span><strong>Ask one MET question in class</strong><small>Use the Messages tab if you need help before class</small></span></div>
          </div>
        </section>
      ) : (
        <>
          {skills.length > 1 && (() => {
            const sortedDx = [...diagnoses].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            const previousDx = sortedDx.find(d => {
              const snap = asArray(d?.content?.section_snapshot);
              return snap.length > 0 && snap.some(s => Number(s.score_0_80) > 0) && d.id !== latest?.id;
            });
            const prevSnapshot = asArray(previousDx?.content?.section_snapshot);
            const radarData = skills.map(skill => {
              const prevSkill = prevSnapshot.find(s => s.section === skill.section);
              return { skill: sectionToLabel(skill.section), current: Number(skill.score_0_80) || 0, previous: prevSkill ? (Number(prevSkill.score_0_80) || 0) : null, target: 65 };
            });
            return <SubskillRadar sectionData={radarData} />;
          })()}

          {skills.length > 0 ? (
            <section className="student-readiness-grid">
              {skills.map(skill => (<ProgressProfileCard key={skill.section} skill={skill} trend={getSkillTrend(skill.section, sorted)} />))}
            </section>
          ) : (
            <div className="student-empty-card" style={{ marginBottom: 18 }}>No evaluated skills are ready to show yet. When a class evaluates speaking only, only speaking progress will appear here.</div>
          )}

          {sorted.length > 1 && (
            <section className="student-panel">
              <div className="student-panel-head">
                <div><span className="student-panel-kicker">Compare by date</span><h2>Skill progress</h2></div>
              </div>
              <div className="student-history-list">
                {sorted.map(dx => {
                  const snap = asArray(dx?.content?.section_snapshot).filter(s => s.evaluated || Number(s.score_0_80) > 0);
                  if (snap.length === 0) return null;
                  return (
                    <div key={dx.id} className="student-history-item" style={{ alignItems: 'flex-start', gap: 16 }}>
                      <span style={{ minWidth: 80, color: 'var(--muted)', fontSize: 'var(--text-xs)', paddingTop: 3, flexShrink: 0 }}>
                        {new Date(dx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                        {snap.map(s => {
                          const stage = getProgressStage(s.score_0_80);
                          return (
                            <div key={s.section} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ minWidth: 88, fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'capitalize' }}>
                                {s.section.replace(/_/g, ' ')}
                              </span>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text)', minWidth: 148 }}>
                                {stage.label}
                              </span>
                              <div style={{ display: 'flex', gap: 3 }} aria-label={`${stage.order} of 5 stages`}>
                                {PROGRESS_STAGES.map(st => (
                                  <span key={st.label} style={{
                                    width: 16, height: 6, borderRadius: 3,
                                    background: st.order <= stage.order ? 'var(--accent)' : 'var(--border)',
                                    transition: 'background 0.2s',
                                  }} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
