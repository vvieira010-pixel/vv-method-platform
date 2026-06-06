/**
 * login.jsx — V.V. Method Platform Login Screen
 *
 * Email + password form with two modes:
 *  - "signin"   — existing users (incl. the teacher) sign in.
 *  - "register" — first-time students set their OWN password (self-register).
 * Both use Supabase Auth; no shared secret, no passwords stored in the bundle.
 */

import { useState, useEffect } from 'react';
import { injectGlobalCSS } from '../components/shared.jsx';
import { signInWithPassword, signUpWithPassword, storeSupabaseSession, getSupabaseConfig } from '../lib/supabase-storage.js';

const CSS = `
  .lp-root {
    min-height: 100vh; min-height: 100dvh;
    display: grid; grid-template-columns: 420px 1fr;
    font-family: var(--font-ui); background: #fff;
  }

  /* ── Brand panel ── */
  .lp-brand {
    background: var(--accent-deep);
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
  .lp-brand-logo-badge {
    width: 38px; height: 38px; border-radius: 10px;
    background: rgba(255,255,255,.15); border: 1.5px solid rgba(255,255,255,.25);
    display: grid; place-items: center;
    font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -.02em;
  }
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
    overflow-y: auto; background: #fff;
  }
  .lp-signin-inner { width: 100%; max-width: 420px; }

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
    border: 1.5px solid #8aacac; border-radius: 8px;
    font-size: 16px; font-family: var(--font-ui); color: var(--text);
    background: #f3f9f9; outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .lp-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(29,140,150,.15);
    background: #fff;
  }
  .lp-input::placeholder { color: #6b8fa0; }

  .lp-submit {
    width: 100%; padding: 13px; margin-top: 8px;
    background: var(--accent-deep); color: #fff;
    border: none; border-radius: 8px; cursor: pointer;
    font-size: 15px; font-weight: 700; font-family: var(--font-ui);
    letter-spacing: .01em;
    transition: opacity .15s, box-shadow .15s, transform .1s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .lp-submit:hover:not(:disabled) {
    box-shadow: 0 4px 16px rgba(29,80,86,.3);
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
    margin-top: 16px; padding: 12px 16px; border-radius: 8px;
    background: #fff5f5; border: 1px solid #fed7d7;
    font-size: 13px; color: var(--danger); line-height: 1.5;
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
    background: none; border: none; padding: 0; margin-left: 6px;
    font-size: 13px; font-weight: 700; color: var(--accent-deep);
    cursor: pointer; font-family: var(--font-ui); text-decoration: underline;
  }
  .lp-toggle button:disabled { opacity: .5; cursor: default; }

  @media (max-width: 860px) {
    .lp-root { grid-template-columns: 1fr; }
    .lp-brand { display: none; }
    .lp-signin { padding: 40px 24px; }
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
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabaseReady = getSupabaseConfig().isConfigured;
  const isRegister = mode === 'register';

  useEffect(() => {
    injectGlobalCSS();
    injectCSS();
    // If resolveAuth rejected an unauthorized account, show why on return to login.
    try {
      const notice = localStorage.getItem('vv:auth_notice');
      if (notice) { setError(notice); localStorage.removeItem('vv:auth_notice'); }
    } catch { /* storage unavailable */ }
  }, []);

  const switchMode = () => {
    if (loading) return;
    setError('');
    setMode(m => (m === 'signin' ? 'register' : 'signin'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

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
          <div className="lp-brand-logo-badge">M</div>
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
          {['AI-powered skill diagnosis', 'Personalized homework plans', 'Real-time progress tracking'].map(f => (
            <div key={f} className="lp-brand-feature">
              <span className="lp-brand-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Sign-in panel ── */}
      <div className="lp-signin">
        <div className="lp-signin-inner">

          <div className="lp-greeting">
            <h1>{isRegister ? 'Create your password' : 'Sign in'}</h1>
            <p>
              {isRegister
                ? 'First time here? Enter your email and choose a password to create your account.'
                : 'Enter the email and password you use for this platform.'}
            </p>
          </div>

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

            <button type="submit" className="lp-submit" disabled={loading}>
              {loading
                ? <><span className="lp-spinner" /> {isRegister ? 'Creating account…' : 'Signing in…'}</>
                : (isRegister ? 'Create account' : 'Sign in')}
            </button>
          </form>

          {error && (
            <div className="lp-error" role="alert" aria-live="polite">{error}</div>
          )}

          <div className="lp-toggle">
            {isRegister ? 'Already have an account?' : 'First time here?'}
            <button type="button" onClick={switchMode} disabled={loading}>
              {isRegister ? 'Sign in' : 'Create your password'}
            </button>
          </div>

          <div className="lp-footer">
            MET Proficiency Mastery · Private platform<br />
            Access is by invitation only.
          </div>

        </div>
      </div>

    </div>
  );
}
