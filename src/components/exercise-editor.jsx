/**
 * exercise-editor.jsx — Teacher-facing exercise editors for all 7 types.
 * Each type has its own sub-editor with type-specific fields.
 * Also exports ExerciseTypePicker for adding new exercises.
 */
import { useState } from 'react';
import { Icon, Card, Button } from './shared.jsx';
import { EX_TYPES, getExType } from '../lib/exercise-types.js';

/* ─── SHARED STYLES ─────────────────────────────────────────── */
const fieldLabel = {
  display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700,
  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: 4,
};
const fieldWrap = { marginBottom: 12 };
const hintText = { fontSize: 'var(--text-xs)', color: 'var(--faint)', marginTop: 4 };

/* ─── TYPE BADGE ────────────────────────────────────────────── */
export function ExTypeBadge({ typeId, size = 'sm' }) {
  const meta = getExType(typeId);
  if (!meta) return null;
  const IconComp = Icon[meta.iconKey];
  const iconSize = size === 'sm' ? 11 : 13;
  const fontSize = size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)';
  const padding = size === 'sm' ? '3px 8px' : '4px 10px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: meta.bg, color: meta.color,
      fontSize, padding, borderRadius: 999, fontWeight: 600,
    }}>
      {IconComp && <span style={{ display: 'inline-flex' }}><IconComp size={iconSize} /></span>}
      {meta.label}
    </span>
  );
}

/* ─── EXERCISE TYPE PICKER ──────────────────────────────────── */
export function ExerciseTypePicker({ onSelect, onClose }) {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent-deep)' }}>
          Choose exercise type
        </span>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon.close size={12} /> Cancel
          </Button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
        {EX_TYPES.map(t => {
          const IconComp = Icon[t.iconKey];
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', background: 'var(--surface)',
                cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left',
                transition: 'all 0.15s var(--ease)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.background = t.bg; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
            >
              <span style={{
                width: 32, height: 32, borderRadius: 8,
                background: t.bg, color: t.color,
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                {IconComp && <IconComp size={15} />}
              </span>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>{t.label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{t.hint}</div>
              </div>
            </button>
          );
        })}
      </div>
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

  switch (exercise.type) {
    case 'mcq':   return <MCQEditor   ex={exercise} update={update} />;
    case 'blank': return <BlankEditor ex={exercise} update={update} />;
    case 'short': return <ShortEditor ex={exercise} update={update} />;
    case 'speak': return <SpeakEditor ex={exercise} update={update} />;
    case 'order': return <OrderEditor ex={exercise} update={update} />;
    case 'fix':   return <FixEditor   ex={exercise} update={update} />;
    case 'flash': return <FlashEditor ex={exercise} update={update} />;
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
          className="input" rows={2} value={ex.question}
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
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600 }}>
          Correct answer: {String.fromCharCode(65 + ex.correct)}
        </div>
      )}
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
          className="input" rows={2} value={ex.template}
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
  return (
    <div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Speaking prompt</label>
        <textarea
          className="input" rows={3} value={ex.prompt}
          onChange={e => update({ prompt: e.target.value })}
          placeholder="Tell me about a moment when your training kicked in faster than thought. Past simple only."
        />
      </div>
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
    </div>
  );
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
        <label style={fieldLabel}>Corrected version (your reference — hidden from student)</label>
        <textarea
          className="input" rows={3} value={ex.correctedText}
          onChange={e => update({ correctedText: e.target.value })}
          placeholder="Yesterday she went to the hospital and spoke with the doctor about the patient's condition."
        />
      </div>
      <div style={fieldWrap}>
        <label style={fieldLabel}>Hint (optional — shown to student)</label>
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
