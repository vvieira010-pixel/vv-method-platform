/**
 * exercise-editor-new-types.jsx — Editors for dialogue, swap, and levelup types.
 */
import { Button } from './shared.jsx';

const fieldLabel = {
  display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700,
  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: 4,
};
const fieldWrap = { marginBottom: 12 };

/* ─── DIALOGUE EDITOR ──────────────────────────────────────── */
let _dlId = 0;
function dlId() { return 'dl_' + Date.now().toString(36) + '_' + (++_dlId); }

export function DialogueEditor({ ex, update }) {
  const lines = ex.lines || [];

  const updateLine = (id, patch) =>
    update({ lines: lines.map(l => l.id === id ? { ...l, ...patch } : l) });
  const removeLine = (id) =>
    update({ lines: lines.filter(l => l.id !== id) });
  const addLine = () => {
    const lastSpeaker = lines.length > 0 ? lines[lines.length - 1].speaker : 'A';
    update({ lines: [...lines, { id: dlId(), speaker: lastSpeaker === 'A' ? 'B' : 'A', text: '' }] });
  };
  const moveLine = (idx, dir) => {
    const next = [...lines];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update({ lines: next });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Speaker A role</label>
          <input className="input" value={ex.speakerA || ''} onChange={e => update({ speakerA: e.target.value })} placeholder="e.g. Nurse" />
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Speaker B role</label>
          <input className="input" value={ex.speakerB || ''} onChange={e => update({ speakerB: e.target.value })} placeholder="e.g. Patient" />
        </div>
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Context / instruction (optional)</label>
        <input className="input" value={ex.instruction || ''} onChange={e => update({ instruction: e.target.value })} placeholder="e.g. A nurse greets a patient on admission…" />
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Dialogue lines</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lines.map((line, idx) => (
            <div key={line.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="button"
                onClick={() => updateLine(line.id, { speaker: line.speaker === 'A' ? 'B' : 'A' })}
                title={`Speaker ${line.speaker} — click to toggle`}
                style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--primary)',
                  cursor: 'pointer', fontWeight: 700, fontSize: 'var(--text-sm)',
                  background: line.speaker === 'A' ? 'var(--primary)' : 'var(--surface)',
                  color: line.speaker === 'A' ? '#fff' : 'var(--primary)',
                }}>
                {line.speaker}
              </button>
              <input className="input"
                value={line.text}
                onChange={e => updateLine(line.id, { text: e.target.value })}
                placeholder={`${line.speaker === 'A' ? (ex.speakerA || 'Speaker A') : (ex.speakerB || 'Speaker B')} says…`}
                style={{ flex: 1 }}
              />
              <button type="button" onClick={() => moveLine(idx, -1)} disabled={idx === 0}
                style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: 'var(--muted)', padding: '4px' }}>↑</button>
              <button type="button" onClick={() => moveLine(idx, 1)} disabled={idx === lines.length - 1}
                style={{ background: 'none', border: 'none', cursor: idx === lines.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--muted)', padding: '4px' }}>↓</button>
              <button type="button" onClick={() => removeLine(line.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px', fontSize: 16 }}>✕</button>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={addLine} style={{ marginTop: 8 }}>+ Add line</Button>
      </div>
    </div>
  );
}

/* ─── SWAP EDITOR ──────────────────────────────────────────── */
let _swId = 0;
function swId() { return 'sw_' + Date.now().toString(36) + '_' + (++_swId); }

function parseSentenceForSwaps(sentence, existingSwaps) {
  const matches = [];
  const re = /\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(sentence)) !== null) matches.push(m[1]);
  return matches.map(word => {
    const existing = existingSwaps.find(s => s.word === word);
    return existing || { id: swId(), word, options: ['', '', '', ''], correct: 0 };
  });
}

export function SwapEditor({ ex, update }) {
  const swaps = ex.swaps || [];
  const segments = (ex.sentence || '').split(/(\[[^\]]+\])/);

  const handleSentenceChange = (sentence) => {
    update({ sentence, swaps: parseSentenceForSwaps(sentence, swaps) });
  };

  const updateSwap = (id, patch) =>
    update({ swaps: swaps.map(s => s.id === id ? { ...s, ...patch } : s) });

  return (
    <div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Context (optional)</label>
        <input className="input" value={ex.instruction || ''} onChange={e => update({ instruction: e.target.value })} placeholder="e.g. Upgrade the underlined words to B2 level" />
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Sentence — wrap words in [brackets] to make them swappable</label>
        <textarea className="input" rows={3}
          value={ex.sentence || ''}
          onChange={e => handleSentenceChange(e.target.value)}
          placeholder="e.g. I need to [check] the patient records before [starting] the procedure."
        />
        {ex.sentence && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 2 }}>
            {segments.map((seg, i) => /^\[.*\]$/.test(seg)
              ? <span key={i} style={{ background: 'rgba(90,44,92,.15)', color: '#5A2C5C', padding: '2px 8px', borderRadius: 4, fontWeight: 600, margin: '0 2px' }}>{seg.slice(1,-1)}</span>
              : <span key={i}>{seg}</span>
            )}
          </div>
        )}
      </div>
      {swaps.map(swap => (
        <div key={swap.id} style={{ marginBottom: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
          <div style={{ ...fieldLabel, marginBottom: 8 }}>Word: <strong style={{ color: '#5A2C5C' }}>[{swap.word}]</strong> — options (radio = correct B2 upgrade)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="radio" name={`correct-${swap.id}`} checked={swap.correct === i}
                  onChange={() => updateSwap(swap.id, { correct: i })}
                  style={{ accentColor: 'var(--primary)', flexShrink: 0 }} />
                <input className="input"
                  value={(swap.options || [])[i] || ''}
                  onChange={e => { const opts = [...(swap.options || ['','','',''])]; opts[i] = e.target.value; updateSwap(swap.id, { options: opts }); }}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
      {swaps.length === 0 && ex.sentence && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>No [bracketed] words in the sentence yet.</p>
      )}
    </div>
  );
}

/* ─── LEVEL-UP EDITOR ──────────────────────────────────────── */
export function LevelUpEditor({ ex, update }) {
  const options = ex.options || ['', '', ''];
  const updateOption = (i, val) => { const next = [...options]; next[i] = val; update({ options: next }); };

  return (
    <div>
      <div style={{ display: 'grid', gap: 8, marginBottom: 4 }}>
        <div style={fieldWrap}>
          <label style={fieldLabel}>B1 sentence (original)</label>
          <textarea className="input" rows={2} value={ex.b1 || ''} onChange={e => update({ b1: e.target.value })} placeholder="e.g. The patient is getting better slowly." />
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>B2 sentence (correct upgrade)</label>
          <textarea className="input" rows={2} value={ex.b2 || ''} onChange={e => update({ b2: e.target.value })} placeholder="e.g. The patient is gradually showing signs of improvement." />
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>C1 sentence (optional)</label>
          <textarea className="input" rows={2} value={ex.c1 || ''} onChange={e => update({ c1: e.target.value })} placeholder="e.g. The patient is progressively demonstrating clinical improvement." />
        </div>
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>MCQ challenge — 3 options (radio = the B2 version)</label>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <input type="radio" name={`levelup-correct-${ex.id}`} checked={ex.correct === i}
              onChange={() => update({ correct: i })}
              style={{ accentColor: 'var(--primary)', flexShrink: 0 }} />
            <input className="input"
              value={options[i] || ''}
              onChange={e => updateOption(i, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + i)}${i === (ex.correct ?? 0) ? ' (B2 — correct)' : ' (distractor)'}`}
              style={{ flex: 1 }} />
          </div>
        ))}
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Target keywords (comma-separated)</label>
        <input className="input"
          value={(ex.keywords || []).join(', ')}
          onChange={e => update({ keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
          placeholder="e.g. gradually, improvement, signs" />
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 4 }}>
          These words light up green in the student's sandbox rewrite.
        </div>
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Explanation</label>
        <textarea className="input" rows={2} value={ex.explanation || ''} onChange={e => update({ explanation: e.target.value })}
          placeholder="e.g. 'Gradually' is more formal than 'slowly'; 'signs of improvement' is a medical collocation." />
      </div>
    </div>
  );
}

/* ─── READING EDITOR ────────────────────────────────────────── */
export function ReadEditor({ ex, update }) {
  const questions = ex.questions || [];

  const updateQuestion = (id, patch) =>
    update({ questions: questions.map(q => q.id === id ? { ...q, ...patch } : q) });
  const removeQuestion = (id) =>
    update({ questions: questions.filter(q => q.id !== id) });
  const addQuestion = () =>
    update({ questions: [...questions, { id: 'rq_' + Date.now().toString(36) + '_' + questions.length, question: '', options: ['', '', '', ''], correct: null }] });

  return (
    <div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Passage</label>
        <textarea className="input" rows={6} value={ex.passage || ''} onChange={e => update({ passage: e.target.value })}
          placeholder="Paste or type the reading passage here…" />
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 4 }}>
          {(ex.passage || '').split(/\s+/).filter(Boolean).length} words
        </div>
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Source (optional)</label>
        <input className="input" value={ex.source || ''} onChange={e => update({ source: e.target.value })}
          placeholder="e.g. Adapted from The Guardian, 2024" />
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>
          Comprehension questions ({questions.length})
          <span style={{ fontWeight: 400, marginLeft: 8 }}>
            <Button variant="ghost" size="sm" onClick={addQuestion}>+ Add question</Button>
          </span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {questions.map((q, qi) => (
            <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12, background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>Q{qi + 1}</span>
                <input className="input" style={{ flex: 1 }} value={q.question || ''}
                  onChange={e => updateQuestion(q.id, { question: e.target.value })}
                  placeholder={`Question ${qi + 1}`} />
                <button type="button" onClick={() => removeQuestion(q.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="radio" name={`correct_${q.id}`} checked={q.correct === i}
                      onChange={() => updateQuestion(q.id, { correct: i })}
                      style={{ accentColor: 'var(--accent)', flexShrink: 0 }} />
                    <input className="input" value={(q.options || [])[i] || ''}
                      onChange={e => {
                        const opts = [...(q.options || ['', '', '', ''])];
                        opts[i] = e.target.value;
                        updateQuestion(q.id, { options: opts });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      style={{ flex: 1 }} />
                    {q.correct === i && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600 }}>✓ correct</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
