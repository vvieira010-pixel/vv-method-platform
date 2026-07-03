/**
 * calendar.jsx — Class scheduling and calendar view
 */
import { useState, useEffect } from 'react';
import { Icon, SectionHeader, Pill, Avatar } from '../components/shared.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { getClassEvents, saveClassEvent, deleteClassEvent, updateClassEventStatus } from '../lib/workflow.js';
import { sendClassInvite, getZoomUrl } from '../lib/send-invite.js';
import { MET_SKILLS } from '../lib/report-metrics.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_TONE = { scheduled: 'info', completed: 'success', canceled: 'danger' };
export default function CalendarPage({ students, onNavigate }) {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ev = await getClassEvents();
        setEvents(ev);
      } catch (e) {
        window.toast?.(`Failed to load calendar: ${e.message}`, 'warn');
      }
    })();
  }, []);

  function openSchedule(date) {
    setForm({ ...EMPTY_FORM, date: date || new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.studentId) { window.toast?.('Select a student.', 'warn'); return; }
    if (!form.date) { window.toast?.('Set a date.', 'warn'); return; }
    setSaving(true);
    try {
      await saveClassEvent(form);
      await load();
      setShowForm(false);
      window.toast?.('Class scheduled.', 'ok');
    } catch (e) {
      window.toast?.(`Failed to save: ${e.message}`, 'warn');
    }
    setSaving(false);
  }

  async function handleMarkComplete(ev) {
    await updateClassEventStatus(ev.id, { status: 'completed' });
    await load();
    window.toast?.('Marked as completed.', 'ok');
  }

  async function handleDelete(ev) {
    if (!confirm('Delete this class event?')) return;
    await deleteClassEvent(ev.id);
    await load();
  }

  async function handleSendInvite(ev) {
    const zoomUrl = getZoomUrl();
    if (!zoomUrl) {
      window.toast?.('Add your Zoom link in Settings → Class Video Link first.', 'warn');
      onNavigate?.('settings');
      return;
    }
    const student = students.find(s => s.id === ev.studentId);
    if (!student?.email) {
      window.toast?.(`No email on file for ${student?.firstName || 'this student'}.`, 'warn');
      return;
    }
    window.toast?.(`Sending invite to ${student.firstName}…`, 'info');
    try {
      await sendClassInvite({
        to: student.email,
        studentName: student.name,
        teacherName: localStorage.getItem('vv:teacher_name') || '',
        title: ev.title,
        date: ev.date,
        startTime: ev.startTime || '',
        endTime: ev.endTime || '',
        zoomUrl,
        classFocus: ev.classFocus || '',
        timezone: ev.timezone || student.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      window.toast?.(`Invite emailed to ${student.firstName}.`, 'ok');
    } catch (e) {
      window.toast?.(`Invite failed: ${e.message}`, 'warn');
    }
  }

  // Calendar grid
  const { year, month } = viewMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  function dateStr(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const eventsByDate = {};
  events.forEach(ev => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];
  const allUpcoming = events.filter(e => e.date >= today && e.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date));
  const needsDiagnosis = events.filter(e => e.status === 'completed' && e.diagnosticStatus === 'not-started');

  return (
    <div className="page-container page-container--sm">
      <div className="flex flex-between items-start mb-6">
        <div>
          <h1 className="page-headline">Calendar</h1>
          <p className="page-sub">{allUpcoming.length} upcoming · {needsDiagnosis.length} need diagnosis</p>
        </div>
        <Button variant="primary" onClick={() => openSchedule(today)}><Icon.plus size={14} /> Schedule Class</Button>
      </div>

      {/* Schedule form */}
      {showForm && (
        <Card style={{ marginBottom: 20, padding: 20, border: '2px solid var(--accent)' }}>
          <SectionHeader title="Schedule Class" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            <Field label="Student *">
              <select className="input" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
                <option value="">Select student…</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Date *">
              <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </Field>
            <Field label="Start time">
              <input className="input" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </Field>
            <Field label="End time">
              <input className="input" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </Field>
            <Field label="Timezone">
              <select className="input" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
                <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                <option value="America/New_York">New York (EST/EDT)</option>
                <option value="America/Chicago">Chicago (CST/CDT)</option>
                <option value="America/Denver">Denver (MST/MDT)</option>
                <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="Europe/Lisbon">Lisbon (WET/WEST)</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
            <Field label="Class title">
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Speaking Practice #3" />
            </Field>
            <Field label="Class focus">
              <input className="input" value={form.classFocus} onChange={e => setForm(f => ({ ...f, classFocus: e.target.value }))} placeholder="e.g. Past simple retelling" />
            </Field>
            <Field label="MET skill focus">
              <select className="input" value={form.metSkillFocus} onChange={e => setForm(f => ({ ...f, metSkillFocus: e.target.value }))}>
                <option value="">Select skill…</option>
                {[...MET_SKILLS, 'Mixed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Schedule Class'}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid-2fr-1fr">
        {/* Calendar grid */}
        <div>
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Button variant="ghost" size="sm" aria-label="Previous month" onClick={() => setViewMonth(v => { const d = new Date(v.year, v.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })}><span aria-hidden="true"><Icon.chevronLeft size={14} /></span></Button>
              <span style={{ fontWeight: 700, flex: 1, textAlign: 'center' }}>
                {new Date(year, month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="ghost" size="sm" aria-label="Next month" onClick={() => setViewMonth(v => { const d = new Date(v.year, v.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })}><span aria-hidden="true"><Icon.chevronRight size={14} /></span></Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', padding: '4px 0' }}>{d}</div>)}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const ds = dateStr(d);
                const dayEvents = eventsByDate[ds] || [];
                const isToday = ds === today;
                const isSelected = ds === selectedDate;
                return (
                  <button key={d} onClick={() => setSelectedDate(isSelected ? null : ds)}
                    aria-label={`${new Date(year, month, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}${isSelected ? ', selected' : ''}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''}`}
                    aria-pressed={isSelected}
                    style={{ padding: '6px 4px', borderRadius: 'var(--radius-sm)', border: isSelected ? '2px solid var(--accent)' : isToday ? '2px solid var(--primary)' : '1px solid transparent', background: isSelected ? 'var(--accent-subtle)' : 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--accent)' : 'var(--text)', position: 'relative', minHeight: 44 }}>
                    {d}
                    {dayEvents.length > 0 && <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }} aria-hidden="true">
                      {dayEvents.slice(0, 3).map((ev, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: ev.status === 'completed' ? 'var(--success)' : ev.status === 'canceled' ? 'var(--danger)' : 'var(--primary)' }} />)}
                    </div>}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Selected day events */}
          {selectedDate && (
            <Card style={{ marginTop: 12, padding: 16 }}>
              <SectionHeader title={new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} action={<Button variant="ghost" size="sm" onClick={() => openSchedule(selectedDate)}>+ Add class</Button>} />
              {selectedEvents.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginTop: 8 }}>No classes on this day.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {selectedEvents.map(ev => <EventCard key={ev.id} ev={ev} students={students} onNavigate={onNavigate} onMarkComplete={handleMarkComplete} onDelete={handleDelete} onSendInvite={handleSendInvite} />)}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Needs diagnosis */}
          {needsDiagnosis.length > 0 && (
            <Card style={{ padding: 14, background: 'var(--warning-bg)', border: '1px solid var(--warning-soft)' }}>
              <SectionHeader title={`Needs Diagnosis (${needsDiagnosis.length})`} icon={<Icon.warning size={14} />} />
              {needsDiagnosis.map(ev => {
                const student = students.find(s => s.id === ev.studentId);
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--divider)' }}>
                    <span style={{ flex: 1, fontSize: 'var(--text-xs)', fontWeight: 600 }}>{student?.firstName} · {ev.date}</span>
                    <Button variant="primary" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: ev.studentId, classEventId: ev.id })}>Go</Button>
                  </div>
                );
              })}
            </Card>
          )}

          {/* Upcoming */}
          <Card style={{ padding: 14 }}>
            <SectionHeader title="Upcoming Classes" />
            {allUpcoming.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginTop: 8 }}>None scheduled.</p>
              : allUpcoming.slice(0, 6).map(ev => {
                const student = students.find(s => s.id === ev.studentId);
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--divider)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{student?.firstName}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{ev.date} · {ev.startTime ? `${ev.startTime} ${ev.timezone || 'BRT'}` : '—'}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar:class', { classEventId: ev.id })}>Open</Button>
                  </div>
                );
              })}
          </Card>
        </div>
      </div>
    </div>
  );
}

function EventCard({ ev, students, onNavigate, onMarkComplete, onDelete, onSendInvite }) {
  const student = students.find(s => s.id === ev.studentId);
  return (
    <div style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <Avatar name={student?.name || '?'} size={28} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{student?.firstName} — {ev.title}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{ev.startTime ? `${ev.startTime} ${ev.timezone || 'BRT'}` : '—'} · {ev.classFocus || 'No focus'}</div>
      </div>
      <Pill tone={STATUS_TONE[ev.status] || 'muted'}>{ev.status}</Pill>
      {ev.status === 'scheduled' && onSendInvite && (
        <Button variant="ghost" size="sm" aria-label="Email Zoom invite" title="Email Zoom invite" onClick={() => onSendInvite(ev)}><Icon.send size={12} /> Invite</Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar:class', { classEventId: ev.id })}>Record</Button>
      {ev.status === 'scheduled' && <Button variant="ghost" size="sm" onClick={() => onMarkComplete(ev)}>Done</Button>}
      {ev.status === 'completed' && ev.diagnosticStatus === 'not-started' && (
        <Button variant="primary" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: ev.studentId, classEventId: ev.id })}>Diagnose</Button>
      )}
      <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(ev)}><Icon.trash size={12} /></Button>
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

const EMPTY_FORM = { studentId: '', date: '', startTime: '', endTime: '', title: 'English Class', classFocus: '', metSkillFocus: '', timezone: 'America/Sao_Paulo', status: 'scheduled', diagnosticStatus: 'not-started', homeworkStatus: 'not-generated' };


