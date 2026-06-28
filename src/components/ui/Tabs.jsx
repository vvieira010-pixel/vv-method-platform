export function Tabs({ tabs, active, onChange, renderPanel, label = 'Tabs' }) {
  return (
    <div>
      <div className="pill-nav" role="tablist" aria-label={label}>
        {tabs.map(t => {
          const panelId = `tabpanel-${t.id}`;
          return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            aria-controls={panelId}
            className={`pill-nav-btn ${active === t.id ? 'active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
          );
        })}
      </div>
      {tabs.map(t => {
        const panelId = `tabpanel-${t.id}`;
        return (
          <div key={t.id} id={panelId} role="tabpanel" aria-labelledby={panelId} hidden={active !== t.id}>
            {renderPanel ? renderPanel(t) : t.children}
          </div>
        );
      })}
    </div>
  );
}
