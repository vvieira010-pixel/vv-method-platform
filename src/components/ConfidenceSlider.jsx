import { useState, useId } from 'react';

export default function ConfidenceSlider({ label = 'How confident are you?', onConfidence, initial = 5 }) {
  const [value, setValue] = useState(initial);
  const id = useId();
  const trackId = `conf-${id}`;

  const labels = ['Not at all', 'Very unsure', 'Unsure', 'A little unsure', 'Neutral', 'Slightly sure', 'Moderately sure', 'Fairly sure', 'Quite sure', 'Very sure', 'Completely'];

  return (
    <div style={{ margin: '12px 0' }}>
      <label htmlFor={trackId} style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
        {label}
      </label>
      <input
        id={trackId}
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={e => {
          const v = Number(e.target.value);
          setValue(v);
          onConfidence?.(v);
        }}
        style={{ width: '100%', accentColor: 'var(--accent)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
        <span>{labels[value] || value}</span>
        <span>{value}/10</span>
      </div>
    </div>
  );
}
