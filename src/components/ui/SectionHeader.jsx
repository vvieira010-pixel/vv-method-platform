export function SectionHeader({ title, sub, action, right }) {
  const finalAction = action || right || null;
  return (
    <h2 className="section-header">
      <div>
        <div className="section-title">{title}</div>
        {sub && <div className="section-sub">{sub}</div>}
      </div>
      {finalAction && <div>{finalAction}</div>}
    </h2>
  );
}
