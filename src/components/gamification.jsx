/**
 * gamification.jsx — XP, levels, streaks, and achievement badges
 */
import { Pill } from './shared.jsx';

export const LEVELS = [
  { num: 1, name: 'Foundation',    minXp: 0    },
  { num: 2, name: 'Developing',    minXp: 500  },
  { num: 3, name: 'Progressing',   minXp: 1200 },
  { num: 4, name: 'Consolidating', minXp: 2200 },
  { num: 5, name: 'Advanced',      minXp: 3800 },
  { num: 6, name: 'MET Champion',  minXp: 6000 },
];

const BADGE_DEFS = [
  { id: 'first_session',  glyph: '🎯', label: 'First Step',     desc: 'Completed your first session',        threshold: (s) => s.length >= 1 },
  { id: 'streak_3',       glyph: '🔥', label: 'On Fire',        desc: '3-week study streak',                  threshold: (s) => calcStreak(s) >= 3 },
  { id: 'streak_5',       glyph: '⚡', label: 'Lightning',      desc: '5-week consistency streak',           threshold: (s) => calcStreak(s) >= 5 },
  { id: 'hw_5',           glyph: '📚', label: 'Homework Hero',  desc: '5 homework sets submitted',           threshold: (s) => s.filter(x => x.homework).length >= 5 },
  { id: 'sessions_10',    glyph: '🏆', label: 'Ten Sessions',   desc: 'Completed 10 sessions',               threshold: (s) => s.length >= 10 },
  { id: 'speaking_up',    glyph: '🎤', label: 'Voice Up',       desc: 'Speaking score improved 5+ points',  threshold: (s) => scoreGain(s, 'speaking') >= 5 },
  { id: 'grammar_up',     glyph: '✏️', label: 'Grammar Sharp',  desc: 'Grammar score improved 4+ points',   threshold: (s) => scoreGain(s, 'grammar') >= 4 },
  { id: 'xp_1000',        glyph: '💎', label: 'Diamond',        desc: 'Earned 1000 XP',                     threshold: (s) => calcXP(s) >= 1000 },
];

function calcStreak(sessions) {
  if (!sessions.length) return 0;
  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  let prev = new Date(sorted[0]?.date || Date.now());
  for (const s of sorted) {
    const d = new Date(s.date);
    const diff = Math.abs((prev - d) / (7 * 24 * 60 * 60 * 1000));
    if (diff <= 1.5) { streak++; prev = d; } else break;
  }
  return streak;
}

function scoreGain(sessions, skill) {
  if (sessions.length < 2) return 0;
  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0]?.scores?.[skill] || 0;
  const last  = sorted[sorted.length - 1]?.scores?.[skill] || 0;
  return last - first;
}

function calcXP(sessions) {
  return sessions.reduce((sum, s) => {
    let xp = 50; // base per session
    if (s.homework) xp += 30;
    if (s.feedback) xp += 20;
    return sum + xp;
  }, 0);
}

export function computeGamification(sessions = [], track = 'MET') {
  const xp = calcXP(sessions);
  const streak = calcStreak(sessions);

  const levelIdx = [...LEVELS].reverse().findIndex(l => xp >= l.minXp);
  const level = LEVELS[LEVELS.length - 1 - levelIdx] || LEVELS[0];
  const nextLevel = level.num < LEVELS.length ? LEVELS[level.num] : null;

  const xpInLevel = xp - level.minXp;
  const xpToNext  = nextLevel ? nextLevel.minXp - level.minXp : 1;
  const xpProgress = nextLevel ? Math.min(100, Math.round((xpInLevel / xpToNext) * 100)) : 100;

  const badges = BADGE_DEFS.map(b => ({
    id: b.id, glyph: b.glyph, label: b.label, desc: b.desc,
    earned: b.threshold(sessions),
  }));
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const isMET = String(track || '').toUpperCase().includes('MET');
  const bestScore = sessions.reduce((best, session) => {
    const score = Number(session?.scores?.met_speaking || 0);
    return score > best ? score : best;
  }, 0);
  const homeworkCount = sessions.filter((session) => session?.homework).length;

  return {
    xp,
    streak,
    level,
    nextLevel,
    xpProgress,
    xpToNext: nextLevel ? nextLevel.minXp - xp : 0,
    badges,
    earnedCount,
    isMET,
    bestScore,
    homeworkCount,
    // Compatibility aliases used by existing student dashboard code.
    lvl: level,
    nextLvl: nextLevel,
  };
}

/* ─── ACHIEVEMENTS CARD ──────────────────────────────────────── */
export function AchievementsCard({ gam }) {
  const { badges = [], xp, streak, level, nextLevel, xpProgress } = gam || {};
  const earned = badges.filter(b => b.earned);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
      {/* Level bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            Level {level?.num} · {level?.name}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{xp} XP</span>
        </div>
        <div style={{ height: 8, background: 'var(--bg-deep)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: 'var(--accent)',
            width: `${xpProgress}%`, borderRadius: 999, transition: 'width 0.6s',
          }} />
        </div>
        {nextLevel && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            {gam.xpToNext} XP to {nextLevel.name}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{streak}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Week streak 🔥</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{earned.length}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Badges earned</div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Achievements
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {badges.map(b => (
          <div key={b.id} title={b.desc} style={{
            padding: '5px 10px', borderRadius: 8,
            background: b.earned ? 'var(--accent-soft)' : 'var(--divider)',
            color: b.earned ? 'var(--accent)' : 'var(--muted)',
            fontSize: 12, fontWeight: 600, opacity: b.earned ? 1 : 0.5,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span>{b.glyph}</span>
            <span>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
