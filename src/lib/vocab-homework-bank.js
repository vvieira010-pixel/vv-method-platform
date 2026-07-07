let fullDataPromise = null;
function getFullData() {
  if (!fullDataPromise) {
    fullDataPromise = (async () => {
      const mod = await import('../data/exercises/vocabulary/met-vocab-homework-bank.js');
      const addon = (await import('../data/exercises/vocabulary/met-vocab-addon-exercises.js')).default;
      const mergedTopics = mod.vocabTopics.map(t => {
        const extra = addon[t.id];
        return extra ? { ...t, exercises: [...t.exercises, ...extra] } : t;
      });
      return { ...mod, vocabTopics: mergedTopics };
    })();
  }
  return fullDataPromise;
}

export function getTopicList(mode) {
  if (mode === 'listening') {
    return []; // Handled asynchronously in PracticeSession or via a new helper
  }
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

export async function getListeningAudioGroups() {
  const { vocabTopics } = await getFullData();
  const { LISTENING } = await import('./met-b2-exercises.js');

  const allListening = [
    ...vocabTopics.flatMap(t => t.exercises.filter(e => e.type === 'listen')),
    ...LISTENING
  ];

  const groups = new Map();

  allListening.forEach(ex => {
    const audioId = ex.audioSrc || `embed-${ex.id}`;
    if (!audioId) return;

    let title;
    if (ex.audioSrc) {
      const filename = ex.audioSrc.split('/').pop() || '';
      title = filename
        .replace(/^listening-(L\d+-)?/, '')
        .replace(/\.mp3$/, '')
        .split(/[-_]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    } else {
      title = ex.title || 'Special Exercise';
    }

    groups.set(audioId, title);
  });

  return Array.from(groups.entries()).map(([id, title]) => ({ id, title }));
}

export async function getGrammarExercises() {
  const { grammarMCQs } = await getFullData();
  const drillMod = await import('./met-grammar-bank.js');
  const drillQuestions = drillMod.getGrammarModules().flatMap(m => m.exercises);
  return [...grammarMCQs, ...drillQuestions];
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

export async function getListeningExercises(audioId) {
  const { vocabTopics } = await getFullData();
  const { LISTENING } = await import('./met-b2-exercises.js');
  
  const allListening = [
    ...vocabTopics.flatMap(t => t.exercises.filter(e => e.type === 'listen' || e.type === 'embed')),
    ...LISTENING
  ];

  return allListening.filter(e => (e.audioSrc || e.url || `embed-${e.id}`) === audioId);
}
