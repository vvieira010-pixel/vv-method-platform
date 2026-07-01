export const TEAL = 'var(--accent)';
export const NAVY = 'var(--accent-text)';

export function submitButtonStyle() {
  return {
    background: `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
    color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)',
    padding: '12px 24px', fontWeight: 600, fontSize: 'var(--text-sm)',
    cursor: 'pointer', fontFamily: 'var(--font-ui)', minHeight: 44,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  };
}

export function optionBaseStyle() {
  return {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 'var(--radius-sm, 6px)',
    border: '1.5px solid', cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s, color 0.15s',
    fontSize: 'var(--text-sm)', lineHeight: 1.5, fontFamily: 'var(--font-ui)',
  };
}

export function getOptionStyle(i, selected, submitted, correct) {
  const base = optionBaseStyle();
  base.cursor = submitted ? 'default' : 'pointer';
  if (!submitted) {
    if (selected === i) return { ...base, borderColor: TEAL, background: 'var(--ex-selected-bg)', color: NAVY };
    return { ...base, borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' };
  }
  if (i === correct) return { ...base, borderColor: 'var(--ex-correct-strong)', background: 'var(--ex-correct-bg)', color: 'var(--ex-correct-text)' };
  if (i === selected) return { ...base, borderColor: 'var(--danger)', background: 'var(--ex-wrong-bg)', color: 'var(--ex-wrong-text)' };
  return { ...base, borderColor: 'var(--divider)', background: 'var(--surface)', color: 'var(--muted)', opacity: 0.6 };
}

export function getMarker(i, selected, submitted, correct) {
  if (!submitted) return selected === i ? '◉' : '○';
  if (i === correct) return '✓';
  if (i === selected) return '✗';
  return String.fromCharCode(65 + i);
}

export const MET_SECTION_STYLES = {
  grammar: { color: 'var(--ex-cat-purple-text)', bg: 'var(--ex-cat-purple-bg)', border: 'var(--ex-cat-purple-border)' },
  listening_p1: { color: 'var(--ex-cat-sky-text)', bg: 'var(--ex-cat-sky-bg)', border: 'var(--ex-cat-sky-border)' },
  listening_p2: { color: 'var(--ex-cat-sky-text)', bg: 'var(--ex-cat-sky-bg)', border: 'var(--ex-cat-sky-border)' },
  listening_p3: { color: 'var(--ex-cat-sky-text)', bg: 'var(--ex-cat-sky-bg)', border: 'var(--ex-cat-sky-border)' },
  reading_p2: { color: 'var(--ex-correct-text)', bg: 'var(--ex-selected-bg)', border: 'var(--ex-selected-border)' },
  reading_p3: { color: 'var(--ex-correct-text)', bg: 'var(--ex-selected-bg)', border: 'var(--ex-selected-border)' },
};