import { grammarMCQs, vocabTopics } from '../data/met-vocab-homework-bank.js';

export function getGrammarExercises() {
  return grammarMCQs;
}

export function getTopicList() {
  return vocabTopics.map(t => ({ id: t.id, title: t.title }));
}

export function getVocabExercises(topicId) {
  const topic = vocabTopics.find(t => t.id === topicId);
  if (!topic) return [];
  return topic.exercises.filter(e => e.type === 'mcq' || e.type === 'blank');
}

export function getSpeakingExercises(topicId) {
  const topic = vocabTopics.find(t => t.id === topicId);
  if (!topic) return [];
  return topic.exercises.filter(e => e.type === 'speak' || e.type === 'short');
}
