import { Icon } from './ui/icons.jsx';
import { Pill } from './ui/Pill.jsx';

/* ─── REVIEW STATUS BADGE ────────────────────────────────────── */
const STATUS_TONE = {
  'not-started':'muted', 'in-progress':'info', 'submitted':'warning',
  'corrected':'success', 'revision-requested':'danger', 'completed':'success',
  'draft':'muted', 'queued':'info', 'reviewed':'success', 'overdue':'danger',
};
const STATUS_LABEL = {
  'not-started':'Not started', 'in-progress':'In progress', 'submitted':'Submitted',
  'corrected':'Corrected', 'revision-requested':'Revision needed', 'completed':'Completed',
  'draft':'Draft', 'queued':'Queued', 'reviewed':'Reviewed', 'overdue':'Overdue',
};
export function ReviewStatusBadge({ status }) {
  const tone = STATUS_TONE[status] || 'muted';
  const label = STATUS_LABEL[status] || 'Not started';
  return <Pill tone={tone} dot role="status" aria-label={`Status: ${label}`}>{label}</Pill>;
}

/* ─── STUDENT FEEDBACK VIEW ──────────────────────────────────── */
export function StudentFeedbackView({ feedback }) {
  if (!feedback || typeof feedback !== 'object') return null;
  const wins = (Array.isArray(feedback.whatYouDidWell) ? feedback.whatYouDidWell : [])
    .filter(w => w && (w.strength || w.explanation));
  const fixes = (Array.isArray(feedback.whatToImprove) ? feedback.whatToImprove : [])
    .filter(f => f && (f.area || f.howToImprove || f.insteadOf || f.sayInstead));
  const card = {
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    padding: 16, background: 'var(--surface)',
  };
  const cardTitle = {
    fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: '65ch', margin: '0 auto' }}>
      {feedback.classFocus && (
        <div style={card}>
          <div style={{ ...cardTitle, color: 'var(--primary)' }}>Current focus</div>
          <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.75, color: 'var(--text)', margin: 0 }}>{feedback.classFocus}</p>
        </div>
      )}
      {wins.length > 0 && (
        <div style={card}>
          <div style={{ ...cardTitle, color: 'var(--accent-text)' }}><Icon.check size={13} /> What's working</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {wins.map((w, i) => (
              <div key={i} style={{ padding: 12, background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)' }}>
                {w.strength && <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{w.strength}</div>}
                {w.explanation && <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, margin: 0, color: 'var(--text)' }}>{w.explanation}</p>}
                {w.example && <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, margin: '4px 0 0', color: 'var(--text-2)', fontStyle: 'italic' }}>"{w.example}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {fixes.length > 0 && (
        <div style={card}>
          <div style={{ ...cardTitle, color: 'var(--primary)' }}>Focus for next time</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {fixes.map((f, i) => (
              <div key={i} style={{ padding: 12, background: 'var(--teal-soft)', borderRadius: 'var(--radius-sm)' }}>
                {f.area && <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{f.area}</div>}
                {(f.insteadOf || f.sayInstead) && (
                  <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, margin: '0 0 4px', color: 'var(--text-2)' }}>
                    {f.insteadOf && <>{f.insteadOf}</>}
                    {f.insteadOf && f.sayInstead && <> → </>}
                    {f.sayInstead && <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>{f.sayInstead}</span>}
                  </p>
                )}
                {f.howToImprove && <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, margin: 0, color: 'var(--text)' }}>{f.howToImprove}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {feedback.finalNote && (
        <div style={card}>
          <div style={{ ...cardTitle, color: 'var(--muted)' }}>From your teacher</div>
          <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.75, margin: 0, color: 'var(--text-2)' }}>{feedback.finalNote}</p>
        </div>
      )}
    </div>
  );
}


/* ─── EVIDENCE CARD ──────────────────────────────────────────── */
export function EvidenceCard({ label, children }) {
  return (
    <div className="evidence-card">
      {label && <div className="evidence-card-label">{label}</div>}
      <div className="evidence-card-text">{children}</div>
    </div>
  );
}

/* ─── MINI BARS ──────────────────────────────────────────────── */
export function MiniBars({ values = [], max }) {
  const peak = max || Math.max(...values, 1);
  return (
    <div className="mini-bars">
      {values.map((v, i) => (
        <div key={i} className={`mini-bar ${i === values.length - 1 ? 'lit' : ''}`}
          style={{ height: `${Math.max(10, (v / peak) * 100)}%` }} />
      ))}
    </div>
  );
}

/* ─── STUDENT FLOW ───────────────────────────────────────────── */
export const STUDENT_FLOW = [
  { id:'home', label:'Home' },
  { id:'do', label:'Do homework' },
  { id:'submit', label:'Submit' },
  { id:'review', label:'Review feedback' },
  { id:'improve', label:'Practice Studio' },
];

/* ─── WORKFLOW STAGE STRIP ───────────────────────────────────── */
const WORKFLOW_STAGES = [
  { id:'diagnose', label:'1 · Diagnose' },
  { id:'feedback', label:'2 · Feedback' },
  { id:'homework', label:'3 · Homework' },
];
export function WorkflowStageStrip({ active, onStage, stages, onStageClick }) {
  const list = stages || WORKFLOW_STAGES;
  const activeIdx = list.findIndex(s => s.id === active);
  return (
    <nav className="workflow-strip" aria-label="Workflow steps">
      {list.map((s, i) => (
        <span key={s.id} style={{ display:'flex', alignItems:'center' }}>
          <button
            className={`workflow-step ${active === s.id ? 'active' : ''} ${i < activeIdx ? 'done' : ''}`}
            aria-current={active === s.id ? 'step' : undefined}
            onClick={() => (onStage || onStageClick)?.(s.id)}
          >
            {i < activeIdx && <Icon.check size={11} />}
            {s.label}
          </button>
          {i < list.length - 1 && <span className="workflow-sep" aria-hidden="true">›</span>}
        </span>
      ))}
    </nav>
  );
}

/* ─── STUDENT NEXT TASK ──────────────────────────────────────── */
export function StudentNextTask({ task, onAction, onStart, onSecondary }) {
  if (!task) return null;
  const primaryAction = task.action || 'start';
  const handlePrimary = () => {
    if (onAction) return onAction(primaryAction);
    if (onStart) return onStart(primaryAction);
  };
  const handleSecondary = () => {
    if (onAction) return onAction('secondary');
    if (onSecondary) return onSecondary();
  };
  return (
    <div style={{
      background:'var(--primary)', color:'#fff', borderRadius:'var(--radius-lg)',
      padding:'16px 20px', display:'flex', alignItems:'center',
      justifyContent:'space-between', gap:12,
    }}>
      <div>
        <div style={{ fontSize:'var(--text-xs)', color:'var(--on-dark-muted)', fontWeight:600,
          textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Up next</div>
        <div style={{ fontWeight:700, fontSize:'var(--text-base)' }}>{task.title}</div>
        {(task.sub || task.description) && <div style={{ fontSize:'var(--text-sm)', color:'var(--on-dark-muted)', marginTop:2 }}>{task.sub || task.description}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={handlePrimary} style={{
          background:'rgba(255,255,255,0.15)', color:'#fff', border:'none',
          borderRadius:'var(--radius-md)', padding:'8px 16px',
          fontSize:'var(--text-sm)', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)',
        }}>Start</button>
        {(onSecondary || onAction) && (
          <button onClick={handleSecondary} style={{
            background:'rgba(255,255,255,0.08)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)',
            borderRadius:'var(--radius-md)', padding:'8px 12px',
            fontSize:'var(--text-sm)', fontWeight:500, cursor:'pointer', fontFamily:'var(--font-sans)',
          }}>Inbox</button>
        )}
      </div>
    </div>
  );
}

/* ─── RECOMMENDED NEXT STEP ──────────────────────────────────── */
export function RecommendedNextStep({ title, detail, message, stage, status, icon, onAction, actionTarget, actionLabel }) {
  const finalDetail = detail || message || '';
  const buttonLabel = actionLabel || 'Open';
  return (
    <div style={{
      background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)',
      padding:'16px 18px', display:'flex', alignItems:'flex-start', gap:14,
    }}>
      {icon && (
        <div style={{
          width:38, height:38, borderRadius:'var(--radius-md)',
          background:'var(--accent-soft)', color:'var(--accent)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>{icon}</div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:'var(--text-sm)', marginBottom:3 }}>{title}</div>
        {finalDetail && <div style={{ fontSize:'var(--text-xs)', color:'var(--muted)', lineHeight:1.5 }}>{finalDetail}</div>}
        {(stage || status) && (
          <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
            {stage && <Pill tone="accent">{stage}</Pill>}
            {status && <ReviewStatusBadge status={status} />}
          </div>
        )}
      </div>
      {actionTarget && (
        <button onClick={() => onAction?.(actionTarget)} style={{
          background:'var(--accent)', color:'#fff', border:'none',
          borderRadius:'var(--radius-md)', padding:'7px 14px',
          fontSize:'var(--text-xs)', fontWeight:600, cursor:'pointer',
          fontFamily:'var(--font-sans)', flexShrink:0,
        }}>{buttonLabel} →</button>
      )}
    </div>
  );
}
