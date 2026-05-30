/**
 * login.jsx — V.V. Method Platform Login Screen
 * Simple Home/Login screen for the MET preparation platform.
 * Teacher: email + password · Student: email + password
 */

import { useState, useEffect } from 'react';
import { injectGlobalCSS } from '../components/shared.jsx';
import { STUDENTS } from '../data/students.jsx';

const TEACHER_EMAIL = String(import.meta.env.VITE_TEACHER_EMAIL || 'teacher@vvmethod.com').toLowerCase();

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');

  .login-root {
    min-height: 100dvh; display: grid; grid-template-columns: 1fr 1fr;
    font-family: var(--font-ui); background: var(--bg);
  }
  @media (max-width: 860px) {
    .login-root { grid-template-columns: 1fr; }
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
    position: relative; overflow: hidden;
  }
  .login-brand-inner {
    width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 48px;
  }
  .login-brand-name   { font-size: 18px; font-weight: 800; color: var(--on-dark); letter-spacing: 0.01em; }
  .login-brand-sub    { font-size: 11px; color: var(--on-dark-muted); opacity: 0.65; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 3px; }
  .login-brand-eyebrow { font-size: 11px; font-weight: 700; color: var(--primary); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 14px; }
  .login-brand-headline { font-size: clamp(28px, 3.2vw, 36px); font-weight: 800; color: var(--on-dark); line-height: 1.15; margin-bottom: 18px; }
  .login-brand-copy { color: var(--on-dark-muted); font-size: 14px; line-height: 1.7; margin-bottom: 28px; }
  .login-brand-flow   { display: flex; gap: 10px; align-items: center; font-size: 13.5px; font-weight: 500; color: var(--on-dark-muted); opacity: 0.85; flex-wrap: wrap; }
  .login-brand-flow-step { color: var(--on-dark-muted); }
  .login-brand-flow-step.active { color: var(--primary); font-weight: 600; opacity: 1; }
  .login-brand-flow-sep { color: var(--on-dark-muted); opacity: 0.4; }

  .login-form-panel {
    display: flex; align-items: center; justify-content: center;
    padding: clamp(32px, 5vw, 56px) clamp(28px, 6vw, 64px); background: #fff;
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
  const [error, setError] = useState('');

  useEffect(() => {
    injectGlobalCSS();
    injectLoginCSS();
  }, []);

  const handleTeacher = () => {
    const normalizedEmail = teacherEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your teacher email.');
      return;
    }
    if (normalizedEmail === TEACHER_EMAIL) {
      onSignIn({ role: 'teacher' });
    } else {
      setError("Teacher email doesn't match. Try again.");
    }
  };

  const handleStudentPick = (student) => {
    onSignIn({ role: 'student', studentId: student.id });
  };

  const back = (m) => {
    setMode(m);
    setError('');
    setTeacherEmail('');
  };

  const formHeading = mode === 'choose'
    ? 'Sign in'
    : mode === 'teacher'
      ? 'Teacher sign in'
      : 'Student sign in';
  const formSubcopy = mode === 'choose'
    ? 'Choose teacher or student to continue.'
    : mode === 'teacher'
      ? 'Enter your workspace credentials.'
      : 'Open your dashboard with your account.';

  return (
    <div className="login-root">
      {/* ── Brand panel ── */}
      <div className="login-brand-panel">
        <div className="login-brand-inner">
          <div>
            <div className="login-brand-name">MET Preparation</div>
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
              <label className="login-field-label" htmlFor="login-teacher-email">Teacher Email</label>
              <input
                id="login-teacher-email"
                className="login-input"
                type="email"
                autoComplete="email"
                value={teacherEmail}
                onChange={e => setTeacherEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTeacher()}
                placeholder="teacher@vvmethod.com"
                autoFocus
              />
<div className="login-error" role="alert" aria-live="polite">{error}</div>
              <button type="button" className="login-submit-btn teacher" onClick={handleTeacher}>
                Enter Workspace →
              </button>
            </>
          )}

          {mode === 'student' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {STUDENTS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStudentPick(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 16px', border: '2px solid var(--border)',
                      borderRadius: 8, cursor: 'pointer', background: '#fff',
                      fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600,
                      color: 'var(--text)', textAlign: 'left', width: '100%',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <span style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--accent)', color: '#fff',
                      display: 'grid', placeItems: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>
                      {s.firstName.slice(0, 1)}
                    </span>
                    {s.firstName}
                  </button>
                ))}
              </div>
              <div className="login-hint" style={{ marginTop: 16 }}>Tap your name to open your dashboard.</div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
