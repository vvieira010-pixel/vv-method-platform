import { useState, useEffect } from 'react';

const TOAST_LABELS = { ok: 'Done', info: 'Info', warn: 'Caution', go: 'Redirect' };

export function ToastHost() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const onToast = (e) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(arr => [...arr, { id, msg: e.detail.msg, kind: e.detail.kind || 'ok' }]);
      setTimeout(() => setToasts(arr => arr.filter(x => x.id !== id)), 3200);
    };
    window.addEventListener('vv-toast', onToast);
    window.toast = (msg, kind) => window.dispatchEvent(new CustomEvent('vv-toast', { detail: { msg, kind } }));
    return () => { window.removeEventListener('vv-toast', onToast); delete window.toast; };
  }, []);

  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.kind || 'ok'}`}>
          <span className="toast-label">{TOAST_LABELS[t.kind] || 'Done'}</span>
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
