import { useEffect, useState } from 'react';
import { Icon, SectionHeader, Card, Pill, Avatar, Button } from '../components/shared.jsx';
import { getStudentCycleState, clearWorkflowData } from '../lib/workflow.js';

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const STAGE_CONFIG = {
  'needs-diagnosis':    { label: 'Needs Diagnosis',  tone: 'danger',  action: 'Run Diagnosis',     targetView: 'tool:diagnostic' },
  'diagnosed':          { label: 'Diagnosed',         tone: 'info',    action: 'Send Feedback',     targetView: 'tool:diagnostic' },
  'feedback-sent':      { label: 'Feedback Sent',     tone: 'info',    action: 'Assign Homework',   targetView: 'tool:homework' },
  'homework-assigned':  { label: 'HW Assigned',       tone: 'warning', action: 'Waiting...',        targetView: 'tool:homework' },
  'submitted':          { label: 'Submitted',         tone: 'success', action: 'Review Submission', targetView: 'tool:homework' },
  'reviewed':           { label: 'Reviewed',          tone: 'success', action: 'New Diagnosis',     targetView: 'tool:diagnostic' },
};

export default function TeacherHome({ students, onOpenTool, onSelectStudent }) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const [cycleStates, setCycleStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    let live = true;
    async function loadCycles() {
      const entries = await Promise.all(
        students.map(async (s) => [s.id, await getStudentCycleState(s.id)])
      );
      if (!live) return;
      setCycleStates(Object.fromEntries(entries));
      setLoading(false);
    }
    void loadCycles();
    window.addEventListener('focus', loadCycles);
    window.addEventListener('vv:students-updated', loadCycles);
    return () => {
      live = false;
      window.removeEventListener('focus', loadCycles);
      window.removeEventListener('vv:students-updated', loadCycles);
    };
  }, [students]);

  const studentsWithCycle = students.map(s => ({
    ...s,
    cycle: cycleStates[s.id] || { cycleStage: 'needs-diagnosis', latestDiagnosis: null, pendingHomework: [], pendingSubmissions: [], daysSinceLastDiagnosis: null },
  }));

  const filtered = stageFilter === 'all'
    ? studentsWithCycle
    : studentsWithCycle.filter(s => s.cycle.cycleStage === stageFilter);

  const urgencySorted = [...filtered].sort((a, b) => {
    const order = ['submitted', 'needs-diagnosis', 'diagnosed', 'feedback-sent', 'homework-assigned', 'reviewed'];
    return order.indexOf(a.cycle.cycleStage) - order.indexOf(b.cycle.cycleStage);
  });

  const stageCounts = {};
  studentsWithCycle.forEach(s => {
    stageCounts[s.cycle.cycleStage] = (stageCounts[s.cycle.cycleStage] || 0) + 1;
  });

  const needsAttention = studentsWithCycle.filter(s =>
    s.cycle.cycleStage === 'submitted' ||
    s.cycle.cycleStage === 'needs-diagnosis' ||
    (s.cycle.daysSinceLastDiagnosis !== null && s.cycle.daysSinceLastDiagnosis > 14)
  );

  const totalDiagnoses = Object.values(cycleStates).reduce((sum, c) => sum + (c.totalDiagnoses || 0), 0);
  const pendingReviews = studentsWithCycle.filter(s => s.cycle.cycleStage === 'submitted').length;

  const handleAction = (student) => {
    const config = STAGE_CONFIG[student.cycle.cycleStage] || STAGE_CONFIG['needs-diagnosis'];
    if (onSelectStudent) onSelectStudent(student.id, config.targetView);
  };

  return (
    <div className="page-shell">
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--accent-deep)", margin: 0 }}>
            Good {timeOfDay()}, Vini.
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", margin: "4px 0 0" }}>
            {today} — Your teaching cycle at a glance.
          </p>
        </div>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          <StatCard label="Students" value={students.length} icon={<Icon.student size={16} />} />
          <StatCard label="Total Diagnoses" value={totalDiagnoses} icon={<Icon.diagnose size={16} />} />
          <StatCard label="Pending Reviews" value={pendingReviews} icon={<Icon.homework size={16} />} tone={pendingReviews > 0 ? "warning" : ""} />
          <StatCard label="Need Attention" value={needsAttention.length} icon={<Icon.spark size={16} />} tone={needsAttention.length > 0 ? "danger" : ""} />
        </div>

        {/* Attention queue */}
        {needsAttention.length > 0 && (
          <Card style={{ marginBottom: 24, border: "1.5px solid var(--warning-soft)", background: "var(--warning-bg)" }}>
            <SectionHeader title="Needs Your Attention" icon={<Icon.spark size={16} />} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {needsAttention.slice(0, 5).map(s => {
                const config = STAGE_CONFIG[s.cycle.cycleStage] || STAGE_CONFIG['needs-diagnosis'];
                const staleNote = s.cycle.daysSinceLastDiagnosis > 14
                  ? ` — ${s.cycle.daysSinceLastDiagnosis}d since last diagnosis`
                  : '';
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                    <Avatar name={s.name} size={26} />
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, flex: 1 }}>{s.firstName}</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>{config.label}{staleNote}</span>
                    <Button variant="primary" size="sm" onClick={() => handleAction(s)}>{config.action}</Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Stage filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <SectionHeader title="Student Cycle Board" icon={<Icon.home size={16} />} />
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
            <FilterPill label="All" count={students.length} active={stageFilter === 'all'} onClick={() => setStageFilter('all')} />
            {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
              <FilterPill key={key} label={cfg.label} count={stageCounts[key] || 0} active={stageFilter === key} onClick={() => setStageFilter(key)} />
            ))}
          </div>
        </div>

        {/* Student cycle board */}
        {loading ? (
          <Card><p style={{ color: "var(--muted)", padding: 20 }}>Loading cycle states...</p></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {urgencySorted.length === 0 && (
              <Card><p style={{ color: "var(--muted)", padding: 16 }}>No students match this filter.</p></Card>
            )}
            {urgencySorted.map(s => {
              const config = STAGE_CONFIG[s.cycle.cycleStage] || STAGE_CONFIG['needs-diagnosis'];
              const diag = s.cycle.latestDiagnosis;
              const focusSummary = diag?.content?.priorities?.[0]?.area || diag?.content?.overall_result?.slice(0, 80) || '';
              const diagDate = diag ? new Date(diag.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';

              return (
                <Card key={s.id} style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <Avatar name={s.name} size={34} />
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-md)" }}>{s.name}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginTop: 2 }}>
                        {s.band} → {s.bandTarget} · Session {s.session}/{s.totalSessions} · Last dx: {diagDate}
                      </div>
                      {focusSummary && (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-2)", marginTop: 3, fontStyle: "italic" }}>
                          Focus: {focusSummary.length > 70 ? focusSummary.slice(0, 70) + '...' : focusSummary}
                        </div>
                      )}
                    </div>
                    <Pill tone={config.tone}>{config.label}</Pill>
                    {s.cycle.pendingHomework.length > 0 && (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--warning)" }}>{s.cycle.pendingHomework.length} HW pending</span>
                    )}
                    {s.cycle.pendingSubmissions.length > 0 && (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--success)", fontWeight: 600 }}>{s.cycle.pendingSubmissions.length} to review</span>
                    )}
                    <Button
                      variant={config.tone === 'success' && s.cycle.cycleStage === 'submitted' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handleAction(s)}
                    >
                      {config.action}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Danger zone */}
        <details style={{ marginTop: 40 }}>
          <summary style={{ fontSize: "var(--text-xs)", color: "var(--danger)", cursor: "pointer", userSelect: "none" }}>
            Danger zone
          </summary>
          <div style={{ marginTop: 10 }}>
            <Button variant="danger" size="sm" onClick={async () => {
              if (confirm('Clear ALL workflow data? This cannot be undone.')) {
                await clearWorkflowData();
                window.location.reload();
              }
            }}>
              Clear all workflow data
            </Button>
          </div>
        </details>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, tone }) {
  const bg = tone === 'warning' ? 'var(--warning-bg)' : tone === 'danger' ? 'var(--danger-bg)' : 'var(--surface)';
  const fg = tone === 'warning' ? 'var(--warning)' : tone === 'danger' ? 'var(--danger)' : 'var(--accent-deep)';
  return (
    <Card style={{ padding: "14px 16px", background: bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: fg }}>{icon}</span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", flex: 1 }}>{label}</span>
      </div>
      <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: fg, marginTop: 4 }}>{value}</div>
    </Card>
  );
}

function FilterPill({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "4px 10px", borderRadius: "var(--radius-pill)",
        border: active ? "1.5px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--accent-subtle)" : "var(--surface)",
        color: active ? "var(--accent)" : "var(--muted)",
        fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer",
        fontFamily: "var(--font-ui)",
      }}
    >
      {label}
      {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
    </button>
  );
}
