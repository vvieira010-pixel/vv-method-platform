import { useRef, useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Button } from '../components/shared.jsx';
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

/** Password-style input with an eye toggle to reveal/hide the value. */
function SecretInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%', paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide key' : 'Show key'}
        title={show ? 'Hide' : 'Show'}
        style={{
          position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 6,
          display: 'grid', placeItems: 'center',
          color: show ? 'var(--primary)' : 'var(--muted)',
        }}
      >
        <Icon.eye size={16} />
      </button>
    </div>
  );
}

export default function SettingsPage({ onNavigate }) {
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('vv:groq_api_key') || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('vv:gemini_api_key') || '');
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('vv:anthropic_api_key') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('vv:openai_api_key') || '');
  const [openrouterKey, setOpenrouterKey] = useState(() => localStorage.getItem('vv:openrouter_api_key') || '');
  const [elevenlabsKey, setElevenlabsKey] = useState(() => localStorage.getItem('vv:elevenlabs_api_key') || '');
  const [deepgramKey, setDeepgramKey] = useState(() => localStorage.getItem('vv:deepgram_api_key') || '');
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
      setSyncResult(total ? `Synced ${total} new record(s). ${detail}` : 'Already up to date — nothing new to sync.');
      window.toast?.('Cloud sync complete.', 'ok');
    } catch (e) {
      setSyncResult(`Sync failed: ${e.message}`);
      window.toast?.('Cloud sync failed.', 'warn');
    }
    setSyncing(false);
  }

  function saveKeys() {
    if (groqKey.trim()) localStorage.setItem('vv:groq_api_key', groqKey.trim());
    else localStorage.removeItem('vv:groq_api_key');
    if (geminiKey.trim()) localStorage.setItem('vv:gemini_api_key', geminiKey.trim());
    else localStorage.removeItem('vv:gemini_api_key');
    if (anthropicKey.trim()) localStorage.setItem('vv:anthropic_api_key', anthropicKey.trim());
    else localStorage.removeItem('vv:anthropic_api_key');
    if (openaiKey.trim()) localStorage.setItem('vv:openai_api_key', openaiKey.trim());
    else localStorage.removeItem('vv:openai_api_key');
    if (openrouterKey.trim()) localStorage.setItem('vv:openrouter_api_key', openrouterKey.trim());
    else localStorage.removeItem('vv:openrouter_api_key');
    if (elevenlabsKey.trim()) localStorage.setItem('vv:elevenlabs_api_key', elevenlabsKey.trim());
    else localStorage.removeItem('vv:elevenlabs_api_key');
    if (deepgramKey.trim()) localStorage.setItem('vv:deepgram_api_key', deepgramKey.trim());
    else localStorage.removeItem('vv:deepgram_api_key');
    if (piperUrl.trim()) localStorage.setItem('vv:piper_server_url', piperUrl.trim());
    else localStorage.removeItem('vv:piper_server_url');
    setSaved('Keys saved!');
    setTimeout(() => setSaved(''), 2000);
    window.toast?.('API keys saved.', 'ok');
  }

  function saveExamDate() {
    if (examDate) localStorage.setItem('vv:met_exam_date', examDate);
    else localStorage.removeItem('vv:met_exam_date');
    window.toast?.('Exam date saved — students will see the countdown on their dashboard.', 'ok');
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
    window.toast?.('Class link saved — use "Send invite" on a class in the Calendar.', 'ok');
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
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
      <h1 style={S.headline}>Settings</h1>

      {/* API Keys */}
      <Card style={{ padding: 20, marginTop: 20 }}>
        <SectionHeader title="AI Provider Keys" icon={<Icon.spark size={15} />} />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '8px 0 16px', lineHeight: 1.6 }}>
          Keys are stored in your browser only. Priority: Gemini (free) → OpenRouter (free models, auto-cascade) → Groq (free, fast) → Anthropic → OpenAI.
          Any one key is enough. <strong>Tip:</strong> paste several keys in a field (comma-separated) and the app rotates to the next one when a key hits its limit. Keys are not included in platform backups.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Groq API Key (recommended — free)">
            <SecretInput value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="gsk_…" />
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 3 }}>Get a free Groq key →</a>
          </Field>
          <Field label="Gemini API Key (free — cascades through Gemini + Gemma)">
            <SecretInput value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIza… (add more, comma-separated, to rotate)" />
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 3 }}>Get a free Gemini key →</a>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
              One key tries: Gemini 2.5 Pro → 2.5 Flash → 2.5 Flash-Lite → 2.0 Flash → 2.0 Flash-Lite → Gemma 4 → Gemma 3, until one answers. Add several keys (comma-separated) to rotate when one is rate-limited.
            </span>
          </Field>
          <Field label="OpenRouter API Key (free models — auto-cascade)">
            <SecretInput value={openrouterKey} onChange={e => setOpenrouterKey(e.target.value)} placeholder="sk-or-…" />
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 3 }}>Get a free OpenRouter key →</a>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
              Tries free models best-first (DeepSeek R1 → Qwen3 235B → DeepSeek V3 → Llama 3.3 70B → Nemotron 70B → Nemotron Super 49B → Qwen 2.5 72B → Llama 4 Scout → Mistral Small → Gemma 3 27B → …) until one answers.
            </span>
          </Field>
          <Field label="Anthropic API Key (fallback)">
            <SecretInput value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-…" />
          </Field>
          <Field label="OpenAI API Key (fallback)">
            <SecretInput value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="sk-…" />
          </Field>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <Button variant="primary" onClick={saveKeys}>Save Keys</Button>
            {saved && <span style={{ color: 'var(--success)', fontSize: 'var(--text-sm)' }}>{saved}</span>}
          </div>
        </div>
      </Card>

      {/* TTS Keys */}
      <Card style={{ padding: 20, marginTop: 14 }}>
        <SectionHeader title="TTS — Listening Exercise Audio" icon={<Icon.mic size={15} />} />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '8px 0 4px', lineHeight: 1.6 }}>
          Audio for listening exercises is generated in this order:
        </p>
        <ol style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '4px 0 16px', paddingLeft: 18, lineHeight: 1.8 }}>
          <li><strong>ElevenLabs</strong> — highest quality (priority)</li>
          <li><strong>Deepgram</strong> — fast fallback voice for listening practice</li>
          <li><strong>OpenAI TTS</strong> — good quality, uses your OpenAI key from the AI section above</li>
          <li><strong>Gemini TTS</strong> — free, uses your Gemini key from the AI section above</li>
          <li><strong>Piper</strong> — offline/local, if server URL is set below</li>
          <li><strong>Browser speech</strong> — always available, no key needed</li>
        </ol>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="ElevenLabs API Key (priority)">
            <SecretInput value={elevenlabsKey} onChange={e => setElevenlabsKey(e.target.value)} placeholder="sk_…" />
            <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 3 }}>Get your ElevenLabs key →</a>
          </Field>
          <Field label="Deepgram API Key (fallback)">
            <SecretInput value={deepgramKey} onChange={e => setDeepgramKey(e.target.value)} placeholder="dg_… or Deepgram key" />
            <a href="https://console.deepgram.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 3 }}>Get your Deepgram key →</a>
          </Field>
          <div style={{
            padding: '10px 14px', borderRadius: 0, fontSize: 'var(--text-xs)',
            background: 'var(--accent-subtle)', color: 'var(--muted)', lineHeight: 1.6,
            border: '1px solid var(--accent-soft)',
          }}>
            <strong>Voice note</strong> — use one woman voice and one man voice for listening variety. The default server setup uses an ElevenLabs woman voice first, Deepgram's Aura fallback, then OpenAI <em>nova</em>. You can change voices with <code>ELEVENLABS_VOICE_ID</code>, <code>DEEPGRAM_TTS_MODEL</code>, or <code>OPENAI_TTS_VOICE</code> in the server environment.
          </div>
          <div style={{
            padding: '10px 14px', borderRadius: 0, fontSize: 'var(--text-xs)',
            background: 'var(--accent-subtle)', color: 'var(--muted)', lineHeight: 1.6,
            border: '1px solid var(--accent-soft)',
          }}>
            <strong>OpenAI TTS</strong> — uses your OpenAI key from the AI section above. No extra key needed.
            Voices: <em>alloy</em> (neutral), <em>nova</em> (female), <em>onyx</em> (male). Active automatically if ElevenLabs and Deepgram are not set or fail.
          </div>
          <Field label="Piper server URL (optional — local/offline)">
            <input
              className="input"
              type="url"
              value={piperUrl}
              onChange={e => setPiperUrl(e.target.value)}
              placeholder="http://localhost:5050"
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
              Run <code>python scripts/piper-server.py --model path/to/voice.onnx</code> on your machine.
              Free, fully offline, no API key needed. Use one woman voice and one man voice for listening variety; Piper voices require both the <code>.onnx</code> file and matching <code>.onnx.json</code>. From your voices list, good starting points are <code>en_US-lessac-medium</code> or <code>en_US-amy-medium</code> for a US woman voice, <code>en_US-ryan-medium</code> or <code>en_US-hfc_male-medium</code> for a US man voice, <code>en_GB-southern_english_female-low</code> for a UK woman voice, and <code>en_GB-northern_english_male-medium</code> for a UK man voice.
              Listen to samples at <a href="https://rhasspy.github.io/piper-samples" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Piper samples</a> and download models from <a href="https://huggingface.co/rhasspy/piper-voices/tree/main" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Piper voices</a>. Used only when ElevenLabs, Deepgram, OpenAI, and Gemini are not configured.
            </span>
          </Field>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="primary" onClick={saveKeys}>Save TTS Keys</Button>
            {saved && <span style={{ color: 'var(--success)', fontSize: 'var(--text-sm)' }}>{saved}</span>}
          </div>
        </div>
      </Card>

      {/* Student dashboard memo */}
      <Card style={{ padding: 20, marginTop: 14 }}>
        <SectionHeader title="Student Dashboard Memo" icon={<Icon.inbox size={15} />} />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '8px 0 12px', lineHeight: 1.6 }}>
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
      <Card style={{ padding: 20, marginTop: 14 }}>
        <SectionHeader title="Class & Exam Date" icon={<Icon.calendar size={15} />} />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '8px 0 14px', lineHeight: 1.6 }}>
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
              placeholder="e.g. Vinicius — MET Coach"
            />
          </Field>
          <div style={{
            padding: '10px 14px', fontSize: 'var(--text-xs)',
            background: 'var(--accent-subtle)', color: 'var(--muted)', lineHeight: 1.6,
            border: '1px solid var(--accent-soft)',
          }}>
            <strong>Emailing setup</strong> — sending invites also needs a transactional email
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
        <Card style={{ padding: 20, marginTop: 14 }}>
          <SectionHeader title="Account Password" icon={<Icon.lock size={15} />} />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '8px 0 16px', lineHeight: 1.6 }}>
            Set a password so you can sign in with your email and password next time — no login link needed.
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
        <Card style={{ padding: 20, marginTop: 14 }}>
          <SectionHeader title="Cloud Sync" icon={<Icon.upload size={15} />} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '8px 0 14px' }}>
            Push the data stored in this browser (students, diagnoses, homework, submissions, reviews…)
            up to Supabase so it's available across devices and so students can sign in and reach their homework.
            Run this once after signing in; it's safe to run again — already-synced records are skipped.
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
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-1)' }}>{task.label}</div>
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
                      backgroundColor: enabled ? 'var(--accent-1)' : 'var(--border)',
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
      <Card style={{ padding: 20, marginTop: 14 }}>
        <SectionHeader title="Platform" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
          <p>MET Proficiency Mastery — Michigan English Test Preparation for Nurses</p>
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
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {children}
    </label>
  );
}

const S = {
  headline: { fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 },
};

