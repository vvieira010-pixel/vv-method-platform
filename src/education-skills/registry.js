/**
 * registry.js — Curated skill registry with per-task dynamic loading.
 * Each task type's SKILL.md files are loaded lazily so pages only
 * bundle the skills they actually use.
 */
const cache = {};

/** @returns {Promise<import('./parser.js').SkillDef[]>} */
export async function loadSkillsForTask(taskType) {
  if (cache[taskType]) return cache[taskType];
  let mod;
  switch (taskType) {
    case 'diagnosis':
      mod = await import('./registry-diagnosis.js');
      break;
    case 'feedback':
      mod = await import('./registry-feedback.js');
      break;
    case 'homework':
    case 'exercise':
      mod = await import('./registry-homework.js');
      break;
    case 'progress':
      mod = await import('./registry-progress.js');
      break;
    case 'practice':
      mod = await import('./registry-practice.js');
      break;
    default:
      cache[taskType] = [];
      return [];
  }
  cache[taskType] = mod.getAll();
  return cache[taskType];
}

/* ─── Static helpers for metadata-only uses (settings page) ──── */
const RAW_METADATA = [
  { id: 'curriculum-assessment/gap-analysis-from-student-work',    name: 'Gap Analysis from Student Work',       domain: 'curriculum-assessment' },
  { id: 'self-regulated-learning/error-analysis-protocol',         name: 'Error Analysis Protocol',               domain: 'self-regulated-learning' },
  { id: 'ai-learning-science/ai-feedback-design-principles',       name: 'AI Feedback Design Principles',         domain: 'ai-learning-science' },
  { id: 'curriculum-assessment/criterion-referenced-rubric-generator', name: 'Criterion-Referenced Rubric Generator', domain: 'curriculum-assessment' },
  { id: 'memory-learning-science/feedback-quality-analyser',       name: 'Feedback Quality Analyser',             domain: 'memory-learning-science' },
  { id: 'curriculum-assessment/differentiation-adapter',           name: 'Differentiation Adapter',               domain: 'curriculum-assessment' },
  { id: 'eal-language-development/scaffolded-task-modifier',       name: 'Scaffolded Task Modifier',              domain: 'eal-language-development' },
  { id: 'explicit-instruction/practice-problem-sequence-designer', name: 'Practice Problem Sequence Designer',    domain: 'explicit-instruction' },
  { id: 'memory-learning-science/worked-example-fading-designer',  name: 'Worked Example Fading Designer',        domain: 'memory-learning-science' },
  { id: 'memory-learning-science/retrieval-practice-generator',    name: 'Retrieval Practice Generator',          domain: 'memory-learning-science' },
  { id: 'self-regulated-learning/metacognitive-prompt-library',    name: 'Metacognitive Prompt Library',          domain: 'self-regulated-learning' },
  { id: 'self-regulated-learning/self-regulation-scaffold-generator', name: 'Self-Regulation Scaffold Generator', domain: 'self-regulated-learning' },
  { id: 'memory-learning-science/elaborative-interrogation-generator', name: 'Elaborative Interrogation Generator', domain: 'memory-learning-science' },
  { id: 'student-learning/teach-back-evaluator',                   name: 'Teach-Back Evaluator',                  domain: 'student-learning' },
  { id: 'curriculum-assessment/learning-progression-builder',      name: 'Learning Progression Builder',          domain: 'curriculum-assessment' },
  { id: 'self-regulated-learning/goal-setting-protocol-designer',  name: 'Goal Setting Protocol Designer',        domain: 'self-regulated-learning' },
  { id: 'student-learning/confidence-calibration-check',          name: 'Confidence Calibration Check',          domain: 'student-learning' },
  { id: 'student-learning/progressive-hint-ladder',               name: 'Progressive Hint Ladder',               domain: 'student-learning' },
  { id: 'student-learning/stuck-and-error-diagnosis-coach',       name: 'Stuck & Error Diagnosis Coach',         domain: 'student-learning' },
  { id: 'student-learning/retrieve-first-gate',                   name: 'Retrieve-First Gate',                   domain: 'student-learning' },
  { id: 'student-learning/transfer-bridge',                       name: 'Transfer Bridge',                       domain: 'student-learning' },
  { id: 'student-learning/ai-claim-checker',                      name: 'AI Claim Checker',                      domain: 'student-learning' },
];

export function getAllSkillMetadata() {
  return RAW_METADATA;
}

export function getSkillMetadataById(id) {
  return RAW_METADATA.find(s => s.id === id) || null;
}
