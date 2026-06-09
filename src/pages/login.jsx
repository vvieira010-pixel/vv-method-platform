/**
 * login.jsx — MET Proficiency Mastery Login Screen
 *
 * Three modes:
 *  - "signin"   — existing users (incl. the teacher) sign in with password.
 *  - "register" — first-time students set their OWN password (self-register).
 *  - "reset"    — sends a password-reset link via Supabase Recovery API.
 */

import { useState, useEffect } from 'react';
import { injectGlobalCSS } from '../components/shared.jsx';
import {
  signInWithPassword, signUpWithPassword,
  storeSupabaseSession, getSupabaseConfig,
  resetPasswordForEmail,
} from '../lib/supabase-storage.js';

const CSS = `
  .lp-root {
    min-height: 100vh; min-height: 100dvh;
    display: grid; grid-template-columns: 420px 1fr;
    font-family: var(--font-ui); background: #fff;
    overflow-x: hidden;
  }

  /* ── Brand panel ── */
  .lp-brand {
    background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 48px 44px; min-height: 100dvh; position: sticky; top: 0;
    overflow: hidden;
  }
  .lp-brand::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 20% 80%, rgba(72,199,199,.18) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 10%, rgba(255,255,255,.06) 0%, transparent 50%);
    pointer-events: none;
  }
  .lp-brand-logo { display: flex; align-items: center; gap: 12px; position: relative; }
  .lp-brand-logo-name { font-size: 15px; font-weight: 800; color: #fff; letter-spacing: .01em; line-height: 1.2; }
  .lp-brand-logo-sub  { font-size: 11px; color: rgba(241,250,238,.7); letter-spacing: .06em; text-transform: uppercase; }

  .lp-brand-hero { position: relative; }
  .lp-brand-tag {
    display: inline-block; margin-bottom: 18px;
    padding: 4px 10px; border-radius: 4px;
    background: rgba(72,199,199,.22); border: 1px solid rgba(72,199,199,.4);
    font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #a8dce0;
  }
  .lp-brand-headline {
    font-size: clamp(26px, 3vw, 34px); font-weight: 800; color: #fff;
    line-height: 1.2; margin: 0 0 16px; letter-spacing: -.02em;
  }
  .lp-brand-copy { font-size: 14px; color: rgba(241,250,238,.8); line-height: 1.75; margin: 0; }

  .lp-brand-features { position: relative; display: flex; flex-direction: column; gap: 10px; }
  .lp-brand-feature { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(241,250,238,.75); }
  .lp-brand-feature-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; background: rgba(72,199,199,.7); }

  /* ── Sign-in panel ── */
  .lp-signin {
    display: flex; align-items: center; justify-content: center;
    min-height: 100dvh; padding: 56px clamp(24px, 6vw, 64px);
    overflow-y: auto; overflow-x: hidden; background: #fff;
    width: 100%; min-width: 0; box-sizing: border-box;
  }
  .lp-signin-inner { width: min(100%, 420px); max-width: calc(100vw - 48px); min-width: 0; }

  /* Mobile brand header — hidden on desktop, replaces the left panel on mobile */
  .lp-mobile-brand {
    display: none;
    margin-bottom: 28px;
    padding: 16px 18px;
    border-radius: 10px;
    background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  }
  .lp-mobile-brand-name {
    display: block;
    font-size: 16px;
    font-weight: 800;
    color: #fff;
    line-height: 1.2;
  }
  .lp-mobile-brand-sub {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: rgba(168,218,220,.85);
  }

  .lp-greeting { margin-bottom: 36px; }
  .lp-greeting h1 {
    font-size: clamp(22px, 3vw, 28px); font-weight: 800;
    color: var(--text); margin: 0 0 8px; letter-spacing: -.02em;
  }
  .lp-greeting p { font-size: 14px; color: var(--muted); margin: 0; line-height: 1.55; }

  /* Form fields */
  .lp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .lp-label {
    font-size: 12px; font-weight: 700; color: var(--text);
    letter-spacing: .04em; text-transform: uppercase;
  }
  .lp-input {
    width: 100%; padding: 12px 14px; box-sizing: border-box;
    border: 1.5px solid var(--border); border-radius: var(--radius-md);
    font-size: var(--text-base); font-family: var(--font-ui); color: var(--text);
    background: var(--surface); outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .lp-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
    background: var(--surface);
  }
  .lp-input::placeholder { color: var(--muted); }

  .lp-submit {
    width: 100%; padding: 13px; margin-top: 8px;
    background: var(--primary); color: #fff;
    border: none; border-radius: var(--radius-md); cursor: pointer;
    font-size: var(--text-lg); font-weight: 700; font-family: var(--font-ui);
    letter-spacing: .01em;
    transition: opacity .15s, box-shadow .15s, transform .1s;
    display: flex; align-items: center; justify-content: center; gap: var(--space-2);
    box-sizing: border-box; max-width: 100%;
  }
  .lp-submit:hover:not(:disabled) {
    box-shadow: 0 4px 16px rgba(45,139,139,.4);
    transform: translateY(-1px);
  }
  .lp-submit:active:not(:disabled) { transform: translateY(0); }
  .lp-submit:disabled { opacity: .6; cursor: default; }

  /* Spinner */
  @keyframes lp-spin { to { transform: rotate(360deg); } }
  .lp-spinner {
    width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
    border: 2px solid rgba(255,255,255,.35); border-top-color: #fff;
    animation: lp-spin .7s linear infinite;
  }

  .lp-error {
    margin-top: 16px; padding: 12px 16px; border-radius: var(--radius-md);
    background: var(--danger-bg); border: 1px solid var(--danger-soft);
    font-size: var(--text-sm); color: var(--danger); line-height: 1.5;
  }

  .lp-success {
    margin-top: 16px; padding: 14px 16px; border-radius: var(--radius-md);
    background: var(--success-bg); border: 1px solid var(--success-soft);
    font-size: var(--text-sm); color: var(--success); line-height: 1.6;
  }

  .lp-footer {
    margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border);
    font-size: 11.5px; color: var(--muted); text-align: center; line-height: 1.6;
  }

  .lp-toggle {
    margin-top: 20px; text-align: center;
    font-size: 13px; color: var(--muted);
  }
  .lp-toggle button {
    background: none; border: none; padding: 0; margin-left: var(--space-1);
    font-size: var(--text-sm); font-weight: 700; color: var(--accent-deep);
    cursor: pointer; font-family: var(--font-ui); text-decoration: underline;
  }
  .lp-toggle button:disabled { opacity: .5; cursor: default; }

  .lp-forgot {
    margin-top: 12px; text-align: center;
    font-size: 12px; color: var(--muted);
  }
  .lp-forgot button {
    background: none; border: none; padding: 0;
    font-size: 12px; color: var(--muted); text-decoration: underline;
    cursor: pointer; font-family: var(--font-ui);
  }
  .lp-forgot button:hover { color: var(--accent-deep); }

  @media (max-width: 768px) {
    .lp-root { grid-template-columns: 1fr; }
    .lp-brand { display: none; }
    .lp-signin { align-items: flex-start; justify-content: flex-start; padding: 36px 24px; }
    .lp-signin-inner { width: 100%; max-width: 100%; }
    .lp-mobile-brand { display: block; }
    .lp-greeting { margin-bottom: 28px; }
  }
  @media (max-width: 480px) {
    .lp-signin { padding: 32px 20px; }
  }
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);
  cssInjected = true;
}

export default function LoginScreen() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'register' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const supabaseReady = getSupabaseConfig().isConfigured;
  const isRegister = mode === 'register';
  const isReset = mode === 'reset';

  useEffect(() => {
    injectGlobalCSS();
    injectCSS();
    try {
      const notice = localStorage.getItem('vv:auth_notice');
      if (notice) { setError(notice); localStorage.removeItem('vv:auth_notice'); }
    } catch { /* storage unavailable */ }
  }, []);

  const switchMode = (next) => {
    if (loading) return;
    setError('');
    setResetSent(false);
    setMode(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (isReset) {
      if (!email.trim()) { setError('Enter your email address.'); return; }
      if (!supabaseReady) { setError('Sign-in is not configured. Contact your teacher.'); return; }
      setLoading(true);
      try {
        await resetPasswordForEmail(email.trim(), window.location.origin + window.location.pathname);
        setResetSent(true);
      } catch (err) {
        setError(err.message || 'Could not send reset link. Try again or contact your teacher.');
      }
      setLoading(false);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    if (!supabaseReady) {
      setError('Sign-in is not configured. Contact your teacher.');
      return;
    }
    if (isRegister && password.length < 6) {
      setError('Choose a password with at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const session = isRegister
        ? await signUpWithPassword(email.trim(), password)
        : await signInWithPassword(email.trim(), password);
      storeSupabaseSession(session);
      window.location.reload();
    } catch (err) {
      setError(
        isRegister
          ? (err.message || 'Could not create your account. Try again or contact your teacher.')
          : 'Incorrect email or password. Try again or contact your teacher.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">

      {/* ── Brand panel ── */}
      <div className="lp-brand">
        <div className="lp-brand-logo">
          <div>
            <div className="lp-brand-logo-name">MET Proficiency Mastery</div>
            <div className="lp-brand-logo-sub">Teacher Vinicius</div>
          </div>
        </div>

        <div className="lp-brand-hero">
          <div className="lp-brand-tag">Your learning path</div>
          <h2 className="lp-brand-headline">Clear practice.<br />Better feedback.<br />Real progress.</h2>
          <p className="lp-brand-copy">
            Everything you need to reach B2 — lessons, feedback, homework, and your full progress history in one place.
          </p>
        </div>

        <div className="lp-brand-features">
          {['Personalized homework plans', 'Real-time progress tracking'].map(f => (
            <div key={f} className="lp-brand-feature">
              <span className="lp-brand-feature-dot" aria-hidden="true" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Sign-in panel ── */}
      <div className="lp-signin">
        <div className="lp-signin-inner">
          <div className="lp-mobile-brand" aria-label="Platform">
            <span className="lp-mobile-brand-name">MET Proficiency Mastery</span>
            <span className="lp-mobile-brand-sub">Michigan English Test Preparation</span>
          </div>

          <div className="lp-greeting">
            <h1>
              {isReset ? 'Reset your password' : isRegister ? 'Create your password' : 'Sign in'}
            </h1>
            <p>
              {isReset
                ? "Enter your email and we'll send you a sign-in link."
                : isRegister
                ? 'First time here? Enter your email and choose a password to create your account.'
                : 'Enter the email and password you use for this platform.'}
            </p>
          </div>

          {isReset && resetSent ? (
            <div className="lp-success" role="status">
              <strong>Check your inbox.</strong> We sent a sign-in link to <em>{email}</em>. Click it to access your account — the link expires in 1 hour.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-email">Email</label>
                <input
                  id="lp-email"
                  className="lp-input"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              {!isReset && (
                <div className="lp-field">
                  <label className="lp-label" htmlFor="lp-password">Password</label>
                  <input
                    id="lp-password"
                    className="lp-input"
                    type="password"
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    placeholder={isRegister ? 'Choose a password (min. 6 characters)' : '••••••••••••••'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <button type="submit" className="lp-submit" disabled={loading}>
                {loading
                  ? <><span className="lp-spinner" />{isReset ? 'Sending…' : isRegister ? 'Creating account…' : 'Signing in…'}</>
                  : isReset ? 'Send link' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>
          )}

          {error && (
            <div className="lp-error" role="alert" aria-live="polite">{error}</div>
          )}

          {!isReset && !isRegister && (
            <div className="lp-forgot">
              <button type="button" onClick={() => switchMode('reset')} disabled={loading}>
                Forgot password?
              </button>
            </div>
          )}

          <div className="lp-toggle">
            {isReset ? (
              <>
                Remember it?
                <button type="button" onClick={() => switchMode('signin')} disabled={loading}>Sign in</button>
              </>
            ) : isRegister ? (
              <>
                Already have an account?
                <button type="button" onClick={() => switchMode('signin')} disabled={loading}>Sign in</button>
              </>
            ) : (
              <>
                First time here?
                <button type="button" onClick={() => switchMode('register')} disabled={loading}>Create your password</button>
              </>
            )}
          </div>

          <div className="lp-footer">
            MET Proficiency Mastery · Private platform<br />
            Access is by invitation only.<br /><br />
            Having trouble signing in?{' '}
            <a href="mailto:vvieira010x@gmail.com" style={{ color: 'var(--accent-text)', textDecoration: 'underline' }}>
              Contact Teacher Vinicius
            </a>
          </div>

        </div>
      </div>

    </div>
  );
}
