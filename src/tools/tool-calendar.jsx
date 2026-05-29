/**
 * tool-calendar.jsx — Session calendar view (real linked data)
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, SectionHeader, Pill, Avatar, Button, Icon } from '../components/shared.jsx';
import { getSessions, createSession } from '../lib/workflow.js';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function ToolCalendar({ students = [] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [studentFilter, setStudentFilter] = useState('all');
  const [newStudentId, setNewStudentId] = useState('');
  const [newType, setNewType] = useState('class');

  const loadSessions = async () => {
    const all = await getSessions();
    setSessions(all || []);
  };

  useEffect(() => {
    loadSessions();
    const h = () => loadSessions();
    window.addEventListener('vv:students-updated', h);
    return () => window.removeEventListener('vv:students-updated', h);
  }, []);

  useEffect(() => {
    if (!newStudentId && students[0]?.id) setNewStudentId(students[0].id);
  }, [students, newStudentId]);

  const monthSessions = useMemo(() => {
    return sessions.filter((s) => {
      const d = new Date(s.date || s.createdAt || Date.now());
      const isMonthMatch = d.getFullYear() === year && d.getMonth() === month;
      const isStudentMatch = studentFilter === 'all' || s.studentId === studentFilter;
      return isMonthMatch && isStudentMatch;
    });
  }, [sessions, year, month, studentFilter]);

  const sessionsByDay = useMemo(() => {
    const map = {};
    monthSessions.forEach((s) => {
      const d = new Date(s.date || s.createdAt || Date.now());
      const day = d.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(s);
    });
    return map;
  }, [monthSessions]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const selectedSessions = selectedDay ? (sessionsByDay[selectedDay] || []) : [];

  const addSession = async () => {
    if (!newStudentId || !selectedDay) return;
    const student = students.find((s) => s.id === newStudentId);
    if (!student) return;
    const date = new Date(year, month, selectedDay);
    await createSession({
      studentId: student.id,
      studentName: student.name,
      track: student.track || 'MET',
      type: newType,
      date: date.toISOString(),
      title: `${newType === 'assessment' ? 'Assessment' : 'Class'} session`,
    });
    await loadSessions();
    window.toast?.('Session added to calendar.', 'ok');
  };

  return (
    <div className="page-shell">
      <div className="page-inner">
        <SectionHeader title="Calendar" sub="Session schedule linked to your real student records" />

        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>Show schedule for
              <select className="input" value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} style={{ marginTop: 6 }}>
                <option value="all">All students</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label style={labelStyle}>Session type to add
              <select className="input" value={newType} onChange={(e) => setNewType(e.target.value)} style={{ marginTop: 6 }}>
                <option value="class">Class</option>
                <option value="assessment">Assessment</option>
              </select>
            </label>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button onClick={prevMonth} style={navBtnStyle}>‹</button>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{MONTH_NAMES[month]} {year}</div>
              <button onClick={nextMonth} style={navBtnStyle}>›</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
              {DAY_NAMES.map((d) => (
                <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:'var(--muted)', padding:'4px 0', textTransform:'uppercase', letterSpacing:'0.05em' }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {cells.map((day, i) => {
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const hasSessions = day && sessionsByDay[day]?.length > 0;
                const isSelected = day === selectedDay;
                return (
                  <button key={i}
                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                    disabled={!day}
                    style={{
                      height: 38, borderRadius: 8, border: 'none', cursor: day ? 'pointer' : 'default',
                      background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-soft)' : 'transparent',
                      color: isSelected ? '#fff' : isToday ? 'var(--accent)' : day ? 'var(--text)' : 'transparent',
                      fontWeight: isToday || isSelected ? 700 : 400,
                      fontSize: 13, position: 'relative', fontFamily: 'inherit',
                      transition: 'background 0.12s',
                    }}>
                    {day}
                    {hasSessions && !isSelected && (
                      <span style={{ position:'absolute', bottom:4, left:'50%', transform:'translateX(-50%)', width:5, height:5, borderRadius:'50%', background:'var(--accent)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              {selectedDay ? `${MONTH_NAMES[month]} ${selectedDay}` : 'Select a day'}
            </div>
            {selectedDay && (
              <Card style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Add session for
                  <select className="input" value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)} style={{ marginTop: 6 }}>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <Button variant="accent" size="sm" block icon={<Icon.plus size={13}/>} style={{ marginTop: 10 }} onClick={addSession}>
                  Add Session
                </Button>
              </Card>
            )}
            {selectedDay && selectedSessions.length === 0 && (
              <div style={{ color:'var(--muted)', fontSize:13, marginBottom:14 }}>No sessions this day.</div>
            )}
            {selectedSessions.map((s) => (
              <div key={s.id} style={{ padding:'10px 12px', border:'1px solid var(--border)', borderRadius:10, marginBottom:8, display:'flex', gap:10, alignItems:'center' }}>
                <Avatar name={s.studentName || 'Student'} size={32} tone="auto" />
                <div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{s.studentName || 'Student'}</div>
                  <Pill tone={s.type === 'assessment' ? 'warning' : 'accent'}>{s.type || 'class'}</Pill>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const navBtnStyle = {
  background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18, padding:'4px 8px'
};
