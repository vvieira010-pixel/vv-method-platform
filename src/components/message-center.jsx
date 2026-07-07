/**
 * message-center.jsx — In-app messaging between teacher and students
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon, Avatar, Button } from './shared.jsx';
import { getInbox, sendMessage, markRead } from '../lib/workflow.js';

const CSS = `
  .mc-dock {
    position: fixed;
    right: max(18px, env(safe-area-inset-right));
    bottom: max(18px, env(safe-area-inset-bottom));
    z-index: 40;
  }
  .mc-dock-btn {
    width: 44px; height: 44px; border-radius: var(--radius-md);
    background: var(--accent); color: #fff;
    border: none; cursor: pointer; display: flex; align-items: center;
    justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    position: relative; transition: transform 0.18s;
  }
  .mc-dock-btn:hover { transform: scale(1.08); }
  .mc-badge {
    position: absolute; top: -3px; right: -3px;
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--warning); color: #fff;
    font-size: 10px; font-weight: 700; display: flex;
    align-items: center; justify-content: center; border: 2px solid #fff;
  }
  .mc-popup {
    position: absolute; bottom: 56px; right: 0; width: min(320px, calc(100vw - 28px));
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-lg); box-shadow: var(--shadow-modal);
    display: flex; flex-direction: column; overflow: hidden;
    max-height: min(420px, calc(100dvh - 110px));
  }
  .mc-popup-header {
    padding: 14px 16px; border-bottom: 1px solid var(--divider);
    font-size: 13px; font-weight: 700; color: var(--text);
    display: flex; align-items: center; justify-content: space-between;
  }
  .mc-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .mc-msg { display: flex; gap: 8px; align-items: flex-end; }
  .mc-msg.from-me { flex-direction: row-reverse; }
  .mc-bubble {
    max-width: 200px; padding: 8px 12px; border-radius: var(--radius-md);
    font-size: 13px; line-height: 1.45; word-break: break-word;
  }
  .mc-msg.from-me  .mc-bubble { background: var(--accent); color: #fff; border-radius: var(--radius-md) var(--radius-md) 2px var(--radius-md); }
  .mc-msg.from-them .mc-bubble { background: var(--bg-deep); color: var(--text); border-radius: var(--radius-md) var(--radius-md) var(--radius-md) 2px; }
  .mc-bubble-time { font-size: 10px; opacity: 0.6; margin-top: 3px; }
  .mc-compose {
    padding: 10px 12px; border-top: 1px solid var(--divider);
    display: flex; gap: 8px; align-items: flex-end;
  }
  .mc-compose-input {
    flex: 1; padding: 8px 11px; border: 1px solid var(--border);
    border-radius: var(--radius-sm); font-family: var(--font-sans); font-size: 13px;
    color: var(--text); resize: none; outline: none;
    transition: border-color 0.15s;
  }
  .mc-compose-input:focus { border-color: var(--primary); }
  .mc-compose-send {
    width: 40px; height: 40px; border-radius: var(--radius-sm);
    background: var(--accent); color: #fff; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s; flex-shrink: 0;
  }
  .mc-compose-send:hover { background: var(--primary); }
  .mc-empty { padding: 24px; text-align: center; color: var(--muted); font-size: 13px; }

  /* Student inbox tab */
  .si-root { padding: 24px; max-width: 600px; margin: 0 auto; }
  .si-thread { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 10px; padding: 14px 16px; cursor: pointer; transition: border-color 0.12s; }
  .si-thread:hover { border-color: var(--primary); }
  .si-thread-meta { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .si-thread-from { font-size: 13px; font-weight: 700; color: var(--text); }
  .si-thread-time { font-size: 11px; color: var(--muted); }
  .si-thread-preview { font-size: 13px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .si-unread .si-thread-from::after { content: ''; display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--primary); margin-left: 6px; vertical-align: middle; }
  @media (max-width: 640px) {
    .mc-dock {
      right: max(12px, env(safe-area-inset-right));
      bottom: calc(70px + env(safe-area-inset-bottom));
    }
    .mc-dock-btn {
      width: 40px;
      height: 40px;
    }
    .mc-popup {
      right: 0;
      width: calc(100vw - 24px);
      max-height: min(390px, calc(100dvh - 160px));
    }
    .si-root {
      padding: 16px;
    }
  }
`;

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  const s = document.createElement('style'); s.textContent = CSS;
  document.head.appendChild(s); injected = true;
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.round(diff / 60000))}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

/* Teacher unread badge */
export function TeacherUnreadBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const refresh = () => {
      const v = Number(localStorage.getItem('inboxUnread') || 0);
      setCount(Number.isFinite(v) && v > 0 ? v : 0);
    };
    refresh();
    window.addEventListener('vv:inbox-unread-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('vv:inbox-unread-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  if (!count) return null;
  return (
    <span style={{
      background: 'var(--warning)', color: '#fff',
      borderRadius: '999px', padding: '1px 7px',
      fontSize: 11, fontWeight: 700,
    }}>{count}</span>
  );
}

/* Student message dock (bottom right floating) */
export function MessageTeacherDock({ student, onSent }) {
  inject();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const endRef = useRef(null);

  const load = useCallback(async () => {
    const all = await getInbox({ role: 'student', studentId: student?.id });
    setMessages(all || []);
    const u = (all || []).filter(m => m.fromRole === 'teacher' && !m.read).length;
    setUnread(u);
  }, [student?.id]);

  useEffect(() => {
    inject();
    load();
    const h = () => load();
    window.addEventListener('vv:messages-changed', h);
    return () => window.removeEventListener('vv:messages-changed', h);
  }, [student?.id, load]);

  useEffect(() => {
    if (open && endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
    if (open) {
      messages.filter(m => m.fromRole === 'teacher' && !m.read)
        .forEach(m => markRead(m.id));
      setUnread(0);
    }
  }, [open, messages, markRead]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage({
      fromStudentId: student?.id,
      fromName: student?.firstName,
      fromRole: 'student',
      toRole: 'teacher',
      body: text.trim(),
    });
    setText('');
    onSent?.();
    await load();
  };

  return (
    <div className="mc-dock">
      {open && (
        <div className="mc-popup" role="dialog" aria-modal="true" aria-label="Message Teacher" onKeyDown={e => e.key === 'Escape' && setOpen(false)}>
          <div className="mc-popup-header">
            <span id="mc-popup-title">Message Teacher</span>
            <button onClick={() => setOpen(false)} aria-label="Close messages" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18 }}>×</button>
          </div>
          <div className="mc-messages">
            {messages.length === 0 && <div className="mc-empty">No messages yet. Send a question!</div>}
            {messages.map(m => (
              <div key={m.id} className={`mc-msg ${m.fromRole === 'student' ? 'from-me' : 'from-them'}`}>
                {m.fromRole === 'teacher' && <Avatar name="Vini V" size={24} tone="ink" />}
                <div>
                  <div className="mc-bubble">{m.body}</div>
                  <div className="mc-bubble-time">{fmtTime(m.createdAt)}</div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="mc-compose">
            <textarea
              className="mc-compose-input" rows={2}
              placeholder="Type a question…"
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button className="mc-compose-send" onClick={handleSend} aria-label="Send message">
              <Icon.send size={14} />
            </button>
          </div>
        </div>
      )}
      <button className="mc-dock-btn" onClick={() => setOpen(o => !o)} aria-label={open ? 'Close messages' : 'Message teacher'} aria-expanded={open}>
        <Icon.inbox size={18} />
        {unread > 0 && <span className="mc-badge">{unread}</span>}
      </button>
    </div>
  );
}

/* Student inbox tab view */
export function StudentInbox({ student }) {
  inject();
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    const refresh = async () => {
      const all = await getInbox({ role: 'student', studentId: student?.id });
      setMessages(all || []);
    };
    refresh();
    window.addEventListener('vv:messages-changed', refresh);
    return () => window.removeEventListener('vv:messages-changed', refresh);
  }, [student?.id]);

  const openMessage = async (message) => {
    setSelected(message);
    if (!message.read && message.fromRole === 'teacher') {
      await markRead(message.id);
      const all = await getInbox({ role: 'student', studentId: student?.id });
      setMessages(all || []);
    }
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    await sendMessage({
      fromStudentId: student?.id,
      fromName: student?.firstName,
      fromRole: 'student',
      toRole: 'teacher',
      body: reply.trim(),
    });
    setReply('');
    const all = await getInbox({ role: 'student', studentId: student?.id });
    setMessages(all || []);
  };

  return (
    <div className="si-root">
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Inbox</div>
      {messages.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>No messages yet.</div>
      )}
      {messages.map(m => (
        <div key={m.id} className={`si-thread ${!m.read && m.fromRole === 'teacher' ? 'si-unread' : ''}`}
          onClick={() => openMessage(m)}>
          <div className="si-thread-meta">
            <span className="si-thread-from">{m.fromRole === 'teacher' ? 'Teacher Vini' : 'You'}</span>
            <span className="si-thread-time">{fmtTime(m.createdAt)}</span>
          </div>
          <div className="si-thread-preview">{m.body}</div>
        </div>
      ))}
      {selected && (
        <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>{selected.fromRole === 'teacher' ? 'Teacher Vini' : 'You'}</div>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16, color: 'var(--text-2)' }}>{selected.body}</p>
          <textarea
            className="mc-compose-input" rows={3} placeholder="Reply…"
            value={reply} onChange={e => setReply(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
          <Button variant="accent" size="sm" onClick={handleReply}>Send Reply</Button>
        </div>
      )}
    </div>
  );
}
