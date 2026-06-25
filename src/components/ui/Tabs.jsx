export function Tabs({ tabs, active, onChange, label = 'Tabs' }) {
  return (
    <div className="pill-nav" role="tablist" aria-label={label}>
      {tabs.map(t => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`pill-nav-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
