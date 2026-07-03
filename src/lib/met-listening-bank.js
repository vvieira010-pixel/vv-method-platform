import listeningData from '../data/exercises/listening/met-listening-skills-bank.json';
import { dbList, dbEnabled } from './supabase-db.js';

function buildModule(mod) {
  let exercises;
  if (mod.moduleType === 'listening_set') {
    exercises = (mod.items || []).flatMap(item => 
      (item.questions || []).map(q => ({
        id: `${mod.id}_${item.id}_${q.stem.substring(0,5).replace(/\s/g, '_')}`,
        type: 'listen',
        level: 'B2',
        audioText: item.script,
        audioSrc: item.audioFile ? `/Listenings/${encodeURIComponent(item.audioFile)}` : '',
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

export async function getSupabaseListeningModules() {
  if (!dbEnabled()) return [];
  try {
    const records = await dbList('listeningExercises');
    if (!records || records.length === 0) return [];
    return [{
      id: 'supabase_listening',
      label: 'Custom Listening Exercises',
      skill: 'listening',
      level: 'B2',
      exercises: records.map((ex, i) => ({
        id: ex.id || `sb_listen_${i}`,
        type: 'listen',
        level: ex.level || 'B2',
        audioText: ex.audioText || ex.content?.audioText || '',
        audioSrc: ex.audioSrc || '',
        plays: ex.plays || 2,
        question: ex.question || ex.content?.question || '',
        options: ex.options || ex.content?.options || [],
        correct: ex.correct ?? ex.content?.correct ?? 0,
        explanation: ex.explanation || ex.content?.explanation || '',
        pictureHint: ex.pictureHint || '',
      })),
    }];
  } catch {
    return [];
  }
}
