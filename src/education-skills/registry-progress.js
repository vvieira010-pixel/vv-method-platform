/**
 * registry-progress.js — Skills for progress task type only.
 */
import { parseSkillMd } from './parser.js';
import progressionMd from '../../education-agent-skills-main/skills/curriculum-assessment/learning-progression-builder/SKILL.md?raw';
import goalSettingMd from '../../education-agent-skills-main/skills/self-regulated-learning/goal-setting-protocol-designer/SKILL.md?raw';
import elaborativeMd from '../../education-agent-skills-main/skills/memory-learning-science/elaborative-interrogation-generator/SKILL.md?raw';

const ALL = [progressionMd, goalSettingMd, elaborativeMd]
  .map(raw => parseSkillMd(raw))
  .filter(Boolean);

export function getAll() { return ALL; }
