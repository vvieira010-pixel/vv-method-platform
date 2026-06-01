/**
 * submissions.jsx — Submission review workspace
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getAllSubmissions, getHomework, getReviews } from '../lib/workflow.js';

export default function SubmissionsPage({ students, onNavigate, workspaceQuery = '' }) {
  const [submissions, setSubmissions] = useState([]);
  const [homework, setHomework] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [subs, hw, revs] = await Promise.all([getAllSubmissions(), getHomework(), getReviews()]);
    setSubmissions(subs || []);
    setHomework(hw || []);
    setReviews(revs || []);
    setLoading(false);
  }

  const reviewedIds = new Set(reviews.map((r) => r.submissionId));
  const query = (localSearch || workspaceQuery || '').trim().toLowerCase();

  const records = submissions
    .map((sub) => {
      const student = students.find((s) => s.id === sub.studentId);
      const hw = homework.find((h) => h.id === sub.homeworkId);
      const reviewed = reviewedIds.has(sub.id);
      return {
        sub,
        student,
        hw,
        reviewed,
        submittedAt: sub.submittedAt || sub.createdAt,
      };
    })
    .filter((item) => {
      if (statusFilter === 'pending' && (item.reviewed || item.sub.status !== 'submitted')) return false;
      if (statusFilter === 'reviewed' && !item.reviewed) return false;
      if (statusFilter === 'late') {
        const due = item.hw?.dueDate ? new Date(item.hw.dueDate).getTime() : null;
        const submitted = item.submittedAt ? new Date(item.submittedAt).getTime() : null;
        if (!due || !submitted || submitted <= due) return false;
      }

      if (query) {
        const haystack = `${item.student?.name || ''} ${item.hw?.title || ''} ${item.sub.status || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    })
    .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());

  const pendingCount = submissions.filter((s) => s.status === 'submitted' && !reviewedIds.has(s.id)).length;
  const reviewedCount = submissions.filter((s) => reviewedIds.has(s.id)).length;
  const lateCount = submissions.filter((s) => {
    const hw = homework.find((h) => h.id === s.homeworkId);
    if (!hw?.dueDate || !s.submittedAt) return false;
    return new Date(s.submittedAt).getTime() > new Date(hw.dueDate).getTime();
  }).length;

  return (
    <div style={S.shell}>
      <section style={S.hero}>
        <div>
          <div style={S.heroTag}>Submission Repository</div>
          <h1 style={S.headline}>Review Queue</h1>
          <p style={S.sub}>Keep homework feedback fast, clear, and teacher-approved before students read their review.</p>
        </div>
        <Button variant="primary" onClick={() => onNavigate('submissions', {})}><Icon.doc size={14} /> Open Pending</Button>
      </section>

      <div style={S.kpiGrid}>
        <RepoKpi label="Pending" value={pendingCount} icon={<Icon.warning size={15} />} tone="warning" />
        <RepoKpi label="Reviewed" value={reviewedCount} icon={<Icon.check size={15} />} tone="success" />
        <RepoKpi label="Late submissions" value={lateCount} icon={<Icon.calendar size={15} />} tone="danger" />
        <RepoKpi label="Total received" value={submissions.length} icon={<Icon.spark size={15} />} tone="info" />
      </div>

      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={S.filterGrid}>
          <input className="input" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search by student, homework title..." />
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="pending">Pending review</option>
            <option value="reviewed">Reviewed</option>
            <option value="late">Late submissions</option>
            <option value="all">All submissions</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card style={{ padding: 30, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Loading submissions...</p>
        </Card>
      ) : records.length === 0 ? (
        <Card style={{ padding: 30, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>No submissions found for current filters.</p>
        </Card>
      ) : (
        <div style={S.repoGrid}>
          {records.map(({ sub, student, hw, reviewed, submittedAt }) => {
            const submittedLabel = submittedAt
              ? new Date(submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Unknown date';
            const dueTime = hw?.dueDate ? new Date(hw.dueDate).getTime() : null;
            const submittedTime = submittedAt ? new Date(submittedAt).getTime() : null;
            const isLate = Boolean(dueTime && submittedTime && submittedTime > dueTime);

            return (
              <Card key={sub.id} style={{ padding: 16, border: !reviewed ? '1px solid var(--warning-soft)' : '1px solid var(--border)' }}>
                <div style={S.rowTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar name={student?.name || '?'} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div style={S.rowTitle}>{student?.name || 'Unknown student'}</div>
                      <div style={S.rowSub}>{hw?.title || 'Homework submission'} · Submitted {submittedLabel}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Pill tone={reviewed ? 'success' : 'warning'}>{reviewed ? 'reviewed' : 'needs review'}</Pill>
                    {isLate && <Pill tone="danger">late</Pill>}
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'grid', gap: 7 }}>
                  <div style={S.metaLine}><Icon.doc size={12} /> Status: {sub.status || 'submitted'}</div>
                  {hw?.dueDate && <div style={S.metaLine}><Icon.calendar size={12} /> Due: {new Date(hw.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>}
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button variant={reviewed ? 'ghost' : 'primary'} size="sm" onClick={() => onNavigate('submissions:review', { submissionId: sub.id })}>
                    {reviewed ? 'View Review' : 'Review Submission'}
                  </Button>
                  {student?.id && (
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('students:profile', { studentId: student.id })}>Open Student</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RepoKpi({ label, value, icon, tone }) {
  const bg = tone === 'success'
    ? 'var(--success-bg)'
    : tone === 'warning'
      ? 'var(--warning-bg)'
      : tone === 'danger'
        ? 'var(--danger-bg)'
        : 'var(--surface)';

  return (
    <Card style={{ padding: 14, background: bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent-deep)' }}>{value}</div>
    </Card>
  );
}

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
    background: 'linear-gradient(130deg, #0f2438 0%, #17344b 45%, #2b5b73 100%)',
    color: '#fff',
  },
  heroTag: { fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9fd6d6', fontWeight: 700, marginBottom: 6 },
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#fff', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,.78)', margin: '4px 0 0', maxWidth: 620 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 },
  repoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 },
  rowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  rowTitle: { fontWeight: 700, fontSize: 'var(--text-md)' },
  rowSub: { fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 },
  metaLine: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-2)' },
};
