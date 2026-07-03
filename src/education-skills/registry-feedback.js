/**
 * registry-feedback.js — Skills for feedback task type only.
 */
import { parseSkillMd } from './parser.js';
import metacognitiveMd from '../../education-agent-skills-main/skills/self-regulated-learning/metacognitive-prompt-library/SKILL.md?raw';
import selfRegMd from '../../education-agent-skills-main/skills/self-regulated-learning/self-regulation-scaffold-generator/SKILL.md?raw';
import elaborativeMd from '../../education-agent-skills-main/skills/memory-learning-science/elaborative-interrogation-generator/SKILL.md?raw';
import teachBackMd from '../../education-agent-skills-main/skills/student-learning/teach-back-evaluator/SKILL.md?raw';

const ALL = [metacognitiveMd, selfRegMd, elaborativeMd, teachBackMd]
  .map(raw => parseSkillMd(raw))
  .filter(Boolean);

export function getAll() { return ALL; }
