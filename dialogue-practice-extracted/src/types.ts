export interface DialogueLine {
  id: number;
  speaker: string; // 'Interviewer' | 'Guest' | 'Customer' | 'Local' | 'Host' | 'Caller' | 'Agent' | 'Tourist' etc.
  text: string;
  highlightWords?: { word: string; definition: string; context: string }[];
}

export type RoleMode = 'all' | 'interviewer' | 'guest' | 'roleplay' | 'interactive_dialogue';

export interface VocabularyItem {
  phrase: string;
  definition: string;
  example: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface GrammarItem {
  id: number;
  sentence: string; // e.g., "I usually ___ breakfast at home."
  verb: string;     // e.g., "have"
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface PracticeUnit {
  id: number;
  title: string;
  theme: string;
  difficulty: string;
  reading: {
    title: string;
    difficulty: string;
    focus: string;
    text: string;
    questions: QuizQuestion[];
    teachingNote: string;
  };
  listening: {
    title: string;
    difficulty: string;
    type: string;
    script: DialogueLine[];
    questions: QuizQuestion[];
    preListening: string;
    postListening: string;
  };
  vocabulary: {
    title: string;
    difficulty: string;
    type: string;
    items: VocabularyItem[];
    matchingGame: { phrase: string; definition: string }[];
    teachingNote: string;
  };
  grammar: {
    title: string;
    difficulty: string;
    focus: string;
    examples: string[];
    questions: GrammarItem[];
  };
  speaking: {
    title: string;
    difficulty: string;
    mode: string;
    setup: string;
    timing: string;
    instructions: string;
    followUp: string[];
    targetLanguage: string[];
    teachingNote: string;
  };
  writing: {
    title: string;
    difficulty: string;
    genre: string;
    wordCount: string;
    prompt: string;
    criteria: string[];
    teachingNote: string;
  };
}
