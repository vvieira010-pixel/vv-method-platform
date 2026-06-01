/**
 * calendar.jsx — Class calendar and scheduling workspace
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getClassEvents, saveClassEvent, deleteClassEvent, updateClassEventStatus } from '../lib/workflow.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_TONE = { scheduled: 'info', completed: 'success', canceled: 'danger' };

export default function CalendarPage({ students, onNavigate, workspaceQuery = '' }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [saving, setSaving] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const list = await getClassEvents();
    setEvents(list || []);
    setLoading(false);
  }

  function openSchedule(date) {
    setForm({ ...EMPTY_FORM, date: date || new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.studentId) { window.toast?.('Select a student.', 'warn'); return; }
    if (!form.date) { window.toast?.('Set a date.', 'warn'); return; }
    setSaving(true);
    await saveClassEvent(form);
    await load();
    setSaving(false);
    setShowForm(false);
    window.toast?.('Class scheduled.', 'ok');
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
    window.toast?.('Class deleted.', 'info');
  }

  const { year, month } = viewMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  function dateStr(dayNumber) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
  }

  const eventsByDate = {};
  events.forEach((ev) => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  const searchQuery = (localSearch || workspaceQuery || '').trim().toLowerCase();
  const eventMatchesFilters = (ev) => {
    const student = students.find((s) => s.id === ev.studentId);
    const haystack = `${student?.name || ''} ${ev.title || ''} ${ev.classFocus || ''}`.toLowerCase();
    const queryMatch = !searchQuery || haystack.includes(searchQuery);
    const statusMatch = !statusFilter || ev.status === statusFilter;
    return queryMatch && statusMatch;
  };

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []).filter(eventMatchesFilters) : [];
  const upcomingEvents = events
    .filter((e) => e.date >= today && e.status === 'scheduled' && eventMatchesFilters(e))
    .sort((a, b) => `${a.date} ${a.startTime || ''}`.localeCompare(`${b.date} ${b.startTime || ''}`));
  const needsDiagnosis = events
    .filter((e) => e.status === 'completed' && e.diagnosticStatus === 'not-started' && eventMatchesFilters(e))
    .sort((a, b) => b.date.localeCompare(a.date));
  const completedCount = events.filter((e) => e.status === 'completed').length;

  return (
    <div style={S.shell}>
      <section style={S.hero}>
        <div>
          <div style={S.heroTag}>Class Repository</div>
          <h1 style={S.headline}>Calendar Workspace</h1>
          <p style={S.sub}>Schedule classes, complete records, and hand off sessions to diagnosis without losing flow.</p>
        </div>
        <Button variant="primary" onClick={() => openSchedule(today)}><Icon.plus size={14} /> Schedule Class</Button>
      </section>

      <div style={S.kpiGrid}>
        <RepoKpi label="Total classes" value={events.length} icon={<Icon.calendar size={15} />} />
        <RepoKpi label="Upcoming" value={upcomingEvents.length} icon={<Icon.spark size={15} />} />
        <RepoKpi label="Need diagnosis" value={needsDiagnosis.length} icon={<Icon.diagnose size={15} />} />
        <RepoKpi label="Completed" value={completedCount} icon={<Icon.check size={15} />} />
      </div>

      {showForm && (
        <Card style={{ marginBottom: 18, padding: 20, border: '2px solid var(--accent)' }}>
          <SectionHeader title="Schedule Class" />
          <div style={S.formGrid}>
            <Field label="Student *">
              <select className="input" value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}>
                <option value="">Select student...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Date *">
              <input className="input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
            <Field label="Start time">
              <input className="input" type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
            </Field>
            <Field label="End time">
              <input className="input" type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
            </Field>
            <Field label="Class title">
              <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Speaking practice #4" />
            </Field>
            <Field label="Class focus">
              <input className="input" value={form.classFocus} onChange={(e) => setForm((f) => ({ ...f, classFocus: e.target.value }))} placeholder="e.g. narrative cohesion" />
            </Field>
            <Field label="MET skill focus">
              <select className="input" value={form.metSkillFocus} onChange={(e) => setForm((f) => ({ ...f, metSkillFocus: e.target.value }))}>
                <option value="">Select skill...</option>
                {['Speaking', 'Writing', 'Reading', 'Listening', 'Grammar', 'Vocabulary', 'Mixed'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Schedule Class'}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={S.filterGrid}>
          <input className="input" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Filter by student, title, focus..." />
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Loading classes...</p>
        </Card>
      ) : (
      <div style={S.mainGrid}>
        <Card style={{ padding: 16 }}>
          <div style={S.calendarHead}>
            <Button variant="ghost" size="sm" onClick={() => setViewMonth((v) => {
              const d = new Date(v.year, v.month - 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })}>
              <Icon.arrowL size={12} />
            </Button>
            <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-deep)' }}>
              {new Date(year, month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </strong>
            <Button variant="ghost" size="sm" onClick={() => setViewMonth((v) => {
              const d = new Date(v.year, v.month + 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })}>
              <Icon.arrowR size={12} />
            </Button>
          </div>

          <div style={S.weekDays}>
            {DAYS.map((d) => <div key={d} style={S.weekDayCell}>{d}</div>)}
          </div>

          <div style={S.calendarGrid}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`pad-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNumber = i + 1;
              const ds = dateStr(dayNumber);
              const dayEvents = (eventsByDate[ds] || []).filter(eventMatchesFilters);
              const isToday = ds === today;
              const isSelected = ds === selectedDate;

              return (
                <button
                  key={ds}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : ds)}
                  style={{
                    ...S.dayButton,
                    border: isSelected ? '1.5px solid var(--accent)' : isToday ? '1.5px solid var(--accent-deep)' : '1px solid var(--divider)',
                    background: isSelected ? 'var(--accent-subtle)' : '#fff',
                  }}
                >
                  <span style={{ fontWeight: isToday ? 700 : 500 }}>{dayNumber}</span>
                  <span style={S.dotRow}>
                    {dayEvents.slice(0, 3).map((ev, dotIdx) => (
                      <span
                        key={`${ev.id}-${dotIdx}`}
                        style={{
                          ...S.dot,
                          background: ev.status === 'completed' ? 'var(--success)' : ev.status === 'canceled' ? 'var(--danger)' : 'var(--accent)',
                        }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div style={{ marginTop: 14 }}>
              <SectionHeader
                title={new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                action={<Button variant="ghost" size="sm" onClick={() => openSchedule(selectedDate)}><Icon.plus size={11} /> Add class</Button>}
              />
              {selectedEvents.length === 0 ? (
                <p style={S.empty}>No classes for this day with current filters.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {selectedEvents.map((ev) => (
                    <EventRow
                      key={ev.id}
                      ev={ev}
                      students={students}
                      onNavigate={onNavigate}
                      onMarkComplete={handleMarkComplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <div style={{ display: 'grid', gap: 12 }}>
          <Card style={{ padding: 14, border: needsDiagnosis.length ? '1px solid var(--warning-soft)' : '1px solid var(--border)' }}>
            <SectionHeader title={`Needs Diagnosis (${needsDiagnosis.length})`} icon={<Icon.warning size={14} />} />
            {needsDiagnosis.length === 0 ? (
              <p style={S.empty}>No completed classes waiting for diagnosis.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {needsDiagnosis.slice(0, 7).map((ev) => {
                  const student = students.find((s) => s.id === ev.studentId);
                  return (
                    <div key={ev.id} style={S.sideRow}>
                      <div style={{ minWidth: 0 }}>
                        <div style={S.rowTitle}>{student?.name || 'Unknown student'}</div>
                        <div style={S.rowSub}>{ev.date} · {ev.title || 'Class'}</div>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: ev.studentId, classEventId: ev.id })}>Diagnose</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card style={{ padding: 14 }}>
            <SectionHeader title={`Upcoming Queue (${upcomingEvents.length})`} icon={<Icon.calendar size={14} />} />
            {upcomingEvents.length === 0 ? (
              <p style={S.empty}>No upcoming classes with current filters.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {upcomingEvents.slice(0, 7).map((ev) => {
                  const student = students.find((s) => s.id === ev.studentId);
                  return (
                    <div key={ev.id} style={S.sideRow}>
                      <div style={{ minWidth: 0 }}>
                        <div style={S.rowTitle}>{student?.name || 'Unknown student'}</div>
                        <div style={S.rowSub}>{ev.date} · {ev.startTime || '--:--'} · {ev.classFocus || 'No focus'}</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar:class', { classEventId: ev.id })}>Open</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
      )}
    </div>
  );
}

function RepoKpi({ label, value, icon }) {
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent-deep)' }}>{value}</div>
    </Card>
  );
}

function EventRow({ ev, students, onNavigate, onMarkComplete, onDelete }) {
  const student = students.find((s) => s.id === ev.studentId);

  return (
    <div style={S.eventRow}>
      <Avatar name={student?.name || '?'} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.rowTitle}>{student?.name || 'Unknown student'} · {ev.title || 'Class'}</div>
        <div style={S.rowSub}>{ev.startTime || '--:--'} · {ev.classFocus || 'No focus set'}</div>
      </div>
      <Pill tone={STATUS_TONE[ev.status] || 'muted'}>{ev.status}</Pill>
      <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar:class', { classEventId: ev.id })}>Record</Button>
      {ev.status === 'scheduled' && (
        <Button variant="ghost" size="sm" onClick={() => onMarkComplete(ev)}>Done</Button>
      )}
      {ev.status === 'completed' && ev.diagnosticStatus === 'not-started' && (
        <Button variant="primary" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: ev.studentId, classEventId: ev.id })}>Diagnose</Button>
      )}
      <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(ev)}>
        <Icon.trash size={12} />
      </Button>
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

const EMPTY_FORM = {
  studentId: '',
  date: '',
  startTime: '',
  endTime: '',
  title: 'English Class',
  classFocus: '',
  metSkillFocus: '',
  status: 'scheduled',
  diagnosticStatus: 'not-started',
  homeworkStatus: 'not-generated',
};

const S = {
  shell: { maxWidth: 1120, margin: '0 auto', padding: '28px 20px' },
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 18,
    padding: 18,
    borderRadius: 4,
    background: 'linear-gradient(130deg, #102131 0%, #193249 45%, #1f4f66 100%)',
    color: '#fff',
  },
  heroTag: { fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9fd6d6', fontWeight: 700, marginBottom: 6 },
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#fff', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,.78)', margin: '4px 0 0', maxWidth: 620 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 },
  calendarHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 },
  weekDays: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 },
  weekDayCell: { textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
  dayButton: {
    display: 'grid',
    alignContent: 'space-between',
    minHeight: 52,
    borderRadius: 3,
    padding: '6px 5px',
    cursor: 'pointer',
    color: 'var(--text)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    textAlign: 'left',
  },
  dotRow: { display: 'flex', gap: 3, justifyContent: 'flex-start', marginTop: 4 },
  dot: { width: 5, height: 5, borderRadius: 999 },
  eventRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid var(--divider)',
    borderRadius: 4,
    padding: '10px 11px',
    flexWrap: 'wrap',
    background: '#fff',
  },
  sideRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: 8,
    border: '1px solid var(--divider)',
    borderRadius: 3,
    padding: '9px 10px',
    background: '#fff',
  },
  rowTitle: { fontWeight: 700, fontSize: 'var(--text-sm)' },
  rowSub: { fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 },
  empty: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '8px 0 0' },
};
