/**
 * tool-portal.jsx — Student roster manager
 */
import { useState } from 'react';
import { Icon, Avatar, Card, SectionHeader, Pill, Button, ReviewStatusBadge } from '../components/shared.jsx';

const PAYMENT_TONE = { paid: 'success', pending: 'warning', overdue: 'danger' };
const STEP_TONE    = { diagnose: 'info', feedback: 'accent', homework: 'warning', completed: 'success' };

export default function ToolPortal({ students = [], selectedStudentId, onSelectStudent, onUpdateStudent, onBulkAssignPlan }) {
  const [search, setSearch] = useState('');
  const [filterTrack, setFilterTrack] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const tracks = ['all', ...new Set(students.map(s => s.track))];

  const visible = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    const matchTrack   = filterTrack === 'all'    || s.track === filterTrack;
    const matchPayment = filterPayment === 'all'  || s.payment === filterPayment;
    return matchSearch && matchTrack && matchPayment;
  });

  const selected = students.find(s => s.id === selectedStudentId) || students[0];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── List panel ── */}
      <div style={{ width: 340, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px 10px' }}>
          <SectionHeader title="Students" action={
            <Button variant="accent" size="sm" icon={<Icon.plus size={13} />}>Add</Button>
          } />
          <input className="input" placeholder="Search name or code…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <select className="input" value={filterTrack} onChange={e => setFilterTrack(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}>
              {tracks.map(t => <option key={t} value={t}>{t === 'all' ? 'All tracks' : t}</option>)}
            </select>
            <select className="input" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}>
              {['all','paid','pending','overdue'].map(p => <option key={p} value={p}>{p === 'all' ? 'All payment' : p}</option>)}
            </select>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
          {visible.map(s => (
            <button key={s.id}
              onClick={() => onSelectStudent(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 10px', borderRadius: 10, cursor: 'pointer',
                background: selectedStudentId === s.id ? 'var(--accent-subtle)' : 'transparent',
                border: selectedStudentId === s.id ? '1px solid var(--accent-soft)' : '1px solid transparent',
                textAlign: 'left', transition: 'background 0.12s, border-color 0.12s', fontFamily: 'var(--font-ui)',
              }}>
              <Avatar name={s.name} size={36} tone="auto" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', gap: 6, marginTop: 2 }}>
                  <span>{s.track}</span>
                  <span>·</span>
                  <span>S{s.session}/{s.totalSessions}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <Pill tone={PAYMENT_TONE[s.payment] || 'muted'}>{s.payment}</Pill>
              </div>
            </button>
          ))}
          {visible.length === 0 && (
            <div style={{ padding: '24px 12px', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>No students match.</div>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selected ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
            <Avatar name={selected.name} size={52} tone="auto" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{selected.name}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Pill tone="accent">{selected.track}</Pill>
                <Pill tone={PAYMENT_TONE[selected.payment] || 'muted'}>{selected.payment}</Pill>
                <Pill tone="default">Session {selected.session}/{selected.totalSessions}</Pill>
                <Pill tone={STEP_TONE[selected.currentStep] || 'muted'}>{selected.currentStep}</Pill>
              </div>
            </div>
            <Button variant="ghost" size="sm" icon={<Icon.edit size={13} />}>Edit</Button>
          </div>

          {/* Goal */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Goal</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 6 }}>{selected.goal}</div>
            {selected.goalNote && <div style={{ fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic' }}>{selected.goalNote}</div>}
          </Card>

          {/* Progress */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Progress</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Current Band', value: selected.currentBand || selected.band },
                { label: 'Target Band',  value: selected.targetBand  || selected.bandTarget },
                { label: 'Progress',     value: `${selected.progress}%` },
                { label: 'Total XP',     value: `${selected.totalXp} XP` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--bg-deep)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>Overall progress</div>
              <div style={{ height: 8, background: 'var(--bg-deep)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: 'var(--accent)', borderRadius: 999, transform: `scaleX(${(selected.progress || 0) / 100})`, transformOrigin: 'left', transition: 'transform 0.4s' }} />
              </div>
            </div>
          </Card>

          {/* Payment */}
          <Card>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Payment</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>R${selected.amount}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{selected.month}</div>
              </div>
              <Pill tone={PAYMENT_TONE[selected.payment] || 'muted'} style={{ fontSize: 13 }}>
                {selected.payment}
              </Pill>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Button variant="ghost" size="sm" onClick={() => onUpdateStudent(selected.id, { payment: 'paid' })}>Mark paid</Button>
              <Button variant="ghost" size="sm" onClick={() => onUpdateStudent(selected.id, { payment: 'pending' })}>Mark pending</Button>
            </div>
          </Card>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
          Select a student to view details.
        </div>
      )}
    </div>
  );
}
