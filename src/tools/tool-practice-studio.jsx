import { useEffect, useState } from 'react';
import { Card, SectionHeader, Button, Pill } from '../components/shared.jsx';
import { getDiagnoses, getHomework, getFeedback, getPracticeAssignments, savePracticeAssignment, deletePracticeAssignment } from '../lib/workflow.js';

const ACTIVITY_TYPES = ['Speaking', 'Grammar', 'Vocabulary', 'Writing', 'Listening', 'Reading', 'MET-style practice'];

export default function ToolPracticeStudio({ students = [], selectedStudent, onSelectStudent, onOpenTool }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [homework, setHomework] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ title: '', type: 'Speaking', instructions: '', required: true });

  const load = async () => {
    if (!selectedStudent?.id) return;
    const [diags, fb, hw, practice] = await Promise.all([
      getDiagnoses(selectedStudent.id),
      getFeedback(selectedStudent.id),
      getHomework(selectedStudent.id),
      getPracticeAssignments(selectedStudent.id),
    ]);
    setDiagnoses(diags || []);
    setSelectedDiagnosisId((current) => current && (diags || []).some(d => d.id === current) ? current : (diags?.[0]?.id || ''));
    setFeedback(fb || []);
    setHomework(hw || []);
    setAssignments(practice || []);
  };

  useEffect(() => {
    load();
  }, [selectedStudent?.id]);

  const diagnosis = diagnoses.find(d => d.id === selectedDiagnosisId) || diagnoses[0] || null;
  const focusText = [
    ...(diagnosis?.nextSteps || []),
    ...(diagnosis?.weaknesses || []),
    diagnosis?.priorityFocus,
    diagnosis?.content?.overall_result,
  ].filter(Boolean).slice(0, 3).join('\n');

  const assign = async () => {
    if (!diagnosis) return;
    const title = form.title.trim() || `${form.type} practice for ${selectedStudent?.firstName || 'student'}`;
    await savePracticeAssignment({
      studentId: selectedStudent?.id,
      studentName: selectedStudent?.name,
      diagnosisId: diagnosis.id,
      title,
      skillFocus: form.type,
      instructions: form.instructions.trim() || focusText || 'Practice the focus selected from your latest diagnosis.',
      required: form.required,
      status: 'assigned',
    });
    setForm({ title: '', type: form.type, instructions: '', required: true });
    await load();
    window.toast?.('Practice assigned.', 'ok');
  };

  return (
    <div className="page-shell">
      <div className="page-inner">
        <SectionHeader title="Practice Studio" sub={selectedStudent ? `For ${selectedStudent.firstName}` : 'Teacher-guided practice planning'} />

        <Card style={{ margin: '12px 0 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
              Student
              <select className="input" value={selectedStudent?.id || ''} onChange={e => onSelectStudent?.(e.target.value)} style={{ marginTop: 6 }}>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
              Diagnosis history
              <select className="input" value={selectedDiagnosisId} onChange={e => setSelectedDiagnosisId(e.target.value)} style={{ marginTop: 6 }} disabled={!diagnoses.length}>
                {diagnoses.map(d => <option key={d.id} value={d.id}>{formatDiagnosisLabel(d)}</option>)}
              </select>
            </label>
          </div>
        </Card>

        {!diagnosis ? (
          <Card style={{ marginTop: 14 }}>
            <SectionHeader title="Practice Studio" sub="Diagnosis required first" />
            <p className="text-sm text-muted" style={{ marginTop: 8, lineHeight: 1.7 }}>
              This feature is not active yet. Start by creating a diagnosis.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button variant="primary" size="sm" onClick={() => onOpenTool?.('tool:diagnostic')}>Start Diagnose</Button>
            </div>
          </Card>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0 16px' }}>
              <Pill tone="accent">Diagnosis linked</Pill>
              <Pill tone="info">Feedback drafts: {feedback.length}</Pill>
              <Pill tone="warning">Homework sets: {homework.length}</Pill>
            </div>

            <Card style={{ marginBottom: 12 }}>
              <SectionHeader title="Priority Practice Focus" sub="Reused from selected diagnosis" />
              <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                {(diagnosis.nextSteps || []).slice(0, 4).map((step, idx) => (
                  <li key={`${step}-${idx}`} style={{ marginBottom: 6, color: 'var(--text-2)' }}>{step}</li>
                ))}
                {(!diagnosis.nextSteps || diagnosis.nextSteps.length === 0) && (
                  <li style={{ color: 'var(--muted)' }}>No explicit next steps in this diagnosis yet.</li>
                )}
              </ul>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card>
                <SectionHeader title="Assign Practice" sub="Create a student-facing activity from this diagnosis" />
                <label style={fieldLabel}>Activity type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ marginBottom: 10 }}>
                  {ACTIVITY_TYPES.map(type => <option key={type}>{type}</option>)}
                </select>
                <label style={fieldLabel}>Title</label>
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={`${form.type} practice for ${selectedStudent?.firstName || 'student'}`} style={{ marginBottom: 10 }} />
                <label style={fieldLabel}>Instructions</label>
                <textarea className="input" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder={focusText || 'Add instructions for the student...'} rows={5} style={{ marginBottom: 10 }} />
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>
                  <input type="checkbox" checked={form.required} onChange={e => setForm(f => ({ ...f, required: e.target.checked }))} />
                  Required activity
                </label>
                <Button variant="primary" block onClick={assign}>Assign to Practice Studio</Button>
              </Card>

              <Card>
                <SectionHeader title="Assigned Practice" sub={`${assignments.length} item(s) for ${selectedStudent?.firstName || 'student'}`} />
                {assignments.length ? assignments.slice(0, 6).map(item => (
                  <div key={item.id} style={{ border: '1px solid var(--divider)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong style={{ fontSize: 13 }}>{item.title}</strong>
                      <Pill tone={item.required ? 'warning' : 'muted'}>{item.required ? 'Required' : 'Optional'}</Pill>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, margin: '6px 0 0' }}>{item.skillFocus}</p>
                    <div style={{ marginTop: 8 }}>
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={async () => {
                          await deletePracticeAssignment(item.id);
                          await load();
                          window.toast?.('Practice unassigned.', 'ok');
                        }}
                      >
                        Unassign
                      </Button>
                    </div>
                  </div>
                )) : (
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>No practice assigned from this diagnosis yet.</p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <Button variant="ghost" size="sm" onClick={() => onOpenTool?.('tool:feedback')}>Open Feedback</Button>
                  <Button variant="ghost" size="sm" onClick={() => onOpenTool?.('tool:homework')}>Open Homework</Button>
                  <Button variant="ghost" size="sm" onClick={() => onOpenTool?.('tool:reports')}>Open Reports</Button>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const fieldLabel = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
};

function formatDiagnosisLabel(diagnosis) {
  const date = diagnosis?.createdAt ? new Date(diagnosis.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Saved diagnosis';
  const focus = diagnosis?.priorityFocus || diagnosis?.nextSteps?.[0] || diagnosis?.weaknesses?.[0] || 'MET focus';
  return `${date} - ${String(focus).slice(0, 48)}`;
}
