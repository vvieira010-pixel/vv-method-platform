/**
 * login.jsx — V.V. Method Platform Login Screen
 * Teacher: Supabase magic link (email → one-click sign-in)
 * Student:  Supabase magic link (same flow)
 */

import { useState, useEffect } from 'react';
import { injectGlobalCSS } from '../components/shared.jsx';
import { sendMagicLink, getSupabaseConfig } from '../lib/supabase-storage.js';

const CSS = `
  .login-root {
    min-height: 100vh; min-height: 100dvh; height: 100vh; height: 100dvh;
    display: grid; grid-template-columns: 1fr 1fr;
    font-family: var(--font-ui); background: #fff; overflow: hidden;
  }
  @media (max-width: 860px) {
    .login-root { grid-template-columns: 1fr; height: auto; min-height: 100dvh; overflow: visible; }
    .login-brand-panel { display: none; }
    .login-mobile-tagline { display: block; }
  }
  .login-mobile-tagline {
    display: none; font-size: 13px; color: var(--muted); line-height: 1.55;
    margin: 0 0 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
  }
  .login-brand-panel {
    background: var(--accent-deep); display: flex; align-items: center; justify-content: center;
    padding: clamp(32px, 5vw, 56px) clamp(28px, 6vw, 64px);
    min-height: 100dvh; position: relative; overflow: hidden;
  }
  .login-brand-inner {
    width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 48px;
  }
  .login-brand-name   { font-size: 18px; font-weight: 800; color: var(--on-dark); letter-spacing: 0.01em; }
  .login-brand-sub    { font-size: 11px; color: rgba(241, 250, 238, 0.88); opacity: 1; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 3px; }
  .login-brand-eyebrow {
    font-size: 11px; font-weight: 700; color: #e8f8f8; letter-spacing: 0.1em;
    text-transform: uppercase; margin-bottom: 14px; display: inline-block;
    padding: 4px 8px; background: rgba(61, 166, 166, 0.28);
    border: 1px solid rgba(168, 218, 220, 0.55);
  }
  .login-brand-headline { font-size: clamp(28px, 3.2vw, 36px); font-weight: 800; color: var(--on-dark); line-height: 1.15; margin-bottom: 18px; }
  .login-brand-copy { color: rgba(241, 250, 238, 0.9); font-size: 14px; line-height: 1.7; margin-bottom: 28px; }
  .login-brand-flow   { display: flex; gap: 10px; align-items: center; font-size: 13.5px; font-weight: 600; color: rgba(241, 250, 238, 0.92); opacity: 1; flex-wrap: wrap; }
  .login-brand-flow-step { color: rgba(241, 250, 238, 0.9); }
  .login-brand-flow-step.active {
    color: #ffffff;
    font-weight: 700;
    opacity: 1;
    background: rgba(61, 166, 166, 0.28);
    border: 1px solid rgba(168, 218, 220, 0.55);
    padding: 2px 8px;
  }
  .login-brand-flow-sep { color: rgba(241, 250, 238, 0.62); opacity: 1; }

  .login-form-panel {
    display: flex; align-items: center; justify-content: center;
    min-height: 100dvh; padding: clamp(32px, 5vw, 56px) clamp(28px, 6vw, 64px); background: #fff;
  }
  .login-form-inner { width: 100%; max-width: 420px; text-align: left; }

  .login-form-title { font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.01em; margin: 0 0 8px; }
  .login-form-sub   { font-size: 14.5px; color: var(--muted); margin: 0 0 28px; line-height: 1.55; }

  .login-role-card {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 22px; border: 2px solid var(--border); border-radius: 6px;
    cursor: pointer; background: #fff; width: 100%; text-align: left;
    transition: border-color 0.15s, box-shadow 0.15s; margin-bottom: 12px;
    font-family: var(--font-ui);
  }
  .login-role-card:hover { border-color: var(--primary); box-shadow: 0 0 0 3px var(--accent-soft); }
  .login-role-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 10px; flex-shrink: 0; }
  .login-role-title { font-size: 15px; font-weight: 700; color: var(--text); display: flex; align-items: center; margin-bottom: 3px; }
  .login-role-desc  { font-size: 12.5px; color: var(--muted); }
  .login-role-arrow { color: #a8b8c0; transition: color 0.15s; }
  .login-role-card:hover .login-role-arrow { color: var(--primary); }

  .login-back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 500; color: var(--muted);
    background: none; border: none; cursor: pointer;
    font-family: var(--font-ui); margin-bottom: 20px; padding: 0;
    transition: color 0.12s;
  }
  .login-back-btn:hover { color: var(--text); }
  .login-field-label {
    display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
    text-align: left;
  }
  .login-input {
    width: 100%; padding: 14px 16px; border: 1.5px solid var(--border);
    border-radius: 4px; font-family: var(--font-ui); font-size: 16px;
    color: var(--text); background: #fff; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s; margin-bottom: 6px;
    text-align: left;
  }
  .login-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--accent-soft); }
  .login-input.mono { font-family: var(--font-mono); letter-spacing: 0.08em; text-transform: uppercase; }
  .login-error { font-size: 13px; color: var(--danger); margin-bottom: 12px; min-height: 20px; }
  .login-submit-btn {
    width: 100%; padding: 14px; border-radius: 4px; border: none; cursor: pointer;
    font-family: var(--font-ui); font-size: 15px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 20px; transition: background 0.15s, opacity 0.15s;
  }
  .login-submit-btn.teacher { background: var(--primary); color: #fff; }
  .login-submit-btn.teacher:hover { background: var(--primary-ink); }
  .login-submit-btn.student { background: var(--accent-deep); color: #fff; }
  .login-submit-btn.student:hover { background: #131a28; }
  .login-hint { font-size: 11.5px; color: var(--muted); text-align: center; margin-top: 12px; }
  .login-divider { display: flex; align-items: center; gap: 10px; margin: 18px 0 4px; color: var(--muted); font-size: 12px; }
  .login-divider::before, .login-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .login-magic-btn {
    width: 100%; padding: 13px; border-radius: 4px; cursor: pointer;
    font-family: var(--font-ui); font-size: 14px; font-weight: 600;
    background: #fff; color: var(--primary-ink); border: 1.5px solid var(--primary);
    margin-top: 10px; transition: background 0.15s;
  }
  .login-magic-btn:hover:not(:disabled) { background: var(--accent-subtle); }
  .login-magic-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .login-magic-sent {
    margin-top: 12px; padding: 12px 14px; border-radius: 6px;
    background: var(--success-bg); border: 1px solid var(--success-soft);
    color: var(--text); font-size: 13px; line-height: 1.5;
  }
`;

let loginCssInjected = false;
function injectLoginCSS() {
  if (loginCssInjected || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);
  loginCssInjected = true;
}

export default function LoginScreen({ onSignIn, initialMode = 'choose' }) {
  const [mode, setMode] = useState(initialMode);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [error, setError] = useState('');
  const [magicSending, setMagicSending] = useState(false);
  const [magicSentTo, setMagicSentTo] = useState('');
  const supabaseReady = getSupabaseConfig().isConfigured;

  useEffect(() => {
    injectGlobalCSS();
    injectLoginCSS();
  }, []);

  const handleTeacherMagicLink = async () => {
    setError('');
    setMagicSentTo('');
    const email = teacherEmail.trim();
    if (!email) { setError('Enter your email to receive a sign-in link.'); return; }
    if (!supabaseReady) { setError('Auth is not configured — check Supabase env vars.'); return; }
    setMagicSending(true);
    try {
      // createUser:true — provisions the Supabase Auth account on first sign-in.
      // Role resolved in App.jsx: email with no student roster row → teacher.
      await sendMagicLink(email, window.location.origin, { createUser: true });
      setMagicSentTo(email);
    } catch (e) {
      setError(e.message || 'Could not send the sign-in link.');
    }
    setMagicSending(false);
  };

  const handleStudentMagicLink = async () => {
    setError('');
    setMagicSentTo('');
    const email = studentEmail.trim();
    if (!email) { setError('Enter your email to receive a sign-in link.'); return; }
    if (!supabaseReady) { setError('Auth is not configured. Contact your teacher.'); return; }
    setMagicSending(true);
    try {
      // createUser:true — first sign-in provisions the auth account and
      // self-claims the teacher-created roster row (matched by email).
      await sendMagicLink(email, window.location.origin, { createUser: true });
      setMagicSentTo(email);
    } catch (e) {
      setError(e.message || 'Could not send the sign-in link.');
    }
    setMagicSending(false);
  };

  const back = (m) => {
    setMode(m);
    setError('');
    setTeacherEmail('');
    setStudentEmail('');
    setMagicSentTo('');
  };

  const formHeading = mode === 'choose'
    ? 'Sign in'
    : mode === 'teacher'
      ? 'Teacher sign in'
      : 'Student sign in';
  const formSubcopy = mode === 'choose'
    ? 'Choose teacher or student to continue.'
    : 'Enter your email and we\'ll send you a one-click sign-in link.';

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
            <p className="login-brand-copy">Log in to access your lessons, feedback, homework, and practice activities.</p>
            <div className="login-brand-flow" aria-label="Teaching cycle">
              <span className="login-brand-flow-step">Class</span>
              <span className="login-brand-flow-sep" aria-hidden="true">→</span>
              <span className="login-brand-flow-step active" aria-current="step">Diagnosis</span>
              <span className="login-brand-flow-sep" aria-hidden="true">→</span>
              <span className="login-brand-flow-step">Feedback + Homework</span>
              <span className="login-brand-flow-sep" aria-hidden="true">→</span>
              <span className="login-brand-flow-step">Review</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="login-form-panel">
        <div className="login-form-inner">

          <p className="login-mobile-tagline">
            Clear practice. Better feedback. Real progress. Class → Diagnosis → Feedback + Homework → Review.
          </p>

          {mode !== 'choose' && (
            <button type="button" className="login-back-btn" onClick={() => back('choose')} aria-label="Back to role selection">
              ← Back
            </button>
          )}

          <h1 className="login-form-title">{formHeading}</h1>
          <p className="login-form-sub">{formSubcopy}</p>

          {mode === 'choose' && (
            <>
              <button type="button" className="login-role-card" onClick={() => back('teacher')}
                aria-label="Sign in as teacher — diagnose, feedback, homework, reports">
                <div>
                  <div className="login-role-title">
                    <span className="login-role-dot" style={{ background: 'var(--primary)' }} />
                    Teacher
                  </div>
                  <div className="login-role-desc">Diagnose, feedback, homework, Practice Studio, reports</div>
                </div>
                <span className="login-role-arrow" aria-hidden="true">→</span>
              </button>

              <button type="button" className="login-role-card" onClick={() => back('student')}
                aria-label="Sign in as student — lessons, feedback, homework, practice">
                <div>
                  <div className="login-role-title">
                    <span className="login-role-dot" style={{ background: 'var(--accent)' }} />
                    Student
                  </div>
                  <div className="login-role-desc">Lessons, feedback, homework, practice, progress</div>
                </div>
                <span className="login-role-arrow" aria-hidden="true">→</span>
              </button>
            </>
          )}

          {mode === 'teacher' && (
            <>
              <label className="login-field-label" htmlFor="login-teacher-email">Your email</label>
              <input
                id="login-teacher-email"
                className="login-input"
                type="email"
                autoComplete="email"
                value={teacherEmail}
                onChange={e => setTeacherEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTeacherMagicLink()}
                placeholder="you@email.com"
                autoFocus
              />
              <div className="login-error" role="alert" aria-live="polite">{error}</div>
              {magicSentTo ? (
                <div className="login-magic-sent" role="status" aria-live="polite">
                  ✉️ Check <strong>{magicSentTo}</strong> for your sign-in link.
                  Open it on this device to continue.
                </div>
              ) : (
                <button
                  type="button"
                  className="login-submit-btn teacher"
                  onClick={handleTeacherMagicLink}
                  disabled={magicSending}
                >
                  {magicSending ? 'Sending…' : 'Send me a sign-in link →'}
                </button>
              )}
              <p className="login-hint">
                No password — we email you a one-click link to sign in securely.
              </p>
            </>
          )}

          {mode === 'student' && (
            <>
              <label className="login-field-label" htmlFor="login-student-email">Your email</label>
              <input
                id="login-student-email"
                className="login-input"
                type="email"
                autoComplete="email"
                value={studentEmail}
                onChange={e => setStudentEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStudentMagicLink()}
                placeholder="student@email.com"
                autoFocus
              />
              <div className="login-error" role="alert" aria-live="polite">{error}</div>
              {magicSentTo ? (
                <div className="login-magic-sent" role="status" aria-live="polite">
                  ✉️ Check <strong>{magicSentTo}</strong> for your sign-in link.
                  Open it on this device to continue.
                </div>
              ) : (
                <button
                  type="button"
                  className="login-submit-btn student"
                  onClick={handleStudentMagicLink}
                  disabled={magicSending}
                >
                  {magicSending ? 'Sending…' : 'Send me a sign-in link →'}
                </button>
              )}
              <p className="login-hint">
                No password — we email you a one-click link. Your homework and feedback sync automatically.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

