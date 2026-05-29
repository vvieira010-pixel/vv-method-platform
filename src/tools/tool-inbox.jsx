/**
 * tool-inbox.jsx — Teacher inbox/outbox with reply and proactive send
 */
import { useMemo, useState, useEffect } from 'react';
import { Card, SectionHeader, Avatar, Button, Icon, PillNav } from '../components/shared.jsx';
import { getInbox, sendMessage, markRead } from '../lib/workflow.js';

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 3600000) return `${Math.max(1, Math.round(diff/60000))}m ago`;
  if (diff < 86400000) return `${Math.round(diff/3600000)}h ago`;
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
}

export default function ToolInbox({ students = [] }) {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [newStudentId, setNewStudentId] = useState(students[0]?.id || '');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('inbox');

  const load = async () => {
    const all = await getInbox({ role: 'teacher' });
    const normalized = (all || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setMessages(normalized);

    normalized
      .filter((m) => m.fromRole === 'student' && !m.read)
      .forEach((m) => markRead(m.id));

    const unread = normalized.filter((m) => m.fromRole === 'student' && !m.read).length;
    localStorage.setItem('inboxUnread', String(unread));
    window.dispatchEvent(new CustomEvent('vv:inbox-unread-changed'));
  };

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener('vv:messages-changed', h);
    return () => window.removeEventListener('vv:messages-changed', h);
  }, []);

  useEffect(() => {
    if (!newStudentId && students[0]?.id) setNewStudentId(students[0].id);
  }, [students, newStudentId]);

  const studentName = (msg) => {
    if (msg.fromRole === 'teacher') {
      const s = students.find((x) => x.id === msg.toStudentId);
      return s?.name || 'Student';
    }
    return msg.fromName || students.find((x) => x.id === msg.fromStudentId)?.name || 'Student';
  };

  const inboxMessages = useMemo(() => messages.filter((m) => m.fromRole === 'student'), [messages]);
  const outboxMessages = useMemo(() => messages.filter((m) => m.fromRole === 'teacher'), [messages]);
  const visibleMessages = tab === 'outbox' ? outboxMessages : inboxMessages;

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    await sendMessage({
      fromRole: 'teacher',
      fromName: 'Teacher Vini',
      toStudentId: selected.fromStudentId || selected.toStudentId,
      body: reply.trim(),
    });
    setReply('');
    await load();
    setSending(false);
  };

  const handleNewMessage = async () => {
    if (!newStudentId || !newMessage.trim()) return;
    const target = students.find((s) => s.id === newStudentId);
    if (!target) return;
    setSending(true);
    await sendMessage({
      fromRole: 'teacher',
      fromName: 'Teacher Vini',
      toStudentId: target.id,
      body: newMessage.trim(),
    });
    setNewMessage('');
    await load();
    setSending(false);
    window.toast?.('Message sent.', 'ok');
  };

  return (
    <div className="page-shell">
      <div className="page-inner">
        <SectionHeader title="Messages" sub="Inbox and outbox with direct replies" />

        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, alignItems: 'end' }}>
            <label style={fieldLabel}>Send to student
              <select className="input" value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)} style={{ marginTop: 6 }}>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label style={fieldLabel}>Message
              <input className="input" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a new message..." style={{ marginTop: 6 }} />
            </label>
            <Button variant="accent" size="sm" icon={<Icon.send size={13} />} onClick={handleNewMessage} disabled={sending || !newMessage.trim()}>
              Send
            </Button>
          </div>
        </Card>

        <PillNav
          tabs={[
            { id: 'inbox', label: `Inbox (${inboxMessages.length})` },
            { id: 'outbox', label: `Outbox (${outboxMessages.length})` },
          ]}
          active={tab}
          onChange={setTab}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, minHeight: 400, marginTop: 14 }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {visibleMessages.length === 0 && (
              <div style={{ padding: 24, color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>No messages in this box.</div>
            )}
            {visibleMessages.map((m) => (
              <button key={m.id}
                onClick={() => { setSelected(m); setReply(''); }}
                style={{
                  display: 'block', width: '100%', padding: '12px 14px', textAlign: 'left',
                  background: selected?.id === m.id ? 'var(--accent-subtle)' : (m.fromRole === 'student' && !m.read ? 'var(--info-bg)' : 'var(--surface)'),
                  borderBottom: '1px solid var(--divider)', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', borderLeft: selected?.id === m.id ? '3px solid var(--accent)' : '3px solid transparent',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{studentName(m)}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtTime(m.createdAt)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.fromRole === 'teacher' && <span style={{ color: 'var(--muted)' }}>You: </span>}{m.body}
                </div>
              </button>
            ))}
          </div>

          <div>
            {selected ? (
              <Card>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                  <Avatar name={studentName(selected)} size={36} tone="auto" />
                  <div>
                    <div style={{ fontWeight: 700 }}>{studentName(selected)}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtTime(selected.createdAt)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65, padding: '14px 0', borderTop: '1px solid var(--divider)', borderBottom: '1px solid var(--divider)', marginBottom: 14 }}>
                  {selected.body}
                </div>
                <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>REPLY</div>
                <textarea className="input" rows={3} value={reply} placeholder="Type your reply..."
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(); }}
                  style={{ marginBottom: 10 }} />
                <Button variant="accent" onClick={handleReply} disabled={sending || !reply.trim()} icon={<Icon.send size={13} />}>
                  {sending ? 'Sending...' : 'Send Reply'}
                </Button>
              </Card>
            ) : (
              <div style={{ padding: '48px 24px', color: 'var(--muted)', textAlign: 'center', fontSize: 14 }}>
                Select a message to read and reply.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const fieldLabel = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
