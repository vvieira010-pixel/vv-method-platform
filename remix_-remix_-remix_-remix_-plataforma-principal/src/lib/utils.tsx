import React from 'react';
import { CYCLE_CONFIG } from './data';

export function Avatar({ name, size = 34 }: { name: string, size?: number }) {
  const colors = ['#1E4E8C', '#0D9488', '#D97706', '#7C3AED', '#0F172A'];
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h += name.charCodeAt(i);
  }
  const bg = colors[h % colors.length];
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
    
  return (
    <div
      className="av"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.35),
        background: bg,
        letterSpacing: '.02em',
      }}
    >
      {initials}
    </div>
  );
}

export function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function cycleTone(cycle: string) {
  return CYCLE_CONFIG[cycle]?.tone || 'p-default';
}

export function cycleLabel(cycle: string) {
  return CYCLE_CONFIG[cycle]?.label || cycle;
}

export function hwTone(status: string) {
  const tones: Record<string, string> = {
    'not-started': 'p-muted',
    'in-progress': 'p-info',
    'submitted': 'p-warning',
    reviewed: 'p-success',
    completed: 'p-success',
  };
  return tones[status] || 'p-muted';
}

export function toast(msg: string, kind: 'ok' | 'warn' | 'danger' = 'ok') {
  const host = document.getElementById('toast-host');
  if (!host) return;
  const icon = kind === 'ok' ? '✓' : kind === 'warn' ? '!' : '→';
  const t = document.createElement('div');
  t.className = "toast " + (kind === 'warn' ? 'warn' : kind === 'danger' ? 'danger' : '');
  t.innerHTML = "<span class='toast-icon'>" + icon + "</span><span class='toast-msg'>" + msg + "</span>";
  host.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
