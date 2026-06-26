import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getHomework, deleteHomework } from '../lib/workflow.js';
import { printHomework } from '../lib/print-homework.js';

const STATUS_TONE = { 'not-started': 'muted', 'in-progress': 'info', submitted: 'warning', corrected: 'success', reviewed: 'success', completed: 'success' };
const KIND_ORDER = ['grammar', 'vocabulary', 'reading', 'listening', 'speaking', 'mixed', ''];
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', ''];

function normalizeKind(value) {
  const v = String(value || '').toLowerCase();
  if (!v) return '';
  if (v.includes('gram')) return 'grammar';
  if (v.includes('vocab')) return 'vocabulary';
  if (v.includes('read')) return 'reading';
  if (v.includes('listen')) return 'listening';
  if (v.includes('speak')) return 'speaking';
  if (v.includes('mix')) return 'mixed';
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

  useEffect(() => { load(); }, []);
  async function load() { setHomework((await getHomework()) || []); }

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
        <select className="input" style={{ maxWidth: 200 }} value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
          <option value="">All students</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 180 }} value={filterKind} onChange={e => setFilterKind(e.target.value)}>
          <option value="">All kinds</option>
          {KIND_ORDER.filter(Boolean).map(kind => <option key={kind} value={kind}>{kind.charAt(0).toUpperCase() + kind.slice(1)}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 140 }} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
          <option value="">All levels</option>
          {LEVEL_ORDER.filter(Boolean).map(level => <option key={level} value={level}>{level}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 180 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {[['not-started','Not started'],['in-progress','In progress'],['submitted','Submitted'],['reviewed','Reviewed']].map(([val,label]) => <option key={val} value={val}>{label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="page-empty-state">
          <p style={{ color: 'var(--muted)' }}>No homework assigned yet. Start from a student's approved diagnosis.</p>
        </Card>
      ) : (
        <div className="page-list">
          {filtered.map(h => {
            const student = students.find(s => s.id === h.studentId);
            const kind = normalizeKind(h.kind || h.skillType || h.type);
            const level = normalizeLevel(h.level || h.currentLevel);
            return (
              <Card key={h.id}>
                <div className="card-row">
                  <Avatar name={student?.name || '?'} size={32} />
                  <div className="card-row-body">
                    <div className="card-row-title">{h.title}</div>
                    <div className="card-row-meta">
                      {student?.name} · {kind || 'kind'}{level ? ` · ${level}` : ''} · Assigned {new Date(h.assignedAt || h.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {h.dueDate ? ` · Due ${new Date(h.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                    </div>
                  </div>
                  <Pill tone={STATUS_TONE[h.status] || 'muted'}>{h.status}</Pill>
                  {kind && <Pill tone="info">{kind}</Pill>}
                  {level && <Pill tone="muted">{level}</Pill>}
                  {h.status === 'submitted' && (
                    <Button variant="primary" size="sm" onClick={() => onNavigate('submissions', {})}>Review</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => printHomework(h, { studentName: student?.name })} aria-label="Print homework">
                    <Icon.print size={12} />
                  </Button>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={async () => { if (confirm('Delete this homework?')) { await deleteHomework(h.id); load(); } }}>
                    <Icon.trash size={12} />
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