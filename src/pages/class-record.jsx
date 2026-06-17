/**
 * class-record.jsx — Record class evidence after a class
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Button, Pill } from '../components/shared.jsx';
import { getClassEvent, getClassEvidence, saveClassEvidence, updateClassEventStatus, getStudent } from '../lib/workflow.js';

const SKILLS = [
  { key: 'Speaking',     evalKey: 'evaluatedSpeaking',     countKey: 'speakingEvidenceCount' },
  { key: 'Writing',      evalKey: 'evaluatedWriting',      countKey: 'writingEvidenceCount' },
  { key: 'Reading',      evalKey: 'evaluatedReading',      countKey: 'readingEvidenceCount' },
  { key: 'Listening',    evalKey: 'evaluatedListening',    countKey: 'listeningEvidenceCount' },
  { key: 'Grammar',      evalKey: 'evaluatedGrammar',      countKey: 'grammarEvidenceCount' },
  { key: 'Vocabulary',   evalKey: 'evaluatedVocabulary',   countKey: 'vocabularyEvidenceCount' },
  { key: 'Test Strategy',evalKey: 'evaluatedTestStrategy', countKey: 'testStrategyEvidenceCount' },
];

export default function ClassRecord({ classEventId, students, onNavigate }) {
  const [event, setEvent] = useState(null);
  const [student, setStudent] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [classEventId]);

  async function load() {
    if (!classEventId) return;
    const [ev, evid] = await Promise.all([
      getClassEvent(classEventId),
      getClassEvidence(classEventId),
    ]);
    setEvent(ev);
    if (ev) {
      const s = await getStudent(ev.studentId) || students.find(s => s.id === ev.studentId);
      setStudent(s);
    }
    if (evid) {
      setEvidence(evid);
      setForm({
        evaluatedSpeaking: evid.evaluatedSpeaking || false,
        evaluatedWriting: evid.evaluatedWriting || false,
        evaluatedReading: evid.evaluatedReading || false,
        evaluatedListening: evid.evaluatedListening || false,
        evaluatedGrammar: evid.evaluatedGrammar || false,
        evaluatedVocabulary: evid.evaluatedVocabulary || false,
        evaluatedTestStrategy: evid.evaluatedTestStrategy || false,
        speakingEvidenceCount: evid.speakingEvidenceCount || 0,
        writingEvidenceCount: evid.writingEvidenceCount || 0,
        readingEvidenceCount: evid.readingEvidenceCount || 0,
        listeningEvidenceCount: evid.listeningEvidenceCount || 0,
        grammarEvidenceCount: evid.grammarEvidenceCount || 0,
        vocabularyEvidenceCount: evid.vocabularyEvidenceCount || 0,
        testStrategyEvidenceCount: evid.testStrategyEvidenceCount || 0,
        teacherNotes: evid.teacherNotes || '',
        studentPerformance: evid.studentPerformance || '',
        studentTranscript: evid.studentTranscript || '',
        studentAnswer: evid.studentAnswer || '',
        homeworkReviewed: evid.homeworkReviewed || '',
        studentMood: evid.studentMood || '',
        additionalNotes: evid.additionalNotes || '',
      });
    }
  }

  function toggleSkill(evalKey, countKey) {
    setForm(f => {
      const newVal = !f[evalKey];
      const update = { [evalKey]: newVal };
      if (countKey) update[countKey] = newVal ? Math.max(1, Number(f[countKey] || 0)) : 0;
      return { ...f, ...update };
    });
  }

  async function handleSave(andDiagnose = false) {
    setSaving(true);
    const normalizedForm = normalizeEvidenceCounts(form);
    const record = await saveClassEvidence({
      id: evidence?.id,
      classEventId,
      studentId: event?.studentId,
      ...normalizedForm,
    });
    setEvidence(record);
    // Mark class as completed if still scheduled
    if (event?.status === 'scheduled') {
      await updateClassEventStatus(classEventId, { status: 'completed' });
      setEvent(e => ({ ...e, status: 'completed' }));
    }
    setSaving(false);
    window.toast?.('Evidence saved.', 'ok');
    if (andDiagnose) {
      onNavigate('diagnostics:create', { studentId: event?.studentId, classEventId });
    }
  }

  if (!event) return <div style={{ padding: 40, color: 'var(--muted)' }}>Class not found.</div>;

  const anySkillEvaluated = SKILLS.some(s => form[s.evalKey]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 20px' }}>
      {/* Back */}
      <button onClick={() => onNavigate('calendar')} style={backStyle}>
        <Icon.arrowL size={13} /> Back to calendar
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={S.headline}>Class Record</h1>
          <p style={S.sub}>
            {student?.name} · {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            {event.startTime ? ` · ${event.startTime}` : ''}
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginTop: 4 }}>{event.title} · {event.classFocus || 'No focus set'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Pill tone={event.status === 'completed' ? 'success' : 'info'}>{event.status}</Pill>
          <Pill tone={event.diagnosticStatus === 'approved' ? 'success' : event.diagnosticStatus === 'draft' ? 'warning' : 'muted'}>
            Diagnosis: {event.diagnosticStatus}
          </Pill>
        </div>
      </div>

      {/* Skills evaluated */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <SectionHeader title="Skills Evaluated in This Class" icon={<Icon.diagnose size={15} />} />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 4 }}>Select only skills that were actually practiced and observed today. AI will only diagnose selected skills with evidence.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginTop: 14 }}>
          {SKILLS.map(({ key, evalKey, countKey }) => {
            const evaluated = form[evalKey];
            return (
              <div key={key} style={{ padding: 12, borderRadius: 'var(--radius-sm)', border: `2px solid ${evaluated ? 'var(--accent)' : 'var(--border)'}`, background: evaluated ? 'var(--accent-subtle)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s' }} onClick={() => toggleSkill(evalKey, countKey)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 0, border: `2px solid ${evaluated ? 'var(--accent)' : 'var(--border)'}`, background: evaluated ? 'var(--accent)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {evaluated && <Icon.check size={11} color="#fff" />}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: evaluated ? 'var(--accent-deep)' : 'var(--text)' }}>{key}</span>
                </div>
                {evaluated && countKey && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Evidence turns:</span>
                    <input type="number" min={1} max={30} value={form[countKey]} onChange={e => setForm(f => ({ ...f, [countKey]: Math.max(1, Number(e.target.value) || 1) }))}
                      style={{ width: 52, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 0, fontSize: 'var(--text-xs)', textAlign: 'center' }} />
                  </div>
                )}
                {evaluated && !countKey && (
                  <div style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>Will inform diagnosis</div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Evidence fields */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <SectionHeader title="Class Evidence" icon={<Icon.doc size={15} />} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          <Field label="Student transcript / speaking answers">
            <textarea className="input" rows={6} value={form.studentTranscript} onChange={e => setForm(f => ({ ...f, studentTranscript: e.target.value }))} placeholder="Paste the student's exact words from the class. Quote errors directly — this is what the AI will analyze..." />
          </Field>
          <Field label="Student performance notes">
            <textarea className="input" rows={3} value={form.studentPerformance} onChange={e => setForm(f => ({ ...f, studentPerformance: e.target.value }))} placeholder="Describe what the student did well and what needs work..." />
          </Field>
          <Field label="Teacher notes & observations">
            <textarea className="input" rows={3} value={form.teacherNotes} onChange={e => setForm(f => ({ ...f, teacherNotes: e.target.value }))} placeholder="Patterns observed, surprising moments, teaching decisions made..." />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Homework reviewed in class">
              <textarea className="input" rows={2} value={form.homeworkReviewed} onChange={e => setForm(f => ({ ...f, homeworkReviewed: e.target.value }))} placeholder="Was homework reviewed? What did you find?" />
            </Field>
            <Field label="Student mood / confidence">
              <textarea className="input" rows={2} value={form.studentMood} onChange={e => setForm(f => ({ ...f, studentMood: e.target.value }))} placeholder="Nervous, motivated, tired, confident..." />
            </Field>
          </div>
          <Field label="Additional notes">
            <textarea className="input" rows={2} value={form.additionalNotes} onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))} placeholder="Anything else relevant for the diagnosis..." />
          </Field>
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={() => handleSave(false)} disabled={saving}>{saving ? 'Saving…' : 'Save Evidence'}</Button>
        <Button variant="primary" style={{ background: 'var(--success)' }} onClick={() => handleSave(true)} disabled={saving || !anySkillEvaluated}>
          <Icon.diagnose size={14} /> Save & Run Diagnosis
        </Button>
        <Button variant="ghost" onClick={() => onNavigate('calendar')}>Back to Calendar</Button>
      </div>
      {!anySkillEvaluated && (
        <p style={{ color: 'var(--warning)', fontSize: 'var(--text-xs)', marginTop: 8 }}>Select at least one evaluated skill before running diagnosis.</p>
      )}
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

function normalizeEvidenceCounts(form) {
  const next = { ...form };
  SKILLS.forEach(({ evalKey, countKey }) => {
    if (!countKey) return;
    if (next[evalKey]) next[countKey] = Math.max(1, Number(next[countKey] || 0));
    else next[countKey] = 0;
  });
  return next;
}

const EMPTY_FORM = {
  evaluatedSpeaking: false, evaluatedWriting: false, evaluatedReading: false,
  evaluatedListening: false, evaluatedGrammar: false, evaluatedVocabulary: false, evaluatedTestStrategy: false,
  speakingEvidenceCount: 0, writingEvidenceCount: 0, readingEvidenceCount: 0,
  listeningEvidenceCount: 0, grammarEvidenceCount: 0, vocabularyEvidenceCount: 0, testStrategyEvidenceCount: 0,
  teacherNotes: '', studentPerformance: '', studentTranscript: '', studentAnswer: '',
  homeworkReviewed: '', studentMood: '', additionalNotes: '',
};
const backStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, padding: 0, fontFamily: 'var(--font-ui)' };
const S = {
  headline: { fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '4px 0 0' },
};

