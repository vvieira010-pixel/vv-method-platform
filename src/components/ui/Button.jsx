import React from 'react';

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
