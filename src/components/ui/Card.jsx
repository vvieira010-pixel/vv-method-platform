import React from 'react';

export function Card({ children, style, className = '', small }) {
  return <div className={`card ${small ? 'card-sm' : ''} ${className}`} style={style}>{children}</div>;
}
