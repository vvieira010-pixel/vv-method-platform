import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getHomework, deleteHomework } from '../lib/workflow.js';
import { printHomework } from '../lib/print-homework.js';

const STATUS_TONE = { 'not-started': 'muted', 'in-progress': 'info', submitted: 'warning', corrected: 'success', reviewed: 'success', completed: 'success' };

export default function HomeworkPage({ students, onNavigate }) {
  const [homework, setHomework] = useState([]);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { load(); }, []);
  async function load() { setHomework((await getHomework()) || []); }

  const filtered = homework.filter(h => {
    if (filterStudent && h.studentId !== filterStudent) return false;
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
            return (
              <Card key={h.id} style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Avatar name={student?.name || '?'} size={32} />
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700 }}>{h.title}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
                      {student?.name} · {h.type} · Assigned {new Date(h.assignedAt || h.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {h.dueDate ? ` · Due ${new Date(h.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                    </div>
                  </div>
                  <Pill tone={STATUS_TONE[h.status] || 'muted'}>{h.status}</Pill>
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

