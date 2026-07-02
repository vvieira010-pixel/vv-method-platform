import { Icon } from '../shared.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { exercisePreview } from '../../lib/exercise-types.js';

export default function PreviewExercise({ exercise }) {
  if (!exercise) return null;
  switch (exercise.type) {
    case 'mcq':
      return (
        <div>
          <p style={{ fontWeight: 600, marginBottom: 10 }}>{exercise.question || 'Question…'}</p>
          {(exercise.options || []).map((opt, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', marginBottom: 4,
              borderRadius: 0, border: '1px solid var(--border)', background: 'var(--surface)',
            }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
              <span>{opt || `Option ${String.fromCharCode(65 + i)}`}</span>
            </div>
          ))}
        </div>
      );

    case 'blank':
      return (
        <div>
          <p style={{ fontSize: 'var(--text-base)', lineHeight: 2 }}>
            {(exercise.template || 'Sentence with ___ blanks…').split(/(_{3,})/).map((part, i) =>
              /^_{3,}$/.test(part)
                ? <span key={i} style={{ display: 'inline-block', width: 100, borderBottom: '2px solid var(--primary)', textAlign: 'center', margin: '0 4px', color: 'var(--muted)' }}>______</span>
                : <span key={i}>{part}</span>
            )}
          </p>
        </div>
      );

    case 'short':
      return (
        <div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>{exercise.prompt || 'Prompt…'}</p>
          {exercise.rubric && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 8 }}>{exercise.rubric}</p>}
          <div style={{ border: '1px solid var(--border)', borderRadius: 0, padding: 10, background: 'var(--surface)', minHeight: 60, color: 'var(--faint)', fontSize: 'var(--text-sm)' }}>
            Student writes here… (target: {exercise.targetWords || 120} words)
          </div>
        </div>
      );

    case 'speak':
      return (
        <div>
          {exercise.imageUrl && (
            <div style={{ marginBottom: 10, borderRadius: 0, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg)' }}>
              <img
                src={exercise.imageUrl}
                alt={exercise.imageAlt || 'Speaking prompt image'} loading="lazy"
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}
          <div style={{ background: 'var(--surface)', borderRadius: 0, padding: '12px 14px', marginBottom: 10 }}>
            <p style={{ fontWeight: 500, margin: 0 }}>{exercise.prompt || 'Speaking prompt…'}</p>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Target: {exercise.targetSeconds || 60} seconds</span>
          </div>
          <Button variant="primary" size="sm" disabled><Icon.mic size={12} /> Start recording</Button>
        </div>
      );

    case 'order':
      return (
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 8 }}>Put the sentences in the correct order:</p>
          {(exercise.sentences || []).filter(Boolean).map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', marginBottom: 4,
              borderRadius: 0, border: '1px solid var(--border)', background: 'var(--surface)',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)', width: 20, textAlign: 'center' }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{s}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)' }}>↑↓</span>
            </div>
          ))}
        </div>
      );

    case 'fix':
      return (
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 6 }}>Find and correct the errors:</p>
          {exercise.hint && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 0, fontSize: 'var(--text-xs)', marginBottom: 8 }}>
              <Icon.spark size={11} /> {exercise.hint}
            </div>
          )}
          <div style={{ border: '1px solid var(--border)', borderRadius: 0, padding: 10, background: 'var(--surface)', lineHeight: 1.7 }}>
            {exercise.errorText || 'Text with errors…'}
          </div>
        </div>
      );

    case 'flash': {
      const filledPairs = (exercise.pairs || []).filter(p => p.term || p.def);
      return (
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 8 }}>{filledPairs.length} flashcards · click to flip</p>
          <div style={{
            background: 'var(--surface)', border: '2px solid var(--border)',
            borderRadius: 0, padding: '24px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Term</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 'var(--text-xl)' }}>
              {filledPairs[0]?.term || 'Term'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)', marginTop: 10 }}>Click to flip</div>
          </div>
        </div>
      );
    }

    case 'listen':
      return (
        <div>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12,
            padding: '10px 14px', borderRadius: 0,
            background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.18)',
          }}>
            <Icon.play size={20} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Listen ({exercise.plays ?? 2}× allowed)
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
                Audio script
              </div>
              <div style={{
                marginTop: 6, padding: '8px 10px', borderRadius: 0,
                background: 'var(--surface)', border: '1px solid rgba(37,99,235,.12)',
                color: 'var(--text)', fontSize: 'var(--text-sm)', lineHeight: 1.55, whiteSpace: 'pre-wrap',
              }}>
                {exercise.audioText || 'Audio script not set yet.'}
              </div>
            </div>
          </div>
          <p style={{ fontWeight: 600, marginBottom: 10 }}>{exercise.question || 'Question…'}</p>
          {(exercise.options || []).map((opt, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', marginBottom: 4,
              borderRadius: 0, border: '1px solid var(--border)', background: 'var(--surface)',
            }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
              <span>{opt || `Option ${String.fromCharCode(65 + i)}`}</span>
            </div>
          ))}
        </div>
      );

    case 'read': {
      const qCount = (exercise.questions || []).length;
      return (
        <div>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 0, padding: '12px 14px', marginBottom: 10,
            maxHeight: 160, overflowY: 'auto', lineHeight: 1.7,
            fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
          }}>
            {(exercise.passage || 'No passage provided.').slice(0, 300)}
            {(exercise.passage || '').length > 300 ? '…' : ''}
          </div>
          {exercise.source && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic', margin: '0 0 8px' }}>
              — {exercise.source}
            </p>
          )}
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 8 }}>
            {qCount} comprehension question{qCount !== 1 ? 's' : ''}
          </p>
          {(exercise.questions || []).map((q, qi) => (
            <div key={q.id} style={{ marginBottom: 6 }}>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, margin: '0 0 4px' }}>{qi + 1}. {q.question}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(q.options || []).map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 0, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 'var(--text-xs)' }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
                    <span>{opt || `Option ${String.fromCharCode(65 + oi)}`}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    default:
      return <p>{exercise.instruction || exercisePreview(exercise)}</p>;
  }
}
