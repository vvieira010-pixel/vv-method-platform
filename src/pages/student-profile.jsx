/**
 * student-profile.jsx — Deep-dive student profile with tabs
 */
import { useState, useEffect, useCallback } from 'react';
import { Icon, SectionHeader, Pill, Avatar, PillNav, Breadcrumb } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
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

  const load = useCallback(async () => {
    if (!studentId) return;
    try {
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
    } catch (e) {
      window.toast?.(`Failed to load student profile: ${e.message}`, 'warn');
    }
  }, [studentId]);

  useEffect(() => { load(); }, [studentId, load]);

  if (!student) return <div style={{ padding: 'var(--space-10)', color: 'var(--muted)' }}>Student not found.</div>;

  const activeProfile = profiles.find(p => p.isActive) || profiles[0];

  return (
    <div className="page-shell-lg">
      <Breadcrumb crumbs={[{ label: 'Students', onClick: () => onNavigate('students') }, { label: 'Profile' }]} />

      <Card style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
        <div className="card-row" style={{ gap: 'var(--space-4)' }}>
          <Avatar name={student.name} size={52} />
          <div className="card-row-body">
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>{student.name}</h2>
            <p className="card-row-meta">
              {student.currentLevel} → {student.targetLevel} · {student.examGoal}
              {student.professionalContext ? ` · ${student.professionalContext}` : ''}
            </p>
            {activeProfile && (
              <p className="card-row-meta" style={{ color: 'var(--info)' }}>
                Target: {activeProfile.label} — Overall {activeProfile.overallTarget}, Speaking {activeProfile.speakingTarget}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="primary" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId })}>
              <Icon.diagnose size={13} /> New Diagnosis
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>
              <Icon.calendar size={13} /> Schedule Class
            </Button>
          </div>
        </div>
      </Card>

      <PillNav tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ marginTop: 'var(--space-5)' }}>
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
    <div className="stat-grid" style={{ gap: 'var(--space-4)' }}>
      <Card style={{ padding: 'var(--space-4)' }}>
        <SectionHeader title="Progress Summary" />
        <div className="stat-grid" style={{ marginTop: 'var(--space-3)' }}>
          {[
            { label: 'Classes completed', value: completedClasses },
            { label: 'Diagnoses', value: diagnoses.length },
            { label: 'Homework done', value: `${completedHw}/${homework.length}` },
            { label: 'Active errors', value: activeErrors },
          ].map(({ label, value }) => (
            <div key={label} className="stat-cell">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 'var(--space-4)' }}>
        <SectionHeader title="Target Score Profile" />
        {activeProfile ? (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Pill tone="info">{activeProfile.label}</Pill>
            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <p style={{ margin: '4px 0' }}>Overall target: <strong>{activeProfile.overallTarget ?? '—'}</strong></p>
              <p style={{ margin: '4px 0' }}>Speaking target: <strong>{activeProfile.speakingTarget ?? '—'}</strong></p>
              {activeProfile.writingTarget && <p style={{ margin: '4px 0' }}>Writing: <strong>{activeProfile.writingTarget}</strong></p>}
            </div>
          </div>
        ) : (
          <p className="card-row-meta" style={{ marginTop: 'var(--space-3)' }}>No target profile selected.</p>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={() => addPreset('endorsement')}>Endorsement (55/55)</Button>
          <Button variant="ghost" size="sm" onClick={() => addPreset('visascreen')}>VisaScreen (58/59)</Button>
        </div>
      </Card>

      {latestDx && (
        <Card style={{ padding: 'var(--space-4)', gridColumn: '1 / -1' }}>
          <SectionHeader title="Latest Diagnosis" action={<Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: student.id, diagnosisId: latestDx.id })}>View</Button>} />
          <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
            {latestDx.classSummary || latestDx.content?.overall_result || 'No summary available.'}
          </p>
          {latestDx.content?.priorityDiagnosis?.[0] && (
            <div className="alert-box warning" style={{ marginTop: 'var(--space-2)' }}>
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
    <div className="stack-list">
      {classes.length === 0 && <Card className="page-empty-state"><p className="card-row-meta">No classes yet.</p></Card>}
      {classes.map(ev => (
        <Card key={ev.id} style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div className="card-row">
            <div className="card-row-body">
              <div className="card-row-title">{ev.title}</div>
              <div className="card-row-meta">
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
    <div className="stack-list">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-1)' }}>
        <Button variant="primary" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId })}>
          <Icon.plus size={13} /> New Diagnosis
        </Button>
      </div>
      {diagnoses.length === 0 && <Card className="page-empty-state"><p className="card-row-meta">No diagnoses yet.</p></Card>}
      {diagnoses.map(dx => (
        <Card key={dx.id} style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div className="card-row">
            <div className="card-row-body">
              <div className="card-row-title">{new Date(dx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div className="card-row-meta">
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
    <div className="stack-list">
      {homework.length === 0 && <Card className="page-empty-state"><p className="card-row-meta">No homework assigned yet.</p></Card>}
      {homework.map(h => {
        const sub = submissions.find(s => s.homeworkId === h.id);
        return (
          <Card key={h.id} style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div className="card-row">
              <div className="card-row-body">
                <div className="card-row-title">{h.title}</div>
                <div className="card-row-meta">
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
    <div className="stack-list">
      {submissions.length === 0 && <Card className="page-empty-state"><p className="card-row-meta">No submissions yet.</p></Card>}
      {submissions.map(sub => {
        const hw = homework.find(h => h.id === sub.homeworkId);
        return (
          <Card key={sub.id} style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div className="card-row">
              <div className="card-row-body">
                <div className="card-row-title">{hw?.title || 'Submission'}</div>
                <div className="card-row-meta">
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
      {errors.length === 0 && <Card className="page-empty-state"><p className="card-row-meta">No errors in the bank yet. They'll appear after running a diagnosis.</p></Card>}
      <div className="stack-list">
        {errors.map(err => (
          <Card key={err.id} style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div className="card-row">
              <div className="card-row-body">
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{err.error}</span>
                <span style={{ color: 'var(--muted)', margin: '0 6px' }}>→</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{err.correct}</span>
                <div className="card-row-meta" style={{ marginTop: 3 }}>{err.explanation}</div>
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
      {vocab.length === 0 && <Card className="page-empty-state"><p className="card-row-meta">No vocabulary saved yet. Diagnoses will populate this bank.</p></Card>}
      <div className="stack-list">
        {vocab.map(v => (
          <Card key={v.id} style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div className="card-row">
              <div className="card-row-body">
                <strong>{v.wordOrPhrase}</strong>
                <span className="card-row-meta" style={{ marginLeft: 'var(--space-2)', marginTop: 0, display: 'inline' }}>{v.category}</span>
                {v.meaning && <div className="card-row-meta">{v.meaning}</div>}
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
      <Card style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <SectionHeader title="Add Progress Note" />
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <input className="input" style={{ flex: 1 }} value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Write a progress note…" onKeyDown={e => e.key === 'Enter' && addNote()} />
          <Button variant="primary" size="sm" onClick={addNote}>Add</Button>
        </div>
      </Card>

      {notes.length === 0 ? (
        <Card className="page-empty-state"><p className="card-row-meta">No progress notes yet.</p></Card>
      ) : (
        <div className="stack-list">
          {notes.map(n => (
            <Card key={n.id} style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <div className="card-row-meta" style={{ marginBottom: 'var(--space-1)' }}>
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
