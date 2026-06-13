/**
 * Pill.jsx
 */

const PILL_TONE = {
  default:'pill-default', accent:'pill-accent', success:'pill-success',
  warning:'pill-warning', danger:'pill-danger', muted:'pill-muted', info:'pill-info',
  ok:'pill-success', error:'pill-danger', draft:'pill-muted', queued:'pill-info',
  reviewed:'pill-success', overdue:'pill-danger', pending:'pill-warning',
};

export function Pill({ children, tone = 'default', icon, style }) {
  return (
    <span className={`pill ${PILL_TONE[tone] || 'pill-default'}`} style={style}>
      {icon}{children}
    </span>
  );
}
