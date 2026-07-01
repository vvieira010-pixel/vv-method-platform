export function Card({ children, style, className = '', small, bezel, onClick, padding, ariaLabel }) {
  const cls = `card ${small ? 'card-sm' : ''} ${bezel ? 'v-double-bezel' : ''} ${className}`.trim();
  if (onClick) {
    return (
      <button type="button" className={cls} style={{ ...(padding != null ? { padding } : {}), ...style }} onClick={onClick} aria-label={ariaLabel}>
        {children}
      </button>
    );
  }
  return <div className={cls} style={{ ...(padding != null ? { padding } : {}), ...style }}>{children}</div>;
}
