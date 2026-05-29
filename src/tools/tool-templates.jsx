/**
 * tool-templates.jsx — Resource library / lesson template browser
 */
import { useEffect, useState } from 'react';
import { Card, SectionHeader, Pill, Button, Icon } from '../components/shared.jsx';
import { saveHomework, savePracticeAssignment, getHomework, getPracticeAssignments, deleteHomework, deletePracticeAssignment } from '../lib/workflow.js';

const TEMPLATES = [
  { id: 't1', title: 'MET Speaking Task 1–3', category: 'Speaking', level: 'B1', desc: 'Timed response practice for short-answer and personal opinion tasks.', tags: ['timed','speaking','task1','task2','task3'] },
  { id: 't2', title: 'MET Speaking Task 4–5', category: 'Speaking', level: 'B1+', desc: 'Extended response prompts — describe, compare, recommend.', tags: ['speaking','task4','task5','extended'] },
  { id: 't3', title: 'Grammar: Past Perfect', category: 'Grammar', level: 'B1', desc: 'Correction table + model sentences for past perfect vs simple past.', tags: ['grammar','past','perfect','tense'] },
  { id: 't4', title: 'Grammar: Articles A/An/The', category: 'Grammar', level: 'A2', desc: 'Usage rules with gap-fill and correction exercises.', tags: ['grammar','articles','a2'] },
  { id: 't5', title: 'Vocabulary: Academic Register', category: 'Vocabulary', level: 'B2', desc: '30 high-frequency academic words with collocations and examples.', tags: ['vocabulary','academic','B2'] },
  { id: 't6', title: 'MET Writing Task 1', category: 'Writing', level: 'B1+', desc: 'Email/letter format guide with model answer and common errors.', tags: ['writing','email','task1','format'] },
  { id: 't7', title: 'MET Writing Task 2', category: 'Writing', level: 'B2', desc: 'Essay structure: intro, argument paragraphs, conclusion.', tags: ['writing','essay','task2','structure'] },
  { id: 't8', title: 'Listening: Accent Flexibility', category: 'Listening', level: 'B1', desc: 'Drill for recognizing different English accents in context.', tags: ['listening','accent','comprehension'] },
  { id: 't9', title: 'Pronunciation: Word Stress', category: 'Speaking', level: 'B1', desc: 'Minimal pairs and stress patterns for Brazilian learners.', tags: ['pronunciation','stress','speaking'] },
  { id: 't10', title: 'Reading: Inference Questions', category: 'Reading', level: 'B2', desc: 'Strategy for answering implicit-meaning questions in MET.', tags: ['reading','inference','strategy'] },
];

const CATS = ['All', 'Speaking', 'Grammar', 'Vocabulary', 'Writing', 'Listening', 'Reading'];
const CAT_TONE = { Speaking:'accent', Grammar:'info', Vocabulary:'success', Writing:'warning', Listening:'muted', Reading:'default' };

export default function ToolTemplates({ students = [], selectedStudent, onSelectStudent }) {
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedHomework, setAssignedHomework] = useState([]);
  const [assignedPractice, setAssignedPractice] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', desc: '', category: '', level: '', tags: '' });
  const [customTemplates, setCustomTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vv_custom_templates') || '[]'); } catch { return []; }
  });
  const loadAssigned = async () => {
    if (!selectedStudent?.id) {
      setAssignedHomework([]);
      setAssignedPractice([]);
      return;
    }
    const [hw, practice] = await Promise.all([
      getHomework(selectedStudent.id),
      getPracticeAssignments(selectedStudent.id),
    ]);
    setAssignedHomework(hw || []);
    setAssignedPractice(practice || []);
  };

  useEffect(() => {
    loadAssigned();
  }, [selectedStudent?.id]);

  const allTemplates = [...TEMPLATES.map(t => {
    const custom = customTemplates.find(c => c.id === t.id);
    return custom ? { ...t, ...custom } : t;
  }), ...customTemplates.filter(c => !TEMPLATES.find(t => t.id === c.id))];

  const visible = allTemplates.filter(t => {
    const matchCat = cat === 'All' || t.category === cat;
    const q = search.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || (t.tags || []).some(g => g.includes(q));
    return matchCat && matchSearch;
  });

  const startEdit = (resource) => {
    setEditingItem(resource);
    setEditForm({
      title: resource.title,
      desc: resource.desc,
      category: resource.category,
      level: resource.level,
      tags: (resource.tags || []).join(', '),
    });
  };

  const saveEdit = () => {
    if (!editingItem) return;
    const updated = {
      id: editingItem.id,
      title: editForm.title,
      desc: editForm.desc,
      category: editForm.category,
      level: editForm.level,
      tags: editForm.tags.split(',').map(s => s.trim()).filter(Boolean),
    };
    const newCustom = customTemplates.filter(c => c.id !== editingItem.id);
    newCustom.push(updated);
    setCustomTemplates(newCustom);
    localStorage.setItem('vv_custom_templates', JSON.stringify(newCustom));
    setEditingItem(null);
    window.toast?.('Resource updated.', 'ok');
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  const assignHomework = async (resource) => {
    if (!selectedStudent?.id) return;
    await saveHomework({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      diagnosisId: null,
      resourceIds: [resource.id],
      title: resource.title,
      description: instructions || resource.desc,
      instructions: instructions || resource.desc,
      type: resource.category.toLowerCase(),
      dueDate,
      exercises: 1,
      activities: [{ type: resource.category, instruction: instructions || resource.desc, resourceId: resource.id }],
      status: 'not-started',
    });
    await loadAssigned();
    window.toast?.('Resource assigned as homework.', 'ok');
  };

  const assignPractice = async (resource) => {
    if (!selectedStudent?.id) return;
    await savePracticeAssignment({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      diagnosisId: null,
      resourceIds: [resource.id],
      title: resource.title,
      skillFocus: resource.category,
      instructions: instructions || resource.desc,
      required: false,
      status: 'assigned',
    });
    await loadAssigned();
    window.toast?.('Resource assigned to Practice Studio.', 'ok');
  };

  const unassignLatest = async (resourceId) => {
    const latestHw = assignedHomework.find((h) => h.resourceIds?.includes(resourceId));
    const latestPractice = assignedPractice.find((p) => p.resourceIds?.includes(resourceId));
    if (!latestHw && !latestPractice) {
      window.toast?.('Nothing to unassign for this student.', 'info');
      return;
    }
    if (latestHw) await deleteHomework(latestHw.id);
    if (latestPractice) await deletePracticeAssignment(latestPractice.id);
    await loadAssigned();
    window.toast?.('Unassigned from this student.', 'ok');
  };

  return (
    <div className="page-shell">
      <div className="page-inner">
        <SectionHeader title="Resource Library" sub="Lesson templates, rubrics, and practice material" />

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 12 }}>
            <label style={fieldLabel}>Assign to student
              <select className="input" value={selectedStudent?.id || ''} onChange={e => { onSelectStudent?.(e.target.value); setTimeout(loadAssigned, 0); }} style={{ marginTop: 6 }}>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label style={fieldLabel}>Due date for homework
              <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ marginTop: 6 }} />
            </label>
            <label style={fieldLabel}>Assignment instructions
              <input className="input" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Optional student instructions..." style={{ marginTop: 6 }} />
            </label>
          </div>
        </Card>

        {preview && (
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader title={preview.title} sub={`${preview.category} · ${preview.level}`} />
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, margin: '8px 0 0' }}>{preview.desc}</p>
          </Card>
        )}

        {editingItem && (
          <Card style={{ marginBottom: 16, border: '2px solid var(--primary)' }}>
            <SectionHeader title="Edit Resource" sub={`Editing: ${editingItem.title}`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <label style={fieldLabel}>Title
                <input className="input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} style={{ marginTop: 6 }} />
              </label>
              <label style={fieldLabel}>Category
                <select className="input" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ marginTop: 6 }}>
                  {CATS.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label style={fieldLabel}>Level
                <input className="input" value={editForm.level} onChange={e => setEditForm(f => ({ ...f, level: e.target.value }))} style={{ marginTop: 6 }} />
              </label>
              <label style={fieldLabel}>Tags (comma-separated)
                <input className="input" value={editForm.tags} onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))} style={{ marginTop: 6 }} />
              </label>
            </div>
            <label style={{ ...fieldLabel, marginTop: 12 }}>Description
              <textarea className="input textarea" rows={3} value={editForm.desc} onChange={e => setEditForm(f => ({ ...f, desc: e.target.value }))} style={{ marginTop: 6 }} />
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Button variant="primary" size="sm" onClick={saveEdit}>Save Changes</Button>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" placeholder="Search templates…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 240 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATS.map(c => (
              <button key={c}
                onClick={() => setCat(c)}
                style={{
                  padding: '5px 13px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: cat === c ? 'var(--accent)' : 'var(--divider)',
                  color: cat === c ? '#fff' : 'var(--text-2)',
                  fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {visible.map(t => (
            <Card key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Pill tone={CAT_TONE[t.category] || 'default'}>{t.category}</Pill>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{t.level}</span>
              </div>
              <div onClick={() => setPreview(t)} style={{ fontWeight: 700, fontSize: 14, textDecoration: 'underline' }}>{t.title}</div>
              <div onClick={() => setPreview(t)} style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, flex: 1 }}>{t.desc}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {t.tags.slice(0, 3).map(tag => (
                  <span key={tag} style={{ fontSize: 11, background: 'var(--divider)', color: 'var(--muted)', padding: '2px 7px', borderRadius: 999 }}>#{tag}</span>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); assignHomework(t); }} disabled={!selectedStudent?.id}>Assign as Homework</Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); assignPractice(t); }} disabled={!selectedStudent?.id}>Assign to Practice Studio</Button>
                <Button variant="quiet" size="sm" onClick={(e) => { e.stopPropagation(); setPreview(t); }}>Preview Resource</Button>
                <Button variant="quiet" size="sm" onClick={(e) => { e.stopPropagation(); unassignLatest(t.id); }} disabled={!selectedStudent?.id}>Unassign</Button>
                <Button variant="quiet" size="sm" onClick={(e) => { e.stopPropagation(); startEdit(t); }}>Edit Resource</Button>
              </div>
            </Card>
          ))}
          {visible.length === 0 && (
            <div style={{ gridColumn: '1/-1', color: 'var(--muted)', fontSize: 14, padding: '24px 0' }}>No templates match.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const fieldLabel = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
