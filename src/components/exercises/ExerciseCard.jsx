import { useRef, useEffect, useState } from 'react';
import { Icon } from '../shared.jsx';
import { getExType, exercisePreview } from '../../lib/exercise-types.js';
import { ExTypeBadge, ExerciseEditor } from '../exercise-editor.jsx';

function arrowBtnStyle(disabled) {
  return {
    width: 24, height: 24, padding: 0, fontFamily: 'var(--font-sans)',
    fontSize: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)', color: disabled ? 'var(--faint)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
  };
}

export default function ExerciseCard({ exercise, index, total, isExpanded, onToggle, onChange, onRemove, onMove, onSaveToLibrary }) {
  const previewText = exercisePreview(exercise);
  const cardRef = useRef(null);

  const imageSrc = exercise.imageUrl || (exercise.pictureHint && (/^https?:\/\//.test(exercise.pictureHint) || exercise.pictureHint.startsWith('/')) ? exercise.pictureHint : null);
  const [showNotes, setShowNotes] = useState(false);

  const isAiGen = exercise.aiGenerated;
  const isVerified = exercise._teacherVerified;

  useEffect(() => {
    if (isExpanded && cardRef.current) {
      cardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isExpanded]);

  const toggleVerified = (e) => {
    e.stopPropagation();
    onChange({ _teacherVerified: !isVerified });
  };

  return (
    <div ref={cardRef} className="homework-exercise-card" style={{
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      border: isExpanded ? '1.5px solid var(--border-strong)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface)',
      overflow: 'hidden',
      transition: 'border-color 0.15s var(--ease), background 0.15s var(--ease)',
    }}>
      {/* Header — keyboard-accessible toggle */}
      <button
        type="button"
        aria-expanded={isExpanded}
        className="homework-exercise-card-header"
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', cursor: 'pointer',
          width: '100%', background: 'var(--surface)', border: 'none',
          textAlign: 'left', fontFamily: 'var(--font-sans)', minWidth: 0,
        }}
      >
          <span style={{
            fontFamily: 'var(--font-sans)', fontWeight: 700,
            fontSize: 'var(--text-sm)', color: 'var(--accent)',
            width: 22, textAlign: 'center', flexShrink: 0,
          }}>
          {index + 1}
        </span>
        <ExTypeBadge typeId={exercise.type} />
        {imageSrc && (
          <span style={{ width: 32, height: 24, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
            <img src={imageSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </span>
        )}
        {isAiGen && (
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.04em', padding: '1px 6px', borderRadius: 'var(--radius-pill)',
            background: 'var(--surface)',
            color: isVerified ? 'var(--success)' : 'var(--warning)',
            border: isVerified ? '1px solid var(--success)' : '1px solid var(--warning)',
            lineHeight: '16px', flexShrink: 0,
          }}>
            {isVerified ? '✓ Verified' : 'AI'}
          </span>
        )}
        <span className="homework-exercise-card-title" style={{
          flex: 1, minWidth: 0, fontSize: 'var(--text-sm)', color: 'var(--text-2)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {previewText}
        </span>
        <div className="homework-exercise-card-controls" style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          {isAiGen && (
            <button
              onClick={toggleVerified}
              style={{
                ...arrowBtnStyle(false),
                color: isVerified ? 'var(--success)' : 'var(--muted)',
              }}
              title={isVerified ? 'Mark as not reviewed' : 'Mark as reviewed / verified'}
            >
              <Icon.check size={12} />
            </button>
          )}
          {onSaveToLibrary && (
            <button
              onClick={e => { e.stopPropagation(); onSaveToLibrary(); }}
              style={{ ...arrowBtnStyle(false), color: 'var(--accent)' }}
              title="Save to my exercise library"
            >
              <Icon.star size={12} />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onMove(-1); }}
            disabled={index === 0}
            style={arrowBtnStyle(index === 0)}
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={e => { e.stopPropagation(); onMove(1); }}
            disabled={index === total - 1}
            style={arrowBtnStyle(index === total - 1)}
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{ ...arrowBtnStyle(false), color: 'var(--danger)' }}
            title="Remove exercise"
          >
            <Icon.trash size={12} />
          </button>
          <span style={{
            display: 'inline-flex', pointerEvents: 'none',
            transform: isExpanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease-out',
            color: 'var(--muted)',
          }}>
            <Icon.chevronDown size={14} />
          </span>
        </div>
      </button>

      {/* Body — smooth accordion via grid-template-rows */}
      <div style={{
        display: 'grid',
        gridTemplateRows: isExpanded ? '1fr' : '0fr',
        transition: 'grid-template-rows 200ms ease-out',
      }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div className="homework-exercise-card-body" style={{
            borderTop: '1px solid var(--divider)',
            maxHeight: 340, overflowY: 'auto', scrollbarGutter: 'stable',
            padding: '14px 14px 14px',
          }}>
            <ExerciseEditor exercise={exercise} onChange={onChange} />

            {/* Teacher review section */}
            {isAiGen && (
              <div style={{ marginTop: 12, padding: '10px 12px', border: '1px solid var(--warning-soft)', borderRadius: 'var(--radius-sm)', background: 'var(--warning-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: showNotes ? 8 : 0 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--warning)' }}>
                    {isVerified ? '✓ Reviewed' : '⚠ Needs review'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={(e) => { e.stopPropagation(); onChange({ _teacherVerified: !isVerified }); }}
                      style={{
                        padding: '3px 10px', borderRadius: 'var(--radius-sm)', border: 'none',
                        background: isVerified ? 'var(--warning-bg)' : 'var(--success)', color: isVerified ? 'var(--warning)' : '#fff',
                        cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-sans)',
                      }}>
                      {isVerified ? 'Unmark' : '✓ Verify content'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowNotes(!showNotes); }}
                      style={{
                        padding: '3px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--warning-soft)',
                        background: 'transparent', color: 'var(--warning)',
                        cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-sans)',
                      }}>
                      {showNotes ? 'Close notes' : 'Notes'}
                    </button>
                  </div>
                </div>
                {showNotes && (
                  <textarea
                    value={exercise._teacherNotes || ''}
                    onChange={(e) => onChange({ _teacherNotes: e.target.value })}
                    placeholder="e.g. ⚕ Check answer key — option B may also be correct. / L Vocabulary is closer to B2 than B1."
                    rows={3}
                    className="input"
                    style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
