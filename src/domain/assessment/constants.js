export const SECTION_KEYS = [
  { key: 'readinessCheck',          label: 'Diagnostic Readiness Check',    studentFacing: false },
  { key: 'classSummary',            label: 'Class Summary',                 studentFacing: false },
  { key: 'targetScoreRelevance',    label: 'Target Score Relevance',        studentFacing: false },
  { key: 'estimatedOverallScore',   label: 'Estimated Overall Score',       studentFacing: false },
  { key: 'skillDiagnosis',          label: 'Skill Diagnosis',               studentFacing: false },
  { key: 'errorBankSuggestions',    label: 'Error Bank Suggestions',        studentFacing: false },
  { key: 'vocabGrammarTargets',     label: 'Vocabulary & Grammar Targets',  studentFacing: false },
  { key: 'priorityDiagnosis',       label: 'Priority Diagnosis (Top 3)',    studentFacing: false },
  { key: 'studentFeedback',         label: 'Personalized Student Feedback', studentFacing: true  },
  { key: 'homeworkRecommendation',  label: 'Homework Recommendation',       studentFacing: true  },
  { key: 'nextClassFocus',          label: 'Next Class Focus',              studentFacing: false },
  { key: 'profileUpdateSuggestions',label: 'Profile Update Suggestions',    studentFacing: false },
];

export const REQUIRED_APPROVAL_KEYS = ['skillDiagnosis', 'studentFeedback', 'homeworkRecommendation', 'nextClassFocus'];

export const SECTION_LABELS = Object.fromEntries(SECTION_KEYS.map(s => [s.key, s.label]));

export const DIAGNOSIS_DERIVED_KEYS = new Set([
  'skillDiagnosis',
  'classSummary',
  'targetScoreRelevance',
  'estimatedOverallScore',
  'priorityDiagnosis',
  'nextClassFocus',
  'profileUpdateSuggestions',
]);

export const SECTION_GROUPS = [
  {
    zone: 'teacher', title: 'Teacher Analysis', studentFacing: false,
    groups: [
      { title: 'Readiness Check',    keys: ['readinessCheck'] },
      { title: 'Overview',           keys: ['classSummary', 'targetScoreRelevance', 'estimatedOverallScore'] },
      { title: 'Skill Diagnosis',    keys: ['skillDiagnosis'] },
      { title: 'Priorities',         keys: ['priorityDiagnosis'] },
      { title: 'Errors & Targets',   keys: ['errorBankSuggestions', 'vocabGrammarTargets'] },
      { title: 'Class Planning',     keys: ['nextClassFocus', 'profileUpdateSuggestions'] },
    ],
  },
  {
    zone: 'student', title: 'Student-Facing', studentFacing: true,
    caption: 'This is exactly what your student will see.',
    groups: [
      { title: 'Personalized Student Feedback', keys: ['studentFeedback'] },
      { title: 'Homework Recommendation',        keys: ['homeworkRecommendation'] },
    ],
  },
];

export const SKILL_KEYS = [
  { key: 'Speaking',      evalKey: 'evaluatedSpeaking',     countKey: 'speakingEvidenceCount' },
  { key: 'Writing',       evalKey: 'evaluatedWriting',      countKey: 'writingEvidenceCount' },
  { key: 'Reading',       evalKey: 'evaluatedReading',      countKey: 'readingEvidenceCount' },
  { key: 'Listening',     evalKey: 'evaluatedListening',    countKey: 'listeningEvidenceCount' },
  { key: 'Grammar',       evalKey: 'evaluatedGrammar',      countKey: 'grammarEvidenceCount' },
  { key: 'Vocabulary',    evalKey: 'evaluatedVocabulary',   countKey: 'vocabularyEvidenceCount' },
  { key: 'Test Strategy', evalKey: 'evaluatedTestStrategy', countKey: 'testStrategyEvidenceCount' },
];
