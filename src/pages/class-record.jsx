/**
 * class-record.jsx — Record class evidence after a class
 */
import { useState, useEffect } from 'react';
import { Icon, SectionHeader, Pill, Breadcrumb } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
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

  async function load() {
    if (!classEventId) return;
    try {
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
    } catch (e) {
      window.toast?.(`Failed to load class: ${e.message}`, 'warn');
    }
  }

  useEffect(() => { load(); }, [classEventId]);

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
    try {
      const normalizedForm = normalizeEvidenceCounts(form);
      const record = await saveClassEvidence({
        id: evidence?.id,
        classEventId,
        studentId: event?.studentId,
        ...normalizedForm,
      });
      setEvidence(record);
      if (event?.status === 'scheduled') {
        await updateClassEventStatus(classEventId, { status: 'completed' });
        setEvent(e => ({ ...e, status: 'completed' }));
      }
      window.toast?.('Evidence saved.', 'ok');
    } catch (e) {
      window.toast?.(`Failed to save: ${e.message}`, 'warn');
    }
    setSaving(false);
    if (andDiagnose) {
      onNavigate('diagnostics:create', { studentId: event?.studentId, classEventId });
    }
  }

  if (!event) return <div className="p-5 text-muted">Class not found.</div>;

  const anySkillEvaluated = SKILLS.some(s => form[s.evalKey]);

  return (
    <div className="page-container page-container--sm">
      <Breadcrumb crumbs={[{ label: 'Calendar', onClick: () => onNavigate('calendar') }, { label: 'Class Record' }]} />

      {/* Header */}
      <div className="flex flex-between items-start mb-6">
        <div>
          <h1 className="page-headline">Class Record</h1>
          <p className="page-sub">
            {student?.name} · {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            {event.startTime ? ` · ${event.startTime}` : ''}
          </p>
          <p className="cr-meta">{event.title} · {event.classFocus || 'No focus set'}</p>
        </div>
        <div className="flex gap-2">
          <Pill tone={event.status === 'completed' ? 'success' : 'info'}>{event.status}</Pill>
          <Pill tone={event.diagnosticStatus === 'approved' ? 'success' : event.diagnosticStatus === 'draft' ? 'warning' : 'muted'}>
            Diagnosis: {event.diagnosticStatus}
          </Pill>
        </div>
      </div>

      {/* Skills evaluated */}
      <Card className="card-p-5 mb-4">
        <SectionHeader title="Skills Evaluated in This Class" icon={<Icon.diagnose size={15} />} />
        <p className="cr-desc">Select only skills that were actually practiced and observed today. AI will only diagnose selected skills with evidence.</p>
        <div className="grid-auto-fill-200 mt-4">
          {SKILLS.map(({ key, evalKey, countKey }) => {
            const evaluated = form[evalKey];
            return (
              <button type="button" key={key}
                className={`cr-skill-btn${evaluated ? ' cr-skill-btn--active' : ''}`}
                onClick={() => toggleSkill(evalKey, countKey)}>
                <div className="flex-row gap-2">
                  <span className={`cr-skill-check${evaluated ? ' cr-skill-check--active' : ''}`}>
                    {evaluated && <Icon.check size={11} color="#fff" />}
                  </span>
                  <span className="cr-skill-label">{key}</span>
                </div>
                {evaluated && countKey && (
                  <div className="flex-row gap-2 mt-2" onClick={e => e.stopPropagation()}>
                    <span className="text-xs text-muted">Evidence turns:</span>
                    <input type="number" min={1} max={30} value={form[countKey]}
                      onChange={e => setForm(f => ({ ...f, [countKey]: Math.max(1, Number(e.target.value) || 1) }))}
                      className="cr-count-input" />
                  </div>
                )}
                {evaluated && !countKey && (
                  <div className="cr-inform">Will inform diagnosis</div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Evidence fields */}
      <Card className="card-p-5 mb-4">
        <SectionHeader title="Class Evidence" icon={<Icon.doc size={15} />} />
        <div className="flex-col-gap4 mt-4">
          <Field label="Student transcript / speaking answers">
            <textarea className="input" rows={6} value={form.studentTranscript}
              onChange={e => setForm(f => ({ ...f, studentTranscript: e.target.value }))}
              placeholder="Paste the student's exact words from the class. Quote errors directly — this is what the AI will analyze..." />
          </Field>
          <Field label="Student performance notes">
            <textarea className="input" rows={3} value={form.studentPerformance}
              onChange={e => setForm(f => ({ ...f, studentPerformance: e.target.value }))}
              placeholder="Describe what the student did well and what needs work..." />
          </Field>
          <Field label="Teacher notes & observations">
            <textarea className="input" rows={3} value={form.teacherNotes}
              onChange={e => setForm(f => ({ ...f, teacherNotes: e.target.value }))}
              placeholder="Patterns observed, surprising moments, teaching decisions made..." />
          </Field>
          <div className="grid-2col">
            <Field label="Homework reviewed in class">
              <textarea className="input" rows={2} value={form.homeworkReviewed}
                onChange={e => setForm(f => ({ ...f, homeworkReviewed: e.target.value }))}
                placeholder="Was homework reviewed? What did you find?" />
            </Field>
            <Field label="Student mood / confidence">
              <textarea className="input" rows={2} value={form.studentMood}
                onChange={e => setForm(f => ({ ...f, studentMood: e.target.value }))}
                placeholder="Nervous, motivated, tired, confident..." />
            </Field>
          </div>
          <Field label="Additional notes">
            <textarea className="input" rows={2} value={form.additionalNotes}
              onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))}
              placeholder="Anything else relevant for the diagnosis..." />
          </Field>
        </div>
      </Card>

      {/* Actions */}
      <div className="cr-actions">
        <Button variant="primary" onClick={() => handleSave(false)} disabled={saving}>
          {saving ? 'Saving…' : 'Save Evidence'}
        </Button>
        <Button variant="success" onClick={() => handleSave(true)} disabled={saving || !anySkillEvaluated}>
          <Icon.diagnose size={14} /> Save & Run Diagnosis
        </Button>
      </div>
      {!anySkillEvaluated && (
        <p className="cr-warning">Select at least one evaluated skill before running diagnosis.</p>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field-stack">
      <span className="field-label-block">{label}</span>
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
