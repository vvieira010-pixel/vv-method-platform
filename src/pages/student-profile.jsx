/**
 * student-profile.jsx — Deep-dive student profile with tabs
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar, PillNav } from '../components/shared.jsx';
import {
  getStudent, saveStudent,
  getTargetProfiles, saveTargetProfile, setActiveTargetProfile, deleteTargetProfile, TARGET_PROFILE_PRESETS,
  getClassEvents, getDiagnoses, getHomework, getSubmissions, getReviews,
  getErrorBank, markErrorPracticed, markErrorSolved,
  getVocabularyBank, deleteVocabularyEntry, updateVocabularyEntry,
  getProgressNotes, saveProgressNote, deleteProgressNote,
} from '../lib/workflow.js';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'classes', label: 'Classes' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'homework', label: 'Homework' },
  { id: 'submissions', label: 'Submissions' },
  { id: 'errors', label: 'Error Bank' },
  { id: 'vocab', label: 'Vocab Bank' },
  { id: 'progress', label: 'Progress' },
];

export default function StudentProfile({ studentId, students, onNavigate }) {
  const [tab, setTab] = useState('overview');
  const [student, setStudent] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [homework, setHomework] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [vocab, setVocab] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => { load(); }, [studentId]);

  async function load() {
    if (!studentId) return;
    const [s, tp, ev, dx, hw, subs, eb, vb, pn] = await Promise.all([
      getStudent(studentId),
      getTargetProfiles(studentId),
      getClassEvents(studentId),
      getDiagnoses(studentId),
      getHomework(studentId),
      getSubmissions(studentId),
      getErrorBank(studentId),
      getVocabularyBank(studentId),
      getProgressNotes(studentId),
    ]);
    setStudent(s);
    setProfiles(tp);
    setClasses(ev);
    setDiagnoses(dx || []);
    setHomework(hw || []);
    setSubmissions(subs || []);
    setErrors(eb || []);
    setVocab(vb || []);
    setNotes(pn || []);
  }

  if (!student) return <div style={{ padding: 40, color: 'var(--muted)' }}>Student not found.</div>;

  const activeProfile = profiles.find(p => p.isActive) || profiles[0];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>
      {/* Back + header */}
      <button onClick={() => onNavigate('students')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, padding: 0, fontFamily: 'var(--font-ui)' }}>
        <Icon.arrowL size={13} /> Back to students
      </button>

      {/* Student header */}
      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Avatar name={student.name} size={52} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, color: 'var(--accent-deep)' }}>{student.name}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
              {student.currentLevel} → {student.targetLevel} · {student.examGoal}
              {student.professionalContext ? ` · ${student.professionalContext}` : ''}
            </p>
            {activeProfile && (
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--info)' }}>
                Target: {activeProfile.label} — Overall {activeProfile.overallTarget}, Speaking {activeProfile.speakingTarget}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId })}>
              <Icon.diagnose size={13} /> New Diagnosis
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>
              <Icon.calendar size={13} /> Schedule Class
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <PillNav tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ marginTop: 20 }}>
        {tab === 'overview' && <OverviewTab student={student} profiles={profiles} diagnoses={diagnoses} errors={errors} classes={classes} homework={homework} onNavigate={onNavigate} onRefresh={load} />}
        {tab === 'classes' && <ClassesTab classes={classes} students={[student]} onNavigate={onNavigate} />}
        {tab === 'diagnostics' && <DiagnosticsTab diagnoses={diagnoses} onNavigate={onNavigate} studentId={studentId} />}
        {tab === 'homework' && <HomeworkTab homework={homework} submissions={submissions} />}
        {tab === 'submissions' && <SubmissionsTab submissions={submissions} homework={homework} onNavigate={onNavigate} />}
        {tab === 'errors' && <ErrorBankTab errors={errors} studentId={studentId} onRefresh={load} />}
        {tab === 'vocab' && <VocabTab vocab={vocab} studentId={studentId} onRefresh={load} />}
        {tab === 'progress' && <ProgressTab notes={notes} diagnoses={diagnoses} studentId={studentId} newNote={newNote} setNewNote={setNewNote} onRefresh={load} />}
      </div>
    </div>
  );
}

function OverviewTab({ student, profiles, diagnoses, errors, classes, homework, onNavigate, onRefresh }) {
  const activeProfile = profiles.find(p => p.isActive) || profiles[0];
  const activeErrors = errors.filter(e => e.status === 'active').length;
  const latestDx = diagnoses[0];
  const completedClasses = classes.filter(c => c.status === 'completed').length;
  const completedHw = homework.filter(h => h.status === 'completed' || h.status === 'corrected').length;

  async function addPreset(key) {
    const preset = TARGET_PROFILE_PRESETS[key];
    const existing = profiles.find(p => p.profileName === preset.profileName);
    if (existing) { await setActiveTargetProfile(student.id, existing.id); }
    else {
      const saved = await saveTargetProfile({ ...preset, studentId: student.id, isActive: true });
      await setActiveTargetProfile(student.id, saved.id);
    }
    onRefresh();
    window.toast?.(`Target set: ${preset.label}`, 'ok');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Stats */}
      <Card style={{ padding: 16 }}>
        <SectionHeader title="Progress Summary" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          {[
            { label: 'Classes completed', value: completedClasses },
            { label: 'Diagnoses', value: diagnoses.length },
            { label: 'Homework done', value: `${completedHw}/${homework.length}` },
            { label: 'Active errors', value: activeErrors },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--accent-deep)' }}>{value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Target profile */}
      <Card style={{ padding: 16 }}>
        <SectionHeader title="Target Score Profile" />
        {activeProfile ? (
          <div style={{ marginTop: 10 }}>
            <Pill tone="info">{activeProfile.label}</Pill>
            <div style={{ marginTop: 8, fontSize: 'var(--text-sm)' }}>
              <p style={{ margin: '4px 0' }}>Overall target: <strong>{activeProfile.overallTarget ?? '—'}</strong></p>
              <p style={{ margin: '4px 0' }}>Speaking target: <strong>{activeProfile.speakingTarget ?? '—'}</strong></p>
              {activeProfile.writingTarget && <p style={{ margin: '4px 0' }}>Writing: <strong>{activeProfile.writingTarget}</strong></p>}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginTop: 10 }}>No target profile selected.</p>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={() => addPreset('endorsement')}>Endorsement (55/55)</Button>
          <Button variant="ghost" size="sm" onClick={() => addPreset('visascreen')}>VisaScreen (58/59)</Button>
        </div>
      </Card>

      {/* Latest diagnosis summary */}
      {latestDx && (
        <Card style={{ padding: 16, gridColumn: '1 / -1' }}>
          <SectionHeader title="Latest Diagnosis" action={<Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: student.id, diagnosisId: latestDx.id })}>View</Button>} />
          <p style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
            {latestDx.classSummary || latestDx.content?.overall_result || 'No summary available.'}
          </p>
          {latestDx.content?.priorityDiagnosis?.[0] && (
            <div style={{ marginTop: 8, padding: 10, background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)' }}>
              <strong>Priority:</strong> {latestDx.content.priorityDiagnosis[0].area} — {latestDx.content.priorityDiagnosis[0].whatToImprove}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function ClassesTab({ classes, students, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {classes.length === 0 && <Card><p style={{ padding: 16, color: 'var(--muted)' }}>No classes yet.</p></Card>}
      {classes.map(ev => (
        <Card key={ev.id} style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{ev.title}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
                {new Date(ev.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {ev.classFocus || 'No focus set'}
              </div>
            </div>
            <Pill tone={ev.status === 'completed' ? 'success' : ev.status === 'canceled' ? 'danger' : 'info'}>{ev.status}</Pill>
            <Pill tone={ev.diagnosticStatus === 'approved' ? 'success' : ev.diagnosticStatus === 'draft' ? 'warning' : 'muted'}>{ev.diagnosticStatus}</Pill>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar:class', { classEventId: ev.id })}>Open</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function DiagnosticsTab({ diagnoses, onNavigate, studentId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <Button variant="primary" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId })}>
          <Icon.plus size={13} /> New Diagnosis
        </Button>
      </div>
      {diagnoses.length === 0 && <Card><p style={{ padding: 16, color: 'var(--muted)' }}>No diagnoses yet.</p></Card>}
      {diagnoses.map(dx => (
        <Card key={dx.id} style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{new Date(dx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
                {dx.classSummary?.slice(0, 80) || 'No summary'}
              </div>
            </div>
            <Pill tone={dx.status === 'approved' ? 'success' : 'warning'}>{dx.status || 'draft'}</Pill>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId, diagnosisId: dx.id })}>View</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function HomeworkTab({ homework, submissions }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {homework.length === 0 && <Card><p style={{ padding: 16, color: 'var(--muted)' }}>No homework assigned yet.</p></Card>}
      {homework.map(h => {
        const sub = submissions.find(s => s.homeworkId === h.id);
        return (
          <Card key={h.id} style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{h.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
                  Assigned {new Date(h.assignedAt || h.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {h.dueDate ? ` · Due ${new Date(h.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                </div>
              </div>
              <Pill tone={sub ? 'success' : h.status === 'not-started' ? 'muted' : 'warning'}>{sub ? 'Submitted' : h.status}</Pill>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function SubmissionsTab({ submissions, homework, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {submissions.length === 0 && <Card><p style={{ padding: 16, color: 'var(--muted)' }}>No submissions yet.</p></Card>}
      {submissions.map(sub => {
        const hw = homework.find(h => h.id === sub.homeworkId);
        return (
          <Card key={sub.id} style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{hw?.title || 'Submission'}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
                  {new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <Pill tone={sub.status === 'reviewed' ? 'success' : 'warning'}>{sub.status}</Pill>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('submissions:review', { submissionId: sub.id })}>Review</Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ErrorBankTab({ errors, studentId, onRefresh }) {
  return (
    <div>
      {errors.length === 0 && <Card><p style={{ padding: 16, color: 'var(--muted)' }}>No errors in the bank yet. They'll appear after running a diagnosis.</p></Card>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {errors.map(err => (
          <Card key={err.id} style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{err.error}</span>
                <span style={{ color: 'var(--muted)', margin: '0 6px' }}>→</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{err.correct}</span>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 3 }}>{err.explanation}</div>
              </div>
              <Pill tone="muted">{err.type}</Pill>
              <Pill tone={err.status === 'solved' ? 'success' : err.status === 'practicing' ? 'info' : 'warning'}>{err.status}</Pill>
              {err.status !== 'solved' && (
                <Button variant="ghost" size="sm" onClick={async () => { await markErrorSolved(studentId, err.id); onRefresh(); }}>Mark solved</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VocabTab({ vocab, studentId, onRefresh }) {
  return (
    <div>
      {vocab.length === 0 && <Card><p style={{ padding: 16, color: 'var(--muted)' }}>No vocabulary saved yet. Diagnoses will populate this bank.</p></Card>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {vocab.map(v => (
          <Card key={v.id} style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <strong>{v.wordOrPhrase}</strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginLeft: 8 }}>{v.category}</span>
                {v.meaning && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 2 }}>{v.meaning}</div>}
              </div>
              <Pill tone={v.status === 'learned' ? 'success' : v.status === 'reviewing' ? 'info' : 'muted'}>{v.status}</Pill>
              <Button variant="ghost" size="sm" onClick={async () => { await updateVocabularyEntry(v.id, { status: 'learned' }); onRefresh(); }}>Mark learned</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProgressTab({ notes, diagnoses, studentId, newNote, setNewNote, onRefresh }) {
  async function addNote() {
    if (!newNote.trim()) return;
    await saveProgressNote({ studentId, sourceType: 'teacher', note: newNote.trim() });
    setNewNote('');
    onRefresh();
    window.toast?.('Note added.', 'ok');
  }

  return (
    <div>
      {/* Add note */}
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <SectionHeader title="Add Progress Note" />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input className="input" style={{ flex: 1 }} value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Write a progress note…" onKeyDown={e => e.key === 'Enter' && addNote()} />
          <Button variant="primary" size="sm" onClick={addNote}>Add</Button>
        </div>
      </Card>

      {/* Notes timeline */}
      {notes.length === 0 ? (
        <Card><p style={{ padding: 16, color: 'var(--muted)' }}>No progress notes yet.</p></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.map(n => (
            <Card key={n.id} style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 4 }}>
                {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {n.sourceType}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{n.note}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
