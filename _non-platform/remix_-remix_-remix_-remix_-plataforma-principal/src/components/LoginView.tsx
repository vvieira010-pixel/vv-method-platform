import { useState } from 'react';
import { STUDENTS } from '../lib/data';
import { Avatar } from '../lib/utils';
import { Student } from '../types';

export default function LoginView({ onLogin }: { onLogin: (role: 'teacher' | 'student', user?: Student) => void }) {
  const [pane, setPane] = useState<'choose' | 'teacher' | 'student'>('choose');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleTeacherLogin = () => {
    if (!email) {
      setError('Please enter your teacher email.');
      return;
    }
    // simple mock validation
    if (email !== 'teacher@vvmethod.com') {
      setError("Email doesn't match. Try teacher@vvmethod.com");
      return;
    }
    setError('');
    onLogin('teacher');
  };

  return (
    <div id="login-view" className="grid w-full">
      <div className="login-brand">
        <div className="login-brand-inner">
          <div>
            <div className="login-brand-logo">V.V. Method</div>
            <div className="login-brand-sub">MET Preparation</div>
          </div>
          <div>
            <div className="login-brand-eyebrow">Your learning path</div>
            <div className="login-brand-headline">Clear practice.<br />Better feedback.<br />Real progress.</div>
            <p className="login-brand-copy">Log in to access your lessons, feedback, homework, and practice activities.</p>
            <div className="login-flow">
              <span className="login-flow-step">Class</span>
              <span className="login-flow-sep">→</span>
              <span className="login-flow-step active">Diagnosis</span>
              <span className="login-flow-sep">→</span>
              <span className="login-flow-step">Feedback + HW</span>
              <span className="login-flow-sep">→</span>
              <span className="login-flow-step">Review</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-inner">
          {pane === 'choose' && (
            <div>
              <h1 className="login-title">Sign in</h1>
              <p className="login-sub">Choose teacher or student to continue.</p>
              <button className="role-card" onClick={() => setPane('teacher')}>
                <div>
                  <div className="role-name">
                    <span className="role-dot" style={{ background: 'var(--primary)' }}></span>
                    Teacher
                  </div>
                  <div className="role-desc">Diagnose, feedback, homework, AI Studio, reports</div>
                </div>
                <span className="role-arrow">→</span>
              </button>
              <button className="role-card" onClick={() => setPane('student')}>
                <div>
                  <div className="role-name">
                    <span className="role-dot" style={{ background: 'var(--accent)' }}></span>
                    Student
                  </div>
                  <div className="role-desc">Lessons, feedback, homework, practice, progress</div>
                </div>
                <span className="role-arrow">→</span>
              </button>
            </div>
          )}

          {pane === 'teacher' && (
            <div>
              <button className="login-back" onClick={() => setPane('choose')}>← Back</button>
              <h1 className="login-title">Teacher sign in</h1>
              <p className="login-sub">Enter your workspace credentials.</p>
              <label className="login-field-label" htmlFor="t-email">Teacher email</label>
              <input
                id="t-email"
                className="login-input"
                type="email"
                placeholder="teacher@vvmethod.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTeacherLogin();
                }}
              />
              <div id="t-error" className="login-error">{error}</div>
              <button className="login-btn" onClick={handleTeacherLogin}>
                Enter Workspace →
              </button>
            </div>
          )}

          {pane === 'student' && (
            <div>
              <button className="login-back" onClick={() => setPane('choose')}>← Back</button>
              <h1 className="login-title">Student sign in</h1>
              <p className="login-sub">Tap your name to open your dashboard.</p>
              <div className="student-grid" id="student-grid">
                {STUDENTS.map((s) => (
                  <button key={s.id} className="student-pick-btn" onClick={() => onLogin('student', s)}>
                    <Avatar name={s.name} size={32} />
                    <span>{s.firstName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
