/**
 * login.jsx — V.V. Method Platform Login Screen
 *
 * Click-to-enter model: no passwords typed. The screen lists the teacher and
 * every student; tapping a name signs that person in automatically using a
 * shared internal credential, then reloads so App.jsx resolves the role
 * (teacher vs student) from the Supabase session.
 *
 * Trade-off (accepted for a small private class): anyone with the link can
 * tap in as anyone. There is no per-person secret.
 */

import { useState, useEffect } from 'react';
import { injectGlobalCSS } from '../components/shared.jsx';
import { signInWithPassword, storeSupabaseSession, getSupabaseConfig } from '../lib/supabase-storage.js';
import { STUDENTS } from '../data/students.jsx';

// Shared internal click-login credential (matches the password set on every
// Supabase Auth account in this project). Not a per-user secret.
const CLICK_PW = 'vvMET-click-2026';
const TEACHER = { email: 'vvieira010x@gmail.com', name: 'Teacher Vinicius' };

const CSS = `
  .login-root {
    min-height: 100vh; min-height: 100dvh;
    display: grid; grid-template-columns: 1fr 1fr;
    font-family: var(--font-ui); background: #fff;
  }
  @media (max-width: 860px) {
    .login-root { grid-template-columns: 1fr; }
    .login-brand-panel { display: none; }
  }
  .login-brand-panel {
    background: var(--accent-deep); display: flex; align-items: center; justify-content: center;
    padding: clamp(32px, 5vw, 56px) clamp(28px, 6vw, 64px);
    min-height: 100dvh; position: relative; overflow: hidden;
  }
  .login-brand-inner { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 48px; }
  .login-brand-name   { font-size: 18px; font-weight: 800; color: var(--on-dark); letter-spacing: 0.01em; }
  .login-brand-sub    { font-size: 11px; color: rgba(241, 250, 238, 0.88); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 3px; }
  .login-brand-eyebrow {
    font-size: 11px; font-weight: 700; color: #e8f8f8; letter-spacing: 0.1em;
    text-transform: uppercase; margin-bottom: 14px; display: inline-block;
    padding: 4px 8px; background: rgba(61, 166, 166, 0.28); border: 1px solid rgba(168, 218, 220, 0.55);
  }
  .login-brand-headline { font-size: clamp(28px, 3.2vw, 36px); font-weight: 800; color: var(--on-dark); line-height: 1.15; margin-bottom: 18px; }
  .login-brand-copy { color: rgba(241, 250, 238, 0.9); font-size: 14px; line-height: 1.7; }

  .login-form-panel {
    display: flex; align-items: center; justify-content: center;
    min-height: 100dvh; padding: clamp(28px, 5vw, 56px) clamp(24px, 6vw, 56px); background: #fff;
  }
  .login-form-inner { width: 100%; max-width: 460px; text-align: left; }
  .login-form-title { font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.01em; margin: 0 0 8px; }
  .login-form-sub   { font-size: 14.5px; color: var(--muted); margin: 0 0 24px; line-height: 1.55; }

  .login-section-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--muted); margin: 22px 0 10px;
  }
  .login-role-card {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px; border: 2px solid var(--border); border-radius: 8px;
    cursor: pointer; background: #fff; width: 100%; text-align: left;
    transition: border-color 0.15s, box-shadow 0.15s; font-family: var(--font-ui);
  }
  .login-role-card:hover:not(:disabled) { border-color: var(--primary); box-shadow: 0 0 0 3px var(--accent-soft); }
  .login-role-card:disabled { opacity: 0.55; cursor: default; }
  .login-role-dot { width: 9px; height: 9px; border-radius: 50%; margin-right: 10px; flex-shrink: 0; }
  .login-role-title { font-size: 15px; font-weight: 700; color: var(--text); display: flex; align-items: center; }
  .login-role-desc  { font-size: 12.5px; color: var(--muted); margin-top: 2px; }
  .login-role-arrow { color: #a8b8c0; }

  .login-student-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  @media (max-width: 480px) { .login-student-grid { grid-template-columns: 1fr; } }
  .login-student-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 8px;
    background: #fff; cursor: pointer; font-family: var(--font-ui);
    font-size: 14px; font-weight: 600; color: var(--text); text-align: left;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .login-student-btn:hover:not(:disabled) { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
  .login-student-btn:disabled { opacity: 0.5; cursor: default; }
  .login-student-avatar {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    background: var(--accent-subtle); color: var(--accent-deep);
    display: grid; place-items: center; font-size: 13px; font-weight: 700;
  }
  .login-error { font-size: 13px; color: var(--danger); margin-top: 14px; min-height: 18px; }
`;

let loginCssInjected = false;
function injectLoginCSS() {
  if (loginCssInjected || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);
  loginCssInjected = true;
}

export default function LoginScreen() {
  const [busyEmail, setBusyEmail] = useState('');
  const [error, setError] = useState('');
  const supabaseReady = getSupabaseConfig().isConfigured;

  useEffect(() => {
    injectGlobalCSS();
    injectLoginCSS();
  }, []);

  const enter = async (email) => {
    if (busyEmail) return;
    setError('');
    if (!supabaseReady) { setError('Sign-in is not configured. Contact your teacher.'); return; }
    setBusyEmail(email);
    try {
      const session = await signInWithPassword(email, CLICK_PW);
      storeSupabaseSession(session);
      // Reload so App.jsx restoreSession() validates the session and resolves the role.
      window.location.reload();
    } catch (e) {
      setError(e.message || 'Could not sign in. Try again or contact your teacher.');
      setBusyEmail('');
    }
  };

  return (
    <div className="login-root">
      {/* ── Brand panel ── */}
      <div className="login-brand-panel">
        <div className="login-brand-inner">
          <div>
            <div className="login-brand-name">MET Proficiency Mastery</div>
            <div className="login-brand-sub">Teacher Vinicius</div>
          </div>
          <div>
            <div className="login-brand-eyebrow">Your learning path</div>
            <div className="login-brand-headline">Clear practice.<br />Better feedback.<br />Real progress.</div>
            <p className="login-brand-copy">Tap your name to open your lessons, feedback, homework, and practice.</p>
          </div>
        </div>
      </div>

      {/* ── Picker panel ── */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          <h1 className="login-form-title">Who's signing in?</h1>
          <p className="login-form-sub">Tap your name to enter — no password needed.</p>

          {/* Teacher */}
          <button
            type="button"
            className="login-role-card"
            onClick={() => enter(TEACHER.email)}
            disabled={Boolean(busyEmail)}
            aria-label="Sign in as teacher"
          >
            <div>
              <div className="login-role-title">
                <span className="login-role-dot" style={{ background: 'var(--primary)' }} />
                Teacher
              </div>
              <div className="login-role-desc">Vinicius — full platform access</div>
            </div>
            <span className="login-role-arrow" aria-hidden="true">
              {busyEmail === TEACHER.email ? 'Signing in…' : '→'}
            </span>
          </button>

          {/* Students */}
          <div className="login-section-label">Students</div>
          <div className="login-student-grid">
            {STUDENTS.map(s => (
              <button
                key={s.id}
                type="button"
                className="login-student-btn"
                onClick={() => enter(s.email)}
                disabled={Boolean(busyEmail)}
                aria-label={`Sign in as ${s.name}`}
              >
                <span className="login-student-avatar">{(s.firstName || s.name || '?').charAt(0).toUpperCase()}</span>
                <span>{busyEmail === s.email ? 'Signing in…' : s.firstName || s.name}</span>
              </button>
            ))}
          </div>

          <div className="login-error" role="alert" aria-live="polite">{error}</div>
        </div>
      </div>
    </div>
  );
}
