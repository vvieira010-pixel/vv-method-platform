import { useState, useEffect } from 'react';
import { getDiagnoses } from '../lib/workflow.js';
import { asArray, getProgressStage, getSkillTrend, PROGRESS_STAGES, STAGE_DESCRIPTIONS, TrendChip, SkillRow } from './student-helpers.jsx';

function sectionToLabel(section) {
  if (!section) return '';
  return section.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Speaking/g, 'Sp.').replace(/Writing/g, 'Wr.').replace(/Grammar/g, 'Gr.')
    .replace(/Vocabulary/g, 'Voc.').replace(/Listening/g, 'Lis.').replace(/Reading/g, 'Read.').slice(0, 18);
}

function SubskillRadar({ sectionData }) {
  const [loaded, setLoaded] = useState(false);
  const [Modules, setModules] = useState(null);
  const [chartHeight, setChartHeight] = useState(400);
  useEffect(() => { import('recharts').then(mod => { setModules(mod); setLoaded(true); }); }, []);
  useEffect(() => {
    const check = () => setChartHeight(window.innerWidth < 640 ? 300 : 400);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!loaded) return (
    <div className="student-radar-skeleton" aria-hidden="true">
      <div className="student-radar-skeleton-pulse" />
    </div>
  );

  const hasData = sectionData?.some(d => (d.current || 0) > 0);
  if (!hasData || !sectionData?.length) return null;

  const { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } = Modules;
  const maxVal = Math.max(...sectionData.map(d => Math.max(d.current || 0, d.previous || 0, d.target || 0)), 60);
  const domainMax = Math.ceil(maxVal / 10) * 10;

  return (
    <div>
      <div className="student-radar-wrap" role="img" aria-label="Skill radar chart comparing current, previous, and target scores across MET sections">
        <ResponsiveContainer width="100%" height={chartHeight}>
          {sectionData.length < 3 ? (
            <BarChart data={sectionData} margin={{ top: 8, right: 16, bottom: 8, left: -8 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" horizontal={false} />
              <XAxis type="number" domain={[0, domainMax]} tick={false} />
              <YAxis type="category" dataKey="skill" tick={{ fill: 'var(--text-2)', fontSize: 12, fontFamily: 'var(--font-sans)' }} width={60} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--text-2)', paddingTop: 8 }} />
              <Bar name="Current" dataKey="current" fill="var(--accent)" radius={[0, 3, 3, 0]} isAnimationActive animationDuration={1000} animationBegin={300} />
              {sectionData.some(d => d.previous != null) && (
                <Bar name="Previous" dataKey="previous" fill="var(--muted)" fillOpacity={0.5} radius={[0, 3, 3, 0]} isAnimationActive animationDuration={800} animationBegin={0} />
              )}
              <Bar name="Target" dataKey="target" fill="var(--primary)" fillOpacity={0.25} radius={[0, 3, 3, 0]} isAnimationActive animationDuration={900} animationBegin={150} />
            </BarChart>
          ) : (
            <RadarChart data={sectionData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="var(--divider)" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text-2)', fontSize: 12, fontFamily: 'var(--font-sans)' }} />
              <PolarRadiusAxis domain={[0, domainMax]} tick={false} />
              {sectionData.some(d => d.previous != null) && (
                <Radar name="Previous" dataKey="previous" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="5 5" fill="var(--muted)" fillOpacity={0.22} isAnimationActive animationDuration={900} animationBegin={0} />
              )}
              <Radar name="Current" dataKey="current" stroke="var(--accent)" strokeWidth={3} fill="var(--accent)" fillOpacity={0.38} isAnimationActive animationDuration={1200} animationBegin={600} />
              <Radar name="Target" dataKey="target" stroke="var(--primary)" strokeWidth={2} strokeDasharray="4 4" fill="none" isAnimationActive animationDuration={1000} animationBegin={300} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--text-2)', paddingTop: 8 }} />
              <Tooltip />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function StudentProgress({ student }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [legendOpen, setLegendOpen] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState(null);

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
  const lowestSkill = skills.length > 1
    ? [...skills].sort((a, b) => (Number(a.score_0_80) || 80) - (Number(b.score_0_80) || 80))[0]
    : null;

  const handleExpand = (section) => {
    setExpandedSkill(expandedSkill === section ? null : section);
  };

  return (
    <div className="student-progress-page">
      <section className="student-hero bg-grain fade-up">
        <div>
          <p className="student-hero-kicker">MET progress profile</p>
          <h1>Your MET progress path</h1>
        </div>
      </section>

      <div className="student-stage-legend">
        <button className="student-stage-legend-toggle" onClick={() => setLegendOpen(v => !v)} aria-expanded={legendOpen}>
          <span>What do the stages mean?</span>
          <span aria-hidden="true" className="text-2xs">{legendOpen ? '▲' : '▼'}</span>
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
        <div className="student-empty-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p>No approved diagnosis is ready yet. You can still start building useful evidence for your teacher.</p>
            <div className="student-todo-row"><span className="student-todo-check" /><span><strong>Complete the next assigned homework</strong><small>Homework gives your teacher review evidence</small></span></div>
            <div className="student-todo-row"><span className="student-todo-check" /><span><strong>Prepare one speaking sample</strong><small>45 seconds with one clear example</small></span></div>
            <div className="student-todo-row"><span className="student-todo-check" /><span><strong>Ask one MET question in class</strong><small>Use the Messages tab if you need help before class</small></span></div>
          </div>
        </div>
      ) : (
        <>
          {skills.length > 0 && (() => {
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
            return (
              <section className="student-panel student-panel--primary cursor-default mb-5">
                <div className="student-panel-head">
                  <div>
                    <span className="student-panel-kicker">Skill overview</span>
                    <h2>Radar comparison</h2>
                  </div>
                  <span className="student-pill">{skills.length} skill{skills.length !== 1 ? 's' : ''}</span>
                </div>
                <SubskillRadar sectionData={radarData} />
              </section>
            );
          })()}

          <section className="student-panel cursor-default mb-5">
            <div className="student-panel-head">
              <div>
                <span className="student-panel-kicker">Readiness Snapshot</span>
                <h2>Evaluated skills</h2>
              </div>
            </div>
            {skills.length > 0 ? (
              <div className="student-skill-list">
                {skills.map(skill => {
                  const skillTrend = getSkillTrend(skill.section, sorted);
                  const isExpanded = expandedSkill === skill.section;
                  return (
                    <div key={skill.section} className={`student-skill-detail${isExpanded ? ' is-open' : ''}`}>
                      <SkillRow skill={skill} trend={skillTrend} onClick={() => handleExpand(skill.section)} />
                      {isExpanded && (
                        <div className="student-skill-expanded">
                          <div className="student-skill-expanded-grid">
                            <div><strong>Current focus</strong><p>{skill.next_step || `Keep building more control in ${skill.section}.`}</p></div>
                            <div><strong>Last assessed</strong><p>{skillTrend?.evaluations > 1 ? `Based on ${skillTrend.evaluations} classes` : 'Based on your latest class'}.</p></div>
                          </div>
                          <div className="student-confidence-list">
                            {(() => {
                              const stage = getProgressStage(Number(skill.score_0_80) || 0);
                              return PROGRESS_STAGES.map((st, i) => (
                                <div key={st.label} className={`student-todo-row${stage.order >= st.order ? ' done' : ''}`}>
                                  <span className="student-todo-check">{stage.order >= st.order ? '✓' : ''}</span>
                                  <span>
                                    <strong>{['I understand the task', 'I can do it with support', 'I can do it independently', 'I can try mock practice', 'Ready for the MET'][i] || st.label}</strong>
                                    <small>{['Foundation', 'Building control', 'Consistency', 'Timed practice', 'Exam ready'][i] || ''}</small>
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="student-empty-card">No evaluated skills are ready to show yet. When a class evaluates speaking only, only speaking progress will appear here.</div>
            )}
          </section>

          {lowestSkill && lowestSkill.score_0_80 > 0 && (() => {
            const lowScore = Number(lowestSkill.score_0_80) || 0;
            return (
              <section className="sp-section-callout student-panel student-panel--clickable cursor-default">
                <div className="student-panel-head">
                  <div>
                    <span className="student-panel-kicker">Focus Area</span>
                    <h2>{lowestSkill.section.replace(/_/g, ' ')}</h2>
                  </div>
                </div>
                <p className="text-sm lh-1_6" style={{ color: 'var(--text)', margin: '8px 0 0' }}>
                  This skill needs the most attention. Focus on it in your next class or practice session.
                </p>
                {lowestSkill.next_step && (
                  <p className="text-sm lh-1_6" style={{ color: 'var(--text-2)', margin: '6px 0 0' }}>
                    <strong>Next step:</strong> {lowestSkill.next_step}
                  </p>
                )}
              </section>
            );
          })()}

          {sorted.length > 1 && (
            <section className="student-panel cursor-default">
              <div className="student-panel-head">
                <div><span className="student-panel-kicker">Compare by date</span><h2>Progress history</h2></div>
              </div>
              <div className="student-history-list">
                {sorted.map(dx => {
                  const snap = asArray(dx?.content?.section_snapshot).filter(s => s.evaluated || Number(s.score_0_80) > 0);
                  if (snap.length === 0) return null;
                  return (
                    <div key={dx.id} className="student-history-item items-start gap-4">
                      <span className="text-xs text-muted shrink-0" style={{ minWidth: 80, paddingTop: 3 }}>
                        {new Date(dx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="flex-col-gap2 flex-1">
                        {snap.map(s => {
                          const stage = getProgressStage(s.score_0_80);
                          return (
                            <div key={s.section} className="flex-row-gap3">
                              <span className="text-xs text-muted capitalize" style={{ minWidth: 88 }}>
                                {s.section.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs font-semibold" style={{ color: 'var(--text)', minWidth: 148 }}>
                                {stage.label}
                              </span>
                              <div className="flex gap-1" aria-label={`${stage.order} of 5 stages`}>
                                {PROGRESS_STAGES.map(st => (
                                  <div key={st.label} className="progress-dot"
                                    style={{ background: st.order <= stage.order ? 'var(--accent)' : 'var(--border)' }} />
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
