/**
 * active-skills.js — Reads currently enabled education skill augmentations
 * from localStorage and prepares them for injection into callAI calls.
 * Returns Promises because skill content is loaded lazily per task type.
 */
import { getEnabledSkillsForTask } from './selectors.js';

const LS_KEY = 'vv:skills_enabled';

function loadToggleState() {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const toggles = JSON.parse(stored);
      return Object.entries(toggles)
        .filter(([, v]) => v !== false)
        .map(([k]) => k);
    }
  } catch { /* fall through */ }
  return null;
}

export async function getSkillsForTask(taskType) {
  const activeIds = loadToggleState() || [];
  return await getEnabledSkillsForTask(taskType, activeIds);
}

export async function withSkills(taskType, options = {}) {
  const skills = await getSkillsForTask(taskType);
  if (skills.length === 0) return options;
  return { ...options, skills };
}
