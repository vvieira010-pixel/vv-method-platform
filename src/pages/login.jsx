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
    <div className="lp-root bg-grain" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <div className="flex flex-wrap" style={{ width: '100%', maxWidth: '1100px', alignItems: 'stretch', justifyContent: 'center' }}>
        
        {/* Brand Side - Asymmetric weight */}
        <div className="flex-1" style={{ minWidth: '320px', padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexBasis: '55%' }}>
           <div style={{ marginBottom: 'var(--space-8)' }}>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>MET Proficiency Mastery</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Teacher Vinicius</div>
           </div>
           <h1 style={{ fontSize: 'var(--text-4xl)', lineHeight: 1.1, marginBottom: 'var(--space-4)', color: 'var(--text)' }}>
              Target B2 mastery.<br />With confidence and precision.
           </h1>
           <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)', maxWidth: 450 }}>
              Personalized 1:1 MET preparation designed for healthcare professionals seeking excellence.
           </p>
        </div>

        {/* Form Side */}
        <div className="flex-1" style={{ minWidth: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)', flexBasis: '45%' }}>
           <Card style={{ width: '100%', maxWidth: 440, padding: 'var(--space-8)' }} bezel>
              <div className="lp-greeting" style={{ textAlign: 'left', marginBottom: 'var(--space-6)' }}>
                 <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 8 }}>{isReset ? 'Reset your password' : 'Welcome back'}</h2>
                 <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{isReset ? 'Enter your email and we\'ll send you a sign-in link.' : 'Please enter your credentials.'}</p>
              </div>

              {isReset && resetSent ? (
                <div className="lp-success" role="status" style={{ padding: 'var(--space-4)', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)' }}>
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
                <div className="lp-error" role="alert" aria-live="polite" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>{error}</div>
              )}

              {!isReset && (
                <div className="lp-forgot" style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
                  <button type="button" onClick={() => switchMode('reset')} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    Forgot password?
                  </button>
                </div>
              )}

              {isReset && (
                <div className="lp-toggle" style={{ marginTop: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-sm)' }}>
                  Remember it?
                  <button type="button" onClick={() => switchMode('signin')} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', marginLeft: 4 }}>Back to sign in</button>
                </div>
              )}

              <div className="lp-footer" style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
                MET Proficiency Mastery · Private platform<br />
                Access is by invitation only.<br /><br />
                Having trouble signing in?{' '}
                <a href="mailto:vvieira010x@gmail.com" style={{ color: 'var(--accent-text)', textDecoration: 'underline' }}>
                  Contact Teacher Vinicius
                </a>
              </div>
            </Card>
          </div>
        </div>

    </div>
  );
}
