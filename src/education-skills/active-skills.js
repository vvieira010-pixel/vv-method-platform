/**
 * active-skills.js — Reads currently enabled education skill augmentations
 * from localStorage (saved by the settings page) and prepares them for
 * injection into callAI calls.
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

export function getSkillsForTask(taskType) {
  const activeIds = loadToggleState() || [];
  return getEnabledSkillsForTask(taskType, activeIds);
}

export function withSkills(taskType, options = {}) {
  const skills = getSkillsForTask(taskType);
  if (skills.length === 0) return options;
  return { ...options, skills };
}
