import { useState } from 'react';

export default function EmbeddedLesson({ exercise, onComplete }) {
  const [completed, setCompleted] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
        {exercise.title || 'Interactive Lesson'}
      </div>
      
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%', // 16:9 Aspect Ratio
        height: 0,
        overflow: 'hidden',
        borderRadius: 'var(--radius-sm, 6px)',
        border: '1px solid var(--border)',
        background: '#000'
      }}>
        <iframe
          src={exercise.url}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          allow="autoplay; fullscreen"
          title={exercise.title || 'Embedded Lesson'}
        />
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.5, marginTop: 8 }}>
        {exercise.instruction || 'Watch the video and complete the interactive activities within the lesson.'}
      </div>

      {!completed && (
        <button
          onClick={() => {
            setCompleted(true);
            onComplete({ correct: true }); // Mark as completed
          }}
          style={{
            marginTop: 8,
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm, 6px)',
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            alignSelf: 'flex-end'
          }}
        >
          Mark as Completed
        </button>
      )}

      {completed && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--accent-subtle)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-sm, 6px)',
          color: 'var(--primary)',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          ✓ Lesson completed
        </div>
      )}
    </div>
  );
}
