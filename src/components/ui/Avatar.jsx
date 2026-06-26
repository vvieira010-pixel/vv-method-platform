const AVATAR_PALETTES = {
  auto:  ['#1a2332','#2d8b8b','#247070','#3da6a6','#5a7a7a'],
  ink:   ['#1a2332'],
  blue:  ['#1a2332'],
  teal:  ['#2d8b8b'],
  amber: ['#D97706'],
  rose:  ['#E11D48'],
};
function pickColor(name, palette) {
  const arr = AVATAR_PALETTES[palette] || AVATAR_PALETTES.blue;
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h += name.charCodeAt(i);
  return arr[h % arr.length];
}

const SIZE_MAP = [
  { max: 28, cls: 'avatar-sm' },
  { max: 36, cls: 'avatar' },
  { max: Infinity, cls: 'avatar-lg' },
];

export function Avatar({ name = '?', size = 36, tone = 'auto' }) {
  const bg = pickColor(name, tone);
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const sizeCls = SIZE_MAP.find(s => size <= s.max)?.cls || 'avatar';
  return (
    <div
      role="img" aria-label={name}
      className={sizeCls}
      style={{ width: size, height: size, fontSize: size * 0.36, background: bg }}
    >
      {initials}
    </div>
  );
}
