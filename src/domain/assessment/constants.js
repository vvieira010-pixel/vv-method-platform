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

export const COMPETENCY_GROUPS = [
  {
    id: 'listening',
    label: 'Listening',
    competency: 'I',
    skills: ['Listening'],
    description: 'Comprehension of spoken discourse: main idea, detail, inference, attitude, function',
  },
  {
    id: 'reading',
    label: 'Reading',
    competency: 'II',
    skills: ['Reading', 'Grammar', 'Vocabulary'],
    description: 'Reading comprehension with integrated grammar and vocabulary sub-systems',
  },
  {
    id: 'writing',
    label: 'Writing',
    competency: 'III',
    skills: ['Writing'],
    description: 'Personal responses and formal essay with 7 assessment standards',
  },
  {
    id: 'speaking',
    label: 'Speaking',
    competency: 'IV',
    skills: ['Speaking'],
    description: '5 structured tasks with execution formulas under timed conditions',
  },
];

export const CROSS_CUTTING_SKILLS = ['Test Strategy'];

export const CAMBRIDGE_FRAMEWORK_CATEGORIES = [
  {
    id: 'learningAndLearner',
    label: 'Learning and the Learner',
    description: 'Language-learning concepts, FLA/SLA theories, methodologies, and understanding learners',
    stages: [
      { key: 'foundation', label: 'Foundation', description: 'Has a basic understanding of some language-learning concepts. Demonstrates a little of this understanding when planning and teaching.' },
      { key: 'developing', label: 'Developing', description: 'Has a reasonable understanding of many language-learning concepts. Demonstrates some of this understanding when planning and teaching.' },
      { key: 'proficient', label: 'Proficient', description: 'Has a good understanding of many language-learning concepts. Frequently demonstrates this understanding when planning and teaching.' },
      { key: 'expert', label: 'Expert', description: 'Has a sophisticated understanding of language-learning concepts. Consistently demonstrates this understanding when planning and teaching.' },
    ],
  },
  {
    id: 'teachingLearningAssessment',
    label: 'Teaching, Learning and Assessment',
    description: 'Planning, resources, classroom management, teaching language systems and skills, and assessment',
    stages: [
      { key: 'foundation', label: 'Foundation', description: 'Has a basic understanding of some key principles of teaching, learning and assessment. Can plan and deliver simple lessons with basic awareness of learners\u2019 needs.' },
      { key: 'developing', label: 'Developing', description: 'Has a reasonable understanding of many key principles. Can plan and deliver lessons with some awareness of learners\u2019 needs, using a number of different teaching techniques.' },
      { key: 'proficient', label: 'Proficient', description: 'Has a good understanding of key principles. Can plan and deliver detailed lessons with good awareness of learners\u2019 needs, using a wide range of teaching techniques.' },
      { key: 'expert', label: 'Expert', description: 'Has a sophisticated understanding of key principles. Can plan and deliver detailed lessons with a thorough understanding of learners\u2019 needs, using a comprehensive range of techniques.' },
    ],
  },
  {
    id: 'languageAbility',
    label: 'Language Ability',
    description: 'Classroom language accuracy, models for learners, error recognition, and professional communication',
    stages: [
      { key: 'foundation', label: 'Foundation', description: 'Provides accurate examples of language points taught at A1 and A2 levels. Uses basic classroom language which is mostly accurate.' },
      { key: 'developing', label: 'Developing', description: 'Provides accurate examples of language points taught at A1\u2013B1 levels. Uses classroom language which is mostly accurate.' },
      { key: 'proficient', label: 'Proficient', description: 'Provides accurate examples of language points taught at A1\u2013B2 levels. Uses classroom language which is consistently accurate throughout the lesson.' },
      { key: 'expert', label: 'Expert', description: 'Provides accurate examples of language points taught at A1\u2013C2 levels. Uses a wide range of classroom language which is consistently accurate throughout the lesson.' },
    ],
  },
  {
    id: 'languageKnowledge',
    label: 'Language Knowledge and Awareness',
    description: 'Terminology for describing language, language analysis, and use of reference materials',
    stages: [
      { key: 'foundation', label: 'Foundation', description: 'Is aware of some key terms for describing language. Can answer simple learner questions with the help of reference materials.' },
      { key: 'developing', label: 'Developing', description: 'Has reasonable knowledge of many key terms for describing language. Can answer most learner questions with the help of reference materials.' },
      { key: 'proficient', label: 'Proficient', description: 'Has good knowledge of key terms for describing language. Can answer most learner questions with minimal use of reference materials.' },
      { key: 'expert', label: 'Expert', description: 'Has sophisticated knowledge of key terms for describing language. Can answer most learner questions in detail with minimal use of reference materials.' },
    ],
  },
  {
    id: 'professionalDev',
    label: 'Professional Development and Values',
    description: 'Reflection, self-assessment, teamwork, professional roles, and commitment to growth',
    stages: [
      { key: 'foundation', label: 'Foundation', description: 'Can reflect on a lesson with guidance and learn from feedback. Requires guidance in self-assessing own needs.' },
      { key: 'developing', label: 'Developing', description: 'Can reflect on a lesson without guidance and respond positively to feedback. Can self-assess own needs and identify some areas for improvement.' },
      { key: 'proficient', label: 'Proficient', description: 'Can reflect critically and actively seeks feedback. Can identify own strengths and weaknesses as a teacher, and can support other teachers.' },
      { key: 'expert', label: 'Expert', description: 'Consistently reflects critically, observes other colleagues and is highly committed to professional development. Is highly aware of own strengths and weaknesses.' },
    ],
  },
];

export function getCompetencyForSkill(skillKey) {
  for (const group of COMPETENCY_GROUPS) {
    if (group.skills.includes(skillKey)) return group;
  }
  if (CROSS_CUTTING_SKILLS.includes(skillKey)) {
    return { id: 'cross-cutting', label: 'Cross-Cutting', competency: null, skills: CROSS_CUTTING_SKILLS };
  }
  return null;
}
