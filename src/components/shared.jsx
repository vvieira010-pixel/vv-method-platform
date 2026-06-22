/**
 * shared.jsx — MET Proficiency Mastery Design System
 * Core UI primitives, icons, layout shell, and AI utilities.
 */

import { useState, useRef, useEffect } from 'react';

/* ─── CSS CUSTOM PROPERTIES (injected once) ─────────────────── */




/* ─── ICON SYSTEM ───────────────────────────────────────────── */
function SvgIcon({ d, children, size = 18, color, fill, style, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={fill || 'none'}
      stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" style={style} aria-hidden="true" {...rest}>
      {d ? <path d={d} /> : children}
    </svg>
  );
}

export const Icon = {
  home:     (p) => <SvgIcon {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></SvgIcon>,
  student:  (p) => <SvgIcon {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></SvgIcon>,
  teacher:  (p) => <SvgIcon {...p}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></SvgIcon>,
  diagnose: (p) => <SvgIcon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></SvgIcon>,
  feedback: (p) => <SvgIcon {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></SvgIcon>,
  homework: (p) => <SvgIcon {...p}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12l2 2 4-4"/></SvgIcon>,
  progress: (p) => <SvgIcon {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></SvgIcon>,
  practice: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>,
  inbox:    (p) => <SvgIcon {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></SvgIcon>,
  calendar: (p) => <SvgIcon {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></SvgIcon>,
  doc:      (p) => <SvgIcon {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></SvgIcon>,
  plus:     (p) => <SvgIcon d="M12 5v14 M5 12h14" {...p} />,
  close:    (p) => <SvgIcon d="M18 6L6 18 M6 6l12 12" {...p} />,
  check:    (p) => <SvgIcon d="M20 6L9 17l-5-5" {...p} />,
  edit:     (p) => <SvgIcon {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></SvgIcon>,
  trash:    (p) => <SvgIcon d="M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6" {...p} />,
  chevronRight: (p) => <SvgIcon d="M9 18l6-6-6-6" {...p} />,
  chevronDown:  (p) => <SvgIcon d="M6 9l6 6 6-6" {...p} />,
  search:   (p) => <SvgIcon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></SvgIcon>,
  filter:   (p) => <SvgIcon d="M22 3H2l8 9.46V19l4 2v-8.54L22 3" {...p} />,
  bolt:     (p) => <SvgIcon d="M13 2L3 14h7l-1 8 12-14h-8l2-6z" fill="currentColor" {...p} />,
  send:     (p) => <SvgIcon d="M22 2L11 13 M22 2L15 22l-4-9-9-4 22-7z" {...p} />,
  mic:      (p) => <SvgIcon {...p}><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></SvgIcon>,
  headphones: (p) => <SvgIcon {...p}><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z"/><path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"/></SvgIcon>,
  star:     (p) => <SvgIcon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" {...p} />,
  spark:    (p) => <SvgIcon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" {...p} />,
  info:     (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></SvgIcon>,
  warning:  (p) => <SvgIcon {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></SvgIcon>,
  link:     (p) => <SvgIcon d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" {...p} />,
  copy:     (p) => <SvgIcon {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></SvgIcon>,
  download: (p) => <SvgIcon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" {...p} />,
  upload:   (p) => <SvgIcon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12" {...p} />,
  eye:      (p) => <SvgIcon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></SvgIcon>,
  refresh:  (p) => <SvgIcon d="M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15" {...p} />,
  print:    (p) => <SvgIcon {...p}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></SvgIcon>,
  arrowR:   (p) => <SvgIcon d="M5 12h14 M12 5l7 7-7 7" {...p} />,
  arrowL:   (p) => <SvgIcon d="M19 12H5 M12 19l-7-7 7-7" {...p} />,
  settings: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></SvgIcon>,
  lock:     (p) => <SvgIcon d="M12 2a4 4 0 00-4 4v4H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a4 4 0 00-4-4z M9 12V6a3 3 0 016 0v6" {...p} />,
  play:     (p) => <SvgIcon d="M6 3l14 9-14 9V3z" {...p} />,
  stop:     (p) => <SvgIcon d="M6 6h12v12H6z" {...p} />,
  volume:   (p) => <SvgIcon {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></SvgIcon>,
  timer:    (p) => <SvgIcon d="M10 2h4 M12 2v6 M4.93 8.93l-2-2 M16.93 8.93l2-2 M6 18a6 6 0 1012 0v0a6 6 0 00-12 0" {...p} />,
  bulb:     (p) => <SvgIcon d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3v1h-2v-1s-3-1-3-3 0-.04 0 0z M9 17h4 M10 19h2" {...p} />,
  clipboard: (p) => <SvgIcon {...p}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 14l2 2 4-4"/></SvgIcon>,
  image:    (p) => <SvgIcon {...p}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></SvgIcon>,
  book:     (p) => <SvgIcon {...p}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></SvgIcon>,
  party:    (p) => <SvgIcon d="M20 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z M7 7l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z M14 11l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" {...p} />,
  gear:     (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></SvgIcon>,
  grid:     (p) => <SvgIcon d="M3 3h7v7H3V3z M14 3h7v7h-7V3z M3 14h7v7H3v-7z M14 14h7v7h-7v-7z" {...p} />,
  trophy:   (p) => <SvgIcon {...p}><path d="M6 9H4.5a2.5 2.5 0 010-5H6m12 5h1.5a2.5 2.5 0 000-5H18"/><path d="M6 9h12v1a6 6 0 01-12 0V9z"/><path d="M8 20h8"/><path d="M12 14v6"/></SvgIcon>,
  diamond:  (p) => <SvgIcon d="M12 2L2 12l10 10 10-10L12 2z M2 12h20" fill="currentColor" {...p} />,
};

/* ─── SKELETON LOADING ───────────────────────────────────────── */
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

/* ─── EMPTY STATE ────────────────────────────────────────────── */
export function EmptyState({ icon, title, text, action, onAction }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
      <div className="empty-state-title">{title}</div>
      {text && <div className="empty-state-text">{text}</div>}
      {action && onAction && (
        <Button variant="ghost" size="sm" onClick={onAction}>{action}</Button>
      )}
    </div>
  );
}

/* ─── AVATAR ─────────────────────────────────────────────────── */
const AVATAR_PALETTES = {
  auto:  ['#0f1b2d','#148891','#c86607','#0f6b73','#5bbcb8'],
  ink:   ['#0F172A'],
  blue:  ['#0F172A'],
  sky:   ['#0369A1'],
  rose:  ['#E11D48'],
};
function pickColor(name, palette) {
  const arr = AVATAR_PALETTES[palette] || AVATAR_PALETTES.blue;
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h += name.charCodeAt(i);
  return arr[h % arr.length];
}

export function Avatar({ name = '?', size = 36, tone = 'auto' }) {
  const bg = pickColor(name, tone);
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div role="img" aria-label={name} style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
      fontFamily: 'var(--font-ui)', userSelect: 'none', letterSpacing: '0.02em',
    }}>
      {initials}
    </div>
  );
}

/* ─── BUTTON ─────────────────────────────────────────────────── */
const BTN_CLS = { primary: 'btn-primary', ghost: 'btn-ghost', quiet: 'btn-quiet', danger: 'btn-danger', accent: 'btn-accent' };
const BTN_SIZES = { sm: 'btn-sm', lg: 'btn-lg' };
export function Button({ variant, size, children, style, className = '', disabled, onClick }) {
  return (
    <button type="button" className={`btn ${BTN_CLS[variant] || ''} ${BTN_SIZES[size] || ''} ${className}`.trim()} style={style} disabled={disabled} onClick={onClick}>{children}</button>
  );
}

/* ─── CARD ───────────────────────────────────────────────────── */
export function Card({ children, style, className = '', small, onClick }) {
  const cls = `card ${small ? 'card-sm' : ''} ${className}`;
  if (onClick) {
    return (
      <button type="button" className={cls} style={style} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <div className={cls} style={style}>{children}</div>;
}

/* ─── PILL ───────────────────────────────────────────────────── */
const PILL_TONE = {
  default:'pill-default', accent:'pill-accent', success:'pill-success',
  warning:'pill-warning', danger:'pill-danger', muted:'pill-muted', info:'pill-info',
  ok:'pill-success', error:'pill-danger', draft:'pill-muted', queued:'pill-info',
  reviewed:'pill-success', overdue:'pill-danger', pending:'pill-warning',
};
export function Pill({ children, tone = 'default', icon, style }) {
  return (
    <span className={`pill ${PILL_TONE[tone] || 'pill-default'}`} style={style}>
      {icon}{children}
    </span>
  );
}

/* ─── KPI ────────────────────────────────────────────────────── */
export function Kpi({ label, eyebrow, value, sub, trend, trendDir }) {
  const finalLabel = label || eyebrow || '';
  return (
    <div className="kpi">
      <div className="kpi-label">{finalLabel}</div>
      <div className="kpi-value">{value}</div>
      {trend && <div className={`kpi-trend ${trendDir || ''}`}>{trend}</div>}
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

/* ─── SECTION HEADER ─────────────────────────────────────────── */
export function SectionHeader({ title, sub, action, right }) {
  const finalAction = action || right || null;
  return (
    <div className="section-header">
      <div>
        <div className="section-title">{title}</div>
        {sub && <div className="section-sub">{sub}</div>}
      </div>
      {finalAction && <div>{finalAction}</div>}
    </div>
  );
}

/* ─── PILL NAV ───────────────────────────────────────────────── */
export function PillNav({ tabs, active, onChange, label = 'Tabs' }) {
  return (
    <div className="pill-nav" role="tablist" aria-label={label}>
      {tabs.map(t => (
        <button key={t.id} role="tab" aria-selected={active === t.id}
          className={`pill-nav-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── SHELL ──────────────────────────────────────────────────── */
// Legacy section map for old tool:* IDs
const LEGACY_NAV_SECTIONS = [
  { label: 'Overview', ids: ['home', 'tool:portal'] },
  { label: 'Tools',    ids: ['tool:diagnostic','tool:feedback','tool:homework','tool:practice','tool:inbox','tool:calendar','tool:reports','tool:templates'] },
];
// New section map for Phase 1 IDs
const NEW_NAV_SECTIONS = [
  { label: 'Today',    ids: ['dashboard'] },
  { label: 'Workflow', ids: ['students', 'calendar', 'diagnostics', 'homework', 'submissions'] },
  { label: 'Support',  ids: ['inbox', 'error-bank', 'reports', 'exercises'] },
  { label: 'Admin',    ids: ['settings'] },
];

export function Shell({ tabs = [], active, onTab, children, rightSlot, workflowActive, onWorkflowStage }) {

  const tabMap = Object.fromEntries(tabs.map(t => [t.id, t]));
  // Auto-detect which nav section map to use
  const isNewNav = tabs.some(t => t.id === 'dashboard' || t.id === 'students' || t.id === 'diagnostics');
  const NAV_SECTIONS = isNewNav ? NEW_NAV_SECTIONS : LEGACY_NAV_SECTIONS;
  const activeTab = tabMap[active];

  return (
    <div className="shell">
      <header className="shell-topbar">
        <div className="shell-brand">
          <span className="shell-brand-name">MET</span>
        </div>
        <nav className="shell-nav" aria-label="Main navigation">
          {NAV_SECTIONS.map(sec => {
            const items = sec.ids.map(id => tabMap[id]).filter(Boolean);
            if (!items.length) return null;
            return (
              <div key={sec.label} className="shell-nav-section">
                <span className="shell-nav-section-label">{sec.label}</span>
                {items.map(tab => (
                  <button key={tab.id}
                    className={`shell-nav-btn ${active === tab.id ? 'active' : ''}`}
                    aria-current={active === tab.id ? 'page' : undefined}
                    onClick={() => onTab(tab.id)}>
                    <span style={{ opacity:0.85, flexShrink:0 }}>{tab.icon}</span>
                    {tab.label}
                    {tab.badge > 0 && (
                      <span style={{
                        marginLeft:4, background:'var(--danger)', color:'#fff',
                        borderRadius:'var(--radius-pill)', padding:'1px 6px',
                        fontSize:10, fontWeight:700, minWidth:18, textAlign:'center',
                      }}>{tab.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="shell-mobile-title">
          <strong>{activeTab?.label || 'Workspace'}</strong>
          <span>MET Teacher</span>
        </div>
        {workflowActive && <WorkflowStageStrip active={workflowActive} onStage={onWorkflowStage} />}
        {rightSlot && <div style={{ display:'flex', alignItems:'center', gap:10 }}>{rightSlot}</div>}
      </header>
      <main className="shell-main">{children}</main>
      <nav className="shell-mobile-nav" aria-label="Mobile navigation">
        {tabs.filter(t => t.mobile !== false && ['dashboard','students','diagnostics','homework','submissions'].includes(t.id)).map(tab => (
          <button key={tab.id}
            className={`shell-mobile-nav-btn${active === tab.id ? ' active' : ''}`}
            aria-current={active === tab.id ? 'page' : undefined}
            onClick={() => onTab(tab.id)}>
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}


/* ─── Modal ──────────────────────────────────────────────────── */
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, kicker, title, subtitle, maxWidth = 680, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;

    // Focus first focusable element after paint
    const timer = setTimeout(() => {
      const els = dialogRef.current?.querySelectorAll(FOCUSABLE);
      els?.[0]?.focus();
    }, 0);

    function handleKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const els = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE));
      if (!els.length) return;
      if (e.shiftKey && document.activeElement === els[0]) {
        e.preventDefault(); els[els.length - 1].focus();
      } else if (!e.shiftKey && document.activeElement === els[els.length - 1]) {
        e.preventDefault(); els[0].focus();
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }
  return (
    <div
      className="modal-overlay-enter modal-overlay"
      onClick={handleBackdrop}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-card-enter modal-card"
        style={{ maxWidth }}
      >
        <div className="modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            {kicker && (
              <div className="modal-kicker">{kicker}</div>
            )}
            <div id="modal-title" className="modal-title">{title}</div>
            {subtitle && (
              <div className="modal-subtitle">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="modal-close"
          >
            <Icon.close size={14} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ─── callAI (see src/lib/callAI.js) ────────────────────────── */
export { callAI, summarizeTranscript } from '../lib/callAI.js';




