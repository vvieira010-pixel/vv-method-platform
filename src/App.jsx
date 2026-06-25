import { shadeColor, softColor } from './lib/color-utils.js';
import { useState, useEffect, lazy, Suspense } from 'react';
import LoginScreen from './pages/login.jsx';
import ErrorBoundary from './components/error-boundary.jsx';
import { TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle } from './components/tweaks-panel.jsx';
import { Icon, Shell } from './components/shared.jsx';
const getStudentsData = () => import('./data/students.jsx').then(m => m.STUDENTS);
import { seedStudentsIfEmpty, getStudents } from './lib/workflow-roster.js';
import { getAllSubmissions } from './lib/workflow.js';
import {
  getSupabaseConfig,
  parseSupabaseHashFragment,
  parsePKCECode,
  exchangePKCECode,
  storeSupabaseSession,
  readStoredSupabaseSession,
  clearStoredSupabaseSession,
  fetchSupabaseUser,
} from './lib/supabase-storage.js';
import { claimStudentByEmail, ensureProfile, setSessionRole, upsertReviewSchedule, loadReviewSchedule } from './lib/supabase-db.js';
import { enableSync } from './lib/spaced-repetition.js';

// Lazy-loaded pages
const StudentDashboard  = lazy(() => import('./pages/student-dashboard.jsx'));
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

const InboxPage         = lazy(() => import('./tools/tool-inbox.jsx'));
const PerspectiveDesigner = lazy(() => import('./tools/tool-perspective-designer.jsx'));
const ExercisesPage     = lazy(() => import('./pages/exercises.jsx'));

export default function App() {
  const [auth, setAuth] = useState(null);
  const [view, setView] = useState('dashboard');
  // Sub-view params: { studentId?, classEventId?, diagnosisId?, homeworkId?, submissionId? }
  const [viewParams, setViewParams] = useState({});
  const [tweaks, setTweaksState] = useState(() => ({
    cardStyle: 'bordered',
    accent: '#148891',
    darkMode: false,
    ...window.TWEAK_DEFAULTS,
  }));
  const [students, setStudents] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);

  // ── Supabase auth: handle implicit-flow hash redirect + restore stored session ──
  useEffect(() => {
    const { url, anonKey, isConfigured } = getSupabaseConfig();
    if (!isConfigured) return;

    /**
     * Resolve auth payload from a verified Supabase user. A user who claims a
     * roster row by email is a student. Otherwise ONLY the configured teacher
     * email(s) get the teacher role — any other account (e.g. a self-registered
     * or mistyped email) is rejected and signed out, so self-registration can
     * never grant teacher access.
     */
    async function resolveAuth(accessToken, sbUser) {
      const meta = sbUser?.user_metadata || {};
      const email = sbUser?.email || '';
      let claimed = null;
      try { claimed = await claimStudentByEmail(email); } catch (e) { console.warn('[Auth] claimStudentByEmail failed', e); }
      if (claimed) {
        setSessionRole('student');
        await ensureProfile('student', { displayName: meta.display_name || email, studentUuid: claimed.id });
        return { role: 'student', studentId: claimed.local_id || claimed.id, email };
      }
      // No roster row claimed → only known teacher email(s) may be a teacher.
      const rawTeacherEmail = import.meta.env.VITE_TEACHER_EMAIL;
      const teacherEmails = (rawTeacherEmail || 'vvieira010x@gmail.com')
        .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
      if (teacherEmails.includes(email.trim().toLowerCase())) {
        setSessionRole('teacher');
        await ensureProfile('teacher', { displayName: meta.display_name || email });
        return { role: 'teacher', email, displayName: meta.display_name || email };
      }
      // Unauthorized: not a roster student and not the teacher. Clear the session so the
      // user returns to the login screen with a notice instead of landing in the teacher app.
      try {
        localStorage.setItem('vv:auth_notice', "This email isn't set up for access yet. Ask your teacher to add you to the roster, then register again.");
      } catch { /* storage unavailable */ }
      clearStoredSupabaseSession();
      setSessionRole('');
      return null;
    }

    // ── PKCE flow: ?code= in query string (modern Supabase default) ──
    async function handlePKCE() {
      const code = parsePKCECode(window.location.search);
      if (!code) return false;
      // Clean the URL immediately so the code can't be replayed.
      history.replaceState(null, '', window.location.pathname);
      try {
        const session = await exchangePKCECode(url, anonKey, code);
        if (!session?.access_token) { clearStoredSupabaseSession(); return true; }
        const sbUser = session.user || await fetchSupabaseUser(url, anonKey, session.access_token);
        storeSupabaseSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token || '',
          expires_at: session.expires_at || Math.floor(Date.now() / 1000) + (session.expires_in || 3600),
          user: sbUser,
        });
        const payload = await resolveAuth(session.access_token, sbUser);
        if (payload) setAuth(payload);
      } catch {
        clearStoredSupabaseSession();
      }
      return true;
    }

    // ── Implicit flow: #access_token= in hash (legacy / fallback) ──
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
          expires_at: fragment.expires_at || Math.floor(Date.now() / 1000) + (fragment.expires_in || 3600),
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

    handlePKCE().then(wasPKCE => {
      if (!wasPKCE) handleHash().then(wasHash => { if (!wasHash) restoreSession(); });
    }).catch(() => { clearStoredSupabaseSession(); });
  }, []);

  // Wire spaced-repetition Supabase sync for student sessions
  useEffect(() => {
    if (!auth || auth.role !== 'student' || !auth.studentId) return;
    const { studentId } = auth;
    enableSync((sid, list) => upsertReviewSchedule(sid, list));
    loadReviewSchedule(studentId).then(rows => {
      if (!rows.length) return;
      try {
        localStorage.setItem(`vv:reviewSchedule:${studentId}`, JSON.stringify(rows));
      } catch { /* storage unavailable */ }
    }).catch(() => { /* silent — localStorage is the fallback */ });
  }, [auth]);

  // Seed students from hardcoded list on first run, then load live roster
  useEffect(() => {
    getStudentsData().then(data => {
      seedStudentsIfEmpty(data).then(() => getStudents().then(setStudents));
    });
  }, []);

  // Pending submissions badge (teacher shell). Declared here — above the
  // role-based early returns — so the hook order stays stable across the
  // logged-out → logged-in transition (otherwise React throws "Rendered more
  // hooks than during the previous render" and blanks the app on sign in).
  useEffect(() => {
    getAllSubmissions().then(list => {
      setPendingSubmissions((list || []).filter(s => s.status === 'submitted').length);
    }).catch(() => {});
  }, []);

  // Re-load students on updates
  useEffect(() => {
    const reload = () => getStudents().then(setStudents);
    window.addEventListener('vv:students-updated', reload);
    return () => window.removeEventListener('vv:students-updated', reload);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-cards', tweaks.cardStyle);
    document.documentElement.setAttribute('data-theme', tweaks.darkMode ? 'dark' : 'light');
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

  // Move focus to main content area on SPA navigation so screen readers
  // announce the new page without the user having to manually explore.
  useEffect(() => {
    const main = document.querySelector('.shell-main');
    if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
  }, [view]);

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

  // ── Pending submissions badge (must be before conditional returns for hooks rule) ──
  useEffect(() => {
    if (auth?.role !== 'teacher') return;
    getAllSubmissions().then(list => {
      setPendingSubmissions((list || []).filter(s => s.status === 'submitted').length);
    }).catch(() => {});
  }, [auth]);

  if (!auth) {
    return <LoginScreen onSignIn={handleSignIn} initialMode="choose" />;
  }

  if (auth.role === 'student') {
    const student = students.find(s => s.id === auth.studentId);
    if (!student) return <PageLoader />;
    return (
      <>
        <OfflineBar />
        <a href="#student-main" className="skip-nav">Skip to content</a>
        <ErrorBoundary label="Dashboard unavailable">
          <Suspense fallback={<PageLoader />}>
            <StudentDashboard student={student} onSignOut={handleSignOut} />
          </Suspense>
        </ErrorBoundary>
      </>
    );
  }

  // ── Teacher shell ──
  const teacherTabs = [
    { id: 'dashboard',    label: 'Today',        icon: <Icon.home size={16} /> },
    { id: 'students',     label: 'Students',     icon: <Icon.student size={16} /> },
    { id: 'calendar',     label: 'Calendar',     icon: <Icon.calendar size={16} /> },
    { id: 'diagnostics',  label: 'Diagnostics',  icon: <Icon.diagnose size={16} /> },
    { id: 'homework',     label: 'Homework',     icon: <Icon.homework size={16} /> },
    { id: 'submissions',  label: 'Submissions',  icon: <Icon.doc size={16} />,     badge: pendingSubmissions || 0 },
    { id: 'inbox',        label: 'Inbox',        icon: <Icon.inbox size={16} /> },
    { id: 'error-bank',   label: 'Error Bank',   icon: <Icon.warning size={16} /> },
    { id: 'reports',      label: 'Reports',      icon: <Icon.progress size={16} /> },
    { id: 'exercises',    label: 'Exercises',    icon: <Icon.book size={16} /> },
  ];

  const rightSlot = (
    <div className="shell-topbar-right">
      <button
        type="button"
        onClick={() => navigate('settings')}
        aria-label="Settings"
        title="Settings"
        aria-current={view === 'settings' ? 'page' : undefined}
        className={`shell-settings-btn${view === 'settings' ? ' active' : ''}`}
      >
        <Icon.settings size={15} />
      </button>
      <button type="button" onClick={handleSignOut} className="shell-settings-btn" aria-label="Sign out" title="Sign out">
        <Icon.close size={14} />
      </button>
    </div>
  );

  return (
    <>
      <OfflineBar />
      <a href="#teacher-main" className="skip-nav">Skip to content</a>
      <Shell tabs={teacherTabs} active={view} onTab={(id) => navigate(id)} rightSlot={rightSlot}>
        <ErrorBoundary label="Page unavailable">
          <Suspense fallback={<PageLoader />}>
            {renderTeacherPage(view, viewParams, { students, navigate, teacherName: auth.displayName?.split(' ')[0] || 'Vini' })}
          </Suspense>
        </ErrorBoundary>
      </Shell>
      <TweaksUI tweaks={tweaks} setTweak={setTweak} />
      <ToastHost />
    </>
  );
}

function renderTeacherPage(view, params, ctx) {
  const { students, navigate, teacherName } = ctx;

  switch (view) {
    case 'dashboard':
      return <TeacherDashboard students={students} onNavigate={navigate} teacherName={teacherName} />;

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
      return <ExercisesPage onNavigate={navigate} />;

    case 'perspective':
      return <PerspectiveDesigner students={students} onNavigate={navigate} />;

    default:
      return <TeacherDashboard students={students} onNavigate={navigate} teacherName={teacherName} />;
  }
}

/* ─── Helpers ────────────────────────────────────────────────── */
function getSafeOrigin() {
  try { if (document.referrer) return new URL(document.referrer).origin; } catch {}
  return window.location.origin;
}



function PageLoader() {
  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-text" style={{ width: '80%' }} />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text-short" />
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
    ok:   { bg: 'var(--accent-text)', fg: '#fff', g: '+' },
    info: { bg: 'var(--primary)',     fg: '#fff', g: 'i' },
    warn: { bg: 'var(--warning)',     fg: '#fff', g: '!' },
    go:   { bg: 'var(--accent)',      fg: '#fff', g: '→' },
  };
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}
    >
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
      <TweakSection label="Theme">
        <TweakToggle label="Dark mode" value={tweaks.darkMode} onChange={v => setTweak('darkMode', v)} />
      </TweakSection>
      <TweakSection label="Card style">
        <TweakRadio options={[{ label: 'Flat', value: 'flat' }, { label: 'Bordered', value: 'bordered' }, { label: 'Shadowed', value: 'shadowed' }]} value={tweaks.cardStyle} onChange={v => setTweak('cardStyle', v)} />
      </TweakSection>
      <TweakSection label="Accent color">
        <TweakColor value={tweaks.accent} onChange={v => setTweak('accent', v)} options={['#0f1b2d','#0f6b73','#148891','#c86607','#5bbcb8']} />
      </TweakSection>
    </TweaksPanel>
  );
}

function OfflineBar() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOn  = () => setOnline(true);
    const goOff = () => setOnline(false);
    window.addEventListener('online',  goOn);
    window.addEventListener('offline', goOff);
    return () => {
      window.removeEventListener('online',  goOn);
      window.removeEventListener('offline', goOff);
    };
  }, []);
  if (online) return null;
  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'var(--warning)', color: '#fff',
      padding: '9px 16px', textAlign: 'center',
      fontSize: 'var(--text-sm)', fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <span aria-hidden="true">⚠</span>
      No internet connection — changes may not save until you're back online
    </div>
  );
}

