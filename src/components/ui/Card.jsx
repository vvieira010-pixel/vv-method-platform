export function Card({ children, style, className = '', small, onClick }) {
  const cls = `card ${small ? 'card-sm' : ''} ${className}`.trim();
  if (onClick) {
    return (
      <button type="button" className={cls} style={style} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <div className={cls} style={style}>{children}</div>;
}
