/**
 * tweaks-panel.jsx — Floating tweaks sidebar for teacher UI customization
 */
import { useState } from 'react';
import { Icon } from './shared.jsx';

const CSS = `
  .tweaks-toggle {
    position: fixed; bottom: 20px; right: 20px; z-index: 50;
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--accent-deep); color: #fff;
    border: none; cursor: pointer; display: flex; align-items: center;
    justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    font-size: 18px; transition: transform 0.2s;
  }
  .tweaks-toggle:hover { transform: scale(1.08); }
  .tweaks-panel {
    position: fixed; bottom: 70px; right: 20px; z-index: 50;
    width: 260px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.14);
    padding: 18px; font-family: var(--font-ui);
  }
  .tweaks-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 16px; }
  .tweak-section { margin-bottom: 16px; }
  .tweak-label  { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
  .tweak-radio-group { display: flex; gap: 6px; flex-wrap: wrap; }
  .tweak-radio-btn {
    padding: 4px 11px; border-radius: 999px; font-size: 12px; font-weight: 500;
    background: var(--divider); color: var(--text-2); border: none; cursor: pointer;
    font-family: var(--font-ui); transition: background 0.12s, color 0.12s;
  }
  .tweak-radio-btn.active { background: var(--accent); color: #fff; font-weight: 600; }
  .tweak-toggle-row { display: flex; align-items: center; justify-content: space-between; }
  .tweak-toggle-track {
    width: 36px; height: 20px; border-radius: 999px;
    background: var(--border); position: relative; cursor: pointer;
    transition: background 0.2s; border: none; padding: 0;
  }
  .tweak-toggle-track.on { background: var(--accent); }
  .tweak-toggle-thumb {
    position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
    border-radius: 50%; background: #fff;
    transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .tweak-toggle-track.on .tweak-toggle-thumb { left: 18px; }
  .tweak-colors { display: flex; gap: 7px; flex-wrap: wrap; }
  .tweak-color-swatch {
    width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
    border: 2px solid transparent; transition: transform 0.15s, border-color 0.15s;
  }
  .tweak-color-swatch.active { border-color: var(--text); transform: scale(1.15); }
`;

let injected = false;
function injectCSS() {
  if (injected || typeof document === 'undefined') return;
  const s = document.createElement('style'); s.textContent = CSS;
  document.head.appendChild(s); injected = true;
}

export function TweaksPanel({ title = 'Tweaks', children }) {
  injectCSS();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="tweaks-toggle" onClick={() => setOpen(o => !o)} title="Tweaks"><Icon.settings size={16} /></button>
      {open && (
        <div className="tweaks-panel">
          <div className="tweaks-title">{title}</div>
          {children}
        </div>
      )}
    </>
  );
}

export function TweakSection({ label, children }) {
  return (
    <div className="tweak-section">
      <div className="tweak-label">{label}</div>
      {children}
    </div>
  );
}

export function TweakRadio({ options, value, onChange }) {
  return (
    <div className="tweak-radio-group">
      {options.map(o => (
        <button key={o.value} className={`tweak-radio-btn ${value === o.value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TweakToggle({ value, onChange, label }) {
  return (
    <div className="tweak-toggle-row">
      {label && <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>}
      <button className={`tweak-toggle-track ${value ? 'on' : ''}`} onClick={() => onChange(!value)}>
        <div className="tweak-toggle-thumb" />
      </button>
    </div>
  );
}

export function TweakColor({ value, onChange, options = [] }) {
  return (
    <div className="tweak-colors">
      {options.map(c => (
        <div key={c} className={`tweak-color-swatch ${value === c ? 'active' : ''}`}
          style={{ background: c }} onClick={() => onChange(c)} title={c} />
      ))}
    </div>
  );
}
