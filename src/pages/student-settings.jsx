import { useState } from 'react';
import { Icon } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { readStoredSupabaseSession, updateUserPassword } from '../lib/supabase-storage.js';

export default function StudentSettings({ student, onSignOut }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const activeSession = readStoredSupabaseSession();

  async function handleSetPassword(e) {
    e.preventDefault();
    if (!activeSession?.access_token) {
      setPasswordMsg({ ok: false, text: 'Sign in with your email link first, then set a password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ ok: false, text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: 'Passwords do not match.' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      await updateUserPassword(newPassword, activeSession.access_token);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ ok: true, text: 'Password updated. You can now use email and password next time.' });
      window.toast?.('Password updated.', 'ok');
    } catch (err) {
      setPasswordMsg({ ok: false, text: err.message });
    }
    setPasswordSaving(false);
  }

  return (
    <div className="page-shell-narrow" style={{ padding: 'var(--space-6) var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-5)' }}>
        <Icon.settings size={22} />
        <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 700 }}>Settings</h1>
      </div>

      {/* Password */}
      <section className="student-panel" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="student-panel-head">
          <div>
            <span className="student-panel-kicker">Account</span>
            <h2>Change password</h2>
          </div>
          <span className="student-pill">{activeSession?.access_token ? 'Signed in' : 'Needs sign in link'}</span>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
          Keep your account secure by choosing a password you can use next time instead of the login link.
        </p>
        {activeSession?.access_token ? (
          <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>New password</span>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="Choose a password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={passwordSaving}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirm password</span>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat the password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={passwordSaving}
              />
            </label>
            {passwordMsg && (
              <p style={{ fontSize: 'var(--text-sm)', color: passwordMsg.ok ? 'var(--success)' : 'var(--danger)', margin: 0, lineHeight: 1.5 }}>
                {passwordMsg.text}
              </p>
            )}
            <div>
              <Button type="submit" variant="primary" disabled={passwordSaving || !newPassword || !confirmPassword}>
                {passwordSaving ? 'Saving…' : 'Set password'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="student-empty-card" style={{ marginTop: 8 }}>
            Sign in with your email link first, then you can set a password here.
          </div>
        )}
      </section>

      {/* Sign out */}
      <section className="student-panel">
        <div className="student-panel-head">
          <div>
            <span className="student-panel-kicker">Session</span>
            <h2>Sign out</h2>
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
          Sign out of your account and return to the login screen.
        </p>
        <Button variant="danger" onClick={onSignOut}>
          Sign out
        </Button>
      </section>
    </div>
  );
}
