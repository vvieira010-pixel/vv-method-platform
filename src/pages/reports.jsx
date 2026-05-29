import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Button, Avatar } from '../components/shared.jsx';
import { getDiagnoses, getHomework, getErrorBank, getAllSubmissions, getProgressNotes } from '../lib/workflow.js';

export default function ReportsPage({ students, onNavigate }) {
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id || '');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generateReport() {
    if (!selectedStudent) return;
    setLoading(true);
    const student = students.find(s => s.id === selectedStudent);
    const [diagnoses, homework, errors, submissions, notes] = await Promise.all([
      getDiagnoses(selectedStudent),
      getHomework(selectedStudent),
      getErrorBank(selectedStudent),
      getAllSubmissions().then(all => (all || []).filter(s => s.studentId === selectedStudent)),
      getProgressNotes(selectedStudent),
    ]);

    const approved = diagnoses.filter(d => d.status === 'approved');
    const completedHw = homework.filter(h => h.status === 'completed' || h.status === 'corrected' || h.status === 'reviewed');
    const activeErrors = errors.filter(e => e.status === 'active');
    const solvedErrors = errors.filter(e => e.status === 'solved');

    setReport({ student, diagnoses, approved, homework, completedHw, errors, activeErrors, solvedErrors, submissions, notes });
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 20px' }}>
      <h1 style={S.headline}>Reports</h1>
      <p style={S.sub}>Generate progress reports per student.</p>

      <Card style={{ padding: 18, marginTop: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Student</span>
            <select className="input" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <Button variant="primary" onClick={generateReport} disabled={loading}>{loading ? 'Generating…' : 'Generate Report'}</Button>
          {report && <Button variant="ghost" onClick={() => window.print()}>Print</Button>}
        </div>
      </Card>

      {report && (
        <div id="report-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header */}
          <Card style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={report.student.name} size={48} />
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', margin: 0 }}>{report.student.name}</h2>
                <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 'var(--text-sm)' }}>
                  {report.student.currentLevel} → {report.student.targetLevel} · {report.student.examGoal}
                </p>
                <p style={{ color: 'var(--muted)', margin: '2px 0 0', fontSize: 'var(--text-xs)' }}>
                  Report generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Diagnoses', value: report.diagnoses.length, sub: `${report.approved.length} approved` },
              { label: 'Homework', value: `${report.completedHw.length}/${report.homework.length}`, sub: 'completed' },
              { label: 'Active Errors', value: report.activeErrors.length, sub: `${report.solvedErrors.length} solved` },
              { label: 'Submissions', value: report.submissions.length, sub: 'total submitted' },
            ].map(({ label, value, sub }) => (
              <Card key={label} style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--accent-deep)' }}>{value}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>{label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{sub}</div>
              </Card>
            ))}
          </div>

          {/* Diagnoses timeline */}
          {report.approved.length > 0 && (
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Diagnosis History" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {report.approved.slice(0, 5).map((dx, i) => (
                  <div key={dx.id} style={{ padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                      Class #{i + 1} · {new Date(dx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 3, lineHeight: 1.5 }}>
                      {dx.classSummary?.slice(0, 150) || dx.content?.overall_result?.slice(0, 150) || '—'}
                    </div>
                    {dx.sections?.profileUpdateSuggestions?.content?.progressNote && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 4, fontStyle: 'italic' }}>
                        Note: {dx.sections.profileUpdateSuggestions.content.progressNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Active errors */}
          {report.activeErrors.length > 0 && (
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Active Error Patterns" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {report.activeErrors.slice(0, 10).map(err => (
                  <div key={err.id} style={{ display: 'flex', gap: 8, fontSize: 'var(--text-xs)', padding: '4px 8px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{err.error}</span>
                    <span>→</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>{err.correct}</span>
                    <span style={{ color: 'var(--muted)', marginLeft: 'auto' }}>{err.type}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Progress notes */}
          {report.notes.length > 0 && (
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Progress Notes" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {report.notes.slice(0, 6).map(n => (
                  <div key={n.id} style={{ padding: '6px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', marginRight: 8 }}>
                      {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    {n.note}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

const S = {
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '4px 0 0' },
};
