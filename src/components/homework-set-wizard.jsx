/**
 * homework-set-wizard.jsx — Step 1 of homework creation.
 * Teacher picks a CEFR level and kind before entering the exercise builder.
 */
import { useState } from 'react';
import { Icon } from './shared.jsx';
import { Button } from './ui/Button.jsx';
import { Card } from './ui/Card.jsx';
import { UNIT_LEVELS, SUBJECT_OPTIONS } from '../lib/unit-bank.js';

export default function HomeworkSetWizard({ onComplete, onSkip }) {
  const [level, setLevel] = useState(null);
  const [skill, setSkill] = useState(null);

  const canStart = level && skill;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>
      <button
        onClick={onSkip}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 24, padding: 0 }}
      >
        <Icon.arrowL size={13} /> Back
      </button>

      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 6px' }}>
        Create a Homework Set
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', margin: '0 0 32px' }}>
        Select a level and kind to load curated unit exercises alongside AI generation.
      </p>

      {/* Level picker */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 10 }}>
          Level
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {UNIT_LEVELS.map(l => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                border: level === l.id ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                background: level === l.id ? 'var(--accent-subtle)' : 'var(--surface)',
                color: level === l.id ? 'var(--primary)' : 'var(--text-body)',
                fontWeight: level === l.id ? 700 : 500,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      {/* Kind picker */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 10 }}>
          Kind
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
          {SUBJECT_OPTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSkill(s.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                border: skill === s.id ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                background: skill === s.id ? 'var(--accent-subtle)' : 'var(--surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.12s',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
              <div>
                <div style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: skill === s.id ? 700 : 600,
                  color: skill === s.id ? 'var(--primary)' : 'var(--text-body)',
                  lineHeight: 1.3,
                }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2, lineHeight: 1.3 }}>
                  {s.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Action */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button
          variant="primary"
          size="md"
          disabled={!canStart}
          onClick={() => onComplete({ level, skill })}
        >
          Start Building <Icon.arrowR size={13} />
        </Button>
        <button
          onClick={onSkip}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 'var(--text-sm)' }}
        >
          Skip — build manually
        </button>
      </div>
    </div>
  );
}