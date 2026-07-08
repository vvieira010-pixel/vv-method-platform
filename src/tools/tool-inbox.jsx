/**
 * tool-inbox.jsx — Teacher inbox workspace
 */
import { useMemo, useState, useEffect } from 'react';
import clsx from 'clsx';
import { SectionHeader, Avatar, Icon } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { getInbox, sendMessage, markRead } from '../lib/workflow.js';

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 3600000) return `${Math.max(1, Math.round(diff / 60000))}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function ToolInbox({ students = [], onNavigate, workspaceQuery = '' }) {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [newStudentId, setNewStudentId] = useState(students[0]?.id || '');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('inbox');
  const [localSearch, setLocalSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const all = await getInbox({ role: 'teacher' });
    const normalized = (all || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setMessages(normalized);

    normalized
      .filter((m) => m.fromRole === 'student' && !m.read)
      .forEach((m) => markRead(m.id));

    const unread = normalized.filter((m) => m.fromRole === 'student' && !m.read).length;
    localStorage.setItem('inboxUnread', String(unread));
    window.dispatchEvent(new CustomEvent('vv:inbox-unread-changed'));
    setLoading(false);
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

  const query = (localSearch || workspaceQuery || '').trim().toLowerCase();
  const sourceMessages = tab === 'outbox' ? outboxMessages : inboxMessages;
  const visibleMessages = sourceMessages.filter((m) => {
    if (!query) return true;
    const sName = studentName(m).toLowerCase();
    const body = String(m.body || '').toLowerCase();
    return sName.includes(query) || body.includes(query);
  });

  const unreadCount = inboxMessages.filter((m) => !m.read).length;

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
    window.toast?.('Reply sent.', 'ok');
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
    <div className="page-container">
      <section className="hero-section hero-section--inbox">
        <div>
          <div className="hero-tag">Communication Repository</div>
          <h1 className="page-headline" style={{ color: '#fff' }}>Inbox Workspace</h1>
          <p className="page-sub" style={{ color: 'rgba(255,255,255,.78)', maxWidth: 620 }}>Keep student communication clear, fast, and connected to each learner's study cycle.</p>
        </div>
      </section>

      <div className="kpi-grid kpi-grid--wide">
        <RepoKpi label="Inbox" value={inboxMessages.length} icon={<Icon.inbox size={15} />} tone="info" />
        <RepoKpi label="Unread" value={unreadCount} icon={<Icon.warning size={15} />} tone={unreadCount > 0 ? 'danger' : 'info'} />
        <RepoKpi label="Outbox" value={outboxMessages.length} icon={<Icon.send size={15} />} tone="neutral" />
      </div>

      <Card className="card-p-3 mb-2">
        <SectionHeader title="Send New Message" />
        <div className="send-grid">
          <label className="field-stack">
            <span className="field-label">Student</span>
            <select className="input" value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)}>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="field-stack">
            <span className="field-label">Message</span>
            <input className="input" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a new message..." />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="primary" size="sm" onClick={handleNewMessage} disabled={sending || !newMessage.trim()}>
              <Icon.send size={13} /> Send
            </Button>
          </div>
        </div>
      </Card>

      <Card className="card-p-3 mb-2">
        <div className="filter-bar">
          <div className="flex gap-2">
             <button type="button" onClick={() => setTab('inbox')} className={clsx('tab-btn', tab === 'inbox' && 'tab-btn--active')}>
              Inbox ({inboxMessages.length})
            </button>
             <button type="button" onClick={() => setTab('outbox')} className={clsx('tab-btn', tab === 'outbox' && 'tab-btn--active')}>
              Outbox ({outboxMessages.length})
            </button>
          </div>
          <input className="input" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search messages..." style={{ maxWidth: 300 }} />
        </div>
      </Card>

      <div className="main-grid">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="empty-panel">Loading messages...</div>
          ) : visibleMessages.length === 0 ? (
            <div className="empty-panel">No messages found for this view.</div>
          ) : (
            <div>
              {visibleMessages.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setSelected(m); setReply(''); }}
                  className="message-item"
                  style={{
                    background: selected?.id === m.id ? 'var(--accent-subtle)' : (m.fromRole === 'student' && !m.read ? 'var(--info-bg)' : '#fff'),
                    outline: selected?.id === m.id ? '1.5px solid var(--accent-soft)' : 'none',
                    outlineOffset: '-1px',
                  }}
                >
                  <div className="message-top">
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{studentName(m)}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtTime(m.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.fromRole === 'teacher' && <span style={{ color: 'var(--muted)' }}>You: </span>}{m.body}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="card-p-4">
          {selected ? (
            <>
              <div className="flex gap-3 items-center mb-3">
                <Avatar name={studentName(selected)} size={36} tone="auto" />
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 700 }}>{studentName(selected)}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtTime(selected.createdAt)}</div>
                </div>
                {selected.fromStudentId && (
                  <Button variant="ghost" size="sm" onClick={() => onNavigate?.('students:profile', { studentId: selected.fromStudentId })} className="ml-auto">
                    Open Student
                  </Button>
                )}
              </div>

              <div className="message-body">{selected.body}</div>

              <div className="text-2xs text-muted text-uppercase letter-spacing-01 mb-2" style={{ fontWeight: 700, marginTop: 2 }}>
                Reply
              </div>
              <textarea
                className="input"
                rows={4}
                value={reply}
                placeholder="Type your reply..."
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(); }}
                style={{ marginBottom: 10 }}
              />
              <Button variant="primary" onClick={handleReply} disabled={sending || !reply.trim()}>
                <Icon.send size={13} /> {sending ? 'Sending...' : 'Send Reply'}
              </Button>
            </>
          ) : (
            <div className="empty-panel">Select a message to read and reply.</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function RepoKpi({ label, value, icon, tone }) {
  const bg = tone === 'danger'
    ? 'var(--danger-bg)'
    : tone === 'info'
      ? 'var(--accent-subtle)'
      : 'var(--surface)';

  return (
    <Card style={{ padding: 14, background: bg }}>
      <div className="flex gap-1 items-center">
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <span className="text-2xs text-muted text-uppercase letter-spacing-01">{label}</span>
      </div>
      <div className="td-kpi-value" style={{ marginTop: 8 }}>{value}</div>
    </Card>
  );
}

