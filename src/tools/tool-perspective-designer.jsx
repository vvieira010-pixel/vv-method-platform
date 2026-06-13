import { useState } from 'react';
import { Icon, Card, SectionHeader, Button, Pill } from '../components/shared.jsx';
import { callAI } from '../components/shared.jsx';
import { parseAiJson } from '../lib/ai-helpers.js';

const PERSPECTIVE_SYSTEM_PROMPT = `You are an expert in social perspective-taking research, drawing specifically on Gehlbach's work on social perspective-taking processes, Batson's taxonomy of empathy phenomena, and Selman's developmental stages. Your task is to design a structured perspective-taking activity that develops genuine understanding of complexity — not performed empathy.

Use these rules:

1. DESIGN A FOUR-PHASE ACTIVITY SEQUENCE:
   - Phase 1 — Context-building: What do students need to know before attempting perspective-taking?
   - Phase 2 — Perspective identification: Whose perspectives are relevant and available?
   - Phase 3 — Perspective exploration: Structured inquiry into each perspective.
   - Phase 4 — Synthesis: What did students learn about complexity?

2. ANTI-PROJECTION GUARDRAILS — topic-specific, not generic.

3. DEVELOPMENTAL CALIBRATION based on Selman's stages.

4. SAFETY CHECK for sensitive topics.

5. ASSESSMENT CRITERIA focused on reasoning quality, not emotional performance.

Return valid JSON only with this shape:
{
  "title": "string — topic label",
  "epistemicStance": "string",
  "safetyCheck": {
    "perpetratorEmpathyRisk": "Yes/No — and how addressed",
    "livedExperienceInClass": "How to handle if yes",
    "perspectivesToExclude": "If any"
  },
  "developmentalCalibration": {
    "ageRange": "string",
    "selmanStage": "string",
    "adjustmentsMade": "string"
  },
  "activitySequence": {
    "phase1ContextBuilding": {
      "whatStudentsNeedToKnow": "string",
      "recommendedSources": "string",
      "timeEstimate": "string",
      "keyQuestion": "string"
    },
    "phase2PerspectiveIdentification": {
      "availablePerspectives": "string",
      "underdocumentedPerspectives": "string",
      "whatToAvoid": "string"
    },
    "phase3PerspectiveExploration": {
      "studentTask": "string",
      "guidingQuestions": ["string"],
      "evidenceRequirement": "string"
    },
    "phase4Synthesis": {
      "discussionPrompt": "string",
      "synthesisTask": "string"
    }
  },
  "antiProjectionGuardrails": ["string"],
  "assessmentCriteria": [
    { "criterion": "string", "strongEvidence": "string", "needsDevelopment": "string" }
  ]
}`;

export default function ToolPerspectiveDesigner({ student, students, onSelectStudent, onNavigate }) {
  const [form, setForm] = useState({
    subjectContext: '',
    learningGoal: '',
    ageRange: '',
    sensitivityNotes: '',
    priorKnowledge: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleGenerate() {
    if (!form.subjectContext.trim() || !form.learningGoal.trim()) {
      window.toast?.('Subject context and learning goal are required.', 'warn');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const prompt = [
        `Subject context: ${form.subjectContext}`,
        `Learning goal: ${form.learningGoal}`,
        form.ageRange ? `Age range: ${form.ageRange}` : '',
        form.sensitivityNotes ? `Sensitivity notes: ${form.sensitivityNotes}` : '',
        form.priorKnowledge ? `Prior knowledge: ${form.priorKnowledge}` : '',
      ].filter(Boolean).join('\n');
      const data = await callAI([
        { role: 'system', text: PERSPECTIVE_SYSTEM_PROMPT },
        { role: 'user', text: prompt },
      ], { max_tokens: 5000, temperature: 0.7 });
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = parseAiJson(raw);
      if (!parsed || !parsed.activitySequence) throw new Error('AI returned incomplete output.');
      setResult(parsed);
      window.toast?.('Perspective-taking activity designed successfully.', 'ok');
    } catch (e) {
      setError(e.message);
      window.toast?.(`Generation failed: ${e.message}`, 'warn');
    }
    setLoading(false);
  }

  function handleCopy() {
    const text = result ? JSON.stringify(result, null, 2) : '';
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => window.toast?.('Copied to clipboard.', 'ok')).catch(() => {});
  }

  function handleReset() {
    setResult(null);
    setError('');
  }

  const inputFilled = form.subjectContext.trim() && form.learningGoal.trim();

  return (
    <div className="page-shell">
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={headline}>Perspective-Taking Designer</h1>
        <p style={sub}>Design structured activities that develop genuine perspective-taking — understanding how others think, feel, and experience situations from within their own context and constraints.</p>

        {!result && (
          <Card style={{ padding: 20 }}>
            <SectionHeader title="Activity Inputs" sub="Describe the context and goal for your perspective-taking activity" />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={label}>
                <span style={labelText}>Subject Context *</span>
                <span style={hint}>The subject area, specific topic, year level, and the historical moment, stakeholder situation, or text being examined.</span>
                <textarea className="input" rows={4} value={form.subjectContext} onChange={e => set('subjectContext', e.target.value)} placeholder="e.g. Grade 10 History — Partition of India, 1947. Students have studied the lead-up to independence but not the human experience of partition." style={inputStyle} />
              </label>
              <label style={label}>
                <span style={labelText}>Learning Goal *</span>
                <span style={hint}>What perspective-taking should accomplish here. This shapes what counts as success.</span>
                <textarea className="input" rows={3} value={form.learningGoal} onChange={e => set('learningGoal', e.target.value)} placeholder="e.g. Students should understand how different communities experienced partition differently, and why their perspectives were shaped by geography, class, and religion." style={inputStyle} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={label}>
                  <span style={labelText}>Age Range</span>
                  <input className="input" value={form.ageRange} onChange={e => set('ageRange', e.target.value)} placeholder="e.g. 14-16" />
                </label>
                <label style={label}>
                  <span style={labelText}>Prior Knowledge</span>
                  <input className="input" value={form.priorKnowledge} onChange={e => set('priorKnowledge', e.target.value)} placeholder="e.g. Studied causes of WWI" />
                </label>
              </div>
              <label style={label}>
                <span style={labelText}>Sensitivity Notes</span>
                <span style={hint}>Cultural, political, or personal sensitivities — especially if any students have lived experience of the topic.</span>
                <textarea className="input" rows={2} value={form.sensitivityNotes} onChange={e => set('sensitivityNotes', e.target.value)} placeholder="e.g. Several students are from South Asian backgrounds with family stories from partition." style={inputStyle} />
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <Button variant="primary" onClick={handleGenerate} disabled={loading || !inputFilled}>
                  <Icon.spark size={13} /> {loading ? 'Designing...' : 'Design Activity'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {loading && (
          <Card style={{ padding: 20, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>Designing perspective-taking activity...</span>
            </div>
          </Card>
        )}

        {error && (
          <Card style={{ padding: 16, marginTop: 16, border: '1px solid var(--danger)' }}>
            <div style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>{error}</div>
          </Card>
        )}

        {result && !loading && (
          <>
            <Card style={{ padding: 20, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <div>
                  <SectionHeader title={result.title || 'Perspective-Taking Activity'} sub={result.epistemicStance} />
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Button variant="ghost" size="sm" onClick={handleCopy}><Icon.doc size={12} /> Copy JSON</Button>
                  <Button variant="ghost" size="sm" onClick={handleReset}><Icon.refresh size={12} /> New Activity</Button>
                </div>
              </div>

              {/* Safety Check */}
              {result.safetyCheck && (
                <div style={{ marginBottom: 20, padding: 14, background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning-soft)' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--warning-text)' }}>Safety Check</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--text-sm)' }}>
                    <div><strong>Perpetrator empathy risk:</strong> {result.safetyCheck.perpetratorEmpathyRisk}</div>
                    <div><strong>Lived experience in class:</strong> {result.safetyCheck.livedExperienceInClass}</div>
                    {result.safetyCheck.perspectivesToExclude && <div><strong>Perspectives to handle carefully:</strong> {result.safetyCheck.perspectivesToExclude}</div>}
                  </div>
                </div>
              )}

              {/* Developmental Calibration */}
              {result.developmentalCalibration && (
                <div style={{ marginBottom: 20, padding: 14, background: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-soft)' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Developmental Calibration</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 'var(--text-sm)' }}>
                    <Pill tone="info">{result.developmentalCalibration.ageRange}</Pill>
                    <Pill tone="accent">{result.developmentalCalibration.selmanStage}</Pill>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>{result.developmentalCalibration.adjustmentsMade}</div>
                </div>
              )}

              {/* Activity Sequence */}
              {result.activitySequence && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Activity Sequence</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {result.activitySequence.phase1ContextBuilding && (
                      <PhaseCard number={1} title="Context-Building" data={result.activitySequence.phase1ContextBuilding} fields={[
                        { label: 'What students need to know', key: 'whatStudentsNeedToKnow' },
                        { label: 'Recommended sources', key: 'recommendedSources' },
                        { label: 'Time estimate', key: 'timeEstimate' },
                        { label: 'Key question', key: 'keyQuestion' },
                      ]} />
                    )}
                    {result.activitySequence.phase2PerspectiveIdentification && (
                      <PhaseCard number={2} title="Perspective Identification" data={result.activitySequence.phase2PerspectiveIdentification} fields={[
                        { label: 'Available perspectives', key: 'availablePerspectives' },
                        { label: 'Underdocumented perspectives', key: 'underdocumentedPerspectives' },
                        { label: 'What to avoid', key: 'whatToAvoid' },
                      ]} />
                    )}
                    {result.activitySequence.phase3PerspectiveExploration && (
                      <PhaseCard number={3} title="Perspective Exploration" data={result.activitySequence.phase3PerspectiveExploration} fields={[
                        { label: 'Student task', key: 'studentTask' },
                        { label: 'Evidence requirement', key: 'evidenceRequirement' },
                      ]} extra={result.activitySequence.phase3PerspectiveExploration.guidingQuestions} />
                    )}
                    {result.activitySequence.phase4Synthesis && (
                      <PhaseCard number={4} title="Synthesis" data={result.activitySequence.phase4Synthesis} fields={[
                        { label: 'Discussion prompt', key: 'discussionPrompt' },
                        { label: 'Synthesis task', key: 'synthesisTask' },
                      ]} />
                    )}
                  </div>
                </div>
              )}

              {/* Anti-Projection Guardrails */}
              {result.antiProjectionGuardrails?.length > 0 && (
                <div style={{ marginBottom: 20, padding: 14, background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Anti-Projection Guardrails</div>
                  <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--text-sm)' }}>
                    {result.antiProjectionGuardrails.map((g, i) => <li key={i}>{g}</li>)}
                  </ol>
                </div>
              )}

              {/* Assessment Criteria */}
              {result.assessmentCriteria?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assessment Criteria</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                          <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 'var(--text-xs)' }}>Criterion</th>
                          <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', fontSize: 'var(--text-xs)' }}>Strong evidence</th>
                          <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', fontSize: 'var(--text-xs)' }}>Needs development</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.assessmentCriteria.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--divider)' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.criterion}</td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-2)' }}>{c.strongEvidence}</td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-2)' }}>{c.needsDevelopment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic', marginTop: 8 }}>
                    Emotional engagement is not an assessment criterion. Students who engage with careful reasoning and intellectual humility have succeeded.
                  </p>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
      <style>{SPIN_CSS}</style>
    </div>
  );
}

function PhaseCard({ number, title, data, fields, extra }) {
  return (
    <div style={{ padding: 14, background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{
          width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)',
          color: '#fff', display: 'grid', placeItems: 'center',
          fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0,
        }}>{number}</span>
        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Phase {number}: {title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {fields.map(f => data[f.key] ? (
          <div key={f.key}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</span>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-sm)', lineHeight: 1.55 }}>{data[f.key]}</p>
          </div>
        ) : null)}
        {extra?.length > 0 && (
          <div>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Guiding Questions</span>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {extra.map((q, i) => <li key={i} style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>{q}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const SPIN_CSS = `@keyframes spin { to { transform: rotate(360deg); } }`;
const headline = { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: '0 0 4px' };
const sub = { fontSize: 'var(--text-sm)', color: 'var(--muted)', marginBottom: 20, lineHeight: 1.55 };
const label = { display: 'flex', flexDirection: 'column', gap: 4 };
const labelText = { fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };
const hint = { fontSize: 'var(--text-xs)', color: 'var(--faint)', lineHeight: 1.4 };
const inputStyle = { resize: 'vertical' };
