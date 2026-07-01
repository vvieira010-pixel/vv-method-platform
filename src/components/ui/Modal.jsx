import { useRef, useEffect } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, kicker, title, subtitle, maxWidth = 680, variant, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;

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

  if (variant === 'fullscreen') {
    return (
      <div className="modal-fullscreen" onClick={handleBackdrop}>
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title || kicker}>
          <div className="modal-fullscreen-header">
            <div className="modal-fullscreen-title">{title || kicker}</div>
            <button onClick={onClose} className="modal-fullscreen-close">Close preview</button>
          </div>
          <div className="modal-fullscreen-body">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay-enter modal-overlay" onClick={handleBackdrop}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={subtitle ? 'modal-subtitle' : undefined}
        className="modal-card-enter modal-card"
        style={{ maxWidth }}
      >
        <div className="modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            {kicker && <div className="modal-kicker">{kicker}</div>}
            <div id="modal-title" className="modal-title">{title}</div>
            {subtitle && <div id="modal-subtitle" className="modal-subtitle">{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="modal-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
