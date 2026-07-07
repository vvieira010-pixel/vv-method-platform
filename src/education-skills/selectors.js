/**
 * selectors.js — Maps task types to relevant education-agent-skills.
 * Uses both tag-based matching and explicit curation.
 * Skill content is loaded lazily per task type.
 */
import { loadSkillsForTask } from './registry.js';

const TASK_TYPES = {
  diagnosis: {
    id: 'diagnosis',
    label: 'Diagnosis',
    description: 'Analyse class evidence and generate skill scores, priorities, and next steps',
    skillIds: [
      'curriculum-assessment/gap-analysis-from-student-work',
      'self-regulated-learning/error-analysis-protocol',
      'memory-learning-science/feedback-quality-analyser',
    ],
    defaultEnabled: true,
  },
  feedback: {
    id: 'feedback',
    label: 'Student Feedback',
    description: 'Generate actionable, pedagogically sound feedback for students',
    skillIds: [
      'ai-learning-science/ai-feedback-design-principles',
      'self-regulated-learning/metacognitive-prompt-library',
      'self-regulated-learning/self-regulation-scaffold-generator',
      'student-learning/teach-back-evaluator',
    ],
    defaultEnabled: true,
  },
  homework: {
    id: 'homework',
    label: 'Homework',
    description: 'Generate exercises and practice materials adapted to student needs',
    skillIds: [
      'curriculum-assessment/differentiation-adapter',
      'eal-language-development/scaffolded-task-modifier',
      'explicit-instruction/practice-problem-sequence-designer',
      'memory-learning-science/worked-example-fading-designer',
      'memory-learning-science/retrieval-practice-generator',
      'curriculum-assessment/criterion-referenced-rubric-generator',
    ],
    defaultEnabled: true,
  },
  exercise: {
    id: 'exercise',
    label: 'Exercise Generation',
    description: 'Create exercises with appropriate scaffolding and cognitive load',
    skillIds: [
      'eal-language-development/scaffolded-task-modifier',
      'explicit-instruction/practice-problem-sequence-designer',
      'memory-learning-science/worked-example-fading-designer',
    ],
    defaultEnabled: false,
  },
  progress: {
    id: 'progress',
    label: 'Progress & Goals',
    description: 'Track student growth and set targeted learning objectives',
    skillIds: [
      'curriculum-assessment/learning-progression-builder',
      'self-regulated-learning/goal-setting-protocol-designer',
      'memory-learning-science/elaborative-interrogation-generator',
    ],
    defaultEnabled: false,
  },
  practice: {
    id: 'practice',
    label: 'Practice Studio',
    description: 'AI-augmented hints, confidence calibration, error diagnosis, and retrieval during practice sessions',
    skillIds: [
      'student-learning/confidence-calibration-check',
      'student-learning/progressive-hint-ladder',
      'student-learning/stuck-and-error-diagnosis-coach',
      'student-learning/retrieve-first-gate',
      'student-learning/transfer-bridge',
      'student-learning/ai-claim-checker',
    ],
    defaultEnabled: true,
  },
};

export function getAllTaskTypes() {
  return Object.values(TASK_TYPES);
}

export function getTaskType(id) {
  return TASK_TYPES[id] || null;
}

/**
 * Get skill prompts for a given task type, respecting teacher toggles.
 * @param {string} taskType - 'diagnosis' | 'feedback' | 'homework' | 'exercise' | 'progress'
 * @param {string[]} enabledSkillIds - Array of skill IDs the teacher has enabled
 * @returns {Promise<object[]>} Array of { id, name, prompt } for enabled skills
 */
export async function getEnabledSkillsForTask(taskType, enabledSkillIds = []) {
  const task = TASK_TYPES[taskType];
  if (!task) return [];
  const allIds = task.skillIds;
  const activeIds = enabledSkillIds.length > 0
    ? allIds.filter(id => enabledSkillIds.includes(id))
    : task.defaultEnabled ? allIds : [];
  if (activeIds.length === 0) return [];

  const skills = await loadSkillsForTask(taskType);
  return activeIds
    .map(id => skills.find(s => s.id === id))
    .filter(Boolean)
    .map(s => ({ id: s.id, name: s.name, prompt: s.prompt }));
}

/**
 * Build a system prompt augmentation string from enabled skills.
 * Returns empty string if no skills apply.
 */
export async function buildSkillAugmentation(taskType, enabledSkillIds = []) {
  const skills = await getEnabledSkillsForTask(taskType, enabledSkillIds);
  if (skills.length === 0) return '';

  const parts = skills.map(s => {
    return `\n--- ${s.name} ---\n${s.prompt}`;
  });

  return `\n\n━━━ EDUCATION SKILL AUGMENTATIONS ━━━\n${parts.join('\n')}\n━━━ END AUGMENTATIONS ━━━\n`;
}
