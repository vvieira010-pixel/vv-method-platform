export function Breadcrumb({ crumbs }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={i} className="breadcrumb-item">
          {i > 0 && <span className="breadcrumb-sep" aria-hidden="true">/</span>}
          {crumb.onClick ? (
            <button className="breadcrumb-link" onClick={crumb.onClick}>{crumb.label}</button>
          ) : (
            <span className="breadcrumb-current" aria-current="page">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
