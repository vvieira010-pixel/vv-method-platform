/**
 * registry.js — Curated skill registry.
 * Imports selected education-agent-skills via Vite ?raw and exposes them
 * as parsed skill objects for prompt augmentation.
 */
import { parseSkillMd } from './parser.js';

/* ─── DIAGNOSIS SKILLS ──────────────────────────────────────── */
import gapAnalysisMd from '../../education-agent-skills-main/skills/curriculum-assessment/gap-analysis-from-student-work/SKILL.md?raw';
import errorAnalysisMd from '../../education-agent-skills-main/skills/self-regulated-learning/error-analysis-protocol/SKILL.md?raw';
import feedbackDesignMd from '../../education-agent-skills-main/skills/ai-learning-science/ai-feedback-design-principles/SKILL.md?raw';
import rubricMd from '../../education-agent-skills-main/skills/curriculum-assessment/criterion-referenced-rubric-generator/SKILL.md?raw';
import feedbackQualityMd from '../../education-agent-skills-main/skills/memory-learning-science/feedback-quality-analyser/SKILL.md?raw';

/* ─── HOMEWORK SKILLS ───────────────────────────────────────── */
import differentiationMd from '../../education-agent-skills-main/skills/curriculum-assessment/differentiation-adapter/SKILL.md?raw';
import scaffoldMd from '../../education-agent-skills-main/skills/eal-language-development/scaffolded-task-modifier/SKILL.md?raw';
import practiceSequenceMd from '../../education-agent-skills-main/skills/explicit-instruction/practice-problem-sequence-designer/SKILL.md?raw';
import workedExampleMd from '../../education-agent-skills-main/skills/memory-learning-science/worked-example-fading-designer/SKILL.md?raw';
import retrievalPracticeMd from '../../education-agent-skills-main/skills/memory-learning-science/retrieval-practice-generator/SKILL.md?raw';

/* ─── FEEDBACK SKILLS ───────────────────────────────────────── */
import metacognitiveMd from '../../education-agent-skills-main/skills/self-regulated-learning/metacognitive-prompt-library/SKILL.md?raw';
import selfRegMd from '../../education-agent-skills-main/skills/self-regulated-learning/self-regulation-scaffold-generator/SKILL.md?raw';
import elaborativeMd from '../../education-agent-skills-main/skills/memory-learning-science/elaborative-interrogation-generator/SKILL.md?raw';
import teachBackMd from '../../education-agent-skills-main/skills/student-learning/teach-back-evaluator/SKILL.md?raw';

/* ─── PROGRESS / GENERAL ─────────────────────────────────────── */
import progressionMd from '../../education-agent-skills-main/skills/curriculum-assessment/learning-progression-builder/SKILL.md?raw';
import goalSettingMd from '../../education-agent-skills-main/skills/self-regulated-learning/goal-setting-protocol-designer/SKILL.md?raw';

const RAW_IMPORTS = [
  gapAnalysisMd, errorAnalysisMd, feedbackDesignMd, rubricMd, feedbackQualityMd,
  differentiationMd, scaffoldMd, practiceSequenceMd, workedExampleMd, retrievalPracticeMd,
  metacognitiveMd, selfRegMd, elaborativeMd, teachBackMd,
  progressionMd, goalSettingMd,
];

const ALL = [];
const BY_ID = {};

for (const raw of RAW_IMPORTS) {
  const parsed = parseSkillMd(raw);
  if (parsed && parsed.id) {
    ALL.push(parsed);
    BY_ID[parsed.id] = parsed;
  }
}

export function getAllSkills() {
  return ALL;
}

export function getSkillById(id) {
  return BY_ID[id] || null;
}

export function getSkillsByDomain(domain) {
  return ALL.filter(s => s.domain === domain);
}

export function getSkillsByTag(tag) {
  return ALL.filter(s => (s.tags || []).includes(tag));
}
