import listeningData from '../data/met-listening-skills-bank.json';

function buildModule(mod) {
  let exercises;
  if (mod.moduleType === 'listening_set') {
    exercises = (mod.items || []).flatMap(item => 
      (item.questions || []).map(q => ({
        id: `${mod.id}_${item.id}_${q.stem.substring(0,5).replace(/\s/g, '_')}`,
        type: 'listen',
        level: 'B2',
        audioText: item.script,
        plays: 2,
        question: q.stem,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        pictureHint: '',
      }))
    );
  } else {
    // Fallback (should not happen for listening_set)
    exercises = [];
  }

  return {
    id: mod.id,
    label: mod.title,
    skill: mod.skill,
    level: mod.levelRange || 'B2',
    exercises,
  };
}

export const listeningModules = listeningData.modules.map(buildModule);
