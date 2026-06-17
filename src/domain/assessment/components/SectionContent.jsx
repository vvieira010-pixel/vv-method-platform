import { Icon, Pill } from '../../../components/shared.jsx';
import { StudentFeedbackView } from '../../../components/domain-ui.jsx';

export function camelToLabel(str) {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

export function PrereqIcon({ ok, required }) {
  return (
    <span style={{ width: 20, height: 20, borderRadius: '50%', background: ok ? 'var(--success)' : required ? 'var(--danger)' : 'var(--muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {ok ? <Icon.check size={11} color="#fff" /> : <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{required ? '!' : '?'}</span>}
    </span>
  );
}

function EmptySectionNote({ message }) {
  return (
    <div style={{ padding: 14, background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon.refresh size={14} color="var(--warning)" />
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--warning)' }}>{message}</span>
    </div>
  );
}

function KeyValueCards({ content }) {
  if (!content || typeof content !== 'object') return null;
  const entries = Array.isArray(content) ? content.map((v, i) => [`${i + 1}`, v]) : Object.entries(content);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>{camelToLabel(String(k))}</div>
          <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, color: Array.isArray(v) && v.length === 0 ? 'var(--muted)' : 'inherit', fontStyle: Array.isArray(v) && v.length === 0 ? 'italic' : 'normal' }}>
            {typeof v === 'object' ? (Array.isArray(v) ? (v.length === 0 ? 'None identified' : v.map((item, j) => <div key={j}>• {item !== null && typeof item === 'object' ? Object.values(item).join(' — ') : String(item)}</div>)) : Object.entries(v).map(([sk, sv]) => `${camelToLabel(sk)}: ${sv}`).join(' · ')) : String(v)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionContent({ sectionKey, content }) {
  if (!content) return <EmptySectionNote message="Not generated — click Regen to retry this section." />;

  if (typeof content === 'object' && !Array.isArray(content) && Object.keys(content).length === 0) {
    return <EmptySectionNote message="Not generated — click Regen to retry this section." />;
  }

  if (typeof content === 'string' && content.trim() === '') {
    return <EmptySectionNote message="Not generated — click Regen to retry this section." />;
  }

  if (sectionKey === 'classSummary') {
    return <p style={{ lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>{String(content)}</p>;
  }

  if (sectionKey === 'studentFeedback' && typeof content === 'object') {
    return <StudentFeedbackView feedback={content} />;
  }

  if (sectionKey === 'errorBankSuggestions' && Array.isArray(content)) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Error', 'Correct', 'Category', 'Priority', 'Save?'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: 'var(--muted)' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {content.map((err, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--divider)' }}>
                <td style={{ padding: '6px 8px', color: 'var(--danger)', fontWeight: 600 }}>{err.error}</td>
                <td style={{ padding: '6px 8px', color: 'var(--success)', fontWeight: 600 }}>{err.correct}</td>
                <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>{err.category}</td>
                <td style={{ padding: '6px 8px' }}><Pill tone={err.priority === 'high' ? 'danger' : err.priority === 'medium' ? 'warning' : 'muted'}>{err.priority}</Pill></td>
                <td style={{ padding: '6px 8px' }}>{err.saveToProfile !== false ? <Icon.check size={12} /> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (sectionKey === 'priorityDiagnosis' && Array.isArray(content)) {
    if (content.length === 0) {
      return <EmptySectionNote message="No priority items were generated — click Regen to retry this section." />;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {content.map((p, i) => (
          <div key={i} style={{ padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Pill tone={p.urgency === 'Critical' ? 'danger' : p.urgency === 'Developing' ? 'warning' : 'info'}>{p.urgency}</Pill>
              <strong style={{ fontSize: 'var(--text-sm)' }}>{p.area}</strong>
            </div>
            {p.evidence && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic', marginBottom: 4 }}>Evidence: {p.evidence}</div>}
            <div style={{ fontSize: 'var(--text-sm)' }}>{p.whatToImprove}</div>
            {p.howToImprove && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 4 }}>How: {p.howToImprove}</div>}
          </div>
        ))}
      </div>
    );
  }

  if (sectionKey === 'skillDiagnosis' && typeof content === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(content).map(([skill, data]) => (
          <div key={skill} style={{ padding: 14, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: 'var(--text-sm)' }}>{skill}</span>
              {data?.evaluated === false ? (
                <Pill tone="muted">Not evaluated</Pill>
              ) : (
                <>
                  {data?.score0to80 != null && <Pill tone={data.score0to80 >= 55 ? 'success' : data.score0to80 >= 40 ? 'warning' : 'danger'}>{data.score0to80}/80</Pill>}
                  {data?.scoreConfidenceLevel && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{data.scoreConfidenceLevel}</span>}
                </>
              )}
            </div>
            {data?.evaluated === false ? (
              <p style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', fontStyle: 'italic', margin: 0 }}>{data.diagnosis || 'Not evaluated — no evidence.'}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data?.strengths?.length > 0 && data.strengths.map((s, j) => (
                  <div key={j} style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon.check size={12} /> {s}</div>
                ))}
                {data?.weaknesses?.length > 0 && data.weaknesses.map((w, j) => (
                  <div key={j} style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon.close size={12} /> {w}</div>
                ))}
                {data?.mainIssues?.length > 0 && data.mainIssues.map((iss, j) => (
                  <div key={j} style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon.close size={12} /> {iss}</div>
                ))}
                {data?.whatToImproveNext && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 2 }}>Next: {data.whatToImproveNext}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (sectionKey === 'homeworkRecommendation' && typeof content === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', marginBottom: 4 }}>{content.title}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>{content.objective}</div>
        </div>
        {content.instructions && (
          <div style={{ padding: 12, background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{content.instructions}</div>
        )}
        {Array.isArray(content.tasks) && content.tasks.map((t, i) => (
          <div key={i} style={{ padding: 14, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent)' }}>Task {t.taskNumber || i + 1}</span>
              {t.type && <Pill tone="accent">{t.type}</Pill>}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 6 }}>{typeof t === 'string' ? t : t.description}</div>
            {t.content && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 6 }}>{t.content}</div>}
            {t.example && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>Example: {t.example}</div>}
          </div>
        ))}
        {content.teacherNotes && (
          <div style={{ padding: 10, background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--warning)' }}>
            <strong>Teacher notes:</strong> {content.teacherNotes}
          </div>
        )}
      </div>
    );
  }

  if (sectionKey === 'nextClassFocus' && typeof content === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(content).map(([k, v]) => (
          <div key={k} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>{camelToLabel(k)}</div>
            <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text)' }}>{String(v)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (sectionKey === 'profileUpdateSuggestions' && typeof content === 'object' && !Array.isArray(content)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(content).map(([k, v]) => (
          <div key={k} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>{camelToLabel(k)}</div>
            {Array.isArray(v) ? (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
                {v.map((item, j) => <li key={j}>{String(item)}</li>)}
              </ul>
            ) : (
              <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{String(v)}</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (sectionKey === 'vocabGrammarTargets' && typeof content === 'object') {
    const vocab = Array.isArray(content.vocabularyTargets) ? content.vocabularyTargets : [];
    const grammar = Array.isArray(content.grammarTargets) ? content.grammarTargets : [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {vocab.length > 0 && (
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Vocabulary Targets</div>
            {vocab.map((v, i) => (
              <div key={i} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 'var(--text-sm)' }}>{v.wordOrPhrase}</strong>
                  {v.category && <Pill tone="muted">{v.category}</Pill>}
                </div>
                {v.meaning && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginBottom: 2 }}>{v.meaning}</div>}
                {v.exampleSentence && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>"{v.exampleSentence}"</div>}
              </div>
            ))}
          </div>
        )}
        {grammar.length > 0 && (
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: 8 }}>Grammar Targets</div>
            {grammar.map((g, i) => (
              <div key={i} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 6 }}>
                <strong style={{ fontSize: 'var(--text-sm)' }}>{g.area}</strong>
                {g.issue && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: 4 }}>{g.issue}</div>}
                {g.correction && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', marginTop: 2 }}>{g.correction}</div>}
                {g.practiceDirection && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>Practice: {g.practiceDirection}</div>}
              </div>
            ))}
          </div>
        )}
        {vocab.length === 0 && grammar.length === 0 && (
          <EmptySectionNote message="No vocabulary or grammar targets were generated — click Regen to retry this section." />
        )}
      </div>
    );
  }

  if (sectionKey === 'readinessCheck' && typeof content === 'object') {
    const fmt = (v) => {
      if (v === true) return 'Yes';
      if (v === false) return 'No';
      return String(v);
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(content).map(([k, v]) => {
          if (Array.isArray(v) && v.length === 0) return null;
          return (
            <div key={k} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>{camelToLabel(k)}</div>
              <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text)' }}>
                {Array.isArray(v)
                  ? v.map((item, j) => <div key={j}>• {camelToLabel(String(item))}</div>)
                  : fmt(v)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (sectionKey === 'targetScoreRelevance' && typeof content === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(content).map(([k, v]) => (
          <div key={k} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>{camelToLabel(k)}</div>
            <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text)' }}>
              {Array.isArray(v) ? v.map((item, j) => <div key={j}>• {typeof item === 'object' ? JSON.stringify(item) : String(item)}</div>) : String(v)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (typeof content === 'object') {
    return <KeyValueCards content={content} />;
  }

  return <p style={{ lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>{String(content)}</p>;
}
