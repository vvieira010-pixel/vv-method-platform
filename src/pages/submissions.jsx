import { useState, useEffect } from 'react';
import { Icon, SectionHeader, Pill, Avatar } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { getAllSubmissions, getHomework, getReviews, deleteSubmission, deleteReview } from '../lib/workflow.js';

export default function SubmissionsPage({ students, onNavigate }) {
  const [submissions, setSubmissions] = useState([]);
  const [homework, setHomework] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    (async () => {
      const [subs, hw, revs] = await Promise.all([getAllSubmissions(), getHomework(), getReviews()]);
      setSubmissions(subs || []);
      setHomework(hw || []);
      setReviews(revs || []);
    })();
  }, []);

  const reviewedIds = new Set(reviews.map(r => r.submissionId));
  const filtered = submissions.filter(s => {
    if (filter === 'pending') return s.status === 'submitted' && !reviewedIds.has(s.id);
    if (filter === 'reviewed') return reviewedIds.has(s.id);
    return true;
  });

  const pendingCount = submissions.filter(s => s.status === 'submitted' && !reviewedIds.has(s.id)).length;

  return (
    <div className="page-shell">
      <SectionHeader
        title="Submissions"
        sub={`${pendingCount} pending review · ${submissions.length} total`}
      />

      <div className="page-filters">
        {['pending', 'reviewed', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`hw-filter-btn${filter === f ? ' active' : ''}`}
            style={{ textTransform: 'capitalize' }}>
            {f} {f === 'pending' ? `(${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="page-empty-state">
          <p style={{ color: 'var(--muted)' }}>{filter === 'pending' ? 'No submissions awaiting review.' : 'No submissions found.'}</p>
        </Card>
      ) : (
        <div className="grid-square">
          {filtered.map(sub => {
            const student = students.find(s => s.id === sub.studentId);
            const hw = homework.find(h => h.id === sub.homeworkId);
            const review = reviews.find(r => r.submissionId === sub.id);
            const reviewed = !!review;
            return (
              <Card key={sub.id} className="square-card" style={!reviewed ? { border: '1px solid var(--warning-soft)' } : undefined}>
                <Avatar name={student?.name || '?'} size={40} />
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center', marginTop: 8 }}>{student?.name || 'Unknown'}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textAlign: 'center', marginBottom: 8 }}>
                  {hw?.title || 'Homework submission'}
                </div>
                <Pill tone={reviewed ? 'success' : 'warning'} style={{ marginBottom: 12 }}>{reviewed ? 'Reviewed' : 'Needs Review'}</Pill>
                <div style={{ marginTop: 'auto', width: '100%', display: 'flex', gap: 4, justifyContent: 'center' }}>
                  <Button variant={reviewed ? 'ghost' : 'primary'} size="sm" onClick={() => onNavigate('submissions:review', { submissionId: sub.id })}>
                    {reviewed ? 'View Review' : 'Review'}
                  </Button>
                  {reviewed && (
                    <Button variant="ghost" size="sm" style={{ color: 'var(--warning)' }} onClick={async () => { if (confirm('Delete this teacher review? The submission will return to Needs Review.')) { await deleteReview(review.id); load(); } }}>
                      Del
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={async () => { if (confirm('Delete this submission and its review?')) { await deleteSubmission(sub.id); load(); } }}>
                    <Icon.trash size={12} />
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

