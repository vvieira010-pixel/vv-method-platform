import { useState, useEffect } from 'react';
import { Icon, SectionHeader, Pill, Avatar } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { getHomework, deleteHomework } from '../lib/workflow.js';
import { printHomework } from '../lib/print-homework.js';

const STATUS_TONE = { 'not-started': 'muted', 'in-progress': 'info', submitted: 'warning', corrected: 'success', reviewed: 'success', completed: 'success' };
const KIND_ORDER = ['grammar', 'vocabulary', 'reading', 'listening', 'speaking', ''];
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', ''];

function normalizeKind(value) {
  const v = String(value || '').toLowerCase();
  if (!v) return '';
  if (v.includes('gram')) return 'grammar';
  if (v.includes('vocab')) return 'vocabulary';
  if (v.includes('read')) return 'reading';
  if (v.includes('listen')) return 'listening';
  if (v.includes('speak')) return 'speaking';
  return v;
}

function normalizeLevel(value) {
  const v = String(value || '').toUpperCase();
  return LEVEL_ORDER.includes(v) ? v : '';
}

function rankValue(value, order) {
  const idx = order.indexOf(value);
  return idx >= 0 ? idx : order.length;
}

export default function HomeworkPage({ students, onNavigate }) {
  const [homework, setHomework] = useState([]);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterKind, setFilterKind] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { (async () => { setHomework((await getHomework()) || []); })(); }, []);
  async function handleDelete(id) {
    if (!confirm('Delete this homework assignment?')) return;
    try {
      await deleteHomework(id);
      setHomework(prev => prev.filter(h => h.id !== id));
      window.toast?.('Homework deleted.', 'ok');
    } catch (e) {
      window.toast?.(`Delete failed: ${e.message}`, 'error');
    }
  }

  const sorted = [...homework].sort((a, b) => {
    const kindDiff = rankValue(normalizeKind(a.kind || a.skillType || a.type), KIND_ORDER)
      - rankValue(normalizeKind(b.kind || b.skillType || b.type), KIND_ORDER);
    if (kindDiff) return kindDiff;
    const levelDiff = rankValue(normalizeLevel(a.level || a.currentLevel), LEVEL_ORDER)
      - rankValue(normalizeLevel(b.level || b.currentLevel), LEVEL_ORDER);
    if (levelDiff) return levelDiff;
    return new Date(b.assignedAt || b.createdAt || 0) - new Date(a.assignedAt || a.createdAt || 0);
  });

  const filtered = sorted.filter(h => {
    if (filterStudent && h.studentId !== filterStudent) return false;
    if (filterKind && normalizeKind(h.kind || h.skillType || h.type) !== filterKind) return false;
    if (filterLevel && normalizeLevel(h.level || h.currentLevel) !== filterLevel) return false;
    if (filterStatus && h.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="page-shell">
      <SectionHeader
        title="Homework"
        sub={`${homework.length} total · ${homework.filter(h => h.status === 'submitted').length} submitted`}
        action={<Button variant="primary" onClick={() => onNavigate('homework:create', {})}><Icon.plus size={14} /> Create Homework</Button>}
      />

      <div className="page-filters">
        <select className="input page-filter-select" value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
          <option value="">All students</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input page-filter-select" value={filterKind} onChange={e => setFilterKind(e.target.value)}>
          <option value="">All kinds</option>
          {KIND_ORDER.filter(k => k).map(kind => <option key={kind} value={kind}>{kind.charAt(0).toUpperCase() + kind.slice(1)}</option>)}
        </select>
        <select className="input page-filter-select" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
          <option value="">All levels</option>
          {LEVEL_ORDER.filter(Boolean).map(level => <option key={level} value={level}>{level}</option>)}
        </select>
        <select className="input page-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {[['not-started','Not started'],['in-progress','In progress'],['submitted','Submitted'],['reviewed','Reviewed']].map(([val,label]) => <option key={val} value={val}>{label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="page-empty-state">
          <p style={{ color: 'var(--muted)' }}>No homework assigned yet. Start from a student's approved diagnosis.</p>
        </Card>
      ) : (
        <div className="grid-square">
          {filtered.map(h => {
            const student = students.find(s => s.id === h.studentId);
            const kind = normalizeKind(h.kind || h.skillType || h.type);
            const level = normalizeLevel(h.level || h.currentLevel);
            return (
              <Card key={h.id} className="square-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                  <Avatar name={student?.name || '?'} size={24} />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{student?.name || 'Student'}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center', marginBottom: 4 }}>
                  {h.title || 'Untitled Homework'}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textAlign: 'center', marginBottom: 8 }}>
                  {kind} · {level}
                </div>
                <Pill tone={STATUS_TONE[h.status] || 'muted'} style={{ marginBottom: 12 }}>
                  {h.status === 'not-started' ? 'Not started' : h.status === 'in-progress' ? 'In progress' : h.status === 'submitted' ? 'Submitted' : h.status === 'reviewed' ? 'Reviewed' : h.status}
                </Pill>
                <div style={{ marginTop: 'auto', width: '100%', display: 'flex', gap: 4, justifyContent: 'center' }}>
                  <Button variant="primary" size="sm" onClick={() => onNavigate('submissions:review', { submissionId: h.submissionId })}>
                    {h.status === 'submitted' ? 'Review' : 'View'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(h.id)} style={{ color: 'var(--danger)' }}>
                    <Icon.trash size={13} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
