import { Icon, SectionHeader } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

export default function MockTestPage() {
  return (
    <div className="page-shell">
      <div className="hero-section hero-section--inbox" style={{ marginBottom: 'var(--space-5)' }}>
        <SectionHeader
          title="Mock Tests"
          subtitle="Full-length MET practice exams for your students"
        />
      </div>

      <div className="split-grid">
        <Card className="card-p-5" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Icon.practice size={24} />
            <div>
              <div className="row-title">MET Mock Test 2</div>
              <div className="row-sub">Full-length practice exam · ~3.5 hours</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
            <span className="pill pill--accent">Listening</span>
            <span className="pill pill--accent">Reading &amp; Grammar</span>
            <span className="pill pill--accent">Writing</span>
            <span className="pill pill--accent">Speaking</span>
          </div>
          <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
            Complete MET practice exam covering all four competencies.
            50 listening questions, 30 reading &amp; grammar questions,
            2 writing tasks, and 5 speaking prompts with audio recording.
          </p>
          <Button variant="primary" onClick={() => window.open('https://met-mock-test-2.vercel.app', '_blank')}>
            <Icon.practice size={14} /> Launch Mock Test
          </Button>
        </Card>
      </div>
    </div>
  );
}
