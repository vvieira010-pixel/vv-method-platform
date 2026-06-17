import { useRef, useEffect } from 'react';
import { Icon } from '../shared.jsx';
import { getExType, exercisePreview } from '../../lib/exercise-types.js';
import { ExTypeBadge, ExerciseEditor } from '../exercise-editor.jsx';

function arrowBtnStyle(disabled) {
  return {
    width: 24, height: 24, padding: 0, fontFamily: 'var(--font-ui)',
    fontSize: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)', color: disabled ? 'var(--faint)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
  };
}

export default function ExerciseCard({ exercise, index, total, isExpanded, onToggle, onChange, onRemove, onMove, onSaveToLibrary }) {
  const previewText = exercisePreview(exercise);
  const cardRef = useRef(null);

  useEffect(() => {
    if (isExpanded && cardRef.current) {
      cardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isExpanded]);

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
          textAlign: 'left', fontFamily: 'var(--font-ui)', minWidth: 0,
        }}
      >
          <span style={{
            fontFamily: 'var(--font-ui)', fontWeight: 700,
            fontSize: 'var(--text-sm)', color: 'var(--accent)',
            width: 22, textAlign: 'center', flexShrink: 0,
          }}>
          {index + 1}
        </span>
        <ExTypeBadge typeId={exercise.type} />
        <span className="homework-exercise-card-title" style={{
          flex: 1, minWidth: 0, fontSize: 'var(--text-sm)', color: 'var(--text-2)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {previewText}
        </span>
        <div className="homework-exercise-card-controls" style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
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
          </div>
        </div>
      </div>
    </div>
  );
}
