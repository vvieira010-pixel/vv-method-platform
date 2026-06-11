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
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={S.headline}>Homework</h1>
          <p style={S.sub}>{homework.length} total · {homework.filter(h => h.status === 'submitted').length} submitted</p>
        </div>
        <Button variant="primary" onClick={() => onNavigate('homework:create', {})}><Icon.plus size={14} /> Create Homework</Button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select className="input" style={{ maxWidth: 200 }} value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
          <option value="">All students</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 180 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['not-started', 'in-progress', 'submitted', 'reviewed'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>No homework yet. Generate homework from an approved diagnosis.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

const S = {
  headline: { fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '4px 0 0' },
};

