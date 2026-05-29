/**
 * homework-create.jsx — Generate homework from diagnosis and approve before assigning
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Button, Pill } from '../components/shared.jsx';
import { getDiagnoses, getStudent, saveHomework, updateClassEventStatus } from '../lib/workflow.js';

const TYPES = ['writing', 'speaking', 'grammar', 'vocabulary', 'reading', 'listening', 'mixed'];

export default function HomeworkCreate({ diagnosisId, studentId, students, onNavigate }) {
  const [diagnosis, setDiagnosis] = useState(null);
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [diagnosisId, studentId]);

  async function load() {
    const sid = studentId;
    if (sid) {
      const s = await getStudent(sid) || students.find(x => x.id === sid);
      setStudent(s);
    }
    if (diagnosisId) {
      const allDx = await getDiagnoses(sid);
      const dx = allDx.find(d => d.id === diagnosisId);
      setDiagnosis(dx);
      if (dx) populateFromDiagnosis(dx, students.find(x => x.id === sid));
    }
  }

  function populateFromDiagnosis(dx, s) {
    const hwRec = dx.sections?.homeworkRecommendation?.content;
    const priority = dx.sections?.priorityDiagnosis?.content?.[0];
    const title = hwRec?.title || (priority ? `${s?.firstName || 'Student'} — ${priority.area}` : 'Homework from Diagnosis');
    const description = hwRec?.instructions || '';
    const tasks = Array.isArray(hwRec?.tasks) ? hwRec.tasks.map(t => typeof t === 'string' ? t : t.description || '') : [];
    const selfCheck = Array.isArray(hwRec?.selfCheck) ? hwRec.selfCheck : [];
    const type = hwRec?.expectedSubmissionType?.split('|')[0] || inferType(dx.sections?.priorityDiagnosis?.content);

    setForm({
      title,
      objective: hwRec?.objective || (priority ? priority.whatToImprove : ''),
      description,
      tasks: tasks.length > 0 ? tasks : [''],
      selfCheck: selfCheck.length > 0 ? selfCheck : [''],
      type,
      dueDate: '',
      submissionType: hwRec?.expectedSubmissionType || 'text',
      teacherNotes: '',
    });
  }

  function inferType(priorities) {
    const areas = (priorities || []).map(p => (p.area || '').toLowerCase());
    if (areas.some(a => /speak/.test(a))) return 'speaking';
    if (areas.some(a => /writ/.test(a))) return 'writing';
    if (areas.some(a => /vocab/.test(a))) return 'vocabulary';
    return 'grammar';
  }

  function addTask() { setForm(f => ({ ...f, tasks: [...f.tasks, ''] })); }
  function updateTask(i, v) { setForm(f => ({ ...f, tasks: f.tasks.map((t, idx) => idx === i ? v : t) })); }
  function removeTask(i) { setForm(f => ({ ...f, tasks: f.tasks.filter((_, idx) => idx !== i) })); }
  function addCheck() { setForm(f => ({ ...f, selfCheck: [...f.selfCheck, ''] })); }
  function updateCheck(i, v) { setForm(f => ({ ...f, selfCheck: f.selfCheck.map((t, idx) => idx === i ? v : t) })); }

  async function handleAssign() {
    if (!form.title.trim()) { window.toast?.('Title is required.', 'warn'); return; }
    setSaving(true);
    const hw = await saveHomework({
      studentId,
      studentName: student?.name,
      diagnosisId,
      title: form.title,
      objective: form.objective,
      description: form.description,
      activities: form.tasks.filter(Boolean).map(t => ({ instruction: t, type: form.type })),
      selfCheck: form.selfCheck.filter(Boolean),
      type: form.type,
      dueDate: form.dueDate,
      submissionType: form.submissionType,
      teacherNotes: form.teacherNotes,
      status: 'not-started',
    });
    // Update class event homework status if known
    if (diagnosis?.classEventId) {
      await updateClassEventStatus(diagnosis.classEventId, { homeworkStatus: 'assigned' });
    }
    setSaving(false);
    window.toast?.('Homework assigned to student!', 'ok');
    onNavigate('homework');
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 20px' }}>
      <button onClick={() => onNavigate('homework')} style={backStyle}><Icon.arrowL size={13} /> Back</button>

      <h1 style={S.headline}>Create Homework</h1>
      {student && <p style={S.sub}>{student.name} · from diagnosis {diagnosis ? new Date(diagnosis.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</p>}

      {/* Diagnosis summary */}
      {diagnosis?.sections?.priorityDiagnosis?.content?.[0] && (
        <div style={{ marginTop: 16, marginBottom: 20, padding: 14, background: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-soft)' }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--accent-deep)', marginBottom: 4 }}>Diagnosis Priority (informs homework):</div>
          <div style={{ fontSize: 'var(--text-sm)' }}>{diagnosis.sections.priorityDiagnosis.content[0].area} — {diagnosis.sections.priorityDiagnosis.content[0].whatToImprove}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Button variant={!preview ? 'primary' : 'ghost'} size="sm" onClick={() => setPreview(false)}>Edit</Button>
        <Button variant={preview ? 'primary' : 'ghost'} size="sm" onClick={() => setPreview(true)}>Preview as Student</Button>
      </div>

      {preview ? (
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', marginBottom: 8 }}>{form.title}</div>
          {form.objective && <p style={{ color: 'var(--text-2)', marginBottom: 12 }}><strong>Objective:</strong> {form.objective}</p>}
          {form.description && <p style={{ lineHeight: 1.7, marginBottom: 12 }}>{form.description}</p>}
          {form.tasks.filter(Boolean).length > 0 && (
            <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              {form.tasks.filter(Boolean).map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          )}
          {form.selfCheck.filter(Boolean).length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Self-check:</div>
              {form.selfCheck.filter(Boolean).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <input type="checkbox" disabled style={{ marginTop: 3 }} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>{c}</span>
                </div>
              ))}
            </div>
          )}
          {form.dueDate && <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginTop: 12 }}>Due: {new Date(form.dueDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 18 }}>
            <SectionHeader title="Homework Details" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              <Field label="Title">
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </Field>
              <Field label="Objective (internal)">
                <input className="input" value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="What this homework targets..." />
              </Field>
              <Field label="Instructions for student">
                <textarea className="input" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Type">
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Submission type">
                  <select className="input" value={form.submissionType} onChange={e => setForm(f => ({ ...f, submissionType: e.target.value }))}>
                    {['text', 'audio', 'file', 'mixed'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Due date">
                  <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </Field>
              </div>
            </div>
          </Card>

          <Card style={{ padding: 18 }}>
            <SectionHeader title="Tasks" action={<Button variant="ghost" size="sm" onClick={addTask}><Icon.plus size={12} /> Add task</Button>} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {form.tasks.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ paddingTop: 10, fontSize: 'var(--text-xs)', color: 'var(--muted)', width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}.</span>
                  <textarea className="input" rows={2} value={t} onChange={e => updateTask(i, e.target.value)} placeholder={`Task ${i + 1}…`} style={{ flex: 1 }} />
                  {form.tasks.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeTask(i)} style={{ color: 'var(--danger)', marginTop: 6 }}><Icon.trash size={12} /></Button>}
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: 18 }}>
            <SectionHeader title="Self-check Checklist" action={<Button variant="ghost" size="sm" onClick={addCheck}><Icon.plus size={12} /> Add item</Button>} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {form.selfCheck.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="input" value={c} onChange={e => updateCheck(i, e.target.value)} placeholder="e.g. I used past simple correctly" style={{ flex: 1 }} />
                  {form.selfCheck.length > 1 && <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, selfCheck: f.selfCheck.filter((_, idx) => idx !== i) }))} style={{ color: 'var(--danger)' }}><Icon.trash size={12} /></Button>}
                </div>
              ))}
            </div>
          </Card>

          <Field label="Teacher notes (not shown to student)">
            <textarea className="input" rows={2} value={form.teacherNotes} onChange={e => setForm(f => ({ ...f, teacherNotes: e.target.value }))} placeholder="Internal notes…" />
          </Field>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Button variant="primary" onClick={handleAssign} disabled={saving}>{saving ? 'Assigning…' : 'Approve & Assign to Student'}</Button>
        <Button variant="ghost" onClick={() => onNavigate('homework')}>Cancel</Button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {children}
    </label>
  );
}

const EMPTY_FORM = { title: '', objective: '', description: '', tasks: [''], selfCheck: [''], type: 'grammar', dueDate: '', submissionType: 'text', teacherNotes: '' };
const backStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, padding: 0, fontFamily: 'var(--font-ui)' };
const S = { headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: '0 0 4px' }, sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)' } };
