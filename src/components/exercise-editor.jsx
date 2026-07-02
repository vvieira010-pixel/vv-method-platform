/**
 * exercise-editor.jsx — Teacher-facing exercise editors for all 7 types.
 * Each type has its own sub-editor with type-specific fields.
 * Also exports ExerciseTypePicker for adding new exercises.
 */
import { useState } from 'react';
import { Icon } from './shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EX_TYPES, getExType } from '../lib/exercise-types.js';
import { metTaskOptions } from '../lib/met-task-spec.js';
import { dbEnabled, uploadExerciseImage } from '../lib/supabase-db.js';
import { DialogueEditor, SwapEditor, LevelUpEditor, ReadEditor } from './exercise-editor-new-types.jsx';
import { generateExerciseImage } from '../lib/image-generation.js';
import ResourcePicker from './resource-picker.jsx';
import { ExTypeBadge } from './exercise-badge.jsx';
export { ExTypeBadge };

/* ─── SHARED STYLES ─────────────────────────────────────────── */
const fieldLabel = {
  display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700,
  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: 4,
};
const fieldWrap = { marginBottom: 12 };
const hintText = { fontSize: 'var(--text-xs)', color: 'var(--faint)', marginTop: 4 };

/* ─── EXERCISE TYPE PICKER ──────────────────────────────────── */
export function ExerciseTypePicker({ onSelect, onClose, onAiGenerate, exerciseOptions, onAddAiSuggestion }) {
  const [qty, setQty] = useState(1);
  const [level, setLevel] = useState('B1');
  const clamp = n => Math.max(1, Math.min(20, Number.isFinite(n) ? n : 1));
  const stepBtn = {
    width: 26, height: 26, display: 'grid', placeItems: 'center',
    border: '1px solid var(--border)', background: 'var(--surface)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 16, lineHeight: 1, color: 'var(--text)',
  };
  const actionBtn = {
    padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)',
    cursor: 'pointer', whiteSpace: 'nowrap',
  };
  return (
    <Card className="exercise-type-picker" style={{ padding: 20 }}>
      <div className="exercise-type-picker-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--primary)' }}>
          Add Exercise
        </span>
        <div className="exercise-type-picker-controls" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Level</span>
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              style={{ padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)' }}
            >
              {['A1', 'A2', 'B1', 'B2', 'C1'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              How many
            </span>
            <button type="button" aria-label="Fewer" style={stepBtn} onClick={() => setQty(q => clamp(q - 1))}>−</button>
            <input
              type="number" min={1} max={20} value={qty}
              onChange={e => setQty(clamp(parseInt(e.target.value, 10)))}
              style={{
                width: 48, textAlign: 'center', padding: '4px 6px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text)',
              }}
            />
            <button type="button" aria-label="More" style={stepBtn} onClick={() => qty < 20 ? setQty(q => clamp(q + 1)) : null}>+</button>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon.close size={12} /> Close
            </Button>
          )}
        </div>
      </div>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '0 0 14px' }}>
        Click <strong>Add</strong> for an empty exercise, or <strong>AI</strong> to generate one with content.
      </p>
      <div className="exercise-type-picker-grid" style={{ display: 'grid', gap: 8, maxHeight: 360, overflowY: 'auto', alignItems: 'stretch', gridAutoRows: '1fr' }}>
        {EX_TYPES.map(t => {
          const IconComp = Icon[t.iconKey];
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              transition: 'all 0.15s var(--ease)',
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                background: t.bg, color: t.color,
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                {IconComp && <IconComp size={15} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>{t.label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{t.hint}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => onSelect(t.id, qty, level)}
                  style={{ ...actionBtn, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 'var(--text-xs)' }}>
                  Add
                </button>
                {onAiGenerate && (
                  <button onClick={() => onAiGenerate(t.id, level)}
                    style={{ ...actionBtn, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>
                    <Icon.spark size={10} /> AI
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI suggestions inside the panel */}
      {Array.isArray(exerciseOptions) && exerciseOptions.length > 0 && (
        <div style={{ marginTop: 14, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>AI exercise suggestions</div>
              <div style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>Click <strong>Add</strong> to include one.</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {exerciseOptions.map((ex, i) => {
              const preview = ex.title || getExType(ex.type)?.label || ex.type;
              return (
                <div key={ex.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid var(--divider)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }}>
                  <ExTypeBadge typeId={ex.type} />
                  <span style={{ flex: 1, fontSize: 'var(--text-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-2)' }}>{preview}</span>
                  <button onClick={() => onAddAiSuggestion?.(ex)}
                    style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)' }}>
                    Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ─── MAIN EDITOR SWITCH ────────────────────────────────────── */

/**
 * ExerciseEditor — renders the correct sub-editor based on exercise.type.
 * @param {{ exercise: object, onChange: (updated: object) => void }} props
 */
export function ExerciseEditor({ exercise, onChange }) {
  if (!exercise) return null;
  const update = (patch) => onChange({ ...exercise, ...patch });

  return (
    <div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Instructions (optional)</label>
        <input
          className="input"
          value={exercise.instruction || ''}
          onChange={e => update({ instruction: e.target.value })}
          placeholder="Tell the student what to do, e.g. 'Read the sentence carefully and choose the best word.'"
        />
      </div>
      {renderSubEditor(exercise, update)}
    </div>
  );
}

function renderSubEditor(exercise, update) {
  switch (exercise.type) {
    case 'mcq':    return <MCQEditor    ex={exercise} update={update} />;
    case 'blank':  return <BlankEditor  ex={exercise} update={update} />;
    case 'short':  return <ShortEditor  ex={exercise} update={update} />;
    case 'speak':  return <SpeakEditor  ex={exercise} update={update} />;
    case 'order':  return <OrderEditor  ex={exercise} update={update} />;
    case 'fix':    return <FixEditor    ex={exercise} update={update} />;
    case 'flash':    return <FlashEditor    ex={exercise} update={update} />;
    case 'listen':   return <ListenEditor   ex={exercise} update={update} />;
    case 'dialogue': return <DialogueEditor ex={exercise} update={update} />;
    case 'swap':     return <SwapEditor     ex={exercise} update={update} />;
    case 'levelup':  return <LevelUpEditor  ex={exercise} update={update} />;
    case 'read':     return <ReadEditor     ex={exercise} update={update} />;
    default:
      return <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>Unknown exercise type: {exercise.type}</p>;
  }
}

/* ─── 1. MULTIPLE CHOICE ────────────────────────────────────── */
function MCQEditor({ ex, update }) {
  return (
    <div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Question</label>
        <textarea
          className="input" rows={3} value={ex.question}
          onChange={e => update({ question: e.target.value })}
          placeholder="Which sentence uses the correct past simple tense?"
        />
      </div>
      <label style={fieldLabel}>Options (click radio to mark correct)</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {(ex.options || []).map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="radio" name={`mcq-correct-${ex.id}`}
              checked={ex.correct === i}
              onChange={() => update({ correct: i })}
              style={{ accentColor: 'var(--success)', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', width: 18 }}>
              {String.fromCharCode(65 + i)}.
            </span>
            <input
              className="input" value={opt}
              onChange={e => {
                const opts = [...ex.options];
                opts[i] = e.target.value;
                update({ options: opts });
              }}
              placeholder={`Option ${String.fromCharCode(65 + i)}…`}
              style={{ flex: 1 }}
            />
          </div>
        ))}
      </div>
      {ex.correct !== null && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600, marginBottom: 10 }}>
          Correct answer: {String.fromCharCode(65 + ex.correct)}
        </div>
      )}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Explanation (optional)</label>
        <textarea
          className="input" rows={2} value={ex.explanation || ''}
          onChange={e => update({ explanation: e.target.value })}
          placeholder="Why is this the correct answer? Shown to students after submission."
          style={{ resize: 'vertical' }}
        />
      </div>
    </div>
  );
}

/* ─── 2. FILL THE BLANK ─────────────────────────────────────── */
function BlankEditor({ ex, update }) {
  const blankCount = (ex.template || '').split(/_{3,}/).length - 1;

  // Sync blanks array length with template blank count
  const syncBlanks = (template) => {
    const count = (template || '').split(/_{3,}/).length - 1;
    const blanks = [...(ex.blanks || [])];
    while (blanks.length < count) blanks.push('');
    while (blanks.length > count) blanks.pop();
    return blanks;
  };

  return (
    <div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Sentence template</label>
        <textarea
          className="input" rows={3} value={ex.template}
          onChange={e => update({ template: e.target.value, blanks: syncBlanks(e.target.value) })}
          placeholder="I ___ at this hospital ___ March 2021."
        />
        <div style={hintText}>Use ___ (three underscores) to mark each blank.</div>
      </div>
      {blankCount > 0 && (
        <div style={fieldWrap}>
          <label style={fieldLabel}>Correct answers ({blankCount} blank{blankCount !== 1 ? 's' : ''})</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: blankCount }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', width: 60 }}>
                  Blank {i + 1}:
                </span>
                <input
                  className="input" value={(ex.blanks || [])[i] || ''}
                  onChange={e => {
                    const blanks = [...(ex.blanks || [])];
                    blanks[i] = e.target.value;
                    update({ blanks });
                  }}
                  placeholder="answer | alternative answer"
                  style={{ flex: 1 }}
                />
              </div>
            ))}
          </div>
          <div style={hintText}>Use | to separate accepted alternatives (e.g. "have been working|have worked").</div>
        </div>
      )}
    </div>
  );
}

/* ─── 3. SHORT ANSWER ────────────────────────────────────────── */
function ShortEditor({ ex, update }) {
  return (
    <div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Prompt / Question</label>
        <textarea
          className="input" rows={3} value={ex.prompt}
          onChange={e => update({ prompt: e.target.value })}
          placeholder="Should night shifts in hospitals be capped at 10 hours? Argue for or against in ~120 words."
        />
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>MET task type (adds task-specific frames, checks & traps for the student)</label>
        <select className="input" value={ex.metTaskType || ''} onChange={e => update({ metTaskType: e.target.value || undefined })}>
          <option value="">– None (generic short answer) –</option>
          {metTaskOptions('short').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Rubric hint (shown to student)</label>
          <input
            className="input" value={ex.rubric}
            onChange={e => update({ rubric: e.target.value })}
            placeholder="Tip: open with a stance, give one concrete example, close with a consequence."
          />
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Target words</label>
          <input
            className="input" type="number" min={20} max={500} step={10}
            value={ex.targetWords}
            onChange={e => update({ targetWords: Number(e.target.value) || 120 })}
            style={{ width: 80 }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── 4. SPEAKING PROMPT ─────────────────────────────────────── */
function SpeakEditor({ ex, update }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  async function handleImageFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadErr('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr('Image is larger than 5 MB. Please pick a smaller file.');
      return;
    }
    setUploadErr('');
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${ex.id || 'speak'}/${Date.now()}_${safeName}`;
      const url = await uploadExerciseImage(file, path);
      update({ imageUrl: url, imageAlt: ex.imageAlt || file.name.replace(/\.[^.]+$/, '') });
    } catch (err) {
      setUploadErr(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (<>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Speaking prompt</label>
        <textarea
          className="input" rows={3} value={ex.prompt}
          onChange={e => update({ prompt: e.target.value })}
          placeholder="Tell me about a moment when your training kicked in faster than thought. Past simple only."
        />
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>MET task type (adds task-specific frames, checks & traps for the student)</label>
        <select className="input" value={ex.metTaskType || ''} onChange={e => update({ metTaskType: e.target.value || undefined })}>
          <option value="">– None (generic speaking prompt) –</option>
          {metTaskOptions('speak').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Picture description (shown to student as a scene to describe or react to)</label>
        <textarea
          className="input" rows={3} value={ex.imageDescription || ''}
          onChange={e => update({ imageDescription: e.target.value })}
          placeholder="A busy city street at rush hour. People are rushing past shops and cafés. A woman is checking her phone while holding a coffee cup."
        />
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Picture (optional, replaces description with an actual image)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)', cursor: uploading ? 'wait' : 'pointer',
            fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)',
            opacity: uploading ? 0.6 : 1,
          }}>
            <Icon.inbox size={15} />
            {uploading ? 'Uploading…' : ex.imageUrl ? 'Replace image' : 'Upload image'}
            <input
              type="file" accept="image/*" disabled={uploading}
              onChange={handleImageFile}
              style={{ display: 'none' }}
            />
          </label>
          {ex.imageUrl && !uploading && (
            <button
              type="button"
              onClick={() => update({ imageUrl: '', imageAlt: '' })}
              style={{
                padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--muted)',
              }}
            >
              Remove
            </button>
          )}
        </div>
        {!dbEnabled() && (
          <div style={hintText}>
            Sign in with Supabase to upload, or paste an image URL below.
          </div>
        )}
        {uploadErr && (
          <div style={{ ...hintText, color: 'var(--danger, #DC2626)' }}>{uploadErr}</div>
        )}
        <input
          className="input" value={ex.imageUrl || ''}
          onChange={e => update({ imageUrl: e.target.value })}
          placeholder="…or paste an image URL"
          style={{ marginTop: 8 }}
        />
        {ex.imageUrl && (
          <img src={ex.imageUrl} alt={ex.imageAlt || 'preview'} loading="lazy" style={{ marginTop: 8, maxWidth: '100%', maxHeight: 160, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
        )}
      </div>
      {ex.imageUrl && (
        <div style={fieldWrap}>
          <label style={fieldLabel}>Image alt text (described for screen readers)</label>
          <input
            className="input" value={ex.imageAlt || ''}
            onChange={e => update({ imageAlt: e.target.value })}
            placeholder="A busy city street at rush hour"
          />
        </div>
      )}
      <div style={fieldWrap}>
        <label style={fieldLabel}>Target duration (seconds)</label>
        <input
          className="input" type="number" min={15} max={300} step={5}
          value={ex.targetSeconds}
          onChange={e => update({ targetSeconds: Number(e.target.value) || 60 })}
          style={{ width: 100 }}
        />
        <div style={hintText}>
          Student sees: "Target: {ex.targetSeconds || 60} seconds"
        </div>
      </div>
  </>);
}

/* ─── 5. ORDER SENTENCES ─────────────────────────────────────── */
function OrderEditor({ ex, update }) {
  const sentences = ex.sentences || [''];

  const addSentence = () => update({ sentences: [...sentences, ''] });
  const updateSentence = (i, val) => {
    const next = [...sentences];
    next[i] = val;
    update({ sentences: next });
  };
  const removeSentence = (i) => {
    if (sentences.length <= 1) return;
    update({ sentences: sentences.filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Sentences in correct order</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sentences.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)',
                width: 20, textAlign: 'right', flexShrink: 0,
              }}>{i + 1}.</span>
              <input
                className="input" value={s}
                onChange={e => updateSentence(i, e.target.value)}
                placeholder={`Sentence ${i + 1}…`}
                style={{ flex: 1 }}
              />
              {sentences.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeSentence(i)} style={{ color: 'var(--danger)' }}>
                  <Icon.trash size={12} />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={addSentence} style={{ marginTop: 8 }}>
          <Icon.plus size={12} /> Add sentence
        </Button>
        <div style={hintText}>
          Write sentences in their correct order. Student sees them shuffled.
        </div>
      </div>
    </div>
  );
}

/* ─── 6. ERROR CORRECTION ────────────────────────────────────── */
function FixEditor({ ex, update }) {
  return (
    <div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Text with errors (student sees this)</label>
        <textarea
          className="input" rows={3} value={ex.errorText}
          onChange={e => update({ errorText: e.target.value })}
          placeholder="Yesterday she go to hospital and spoked with doctor about patient condition."
        />
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Corrected version (your reference, hidden from student)</label>
        <textarea
          className="input" rows={3} value={ex.correctedText}
          onChange={e => update({ correctedText: e.target.value })}
          placeholder="Yesterday she went to the hospital and spoke with the doctor about the patient's condition."
        />
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Hint (optional, shown to student)</label>
        <input
          className="input" value={ex.hint}
          onChange={e => update({ hint: e.target.value })}
          placeholder="Look at: verb tenses, missing articles, possessive form, singular/plural"
        />
      </div>
    </div>
  );
}

/* ─── 7. FLASHCARDS ──────────────────────────────────────────── */
function FlashEditor({ ex, update }) {
  const pairs = ex.pairs || [{ term: '', def: '' }];

  const addPair = () => update({ pairs: [...pairs, { term: '', def: '' }] });
  const updatePair = (i, field, val) => {
    const next = pairs.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
    update({ pairs: next });
  };
  const removePair = (i) => {
    if (pairs.length <= 1) return;
    update({ pairs: pairs.filter((_, idx) => idx !== i) });
  };

  const filledCount = pairs.filter(p => p.term && p.def).length;

  return (
    <div>
      <label style={fieldLabel}>Term / Definition pairs</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {pairs.map((p, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
            <input
              className="input" value={p.term}
              onChange={e => updatePair(i, 'term', e.target.value)}
              placeholder="Term…"
            />
            <input
              className="input" value={p.def}
              onChange={e => updatePair(i, 'def', e.target.value)}
              placeholder="Definition…"
            />
            {pairs.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removePair(i)} style={{ color: 'var(--danger)' }}>
                <Icon.trash size={12} />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button variant="ghost" size="sm" onClick={addPair}>
          <Icon.plus size={12} /> Add pair
        </Button>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
          {filledCount} card{filledCount !== 1 ? 's' : ''} ready
        </span>
      </div>
    </div>
  );
}

/* ─── 8. LISTENING ───────────────────────────────────────────── */
function ListenEditor({ ex, update }) {
  const [picker, setPicker] = useState(false);
  const [genImg, setGenImg] = useState(false);
  return (
    <div>
      <ResourcePicker open={picker} onClose={() => setPicker(false)} onSelect={u => { update({ audioSrc: u }); setPicker(false); }} tab="audio" />
      <div style={fieldWrap}>
        <label style={fieldLabel}>Pre-recorded audio URL (optional, overrides TTS)</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="input" value={ex.audioSrc || ''}
            onChange={e => update({ audioSrc: e.target.value })}
            placeholder="https://…/audio/listening/asking-for-directions-pt1.mp3"
            style={{ flex: 1 }} />
          <button onClick={() => setPicker(true)}
            style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--text)' }}>
            Browse
          </button>
        </div>
        <div style={hintText}>Paste a direct MP3/WAV URL. When set, this plays instead of generating speech below.</div>
      </div>

      <div style={fieldWrap}>
        <label style={fieldLabel}>Audio script (spoken to student via TTS, or transcript fallback)</label>
        <textarea
          className="input" rows={5} value={ex.audioText || ''}
          onChange={e => update({ audioText: e.target.value })}
          placeholder={'Girl: I was going to study for two hours, but I kept checking my phone.\nBoy: Maybe put your phone in another room next time.\nGirl: Yeah, that\'s probably the only way I\'ll focus.'}
        />
        <div style={hintText}>
          Used as TTS source (ElevenLabs / browser fallback) when no URL above. Shown as transcript after the student answers.
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={fieldLabel}>Picture hint (optional, context clue shown before listening)</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className="input" value={ex.pictureHint || ''}
            onChange={e => update({ pictureHint: e.target.value })}
            placeholder="A student sitting at a desk with books open, looking tired. A phone is next to the books."
            style={{ flex: 1 }}
          />
          {!/^https?:\/\//i.test(ex.pictureHint || '') && (
            <Button variant="ghost" size="sm" onClick={async () => {
              if (!ex.pictureHint || genImg) return;
              setGenImg(true);
              try {
                const url = await generateExerciseImage(ex.pictureHint);
                if (url) update({ pictureHint: url });
              } finally { setGenImg(false); }
            }} disabled={!ex.pictureHint || genImg} style={{ whiteSpace: 'nowrap' }}>
              {genImg ? <><Icon.spark size={12} /> Gen…</> : <><Icon.image size={12} /> Generate</>}
            </Button>
          )}
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={fieldLabel}>Question</label>
        <textarea
          className="input" rows={2} value={ex.question || ''}
          onChange={e => update({ question: e.target.value })}
          placeholder="What problem did the girl have?"
        />
      </div>

      <label style={fieldLabel}>Options (click radio to mark correct)</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {(ex.options || ['', '', '', '']).map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="radio" name={`listen-correct-${ex.id}`}
              checked={ex.correct === i}
              onChange={() => update({ correct: i })}
              style={{ accentColor: 'var(--success)', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', width: 18 }}>
              {String.fromCharCode(65 + i)}.
            </span>
            <input
              className="input" value={opt}
              onChange={e => {
                const opts = [...(ex.options || ['', '', '', ''])];
                opts[i] = e.target.value;
                update({ options: opts });
              }}
              placeholder={`Option ${String.fromCharCode(65 + i)}…`}
              style={{ flex: 1 }}
            />
          </div>
        ))}
      </div>
      {ex.correct != null && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600, marginBottom: 8 }}>
          Correct answer: {String.fromCharCode(65 + ex.correct)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Explanation (shown after answering)</label>
          <input
            className="input" value={ex.explanation || ''}
            onChange={e => update({ explanation: e.target.value })}
            placeholder="She says she kept checking her phone and only finished one chapter."
          />
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Max plays</label>
          <input
            className="input" type="number" min={0} max={10} step={1}
            value={ex.plays ?? 2}
            onChange={e => { const v = Number(e.target.value); update({ plays: isNaN(v) ? 2 : v }); }}
            style={{ width: 70 }}
          />
          <div style={hintText}>0 = unlimited</div>
        </div>
      </div>
    </div>
  );
}

