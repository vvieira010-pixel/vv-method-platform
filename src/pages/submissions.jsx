import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getAllSubmissions, getHomework, getReviews } from '../lib/workflow.js';

export default function SubmissionsPage({ students, onNavigate }) {
  const [submissions, setSubmissions] = useState([]);
  const [homework, setHomework] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { load(); }, []);
  async function load() {
    const [subs, hw, revs] = await Promise.all([getAllSubmissions(), getHomework(), getReviews()]);
    setSubmissions(subs || []);
    setHomework(hw || []);
    setReviews(revs || []);
  }

  const reviewedIds = new Set(reviews.map(r => r.submissionId));
  const filtered = submissions.filter(s => {
    if (filter === 'pending') return s.status === 'submitted' && !reviewedIds.has(s.id);
    if (filter === 'reviewed') return reviewedIds.has(s.id);
    return true;
  });

  const pendingCount = submissions.filter(s => s.status === 'submitted' && !reviewedIds.has(s.id)).length;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={S.headline}>Submissions</h1>
        <p style={S.sub}>{pendingCount} pending review · {submissions.length} total</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['pending', 'reviewed', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: `1.5px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`, background: filter === f ? 'var(--accent-subtle)' : 'var(--surface)', color: filter === f ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
            {f} {f === 'pending' ? `(${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>{filter === 'pending' ? 'No submissions awaiting review.' : 'No submissions found.'}</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(sub => {
            const student = students.find(s => s.id === sub.studentId);
            const hw = homework.find(h => h.id === sub.homeworkId);
            const reviewed = reviewedIds.has(sub.id);
            return (
              <Card key={sub.id} style={{ padding: '14px 18px', border: !reviewed ? '1px solid var(--warning-soft)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Avatar name={student?.name || '?'} size={32} />
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700 }}>{student?.name || 'Unknown'}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
                      {hw?.title || 'Homework submission'} · Submitted {new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <Pill tone={reviewed ? 'success' : 'warning'}>{reviewed ? 'Reviewed' : 'Needs Review'}</Pill>
                  <Button variant={reviewed ? 'ghost' : 'primary'} size="sm" onClick={() => onNavigate('submissions:review', { submissionId: sub.id })}>
                    {reviewed ? 'View Review' : 'Review'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S = {
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '4px 0 0' },
};
