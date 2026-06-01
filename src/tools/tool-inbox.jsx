/**
 * tool-inbox.jsx — Teacher inbox workspace
 */
import { useMemo, useState, useEffect } from 'react';
import { Card, SectionHeader, Avatar, Button, Icon } from '../components/shared.jsx';
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
    <div style={S.shell}>
      <section style={S.hero}>
        <div>
          <div style={S.heroTag}>Communication Repository</div>
          <h1 style={S.headline}>Inbox Workspace</h1>
          <p style={S.sub}>Keep student communication clear, fast, and connected to each learner's study cycle.</p>
        </div>
      </section>

      <div style={S.kpiGrid}>
        <RepoKpi label="Inbox" value={inboxMessages.length} icon={<Icon.inbox size={15} />} tone="info" />
        <RepoKpi label="Unread" value={unreadCount} icon={<Icon.warning size={15} />} tone={unreadCount > 0 ? 'danger' : 'info'} />
        <RepoKpi label="Outbox" value={outboxMessages.length} icon={<Icon.send size={15} />} tone="neutral" />
      </div>

      <Card style={{ marginBottom: 14, padding: 14 }}>
        <SectionHeader title="Send New Message" />
        <div style={S.sendGrid}>
          <label style={S.field}>
            <span style={S.fieldLabel}>Student</span>
            <select className="input" value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)}>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label style={S.field}>
            <span style={S.fieldLabel}>Message</span>
            <input className="input" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a new message..." />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="primary" size="sm" onClick={handleNewMessage} disabled={sending || !newMessage.trim()}>
              <Icon.send size={13} /> Send
            </Button>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 14, marginBottom: 12 }}>
        <div style={S.filterBar}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setTab('inbox')} style={{ ...S.tabBtn, ...(tab === 'inbox' ? S.tabBtnActive : null) }}>
              Inbox ({inboxMessages.length})
            </button>
            <button type="button" onClick={() => setTab('outbox')} style={{ ...S.tabBtn, ...(tab === 'outbox' ? S.tabBtnActive : null) }}>
              Outbox ({outboxMessages.length})
            </button>
          </div>
          <input className="input" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search messages..." style={{ maxWidth: 300 }} />
        </div>
      </Card>

      <div style={S.mainGrid}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={S.emptyPanel}>Loading messages...</div>
          ) : visibleMessages.length === 0 ? (
            <div style={S.emptyPanel}>No messages found for this view.</div>
          ) : (
            <div>
              {visibleMessages.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setSelected(m); setReply(''); }}
                  style={{
                    ...S.messageItem,
                    background: selected?.id === m.id ? 'var(--accent-subtle)' : (m.fromRole === 'student' && !m.read ? 'var(--info-bg)' : '#fff'),
                    borderLeft: selected?.id === m.id ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                >
                  <div style={S.messageTop}>
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

        <Card style={{ padding: 16 }}>
          {selected ? (
            <>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <Avatar name={studentName(selected)} size={36} tone="auto" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{studentName(selected)}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtTime(selected.createdAt)}</div>
                </div>
                {selected.fromStudentId && (
                  <Button variant="ghost" size="sm" onClick={() => onNavigate?.('students:profile', { studentId: selected.fromStudentId })} style={{ marginLeft: 'auto' }}>
                    Open Student
                  </Button>
                )}
              </div>

              <div style={S.messageBody}>{selected.body}</div>

              <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
            <div style={S.emptyPanel}>Select a message to read and reply.</div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent-deep)' }}>{value}</div>
    </Card>
  );
}

const S = {
  shell: { maxWidth: 1120, margin: '0 auto', padding: '28px 20px' },
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 18,
    padding: 18,
    borderRadius: 16,
    background: 'linear-gradient(130deg, #102131 0%, #1f3750 45%, #2f6379 100%)',
    color: '#fff',
  },
  heroTag: { fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9fd6d6', fontWeight: 700, marginBottom: 6 },
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#fff', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,.78)', margin: '4px 0 0', maxWidth: 620 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 },
  sendGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, alignItems: 'end' },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  filterBar: { display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  tabBtn: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--border)',
    background: '#fff',
    color: 'var(--muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabBtnActive: { border: '1px solid var(--accent)', background: 'var(--accent-subtle)', color: 'var(--accent-deep)' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 },
  messageItem: {
    display: 'block',
    width: '100%',
    padding: '12px 14px',
    textAlign: 'left',
    borderBottom: '1px solid var(--divider)',
    borderTop: 'none',
    borderRight: 'none',
    borderLeft: '3px solid transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
  },
  messageTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8 },
  messageBody: {
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.65,
    padding: '12px 0',
    borderTop: '1px solid var(--divider)',
    borderBottom: '1px solid var(--divider)',
    marginBottom: 12,
    whiteSpace: 'pre-wrap',
  },
  emptyPanel: { padding: 28, color: 'var(--muted)', fontSize: 13, textAlign: 'center' },
};
