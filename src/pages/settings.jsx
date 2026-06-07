import { useRef, useState } from 'react';
import { Icon, Card, SectionHeader, Button } from '../components/shared.jsx';
import { clearWorkflowData, syncLocalToCloud } from '../lib/workflow.js';
import { getDbContext } from '../lib/supabase-db.js';
import { getSupabaseConfig } from '../lib/supabase-storage.js';

const SENSITIVE_LOCAL_KEYS = new Set([
  'vv:groq_api_key',
  'vv:gemini_api_key',
  'vv:anthropic_api_key',
  'vv:openai_api_key',
  'vv:openrouter_api_key',
  'vv:elevenlabs_api_key',
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
  const [piperUrl, setPiperUrl] = useState(() => localStorage.getItem('vv:piper_server_url') || '');
  const [generalMemo, setGeneralMemo] = useState(() => localStorage.getItem('vv:student_general_memo') || '');
  const [saved, setSaved] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState('');
  const importInputRef = useRef(null);

  const supabaseConfigured = getSupabaseConfig().isConfigured;

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
    if (piperUrl.trim()) localStorage.setItem('vv:piper_server_url', piperUrl.trim());
    else localStorage.removeItem('vv:piper_server_url');
    setSaved('Keys saved!');
    setTimeout(() => setSaved(''), 2000);
    window.toast?.('API keys saved.', 'ok');
  }

  function saveGeneralMemo() {
    if (generalMemo.trim()) localStorage.setItem('vv:student_general_memo', generalMemo.trim());
    else localStorage.removeItem('vv:student_general_memo');
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
              One key tries: Gemini 2.5 Flash → 2.5 Flash-Lite → 2.0 Flash → 2.0 Flash-Lite → Gemma, until one answers. Add several keys (comma-separated) to rotate when one is rate-limited.
            </span>
          </Field>
          <Field label="OpenRouter API Key (free models — auto-cascade)">
            <SecretInput value={openrouterKey} onChange={e => setOpenrouterKey(e.target.value)} placeholder="sk-or-…" />
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 3 }}>Get a free OpenRouter key →</a>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
              Tries free models in order (DeepSeek V3 → Llama 3.3 70B → Nemotron 70B → Qwen3 235B → Nemotron Super 49B → Llama 4 Scout → DeepSeek R1 → Gemma 3 27B → Nemotron 12B → Mistral Small → Nemotron 8B → …) until one answers.
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
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 'var(--text-xs)',
            background: 'var(--accent-subtle)', color: 'var(--muted)', lineHeight: 1.6,
            border: '1px solid var(--accent-soft)',
          }}>
            <strong>OpenAI TTS</strong> — uses your OpenAI key from the AI section above. No extra key needed.
            Voices: <em>alloy</em> (neutral), <em>nova</em> (female), <em>onyx</em> (male). Active automatically if ElevenLabs is not set or fails.
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
              Free, fully offline, no API key needed. Used only when ElevenLabs and OpenAI are not configured.
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
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 },
};
