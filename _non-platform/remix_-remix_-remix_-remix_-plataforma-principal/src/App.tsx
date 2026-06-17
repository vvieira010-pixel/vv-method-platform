import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, HelpCircle, Sparkles, MessageSquare, 
  Layers, Coffee, Sun, ChevronRight, CheckCircle, Info, Heart,
  Mic, User, Clipboard, ListTodo, Award, FileText, CheckSquare,
  Compass, RefreshCw, Zap, Bookmark, Star, GraduationCap, ChevronLeft,
  Volume2, Lightbulb, Play, RotateCcw, AlertCircle, Edit3, Activity, Flame,
  Home, Send, FileDown, Search
, Clock } from 'lucide-react';
import DialoguePlayer from './components/DialoguePlayer';
import VocabularyViewer from './components/VocabularyViewer';
import QuizSection from './components/QuizSection';
import SentenceLevelUp from './components/SentenceLevelUp';
import GrammarDoctor from './components/GrammarDoctor';
import { RoleMode, PracticeUnit, QuizQuestion } from './types';
import { PRACTICE_UNITS } from './data';
import { exportSyllabusPDF } from './exportPdf';

import PeerDiscussion from './components/PeerDiscussion';
import CalendarViewer from './components/CalendarViewer';

type SkillTab = 'listening' | 'reading' | 'vocabulary' | 'grammar' | 'speaking' | 'writing' | 'levelup' | 'challenge';
type MainPage = 'overview' | 'syllabus' | 'student' | 'teacher' | 'progress' | 'messages' | 'calendar';


const calculateEstimatedTime = (unit: PracticeUnit): number => {
  let totalMinutes = 0;
  
  if (unit.reading && unit.reading.text) {
    const wordsCount = unit.reading.text.split(/\s+/).length;
    totalMinutes += Math.ceil(wordsCount / 100);
    totalMinutes += (unit.reading.questions.length * 1);
  }

  if (unit.listening && unit.listening.script) {
    totalMinutes += Math.ceil((unit.listening.script.length * 10) / 60);
    totalMinutes += (unit.listening.questions.length * 1);
  }
  
  if (unit.vocabulary && unit.vocabulary.items) {
    totalMinutes += (unit.vocabulary.items.length * 0.5);
    totalMinutes += (unit.vocabulary.matchingGame.length * 0.5);
  }

  if (unit.grammar && unit.grammar.questions) {
    totalMinutes += (unit.grammar.questions.length * 1);
  }

  if (unit.speaking && unit.speaking.timing) {
    let speakingTime = 4;
    const timingMatch = unit.speaking.timing.match(/(\d+)/g);
    if (timingMatch && timingMatch.length > 0) {
      speakingTime = parseInt(timingMatch[timingMatch.length - 1], 10);
    }
    totalMinutes += speakingTime;
  }

  if (unit.writing && unit.writing.wordCount) {
    let writingTime = 10;
    const wordMatch = unit.writing.wordCount.match(/(\d+)/g);
    if (wordMatch && wordMatch.length > 0) {
      const maxWords = parseInt(wordMatch[wordMatch.length - 1], 10);
      writingTime = Math.max(5, Math.ceil((maxWords / 100) * 10));
    }
    totalMinutes += writingTime;
  }

  return Math.ceil(totalMinutes);
};

export default function App() {
  // Curriculum state pointers
  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<SkillTab>('listening');
  const [selectedWord, setSelectedWord] = useState<{ word: string; definition: string; context: string } | null>(null);

  // Audio dialogue state mapping
  const [roleMode, setRoleMode] = useState<RoleMode>('all');

  // Grammar workout state elements
  const [grammarSelection, setGrammarSelection] = useState<Record<number, number>>({});
  const [grammarSubmitted, setGrammarSubmitted] = useState<boolean>(false);
  const [grammarSubTab, setGrammarSubTab] = useState<'drills' | 'doctor'>('drills');

  // Challenge quiz questions state
  const [challengeQuestions, setChallengeQuestions] = useState<QuizQuestion[]>([]);

  // Timed speaking exercise states
  const [speakingTimer, setSpeakingTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [checkedTargetPhrases, setCheckedTargetPhrases] = useState<Record<string, boolean>>({});
  const [speakingDraft, setSpeakingDraft] = useState<string>('');
  const [speakingSubmitted, setSpeakingSubmitted] = useState<boolean>(false);

  // Writing essay state elements
  const [writingContent, setWritingContent] = useState<string>('');
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});
  const [showSampleWriting, setShowSampleWriting] = useState<boolean>(false);
  const [writingSubmitted, setWritingSubmitted] = useState<Record<number, boolean>>({});
  
  // Speech Recognition state
  const [isRecordingWriting, setIsRecordingWriting] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  const toggleRecording = () => {
    if (isRecordingWriting && recognitionRef.current) {
      // @ts-ignore
      recognitionRef.current.stop();
      setIsRecordingWriting(false);
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecordingWriting(true);
    };

    // @ts-ignore
    recognition.onresult = (event) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setWritingContent(prev => {
          const newContent = prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + finalTranscript;
          setSessionWritingDrafts(drafts => ({
            ...drafts,
            [selectedUnitId]: newContent
          }));
          return newContent;
        });
      }
    };

    // @ts-ignore
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecordingWriting(false);
    };

    recognition.onend = () => {
      setIsRecordingWriting(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Session-wide progress tracking
  const [masteredCards, setMasteredCards] = useState<Record<string, boolean>>({});
  const [sessionWritingDrafts, setSessionWritingDrafts] = useState<Record<number, string>>({});
  const [sessionSpeakingDrafts, setSessionSpeakingDrafts] = useState<Record<number, string>>({});
  const [manuallyCompletedUnits, setManuallyCompletedUnits] = useState<Record<number, boolean>>({});
  const [completedDates, setCompletedDates] = useState<string[]>(['2026-06-07', '2026-06-06']);
  const [studentReflections, setStudentReflections] = useState<Record<number, string>>({});
  const [reflectionModalOpen, setReflectionModalOpen] = useState<{ isOpen: boolean; unitId: number | null }>({ isOpen: false, unitId: null });
  const [currentReflectionDraft, setCurrentReflectionDraft] = useState<string>('');

  // Navigation
  const [activeMainPage, setActiveMainPage] = useState<MainPage>('overview');
  const [syllabusSearchQuery, setSyllabusSearchQuery] = useState<string>('');

  // Teacher feedback & grading states (dynamic propagation)
  const [teacherSpeakingScore, setTeacherSpeakingScore] = useState<number>(62);
  const [teacherFluencyScore, setTeacherFluencyScore] = useState<number>(55);
  const [teacherPronunciationScore, setTeacherPronunciationScore] = useState<number>(0); // 0 = not enough evidence
  const [teacherWritingScore, setTeacherWritingScore] = useState<number>(0);             // 0 = 0 turns evaluated
  const [teacherNote, setTeacherNote] = useState<string>(
    "Teacher-only note: student can answer familiar topics but needs a stronger opening sentence, clearer reason selection, and more controlled connectors under time pressure."
  );

  const [feedbackApproved, setFeedbackApproved] = useState<boolean>(true);
  const [feedbacks, setFeedbacks] = useState({
    todayFocus: "We worked on giving a fuller MET speaking answer with a clear opinion and one example.",
    whatIsStronger: "Your answer was clearer when you used a real workplace example instead of staying general.",
    nextStep: "Plan your reason before you start speaking. This will make your response easier to follow.",
    practiceFocus: "Before next class, record one 60-second answer and use the structure: opinion, reason, example."
  });

  // Local state for interactive editing fields on teacher's edit page
  const [editTodayFocus, setEditTodayFocus] = useState(feedbacks.todayFocus);
  const [editWhatIsStronger, setEditWhatIsStronger] = useState(feedbacks.whatIsStronger);
  const [editNextStep, setEditNextStep] = useState(feedbacks.nextStep);
  const [editPracticeFocus, setEditPracticeFocus] = useState(feedbacks.practiceFocus);

  // Message Board states
  const [messages, setMessages] = useState<Array<{ id: number; sender: 'student' | 'teacher'; text: string; timestamp: string }>>([
    { id: 1, sender: 'student', text: 'I recorded my speaking answer. Can we review my organization next class?', timestamp: 'Jun 8, 3:32 AM' }
  ]);
  const [newMessageText, setNewMessageText] = useState('');
  const [announcements, setAnnouncements] = useState<Array<{ id: number; title: string; content: string }>>([
    { id: 1, title: 'New speaking practice is available this week.', content: 'Focus on giving fuller answers with examples. Try recording your response before class so we can review it together.' },
    { id: 2, title: 'MET vocabulary focus: work and career.', content: 'Practice collocations like make a decision, take responsibility, and handle a difficult situation.' },
    { id: 3, title: 'Next class reminder.', content: 'Bring one healthcare situation you can describe clearly in English. We will use it for a timed answer upgrade.' }
  ]);

  const addTodayToCompleted = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setCompletedDates(prev => {
      if (prev.includes(todayStr)) return prev;
      return [...prev, todayStr];
    });
  };

  const isUnitCompleted = (unitId: number): boolean => {
    if (manuallyCompletedUnits[unitId]) return true;
    const hasSpeaking = sessionSpeakingDrafts[unitId] && sessionSpeakingDrafts[unitId].trim() !== '';
    if (hasSpeaking) return true;
    const hasWriting = (sessionWritingDrafts[unitId] && sessionWritingDrafts[unitId].trim() !== '') || writingSubmitted[unitId];
    if (hasWriting) return true;
    const unit = PRACTICE_UNITS.find(u => u.id === unitId);
    if (unit) {
      const hasMasteredWord = unit.vocabulary.items.some(item => masteredCards[item.phrase]);
      if (hasMasteredWord) return true;
    }
    return false;
  };

  const handleWritingChange = (val: string) => {
    setWritingContent(val);
    setSessionWritingDrafts(prev => ({
      ...prev,
      [selectedUnitId]: val
    }));
  };

  const handleSpeakingChange = (val: string) => {
    setSpeakingDraft(val);
    setSessionSpeakingDrafts(prev => ({
      ...prev,
      [selectedUnitId]: val
    }));
  };

  const handleDownloadSummary = () => {
    // Compile vocabulary marked as mastered during the session
    const learnedVocab: { phrase: string; definition: string; example: string; unitId: number }[] = [];
    PRACTICE_UNITS.forEach(unit => {
      unit.vocabulary.items.forEach(item => {
        if (masteredCards[item.phrase]) {
          learnedVocab.push({
            phrase: item.phrase,
            definition: item.definition,
            example: item.example,
            unitId: unit.id
          });
        }
      });
    });

    // Compile active and saved writing drafts
    const writingDrafts: { unitId: number; title: string; prompt: string; genre: string; text: string }[] = [];
    PRACTICE_UNITS.forEach(unit => {
      const text = unit.id === selectedUnitId ? writingContent : sessionWritingDrafts[unit.id];
      if (text && text.trim() !== '') {
        writingDrafts.push({
          unitId: unit.id,
          title: unit.writing.title,
          prompt: unit.writing.prompt,
          genre: unit.writing.genre,
          text: text.trim()
        });
      }
    });

    // Compile active and saved speaking response drafts
    const speakingDrafts: { unitId: number; title: string; setup: string; instructions: string; text: string }[] = [];
    PRACTICE_UNITS.forEach(unit => {
      const text = unit.id === selectedUnitId ? speakingDraft : sessionSpeakingDrafts[unit.id];
      if (text && text.trim() !== '') {
        speakingDrafts.push({
          unitId: unit.id,
          title: unit.speaking.title,
          setup: unit.speaking.setup,
          instructions: unit.speaking.instructions,
          text: text.trim()
        });
      }
    });

    // Construct the formatted summary text document
    let doc = `============================================================\n`;
    doc += `          LIFESTYLE ENGLISH COCURRICULUM STUDIO             \n`;
    doc += `                    STUDY SESSION SUMMARY                   \n`;
    doc += `============================================================\n`;
    doc += `Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    doc += `Time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n\n`;

    doc += `------------------------------------------------------------\n`;
    doc += `1. MASTERED VOCABULARY (LEARNED TERMS)\n`;
    doc += `------------------------------------------------------------\n`;
    if (learnedVocab.length === 0) {
      doc += `No vocabulary terms marked as mastered in this session yet.\n`;
      doc += `Tip: Go to the "Flashcards" sub-tab in Vocabulary Studio and click "Mark as Mastered"!\n`;
    } else {
      doc += `Total Mastered terms: ${learnedVocab.length}\n\n`;
      learnedVocab.forEach((item, idx) => {
        doc += `${idx + 1}. ${item.phrase.toUpperCase()} (Unit ${item.unitId})\n`;
        doc += `   Definition: ${item.definition}\n`;
        if (item.example) {
          doc += `   Dialogue Example: "${item.example}"\n`;
        }
        doc += `\n`;
      });
    }
    doc += `\n`;

    doc += `------------------------------------------------------------\n`;
    doc += `2. COMPLETED WRITING ESSAYS & DRAFTS\n`;
    doc += `------------------------------------------------------------\n`;
    if (writingDrafts.length === 0) {
      doc += `No writing essays drafted in this session yet.\n`;
      doc += `Tip: Navigate to any Unit and use the "Essay Composition" tab to write your response!\n`;
    } else {
      doc += `Total Writing Drafts: ${writingDrafts.length}\n\n`;
      writingDrafts.forEach((draft, idx) => {
        doc += `DRAFT #${idx + 1}: UNIT ${draft.unitId} — ${draft.title.toUpperCase()}\n`;
        doc += `Genre / Focus: ${draft.genre}\n`;
        doc += `Prompt: "${draft.prompt}"\n`;
        doc += `----------------- Your Composition -----------------\n`;
        doc += `${draft.text}\n`;
        doc += `----------------------------------------------------\n\n`;
      });
    }
    doc += `\n`;

    doc += `------------------------------------------------------------\n`;
    doc += `3. DRAFTED ORAL SPEAKING TRANSCRIPTS\n`;
    doc += `------------------------------------------------------------\n`;
    if (speakingDrafts.length === 0) {
      doc += `No speaking sandbox transcripts drafted in this session yet.\n`;
    } else {
      doc += `Total Speaking Drafts: ${speakingDrafts.length}\n\n`;
      speakingDrafts.forEach((draft, idx) => {
        doc += `SPEAKING #${idx + 1}: UNIT ${draft.unitId} — ${draft.title.toUpperCase()}\n`;
        doc += `Scenario Setup: ${draft.setup}\n`;
        doc += `Prompt: "${draft.instructions}"\n`;
        doc += `----------------- Your Transcript ------------------\n`;
        doc += `${draft.text}\n`;
        doc += `----------------------------------------------------\n\n`;
      });
    }

    doc += `\n`;
    doc += `============================================================\n`;
    doc += `          Keep up the absolute stellar work!                \n`;
    doc += `============================================================\n`;

    // Trigger file download
    const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lifestyle_English_Study_Summary_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load the current active curriculum element
  const activeUnit = PRACTICE_UNITS.find(u => u.id === selectedUnitId) || PRACTICE_UNITS[0];

  // Word highlight context click
  const handleSelectWord = (word: { word: string; definition: string; context: string } | null) => {
    setSelectedWord(word);
    if (word) {
      setActiveTab('vocabulary');
    }
  };

  // Reset helper when switching Units to prevent leakage of states
  useEffect(() => {
    setSelectedWord(null);
    setGrammarSelection({});
    setGrammarSubmitted(false);
    setGrammarSubTab('drills');
    setSpeakingTimer(0);
    setIsTimerRunning(false);
    setCheckedTargetPhrases({});
    setSpeakingDraft(sessionSpeakingDrafts[selectedUnitId] || '');
    setSpeakingSubmitted(false);
    setWritingContent(sessionWritingDrafts[selectedUnitId] || '');
    setCheckedCriteria({});
    setShowSampleWriting(false);
    setRoleMode('all');

    // Generate fresh set of Challenge Questions for this unit
    const unit = PRACTICE_UNITS.find(u => u.id === selectedUnitId) || PRACTICE_UNITS[0];
    if (unit) {
      const lQ = [...unit.listening.questions].sort(() => Math.random() - 0.5).slice(0, 2);
      const rQ = [...unit.reading.questions].sort(() => Math.random() - 0.5).slice(0, 2);
      const gQ: QuizQuestion[] = [...unit.grammar.questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .map((g, i) => ({
          id: 1000 + g.id + i,
          question: `Fill in the blank: ${g.sentence.replace('___', '_____')}`,
          options: g.options,
          correctAnswer: g.correctAnswer,
          explanation: g.explanation
        }));

      const combined = [...lQ, ...rQ, ...gQ].sort(() => Math.random() - 0.5);
      setChallengeQuestions(combined);
    }
  }, [selectedUnitId]);

  // Speaking Timer ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSpeakingTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimerValue = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateStreak = (dates: string[]): number => {
    if (!dates || dates.length === 0) return 0;
    const uniqueDates = [...new Set(dates)];
    const sortedDates = uniqueDates.map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
    const formattedDates = sortedDates.map(d => d.toISOString().split('T')[0]);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let currentStreak = 0;
    let checkDate = new Date();
    
    if (!formattedDates.includes(todayStr)) {
      if (formattedDates.includes(yesterdayStr)) {
        checkDate = yesterday;
      } else {
        return 0;
      }
    }
    
    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (formattedDates.includes(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return currentStreak;
  };

  const handleGrammarOption = (qId: number, optionIdx: number) => {
    if (grammarSubmitted) return;
    setGrammarSelection(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleCheckGrammar = () => {
    setGrammarSubmitted(true);
    addTodayToCompleted();
  };

  const calculateGrammarScore = () => {
    let corrected = 0;
    activeUnit.grammar.questions.forEach((q) => {
      if (grammarSelection[q.id] === q.correctAnswer) {
        corrected++;
      }
    });
    return corrected;
  };

  const getDifficultyColor = (diff: string) => {
    const lower = diff.toLowerCase();
    if (lower.includes('b1')) return 'bg-sky-50 text-sky-700 border-sky-100';
    if (lower.includes('b2')) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  // Split reading text into highlighted terms based on vocabulary target word arrays
  const renderReadingTextWithHighlights = (text: string) => {
    const vocabList = activeUnit.vocabulary.items;
    if (!vocabList || vocabList.length === 0) return text;

    // Build regular expression for mapping vocabulary keys inside sentences
    const sortedVocab = [...vocabList].sort((a, b) => b.phrase.length - a.phrase.length);
    let elements: React.ReactNode[] = [];
    let remaining = text;
    let seq = 0;

    const findMatch = (str: string) => {
      for (const v of sortedVocab) {
        const found = str.toLowerCase().indexOf(v.phrase.toLowerCase());
        if (found !== -1) {
          return { ...v, index: found };
        }
      }
      return null;
    };

    const processText = (str: string, index: number): React.ReactNode => {
      const match = findMatch(str);
      if (!match) return <span key={index}>{str}</span>;

      const before = str.slice(0, match.index);
      const matched = str.slice(match.index, match.index + match.phrase.length);
      const after = str.slice(match.index + match.phrase.length);

      return (
        <span key={index}>
          {before}
          <button
            onClick={() => handleSelectWord({
              word: match.phrase,
              definition: match.definition,
              context: `Reading Focus Term from page ${activeUnit.id}`
            })}
            id={`read-hl-${seq++}`}
            className="px-1 py-0.2 rounded bg-emerald-50 text-emerald-800 border-b-2 border-dashed border-emerald-400 hover:bg-emerald-100 hover:text-emerald-950 font-medium transition-all text-sm md:text-base pointer-events-auto cursor-pointer"
            title="Click for definition"
          >
            {matched}
          </button>
          {processText(after, index + match.index + match.phrase.length)}
        </span>
      );
    };

    return processText(remaining, 0);
  };

  const renderOverviewPage = () => {
    const completedCount = PRACTICE_UNITS.filter(unit => isUnitCompleted(unit.id)).length;
    const completedPercent = Math.round((completedCount / 10) * 100);
    const streakCount = calculateStreak(completedDates);

    return (
      <div className="space-y-8 select-none">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Hero Card */}
          <div className="xl:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-[#EBE3E3] shadow-3xs flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-extrabold text-[#8C3A3A] tracking-wider uppercase font-mono">
                Your pathway to MET confidence
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2C241E] tracking-tight leading-tight font-serif">
                A serious preparation space <br className="hidden sm:inline" /> for adult healthcare learners.
              </h2>
              <p className="text-sm sm:text-base text-[#8A7A70] leading-relaxed max-w-2xl font-normal">
                This diagnostic environment helps international nurses and clinicians prepare for the Michigan English Test (MET). Acquire high-yield B2 clinical vocabulary, analyze multi-role transcripts, write structured rubrics, and record interactive audio drills.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              <div className="bg-[#f4f8f8] p-4 rounded-xl border border-[#EBE3E3]/60">
                <span className="block text-2xl font-black text-[#2C241E] font-mono leading-none">{completedPercent}%</span>
                <span className="block text-[10px] text-[#8A7A70] font-bold uppercase mt-2 font-mono">MET Syllabus Progress</span>
              </div>
              <div className="bg-[#f4f8f8] p-4 rounded-xl border border-[#EBE3E3]/60">
                <span className="block text-2xl font-black text-[#8C3A3A] font-mono leading-none">30%</span>
                <span className="block text-[10px] text-[#8A7A70] font-bold uppercase mt-2 font-mono">Healthcare focus</span>
              </div>
              <div className="bg-[#f4f8f8] p-4 rounded-xl border border-[#EBE3E3]/60">
                <span className="block text-2xl font-black text-[#2C241E] font-mono leading-none">58 / 59</span>
                <span className="block text-[10px] text-[#8A7A70] font-bold uppercase mt-2 font-mono">Healthcare Goal</span>
              </div>
              <div className="bg-[#f4f8f8] p-4 rounded-xl border border-[#EBE3E3]/60">
                <span className="block text-2xl font-black text-amber-600 font-mono leading-none">{streakCount} Days</span>
                <span className="block text-[10px] text-[#8A7A70] font-bold uppercase mt-2 font-mono">Study Goal Streak</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar Next Class Card */}
          <div className="xl:col-span-4 bg-[#2C241E] p-6 rounded-2xl border border-white/10 text-white flex flex-col justify-between shadow-md">
            <div>
              <span className="text-[10px] font-extrabold text-[#D4A8A8] tracking-widest uppercase font-mono block mb-3">
                Next Live Training
              </span>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-base leading-snug font-serif">Speaking Q4: Organise Clinical Opinions</h3>
                <p className="text-xs text-stone-300 leading-relaxed font-sans font-normal">
                  Class starts Tuesday, 7:00 PM. Bring one medical, workplace, or patient communication scenario you can deliver in 40-60 seconds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-6 pt-6 border-t border-white/5">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <span className="block text-lg font-black text-white font-mono leading-tight">
                  {PRACTICE_UNITS.length - completedCount}
                </span>
                <span className="block text-[9px] text-[#D4A8A8] font-bold mt-1 uppercase font-mono leading-tight">Units left</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <span className="block text-xs font-semibold text-white leading-tight py-0.5">
                  {feedbackApproved ? 'APPROVED' : 'PENDING'}
                </span>
                <span className="block text-[9px] text-stone-400 font-medium mt-1 uppercase font-mono leading-tight">Feedback</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center flex flex-col justify-center items-center">
                <span className="block text-lg font-black text-amber-400 font-mono leading-tight">
                  {completedDates.includes(new Date().toISOString().split('T')[0]) ? '100' : '0'}%
                </span>
                <span className="block text-[9px] text-stone-400 font-medium mt-1 uppercase font-mono leading-tight">Goal state</span>
              </div>
            </div>
          </div>

        </div>

        {/* Platform Flow Timeline Layout */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-extrabold text-[#2C241E] tracking-tight font-serif">Evidence-Based Clinical Flow</h3>
            <p className="text-xs text-[#8A7A70] font-normal leading-relaxed mt-0.5">
              The platform maintains complete syllabus transparency. We do not inflate progress or simulate test answers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: '1', title: 'Target profiles', desc: 'Define goals before evaluation, such as clinical nurse standards or targeted speaking grades.' },
              { num: '2', title: 'Evidence diagnostics', desc: 'Identify strengths on speaking, writing, and vocabulary with concrete evaluated samples.' },
              { num: '3', title: 'Structured practice', desc: 'Tackle the 10-unit interactive syllabus covering specialized diagnostic quizzes and roleplay audios.' },
              { num: '4', title: 'Instructor verification', desc: 'Approved clinician feedback propagates right into your active student dashboard live.' }
            ].map((step) => (
              <div key={step.num} className="bg-white p-5 rounded-xl border border-[#EBE3E3] shadow-3xs space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#2C241E] text-[#F4ECEC] font-black text-sm flex items-center justify-center font-mono">
                  {step.num}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#2C241E] font-serif">{step.title}</h4>
                  <p className="text-xs text-[#8A7A70] leading-relaxed mt-1 font-sans">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Syllabus deck CTA banner */}
          <div className="bg-white rounded-xl border border-[#EBE3E3] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2.5 bg-[#F4ECEC] text-[#8C3A3A] rounded-lg border border-[#b8dede]">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-[#8C3A3A] uppercase tracking-wider">Are you ready to practice?</p>
                <p className="text-xs text-[#8A7A70] font-normal mt-0.5 font-sans">Explore our intensive practice modules across 10 immersive lessons.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveMainPage('syllabus')}
              className="px-4 py-2 bg-[#2C241E] hover:bg-[#8C3A3A] text-white text-xs font-extrabold rounded-lg transition-all shadow-3xs flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Explore Interactive Units</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentPage = () => {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-[#2C241E] tracking-tight font-serif">Active Clinical Focus</h3>
            <p className="text-xs text-[#8A7A70] font-normal leading-relaxed mt-0.5">
              Personalized instructions assigned specifically for your CEFR proficiency grade
            </p>
          </div>
          <span className="bg-[#EAE0E0]/50 text-[#8C3A3A] border border-[#8C3A3A]/30 text-[10px] font-mono tracking-widest px-2 py-0.5 rounded font-extrabold uppercase select-none">
            {feedbackApproved ? 'Clinician Verified' : 'Standard Baseline'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-[#EBE3E3] shadow-3xs flex flex-col justify-between space-y-4">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-[#8C3A3A] uppercase tracking-wider font-extrabold font-mono block">Today's active focus</span>
              <h3 className="font-extrabold text-base text-[#2C241E] leading-snug font-serif">Organize speaking answers</h3>
              <p className="text-xs text-[#8A7A70] leading-relaxed font-sans">{feedbacks.todayFocus}</p>
            </div>
            <div className="flex gap-2">
              <span className="bg-[#F4ECEC] text-[#8C3A3A] px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded">Speaking</span>
              <span className="bg-stone-100 text-stone-500 px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded">Q4 clinical opinion</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#EBE3E3] shadow-3xs flex flex-col justify-between space-y-4">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-extrabold font-mono block">What is becoming stronger</span>
              <h3 className="font-extrabold text-base text-[#2C241E] leading-snug font-serif">Syntactic structures & evidence</h3>
              <p className="text-xs text-[#8A7A70] leading-relaxed font-sans">{feedbacks.whatIsStronger}</p>
            </div>
            <div>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded">Improving</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#EBE3E3] shadow-3xs flex flex-col justify-between space-y-4">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-amber-600 uppercase tracking-wider font-extrabold font-mono block">Your next step</span>
              <h3 className="font-extrabold text-base text-[#2C241E] leading-snug font-serif">Plan before answering</h3>
              <p className="text-xs text-[#8A7A70] leading-relaxed font-sans">{feedbacks.nextStep}</p>
            </div>
            <div>
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded">Practice target</span>
            </div>
          </div>
        </div>

        {/* Homework tasks section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-extrabold text-[#2C241E] tracking-tight font-serif">Assigned Homework</h3>
            <p className="text-xs text-[#8A7A70] font-normal leading-relaxed mt-0.5">
              Complete these tasks representing active parts of the MET curriculum before your next group clinical brief.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                idx: '1',
                title: 'Timed Speaking Clinical Upgrade',
                desc: `Record a 60-second verbal answer inside the Speeches page using one healthcare example from Unit ${activeUnit.id} and one dynamic linking phrase.`,
                cta: 'Start Speaking Sandbox',
                tab: 'speaking',
                tag: 'Ready'
              },
              {
                idx: '2',
                title: 'Clinical Vocabulary in Context',
                desc: 'Use 8 target healthcare and patient-care terms in short MET-style sentences. Review them within the Vocabulary Studio.',
                cta: 'Open Vocabulary Hub',
                tab: 'vocabulary',
                tag: '15 Min'
              },
              {
                idx: '3',
                title: 'Listening Detail Comprehension Check',
                desc: 'Assess dialogue details and review conversational scripts. Mark correct answers on the dialogue checks.',
                cta: 'View Dialogues Player',
                tab: 'listening',
                tag: 'Evidence pending'
              }
            ].map((hw) => (
              <div key={hw.idx} className="bg-white p-5 rounded-xl border border-[#EBE3E3] shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-[#F4ECEC] text-[#8C3A3A] flex items-center justify-center font-black text-sm font-mono shrink-0 select-none">
                    {hw.idx}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#2C241E] font-serif">{hw.title}</h4>
                    <p className="text-xs text-[#8A7A70] leading-relaxed mt-1 font-sans max-w-2xl">{hw.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase select-none ${
                    hw.tag.toLowerCase().includes('ready')
                      ? 'bg-rose-50 border-rose-200 text-[#8C3A3A]'
                      : hw.tag.toLowerCase().includes('min')
                      ? 'bg-stone-50 border-stone-200 text-stone-500'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    {hw.tag}
                  </span>
                  <button
                    onClick={() => {
                      setActiveMainPage('syllabus');
                      setActiveTab(hw.tab as SkillTab);
                    }}
                    className="px-3.5 py-2 hover:bg-[#EAE0E0]/50 border border-[#EAE0E0] text-[#2C241E] text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer select-none font-mono uppercase"
                  >
                    <span>{hw.cta}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTeacherPage = () => {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left">
            <h3 className="text-lg font-extrabold text-[#2C241E] tracking-tight font-serif">Teacher Diagnostic Console</h3>
            <p className="text-xs text-[#8A7A70] font-normal leading-relaxed mt-0.5">
              Grade diagnostic assessments, observe evidence logs, and tailor student-facing feedback
            </p>
          </div>
          <button
            onClick={() => {
              setFeedbacks({
                todayFocus: editTodayFocus,
                whatIsStronger: editWhatIsStronger,
                nextStep: editNextStep,
                practiceFocus: editPracticeFocus
              });
              setFeedbackApproved(true);
            }}
            className="px-4 py-2 bg-[#8C3A3A] hover:bg-[#6B2B2B] text-white text-xs font-extrabold rounded-xl transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 text-center select-none"
          >
            <CheckSquare className="w-4 h-4 text-[#F4ECEC]" />
            <span>Approve & Publish Feedback</span>
          </button>
        </div>

        {feedbackApproved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-medium font-sans">
              <strong>Approval Success:</strong> Student feedback has been verified and immediately updated in the student achievement dashboard.
            </p>
            <button 
              onClick={() => setFeedbackApproved(false)}
              className="ml-auto font-bold opacity-60 hover:opacity-100 cursor-pointer font-sans"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* Sliders panel */}
          <div className="xl:col-span-6 bg-white p-6 rounded-2xl border border-[#EBE3E3] shadow-sm flex flex-col justify-between space-y-6">
            <div className="text-left">
              <span className="text-[10px] font-extrabold text-[#8C3A3A] tracking-wider uppercase font-mono block mb-4 select-none">
                Clinical Skill Benchmarks (Max 80)
              </span>

              <div className="space-y-5">
                {[
                  {
                    key: 'speaking',
                    label: 'Speaking Organization',
                    val: teacherSpeakingScore,
                    setter: setTeacherSpeakingScore,
                    unit: 'pts'
                  },
                  {
                    key: 'fluency',
                    label: 'Conversational Fluency',
                    val: teacherFluencyScore,
                    setter: setTeacherFluencyScore,
                    unit: 'pts'
                  },
                  {
                    key: 'pronunciation',
                    label: 'Pronunciation Clarity',
                    val: teacherPronunciationScore,
                    setter: setTeacherPronunciationScore,
                    unit: 'pts'
                  },
                  {
                    key: 'writing',
                    label: 'Writing Coherence',
                    val: teacherWritingScore,
                    setter: setTeacherWritingScore,
                    unit: 'pts'
                  }
                ].map((slider) => (
                  <div key={slider.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#2C241E]">
                      <span className="font-bold">{slider.label}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase select-none ${
                        slider.val === 0 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-rose-50 border-rose-100 text-[#8C3A3A]'
                      }`}>
                        {slider.val === 0 ? 'Not Evaluated' : `${slider.val} / 80`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={slider.val}
                        onChange={(e) => slider.setter(parseInt(e.target.value))}
                        className="grow accent-[#8C3A3A] h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FCF9F9] border-l-4 border-[#8C3A3A] p-4 rounded-r-lg space-y-2 mt-4 text-left">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B2B2B] block select-none">Clinician Assessment Logging</span>
              <textarea
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                className="w-full text-xs text-[#3B312A] bg-white border border-[#EAE0E0] rounded p-2.5 leading-relaxed focus:outline-none focus:border-[#8C3A3A] resize-none h-[110px]"
                placeholder="Write private observations or diagnostic notes here..."
              />
            </div>
          </div>

          {/* Feedback previews panel */}
          <div className="xl:col-span-6 bg-white p-6 rounded-2xl border border-[#EBE3E3] shadow-sm space-y-5 text-left">
            <span className="text-[10px] font-extrabold text-[#8C3A3A] tracking-wider uppercase font-mono block select-none">
              Customize Live Student Feedback
            </span>

            <div className="space-y-3.5">
              {[
                { label: "Today's Focus Details", val: editTodayFocus, setter: setEditTodayFocus, placeholder: "Describe what structural skills the student worked on today..." },
                { label: "What is Becoming Stronger", val: editWhatIsStronger, setter: setEditWhatIsStronger, placeholder: "Provide optimistic remarks regarding observed clinical advancements..." },
                { label: "Keep Working on This", val: editNextStep, setter: setEditNextStep, placeholder: "Recommend next steps or organizational practices..." },
                { label: "Practice Focus for Class", val: editPracticeFocus, setter: setEditPracticeFocus, placeholder: "Specify homework instructions aligned to active assignments..." }
              ].map((feedbackField) => (
                <div key={feedbackField.label} className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8A7A70] uppercase tracking-wider font-mono select-none">{feedbackField.label}</label>
                  <textarea
                    value={feedbackField.val}
                    onChange={(e) => {
                      feedbackField.setter(e.target.value);
                    }}
                    className="w-full text-xs text-[#3B312A] p-2 bg-stone-50 rounded border border-stone-205 focus:outline-none focus:border-[#8C3A3A] leading-relaxed resize-none h-[54px]"
                    placeholder={feedbackField.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderProgressPage = () => {
    // Dynamic calculation of vocabulary progress
    const activeVocabListSize = activeUnit.vocabulary.items.length;
    const activeUnitMasteredCount = Object.keys(masteredCards).filter(phrase => masteredCards[phrase]).length;
    const vocabProgressVal = activeVocabListSize > 0 ? Math.min(100, Math.round((activeUnitMasteredCount / activeVocabListSize) * 100)) : 57;

    return (
      <div className="space-y-8">
        <div className="text-left">
          <h3 className="text-lg font-extrabold text-[#2C241E] tracking-tight font-serif">MET English Proficiency scorecard</h3>
          <p className="text-xs text-[#8A7A70] font-normal leading-relaxed mt-0.5">
            Verified evidence logging from active lessons. We do not insert false simulations.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* Progress Card */}
          <div className="xl:col-span-7 bg-white p-6 rounded-2xl border border-[#EBE3E3] shadow-sm space-y-6">
            <span className="text-[10px] font-extrabold text-[#8C3A3A] tracking-wider uppercase font-mono block text-left select-none">
              CEFR Verification Path
            </span>

            <div className="divide-y divide-[#EAE0E0]/20 space-y-4">
              {[
                { label: 'Speaking Proficiency', val: teacherSpeakingScore, max: 80, tag: teacherSpeakingScore >= 50 ? 'Developing' : 'Not Evaluated' },
                { label: 'Writing Coherence', val: teacherWritingScore, max: 80, tag: teacherWritingScore > 0 ? 'Evaluating' : 'Needs samples' },
                { label: 'Listening Comprehension', val: 42, max: 80, tag: 'Building' },
                { label: 'Reading Comprehension', val: 0, max: 80, tag: 'Not evaluated yet' },
                { label: 'Active Vocabulary Mastery', val: vocabProgressVal, max: 100, tag: vocabProgressVal > 0 ? 'Building' : 'Needs reviews' }
              ].map((skillRow) => {
                const percent = Math.round((skillRow.val / skillRow.max) * 100);
                return (
                  <div key={skillRow.label} className="pt-4 first:pt-0 grid grid-cols-1 sm:grid-cols-12 items-center gap-3 text-left">
                    <div className="sm:col-span-4 text-xs font-semibold text-[#2C241E]">
                      {skillRow.label}
                    </div>
                    <div className="sm:col-span-5">
                      <div className="h-2.5 overflow-hidden rounded-full bg-stone-100 border border-stone-200/50 flex">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full bg-[#8C3A3A] rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-3 text-right flex items-center justify-end gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#3B312A] select-none">
                        {percent}%
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border leading-none select-none ${
                        percent === 0 
                          ? 'bg-rose-50 border-rose-100 text-rose-700' 
                          : percent >= 70 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : 'bg-rose-50 border-rose-100 text-[#8C3A3A]'
                      }`}>
                        {skillRow.tag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline of verified student evidence */}
          <div className="xl:col-span-5 bg-white p-6 rounded-2xl border border-[#EBE3E3] shadow-sm space-y-6">
            <span className="text-[10px] font-extrabold text-[#8C3A3A] tracking-wider uppercase font-mono block text-left select-none">
              Recent portfolio evidence timeline
            </span>

            <div className="space-y-4 text-left">
              
              {/* If speakingDraft exists, prepend */}
              {speakingDraft && speakingDraft.trim() !== '' && (
                <div className="grid grid-cols-12 items-start gap-3 border-b border-dashed border-stone-150 pb-3">
                  <div className="col-span-3 text-[10px] font-mono text-[#8A7A70] font-bold uppercase leading-tight select-none">
                    Jun 8, 2026
                  </div>
                  <div className="col-span-9 space-y-1">
                    <p className="font-extrabold text-xs text-[#2C241E]">Speaking Sample Logged</p>
                    <p className="text-[11px] text-[#8C7E77] leading-relaxed italic line-clamp-2">
                      "{speakingDraft}"
                    </p>
                  </div>
                </div>
              )}

              {/* If writingContent exists, prepend */}
              {writingContent && writingContent.trim() !== '' && (
                <div className="grid grid-cols-12 items-start gap-3 border-b border-dashed border-stone-150 pb-3">
                  <div className="col-span-3 text-[10px] font-mono text-[#8A7A70] font-bold uppercase leading-tight select-none">
                    Jun 8, 2026
                  </div>
                  <div className="col-span-9 space-y-1">
                    <p className="font-extrabold text-xs text-[#2C241E]">Essay Composition Submission</p>
                    <p className="text-[11px] text-[#8C7E77] leading-relaxed italic line-clamp-2">
                      "{writingContent}"
                    </p>
                  </div>
                </div>
              )}

              {/* Standard Static Milestones */}
              <div className="grid grid-cols-12 items-start gap-3">
                <div className="col-span-3 text-[10px] font-mono text-[#8A7A70] font-bold uppercase leading-tight select-none">
                  Jun 8, 2026
                </div>
                <div className="col-span-9 space-y-1">
                  <p className="font-extrabold text-xs text-[#2C241E]">Oral Check-in Speaking Dialogue</p>
                  <p className="text-[11px] text-[#8C7E77] leading-relaxed">
                    Student practiced interactive roleplaying with custom room requests on accommodation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-12 items-start gap-3">
                <div className="col-span-3 text-[10px] font-mono text-[#8A7A70] font-bold uppercase leading-tight select-none">
                  Jun 5, 2026
                </div>
                <div className="col-span-9 space-y-1">
                  <p className="font-extrabold text-xs text-[#2C241E]">Homework Review Approved</p>
                  <p className="text-[11px] text-[#8C7E77] leading-relaxed">
                    Clinician confirmed student correctly used healthcare vocabulary in 6 of 8 practice drills.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-12 items-start gap-3">
                <div className="col-span-3 text-[10px] font-mono text-[#8A7A70] font-bold uppercase leading-tight select-none">
                  Jun 1, 2026
                </div>
                <div className="col-span-9 space-y-1">
                  <p className="font-extrabold text-xs text-[#2C241E]">Listening Practice Diagnostic</p>
                  <p className="text-[11px] text-[#8C7E77] leading-relaxed">
                    Evaluation confirmed main idea answers were stronger than detail quizzes with distractors.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderMessagesPage = () => {
    return (
      <div className="space-y-8 select-none">
        <div className="text-left">
          <h3 className="text-lg font-extrabold text-[#2C241E] tracking-tight font-serif">Clinical Announcements & Communications</h3>
          <p className="text-xs text-[#8A7A70] font-normal leading-relaxed mt-0.5">
            Interact with your MET instructor, review study reminders, and keep track of group schedules
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* Message Inbox list */}
          <div className="xl:col-span-7 bg-white p-6 rounded-2xl border border-[#EBE3E3] shadow-sm flex flex-col justify-between h-[450px] space-y-6">
            <div className="space-y-4 text-left font-sans">
              <span className="text-[10px] font-extrabold text-[#8C3A3A] tracking-wider uppercase font-mono block">
                Direct Message Clinician
              </span>

              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-xl text-xs space-y-1 max-w-[85%] ${
                      msg.sender === 'student'
                        ? 'bg-[#F4ECEC]/40 text-[#3B312A] mr-auto border border-[#EAE0E0]/40'
                        : 'bg-[#2C241E] text-white ml-auto'
                    }`}
                  >
                    <p className="font-sans leading-relaxed">{msg.text}</p>
                    <span className="block text-[8px] font-mono opacity-50 text-right mt-1">{msg.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-stone-100 mt-auto">
              <textarea
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type your message for the clinical instructor here..."
                className="w-full text-xs text-[#3B312A] p-2.5 bg-stone-50 border border-[#EAE0E0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8C3A3A] leading-relaxed resize-none h-[64px]"
              />
              <button
                onClick={() => {
                  if (!newMessageText || newMessageText.trim() === '') return;
                  const newMsg = {
                    id: messages.length + 1,
                    sender: 'student' as const,
                    text: newMessageText,
                    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  };
                  setMessages(prev => [...prev, newMsg]);
                  setNewMessageText('');
                }}
                className="w-full py-2 bg-[#8C3A3A] hover:bg-[#6B2B2B] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Send className="w-3.5 h-3.5 shrink-[#2C241E]" />
                <span>Transmit Secure Message</span>
              </button>
            </div>
          </div>

          <div className="xl:col-span-5 flex flex-col gap-6">
            {/* Bulletin Announcements Board */}
            <div className="bg-white p-6 rounded-2xl border border-[#EBE3E3] shadow-sm space-y-4 h-[450px] overflow-hidden flex flex-col">
              <span className="text-[10px] font-extrabold text-[#8C3A3A] tracking-wider uppercase font-mono block mb-2 text-left shrink-0">
                Clinical Bulletin Board
              </span>

              <div className="space-y-4 overflow-y-auto pr-1 text-left flex-grow scrollbar-thin">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-4 bg-stone-50/50 rounded-xl border border-stone-205/60 space-y-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-1.5 bg-[#F4ECEC] text-[#8C3A3A] rounded text-[8px] font-mono uppercase tracking-widest font-black select-none">
                        Tip
                      </div>
                      <strong className="text-xs text-[#2C241E] font-extrabold block">{ann.title}</strong>
                    </div>
                    <p className="text-[11px] text-[#8A7A70] leading-relaxed font-sans">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="xl:col-span-12 mt-2">
            <PeerDiscussion unitId={selectedUnitId} />
          </div>

        </div>
      </div>
    );
  };

  const renderCalendarPage = () => {
    return (
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm col-span-12 xl:col-span-12">
        <CalendarViewer />
      </div>
    );
  };

  return (
    <div id="full-dashboard-layout" className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between selection:bg-emerald-100 selection:text-[#2C241E] font-sans">
      
      {/* Dynamic Master Top Navigation Header - Dedicated MET Proficiency Study Hub */}
      <header className="bg-white border-b border-[#EAE0E0]/50 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2C241E] flex items-center justify-center text-white font-sans shadow-md">
              <span className="font-extrabold text-base tracking-tighter">MET</span>
            </div>
            <div className="text-left">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-stone-950 flex items-center gap-1.5 leading-none font-serif">
                MET Proficiency Mastery <span className="bg-[#F4ECEC] text-[10px] text-[#8C3A3A] border border-[#EAE0E0]/60 px-2 py-0.5 rounded-full font-mono font-bold uppercase">Clinician Portal</span>
              </h1>
              <p className="text-[10px] text-stone-400 font-mono mt-1 uppercase tracking-wider font-semibold">Interactive Michigan English Test Preparation</p>
            </div>
          </div>

          {/* Master Top Page Navigator */}
          <div className="flex items-center gap-0.5 bg-stone-100/80 p-1 rounded-xl border border-stone-200/50 max-w-full overflow-x-auto select-none no-scrollbar">
            {[
              { id: 'overview', label: 'Welcome', icon: Home },
              { id: 'syllabus', label: '10-Unit Syllabus', icon: BookOpen },
              { id: 'student', label: 'Focus Board', icon: User },
              { id: 'teacher', label: 'Clinical Feedback', icon: Clipboard },
              { id: 'progress', label: 'Proficiency Score', icon: Activity },
              { id: 'messages', label: 'Message Board', icon: MessageSquare },
              { id: 'calendar', label: 'Calendar', icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeMainPage === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainPage(tab.id as MainPage)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold font-sans flex items-center gap-1.5 transition-all select-none whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#2C241E] text-white shadow-xs'
                      : 'text-[#8A7A70] hover:text-[#2C241E] hover:bg-stone-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#F4ECEC]' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          <div className="hidden xl:flex items-center gap-3">
            <button
              onClick={handleDownloadSummary}
              id="download-study-summary-btn"
              className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-97 select-none font-mono uppercase"
              title="Download your learned vocabulary and completed drafts"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" /> Export Portfolio
            </button>
          </div>
        </div>
      </header>

      {/* Main Contents container */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-grow flex flex-col">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMainPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="w-full flex-grow flex flex-col"
          >
            {activeMainPage === 'overview' && renderOverviewPage()}
            {activeMainPage === 'student' && renderStudentPage()}
            {activeMainPage === 'teacher' && renderTeacherPage()}
            {activeMainPage === 'progress' && renderProgressPage()}
            {activeMainPage === 'messages' && renderMessagesPage()}
            {activeMainPage === 'calendar' && renderCalendarPage()}

            {activeMainPage === 'syllabus' && (
              <>
        
        {/* Step Rail: 10 units carousel */}
        <section className="mb-8" id="unit-selection-header">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="p-1 px-2.5 bg-stone-100 text-stone-500 rounded border border-stone-200/50 text-[10px] font-mono uppercase tracking-widest font-extrabold select-none">
                Units 1 - 10
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 font-mono font-serif">Curriculum Syllabus Deck</h2>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-grow sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input 
                  type="text"
                  placeholder="Search themes or grammar..."
                  value={syllabusSearchQuery}
                  onChange={(e) => setSyllabusSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-stone-200 outline-none transition-all font-sans"
                />
              </div>
              <button
                onClick={() => {
                  const completedIds = PRACTICE_UNITS.filter(u => isUnitCompleted(u.id)).map(u => u.id);
                  exportSyllabusPDF(completedIds);
                }}
                className="px-3 py-1.5 shrink-0 text-[10px] font-bold text-stone-600 bg-white border border-stone-200 shadow-sm rounded flex items-center gap-1.5 hover:bg-stone-50 transition-colors uppercase tracking-wider font-mono"
              >
                <FileDown className="w-3.5 h-3.5" /> Export
              </button>
            </div>
            <span className="text-[10px] text-stone-400 font-mono hidden lg:inline uppercase tracking-wider font-bold shrink-0 ml-4">Left-Right swipe to explore</span>
          </div>

          {/* Syllabus Completion Dashboard Panel */}
          {(() => {
            const completedCount = PRACTICE_UNITS.filter(unit => isUnitCompleted(unit.id)).length;
            const radius = 24;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (completedCount / 10) * circumference;

            const calculateStreak = (dates: string[]): number => {
              if (!dates || dates.length === 0) return 0;
              const uniqueDates = [...new Set(dates)];
              const sortedDates = uniqueDates.map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
              const formattedDates = sortedDates.map(d => d.toISOString().split('T')[0]);
              
              const todayStr = new Date().toISOString().split('T')[0];
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              
              let currentStreak = 0;
              let checkDate = new Date();
              
              if (!formattedDates.includes(todayStr)) {
                if (formattedDates.includes(yesterdayStr)) {
                  checkDate = yesterday;
                } else {
                  return 0;
                }
              }
              
              while (true) {
                const checkStr = checkDate.toISOString().split('T')[0];
                if (formattedDates.includes(checkStr)) {
                  currentStreak++;
                  checkDate.setDate(checkDate.getDate() - 1);
                } else {
                  break;
                }
              }
              
              return currentStreak;
            };

            const streakCount = calculateStreak(completedDates);
            const isTodayStudied = completedDates.includes(new Date().toISOString().split('T')[0]);

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Clean Circular Progress Card */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-3xs">
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-14 h-14 transform -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        className="stroke-stone-100 fill-none"
                        strokeWidth="4"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        className="stroke-emerald-500 fill-none transition-all duration-300"
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-[11px] font-extrabold text-stone-800 font-mono">
                      {Math.round((completedCount / 10) * 100)}%
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-extrabold text-[#2C241E] uppercase tracking-wider font-mono font-serif">Syllabus Completion</h4>
                    <p className="text-lg font-bold text-stone-900 leading-tight">
                      {completedCount} / 10 Units
                    </p>
                    <p className="text-[10px] text-stone-400 font-mono font-bold mt-0.5 uppercase">Study Portfolio Goal</p>
                  </div>
                </div>

                {/* Days Studied Streak Counter */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-3xs">
                  <div className="w-12 h-14 flex items-center justify-center shrink-0 relative bg-stone-50/50 rounded-xl border border-stone-100">
                    <Flame className={`w-8 h-8 ${isTodayStudied ? 'text-amber-500 fill-amber-300 animate-pulse' : 'text-stone-300 fill-stone-100'}`} />
                    {isTodayStudied && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-extrabold text-[#2C241E] uppercase tracking-wider font-mono font-serif">Daily Study Streak</h4>
                    <p className="text-lg font-bold text-stone-900 leading-tight">
                      {streakCount} {streakCount === 1 ? 'Day' : 'Days'}
                    </p>
                    <p className={`text-[10px] font-bold font-mono mt-0.5 uppercase ${isTodayStudied ? 'text-emerald-600' : 'text-stone-400'}`}>
                      {isTodayStudied ? '✓ Today Complete' : '• Goal Pending'}
                    </p>
                  </div>
                </div>

                {/* Heatmap Grid Card */}
                <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-3xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <h4 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider font-mono font-serif">Syllabus Grid Heatmap</h4>
                    </div>
                    <div className="flex gap-2.5 text-[8px] font-mono text-stone-400 font-bold uppercase select-none">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-stone-100 border border-stone-200 inline-block" /> Incomplete
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-emerald-500 inline-block" /> Completed
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {(() => {
                      const filteredUnitsForGrid = PRACTICE_UNITS.filter(unit => 
                        syllabusSearchQuery.trim() === '' || 
                        unit.theme.toLowerCase().includes(syllabusSearchQuery.toLowerCase()) || 
                        (unit.grammar && unit.grammar.focus && unit.grammar.focus.toLowerCase().includes(syllabusSearchQuery.toLowerCase())) ||
                        unit.id.toString().includes(syllabusSearchQuery)
                      );
                      
                      return PRACTICE_UNITS.map((unit) => {
                      const isComplete = isUnitCompleted(unit.id);
                      const isSelected = unit.id === selectedUnitId;
                      const isFilteredOut = syllabusSearchQuery.trim() !== '' && !filteredUnitsForGrid.some(u => u.id === unit.id);
                      return (
                        <button
                          key={`heatmap-unit-${unit.id}`}
                          onClick={() => setSelectedUnitId(unit.id)}
                          className={`h-9 flex flex-col items-center justify-center rounded-lg font-mono transition-all relative group cursor-pointer ${
                            isComplete
                              ? (isFilteredOut ? 'bg-emerald-200 text-emerald-800 opacity-50 border-0' : 'bg-emerald-500 hover:bg-emerald-600 text-white border-0')
                              : (isFilteredOut ? 'bg-stone-50 text-stone-300 border border-stone-200/30 opacity-50' : 'bg-stone-50 hover:bg-stone-100 text-stone-500 border border-stone-200/60')
                          } ${
                            isSelected && !isFilteredOut
                              ? 'ring-2 ring-stone-800 font-black scale-102 shadow-2xs' 
                              : (isFilteredOut ? '' : 'font-semibold')
                          }`}
                        >
                          <span className="text-xs">{unit.id}</span>
                          
                          {/* Rich Interactive Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -transtone-x-1/2 mb-2 hidden group-hover:block z-30 w-52 bg-stone-900/95 text-white text-[10px] p-2.5 rounded-xl shadow-md font-sans pointer-events-none leading-snug">
                            <p className="font-extrabold text-[8px] text-[#D4A8A8] mb-0.5 font-mono uppercase tracking-wider">Unit {unit.id} • {unit.difficulty}</p>
                            <p className="font-bold line-clamp-1 mb-1">{unit.reading.title}</p>
                            <p className="text-[9px] text-stone-400 italic">Theme: {unit.theme}</p>
                            <div className="mt-1.5 pt-1.5 border-t border-stone-800/80 flex items-center justify-between text-[8px] font-mono uppercase font-bold text-stone-300">
                              <span>Status:</span>
                              <span className={isComplete ? 'text-emerald-400' : 'text-stone-400'}>
                                {isComplete ? '✓ COMPLETED' : '• INCOMPLETE'}
                              </span>
                            </div>
                            <div className="absolute top-full left-1/2 transform -transtone-x-1/2 border-4 border-transparent border-t-stone-900" />
                          </div>
                        </button>
                      );
                      });
                    })()}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex items-stretch gap-3 overflow-x-auto pb-4 pt-1 snap-x select-none custom-scrollbar scroll-smooth">
            {(() => {
              const filteredUnits = PRACTICE_UNITS.filter(unit => 
                syllabusSearchQuery.trim() === '' || 
                unit.theme.toLowerCase().includes(syllabusSearchQuery.toLowerCase()) || 
                (unit.grammar && unit.grammar.focus && unit.grammar.focus.toLowerCase().includes(syllabusSearchQuery.toLowerCase())) ||
                unit.id.toString().includes(syllabusSearchQuery)
              );

              if (filteredUnits.length === 0) {
                return (
                  <div className="w-full p-8 flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                    <p className="text-xs text-stone-400 font-mono italic max-w-sm text-center">
                      No matching syllabus units found for "{syllabusSearchQuery}".
                    </p>
                  </div>
                );
              }

              return filteredUnits.map((unit) => {
              const matchesSelected = unit.id === selectedUnitId;
              return (
                <button
                  key={unit.id}
                  onClick={() => setSelectedUnitId(unit.id)}
                  id={`unit-card-trigger-${unit.id}`}
                  className={`snap-start shrink-0 w-[240px] p-4 text-left rounded-xl border transition-all cursor-pointer ${
                    matchesSelected 
                      ? 'bg-white border-stone-900 shadow-sm ring-1 ring-stone-900' 
                      : 'bg-white hover:bg-stone-50/50 border-stone-200 hover:border-stone-350'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-mono font-extrabold tracking-widest text-stone-400 uppercase">Unit {unit.id}</span>
                    <span className={`text-[9px] font-semibold font-mono tracking-wider px-2 py-0.5 rounded border ${getDifficultyColor(unit.difficulty)}`}>
                      {unit.difficulty}
                    </span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm tracking-tight text-ellipsis overflow-hidden whitespace-nowrap mb-1 font-serif">
                    {unit.reading.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-stone-100">
                    <p className="text-[11px] text-stone-500 font-sans line-clamp-1">
                      Theme: {unit.theme}
                    </p>
                    <span className="text-[10px] font-mono font-bold text-stone-500 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-stone-400" /> ~{calculateEstimatedTime(unit)}m
                    </span>
                  </div>
                </button>
              );
            });
          })()}
          </div>
        </section>

        {/* Selected Unit Metadata Showcase */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-3xs" id="active-unit-banner">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-stone-100 text-stone-700 font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded border border-stone-200">
                ACTIVE UNIT {activeUnit.id}
              </span>
              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getDifficultyColor(activeUnit.difficulty)}`}>
                {activeUnit.difficulty}
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-stone-950 mb-1 font-serif">
              {activeUnit.title}
            </h2>
            <p className="text-semibold text-stone-500 text-xs md:text-sm leading-relaxed max-w-4xl">
              Focus Theme: {activeUnit.theme} • Strengthen lexical and oral capability using targeted B1+/B2 English structures.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap w-full md:w-auto">
            {/* Completion Toggle Button */}
            <button
              onClick={() => {
                if (!isUnitCompleted(activeUnit.id)) {
                  setReflectionModalOpen({ isOpen: true, unitId: activeUnit.id });
                  setCurrentReflectionDraft(studentReflections[activeUnit.id] || '');
                } else {
                  setManuallyCompletedUnits(prev => ({
                    ...prev,
                    [activeUnit.id]: false
                  }));
                }
              }}
              className={`px-3.5 py-2 text-[11px] rounded-xl border font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-97 w-full sm:w-auto font-mono uppercase ${
                isUnitCompleted(activeUnit.id)
                  ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                  : 'bg-white hover:bg-stone-50 text-stone-500 hover:text-stone-800 border-stone-200/80 shadow-2xs'
              }`}
              title="Click to toggle completion status of this unit"
            >
              <CheckCircle className={`w-4 h-4 ${isUnitCompleted(activeUnit.id) ? 'text-emerald-600 fill-emerald-100' : 'text-stone-400'}`} />
              {isUnitCompleted(activeUnit.id) ? 'Unit Completed!' : 'Mark Completed'}
            </button>

            <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 self-stretch md:self-auto justify-center w-full sm:w-auto">
              <GraduationCap className="w-5 h-5 text-stone-400 shrink-0" />
              <div className="text-left font-mono text-[10px] leading-tight">
                <p className="text-stone-400 uppercase tracking-widest font-extrabold pb-0.5">Grammar Focus</p>
                <p className="text-stone-700 font-bold max-w-[170px] truncate">{activeUnit.grammar.focus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Display student reflection if present and unit is completed */}
        <AnimatePresence>
          {isUnitCompleted(activeUnit.id) && studentReflections[activeUnit.id] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-emerald-800">
                <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs uppercase tracking-wider font-mono text-emerald-700 mb-1 font-serif">Your Unit Reflection</h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{studentReflections[activeUnit.id]}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Activity Stage Split */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Navigation Pills (7 stages selection) - Rails col 1 to 3 */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <span className="text-[9px] font-mono font-extrabold tracking-widest text-stone-400 uppercase px-2 mb-1">STAGES AND SKILLS</span>
            
            <div className="space-y-1.5 flex flex-col sm:grid sm:grid-cols-4 sm:gap-2 lg:flex lg:flex-col">
              {[
                { key: 'listening', title: '📻 Oral Dialogues', desc: 'Recitation & Speech' },
                { key: 'reading', title: '📖 Passage Reading', desc: 'Scanning & Analysis' },
                { key: 'vocabulary', title: '📚 Vocabulary Hub', desc: 'Word Association' },
                { key: 'grammar', title: '✏️ Grammar Drills', desc: 'Interactive workout' },
                { key: 'levelup', title: '🚀 Sentence Level-Up', desc: 'B1 ➔ B2 Academic lift' },
                { key: 'speaking', title: '🎙️ Speech Sandbox', desc: 'Situation Roleplay' },
                { key: 'writing', title: '📝 Essay Composition', desc: 'Task check-lists' },
                { key: 'challenge', title: '🏆 Final Challenge', desc: 'Mixed unit quiz' }
              ].map((pill) => {
                const isSelected = activeTab === pill.key;
                return (
                  <button
                    key={pill.key}
                    onClick={() => setActiveTab(pill.key as SkillTab)}
                    id={`stage-tab-trigger-${pill.key}`}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:items-center sm:text-center lg:items-start lg:text-left justify-center ${
                      isSelected
                        ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span className="font-semibold text-xs leading-snug sm:text-[11px] lg:text-xs">
                      {pill.title}
                    </span>
                    <span className={`text-[10px] sm:text-[9px] lg:text-[10px] font-mono mt-0.5 ${
                      isSelected ? 'text-stone-300' : 'text-stone-400'
                    }`}>
                      {pill.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Pedagogue Notes Banner */}
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 mt-4 hidden lg:block leading-relaxed">
              <div className="flex items-center gap-1.5 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" /> Classroom Guidelines
              </div>
              <p className="text-stone-650 text-[11px] leading-normal italic font-sans text-stone-600">
                {activeTab === 'listening' && activeUnit.vocabulary.teachingNote}
                {activeTab === 'reading' && activeUnit.reading.teachingNote}
                {activeTab === 'vocabulary' && activeUnit.vocabulary.teachingNote}
                {activeTab === 'grammar' && "Practice structural gaps and context alignment using common CEFR structures. Each error contains explanatory guidelines."}
                {activeTab === 'levelup' && "Observe sentence evolution. Level up structures from B1 to professional B2 and C1 grades using precise transitional markers."}
                {activeTab === 'speaking' && activeUnit.speaking.teachingNote}
                {activeTab === 'writing' && activeUnit.writing.teachingNote}
                {activeTab === 'challenge' && "Test your unit comprehension with a mixed sample of listening, reading, and grammar drills."}
              </p>
            </div>
          </div>

          {/* Right Core Action Studio Area - Rails col 4 to 12 */}
          <div className="lg:col-span-9 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedUnitId}-${activeTab}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.16 }}
                className="h-full flex flex-col"
              >
                
                {/* 1. Listening Stage container */}
                {activeTab === 'listening' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch flex-grow">
                    
                    {/* dialogue layout */}
                    <div className="xl:col-span-7 flex flex-col">
                      <DialoguePlayer
                        roleMode={roleMode}
                        setRoleMode={setRoleMode}
                        onSelectWord={handleSelectWord}
                        script={activeUnit.listening.script}
                      />
                    </div>

                    {/* listening questions layout */}
                    <div className="xl:col-span-5 flex flex-col">
                      <QuizSection 
                        questions={activeUnit.listening.questions} 
                        topicTitle="Listening Assessment Check"
                      />
                    </div>

                  </div>
                )}

                {/* 2. Reading Stage container */}
                {activeTab === 'reading' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch flex-grow">
                    
                    {/* reading passage text */}
                    <div className="xl:col-span-7 flex flex-col bg-white rounded-2xl border border-stone-200 p-6 justify-between shadow-3xs">
                      <div>
                        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
                          <div className="flex items-center gap-2">
                            <div className="p-2.5 bg-stone-50 text-stone-600 border border-stone-200/50 rounded-full">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-stone-900 tracking-tight text-sm md:text-base font-serif">{activeUnit.reading.title}</h3>
                              <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest font-bold">Focus: {activeUnit.reading.focus}</p>
                            </div>
                          </div>
                        </div>

                        {/* Passage box */}
                        <div className="p-5 sm:p-6 bg-stone-50/50 rounded-xl border border-stone-200/80 leading-relaxed text-stone-700 text-sm md:text-base font-sans font-normal relative mb-6">
                          <span className="absolute left-4 top-4 font-sans text-3xl uppercase text-stone-200 select-none font-bold">"</span>
                          <div className="pl-4 prose prose-slate">
                            {renderReadingTextWithHighlights(activeUnit.reading.text)}
                          </div>
                          
                          {/* Highlight hints banner */}
                          <div className="mt-6 flex items-start gap-2.5 bg-white p-3 rounded-lg border border-stone-200/50 text-[11px] text-stone-500">
                            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong>Target Vocabulary:</strong> Highlighted words in the passage indicate core lexical target terms of the Unit. Select any to examine them inside the Vocabulary Studio!</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-stone-100 text-[10px] text-stone-400 font-mono tracking-wider flex items-center justify-between uppercase font-bold select-none">
                        <span>Academic task: reading comprehension</span>
                        <span>CEFR level: {activeUnit.reading.difficulty}</span>
                      </div>
                    </div>

                    {/* reading comprehension questions layout */}
                    <div className="xl:col-span-5 flex flex-col">
                      <QuizSection 
                        questions={activeUnit.reading.questions} 
                        topicTitle="Reading Comprehension Drill"
                      />
                    </div>

                  </div>
                )}

                {/* 3. Vocabulary Stage Container */}
                {activeTab === 'vocabulary' && (
                  <div className="flex-grow">
                    <VocabularyViewer
                      selectedWord={selectedWord}
                      onClearSelected={() => setSelectedWord(null)}
                      vocabularyList={activeUnit.vocabulary.items}
                      matchingGame={activeUnit.vocabulary.matchingGame}
                      unitId={activeUnit.id}
                      masteredCards={masteredCards}
                      setMasteredCards={setMasteredCards}
                      allUnits={PRACTICE_UNITS}
                    />
                  </div>
                )}

                {/* 4. Grammar workout drill space */}
                {activeTab === 'grammar' && (
                  <div className="space-y-6 flex-grow flex flex-col justify-between h-full">
                    {/* Grammar Subtab Navigator */}
                    <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-3 gap-2 select-none">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-orange-500" />
                        <div>
                          <h3 className="font-semibold text-stone-900 tracking-tight text-xs md:text-sm font-serif">Grammar Workspace</h3>
                          <p className="text-[9px] text-stone-400 font-mono uppercase tracking-widest font-bold">Linguistic Conditioning & Syntax Assessment</p>
                        </div>
                      </div>

                      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-xs border border-stone-200/40">
                        <button
                          onClick={() => setGrammarSubTab('drills')}
                          id="btn-subtab-drills"
                          className={`px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
                            grammarSubTab === 'drills' ? 'bg-white text-stone-900 shadow-3xs font-semibold' : 'text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          Grammar Gap Drills
                        </button>
                        <button
                          onClick={() => setGrammarSubTab('doctor')}
                          id="btn-subtab-doctor"
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium cursor-pointer ${
                            grammarSubTab === 'doctor' ? 'bg-white text-stone-900 shadow-3xs font-semibold' : 'text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Error Analysis
                        </button>
                      </div>
                    </div>

                    {grammarSubTab === 'drills' ? (
                      <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between h-full shadow-3xs">
                        <div>
                          {/* Section Header */}
                          <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2.5 bg-stone-50 text-stone-600 border border-stone-200/50 rounded-full">
                                <CheckSquare className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-stone-900 tracking-tight text-sm md:text-base font-serif">{activeUnit.grammar.title}</h3>
                                <p className="text-[9px] text-stone-400 font-mono uppercase tracking-widest font-bold">Interactive Grammar Gap drills</p>
                              </div>
                            </div>

                            <div className="text-[10px] font-mono text-stone-400 font-bold bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              Focus: {activeUnit.grammar.focus}
                            </div>
                          </div>

                          {/* Rule block explanation */}
                          <div className="mb-6 p-4 bg-stone-50 border border-stone-200 rounded-xl leading-relaxed">
                            <h4 className="text-xs font-bold font-mono text-stone-400 uppercase tracking-widest mb-1 font-serif">Target Linguistic Rule</h4>
                            <p className="text-stone-800 text-xs sm:text-sm font-medium">{activeUnit.grammar.title}</p>
                            
                            <div className="mt-3.5 space-y-2">
                              <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wider block font-semibold">Example Phrasings:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {activeUnit.grammar.examples && activeUnit.grammar.examples.map((ex, i) => (
                                  <div key={i} className="flex items-start gap-2 px-3 py-2 bg-white rounded-lg border border-stone-150 text-[11px] text-stone-705 text-stone-600 font-sans italic">
                                    <span className="text-emerald-500 font-bold font-mono">✓</span> "{ex}"
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Diagnostic Grammar trial sentences */}
                          <div className="space-y-6">
                            {activeUnit.grammar.questions.map((q, questIdx) => {
                              const isSelectionCorrect = grammarSelection[q.id] === q.correctAnswer;
                              
                              return (
                                <div key={q.id} className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-stone-100 text-stone-700 font-mono text-[9px] px-2 py-0.5 rounded font-bold">
                                      STRETCH {questIdx + 1}
                                    </span>
                                    {grammarSubmitted && (
                                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                        isSelectionCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                      }`}>
                                        {isSelectionCorrect ? 'Correct' : 'Incorrect'}
                                      </span>
                                    )}
                                  </div>

                                  <p className="font-semibold text-stone-800 text-sm md:text-base leading-relaxed">
                                    {q.sentence}
                                  </p>

                                  {/* Radio choices list structure */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {q.options.map((opt, optIdx) => {
                                      const matchesSelected = grammarSelection[q.id] === optIdx;
                                      const isCorrectOption = optIdx === q.correctAnswer;

                                      let classes = 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50';
                                      if (grammarSubmitted) {
                                        if (isCorrectOption) {
                                          classes = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold cursor-not-allowed';
                                        } else if (matchesSelected) {
                                          classes = 'bg-rose-50 border-rose-400 text-rose-950 cursor-not-allowed';
                                        } else {
                                          classes = 'bg-stone-50/50 border-stone-100 text-stone-400 cursor-not-allowed opacity-50';
                                        }
                                      } else if (matchesSelected) {
                                        classes = 'bg-stone-900 border-stone-900 text-white font-semibold';
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          onClick={() => handleGrammarOption(q.id, optIdx)}
                                          disabled={grammarSubmitted}
                                          className={`p-2.5 text-xs text-center rounded-xl border transition-all cursor-pointer ${classes}`}
                                        >
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Explanation block on submission check */}
                                  <AnimatePresence>
                                    {grammarSubmitted && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className={`p-3 rounded-lg text-[11px] leading-relaxed border ${
                                          isSelectionCorrect 
                                            ? 'bg-emerald-50/40 border-emerald-100 text-emerald-900'
                                            : 'bg-stone-50 border-stone-200 text-stone-650'
                                        }`}
                                      >
                                        <div className="font-bold flex items-center gap-1 uppercase font-mono tracking-wider text-[9px] mb-1">
                                          <Lightbulb className="w-3.5 h-3.5 text-stone-400 shrink-0" /> Explanatory Clue
                                        </div>
                                        {q.explanation}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>

                        </div>

                        {/* Footer Action board */}
                        <div className="mt-8 pt-5 border-t border-stone-150 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            {grammarSubmitted ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-stone-400 uppercase tracking-widest font-bold">Result Evaluated:</span>
                                <span className="text-sm font-bold text-stone-900">
                                  {calculateGrammarScore()} / {activeUnit.grammar.questions.length} Correct Matches
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-stone-400 italic">Select an option for each sentence to confirm your answers.</p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {grammarSubmitted && (
                              <button
                                onClick={() => {
                                  setGrammarSelection({});
                                  setGrammarSubmitted(false);
                                }}
                                className="px-4.5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Retake Exercises
                              </button>
                            )}

                            <button
                              onClick={handleCheckGrammar}
                              disabled={grammarSubmitted || Object.keys(grammarSelection).length < activeUnit.grammar.questions.length}
                              className="px-5 py-2.5 bg-stone-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-850 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Check My Answers
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-grow">
                        <GrammarDoctor unitId={activeUnit.id} />
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Sentence Level-Up Studio */}
                {activeTab === 'levelup' && (
                  <div className="flex-grow">
                    <SentenceLevelUp unitId={selectedUnitId} />
                  </div>
                )}

                {/* 6. Timed Timely timed timed Speaking Sandbox */}
                {activeTab === 'speaking' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch flex-grow">
                    
                    {/* Left details pane info */}
                    <div className="xl:col-span-7 flex flex-col bg-white rounded-xl border border-stone-200 p-6 shadow-3xs justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
                          <div className="flex items-center gap-2">
                            <div className="p-2.5 bg-stone-50 text-stone-600 border border-stone-200/50 rounded-full">
                              <Mic className="w-4 h-4 text-stone-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-stone-900 tracking-tight text-sm md:text-base font-serif">{activeUnit.speaking.title}</h3>
                              <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest font-bold">Linguistic Scenario Setup</p>
                            </div>
                          </div>
                        </div>

                        {/* Speech situation body context */}
                        <div className="space-y-4 font-sans">
                          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/60 text-stone-700 text-sm leading-relaxed">
                            <span className="font-bold text-stone-900 block mb-1 text-xs font-mono uppercase tracking-widest">Active Setup Context:</span>
                            {activeUnit.speaking.setup}
                          </div>

                          <div className="p-4 bg-stone-100/30 rounded-xl border border-stone-150 text-stone-700 text-xs sm:text-sm leading-relaxed space-y-2">
                            <span className="font-bold text-stone-900 block text-xs font-mono uppercase tracking-widest">Target Core Instructions:</span>
                            <p className="italic">{activeUnit.speaking.instructions}</p>
                            <p className="text-stone-400 font-mono text-[10px] uppercase font-bold text-left pt-2">Recommended speaking time Target: {activeUnit.speaking.timing}</p>
                          </div>

                          {/* Follow-up expansion exercises */}
                          <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-2">
                            <span className="font-bold text-stone-900 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5">
                              <Clipboard className="w-3.5 h-3.5 text-emerald-600" /> Discussion Prompts
                            </span>
                            <ul className="space-y-1 text-xs text-stone-700 leading-normal pl-4 list-decimal">
                              {activeUnit.speaking.followUp && activeUnit.speaking.followUp.map((fl, i) => (
                                <li key={i}>{fl}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-6 border-t border-stone-100 flex justify-between items-center text-[10px] text-stone-405 text-stone-400 font-mono uppercase tracking-wider font-semibold select-none">
                        <span>Task Focus: timing & oral monologue fluency</span>
                        <span>CEFR Stage Check: B1-B2 Target</span>
                      </div>
                    </div>

                    {/* Right interactive stopwatch + spoken evaluation playground */}
                    <div className="xl:col-span-5 flex flex-col bg-white rounded-xl border border-stone-200 p-6 shadow-3xs space-y-6">
                      
                      {/* Timer Bento */}
                      <div className="bg-stone-900 text-white rounded-xl p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 font-extrabold block">Stopwatch Timer</span>
                          <span className="text-2xl font-extrabold font-mono tracking-wide">{formatTimerValue(speakingTimer)}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            className={`p-2 rounded-lg text-xs font-bold font-mono uppercase tracking-widest cursor-pointer transition-all ${
                              isTimerRunning
                                ? 'bg-amber-600 text-white'
                                : 'bg-white text-stone-950 hover:bg-stone-100'
                            }`}
                          >
                            {isTimerRunning ? 'Pause' : 'Start Timer'}
                          </button>
                          
                          <button
                            onClick={() => {
                              setIsTimerRunning(false);
                              setSpeakingTimer(0);
                            }}
                            className="p-2 border border-stone-700 hover:bg-stone-800 rounded-lg text-xs font-bold text-stone-300 font-mono cursor-pointer transition-colors"
                            title="Reset stopwatch"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Linguistic checklist: phrases you should target */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs font-mono uppercase tracking-widest text-stone-400">Target Language structures Target:</span>
                          <span className="text-[10px] text-emerald-600 font-mono uppercase tracking-widest font-bold">Checkbox Target Match</span>
                        </div>

                        <div className="space-y-1.5">
                          {activeUnit.speaking.targetLanguage && activeUnit.speaking.targetLanguage.map((trg) => {
                            const isChecked = checkedTargetPhrases[trg];
                            return (
                              <button
                                key={trg}
                                onClick={() => setCheckedTargetPhrases(p => ({ ...p, [trg]: !isChecked }))}
                                id={`target-check-btn-${trg}`}
                                className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900 font-medium'
                                    : 'bg-stone-50 border-stone-150 text-stone-700 hover:bg-stone-105'
                                }`}
                              >
                                <span className={isChecked ? 'line-through opacity-75' : ''}>{trg}</span>
                                <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center font-bold text-[10px] ${
                                  isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-stone-300'
                                }`}>
                                  {isChecked && '✓'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Monologue transcription pad */}
                      <div className="space-y-3 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs font-mono uppercase tracking-widest text-stone-400">Transcription Sandbox</span>
                            <span className="text-[10px] text-stone-450 italic text-stone-400">Write your recitation for coach assessment</span>
                          </div>
                          
                          <textarea
                            value={speakingDraft}
                            onChange={(e) => handleSpeakingChange(e.target.value)}
                            placeholder="Type or draft your oral response here to activate lexical grading, or recite aloud and tick off the checklists above!"
                            className="w-full h-[120px] p-3 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 text-stone-800 leading-relaxed font-sans placeholder:text-stone-400 resize-none"
                          />
                        </div>

                        {/* Grading box */}
                        <AnimatePresence>
                          {speakingSubmitted && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl text-[11px] leading-relaxed text-emerald-950 space-y-1.5"
                            >
                              <div className="font-bold flex items-center gap-1.5 uppercase font-mono tracking-wider text-[9px] text-emerald-800">
                                <Award className="w-4 h-4 text-emerald-600" /> Interactive Oral Evaluation
                              </div>
                              <p className="text-stone-700 italic">"Lexical assessment complete. Grammatical structures look accurate. Excellent alignment with checked target phrases: **{Object.keys(checkedTargetPhrases).filter(k => checkedTargetPhrases[k]).length}** successfully verified."</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          onClick={() => {
                            setSpeakingSubmitted(true);
                            addTodayToCompleted();
                          }}
                          disabled={!speakingDraft}
                          className="w-full py-2.5 mt-2 bg-stone-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-850 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <GraduationCap className="w-4 h-4" /> Evaluate Speech Lexicon
                        </button>
                      </div>

                    </div>

                  </div>
                )}

                {/* 6. Writing Stage Essay composition */}
                {activeTab === 'writing' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch flex-grow">
                    
                    {/* Left text Prompt details */}
                    <div className="xl:col-span-7 flex flex-col bg-white rounded-xl border border-stone-200 p-6 shadow-3xs justify-between">
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
                          <div className="flex items-center gap-2">
                            <div className="p-2.5 bg-stone-50 text-stone-600 border border-stone-200/50 rounded-full">
                              <Edit3 className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-stone-900 tracking-tight text-sm md:text-base font-serif">{activeUnit.writing.title}</h3>
                              <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest font-bold">Linguistic Genre: {activeUnit.writing.genre}</p>
                            </div>
                          </div>

                          <div className="text-[10px] font-mono text-stone-700 font-bold bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 select-none">
                            COUNT: {activeUnit.writing.wordCount}
                          </div>
                        </div>

                        {/* Prompt Body */}
                        <div className="space-y-5">
                          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-stone-700 text-sm md:text-base leading-relaxed font-sans font-normal relative">
                            <span className="absolute left-4 top-4 font-sans text-3xl uppercase text-stone-200 select-none font-bold">"</span>
                            <p className="pl-4 italic text-stone-800">{activeUnit.writing.prompt}</p>
                          </div>

                          {/* Pedagogic Checklist progress triggers */}
                          <div className="p-4 bg-stone-100/30 rounded-xl border border-stone-150 space-y-3">
                            <span className="font-bold text-stone-900 text-xs font-mono uppercase tracking-widest block">Structural Writing Checklists and Rubric Criteria:</span>
                            
                            <div className="space-y-1.5">
                              {activeUnit.writing.criteria && activeUnit.writing.criteria.map((ct) => {
                                const isChecked = checkedCriteria[ct];
                                return (
                                  <button
                                    key={ct}
                                    onClick={() => setCheckedCriteria(p => ({ ...p, [ct]: !isChecked }))}
                                    id={`criteria-check-${ct}`}
                                    className={`w-full text-left p-2 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${
                                      isChecked
                                        ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900 font-medium'
                                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                                    }`}
                                  >
                                    <span className={isChecked ? 'line-through opacity-75' : ''}>{ct}</span>
                                    <span className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center font-bold text-[9px] ${
                                      isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-stone-300'
                                    }`}>
                                      {isChecked && '✓'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-stone-100 text-[10px] text-stone-400 font-mono tracking-wider uppercase flex items-center justify-between font-bold select-none mt-6">
                        <span>Task Focus: composition style & essay structure</span>
                        <span>CEFR level: {activeUnit.writing.difficulty}</span>
                      </div>
                    </div>

                    {/* Right text box composition interface */}
                    <div className="xl:col-span-5 flex flex-col bg-white rounded-xl border border-stone-200 p-6 shadow-3xs space-y-6">
                      
                      {/* Writing Board */}
                      <div className="space-y-3 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs font-mono uppercase tracking-widest text-stone-400">Your Composition Board</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={toggleRecording}
                                className={`text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                                  isRecordingWriting 
                                    ? 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200' 
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                                }`}
                                title="Click to dictate your essay"
                              >
                                <Mic className={`w-3 h-3 ${isRecordingWriting ? 'animate-pulse' : ''}`} />
                                {isRecordingWriting ? 'RECORDING...' : 'RECORD'}
                              </button>
                              <span className="text-[10px] text-stone-450 font-mono text-stone-400">
                                WORDS: <strong>{writingContent.trim() === '' ? 0 : writingContent.trim().split(/\s+/).length}</strong>
                              </span>
                            </div>
                          </div>

                          <textarea
                            value={writingContent}
                            onChange={(e) => handleWritingChange(e.target.value)}
                            placeholder="Draft your essay response here. Pay attention to vocabulary density, paragraph groupings, and checked rubric elements in the left panel..."
                            className="w-full h-[220px] p-3 text-xs sm:text-sm bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 text-stone-800 leading-relaxed font-sans placeholder:text-stone-400 resize-none"
                          />

                          <AnimatePresence>
                            {writingSubmitted[activeUnit.id] && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl text-[11px] leading-relaxed text-emerald-950 space-y-1 mt-2"
                              >
                                <div className="font-bold flex items-center gap-1.5 uppercase font-mono tracking-wider text-[9px] text-emerald-800">
                                  <Award className="w-4 h-4 text-emerald-600" /> Essay Submission Tracked
                                </div>
                                <p className="text-stone-700 italic">"Your writing draft has been validated and added to your portfolio. Today's active learning progress is successfully logged to your study streak!"</p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button
                            onClick={() => {
                              setWritingSubmitted(prev => ({ ...prev, [activeUnit.id]: true }));
                              addTodayToCompleted();
                            }}
                            disabled={!writingContent || writingContent.trim() === ''}
                            className="w-full py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <CheckSquare className="w-4 h-4" /> Submit Essay & Log Daily Goal
                          </button>
                        </div>

                        {/* Reveal native reference essay */}
                        <div className="space-y-2 pt-2">
                          <button
                            onClick={() => setShowSampleWriting(!showSampleWriting)}
                            id="reveal-mentor-essay-trigger"
                            className="w-full py-2 bg-stone-105 hover:bg-stone-100 border border-stone-200 text-stone-700/80 hover:text-stone-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            {showSampleWriting ? 'Hide Teacher Reference Essay' : 'Reveal Native Writer Model Essay'}
                          </button>

                          <AnimatePresence>
                            {showSampleWriting && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-emerald-50/20 border border-emerald-100/80 rounded-xl text-xs leading-relaxed text-stone-700 font-sans space-y-2 mt-2"
                              >
                                <span className="font-bold text-emerald-800 font-mono text-[9px] uppercase tracking-wider block">Pedagogic Model Sample response:</span>
                                <p className="italic leading-relaxed whitespace-pre-line text-stone-700">
                                  {activeUnit.writing.teachingNote ? `Teacher Annotation: ${activeUnit.writing.teachingNote}\n\n` : ''}
                                  "With the rapid pace of modern careers, checking digital feeds immediately upon waking creates high mental loads. Many professionals face digital inundation that compromises early concentration. A healthier alternative is replacing digital activity with light stretches, deep breathing, and brief reflection, grounding morning energy beautifully."
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* 7. Final Challenge Tab */}
                {activeTab === 'challenge' && (
                  <div className="flex-grow">
                    <QuizSection 
                      questions={challengeQuestions} 
                      topicTitle="Unit Final Challenge"
                    />
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

        </main>

              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Global Curriculum Tracker stamp */}
        <footer className="mt-12 p-5 bg-white border border-stone-200 rounded-2xl max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-3xs">
          <div className="p-2.5 bg-stone-50 text-stone-600 rounded-xl border border-stone-100/80 shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider font-mono font-serif">Curriculum Syllabus Overview</h4>
            <p className="text-stone-500 text-xs leading-relaxed mt-1">
              Currently navigating <strong>Unit {selectedUnitId}</strong> of 10 complete interactive lifestyle-guided English modules. Choose other units in the syllabus tray to study hotel check-ins, transit, workplace briefs, sustainable shopping, and remote routines.
            </p>
          </div>
        </footer>

      </div>

      {/* Unit Completion Reflection Modal */}
      <AnimatePresence>
        {reflectionModalOpen.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-stone-100"
            >
              <div className="p-5 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                <h3 className="font-bold text-stone-900 flex items-center gap-2 font-serif">
                  <CheckSquare className="w-5 h-5 text-orange-500" />
                  Unit Reflection
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-stone-600">
                  Before marking Unit {reflectionModalOpen.unitId} complete, briefly note your performance, any challenges you faced, or points you want to remember:
                </p>
                <textarea
                  value={currentReflectionDraft}
                  onChange={(e) => setCurrentReflectionDraft(e.target.value)}
                  placeholder="E.g., I struggled with the present perfect tense today, but the speaking drill helped me understand it better..."
                  className="w-full h-32 p-3 text-sm bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 resize-none outline-none transition-all placeholder:text-stone-300"
                />
              </div>
              <div className="p-5 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
                <button
                  onClick={() => setReflectionModalOpen({ isOpen: false, unitId: null })}
                  className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-200/50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const id = reflectionModalOpen.unitId;
                    if (id !== null) {
                      setStudentReflections(prev => ({ ...prev, [id]: currentReflectionDraft }));
                      setManuallyCompletedUnits(prev => ({ ...prev, [id]: true }));
                    }
                    setReflectionModalOpen({ isOpen: false, unitId: null });
                  }}
                  className="px-4 py-2 text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  Save & Complete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer copyright and license tag */}
      <footer className="py-6 border-t border-stone-150 bg-white text-center text-[10px] text-stone-400 font-mono flex items-center justify-center gap-1.5">
        <span>Lifestyle English Pack v2.4</span>
        <span>•</span>
        <span>CEFR Interactive Studio</span>
        <span>•</span>
        <Heart className="w-3 h-3 text-red-300 animate-pulse fill-red-200" />
      </footer>

    </div>
  );
}
