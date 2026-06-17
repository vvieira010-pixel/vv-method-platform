/**
 * SectionHeader.jsx
 */

export function SectionHeader({ title, sub, action, right }) {
  const finalAction = action || right || null;
  return (
    <div className="section-header">
      <div>
        <div className="section-title">{title}</div>
        {sub && <div className="section-sub">{sub}</div>}
      </div>
      {finalAction && <div>{finalAction}</div>}
    </div>
  );
}
