let fullDataPromise = null;
function getFullData() {
  if (!fullDataPromise) {
    fullDataPromise = import('../data/exercises/vocabulary/met-vocab-homework-bank.js');
  }
  return fullDataPromise;
}

export function getTopicList() {
  return [
    { id: 'work_career', title: 'Work and Career' },
    { id: 'healthcare', title: 'Healthcare and Patient Care' },
    { id: 'education', title: 'Education and Learning' },
    { id: 'technology', title: 'Technology and Digital Life' },
    { id: 'environment', title: 'Environment and Sustainability' },
    { id: 'community', title: 'Community and Public Services' },
    { id: 'travel_culture', title: 'Travel, Culture, and Moving Abroad' },
    { id: 'money_consumer', title: 'Money, Consumer Choices, and Advertising' },
    { id: 'family_relationships', title: 'Family, Relationships, and Social Life' },
    { id: 'media_news', title: 'Media, News, and Communication' },
  ];
}

export async function getGrammarExercises() {
  const { grammarMCQs } = await getFullData();
  return grammarMCQs;
}

export async function getVocabExercises(topicId) {
  const { vocabTopics } = await getFullData();
  const topic = vocabTopics.find(t => t.id === topicId);
  if (!topic) return [];
  return topic.exercises.filter(e => e.type === 'mcq' || e.type === 'blank');
}

export async function getSpeakingExercises(topicId) {
  const { vocabTopics } = await getFullData();
  const topic = vocabTopics.find(t => t.id === topicId);
  if (!topic) return [];
  return topic.exercises.filter(e => e.type === 'speak' || e.type === 'short');
}

export async function getWritingExercises(topicId) {
  const { vocabTopics } = await getFullData();
  const topic = vocabTopics.find(t => t.id === topicId);
  if (!topic) return [];
  return topic.exercises.filter(e => e.type === 'short');
}

export async function getListeningExercises(topicId) {
  const { vocabTopics } = await getFullData();
  const topic = vocabTopics.find(t => t.id === topicId);
  if (!topic) return [];
  return topic.exercises.filter(e => e.type === 'listen' || e.type === 'embed');
}
