/**
 * shared.jsx — MET Proficiency Mastery Design System
 * Core UI primitives, icons, layout shell, and AI utilities.
 */

import { WorkflowStageStrip } from './domain-ui.jsx';

/* ─── CSS CUSTOM PROPERTIES (injected once) ─────────────────── */

export const COLORS = {
  TEAL: 'var(--accent)',
  NAVY: 'var(--accent-text)',
};

export const GRADIENTS = {
  TEAL_NAVY: 'linear-gradient(120deg, var(--accent) 0%, var(--accent-text) 100%)',
};






/* ─── ICON (canonical: ui/icons.jsx) ─────────────────────────── */
export { Icon } from './ui/icons.jsx';

/* ─── SKELETON (canonical: ui/Skeleton.jsx) ─────────────────── */
export { Skeleton, SkeletonText, SkeletonCard } from './ui/Skeleton.jsx';

/* ─── EMPTY STATE (canonical: ui/EmptyState.jsx) ────────────── */
export { EmptyState } from './ui/EmptyState.jsx';

/* ─── AVATAR (canonical: ui/Avatar.jsx) ─────────────────────── */
export { Avatar } from './ui/Avatar.jsx';

/* ─── BUTTON (canonical: ui/Button.jsx) ─────────────────────── */
export { Button } from './ui/Button.jsx';

/* ─── CARD (canonical: ui/Card.jsx) ─────────────────────────── */
export { Card } from './ui/Card.jsx';

/* ─── PILL (canonical: ui/Pill.jsx) ─────────────────────────── */
export { Pill } from './ui/Pill.jsx';

/* ─── KPI (canonical: ui/Kpi.jsx) ───────────────────────────── */
export { Kpi } from './ui/Kpi.jsx';

/* ─── SECTION HEADER (canonical: ui/SectionHeader.jsx) ──────── */
export { SectionHeader } from './ui/SectionHeader.jsx';

/* ─── PILL NAV / TABS (canonical: ui/Tabs.jsx) ──────────────── */
export { Tabs, Tabs as PillNav } from './ui/Tabs.jsx';

/* ─── SHELL ──────────────────────────────────────────────────── */
// Legacy section map for old tool:* IDs
const LEGACY_NAV_SECTIONS = [
  { label: 'Overview', ids: ['home', 'tool:portal'] },
  { label: 'Tools',    ids: ['tool:diagnostic','tool:feedback','tool:homework','tool:practice','tool:inbox','tool:calendar','tool:reports','tool:templates'] },
];
// New section map for Phase 1 IDs
const NEW_NAV_SECTIONS = [
  { label: 'Today',    ids: ['dashboard'] },
  { label: 'Workflow', ids: ['students', 'diagnostics', 'homework', 'submissions'] },
  { label: 'Plan',     ids: ['calendar'] },
  { label: 'Library',  ids: ['library'] },
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
      <a href="#main-content" className="skip-nav">Skip to content</a>
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
      <main id="main-content" className="shell-main">{children}</main>
      <nav className="shell-mobile-nav" aria-label="Mobile navigation">
        {tabs.filter(t => t.mobile !== false && ['dashboard','students','diagnostics','homework','submissions','library','mock-test-results'].includes(t.id)).map(tab => (
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


/* ─── Modal (canonical: ui/Modal.jsx) ────────────────────────── */
export { Modal } from './ui/Modal.jsx';
export { Breadcrumb } from './ui/Breadcrumb.jsx';
export { Select } from './ui/Select.jsx';

/* ─── callAI (see src/lib/callAI.js) ────────────────────────── */
export { callAI, summarizeTranscript } from '../lib/callAI.js';

export function Tooltip({ children, content }) {
  if (!content) return children;
  return (
    <div className="vv-tooltip-wrap">
      {children}
      <span className="vv-tooltip-text" role="tooltip">{content}</span>
      <style>{`
        .vv-tooltip-wrap {
          position: relative;
          display: inline-block;
          cursor: help;
        }
        .vv-tooltip-text {
          visibility: hidden;
          width: 200px;
          background-color: var(--primary);
          color: #fff;
          text-align: center;
          border-radius: 6px;
          padding: 6px 10px;
          position: absolute;
          z-index: 1000;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.2s;
          font-size: 12px;
          font-weight: 500;
          line-height: 1.4;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .vv-tooltip-text::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: var(--primary) transparent transparent transparent;
        }
        .vv-tooltip-wrap:hover .vv-tooltip-text {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}





