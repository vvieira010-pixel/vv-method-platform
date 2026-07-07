import { useState } from 'react';
import { motion } from 'motion/react';

const ERROR_TYPES = [
  { id: 'conceptual', label: 'Concept misunderstanding', desc: "I don't understand the rule or concept behind this" },
  { id: 'procedural', label: 'Procedural slip', desc: 'I know the concept but made a mistake applying it' },
  { id: 'detail', label: 'Missed a detail', desc: 'I overlooked something in the question or options' },
  { id: 'unsure', label: "Not sure what went wrong", desc: "I can't tell why I got it wrong" },
];

export default function ErrorDiagnosisGate({ onDiagnose, onSkip }) {
  const [selected, setSelected] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', marginBottom: 12 }}
    >
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
        Before I give you a hint — what kind of error do you think this is?
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
        {ERROR_TYPES.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelected(t.id)}
            style={{
              textAlign: 'left', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              border: selected === t.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
              background: selected === t.id ? 'var(--accent-subtle)' : 'transparent',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text)' }}>{t.label}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>{t.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          type="button"
          disabled={!selected}
          onClick={() => onDiagnose?.(selected)}
          style={{
            padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
            background: !selected ? 'var(--border)' : 'var(--accent)',
            color: !selected ? 'var(--muted)' : '#fff',
            fontWeight: 600, fontSize: 'var(--text-xs)', cursor: !selected ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Diagnose & show hint
        </button>
        <button
          type="button"
          onClick={onSkip}
          style={{
            padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--muted)', fontWeight: 500,
            fontSize: 'var(--text-xs)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          Skip — just give me a hint
        </button>
      </div>
    </motion.div>
  );
}
