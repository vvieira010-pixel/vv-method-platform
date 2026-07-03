/**
 * registry-homework.js — Skills for homework + exercise task types.
 */
import { parseSkillMd } from './parser.js';
import differentiationMd from '../../education-agent-skills-main/skills/curriculum-assessment/differentiation-adapter/SKILL.md?raw';
import scaffoldMd from '../../education-agent-skills-main/skills/eal-language-development/scaffolded-task-modifier/SKILL.md?raw';
import practiceSequenceMd from '../../education-agent-skills-main/skills/explicit-instruction/practice-problem-sequence-designer/SKILL.md?raw';
import workedExampleMd from '../../education-agent-skills-main/skills/memory-learning-science/worked-example-fading-designer/SKILL.md?raw';
import retrievalPracticeMd from '../../education-agent-skills-main/skills/memory-learning-science/retrieval-practice-generator/SKILL.md?raw';
import rubricMd from '../../education-agent-skills-main/skills/curriculum-assessment/criterion-referenced-rubric-generator/SKILL.md?raw';

const ALL = [differentiationMd, scaffoldMd, practiceSequenceMd, workedExampleMd, retrievalPracticeMd, rubricMd]
  .map(raw => parseSkillMd(raw))
  .filter(Boolean);

export function getAll() { return ALL; }
