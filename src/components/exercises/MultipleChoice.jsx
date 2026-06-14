import { useState } from 'react';

const TEAL = 'var(--accent)';
const NAVY = 'var(--primary-ink)';

const MET_SECTION_CONFIG = {
  grammar: {
    label: 'Reading Part 1 — Grammar',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    tip: 'Choose the option that fits both meaning AND structure. Check: tense · subject–verb agreement · articles · prepositions · modals · connectors · word form.',
    trap: 'Choosing an option that sounds familiar but does not fit grammatically.',
  },
  listening_p1: {
    label: 'Listening Part 1 — Short Conversation',
    color: '#0369A1',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    tip: 'Listen for: main point · speaker intention · specific detail · implied meaning. Do not choose an answer based on one word — listen to the whole exchange.',
    trap: 'Choosing based on one familiar word instead of the overall meaning.',
  },
  listening_p2: {
    label: 'Listening Part 2 — Longer Conversation',
    color: '#0369A1',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    tip: 'Listen for: main topic · sequence of events · problem and solution · what the speakers agree or disagree about · what a speaker will probably do next.',
    trap: 'Forgetting earlier information by the time the questions appear.',
  },
  listening_p3: {
    label: 'Listening Part 3 — Short Talk',
    color: '#0369A1',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    tip: 'Listen for: purpose of the talk · main idea · key detail · reason · speaker attitude · what happens next. Do not focus only on isolated words.',
    trap: 'Missing the purpose of the talk and focusing only on isolated details.',
  },
  reading_p2: {
    label: 'Reading Part 2 — Single Text',
    color: '#065F46',
    bg: '#F0FDFA',
    border: '#99F6E4',
    tip: 'Find: main idea · specific detail · vocabulary in context · reference words (it/they/this) · inference · author purpose. Manage your time — 5 questions per text.',
    trap: 'Reading too slowly and spending too much time on one text.',
  },
  reading_p3: {
    label: 'Reading Part 3 — Multiple Texts',
    color: '#065F46',
    bg: '#F0FDFA',
    border: '#99F6E4',
    tip: 'Three related texts — look for: which text says a specific idea · how texts are similar or different · what writers agree or disagree about · inference across texts.',
    trap: 'Treating the three texts separately and missing cross-text questions.',
  },
};

export default function MultipleChoice({ exercise, onComplete }) {
  const { question, options, correct, skill, context, instruction, metSection, imageUrl, imageAlt } = exercise;
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const sectionConfig = metSection ? MET_SECTION_CONFIG[metSection] : null;
  const isCorrect = selected === correct;

  function handleSubmit() {
    if (selected == null) return;
    setSubmitted(true);
    if (onComplete) onComplete({ correct: isCorrect });
  }

  function getOptionStyle(i) {
    const base = {
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 'var(--radius-sm, 6px)',
      border: '1.5px solid', cursor: submitted ? 'default' : 'pointer',
      transition: 'all 0.15s', fontSize: 'var(--text-sm)', lineHeight: 1.5,
      fontFamily: 'var(--font-ui)',
    };
    if (!submitted) {
      if (selected === i) return { ...base, borderColor: TEAL, background: '#F0FDFA', color: NAVY };
      return { ...base, borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' };
    }
    if (i === correct) return { ...base, borderColor: '#059669', background: '#ECFDF5', color: '#065F46' };
    if (i === selected && !isCorrect) return { ...base, borderColor: 'var(--danger)', background: '#FEF2F2', color: '#991B1B' };
    return { ...base, borderColor: 'var(--divider)', background: 'var(--surface)', color: 'var(--muted)', opacity: 0.6 };
  }

  function getMarker(i) {
    if (!submitted) return selected === i ? '◉' : '○';
    if (i === correct) return '✓';
    if (i === selected && !isCorrect) return '✗';
    return String.fromCharCode(65 + i);
  }

  return (
    <div>
      {sectionConfig && (
        <div style={{ padding: '10px 14px', background: sectionConfig.bg, border: `1px solid ${sectionConfig.border}`, borderRadius: 'var(--radius-sm, 6px)', marginBottom: 14 }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: sectionConfig.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
            {sectionConfig.label}
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: sectionConfig.color === '#7C3AED' ? '#4C1D95' : sectionConfig.color === '#0369A1' ? '#0C4A6E' : '#064E3B', lineHeight: 1.55 }}>
            {sectionConfig.tip}
          </div>
          {sectionConfig.trap && (
            <div style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: '#92400E' }}>
              <strong>Watch out:</strong> {sectionConfig.trap}
            </div>
          )}
        </div>
      )}

      {skill && !sectionConfig && (
        <div style={{ display: 'inline-block', marginBottom: 10, padding: '2px 8px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-sm, 6px)', fontSize: 'var(--text-xs)', fontWeight: 600, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {skill}
        </div>
      )}
      {skill && sectionConfig && (
        <div style={{ display: 'inline-block', marginBottom: 10, padding: '2px 8px', background: sectionConfig.bg, border: `1px solid ${sectionConfig.border}`, borderRadius: 'var(--radius-sm, 6px)', fontSize: 'var(--text-xs)', fontWeight: 600, color: sectionConfig.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {skill}
        </div>
      )}

      {instruction && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>{instruction}</p>
      )}
      {context && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{context}</p>
      )}

      {imageUrl && (
        <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)', overflow: 'hidden', background: '#F8FAFC', textAlign: 'center' }}>
          <img src={imageUrl} alt={imageAlt || 'Image for this question'} style={{ maxWidth: '100%', maxHeight: 320, display: 'block', margin: '0 auto' }} />
        </div>
      )}

      <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: NAVY, marginBottom: 16, lineHeight: 1.6 }}>{question}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !submitted && setSelected(i)}
            style={{
              ...getOptionStyle(i),
              animation: submitted ? undefined : 'fadeUp 0.18s ease-out both',
              animationDelay: submitted ? undefined : `${i * 55}ms`,
            }}
            aria-pressed={selected === i}
          >
            <span style={{
              width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center',
              fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0,
              background: submitted && i === correct ? '#059669' : submitted && i === selected && !isCorrect ? 'var(--danger)' : 'transparent',
              color: submitted && (i === correct || (i === selected && !isCorrect)) ? '#fff' : 'inherit',
            }}>
              {getMarker(i)}
            </span>
            <span>{opt}</span>
          </button>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selected == null}
          style={{
            padding: '10px 24px', borderRadius: 'var(--radius-sm, 6px)', border: 'none',
            cursor: selected == null ? 'not-allowed' : 'pointer',
            background: selected == null ? 'var(--border)' : `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
            color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)',
            opacity: selected == null ? 0.5 : 1, transition: 'all 0.15s',
          }}
        >
          Submit answer
        </button>
      ) : (
        <>
          <div style={{
            borderRadius: 'var(--radius-sm, 6px)', overflow: 'hidden',
            border: `1px solid ${isCorrect ? '#A7F3D0' : '#FECACA'}`,
            animation: 'fadeUp 0.22s ease-out both',
          }}>
            <div style={{
              padding: '10px 14px',
              background: isCorrect ? '#ECFDF5' : '#FEF2F2',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              color: isCorrect ? '#065F46' : '#991B1B',
              borderBottom: `1px solid ${isCorrect ? '#A7F3D0' : '#FECACA'}`,
            }}>
              {isCorrect ? '✓ Correct' : '✗ Not quite'}
            </div>
            <div style={{ padding: '10px 14px', background: '#fff', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
              {!isCorrect && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: '#991B1B' }}>Your answer: </span>
                  <span style={{ color: '#374151' }}>{options[selected]}</span>
                </div>
              )}
              <div>
                <span style={{ fontWeight: 600, color: '#065F46' }}>Correct answer: </span>
                <span style={{ color: '#374151' }}>{options[correct]}</span>
              </div>
            </div>
          </div>
          {exercise.explanation && (
            <div style={{
              marginTop: 10, fontSize: 'var(--text-sm)', color: '#374151', lineHeight: 1.65,
              padding: '11px 14px', background: '#F8FAFC', borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid #E2E8F0',
            }}>
              <span style={{ fontWeight: 700, color: NAVY }}>Why: </span>
              {exercise.explanation}
            </div>
          )}
        </>
      )}
    </div>
  );
}
