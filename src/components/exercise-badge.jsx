import { Icon } from './shared.jsx';
import { getExType } from '../lib/exercise-types.js';

export function ExTypeBadge({ typeId, size = 'sm' }) {
  const meta = getExType(typeId);
  if (!meta) return null;
  const IconComp = Icon[meta.iconKey];
  const iconSize = size === 'sm' ? 11 : 13;
  const fontSize = size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)';
  const padding = size === 'sm' ? '3px 8px' : '4px 10px';
  return (
    <span className="ex-type-badge" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: meta.bg, color: meta.color,
      fontSize, padding, borderRadius: 0, fontWeight: 600,
    }}>
      {IconComp && <span style={{ display: 'inline-flex' }}><IconComp size={iconSize} /></span>}
      {meta.label}
    </span>
  );
}
