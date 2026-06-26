import { useState, useRef, useCallback } from 'react';
import { Icon, SectionHeader } from './shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { exercisePreview } from '../lib/exercise-types.js';

/* ── TopicContentRenderer — renders a topic explanation for the student ── */
function parseTopicContent(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const blocks = [];
  let currentList = null;

  function flushList() {
    if (currentList) { blocks.push(currentList); currentList = null; }
  }

  lines.forEach(line => {
    const trimmed = line.trim();

    // Bold-wrapped inline text rendered as <strong>
    const withBold = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Bullet list
    if (/^[-•*]\s/.test(trimmed)) {
      const text = withBold.replace(/^[-•*]\s/, '');
      if (currentList?.type !== 'ul') { flushList(); currentList = { type: 'ul', items: [] }; }
      currentList.items.push(text);
      return;
    }

    // Numbered list
    if (/^\d+[.)]\s/.test(trimmed)) {
      const text = withBold.replace(/^\d+[.)]\s/, '');
      if (currentList?.type !== 'ol') { flushList(); currentList = { type: 'ol', items: [] }; }
      currentList.items.push(text);
      return;
    }

    flushList();
    if (trimmed) {
      blocks.push({ type: 'p', text: withBold });
    } else {
      blocks.push({ type: 'br' });
    }
  });

  flushList();
  return blocks;
}

export function TopicContentRenderer({ content }) {
  const blocks = parseTopicContent(content);
  return (
    <div style={{ lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>
      {blocks.map((b, i) => {
        if (b.type === 'br') return <br key={i} />;
        if (b.type === 'p') return <p key={i} dangerouslySetInnerHTML={{ __html: b.text }} style={{ margin: '0 0 6px' }} />;
        if (b.type === 'ul') return (
          <ul key={i} style={{ margin: '4px 0', paddingLeft: 20 }}>
            {b.items.map((item, j) => <li key={j} dangerouslySetInnerHTML={{ __html: item }} style={{ marginBottom: 2 }} />)}
          </ul>
        );
        if (b.type === 'ol') return (
          <ol key={i} style={{ margin: '4px 0', paddingLeft: 20 }}>
            {b.items.map((item, j) => <li key={j} dangerouslySetInnerHTML={{ __html: item }} style={{ marginBottom: 2 }} />)}
          </ol>
        );
        return null;
      })}
    </div>
  );
}

/* ── TopicExplanationsEditor — teacher-facing editor for Step 1 ── */
function uid() { return 'tp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6); }

export function TopicExplanationsEditor({ topics = [], onChange, onAiGenerate }) {
  const [expanded, setExpanded] = useState(null);

  const addTopic = () => {
    const topic = { id: uid(), title: '', content: '', aiPrompt: '' };
    onChange([...topics, topic]);
    setExpanded(topic.id);
  };

  const updateTopic = (id, patch) => {
    onChange(topics.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const removeTopic = (id) => {
    onChange(topics.filter(t => t.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const moveTopic = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= topics.length) return;
    const next = [...topics];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  const wrapBold = (id) => {
    const topic = topics.find(t => t.id === id);
    if (!topic) return;
    // Wrap ** around selected text in the textarea
    const el = document.getElementById(`topic-content-${id}`);
    if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    if (start === end) { updateTopic(id, { content: topic.content.slice(0, start) + '****' + topic.content.slice(start) }); }
    else {
      const before = topic.content.slice(0, start);
      const selected = topic.content.slice(start, end);
      const after = topic.content.slice(end);
      updateTopic(id, { content: before + '**' + selected + '**' + after });
    }
    setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = start + 2; }, 10);
  };

  const insertAtCursor = (id, prefix) => {
    const topic = topics.find(t => t.id === id);
    if (!topic) return;
    const el = document.getElementById(`topic-content-${id}`);
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = topic.content.lastIndexOf('\n', start - 1) + 1;
    const before = topic.content.slice(0, lineStart);
    const after = topic.content.slice(lineStart);
    updateTopic(id, { content: before + prefix + ' ' + after });
    setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = lineStart + prefix.length + 1; }, 10);
  };

  return (
    <div style={{ marginTop: 18, padding: 14, background: 'var(--surface)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Topic Explanations
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 2 }}>
            {topics.length} topic{topics.length !== 1 ? 's' : ''} — students see these before the exercises
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={addTopic}><Icon.plus size={12} /> Add Topic</Button>
      </div>

      {topics.length === 0 && (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
          No topic explanations yet. Add a topic so students get context before the exercises.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {topics.map((t, i) => (
          <div key={t.id} style={{
            border: `1px solid ${expanded === t.id ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', overflow: 'hidden',
            transition: 'border-color .12s',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: 'var(--bg)', cursor: 'pointer',
            }} onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
              <Icon.chevronDown size={13} style={{ transform: expanded === t.id ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .12s', flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 600, fontSize: 'var(--text-sm)', color: t.title ? 'var(--text)' : 'var(--muted)' }}>
                {t.title || 'Untitled topic'}
              </span>
              <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                {i > 0 && <button onClick={() => moveTopic(i, -1)} style={btnMuted} title="Move up"><Icon.chevronUp size={12} /></button>}
                {i < topics.length - 1 && <button onClick={() => moveTopic(i, 1)} style={btnMuted} title="Move down"><Icon.chevronDown size={12} /></button>}
              </div>
            </div>

            {expanded === t.id && (
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input className="input" value={t.title}
                  onChange={e => updateTopic(t.id, { title: e.target.value })}
                  placeholder="Topic title (e.g. Past Simple vs Present Perfect)" />

                <textarea id={`topic-content-${t.id}`}
                  value={t.content}
                  onChange={e => updateTopic(t.id, { content: e.target.value })}
                  placeholder="Write your explanation here. Use **bold** for emphasis, - for bullet lists, 1. for numbered lists."
                  rows={6}
                  className="input"
                  style={{ resize: 'vertical', fontFamily: 'var(--font-ui)', lineHeight: 1.6 }} />

                <details style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                  <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
                    {t.aiPrompt ? '✏️ Custom AI prompt set' : 'AI prompt (optional)'}
                  </summary>
                  <textarea
                    value={t.aiPrompt || ''}
                    onChange={e => updateTopic(t.id, { aiPrompt: e.target.value })}
                    placeholder={'Write a short, clear English explanation for the topic "' + (t.title || '...') + '" for a MET student at B1 level. Use **bold** for key terms, - for bullet points where helpful. Keep it to 2-4 short paragraphs.'}
                    rows={4}
                    className="input"
                    style={{ marginTop: 8, resize: 'vertical', fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}
                  />
                </details>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button onClick={() => wrapBold(t.id)} style={btnTool} title="Bold"><strong>B</strong></button>
                  <button onClick={() => insertAtCursor(t.id, '-')} style={btnTool} title="Bullet list">•</button>
                  <button onClick={() => insertAtCursor(t.id, '1.')} style={btnTool} title="Numbered list">1.</button>
                  <span style={{ flex: 1 }} />
                  <Button variant="ghost" size="sm" onClick={() => onAiGenerate?.(t)} disabled={!t.title}>
                    <Icon.spark size={12} /> AI Generate
                  </Button>
                  <button onClick={() => removeTopic(t.id)} style={{ ...btnTool, color: 'var(--danger)' }} title="Remove topic">×</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const btnMuted = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--muted)', padding: '2px 4px', borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-ui)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};
const btnTool = {
  ...btnMuted,
  width: 28, height: 28,
  border: '1px solid var(--border)',
  fontSize: 'var(--text-sm)',
};
