import { parseSkillMd } from './parser.js';
import confidenceMd from '../../education-agent-skills-main/skills/student-learning/confidence-calibration-check/SKILL.md?raw';
import hintLadderMd from '../../education-agent-skills-main/skills/student-learning/progressive-hint-ladder/SKILL.md?raw';
import stuckMd from '../../education-agent-skills-main/skills/student-learning/stuck-and-error-diagnosis-coach/SKILL.md?raw';
import retrieveMd from '../../education-agent-skills-main/skills/student-learning/retrieve-first-gate/SKILL.md?raw';
import transferMd from '../../education-agent-skills-main/skills/student-learning/transfer-bridge/SKILL.md?raw';
import claimMd from '../../education-agent-skills-main/skills/student-learning/ai-claim-checker/SKILL.md?raw';

const ALL = [confidenceMd, hintLadderMd, stuckMd, retrieveMd, transferMd, claimMd]
  .map(raw => parseSkillMd(raw))
  .filter(Boolean);

export function getAll() { return ALL; }
