/**
 * Kpi.jsx
 */

export function Kpi({ label, eyebrow, value, sub, trend, trendDir }) {
  const finalLabel = label || eyebrow || '';
  return (
    <div className="kpi">
      <div className="kpi-label">{finalLabel}</div>
      <div className="kpi-value">{value}</div>
      {trend && <div className={`kpi-trend ${trendDir || ''}`}>{trend}</div>}
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
