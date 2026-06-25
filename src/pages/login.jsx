/**
 * login.jsx — MET Proficiency Mastery Login Screen
 *
 * Three modes:
 *  - "signin"   — existing users (incl. the teacher) sign in with password.
 *  - "register" — first-time students set their OWN password (self-register).
 *  - "reset"    — sends a password-reset link via Supabase Recovery API.
 */

import { useState, useEffect } from 'react';
import {
  signInWithPassword, signUpWithPassword,
  storeSupabaseSession, getSupabaseConfig,
  resetPasswordForEmail,
} from '../lib/supabase-storage.js';
import { Icon } from '../components/shared.jsx';



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
      if (!supabaseReady) { setError("Access isn't set up yet. Contact your teacher to get started."); return; }
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
      setError("Access isn't set up yet. Contact your teacher to get started.");
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
          <div>
            <span className="lp-brand-tag">Your learning path</span>
            <span className="lp-brand-b2-badge">B2 Target</span>
          </div>
          <h2 className="lp-brand-headline">Clear practice.<br />Better feedback.<br />Real progress.</h2>
          <p className="lp-brand-copy">
            Everything you need to reach B2 — lessons, feedback, homework, and your full progress history in one place.
          </p>
        </div>

        <div className="lp-brand-features">
          {['Personalized homework plans', 'Real-time progress tracking', 'Focused MET skill coaching from your teacher'].map(f => (
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

          {!isReset && (
            <div className="lp-mode-switch" role="tablist" aria-label="Account mode">
              <button type="button" role="tab" aria-selected={!isRegister} className={!isRegister ? 'active' : ''} onClick={() => switchMode('signin')} disabled={loading}>Sign in</button>
              <button type="button" role="tab" aria-selected={isRegister} className={isRegister ? 'active' : ''} onClick={() => switchMode('register')} disabled={loading}>New student</button>
            </div>
          )}

          {!isRegister && !isReset && (
            <div className="lp-invite-notice" role="note">
              <Icon.lock size={14} />
              Private platform · Contact Teacher Vinicius to get access
            </div>
          )}

          <div className="lp-greeting">
            <h1>
              {isReset ? 'Reset your password' : isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p>
              {isReset
                ? "Enter your email and we'll send you a sign-in link."
                : isRegister
                ? 'Enter your email and choose a password to set up your account.'
                : 'Enter your email and password below.'}
            </p>
          </div>

          {isReset && resetSent ? (
            <div className="lp-success" role="status">
              <strong>Check your inbox.</strong> We sent a sign-in link to <em>{email}</em>. Open it to access your account. The link expires in 1 hour.
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

          {isReset && (
            <div className="lp-toggle">
              Remember it?
              <button type="button" onClick={() => switchMode('signin')} disabled={loading}>Back to sign in</button>
            </div>
          )}

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
