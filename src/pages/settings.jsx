import { useRef, useState, useEffect } from 'react';
import { Icon, SectionHeader } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { clearWorkflowData, syncLocalToCloud } from '../lib/workflow.js';
import { getDbContext, getTeacherSetting, setTeacherSetting } from '../lib/supabase-db.js';
import { getSupabaseConfig, readStoredSupabaseSession, updateUserPassword } from '../lib/supabase-storage.js';
import { getAllTaskTypes } from '../education-skills/index.js';

const SENSITIVE_LOCAL_KEYS = new Set([
  'vv:groq_api_key',
  'vv:gemini_api_key',
  'vv:anthropic_api_key',
  'vv:openai_api_key',
  'vv:openrouter_api_key',
  'vv:elevenlabs_api_key',
  'vv:deepgram_api_key',
]);



export default function SettingsPage({ onNavigate }) {
  const [piperUrl, setPiperUrl] = useState(() => localStorage.getItem('vv:piper_server_url') || '');
  const [generalMemo, setGeneralMemo] = useState(() => localStorage.getItem('vv:student_general_memo') || '');
  const [examDate, setExamDate] = useState(() => localStorage.getItem('vv:met_exam_date') || '');
  const [zoomUrl, setZoomUrl] = useState(() => localStorage.getItem('vv:zoom_meeting_url') || '');
  const [teacherName, setTeacherName] = useState(() => localStorage.getItem('vv:teacher_name') || '');
  const [saved, setSaved] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null); // { ok, text }
  const [skillToggles, setSkillToggles] = useState({});
  const [skillTogglesLoaded, setSkillTogglesLoaded] = useState(false);
  const importInputRef = useRef(null);

  const supabaseConfigured = getSupabaseConfig().isConfigured;
  const activeSession = readStoredSupabaseSession();

  useEffect(() => {
    (async () => {
      let toggles = null;
      const stored = await getTeacherSetting('skills_enabled');
      if (stored) {
        try { toggles = JSON.parse(stored); } catch { /* ignore */ }
      }
      if (!toggles) {
        try {
          const ls = localStorage.getItem('vv:skills_enabled');
          if (ls) toggles = JSON.parse(ls);
        } catch { /* ignore */ }
      }
      if (toggles) setSkillToggles(toggles);
      setSkillTogglesLoaded(true);
    })();
  }, []);

  async function handleSaveSkillToggles() {
    const toggles = { ...skillToggles };
    const success = await setTeacherSetting('skills_enabled', JSON.stringify(toggles));
    try { localStorage.setItem('vv:skills_enabled', JSON.stringify(toggles)); } catch { /* ignore */ }
    if (!success) { window.toast?.('Saved locally only (Supabase unavailable).', 'warn'); return; }
    window.toast?.('Skill preferences saved.', 'ok');
  }

  function handleToggleSkill(taskId, enabled) {
    setSkillToggles(prev => {
      if (enabled) {
        const next = { ...prev };
        delete next[taskId];
        return next;
      }
      return { ...prev, [taskId]: false };
    });
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) { setPasswordMsg({ ok: false, text: 'Password must be at least 6 characters.' }); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      await updateUserPassword(newPassword, activeSession.access_token);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ ok: true, text: 'Password set! You can now sign in with your email and this password.' });
      window.toast?.('Password updated.', 'ok');
    } catch (err) {
      setPasswordMsg({ ok: false, text: err.message });
    }
    setPasswordSaving(false);
  }

  async function handleSyncToCloud() {
    if (!getDbContext()) {
      window.toast?.('Sign in with your Supabase magic link first, then sync.', 'warn');
      return;
    }
    setSyncing(true);
    setSyncResult('');
    try {
      const counts = await syncLocalToCloud();
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const detail = Object.entries(counts).filter(([, n]) => n > 0).map(([k, n]) => `${k}: ${n}`).join(' · ');
      setSyncResult(total ? `Synced ${total} new record(s). ${detail}` : 'Already up to date, nothing new to sync.');
      window.toast?.('Cloud sync complete.', 'ok');
    } catch (e) {
      setSyncResult(`Sync failed: ${e.message}`);
      window.toast?.('Cloud sync failed.', 'warn');
    }
    setSyncing(false);
  }

  function savePiperUrl() {
    if (piperUrl.trim()) localStorage.setItem('vv:piper_server_url', piperUrl.trim());
    else localStorage.removeItem('vv:piper_server_url');
    setSaved('Saved!');
    setTimeout(() => setSaved(''), 2000);
    window.toast?.('Piper server URL saved.', 'ok');
  }

  function saveExamDate() {
    if (examDate) localStorage.setItem('vv:met_exam_date', examDate);
    else localStorage.removeItem('vv:met_exam_date');
    window.toast?.('Exam date saved. Students will see the countdown on their dashboard.', 'ok');
  }

  function saveClassLink() {
    const url = zoomUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      window.toast?.('Enter a full link starting with https://', 'warn');
      return;
    }
    if (url) localStorage.setItem('vv:zoom_meeting_url', url);
    else localStorage.removeItem('vv:zoom_meeting_url');
    const name = teacherName.trim();
    if (name) localStorage.setItem('vv:teacher_name', name);
    else localStorage.removeItem('vv:teacher_name');
    window.toast?.('Class link saved. Use "Send invite" on a class in the Calendar.', 'ok');
  }

  async function saveGeneralMemo() {
    const text = generalMemo.trim();
    if (text) localStorage.setItem('vv:student_general_memo', text);
    else localStorage.removeItem('vv:student_general_memo');
    await setTeacherSetting('general_memo', text || null);
    window.dispatchEvent(new CustomEvent('vv:student-memo-changed'));
    window.toast?.('General memo saved.', 'ok');
  }

  async function handleClearAll() {
    if (!confirm('Clear ALL platform data? This cannot be undone. Export a backup first if you may need to restore students, diagnoses, homework, or class records.')) return;
    await clearWorkflowData();
    localStorage.removeItem('vv:studentsCrud');
    localStorage.removeItem('vv:targetProfiles');
    localStorage.removeItem('vv:classEvents');
    localStorage.removeItem('vv:classEvidence');
    localStorage.removeItem('vv:vocabularyBank');
    localStorage.removeItem('vv:progressNotes');
    localStorage.removeItem('vv:student_general_memo');
    await setTeacherSetting('general_memo', null);
    window.toast?.('All data cleared.', 'info');
    window.location.reload();
  }

  function collectPlatformData() {
    const values = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('vv:') && !SENSITIVE_LOCAL_KEYS.has(key)) {
        values[key] = localStorage.getItem(key);
      }
    }
    return {
      app: 'vv-method-platform',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      excludedKeys: Array.from(SENSITIVE_LOCAL_KEYS),
      values,
    };
  }

  function handleExportData() {
    const data = collectPlatformData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `vv-method-platform-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    window.toast?.('Backup exported.', 'ok');
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  async function handleImportData(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const backup = JSON.parse(await file.text());
      if (backup?.app !== 'vv-method-platform' || typeof backup.values !== 'object' || backup.values === null) {
        throw new Error('This is not a valid VV Method Platform backup.');
      }
      if (!confirm('Restore this backup? Current platform data in this browser will be replaced.')) return;

      Object.keys(localStorage)
        .filter(key => key.startsWith('vv:'))
        .filter(key => !SENSITIVE_LOCAL_KEYS.has(key))
        .forEach(key => localStorage.removeItem(key));

      Object.entries(backup.values).forEach(([key, value]) => {
        if (key.startsWith('vv:') && typeof value === 'string') localStorage.setItem(key, value);
      });

      window.toast?.('Backup restored.', 'ok');
      window.location.reload();
    } catch (e) {
      window.toast?.(`Import failed: ${e.message}`, 'warn');
    }
  }

  return (
    <div className="page-shell-narrow">
      <SectionHeader title="Settings" />

      {/* TTS, Listening Exercise Audio */}
      <Card style={{ marginTop: 'var(--space-4)' }}>
        <SectionHeader title="TTS, Listening Exercise Audio" icon={<Icon.mic size={15} />} />
        <p className="card-row-meta" style={{ margin: 'var(--space-2) 0 var(--space-1)', lineHeight: 1.6 }}>
          Audio for listening exercises is generated server-side. API keys are configured in the server environment.
          The server tries providers in this order:
        </p>
        <ol style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '4px 0 16px', paddingLeft: 18, lineHeight: 1.8 }}>
          <li><strong>Camb.ai</strong> (default)</li>
          <li><strong>ElevenLabs</strong></li>
          <li><strong>OpenAI TTS</strong></li>
          <li><strong>Deepgram</strong></li>
        </ol>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Field label="Piper server URL (optional, local/offline)">
            <input
              className="input"
              type="url"
              value={piperUrl}
              onChange={e => setPiperUrl(e.target.value)}
              placeholder="http://localhost:5050"
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
              Run <code>python scripts/piper-server.py --model path/to/voice.onnx</code> on your machine.
              Free, fully offline, no API key needed. From your voices list, good starting points are <code>en_US-lessac-medium</code> or <code>en_US-amy-medium</code> for a US woman voice, <code>en_US-ryan-medium</code> or <code>en_US-hfc_male-medium</code> for a US man voice.
              Listen to samples at <a href="https://rhasspy.github.io/piper-samples" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Piper samples</a> and download models from <a href="https://huggingface.co/rhasspy/piper-voices/tree/main" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Piper voices</a>.
            </span>
          </Field>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <Button variant="primary" onClick={savePiperUrl}>Save Piper URL</Button>
            {saved && <span style={{ color: 'var(--success)', fontSize: 'var(--text-sm)' }}>{saved}</span>}
          </div>
        </div>
      </Card>

      {/* Student dashboard memo */}
      <Card style={{ marginTop: 'var(--space-4)' }}>
        <SectionHeader title="Student Dashboard Memo" icon={<Icon.inbox size={15} />} />
        <p className="card-row-meta" style={{ margin: 'var(--space-2) 0 var(--space-3)', lineHeight: 1.6 }}>
          This general memo appears for every student on the Memo Board.
        </p>
        <Field label="General memo for all students">
          <textarea
            className="input"
            rows={4}
            value={generalMemo}
            onChange={e => setGeneralMemo(e.target.value)}
            placeholder="Type the message every student should see..."
          />
        </Field>
        <div style={{ marginTop: 12 }}>
          <Button variant="primary" onClick={saveGeneralMemo}>Save General Memo</Button>
        </div>
      </Card>

      {/* Class & Exam Settings */}
      <Card style={{ marginTop: 'var(--space-4)' }}>
        <SectionHeader title="Class & Exam Date" icon={<Icon.calendar size={15} />} />
        <p className="card-row-meta" style={{ margin: 'var(--space-2) 0 var(--space-4)', lineHeight: 1.6 }}>
          Set the MET exam date for your students. It appears as a live countdown on their Home dashboard.
          Leave blank to hide the countdown.
        </p>
        <Field label="MET exam date">
          <input
            className="input"
            type="date"
            value={examDate}
            onChange={e => setExamDate(e.target.value)}
            style={{ maxWidth: 220 }}
          />
        </Field>
        {examDate && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 6 }}>
            {(() => {
              const d = Math.ceil((new Date(examDate) - new Date().setHours(0,0,0,0)) / 86400000);
              return d > 0 ? `${d} day${d !== 1 ? 's' : ''} from today` : d === 0 ? 'Today!' : 'This date has passed.';
            })()}
          </p>
        )}
        <div style={{ marginTop: 12 }}>
          <Button variant="primary" onClick={saveExamDate}>Save exam date</Button>
        </div>
      </Card>

      {/* Class video link (Zoom) for calendar invites */}
      <Card style={{ padding: 20, marginTop: 14 }}>
        <SectionHeader title="Class Video Link (Zoom)" icon={<Icon.calendar size={15} />} />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '8px 0 14px', lineHeight: 1.6 }}>
          Paste your Zoom Personal Meeting Room link. Every calendar invite you send from a class
          will include this link and an <code>.ics</code> calendar attachment for the student.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Zoom meeting link">
            <input
              className="input"
              type="url"
              value={zoomUrl}
              onChange={e => setZoomUrl(e.target.value)}
              placeholder="https://us05web.zoom.us/j/0000000000?pwd=…"
            />
            <a href="https://zoom.us/profile" target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 3 }}>Find your Personal Meeting Room link →</a>
          </Field>
          <Field label="Your name (shown as the organizer)">
            <input
              className="input"
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              placeholder="e.g. Vinicius, MET Coach"
            />
          </Field>
          <div style={{
            padding: '10px 14px', fontSize: 'var(--text-xs)',
            background: 'var(--accent-subtle)', color: 'var(--muted)', lineHeight: 1.6,
            border: '1px solid var(--accent-soft)',
          }}>
            <strong>Emailing setup</strong>: sending invites also needs a transactional email
            provider configured on the server: set <code>RESEND_API_KEY</code> and
            <code> INVITE_FROM_EMAIL</code> (a verified sender) in your Vercel environment.
            Until then, the link is saved but invites can't be emailed.
          </div>
          <div>
            <Button variant="primary" onClick={saveClassLink}>Save class link</Button>
          </div>
        </div>
      </Card>

      {/* Set / change password */}
      {activeSession && (
        <Card style={{ marginTop: 'var(--space-4)' }}>
          <SectionHeader title="Account Password" icon={<Icon.lock size={15} />} />
          <p className="card-row-meta" style={{ margin: 'var(--space-2) 0 var(--space-4)', lineHeight: 1.6 }}>
            Set a password so you can sign in with your email and password next time. No login link needed.
          </p>
          <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="New password (min. 6 characters)">
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="Choose a password…"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={passwordSaving}
              />
            </Field>
            <Field label="Confirm password">
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat the password…"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={passwordSaving}
              />
            </Field>
            {passwordMsg && (
              <p style={{ fontSize: 'var(--text-sm)', color: passwordMsg.ok ? 'var(--success)' : 'var(--danger)', margin: 0 }}>
                {passwordMsg.text}
              </p>
            )}
            <div>
              <Button type="submit" variant="primary" disabled={passwordSaving || !newPassword || !confirmPassword}>
                {passwordSaving ? 'Saving…' : 'Set password'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Cloud sync */}
      {supabaseConfigured && (
        <Card style={{ marginTop: 'var(--space-4)' }}>
          <SectionHeader title="Cloud Sync" icon={<Icon.upload size={15} />} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '8px 0 14px' }}>
            Push the data stored in this browser (students, diagnoses, homework, submissions, reviews…)
            up to Supabase so it's available across devices and so students can sign in and reach their homework.
            Run this once after signing in; it's safe to run again. Already-synced records are skipped.
          </p>
          <Button variant="primary" onClick={handleSyncToCloud} disabled={syncing}>
            <Icon.upload size={14} /> {syncing ? 'Syncing…' : 'Sync local data to cloud'}
          </Button>
          {syncResult && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginTop: 12 }}>{syncResult}</p>
          )}
        </Card>
      )}
      {supabaseConfigured && skillTogglesLoaded && (
        <Card style={{ padding: 20, marginTop: 14 }}>
          <SectionHeader title="AI Skill Augmentations" icon={<Icon.settings size={15} />} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '8px 0 14px' }}>
            Enable pedagogical skill prompts that augment AI behaviour. Each task type uses specific skills
            to improve diagnosis quality, feedback structure, exercise scaffolding, and student guidance.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {getAllTaskTypes().map(task => {
              const enabled = skillToggles[task.id] !== false;
              return (
                <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text)' }}>{task.label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>{task.description}</div>
                  </div>
                  <label style={{ flexShrink: 0, cursor: 'pointer', position: 'relative', width: 40, height: 22 }} aria-label={`Toggle ${task.label}`}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleToggleSkill(task.id, enabled)}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', inset: 0, borderRadius: 11,
                      backgroundColor: enabled ? 'var(--accent)' : 'var(--border)',
                      transition: 'background-color 0.2s',
                    }}>
                      <span style={{
                        position: 'absolute', top: 2, left: enabled ? 20 : 2,
                        width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      }} />
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16 }}>
            <Button variant="primary" onClick={handleSaveSkillToggles}>Save Skill Preferences</Button>
          </div>
        </Card>
      )}

      {/* Platform info */}
      <Card style={{ marginTop: 'var(--space-4)' }}>
        <SectionHeader title="Platform" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
          <p>MET Proficiency Mastery: Michigan English Test Preparation for Nurses</p>
          <p>Diagnosis-first teaching workflow</p>
          <p>All data stored locally in your browser (localStorage).</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <Button variant="primary" onClick={handleExportData}><Icon.download size={14} /> Export Backup</Button>
          <Button variant="ghost" onClick={handleImportClick}><Icon.upload size={14} /> Import Backup</Button>
          <input ref={importInputRef} type="file" accept="application/json,.json" onChange={handleImportData} style={{ display: 'none' }} />
        </div>
      </Card>

      {/* Danger zone */}
      <Card style={{ padding: 20, marginTop: 14, border: '1.5px solid var(--danger-soft)' }}>
        <SectionHeader title="Danger Zone" icon={<Icon.warning size={15} />} />
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '8px 0 14px' }}>
          Permanently delete all platform data including students, diagnoses, homework, submissions, and error bank. Export a backup before clearing.
        </p>
        <Button variant="danger" onClick={handleClearAll}>Clear All Platform Data</Button>
      </Card>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

