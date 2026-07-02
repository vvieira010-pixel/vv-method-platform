/**
 * login.jsx — MET Proficiency Mastery Login Screen
 *
 * Two modes:
 *  - "signin" — existing users (incl. the teacher) sign in with password.
 *  - "reset"  — sends a password-reset link via Supabase Recovery API.
 * Access is by invitation only — no self-registration.
 */

import { useState, useEffect } from 'react';
import {
  signInWithPassword,
  storeSupabaseSession, getSupabaseConfig,
  resetPasswordForEmail,
} from '../lib/supabase-storage.js';
import { Icon, Button } from '../components/shared.jsx';



export default function LoginScreen() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const supabaseReady = getSupabaseConfig().isConfigured;
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
    setLoading(true);
    try {
      const session = await signInWithPassword(email.trim(), password);
      storeSupabaseSession(session);
      window.location.reload();
    } catch (err) {
      setError('Incorrect email or password. Try again or contact your teacher.');
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">

      {/* ── Brand panel ── */}
      <div className="lp-brand bg-grain">
        <svg className="lp-brand-hero-illo" width="320" height="280" viewBox="0 0 320 280" fill="none" aria-hidden="true">
          <path d="M40 200 Q80 60 160 80 Q240 100 280 60" stroke="rgba(20,136,145,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M40 220 Q100 120 180 140 Q260 160 300 120" stroke="rgba(72,199,199,0.12)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="160" cy="80" r="6" fill="rgba(20,136,145,0.25)" />
          <circle cx="240" cy="100" r="4" fill="rgba(72,199,199,0.2)" />
          <circle cx="100" cy="120" r="3" fill="rgba(255,255,255,0.1)" />
          <rect x="255" y="50" width="32" height="22" rx="4" stroke="rgba(200,102,7,0.3)" strokeWidth="1.5" fill="rgba(200,102,7,0.08)" />
          <text x="263" y="65" fill="rgba(200,102,7,0.5)" fontSize="10" fontWeight="700" fontFamily="Outfit, sans-serif">B2</text>
          <path d="M280 45 L290 55 M290 45 L280 55" stroke="rgba(200,102,7,0.25)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="80" cy="180" r="2" fill="rgba(255,255,255,0.08)" />
          <circle cx="200" cy="160" r="2.5" fill="rgba(255,255,255,0.06)" />
          <circle cx="270" cy="180" r="1.5" fill="rgba(255,255,255,0.05)" />
        </svg>

        <div className="lp-brand-logo">
          <div>
            <div className="lp-brand-logo-name">MET Proficiency Mastery</div>
            <div className="lp-brand-logo-sub">Teacher Vinicius</div>
          </div>
        </div>

          <div className="lp-brand-hero">
            <div>
              <span className="lp-brand-tag">B2 Target</span>
            </div>
            <h2 className="lp-brand-headline lp-brand-headline--serif">Target B2 mastery.<br />With confidence and precision.</h2>
            <p className="lp-brand-copy">
              Personalized 1:1 MET preparation designed for healthcare professionals seeking excellence.
            </p>
          </div>

          <div className="lp-brand-features">
            {['Personalized homework plans', 'Real-time progress tracking', 'Focused MET skill coaching'].map(f => (
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
            <div className="lp-invite-notice" role="note">
              <Icon.lock size={14} />
              Private platform · Contact Teacher Vinicius to get access
            </div>
          )}

          <div className="lp-greeting">
            <h1>
              {isReset ? 'Reset your password' : 'Welcome back'}
            </h1>
            <p>
              {isReset
                ? "Enter your email and we'll send you a sign-in link."
                : 'Enter your email and password below.'}
            </p>
          </div>

          {isReset && resetSent ? (
            <div className="lp-success" role="status">
              <strong>Check your inbox.</strong> We sent a sign-in link to <em>{email}</em>. Open it to access your account. The link expires in 1 hour.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="lp-email">Email</label>
                <input
                  id="lp-email"
                  className="input"
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
                <div className="form-group">
                  <label className="form-label" htmlFor="lp-password">Password</label>
                  <input
                    id="lp-password"
                    className="input"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <Button type="submit" variant="primary" disabled={loading} block style={{ padding: '13px', fontSize: 'var(--text-base)', fontWeight: 700 }}>
                {loading
                  ? <><span className="lp-spinner" />{isReset ? 'Sending…' : 'Signing in…'}</>
                  : isReset ? 'Send link' : 'Sign in'}
              </Button>
            </form>
          )}

          {error && (
            <div className="lp-error" role="alert" aria-live="polite">{error}</div>
          )}

          {!isReset && (
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
