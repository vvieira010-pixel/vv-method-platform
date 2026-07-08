import React from 'react';

function IlloWrap({ children, label }) {
  return (
    <svg width="120" height="90" viewBox="0 0 120 90" fill="none" aria-hidden="true" role="img">
      <title>{label}</title>
      {children}
    </svg>
  );
}

export function IlloNoClasses() {
  return (
    <IlloWrap label="No classes scheduled">
      <rect x="18" y="12" width="84" height="66" rx="8" stroke="#148891" strokeWidth="1.5" fill="rgba(20,136,145,0.06)" />
      <rect x="18" y="12" width="84" height="16" rx="8" fill="rgba(20,136,145,0.12)" />
      <rect x="22" y="18" width="20" height="4" rx="2" fill="rgba(20,136,145,0.3)" />
      <line x1="60" y1="10" x2="60" y2="4" stroke="#0f1b2d" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="78" y1="10" x2="78" y2="4" stroke="#0f1b2d" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="42" y1="10" x2="42" y2="4" stroke="#0f1b2d" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="28" y="36" width="64" height="6" rx="3" fill="rgba(15,27,45,0.08)" />
      <rect x="28" y="50" width="44" height="6" rx="3" fill="rgba(15,27,45,0.06)" />
      <rect x="28" y="62" width="52" height="6" rx="3" fill="rgba(15,27,45,0.05)" />
    </IlloWrap>
  );
}

export function IlloNoHomework() {
  return (
    <IlloWrap label="No homework assigned">
      <rect x="32" y="10" width="56" height="70" rx="6" stroke="#148891" strokeWidth="1.5" fill="rgba(20,136,145,0.06)" />
      <rect x="38" y="18" width="18" height="4" rx="2" fill="rgba(20,136,145,0.25)" />
      <rect x="60" y="18" width="22" height="4" rx="2" fill="rgba(15,27,45,0.08)" />
      <line x1="38" y1="30" x2="80" y2="30" stroke="rgba(15,27,45,0.1)" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="38" y="38" width="30" height="4" rx="2" fill="rgba(15,27,45,0.07)" />
      <rect x="38" y="50" width="40" height="4" rx="2" fill="rgba(15,27,45,0.06)" />
      <rect x="38" y="60" width="24" height="4" rx="2" fill="rgba(15,27,45,0.05)" />
      <circle cx="48" cy="74" r="3" fill="rgba(20,136,145,0.2)" />
      <circle cx="72" cy="74" r="3" fill="rgba(20,136,145,0.12)" />
    </IlloWrap>
  );
}

export function IlloNoStudents() {
  return (
    <IlloWrap label="No students yet">
      <circle cx="44" cy="32" r="12" stroke="#148891" strokeWidth="1.5" fill="rgba(20,136,145,0.06)" />
      <path d="M32 52c0-6 5.4-11 12-11s12 5 12 11" stroke="#148891" strokeWidth="1.5" fill="rgba(20,136,145,0.04)" />
      <circle cx="76" cy="38" r="8" stroke="rgba(15,27,45,0.15)" strokeWidth="1.5" fill="rgba(15,27,45,0.04)" />
      <path d="M68 52c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(15,27,45,0.15)" strokeWidth="1.5" fill="rgba(15,27,45,0.03)" />
      <path d="M28 62c0-5 4-9 9-9h14c5 0 9 4 9 9" stroke="#A85D00" strokeWidth="1.5" fill="rgba(168,93,0,0.05)" strokeLinecap="round" />
    </IlloWrap>
  );
}
