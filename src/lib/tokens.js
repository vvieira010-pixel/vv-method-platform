/**
 * tokens.js — Design tokens for inline styles.
 * Single source of truth: mirrors the CSS custom properties in shared.jsx.
 * Use these instead of magic numbers in style={{}} objects.
 */

export const SPACE = {
  1:  4,
  2:  6,
  3:  8,
  4:  10,
  5:  12,
  6:  14,
  7:  16,
  8:  20,
  9:  24,
  10: 28,
  11: 32,
  12: 40,
};

export const FONT_SIZE = {
  xs:  'var(--text-xs)',   // 11.5px
  sm:  'var(--text-sm)',   // 13px
  md:  'var(--text-md)',   // 14.5px
  lg:  'var(--text-lg)',   // 16px
  xl:  'var(--text-xl)',   // 18px
  '2xl': 'var(--text-2xl)', // 22px
  '3xl': 'var(--text-3xl)', // 28px
};

export const RADIUS = {
  sm:   'var(--radius-sm)',   // 8px
  md:   'var(--radius-md)',   // 14px
  lg:   'var(--radius-lg)',   // 22px
  pill: 'var(--radius-pill)', // 999px
};

export const COLOR = {
  accent:      'var(--accent)',
  accentDeep:  'var(--accent-deep)',
  accentSoft:  'var(--accent-soft)',
  accentSubtle:'var(--accent-subtle)',
  primary:     'var(--primary)',
  primaryInk:  'var(--primary-ink)',
  bg:          'var(--bg)',
  bgDeep:      'var(--bg-deep)',
  surface:     'var(--surface)',
  border:      'var(--border)',
  divider:     'var(--divider)',
  text:        'var(--text)',
  text2:       'var(--text-2)',
  muted:       'var(--muted)',
  faint:       'var(--faint)',
  success:     'var(--success)',
  successBg:   'var(--success-bg)',
  info:        'var(--info)',
  infoBg:      'var(--info-bg)',
  warning:     'var(--warning)',
  warningBg:   'var(--warning-bg)',
  danger:      'var(--danger)',
  dangerBg:    'var(--danger-bg)',
  onDark:      'var(--on-dark)',
  onDarkMuted: 'var(--on-dark-muted)',
};

export const FONT = {
  ui:      'var(--font-ui)',
  display: 'var(--font-display)',
  mono:    'var(--font-mono)',
};

export const SHADOW = {
  card:  'var(--shadow-card)',
  modal: 'var(--shadow-modal)',
  toast: 'var(--shadow-toast)',
};
