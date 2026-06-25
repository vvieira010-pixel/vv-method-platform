export function SectionHeader({ title, sub, action, right }) {
  const finalAction = action || right || null;
  return (
    <div className="section-header" role="heading" aria-level="2">
      <div>
        <div className="section-title">{title}</div>
        {sub && <div className="section-sub">{sub}</div>}
      </div>
      {finalAction && <div>{finalAction}</div>}
    </div>
  );
}
