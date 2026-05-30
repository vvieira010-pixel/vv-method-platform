import { useState } from 'react';
import { Icon, Card, SectionHeader, Button } from '../components/shared.jsx';
import { clearWorkflowData } from '../lib/workflow.js';

export default function SettingsPage({ onNavigate }) {
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('vv:groq_api_key') || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('vv:gemini_api_key') || '');
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('vv:anthropic_api_key') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('vv:openai_api_key') || '');
  const [saved, setSaved] = useState('');

  function saveKeys() {
    if (groqKey.trim()) localStorage.setItem('vv:groq_api_key', groqKey.trim());
    else localStorage.removeItem('vv:groq_api_key');
    if (geminiKey.trim()) localStorage.setItem('vv:gemini_api_key', geminiKey.trim());
    else localStorage.removeItem('vv:gemini_api_key');
    if (anthropicKey.trim()) localStorage.setItem('vv:anthropic_api_key', anthropicKey.trim());
    else localStorage.removeItem('vv:anthropic_api_key');
    if (openaiKey.trim()) localStorage.setItem('vv:openai_api_key', openaiKey.trim());
    else localStorage.removeItem('vv:openai_api_key');
    setSaved('Keys saved!');
    setTimeout(() => setSaved(''), 2000);
    window.toast?.('API keys saved.', 'ok');
  }

  async function handleClearAll() {
    if (!confirm('Clear ALL platform data? This cannot be undone. Students, diagnoses, homework, and all records will be deleted.')) return;
    await clearWorkflowData();
    localStorage.removeItem('vv:studentsCrud');
    localStorage.removeItem('vv:targetProfiles');
    localStorage.removeItem('vv:classEvents');
    localStorage.removeItem('vv:classEvidence');
    localStorage.removeItem('vv:vocabularyBank');
    localStorage.removeItem('vv:progressNotes');
    window.toast?.('All data cleared.', 'info');
    window.location.reload();
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
      <h1 style={S.headline}>Settings</h1>

      {/* API Keys */}
      <Card style={{ padding: 20, marginTop: 20 }}>
        <SectionHeader title="AI Provider Keys" icon={<Icon.spark size={15} />} />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '8px 0 16px', lineHeight: 1.6 }}>
          Keys are stored in your browser only. Priority: Groq (free, fast) → Gemini (free, high quality) → Anthropic → OpenAI.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Groq API Key (recommended — free)">
            <input className="input" type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="gsk_…" />
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 3 }}>Get a free Groq key →</a>
          </Field>
          <Field label="Gemini API Key (free, high quality)">
            <input className="input" type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIza…" />
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 3 }}>Get a free Gemini key →</a>
          </Field>
          <Field label="Anthropic API Key (fallback)">
            <input className="input" type="password" value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-…" />
          </Field>
          <Field label="OpenAI API Key (fallback)">
            <input className="input" type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="sk-…" />
          </Field>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="primary" onClick={saveKeys}>Save Keys</Button>
            {saved && <span style={{ color: 'var(--success)', fontSize: 'var(--text-sm)' }}>{saved}</span>}
          </div>
        </div>
      </Card>

      {/* Platform info */}
      <Card style={{ padding: 20, marginTop: 14 }}>
        <SectionHeader title="Platform" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
          <p>V.V. Method — MET Preparation Platform</p>
          <p>Diagnosis-first teaching workflow</p>
          <p>All data stored locally in your browser (localStorage).</p>
        </div>
      </Card>

      {/* Danger zone */}
      <Card style={{ padding: 20, marginTop: 14, border: '1.5px solid var(--danger-soft)' }}>
        <SectionHeader title="Danger Zone" icon={<Icon.warning size={15} />} />
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '8px 0 14px' }}>
          Permanently delete all platform data including students, diagnoses, homework, submissions, and error bank.
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
