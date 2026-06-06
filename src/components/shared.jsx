/**
 * shared.jsx — V.V. Method Platform Design System
 * Core UI primitives, icons, layout shell, and AI utilities.
 */

import { useState, useRef, useEffect } from 'react';

/* ─── CSS CUSTOM PROPERTIES (injected once) ─────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;700;800&family=JetBrains+Mono:wght@500&display=swap');
  :root {
    /* ── Ocean Depths theme ── */
    --accent:       #2d8b8b;
    --accent-deep:  #1a2332;
    --accent-soft:  #a8dadc;
    --accent-subtle:#e4f2f2;
    --primary:      #3da6a6;
    --primary-ink:  #247070;
    --on-dark:      #f1faee;
    --on-dark-muted:rgba(241,250,238,0.68);
    --bg:           #f0f6f6;
    --bg-deep:      #dceeed;
    --surface:      #FFFFFF;
    --border:       #c2d9d9;
    --divider:      #e2efef;
    --faint:        #edf4f4;
    --text:         #1a2332;
    --text-2:       #2a3d4e;
    --muted:        #4d6672;
    --accent-text:  #0f5555;
    --warning-text: #B45309;
    --success:      #059669;
    --success-bg:   #ECFDF5;
    --success-soft: #D1FAE5;
    --info:         #2d8b8b;
    --info-bg:      #e4f2f2;
    --warning:      #D97706;
    --warning-bg:   #FFFBEB;
    --warning-soft: #FDE68A;
    --danger:       #B91C1C;
    --danger-bg:    #FEF2F2;
    --danger-soft:  #FECACA;
    --orange:       #F97316;
    --orange-deep:  #EA580C;
    --dark-accent-border: rgba(168,218,220,0.15);
    --radius-sm:    8px;
    --radius-md:    14px;
    --radius-lg:    22px;
    --radius-pill:  999px;
    --text-xs:      12px;
    --text-sm:      13px;
    --text-md:      14.5px;
    --text-lg:      16px;
    --text-xl:      18px;
    --text-2xl:     22px;
    --text-3xl:     28px;
    --font-ui:      'DM Sans', 'Segoe UI', sans-serif;
    --font-display: 'Plus Jakarta Sans', 'DM Sans', sans-serif;
    --font-mono:    'JetBrains Mono', 'Fira Mono', monospace;
    --ease:         cubic-bezier(0.16, 1, 0.3, 1);
    --shadow-card:  0 16px 35px -20px rgba(26, 35, 50, 0.2), 0 3px 8px rgba(26, 35, 50, 0.06);
    --shadow-modal: 0 24px 58px -24px rgba(26, 35, 50, 0.3), 0 8px 20px rgba(26, 35, 50, 0.1);
    --shadow-toast: 0 4px 16px rgba(26, 35, 50, 0.18);
    --space-1:  4px;
    --space-2:  6px;
    --space-3:  8px;
    --space-4:  10px;
    --space-5:  12px;
    --space-6:  14px;
    --space-7:  16px;
    --space-8:  20px;
    --space-9:  24px;
    --space-10: 28px;
    --space-11: 32px;
    --space-12: 40px;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--font-ui);
    background:
      radial-gradient(1300px 460px at 105% -10%, rgba(45,139,139,0.12), transparent 55%),
      radial-gradient(800px 360px at -15% 20%, rgba(168,218,220,0.15), transparent 60%),
      linear-gradient(140deg, #f3f8f8 0%, #edf5f5 50%, #f6fafa 100%);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    font-size: var(--text-md);
    line-height: 1.55;
  }
  [data-cards="flat"]     .card { border: none; box-shadow: none; background: var(--bg); }
  [data-cards="bordered"] .card { border: 1px solid var(--border); box-shadow: none; background: var(--surface); }
  [data-cards="shadowed"] .card { border: none; box-shadow: var(--shadow-card); background: var(--surface); }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    font-family: var(--font-ui); font-size: var(--text-sm); font-weight: 600;
    cursor: pointer; border: none; outline: none;
    border-radius: var(--radius-md); padding: 9px 16px; line-height: 1;
    transition: background 0.15s, box-shadow 0.15s, opacity 0.15s, transform 0.15s;
    white-space: nowrap; text-decoration: none;
  }
  .btn:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
  .btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-primary  { background: var(--primary); color: #fff; box-shadow: 0 8px 20px -12px rgba(45,139,139,0.6); }
  .btn-primary:hover:not(:disabled) { background: #349a9a; }
  .btn-accent   { background: var(--accent-deep); color: #fff; }
  .btn-accent:hover:not(:disabled) { background: #131a28; }
  .btn-ghost    { background: transparent; color: var(--text-2); border: 1px solid var(--border); }
  .btn-ghost:hover:not(:disabled) { background: var(--bg-deep); filter: none; transform: none; }
  .btn-quiet    { background: transparent; color: var(--muted); }
  .btn-quiet:hover:not(:disabled) { background: var(--divider); color: var(--text); filter: none; transform: none; }
  .btn-danger   { background: var(--danger); color: #fff; }
  .btn-danger:hover:not(:disabled) { background: #B91C1C; }
  .btn-sm  { padding: 8px 12px; font-size: var(--text-xs); border-radius: var(--radius-sm); min-height: 32px; }
  .btn-lg  { padding: 11px 22px; font-size: var(--text-md); }
  .btn-block { width: 100%; }
  .btn-icon  { padding: 13px; border-radius: var(--radius-sm); }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  .card {
    background: var(--surface);
    border: 1px solid rgba(168, 218, 220, 0.35);
    border-radius: var(--radius-lg); padding: 20px;
    box-shadow: var(--shadow-card);
  }
  .card-sm { padding: 14px; border-radius: var(--radius-md); }
  .pill {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: var(--text-xs); font-weight: 600; line-height: 1;
    padding: 3px 8px; border-radius: var(--radius-pill); white-space: nowrap;
  }
  .pill-default { background: var(--bg-deep); color: var(--text-2); }
  .pill-accent  { background: var(--accent-subtle); color: var(--accent-text); }
  .pill-success { background: var(--success-bg); color: var(--success); }
  .pill-warning { background: var(--warning-bg); color: var(--warning-text); }
  .pill-danger  { background: var(--danger-bg);  color: var(--danger);  }
  .pill-muted   { background: var(--divider);    color: var(--muted);   }
  .pill-info    { background: var(--info-bg);    color: var(--accent-text); }
  .shell { display: flex; height: 100dvh; overflow: hidden; background: transparent; }
  .shell-sidebar {
    width: 248px; flex-shrink: 0; background:
      radial-gradient(620px 240px at -30% -20%, rgba(45,139,139,0.25), transparent 60%),
      linear-gradient(180deg, #131d2a 0%, #1a2332 55%, #0f1720 100%);
    display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden;
    border-right: 1px solid rgba(168,218,220,0.15);
  }
  .shell-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .shell-topbar {
    height: 58px; flex-shrink: 0; background: rgba(255,255,255,0.78);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(168, 218, 220, 0.25);
    display: flex; align-items: center; padding: 0 20px; gap: 12px;
  }
  .shell-main { flex: 1; overflow-y: auto; overflow-x: hidden; }
  .shell-brand { padding: 20px 16px 14px; border-bottom: 1px solid var(--dark-accent-border); }
  .shell-brand-name { font-size: var(--text-lg); font-family: var(--font-display); font-weight: 800; color: #fff; letter-spacing: 0.01em; display: block; }
  .shell-brand-sub  { font-size: 12px; color: var(--on-dark-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; display: block; }
  .shell-nav { flex: 1; padding: 12px 8px; }
  .shell-nav-section { margin-bottom: 18px; }
  .shell-nav-section-label { font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--on-dark-muted); padding: 0 8px; margin-bottom: 4px; }
  .shell-nav-btn {
    display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px;
    border-radius: var(--radius-md); background: none; border: none; cursor: pointer;
    font-family: var(--font-ui); font-size: var(--text-sm); font-weight: 500;
    color: rgba(255,255,255,0.82); transition: background 0.12s, color 0.12s; text-align: left;
  }
  .shell-nav-btn:hover  { background: rgba(255,255,255,0.14); color: #fff; }
  .shell-nav-btn:focus-visible { outline: 2px solid rgba(168,218,220,0.9); outline-offset: 1px; }
  .shell-nav-btn.active {
    background: rgba(61,166,166,0.22);
    color: #fff;
    font-weight: 700;
    border: 1px solid rgba(168,218,220,0.35);
  }
  .shell-user { padding: 12px 14px; border-top: 1px solid var(--dark-accent-border); display: flex; align-items: center; gap: 9px; }
  .shell-user-name { font-size: var(--text-xs); color: #fff; font-weight: 600; }
  .shell-user-role { font-size: 12px; color: var(--on-dark-muted); }
  .workflow-strip { display: flex; align-items: center; padding: 0 20px; height: 36px; background: linear-gradient(90deg, rgba(240,248,248,0.82), rgba(244,250,250,0.4)); border-bottom: 1px solid rgba(168,218,220,0.25); overflow-x: auto; scrollbar-width: none; }
  .workflow-strip::-webkit-scrollbar { display: none; }
  .workflow-step { display: flex; align-items: center; gap: 6px; font-size: var(--text-xs); font-weight: 600; color: var(--muted); padding: 0 10px; cursor: pointer; white-space: nowrap; border: none; background: none; font-family: var(--font-ui); height: 100%; transition: color 0.12s; }
  .workflow-step:hover { color: var(--accent); }
  .workflow-step.active { color: var(--accent); }
  .workflow-step.done   { color: var(--success); }
  .workflow-sep { color: var(--border); font-size: 11px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .section-title { font-size: var(--text-lg); font-weight: 700; color: var(--text); }
  .section-sub   { font-size: var(--text-sm); color: var(--muted); margin-top: 2px; }
  .kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
  .kpi-label { font-size: var(--text-sm); font-weight: 500; color: var(--text-2); flex: 1; min-width: 0; }
  .kpi-value { font-size: var(--text-xl); font-weight: 700; color: var(--text); line-height: 1; flex-shrink: 0; }
  .kpi-sub   { font-size: var(--text-xs); color: var(--muted); margin-top: 2px; }
  .kpi-trend { display: inline-flex; align-items: center; gap: 3px; font-size: var(--text-xs); font-weight: 600; }
  .kpi-trend.up { color: var(--success); } .kpi-trend.down { color: var(--danger); }
  .review-badge { display: inline-flex; align-items: center; gap: 5px; font-size: var(--text-xs); font-weight: 700; padding: 3px 9px; border-radius: var(--radius-pill); }
  .evidence-card { background: var(--accent-subtle); border: 1px solid var(--accent-soft); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 8px; }
  .evidence-card-label { font-size: var(--text-xs); font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
  .evidence-card-text { font-size: var(--text-sm); color: var(--text-2); line-height: 1.5; }
  .pill-nav { display: flex; gap: 6px; flex-wrap: wrap; }
  .pill-nav-btn { padding: 6px 14px; min-height: 36px; border-radius: var(--radius-pill); font-size: var(--text-sm); font-weight: 500; background: var(--divider); color: var(--text-2); border: none; cursor: pointer; font-family: var(--font-ui); transition: background 0.12s, color 0.12s; }
  .pill-nav-btn:hover  { background: var(--bg-deep); color: var(--text); }
  .pill-nav-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  .pill-nav-btn.active { background: var(--accent); color: #fff; font-weight: 600; }
  .mini-bars { display: flex; align-items: flex-end; gap: 2px; height: 28px; }
  .mini-bar  { flex: 1; min-width: 3px; border-radius: 2px 2px 0 0; background: var(--accent-soft); transition: background 0.2s; }
  .mini-bar.lit { background: var(--accent); }
  .shell-mobile-nav { display: none; }
  @media (max-width: 768px) {
    .shell-mobile-nav {
      display: flex; position: fixed; bottom: 0; left: 0; right: 0;
      height: 60px; padding-bottom: env(safe-area-inset-bottom, 0px);
      background: var(--surface); border-top: 1px solid var(--border);
      z-index: 50;
    }
    .shell-main { padding-bottom: 68px; }
  }
  .shell-mobile-nav-btn {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; border: none; background: none; cursor: pointer;
    font-family: var(--font-ui); font-size: 10px; font-weight: 500; line-height: 1;
    color: var(--muted); padding: 6px 2px; min-height: 44px;
    transition: color 0.12s;
  }
  .shell-mobile-nav-btn.active { color: var(--primary); font-weight: 700; }
  .shell-mobile-nav-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; border-radius: var(--radius-sm); }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulseDot {
    0% { transform: scale(1); opacity: .7; }
    50% { transform: scale(1.22); opacity: 1; }
    100% { transform: scale(1); opacity: .7; }
  }
  @keyframes edgeFlow {
    from { stroke-dashoffset: 54; }
    to { stroke-dashoffset: 0; }
  }
  .fade-up { animation: fadeUp 0.22s var(--ease) both; }
  .page-shell { padding: 28px 24px; }
  .page-inner { max-width: 1100px; margin: 0 auto; }
  .page-inner-narrow { max-width: 780px; margin: 0 auto; }
  .input { width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); font-family: var(--font-ui); font-size: var(--text-sm); color: var(--text); background: var(--surface); outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
  .input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--accent-soft); }
  textarea.input { resize: vertical; min-height: 80px; line-height: 1.5; }
  select.input { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; }
  .public-landing { min-height: 100dvh; background: var(--bg); }
  .public-topbar { background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10; }
  .public-topbar-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; height: 54px; display: flex; align-items: center; justify-content: space-between; }
  .public-tabs { display: flex; gap: 4px; }
  .public-tab { padding: 6px 14px; border-radius: var(--radius-pill); background: none; border: none; cursor: pointer; font-family: var(--font-ui); font-size: var(--text-sm); font-weight: 500; color: var(--muted); transition: background 0.12s, color 0.12s; }
  .public-tab.active, .public-tab:hover { background: var(--bg-deep); color: var(--text); }
  .public-content { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
  .public-login-bridge { position: relative; }
  .public-back-btn { position: fixed; top: 14px; left: 14px; z-index: 20; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-pill); padding: 6px 14px; font-size: var(--text-sm); font-weight: 500; cursor: pointer; font-family: var(--font-ui); color: var(--text-2); box-shadow: var(--shadow-card); }
  .landing-stack { display: flex; flex-direction: column; gap: 24px; }
  .landing-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .landing-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px 24px; }
  .landing-card h1 { font-size: var(--text-3xl); font-weight: 800; line-height: 1.2; color: var(--text); margin-bottom: 12px; }
  .landing-card h2 { font-size: var(--text-xl); font-weight: 700; color: var(--text); margin-bottom: 14px; }
  .landing-card h3 { font-size: var(--text-md); font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .landing-card p  { font-size: var(--text-md); color: var(--text-2); line-height: 1.6; margin-bottom: 14px; }
  .landing-card ul { padding-left: 18px; color: var(--text-2); font-size: var(--text-sm); line-height: 1.9; margin-bottom: 16px; }
  .landing-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
  .landing-actions.center { justify-content: center; }
  .landing-proof { font-size: var(--text-xs); color: var(--muted); margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--divider); }
  .landing-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .landing-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .landing-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .landing-tile { background: var(--faint); border: 1px solid var(--divider); border-radius: var(--radius-md); padding: 14px; }
  .landing-tile h3 { font-size: var(--text-sm); font-weight: 700; margin-bottom: 6px; }
  .landing-tile p  { font-size: var(--text-xs); color: var(--muted); line-height: 1.5; margin-bottom: 10px; }
  .landing-tile ul { padding-left: 14px; font-size: var(--text-xs); color: var(--muted); line-height: 1.8; margin-bottom: 10px; }
  .landing-final { text-align: center; }
  .landing-plan-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
  .landing-plan-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--bg-deep); border-radius: var(--radius-md); font-size: var(--text-sm); }
  .landing-plan-item strong { color: var(--accent); font-weight: 700; }
  .interactive-row { transition: background 0.15s, border-color 0.15s; cursor: pointer; }
  .interactive-row:hover { background: var(--faint) !important; border-color: var(--accent-soft) !important; }
  .teacher-overview-hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; align-items: start; }
  .teacher-overview-heroStack { display: grid; grid-template-columns: 1fr; gap: 14px; align-items: start; }
  .teacher-overview-kpis { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
  .teacher-overview-split { display: grid; grid-template-columns: 1.5fr 1fr; gap: 14px; align-items: start; }
  .teacher-overview-snapshot { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .overview-get-started { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
  .overview-get-started-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .quick-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .cycle-pipeline { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .cycle-pipeline button {
    border: 1px solid var(--border); background: var(--surface); border-radius: var(--radius-sm);
    padding: 8px; display: grid; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 6px;
    font-family: var(--font-ui); font-size: var(--text-xs); color: var(--text-2); cursor: pointer;
  }
  .cycle-pipeline button.is-active { border-color: var(--accent); background: var(--accent-subtle); color: var(--accent-deep); }
  .cycle-pipeline-index { color: var(--muted); font-weight: 700; }
  .cycle-pipeline-icon { display: inline-flex; color: var(--accent-deep); }
  @media (max-width: 768px) {
    .landing-hero-grid { grid-template-columns: 1fr; }
    .landing-grid-3 { grid-template-columns: 1fr 1fr; }
    .landing-grid-4 { grid-template-columns: 1fr 1fr; }
    .shell-sidebar  { display: none; }
    .teacher-overview-hero,
    .teacher-overview-split,
    .teacher-overview-snapshot { grid-template-columns: 1fr; }
    .teacher-overview-kpis { grid-template-columns: 1fr 1fr; }
    .quick-actions-grid { grid-template-columns: 1fr; }
    .cycle-pipeline { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

let cssInjected = false;
export function injectGlobalCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = GLOBAL_CSS;
  document.head.prepend(style);
  cssInjected = true;
}

/* ─── ICON SYSTEM ───────────────────────────────────────────── */
function SvgIcon({ d, children, size = 18, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" style={style}>
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
  send:     (p) => <SvgIcon d="M22 2L11 13 M22 2L15 22l-4-9-9-4 22-7z" {...p} />,
  mic:      (p) => <SvgIcon {...p}><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></SvgIcon>,
  star:     (p) => <SvgIcon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...p} />,
  spark:    (p) => <SvgIcon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" {...p} />,
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
};

/* ─── AVATAR ─────────────────────────────────────────────────── */
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
export function Button({
  children, variant = 'primary', size: sz = 'md',
  onClick, disabled, type = 'button', block, icon, style, className = ''
}) {
  const cls = ['btn', `btn-${variant}`,
    sz === 'sm' ? 'btn-sm' : sz === 'lg' ? 'btn-lg' : '',
    block ? 'btn-block' : '', className
  ].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} style={style}>
      {icon}{children}
    </button>
  );
}

/* ─── CARD ───────────────────────────────────────────────────── */
export function Card({ children, style, className = '', small }) {
  return <div className={`card ${small ? 'card-sm' : ''} ${className}`} style={style}>{children}</div>;
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

/* ─── REVIEW STATUS BADGE ────────────────────────────────────── */
const RS = {
  'not-started':        { label:'Not started',     bg:'var(--divider)',    fg:'var(--muted)',   dot:'#94A3B8' },
  'in-progress':        { label:'In progress',     bg:'var(--info-bg)',    fg:'var(--info)',    dot:'var(--info)' },
  'submitted':          { label:'Submitted',       bg:'var(--warning-bg)', fg:'var(--warning)', dot:'var(--warning)' },
  'corrected':          { label:'Corrected',       bg:'var(--success-bg)', fg:'var(--success)', dot:'var(--success)' },
  'revision-requested': { label:'Revision needed', bg:'var(--danger-bg)',  fg:'var(--danger)',  dot:'var(--danger)' },
  'completed':          { label:'Completed',       bg:'var(--success-soft)',fg:'var(--success)',dot:'var(--success)' },
  'draft':              { label:'Draft',           bg:'var(--divider)',    fg:'var(--muted)',   dot:'#94A3B8' },
  'queued':             { label:'Queued',          bg:'var(--info-bg)',    fg:'var(--info)',    dot:'var(--info)' },
  'reviewed':           { label:'Reviewed',        bg:'var(--success-bg)', fg:'var(--success)', dot:'var(--success)' },
  'overdue':            { label:'Overdue',         bg:'var(--danger-bg)',  fg:'var(--danger)',  dot:'var(--danger)' },
};
export function ReviewStatusBadge({ status }) {
  const s = RS[status] || RS['not-started'];
  return (
    <span className="review-badge" role="status" aria-label={`Status: ${s.label}`} style={{ background: s.bg, color: s.fg }}>
      <span aria-hidden="true" style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
      {s.label}
    </span>
  );
}

/* ─── STUDENT FEEDBACK VIEW ──────────────────────────────────── */
/**
 * Renders the structured studentFeedback object as a clean, student-facing report:
 * opening paragraph → What you did well → What to improve → Final note.
 * Shared by the teacher review (diagnostic-create) and the student dashboard.
 */
export function StudentFeedbackView({ feedback }) {
  if (!feedback || typeof feedback !== 'object') return null;
  const wins = (Array.isArray(feedback.whatYouDidWell) ? feedback.whatYouDidWell : [])
    .filter(w => w && (w.strength || w.explanation));
  const fixes = (Array.isArray(feedback.whatToImprove) ? feedback.whatToImprove : [])
    .filter(f => f && (f.area || f.howToImprove || f.insteadOf));

  // Each part gets its own card (same content as before, just grouped visually).
  const card = {
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    padding: 16, background: 'var(--surface)',
  };
  const cardTitle = {
    fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: '72ch', borderTop: '3px solid var(--accent)', paddingTop: 14 }}>
      {/* Opening card */}
      {feedback.classFocus && (
        <div style={card}>
          <div style={{ ...cardTitle, color: 'var(--primary)' }}>Your class focus</div>
          <p style={{ fontSize: 'var(--text-md)', lineHeight: 1.75, color: 'var(--text)', margin: 0 }}>{feedback.classFocus}</p>
        </div>
      )}

      {/* Strengths card */}
      {wins.length > 0 && (
        <div style={card}>
          <div style={{ ...cardTitle, color: 'var(--success)' }}><Icon.check size={13} /> What you did well</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {wins.map((w, i) => (
              <div key={i} style={{ paddingLeft: 14, borderLeft: '3px solid var(--success)' }}>
                {w.strength && (
                  <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{w.strength}</div>
                )}
                {w.explanation && (
                  <p style={{ fontSize: 'var(--text-md)', lineHeight: 1.7, margin: 0, color: 'var(--text)' }}>{w.explanation}</p>
                )}
                {w.example && (
                  <p style={{ fontSize: 'var(--text-md)', lineHeight: 1.7, margin: '4px 0 0', color: 'var(--text-2)', fontStyle: 'italic' }}>
                    “{w.example}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Focus areas card */}
      {fixes.length > 0 && (
        <div style={card}>
          <div style={{ ...cardTitle, color: 'var(--warning-text)' }}>What to improve</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {fixes.map((f, i) => (
              <div key={i} style={{ paddingLeft: 14, borderLeft: '3px solid var(--warning-text)' }}>
                {f.area && (
                  <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{f.area}</div>
                )}
                {(f.insteadOf || f.sayInstead) && (
                  <p style={{ fontSize: 'var(--text-md)', lineHeight: 1.7, margin: '0 0 4px', color: 'var(--text)' }}>
                    {f.insteadOf && <>You said <em style={{ color: 'var(--danger)' }}>“{f.insteadOf}”</em></>}
                    {f.insteadOf && f.sayInstead && <> — try </>}
                    {!f.insteadOf && f.sayInstead && <>Try </>}
                    {f.sayInstead && <em style={{ color: 'var(--success)', fontWeight: 600 }}>“{f.sayInstead}”</em>}
                    {(f.insteadOf || f.sayInstead) && '.'}
                  </p>
                )}
                {f.howToImprove && (
                  <p style={{ fontSize: 'var(--text-md)', lineHeight: 1.7, margin: 0, color: 'var(--text)' }}>{f.howToImprove}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closing card */}
      {feedback.finalNote && (
        <div style={card}>
          <div style={{ ...cardTitle, color: 'var(--muted)' }}>A note to you</div>
          <p style={{ fontSize: 'var(--text-md)', lineHeight: 1.75, margin: 0, color: 'var(--text-2)' }}>
            {feedback.finalNote}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── EVIDENCE CARD ──────────────────────────────────────────── */
export function EvidenceCard({ label, children }) {
  return (
    <div className="evidence-card">
      {label && <div className="evidence-card-label">{label}</div>}
      <div className="evidence-card-text">{children}</div>
    </div>
  );
}

/* ─── MINI BARS ──────────────────────────────────────────────── */
export function MiniBars({ values = [], max }) {
  const peak = max || Math.max(...values, 1);
  return (
    <div className="mini-bars">
      {values.map((v, i) => (
        <div key={i} className={`mini-bar ${i === values.length - 1 ? 'lit' : ''}`}
          style={{ height: `${Math.max(10, (v / peak) * 100)}%` }} />
      ))}
    </div>
  );
}

/* ─── STUDENT FLOW ───────────────────────────────────────────── */
export const STUDENT_FLOW = [
  { id:'home', label:'Home' },
  { id:'do', label:'Do homework' },
  { id:'submit', label:'Submit' },
  { id:'review', label:'Review feedback' },
  { id:'improve', label:'Practice Studio' },
];

/* ─── WORKFLOW STAGE STRIP ───────────────────────────────────── */
const WORKFLOW_STAGES = [
  { id:'diagnose', label:'1 · Diagnose' },
  { id:'feedback', label:'2 · Feedback' },
  { id:'homework', label:'3 · Homework' },
];
export function WorkflowStageStrip({ active, onStage, stages, onStageClick }) {
  const list = stages || WORKFLOW_STAGES;
  const activeIdx = list.findIndex(s => s.id === active);
  return (
    <nav className="workflow-strip" aria-label="Workflow steps">
      {list.map((s, i) => (
        <span key={s.id} style={{ display:'flex', alignItems:'center' }}>
          <button
            className={`workflow-step ${active === s.id ? 'active' : ''} ${i < activeIdx ? 'done' : ''}`}
            aria-current={active === s.id ? 'step' : undefined}
            onClick={() => (onStage || onStageClick)?.(s.id)}
          >
            {i < activeIdx && <Icon.check size={11} />}
            {s.label}
          </button>
          {i < list.length - 1 && <span className="workflow-sep" aria-hidden="true">›</span>}
        </span>
      ))}
    </nav>
  );
}

/* ─── STUDENT NEXT TASK ──────────────────────────────────────── */
export function StudentNextTask({ task, onAction, onStart, onSecondary }) {
  if (!task) return null;
  const primaryAction = task.action || 'start';
  const handlePrimary = () => {
    if (onAction) return onAction(primaryAction);
    if (onStart) return onStart(primaryAction);
  };
  const handleSecondary = () => {
    if (onAction) return onAction('secondary');
    if (onSecondary) return onSecondary();
  };
  return (
    <div style={{
      background:'var(--accent-deep)', color:'#fff', borderRadius:'var(--radius-lg)',
      padding:'16px 20px', display:'flex', alignItems:'center',
      justifyContent:'space-between', gap:12,
    }}>
      <div>
        <div style={{ fontSize:'var(--text-xs)', color:'var(--on-dark-muted)', fontWeight:600,
          textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Up next</div>
        <div style={{ fontWeight:700, fontSize:'var(--text-md)' }}>{task.title}</div>
        {(task.sub || task.description) && <div style={{ fontSize:'var(--text-sm)', color:'var(--on-dark-muted)', marginTop:2 }}>{task.sub || task.description}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={handlePrimary} style={{
          background:'rgba(255,255,255,0.15)', color:'#fff', border:'none',
          borderRadius:'var(--radius-md)', padding:'8px 16px',
          fontSize:'var(--text-sm)', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-ui)',
        }}>Start</button>
        {(onSecondary || onAction) && (
          <button onClick={handleSecondary} style={{
            background:'rgba(255,255,255,0.08)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)',
            borderRadius:'var(--radius-md)', padding:'8px 12px',
            fontSize:'var(--text-sm)', fontWeight:500, cursor:'pointer', fontFamily:'var(--font-ui)',
          }}>Inbox</button>
        )}
      </div>
    </div>
  );
}

/* ─── RECOMMENDED NEXT STEP ──────────────────────────────────── */
export function RecommendedNextStep({ title, detail, message, stage, status, icon, onAction, actionTarget, actionLabel }) {
  const finalDetail = detail || message || '';
  const buttonLabel = actionLabel || 'Open';
  return (
    <div style={{
      background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)',
      padding:'16px 18px', display:'flex', alignItems:'flex-start', gap:14,
    }}>
      {icon && (
        <div style={{
          width:38, height:38, borderRadius:'var(--radius-md)',
          background:'var(--accent-soft)', color:'var(--accent)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>{icon}</div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:'var(--text-sm)', marginBottom:3 }}>{title}</div>
        {finalDetail && <div style={{ fontSize:'var(--text-xs)', color:'var(--muted)', lineHeight:1.5 }}>{finalDetail}</div>}
        {(stage || status) && (
          <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
            {stage && <Pill tone="accent">{stage}</Pill>}
            {status && <ReviewStatusBadge status={status} />}
          </div>
        )}
      </div>
      {actionTarget && (
        <button onClick={() => onAction?.(actionTarget)} style={{
          background:'var(--accent)', color:'#fff', border:'none',
          borderRadius:'var(--radius-md)', padding:'7px 14px',
          fontSize:'var(--text-xs)', fontWeight:600, cursor:'pointer',
          fontFamily:'var(--font-ui)', flexShrink:0,
        }}>{buttonLabel} →</button>
      )}
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
  { label: 'Main',     ids: ['dashboard', 'students', 'calendar'] },
  { label: 'Teaching', ids: ['diagnostics', 'homework', 'submissions', 'inbox', 'error-bank'] },
  { label: 'Reports',  ids: ['reports', 'settings'] },
];

export function Shell({ tabs = [], active, onTab, children, rightSlot, workflowActive, onWorkflowStage }) {
  injectGlobalCSS();
  const tabMap = Object.fromEntries(tabs.map(t => [t.id, t]));
  // Auto-detect which nav section map to use
  const isNewNav = tabs.some(t => t.id === 'dashboard' || t.id === 'students' || t.id === 'diagnostics');
  const NAV_SECTIONS = isNewNav ? NEW_NAV_SECTIONS : LEGACY_NAV_SECTIONS;

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <span className="shell-brand-name">V.V. Method</span>
          <span className="shell-brand-sub">MET Preparation</span>
        </div>
        <nav className="shell-nav" aria-label="Main navigation">
          {NAV_SECTIONS.map(sec => {
            const items = sec.ids.map(id => tabMap[id]).filter(Boolean);
            if (!items.length) return null;
            return (
              <div key={sec.label} className="shell-nav-section">
                <div className="shell-nav-section-label">{sec.label}</div>
                {items.map(tab => (
                  <button key={tab.id}
                    className={`shell-nav-btn ${active === tab.id ? 'active' : ''}`}
                    aria-current={active === tab.id ? 'page' : undefined}
                    onClick={() => onTab(tab.id)}>
                    <span style={{ opacity:0.85, flexShrink:0 }}>{tab.icon}</span>
                    {tab.label}
                    {tab.badge > 0 && (
                      <span style={{
                        marginLeft:'auto', background:'var(--danger)', color:'#fff',
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
      </aside>
      <div className="shell-content">
        <header className="shell-topbar">
          <div style={{ flex:1 }}>
            {workflowActive && <WorkflowStageStrip active={workflowActive} onStage={onWorkflowStage} />}
          </div>
          {rightSlot && <div style={{ display:'flex', alignItems:'center', gap:10 }}>{rightSlot}</div>}
        </header>
        <main className="shell-main">{children}</main>
      </div>
      <nav className="shell-mobile-nav" aria-label="Mobile navigation">
        {tabs.slice(0, 5).map(tab => (
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

/* ─── callAI ─────────────────────────────────────────────────── */
const API_KEY_LS = 'vv:anthropic_api_key';
const ANTHROPIC_MODEL = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4.1-mini';
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
// Gemini API key also serves Google's open Gemma models on the same endpoint.
// Cascade through several; override via VITE_GEMINI_MODELS or 'vv:gemini_models'.
const GEMINI_DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  // Gemma model availability varies by key/region; the cascade skips any that 404.
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it',
];
function geminiModels() {
  const parse = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
  const fromEnv = parse(import.meta.env.VITE_GEMINI_MODELS);
  let fromLs = [];
  try { fromLs = parse(localStorage.getItem('vv:gemini_models')); } catch { /* storage unavailable */ }
  // An explicit list override (env or localStorage) wins exactly as given — don't
  // prepend the default primary model, or an operator could never remove a
  // retired/rate-limited one. Only the default path honors VITE_GEMINI_MODEL first.
  const override = fromEnv.length ? fromEnv : fromLs;
  const list = override.length ? override : [GEMINI_MODEL, ...GEMINI_DEFAULT_MODELS];
  return list.filter(Boolean).filter((m, i, a) => a.indexOf(m) === i);
}

// OpenRouter: one key, OpenAI-compatible, cascades through its free models.
// Override the list via VITE_OPENROUTER_MODELS or the 'vv:openrouter_models'
// localStorage key (comma-separated). Free model ids end in ':free'; if one is
// unavailable or rate-limited the cascade simply tries the next.
const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_DEFAULT_MODELS = [
  // Best → fastest. Rate limit is PER MODEL on OpenRouter free tier — each is an independent quota bucket.
  // Removed: gemini-2.0-flash-exp:free (retired), mistral-small-3.2 (wrong version number).
  'deepseek/deepseek-chat-v3-0324:free',               // DeepSeek V3 — best overall quality
  'meta-llama/llama-3.3-70b-instruct:free',            // Llama 3.3 70B — solid, reliable
  'nvidia/llama-3.1-nemotron-70b-instruct:free',       // NVIDIA Nemotron 70B — high quality
  'qwen/qwen3-235b-a22b:free',                         // Qwen3 235B MoE — very capable, newest
  'qwen/qwen-2.5-72b-instruct:free',                   // Qwen 2.5 72B — proven quality
  'nvidia/llama-3.3-nemotron-super-49b-v1:free',       // NVIDIA Nemotron Super 49B — strong mid
  'meta-llama/llama-4-scout:free',                     // Llama 4 Scout — newer, large context
  'deepseek/deepseek-r1-0528:free',                    // DeepSeek R1 — reasoning, slower
  'google/gemma-3-27b-it:free',                        // Gemma 3 27B — Google, same family as Gemini
  'nvidia/nemotron-nano-12b-instruct:free',            // NVIDIA Nemotron Nano 12B VL — compact
  'mistralai/mistral-small-3.1-24b-instruct:free',     // Mistral Small 3.1 — decent mid-tier
  'nvidia/llama-3.1-nemotron-nano-8b-v1:free',         // NVIDIA Nemotron Nano 8B — fast fallback
  'meta-llama/llama-3.2-3b-instruct:free',             // 3B — last resort only
];
function openRouterModels() {
  const parse = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
  const fromEnv = parse(import.meta.env.VITE_OPENROUTER_MODELS);
  let fromLs = [];
  try { fromLs = parse(localStorage.getItem('vv:openrouter_models')); } catch { /* storage unavailable */ }
  const list = fromEnv.length ? fromEnv : (fromLs.length ? fromLs : OPENROUTER_DEFAULT_MODELS);
  return list.filter((m, i, a) => a.indexOf(m) === i);
}

const AI_WINNER_LS = 'vv:ai_last_winner'; // sticky: provider/model that last succeeded this session

// A provider field may hold SEVERAL keys (comma- or newline-separated) so the
// cascade can rotate to a fresh key when one is rate-limited / out of quota.
// Combines env value(s) + the localStorage field, deduped, order preserved.
function multiKeys(envVal, lsKey) {
  const parse = s => String(s || '').split(/[,\n]/).map(x => x.trim()).filter(Boolean);
  let fromLs = [];
  try { fromLs = parse(localStorage.getItem(lsKey)); } catch { /* storage unavailable */ }
  return [...parse(envVal), ...fromLs].filter((k, i, a) => a.indexOf(k) === i);
}

export async function callAI(prompt, { max_tokens = 2048, system, temperature = 0.3, preferredProvider = null } = {}) {
  const sys = system || 'You are a helpful MET English teaching assistant.';
  const errors = []; // collect every provider failure so the real cause is surfaced

  // ── Server proxy first (/api/ai). Keeps provider keys OFF the client bundle:
  // the serverless function runs the cascade with server-only env keys. We try it
  // before any browser-direct call. It returns { content:[{text}] } on success,
  // 503 when the server has no keys (→ fall through to localStorage keys below). ──
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system: sys, max_tokens, temperature, preferredProvider }),
    });
    const ctype = r.headers.get('content-type') || '';
    if (r.ok && ctype.includes('application/json')) {
      const data = await r.json();
      if (data?.content?.[0]?.text) return data;
    } else if (r.status !== 404 && ctype.includes('application/json')) {
      // 503 (no server keys) is expected on a fresh deploy — note it but keep going.
      const e = await r.json().catch(() => ({}));
      if (r.status !== 503) errors.push(`Server /api/ai: ${e.error?.message || r.status}`);
    }
  } catch (e) {
    errors.push(`Server /api/ai: ${e.message}`);
  }

  // Each provider can carry multiple keys; the cascade rotates through them.
  // NOTE: client-direct calls use ONLY keys entered in Settings (localStorage) —
  // env (VITE_) keys are intentionally NOT read here so they never get bundled
  // into the public client build. Configure provider keys server-side instead.
  const groqKeys = multiKeys('', 'vv:groq_api_key');
  const geminiKeys = multiKeys('', 'vv:gemini_api_key');
  const anthropicKeys = multiKeys('', API_KEY_LS);
  const openaiKeys = multiKeys('', 'vv:openai_api_key');
  const openrouterKeys = multiKeys('', 'vv:openrouter_api_key');
  const payload = { model: ANTHROPIC_MODEL, max_tokens, temperature, system: sys, messages: [{ role: 'user', content: prompt }] };

  // ── Provider attempts: each returns a result object on success, or null on failure (pushing to errors) ──
  async function tryGroq(key, model) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model, temperature, max_tokens,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { content: [{ text: data?.choices?.[0]?.message?.content || '' }] };
      }
      const err = await res.json().catch(() => ({}));
      errors.push(`Groq/${model}: ${err.error?.message || res.status}`);
    } catch (e) {
      errors.push(`Groq/${model}: ${e.message}`);
    }
    return null;
  }

  async function tryGemini(key, model = GEMINI_MODEL) {
    try {
      const isGemma = /^gemma/i.test(model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const gen = { temperature, maxOutputTokens: max_tokens };
      // Gemini 2.5 Flash / Flash-Lite "think" by default and that thinking consumes
      // the output token budget — leaving empty/truncated answers. Disable it so the
      // whole budget goes to the response. (Only Flash models allow budget 0; 2.5 Pro
      // cannot disable thinking, so don't touch its config.)
      if (/2\.5/.test(model) && /flash/i.test(model)) gen.thinkingConfig = { thinkingBudget: 0 };
      // Gemma has no system role — fold the system prompt into the user turn.
      const reqBody = isGemma
        ? {
            contents: [{ parts: [{ text: `${sys}\n\n${prompt}` }] }],
            generationConfig: gen,
          }
        : {
            systemInstruction: { parts: [{ text: sys }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: gen,
          };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
        if (text) return { content: [{ text }] };
        errors.push(`Gemini/${model}: empty response (${data?.candidates?.[0]?.finishReason || 'no candidates'})`);
      } else {
        const err = await res.json().catch(() => ({}));
        errors.push(`Gemini/${model}: ${err.error?.message || res.status}`);
      }
    } catch (e) {
      errors.push(`Gemini/${model}: ${e.message}`);
    }
    return null;
  }

  async function tryAnthropicDirect(key) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'x-api-key': key,
          'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
      const err = await res.json().catch(() => ({}));
      errors.push(`Anthropic: ${err.error?.message || res.status}`);
    } catch (e) {
      errors.push(`Anthropic: ${e.message}`);
    }
    return null;
  }

  async function tryOpenRouter(key, model) {
    try {
      const res = await fetch(OPENROUTER_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          // Optional ranking headers OpenRouter uses for its free-tier dashboards.
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://met-proficiency-mastery.netlify.app',
          'X-Title': 'MET Proficiency Mastery',
        },
        body: JSON.stringify({
          model, temperature, max_tokens,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content || '';
        if (text) return { content: [{ text }] };
        errors.push(`OpenRouter/${model}: empty response`);
      } else {
        const err = await res.json().catch(() => ({}));
        errors.push(`OpenRouter/${model}: ${err.error?.message || res.status}`);
      }
    } catch (e) {
      errors.push(`OpenRouter/${model}: ${e.message}`);
    }
    return null;
  }

  async function tryOpenAI(key) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: OPENAI_MODEL, temperature, max_completion_tokens: max_tokens,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { content: [{ text: data?.choices?.[0]?.message?.content || '' }] };
      }
      const err = await res.json().catch(() => ({}));
      errors.push(`OpenAI: ${err.error?.message || res.status}`);
    } catch (e) {
      errors.push(`OpenAI: ${e.message}`);
    }
    return null;
  }

  // ── Per-attempt timeout: skip a provider if it doesn't respond within 10 s ──
  function withTimeout(fn, ms = 10000) {
    return () => Promise.race([
      fn(),
      new Promise(resolve => setTimeout(() => {
        errors.push(`Timeout after ${ms / 1000}s`);
        resolve(null);
      }, ms)),
    ]);
  }

  // ── Build the default cascade order (Gemini → OpenRouter free models → Groq → Anthropic proxy → Anthropic direct → OpenAI) ──
  // For each model we rotate through every key for that provider, so a
  // rate-limited / out-of-quota key fails over to the next key before moving on.
  const baseAttempts = [];
  for (const model of (geminiKeys.length ? geminiModels() : [])) {
    geminiKeys.forEach((key, ki) => baseAttempts.push({ id: `gemini:${model}#${ki}`, run: withTimeout(() => tryGemini(key, model)) }));
  }
  for (const model of (openrouterKeys.length ? openRouterModels() : [])) {
    openrouterKeys.forEach((key, ki) => baseAttempts.push({ id: `openrouter:${model}#${ki}`, run: withTimeout(() => tryOpenRouter(key, model)) }));
  }
  if (groqKeys.length) {
    // Ordered best → fastest. openai/gpt-oss-* removed — not valid Groq IDs (always 404/timeout).
    const candidateModels = [
      GROQ_MODEL,
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'llama-3.3-70b-versatile',
      'qwen/qwen3-32b',
      'llama-3.1-8b-instant',
    ].filter(Boolean).filter((m, i, arr) => arr.indexOf(m) === i);
    for (const model of candidateModels) {
      groqKeys.forEach((key, ki) => baseAttempts.push({ id: `groq:${model}#${ki}`, run: withTimeout(() => tryGroq(key, model)) }));
    }
  }
  anthropicKeys.forEach((key, ki) => baseAttempts.push({ id: `anthropic-direct#${ki}`, run: withTimeout(() => tryAnthropicDirect(key)) }));
  openaiKeys.forEach((key, ki) => baseAttempts.push({ id: `openai#${ki}`, run: withTimeout(() => tryOpenAI(key)) }));

  // ── Round-robin rotation: cycle the starting provider across calls ──
  const ROUND_ROBIN_LS = 'vv:ai_rr_index';
  let rrIdx = 0;
  try { rrIdx = parseInt(localStorage.getItem(ROUND_ROBIN_LS) || '0', 10) || 0; } catch { /* ignore */ }

  const pivotProviders = ['gemini', 'openrouter', 'groq', 'openai', 'anthropic-direct'];
  const pivotAttempts = baseAttempts.filter(a => pivotProviders.some(p => a.id === p || a.id.startsWith(p + ':')));
  const pivotCount = pivotAttempts.length;

  let attempts = baseAttempts;
  if (pivotCount > 1) {
    const pivotId = pivotAttempts[rrIdx % pivotCount]?.id;
    const pivotPos = baseAttempts.findIndex(a => a.id === pivotId);
    if (pivotPos > 0) attempts = [...baseAttempts.slice(pivotPos), ...baseAttempts.slice(0, pivotPos)];
    try { localStorage.setItem(ROUND_ROBIN_LS, String((rrIdx + 1) % pivotCount)); } catch { /* ignore */ }
  }

  // ── preferredProvider: move all attempts for that provider to the front (overrides round-robin) ──
  if (preferredProvider) {
    const preferred = attempts.filter(a => a.id.startsWith(preferredProvider));
    const rest = attempts.filter(a => !a.id.startsWith(preferredProvider));
    if (preferred.length) attempts = [...preferred, ...rest];
  }

  // ── Sticky winner: honor only when it belongs to the preferred provider (or no preference set).
  // This prevents a rate-limited provider from being pinned first when the caller
  // explicitly wants a different one (e.g. preferredProvider:'gemini' should not be
  // overridden by a cached Groq winner that is now out of quota). ──
  let lastWinner = null;
  try { lastWinner = localStorage.getItem(AI_WINNER_LS); } catch { /* storage unavailable */ }
  if (lastWinner) {
    const winnerMatchesPref = !preferredProvider || lastWinner.startsWith(preferredProvider);
    if (winnerMatchesPref) {
      const idx = attempts.findIndex(a => a.id === lastWinner);
      if (idx > 0) attempts = [attempts[idx], ...attempts.filter((_, i) => i !== idx)];
    }
  }

  for (const attempt of attempts) {
    const result = await attempt.run();
    if (result) {
      try { localStorage.setItem(AI_WINNER_LS, attempt.id); } catch { /* storage unavailable */ }
      return result;
    }
  }

  // Nothing succeeded — surface the REAL provider errors, not a misleading single message
  if (errors.length) {
    throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
  }
  throw new Error('No AI provider configured. Add a key (e.g. GEMINI_API_KEY) to your Vercel project env vars, or enter one in Settings.');
}

/* ─── summarizeTranscript ────────────────────────────────────── */
export async function summarizeTranscript(transcript) {
  if (!transcript || transcript.length < 800) return transcript;
  const prompt = `Condense this class transcript to under 600 words. Keep all student errors, corrections, and notable moments.\n\n${transcript}`;
  const data = await callAI(prompt, { max_tokens: 800 });
  return data.content?.map(b => b.text || '').join('') || transcript;
}
