export function Skeleton({ className = '', style, as = 'div' }) {
  const El = as;
  return <El className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, lastShort = true }) {
  const items = Array.from({ length: lines }, (_, i) => (
    <Skeleton key={i} className={`skeleton-text${lastShort && i === lines - 1 ? ' skeleton-text--short' : ''}`} />
  ));
  return <div aria-hidden="true">{items}</div>;
}

export function SkeletonCard({ height, lines = 2 }) {
  return (
    <div className="skeleton-card" style={height ? { height } : undefined} aria-hidden="true">
      <SkeletonText lines={lines} />
    </div>
  );
}
