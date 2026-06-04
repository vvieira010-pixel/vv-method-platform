import { useState, useEffect, lazy, Suspense } from 'react';
import LoginScreen from './pages/login.jsx';
import StudentDashboard from './pages/student-dashboard.jsx';
import ErrorBoundary from './components/error-boundary.jsx';
import { TweaksPanel, TweakSection, TweakRadio, TweakColor } from './components/tweaks-panel.jsx';
import { Icon, Avatar, Button, Shell } from './components/shared.jsx';
import { STUDENTS } from './data/students.jsx';
import { seedStudentsIfEmpty, getStudents } from './lib/workflow.js';
import {
  getSupabaseConfig,
  parseSupabaseHashFragment,
  storeSupabaseSession,
  readStoredSupabaseSession,
  clearStoredSupabaseSession,
  fetchSupabaseUser,
} from './lib/supabase-storage.js';
import { claimStudentByEmail, ensureProfile, setSessionRole } from './lib/supabase-db.js';

// Lazy-loaded teacher pages
const TeacherDashboard  = lazy(() => import('./pages/teacher-dashboard.jsx'));
const StudentsPage      = lazy(() => import('./pages/students.jsx'));
const StudentProfile    = lazy(() => import('./pages/student-profile.jsx'));
const CalendarPage      = lazy(() => import('./pages/calendar.jsx'));
const ClassRecord       = lazy(() => import('./pages/class-record.jsx'));
const DiagnosticsPage   = lazy(() => import('./pages/diagnostics.jsx'));
const DiagnosticCreate  = lazy(() => import('./pages/diagnostic-create.jsx'));
const HomeworkPage      = lazy(() => import('./pages/homework.jsx'));
const HomeworkCreate    = lazy(() => import('./pages/homework-create.jsx'));
const SubmissionsPage   = lazy(() => import('./pages/submissions.jsx'));
const SubmissionReview  = lazy(() => import('./pages/submission-review.jsx'));
const ErrorBankPage     = lazy(() => import('./pages/error-bank.jsx'));
const ReportsPage       = lazy(() => import('./pages/reports.jsx'));
const SettingsPage      = lazy(() => import('./pages/settings.jsx'));
const ExerciseDemo      = lazy(() => import('./pages/exercise-demo.jsx'));
const InboxPage         = lazy(() => import('./tools/tool-inbox.jsx'));

export default function App() {
  const [auth, setAuth] = useState(null);
  const [view, setView] = useState('dashboard');
  // Sub-view params: { studentId?, classEventId?, diagnosisId?, homeworkId?, submissionId? }
  const [viewParams, setViewParams] = useState({});
  const [tweaks, setTweaksState] = useState(() => ({
    cardStyle: 'bordered',
    accent: '#2d8b8b',
    ...window.TWEAK_DEFAULTS,
  }));
  const [students, setStudents] = useState([]);

  // ── Supabase auth: handle implicit-flow hash redirect + restore stored session ──
  useEffect(() => {
    const { url, anonKey, isConfigured } = getSupabaseConfig();
    if (!isConfigured) return;

    /**
     * Resolve auth payload from a verified Supabase user. Role is determined by
     * whether the email matches a teacher-created roster row: if a student row
     * claims this user, they are a student; otherwise a teacher. The claim sets
     * students.auth_user_id so the student's RLS policies unlock their data.
     */
    async function resolveAuth(accessToken, sbUser) {
      const meta = sbUser?.user_metadata || {};
      const email = sbUser?.email || '';
      let claimed = null;
      try { claimed = await claimStudentByEmail(email); } catch { /* treat as teacher */ }
      if (claimed) {
        setSessionRole('student');
        await ensureProfile('student', { displayName: meta.display_name || email, studentUuid: claimed.id });
        return { role: 'student', studentId: claimed.local_id || claimed.id, email };
      }
      setSessionRole('teacher');
      await ensureProfile('teacher', { displayName: meta.display_name || email });
      return { role: 'teacher', email, displayName: meta.display_name || email };
    }

    async function handleHash() {
      const fragment = parseSupabaseHashFragment(window.location.hash);
      if (!fragment?.access_token) return false;

      // Always clean the URL first so the token isn't bookmarked or leaked.
      history.replaceState(null, '', window.location.pathname + window.location.search);

      try {
        // Validate by fetching the actual user from Supabase — rejects forged tokens.
        const sbUser = await fetchSupabaseUser(url, anonKey, fragment.access_token);
        storeSupabaseSession({
          access_token: fragment.access_token,
          refresh_token: fragment.refresh_token,
          expires_at: fragment.expires_at || Math.floor(Date.now() / 1000) + fragment.expires_in,
          user: sbUser,
        });
        const payload = await resolveAuth(fragment.access_token, sbUser);
        if (payload) setAuth(payload);
      } catch {
        // Token invalid or Supabase unreachable — do not sign in.
        clearStoredSupabaseSession();
      }
      return true;
    }

    async function restoreSession() {
      const stored = readStoredSupabaseSession();
      if (!stored?.access_token) return;
      try {
        // Re-validate the stored token so a stale or tampered session is rejected.
        const sbUser = await fetchSupabaseUser(url, anonKey, stored.access_token);
        const payload = await resolveAuth(stored.access_token, sbUser);
        if (payload) setAuth(payload);
      } catch {
        clearStoredSupabaseSession();
      }
    }

    handleHash().then(wasHash => { if (!wasHash) restoreSession(); });
  }, []);

  // Seed students from hardcoded list on first run, then load live roster
  useEffect(() => {
    seedStudentsIfEmpty(STUDENTS).then(() => {
      getStudents().then(setStudents);
    });
  }, []);

  // Re-load students on updates
  useEffect(() => {
    const reload = () => getStudents().then(setStudents);
    window.addEventListener('vv:students-updated', reload);
    return () => window.removeEventListener('vv:students-updated', reload);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-cards', tweaks.cardStyle);
    document.documentElement.style.setProperty('--accent', tweaks.accent);
    document.documentElement.style.setProperty('--accent-deep', shadeColor(tweaks.accent, -22));
    document.documentElement.style.setProperty('--accent-soft', softColor(tweaks.accent));
  }, [tweaks]);

  useEffect(() => {
    window.vvGo = (target, params = {}) => {
      setView(target);
      setViewParams(params);
    };
    return () => { delete window.vvGo; };
  }, []);


  const navigate = (target, params = {}) => {
    setView(target);
    setViewParams(params);
  };

  const setTweak = (key, value) => {
    const next = { ...tweaks, [key]: value };
    setTweaksState(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, getSafeOrigin());
  };

  const handleSignIn = (payload) => setAuth(payload);
  const handleSignOut = () => {
    clearStoredSupabaseSession();
    setSessionRole('');
    setAuth(null);
    setView('dashboard');
    setViewParams({});
  };

  if (!auth) {
    return <LoginScreen onSignIn={handleSignIn} initialMode="choose" />;
  }

  if (auth.role === 'student') {
    const student = students.find(s => s.id === auth.studentId);
    if (!student) return <PageLoader />;
    return (
      <ErrorBoundary label="Dashboard unavailable">
        <StudentDashboard student={student} onSignOut={handleSignOut} />
      </ErrorBoundary>
    );
  }

  // ── Teacher shell ──
  const teacherTabs = [
    { id: 'dashboard',    label: 'Dashboard',    icon: <Icon.home size={16} /> },
    { id: 'students',     label: 'Students',     icon: <Icon.student size={16} /> },
    { id: 'calendar',     label: 'Calendar',     icon: <Icon.calendar size={16} /> },
    { id: 'diagnostics',  label: 'Diagnostics',  icon: <Icon.diagnose size={16} /> },
    { id: 'homework',     label: 'Homework',     icon: <Icon.homework size={16} /> },
    { id: 'submissions',  label: 'Submissions',  icon: <Icon.doc size={16} /> },
    { id: 'inbox',        label: 'Inbox',        icon: <Icon.inbox size={16} /> },
    { id: 'error-bank',   label: 'Error Bank',   icon: <Icon.warning size={16} /> },
    { id: 'reports',      label: 'Reports',      icon: <Icon.progress size={16} /> },
    { id: 'exercises',    label: 'Exercises',    icon: <Icon.doc size={16} /> },
    { id: 'settings',     label: 'Settings',     icon: <Icon.settings size={16} /> },
  ];

  const rightSlot = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
<span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>Teacher</span>
      <Avatar name="Vini V" size={32} tone="ink" />
      <Button variant="quiet" size="sm" onClick={handleSignOut}>Sign out</Button>
    </div>
  );

  return (
    <>
      <Shell tabs={teacherTabs} active={view} onTab={(id) => navigate(id)} rightSlot={rightSlot}>
        <ErrorBoundary label="Page unavailable">
          <Suspense fallback={<PageLoader />}>
            {renderTeacherPage(view, viewParams, { students, navigate })}
          </Suspense>
        </ErrorBoundary>
      </Shell>
      <TweaksUI tweaks={tweaks} setTweak={setTweak} />
      <ToastHost />
    </>
  );
}

function renderTeacherPage(view, params, ctx) {
  const { students, navigate } = ctx;

  switch (view) {
    case 'dashboard':
      return <TeacherDashboard students={students} onNavigate={navigate} />;

    case 'students':
      return <StudentsPage students={students} onNavigate={navigate} />;

    case 'students:profile':
      return <StudentProfile studentId={params.studentId} students={students} onNavigate={navigate} />;

    case 'calendar':
      return <CalendarPage students={students} onNavigate={navigate} />;

    case 'calendar:class':
      return <ClassRecord classEventId={params.classEventId} students={students} onNavigate={navigate} />;

    case 'diagnostics':
      return <DiagnosticsPage students={students} onNavigate={navigate} />;

    case 'diagnostics:create':
      return <DiagnosticCreate
        studentId={params.studentId}
        classEventId={params.classEventId}
        diagnosisId={params.diagnosisId}
        students={students}
        onNavigate={navigate}
      />;

    case 'homework':
      return <HomeworkPage students={students} onNavigate={navigate} />;

    case 'homework:create':
      return <HomeworkCreate
        diagnosisId={params.diagnosisId}
        studentId={params.studentId}
        students={students}
        onNavigate={navigate}
      />;

    case 'submissions':
      return <SubmissionsPage students={students} onNavigate={navigate} />;

    case 'submissions:review':
      return <SubmissionReview
        submissionId={params.submissionId}
        students={students}
        onNavigate={navigate}
      />;

    case 'inbox':
      return <InboxPage students={students} onNavigate={navigate} />;

    case 'error-bank':
      return <ErrorBankPage students={students} onNavigate={navigate} />;

    case 'reports':
      return <ReportsPage students={students} onNavigate={navigate} />;

    case 'settings':
      return <SettingsPage onNavigate={navigate} />;

    case 'exercises':
      return <ExerciseDemo onNavigate={navigate} />;

    default:
      return <TeacherDashboard students={students} onNavigate={navigate} />;
  }
}

/* ─── Helpers ────────────────────────────────────────────────── */
function getSafeOrigin() {
  try { if (document.referrer) return new URL(document.referrer).origin; } catch {}
  return window.location.origin;
}
function shadeColor(hex, percent) {
  const f = parseInt(hex.slice(1), 16), t = percent < 0 ? 0 : 255, p = Math.abs(percent) / 100;
  const R = f >> 16, G = (f >> 8) & 0x00ff, B = f & 0x0000ff;
  return '#' + ((1 << 24) + (Math.round((t - R) * p) + R << 16) + (Math.round((t - G) * p) + G << 8) + Math.round((t - B) * p) + B).toString(16).slice(1);
}
function softColor(hex) { return shadeColor(hex, 65); }

function PageLoader() {
  return (
    <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>Loading…</span>
    </div>
  );
}

function ToastHost() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const onToast = (e) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(arr => [...arr, { id, msg: e.detail.msg, kind: e.detail.kind || 'ok' }]);
      setTimeout(() => setToasts(arr => arr.filter(x => x.id !== id)), 3200);
    };
    window.addEventListener('vv-toast', onToast);
    window.toast = (msg, kind) => window.dispatchEvent(new CustomEvent('vv-toast', { detail: { msg, kind } }));
    return () => { window.removeEventListener('vv-toast', onToast); delete window.toast; };
  }, []);
  const TONES = {
    ok:   { bg: 'var(--primary-ink)', fg: '#fff', g: '✓' },
    info: { bg: 'var(--primary)',     fg: '#fff', g: 'i' },
    warn: { bg: 'var(--warning)',     fg: '#fff', g: '!' },
    go:   { bg: 'var(--accent)',      fg: '#fff', g: '→' },
  };
  return (
    <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      {toasts.map(t => {
        const tone = TONES[t.kind] || TONES.ok;
        return (
          <div key={t.id} style={{ background: tone.bg, color: tone.fg, padding: '12px 18px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-toast)', display: 'flex', alignItems: 'center', gap: 12, minWidth: 280, maxWidth: 380, pointerEvents: 'auto' }}>
            <span style={{ width: 22, height: 22, borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,.18)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>{tone.g}</span>
            <span style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.4 }}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

function TweaksUI({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Card style">
        <TweakRadio options={[{ label: 'Flat', value: 'flat' }, { label: 'Bordered', value: 'bordered' }, { label: 'Shadowed', value: 'shadowed' }]} value={tweaks.cardStyle} onChange={v => setTweak('cardStyle', v)} />
      </TweakSection>
      <TweakSection label="Accent color">
        <TweakColor value={tweaks.accent} onChange={v => setTweak('accent', v)} options={['#0B1F3A','#1E4E8C','#2563EB','#F97316','#FDBA74']} />
      </TweakSection>
    </TweaksPanel>
  );
}
