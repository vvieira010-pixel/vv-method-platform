const STORAGE_LEVEL_PREFIX = 'vv:practicescaffold:level';
const STORAGE_LOG_PREFIX = 'vv:practicescaffold:log';

const SCAFFOLD_LEVELS = {
  4: { label: 'Full Support', desc: 'Full hint ladder available' },
  3: { label: 'Guided Practice', desc: 'Conceptual hints only, recall before each exercise' },
  2: { label: 'Monitored Independence', desc: 'No hints — self-diagnose when stuck' },
  1: { label: 'Near-Independent', desc: 'Practice without scaffolding' },
  0: { label: 'Independent', desc: 'Fully independent practice' },
};

function storageKey(mode, topicId) {
  const suffix = topicId || mode;
  return `${mode}:${suffix}`;
}

export function getScaffoldLevel(mode, topicId) {
  const key = storageKey(mode, topicId);
  try {
    const v = localStorage.getItem(`${STORAGE_LEVEL_PREFIX}:${key}`);
    if (v !== null) {
      const n = parseInt(v, 10);
      if (n >= 0 && n <= 4) return n;
    }
  } catch {}
  return 4;
}

export function setScaffoldLevel(mode, topicId, level) {
  const key = storageKey(mode, topicId);
  try { localStorage.setItem(`${STORAGE_LEVEL_PREFIX}:${key}`, String(level)); } catch {}
}

function getSessionLog(mode, topicId) {
  const key = storageKey(mode, topicId);
  try { return JSON.parse(localStorage.getItem(`${STORAGE_LOG_PREFIX}:${key}`) || '[]'); } catch { return []; }
}

export function logSession(mode, topicId, data) {
  const log = getSessionLog(mode, topicId);
  log.push({ ...data, timestamp: new Date().toISOString() });
  const key = storageKey(mode, topicId);
  try { localStorage.setItem(`${STORAGE_LOG_PREFIX}:${key}`, JSON.stringify(log)); } catch {}
  return log;
}

export function classifyRetrieval(maxHintLevel, hintUsed, score) {
  if (!hintUsed && score >= 90) return 'strong';
  if (maxHintLevel <= 1 && score >= 70) return 'strong';
  if (maxHintLevel <= 2 && score >= 60) return 'partial';
  if (score >= 50) return 'partial';
  return 'minimal';
}

export function evaluateFading(mode, topicId) {
  const log = getSessionLog(mode, topicId);
  const currentLevel = getScaffoldLevel(mode, topicId);

  if (log.length < 2) {
    return { verdict: 'hold', currentLevel, newLevel: currentLevel };
  }

  const recent = log.slice(-5);

  const needsRestore = recent.length >= 2 &&
    recent.slice(-2).every(s => s.quality === 'minimal' && s.score < 50);

  if (needsRestore && currentLevel < 4) {
    return { verdict: 'restore', currentLevel, newLevel: currentLevel + 1, reason: 'Performance dropped — restoring one level of support' };
  }

  let canReduce = false;
  let reason = '';

  switch (currentLevel) {
    case 4: {
      const last3 = recent.slice(-3);
      if (last3.length >= 3) {
        canReduce = last3.every(s => (s.quality === 'partial' || s.quality === 'strong') && s.maxHintLevel <= 2);
        reason = 'Three consecutive sessions with strong retrieval and minimal hint use';
      }
      break;
    }
    case 3: {
      const last3 = recent.slice(-3);
      if (last3.length >= 3) {
        canReduce = last3.every(s => s.quality === 'strong' && !s.hintUsed && s.score >= 70);
        reason = 'Three consecutive sessions with independent recall and strong scores';
      }
      break;
    }
    case 2: {
      const last2 = recent.slice(-2);
      if (last2.length >= 2) {
        canReduce = last2.every(s => !s.hintUsed && s.score >= 80);
        reason = 'Two consecutive unassisted sessions with strong scores';
      }
      break;
    }
    case 1: {
      const last2 = recent.slice(-2);
      if (last2.length >= 2) {
        canReduce = last2.every(s => !s.hintUsed && s.score >= 80);
        reason = 'Sustained independent performance — ready for full independence';
      }
      break;
    }
    case 0:
      break;
  }

  if (canReduce) {
    return { verdict: 'reduce', currentLevel, newLevel: currentLevel - 1, reason };
  }

  return { verdict: 'hold', currentLevel, newLevel: currentLevel };
}

export function hintLimit(level) {
  if (level >= 4) return 3;
  if (level === 3) return 2;
  if (level === 2) return 1;
  return 0;
}

export function recallGateActive(level) {
  return level >= 3;
}

export function getLevelInfo(level) {
  return SCAFFOLD_LEVELS[level] || SCAFFOLD_LEVELS[4];
}
