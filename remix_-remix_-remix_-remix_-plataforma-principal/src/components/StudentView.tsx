import { useState } from 'react';
import { Student, Homework } from '../types';
import { Avatar, fmtDate, hwTone, toast } from '../lib/utils';
import { SAMPLE_HW, SKILL_LABELS } from '../lib/data';
import { Home, BookOpen, BarChart, MessageSquare } from 'lucide-react';

export default function StudentView({ student, onLogout }: { student: Student; onLogout: () => void }) {
  const [tab, setTab] = useState<'st-home' | 'st-homework' | 'st-progress' | 'st-messages'>('st-home');
  const hwList = SAMPLE_HW.filter((x) => x.studentId === student.id);
  const pendingHw = hwList.filter((h) => h.status === 'not-started');

  const h = new Date().getHours();
  const tod = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';

  return (
    <div id="student-view" className="flex flex-col min-h-screen bg-[var(--bg)]">
      <header className="dash-topbar">
        <div className="dash-brand-name">MET Preparation</div>
        <div className="dash-right">
          <span className="dash-uname">{student.firstName}</span>
          <Avatar name={student.name} size={30} />
          <button className="signout-btn" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <div className="dash-body">
        {tab === 'st-home' && (
          <div className="dash-page">
            <h1 className="font-syne text-2xl font-extrabold text-[var(--text)] mb-1">
              Good {tod}, {student.firstName}.
            </h1>
            <p className="text-[13.5px] text-[var(--text-2)] mb-5">
              {student.band} → {student.bandTarget} · Session {student.session}/{student.totalSessions}
            </p>

            <div className="flex gap-[10px] flex-wrap mb-[18px]">
              <div className="s-stat border-border">
                <div className="s-stat-val">{student.session}/{student.totalSessions}</div>
                <div className="s-stat-lbl">Session</div>
              </div>
              <div className="s-stat border-border">
                <div className="s-stat-val">{hwList.filter((h) => h.status === 'not-started' || h.status === 'in-progress').length}</div>
                <div className="s-stat-lbl">Pending HW</div>
              </div>
              <div className="s-stat border-border">
                <div className="s-stat-val">{student.band}</div>
                <div className="s-stat-lbl">Level</div>
              </div>
            </div>

            <div className="p-4 rounded-[var(--r-md)] bg-[var(--success-bg)] border border-[var(--success-soft)] mb-4">
              <div className="font-bold text-[14px] text-[var(--success)] mb-[10px]">Latest Feedback from Teacher</div>
              <p className="text-[13px] leading-[1.7] mb-[6px]">
                <strong>What is improving:</strong> Your grammar accuracy has improved significantly, especially with
                present perfect and conditionals.
              </p>
              <p className="text-[13px] leading-[1.7] mb-[6px]">
                <strong>Focus on:</strong> Article usage (the/a/an) and reading comprehension speed under timed
                conditions.
              </p>
              <p className="text-[13px] leading-[1.7] italic text-[var(--text-2)] mt-[8px]">
                Keep up the great work! You are on track for MET B2. — Vini
              </p>
            </div>

            {pendingHw.length > 0 && (
              <div
                className="p-4 rounded-[var(--r-md)] bg-[var(--accent-subtle)] border border-[var(--accent-soft)] mb-4 cursor-pointer"
                onClick={() => setTab('st-homework')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[var(--accent-deep)]">
                      {pendingHw.length === 1 ? 'Homework assigned' : pendingHw.length + ' homework sets'}
                    </div>
                    <div className="text-[11.5px] text-[var(--muted)] mt-[2px]">{pendingHw[0]?.title}</div>
                  </div>
                  <span className="text-[var(--accent)]">→</span>
                </div>
              </div>
            )}

            <div className="s-glance">
              <div className="s-glance-card s-glance-wide text-[var(--text-2)]">
                <strong className="s-glance-label">Your Next Step</strong>
                <p className="s-glance-text">Complete your grammar homework and focus on article usage before next class.</p>
              </div>
              <div className="s-glance-card">
                <strong className="s-glance-label">Strength</strong>
                <p className="s-glance-text">Speaking fluency and reading comprehension.</p>
              </div>
              <div className="s-glance-card">
                <strong className="s-glance-label">To Improve</strong>
                <p className="s-glance-text">Grammar accuracy, especially articles and tense usage.</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'st-homework' && (
          <div className="dash-page">
            <h2 className="font-syne text-[20px] font-bold mb-4">My Homework</h2>
            {!hwList.length ? (
              <p className="text-[var(--muted)] py-4">No homework assigned yet. Your teacher will assign homework after your next class.</p>
            ) : (
              hwList.map((h) => <HWCard key={h.id} h={h} />)
            )}
          </div>
        )}

        {tab === 'st-progress' && (
          <div className="dash-page">
            <h2 className="font-syne text-[20px] font-bold mb-4">My Progress</h2>
            <div className="card mb-4 p-[18px]">
              <div className="font-bold text-[14px] mb-[14px]">Current Skill Levels</div>
              {SKILL_LABELS.map((lbl, i) => (
                <div key={lbl}>
                  <div className="s-skill-row">
                    <span>{lbl}</span>
                    <span className="font-bold text-[var(--accent-deep)]">{student.skills[i]}/80</span>
                  </div>
                  <div className="s-skill-bar">
                    <div
                      className="s-skill-fill transition-all duration-[600ms]"
                      style={{ width: (student.skills[i] / 80 * 100) + '%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="card p-[18px]">
              <div className="font-bold text-[14px] mb-[12px]">Your Path to MET B2</div>
              <div className="flex items-center gap-[12px] mb-[8px]">
                <div className="text-[13px] text-[var(--muted)] min-w-[80px]">Current</div>
                <div className="flex-1 h-[10px] bg-[var(--bg-deep)] rounded-full overflow-hidden">
                  <div
                    style={{ width: (student.session / student.totalSessions * 100) + '%' }}
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full"
                  />
                </div>
                <div className="text-[13px] font-bold text-[var(--accent-deep)]">
                  {student.session}/{student.totalSessions}
                </div>
              </div>
              <p className="text-[12.5px] text-[var(--muted)]">
                Session {student.session} of {student.totalSessions} · {student.totalSessions - student.session} sessions remaining
              </p>
            </div>
          </div>
        )}

        {tab === 'st-messages' && (
          <div className="dash-page">
            <h2 className="font-syne text-[20px] font-bold mb-4">Messages</h2>
            <div className="card p-[32px] text-center mb-[12px]">
              <p className="text-[var(--muted)] text-[13px]">No messages yet. Your teacher will send feedback here.</p>
            </div>
            <div className="mt-5">
              <textarea
                className="inp min-h-[80px] resize-y"
                placeholder="Message your teacher…"
              ></textarea>
              <button
                className="btn btn-primary btn-sm mt-[8px]"
                onClick={() => toast('Message sent!', 'ok')}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      <nav className="dash-bottom-nav">
        {[
          { id: 'st-home', label: 'Home', Icon: Home },
          { id: 'st-homework', label: 'Homework', Icon: BookOpen },
          { id: 'st-progress', label: 'Progress', Icon: BarChart },
          { id: 'st-messages', label: 'Messages', Icon: MessageSquare },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            className={"dash-nav-btn " + (tab === id ? 'active' : '')}
            onClick={() => setTab(id as any)}
          >
            <Icon size={18} />
            <span className="dash-nav-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function HWCard({ h }: { h: Homework, key?: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="s-hw-card">
      <div className="s-hw-hdr" onClick={() => setOpen(!open)}>
        <div>
          <div className="s-hw-title">{h.title}</div>
          <div className="s-hw-meta">
            {h.type}
            {h.dueDate ? ' · Due ' + fmtDate(h.dueDate) : ''}
          </div>
        </div>
        <span className={"pill " + hwTone(h.status)}>{h.status}</span>
      </div>
      {open && (
        <div className="s-hw-body block">
          <p className="text-[13px] leading-[1.7] text-[var(--text-2)] mb-[14px]">
            Complete this exercise focusing on your diagnosed grammar gaps. Use examples from your class notes.
          </p>
          <div className="border border-[var(--border)] rounded-[var(--r-sm)] p-[12px] bg-[var(--bg)] mb-[14px]">
            <div className="font-bold text-[12px] text-[var(--muted)] uppercase tracking-[.06em] mb-[8px]">
              Exercise 1 · Short Answer
            </div>
            <p className="text-[13px] text-[var(--text-2)] mb-[10px]">
              Write 5 sentences using articles (a, an, the) correctly. Focus on generic vs. specific reference.
            </p>
            <textarea
              className="w-full p-[10px] rounded-[var(--r-sm)] border border-[var(--border)] text-[13px] resize-y min-h-[80px] font-inherit"
              placeholder="Write your answer here…"
            ></textarea>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => toast('Homework submitted!', 'ok')}
          >
            Submit Homework
          </button>
        </div>
      )}
    </div>
  );
}
