import dialogueData from '../data/exercises/listening/dialogue-bank.json';

function buildModule(mod) {
  let exercises;
  if (mod.moduleType === 'dialogue_set') {
    exercises = (mod.items || []).flatMap(item =>
      (item.questions || []).map(q => {
        const audioText = item.script.map(u => u.text).join(' ');
        return {
          id: `${mod.id}_${item.id}`,
          type: 'listen',
          level: 'B2',
          title: item.title,
          audioText,
          script: item.script,
          plays: 2,
          question: q.stem,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
          pictureHint: '',
        };
      })
    );
  } else {
    exercises = [];
  }

  return {
    id: mod.id,
    label: mod.title,
    skill: 'listening',
    level: mod.levelRange || 'B2',
    exercises,
  };
}

export const dialogueModules = dialogueData.modules.map(buildModule);

export function getDialogueModules() {
  return dialogueModules;
}
