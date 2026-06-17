import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, HelpCircle, Sparkles, MessageSquare, 
  Layers, Coffee, Sun, ChevronRight, CheckCircle, Info, Heart,
  Mic, User, Clipboard, ListTodo, Award, FileText, CheckSquare,
  Compass, RefreshCw, Zap, Bookmark, Star, GraduationCap, ChevronLeft,
  Volume2, Lightbulb, Play, RotateCcw, AlertCircle, Edit3, Activity
} from 'lucide-react';
import DialoguePlayer from './components/DialoguePlayer';
import VocabularyViewer from './components/VocabularyViewer';
import QuizSection from './components/QuizSection';
import SentenceLevelUp from './components/SentenceLevelUp';
import GrammarDoctor from './components/GrammarDoctor';
import { RoleMode, PracticeUnit, QuizQuestion } from './types';
import { PRACTICE_UNITS } from './data';

type SkillTab = 'listening' | 'reading' | 'vocabulary' | 'grammar' | 'speaking' | 'writing' | 'levelup';

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
    setSpeakingDraft('');
    setSpeakingSubmitted(false);
    setWritingContent('');
    setCheckedCriteria({});
    setShowSampleWriting(false);
    setRoleMode('all');
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

  const handleGrammarOption = (qId: number, optionIdx: number) => {
    if (grammarSubmitted) return;
    setGrammarSelection(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleCheckGrammar = () => {
    setGrammarSubmitted(true);
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

  return (
    <div id="full-dashboard-layout" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-950 font-sans">
      
      {/* Dynamic Master Top Navigation Header */}
      <header className="bg-white border-b border-rose-100/5 sm:border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-serif shadow-xs">
              <span className="font-bold text-lg font-sans">L</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-950 flex items-center gap-1.5 leading-none">
                Lifestyle English Practice <span className="bg-emerald-50 text-[10px] text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full font-mono font-medium tracking-wide uppercase">Cocurriculum Studio</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-wider">Multi-Unit Interactive Adaptive Suite</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden md:block">
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Active Session Score</p>
              <p className="text-xs font-semibold text-slate-805">Academic Level: CEFR Portfolio</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Contents container */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-grow flex flex-col">
        
        {/* Step Rail: 10 units carousel */}
        <section className="mb-8" id="unit-selection-header">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="p-1 px-2.5 bg-slate-100 text-slate-500 rounded border border-slate-200/50 text-[10px] font-mono uppercase tracking-widest font-extrabold select-none">
                Units 1 - 10
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Curriculum Syllabus Deck</h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline uppercase tracking-wider font-bold">Left-Right swipe/scroll to explore all units</span>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto pb-4 pt-1 snap-x select-none custom-scrollbar scroll-smooth">
            {PRACTICE_UNITS.map((unit) => {
              const matchesSelected = unit.id === selectedUnitId;
              return (
                <button
                  key={unit.id}
                  onClick={() => setSelectedUnitId(unit.id)}
                  id={`unit-card-trigger-${unit.id}`}
                  className={`snap-start shrink-0 w-[240px] p-4 text-left rounded-xl border transition-all cursor-pointer ${
                    matchesSelected 
                      ? 'bg-white border-slate-900 shadow-sm ring-1 ring-slate-900' 
                      : 'bg-white hover:bg-slate-50/50 border-slate-200 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-mono font-extrabold tracking-widest text-slate-400 uppercase">Unit {unit.id}</span>
                    <span className={`text-[9px] font-semibold font-mono tracking-wider px-2 py-0.5 rounded border ${getDifficultyColor(unit.difficulty)}`}>
                      {unit.difficulty}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight text-ellipsis overflow-hidden whitespace-nowrap mb-1">
                    {unit.reading.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans line-clamp-1">
                    Theme: {unit.theme}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected Unit Metadata Showcase */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-3xs" id="active-unit-banner">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-slate-100 text-slate-700 font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded border border-slate-200">
                ACTIVE UNIT {activeUnit.id}
              </span>
              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getDifficultyColor(activeUnit.difficulty)}`}>
                {activeUnit.difficulty}
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 mb-1">
              {activeUnit.title}
            </h2>
            <p className="text-semibold text-slate-500 text-xs md:text-sm leading-relaxed max-w-4xl">
              Focus Theme: {activeUnit.theme} • Strengthen lexical and oral capability using targeted B1+/B2 English structures.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 self-stretch md:self-auto justify-center">
            <GraduationCap className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="text-left font-mono text-[10px] leading-tight">
              <p className="text-slate-400 uppercase tracking-widest font-extrabold">Grammar Focus</p>
              <p className="text-slate-700 font-bold max-w-[170px] truncate">{activeUnit.grammar.focus}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Activity Stage Split */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Navigation Pills (7 stages selection) - Rails col 1 to 3 */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <span className="text-[9px] font-mono font-extrabold tracking-widest text-slate-400 uppercase px-2 mb-1">STAGES AND SKILLS</span>
            
            <div className="space-y-1.5 flex flex-col sm:grid sm:grid-cols-4 sm:gap-2 lg:flex lg:flex-col">
              {[
                { key: 'listening', title: '📻 Oral Dialogues', desc: 'Recitation & Speech' },
                { key: 'reading', title: '📖 Passage Reading', desc: 'Scanning & Analysis' },
                { key: 'vocabulary', title: '📚 Vocabulary Hub', desc: 'Word Association' },
                { key: 'grammar', title: '✏️ Grammar Drills', desc: 'Interactive workout' },
                { key: 'levelup', title: '🚀 Sentence Level-Up', desc: 'B1 ➔ B2 Academic lift' },
                { key: 'speaking', title: '🎙️ Speech Sandbox', desc: 'Situation Roleplay' },
                { key: 'writing', title: '📝 Essay Composition', desc: 'Task check-lists' }
              ].map((pill) => {
                const isSelected = activeTab === pill.key;
                return (
                  <button
                    key={pill.key}
                    onClick={() => setActiveTab(pill.key as SkillTab)}
                    id={`stage-tab-trigger-${pill.key}`}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:items-center sm:text-center lg:items-start lg:text-left justify-center ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="font-semibold text-xs leading-snug sm:text-[11px] lg:text-xs">
                      {pill.title}
                    </span>
                    <span className={`text-[10px] sm:text-[9px] lg:text-[10px] font-mono mt-0.5 ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
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
              <p className="text-slate-650 text-[11px] leading-normal italic font-sans text-slate-600">
                {activeTab === 'listening' && activeUnit.vocabulary.teachingNote}
                {activeTab === 'reading' && activeUnit.reading.teachingNote}
                {activeTab === 'vocabulary' && activeUnit.vocabulary.teachingNote}
                {activeTab === 'grammar' && "Practice structural gaps and context alignment using common CEFR structures. Each error contains explanatory guidelines."}
                {activeTab === 'levelup' && "Observe sentence evolution. Level up structures from B1 to professional B2 and C1 grades using precise transitional markers."}
                {activeTab === 'speaking' && activeUnit.speaking.teachingNote}
                {activeTab === 'writing' && activeUnit.writing.teachingNote}
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
                    <div className="xl:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 p-6 justify-between shadow-3xs">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                          <div className="flex items-center gap-2">
                            <div className="p-2.5 bg-slate-50 text-slate-600 border border-slate-200/50 rounded-full">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 tracking-tight text-sm md:text-base">{activeUnit.reading.title}</h3>
                              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">Focus: {activeUnit.reading.focus}</p>
                            </div>
                          </div>
                        </div>

                        {/* Passage box */}
                        <div className="p-5 sm:p-6 bg-slate-50/50 rounded-xl border border-slate-200/80 leading-relaxed text-slate-700 text-sm md:text-base font-sans font-normal relative mb-6">
                          <span className="absolute left-4 top-4 font-serif text-3xl uppercase text-slate-200 select-none font-bold">"</span>
                          <div className="pl-4 prose prose-slate">
                            {renderReadingTextWithHighlights(activeUnit.reading.text)}
                          </div>
                          
                          {/* Highlight hints banner */}
                          <div className="mt-6 flex items-start gap-2.5 bg-white p-3 rounded-lg border border-slate-200/50 text-[11px] text-slate-500">
                            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong>Target Vocabulary:</strong> Highlighted words in the passage indicate core lexical target terms of the Unit. Select any to examine them inside the Vocabulary Studio!</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-mono tracking-wider flex items-center justify-between uppercase font-bold select-none">
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
                    />
                  </div>
                )}

                {/* 4. Grammar workout drill space */}
                {activeTab === 'grammar' && (
                  <div className="space-y-6 flex-grow flex flex-col justify-between h-full">
                    {/* Grammar Subtab Navigator */}
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2 select-none">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-indigo-500" />
                        <div>
                          <h3 className="font-semibold text-slate-900 tracking-tight text-xs md:text-sm">Grammar Workspace</h3>
                          <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest font-bold">Linguistic Conditioning & Syntax Assessment</p>
                        </div>
                      </div>

                      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs border border-slate-200/40">
                        <button
                          onClick={() => setGrammarSubTab('drills')}
                          id="btn-subtab-drills"
                          className={`px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
                            grammarSubTab === 'drills' ? 'bg-white text-slate-900 shadow-3xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Grammar Gap Drills
                        </button>
                        <button
                          onClick={() => setGrammarSubTab('doctor')}
                          id="btn-subtab-doctor"
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium cursor-pointer ${
                            grammarSubTab === 'doctor' ? 'bg-white text-slate-900 shadow-3xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Error Analysis
                        </button>
                      </div>
                    </div>

                    {grammarSubTab === 'drills' ? (
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between h-full shadow-3xs">
                        <div>
                          {/* Section Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2.5 bg-slate-50 text-slate-600 border border-slate-200/50 rounded-full">
                                <CheckSquare className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900 tracking-tight text-sm md:text-base">{activeUnit.grammar.title}</h3>
                                <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest font-bold">Interactive Grammar Gap drills</p>
                              </div>
                            </div>

                            <div className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              Focus: {activeUnit.grammar.focus}
                            </div>
                          </div>

                          {/* Rule block explanation */}
                          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed">
                            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest mb-1">Target Linguistic Rule</h4>
                            <p className="text-slate-800 text-xs sm:text-sm font-medium">{activeUnit.grammar.title}</p>
                            
                            <div className="mt-3.5 space-y-2">
                              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">Example Phrasings:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {activeUnit.grammar.examples && activeUnit.grammar.examples.map((ex, i) => (
                                  <div key={i} className="flex items-start gap-2 px-3 py-2 bg-white rounded-lg border border-slate-150 text-[11px] text-slate-705 text-slate-600 font-sans italic">
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
                                <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-slate-100 text-slate-700 font-mono text-[9px] px-2 py-0.5 rounded font-bold">
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

                                  <p className="font-semibold text-slate-800 text-sm md:text-base leading-relaxed">
                                    {q.sentence}
                                  </p>

                                  {/* Radio choices list structure */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {q.options.map((opt, optIdx) => {
                                      const matchesSelected = grammarSelection[q.id] === optIdx;
                                      const isCorrectOption = optIdx === q.correctAnswer;

                                      let classes = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                                      if (grammarSubmitted) {
                                        if (isCorrectOption) {
                                          classes = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold cursor-not-allowed';
                                        } else if (matchesSelected) {
                                          classes = 'bg-rose-50 border-rose-400 text-rose-950 cursor-not-allowed';
                                        } else {
                                          classes = 'bg-slate-50/50 border-slate-100 text-slate-400 cursor-not-allowed opacity-50';
                                        }
                                      } else if (matchesSelected) {
                                        classes = 'bg-slate-900 border-slate-900 text-white font-semibold';
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
                                            : 'bg-slate-50 border-slate-200 text-slate-650'
                                        }`}
                                      >
                                        <div className="font-bold flex items-center gap-1 uppercase font-mono tracking-wider text-[9px] mb-1">
                                          <Lightbulb className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Explanatory Clue
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
                        <div className="mt-8 pt-5 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            {grammarSubmitted ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">Result Evaluated:</span>
                                <span className="text-sm font-bold text-slate-900">
                                  {calculateGrammarScore()} / {activeUnit.grammar.questions.length} Correct Matches
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">Select an option for each sentence to confirm your answers.</p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {grammarSubmitted && (
                              <button
                                onClick={() => {
                                  setGrammarSelection({});
                                  setGrammarSubmitted(false);
                                }}
                                className="px-4.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Retake Exercises
                              </button>
                            )}

                            <button
                              onClick={handleCheckGrammar}
                              disabled={grammarSubmitted || Object.keys(grammarSelection).length < activeUnit.grammar.questions.length}
                              className="px-5 py-2.5 bg-slate-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-850 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
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
                    <div className="xl:col-span-7 flex flex-col bg-white rounded-xl border border-slate-200 p-6 shadow-3xs justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                          <div className="flex items-center gap-2">
                            <div className="p-2.5 bg-slate-50 text-slate-600 border border-slate-200/50 rounded-full">
                              <Mic className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 tracking-tight text-sm md:text-base">{activeUnit.speaking.title}</h3>
                              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">Linguistic Scenario Setup</p>
                            </div>
                          </div>
                        </div>

                        {/* Speech situation body context */}
                        <div className="space-y-4 font-sans">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-slate-700 text-sm leading-relaxed">
                            <span className="font-bold text-slate-900 block mb-1 text-xs font-mono uppercase tracking-widest">Active Setup Context:</span>
                            {activeUnit.speaking.setup}
                          </div>

                          <div className="p-4 bg-slate-100/30 rounded-xl border border-slate-150 text-slate-700 text-xs sm:text-sm leading-relaxed space-y-2">
                            <span className="font-bold text-slate-900 block text-xs font-mono uppercase tracking-widest">Target Core Instructions:</span>
                            <p className="italic">{activeUnit.speaking.instructions}</p>
                            <p className="text-slate-400 font-mono text-[10px] uppercase font-bold text-left pt-2">Recommended speaking time Target: {activeUnit.speaking.timing}</p>
                          </div>

                          {/* Follow-up expansion exercises */}
                          <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-2">
                            <span className="font-bold text-slate-900 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5">
                              <Clipboard className="w-3.5 h-3.5 text-emerald-600" /> Discussion Prompts
                            </span>
                            <ul className="space-y-1 text-xs text-slate-700 leading-normal pl-4 list-decimal">
                              {activeUnit.speaking.followUp && activeUnit.speaking.followUp.map((fl, i) => (
                                <li key={i}>{fl}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-405 text-slate-400 font-mono uppercase tracking-wider font-semibold select-none">
                        <span>Task Focus: timing & oral monologue fluency</span>
                        <span>CEFR Stage Check: B1-B2 Target</span>
                      </div>
                    </div>

                    {/* Right interactive stopwatch + spoken evaluation playground */}
                    <div className="xl:col-span-5 flex flex-col bg-white rounded-xl border border-slate-200 p-6 shadow-3xs space-y-6">
                      
                      {/* Timer Bento */}
                      <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-extrabold block">Stopwatch Timer</span>
                          <span className="text-2xl font-extrabold font-mono tracking-wide">{formatTimerValue(speakingTimer)}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            className={`p-2 rounded-lg text-xs font-bold font-mono uppercase tracking-widest cursor-pointer transition-all ${
                              isTimerRunning
                                ? 'bg-amber-600 text-white'
                                : 'bg-white text-slate-950 hover:bg-slate-100'
                            }`}
                          >
                            {isTimerRunning ? 'Pause' : 'Start Timer'}
                          </button>
                          
                          <button
                            onClick={() => {
                              setIsTimerRunning(false);
                              setSpeakingTimer(0);
                            }}
                            className="p-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 font-mono cursor-pointer transition-colors"
                            title="Reset stopwatch"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Linguistic checklist: phrases you should target */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs font-mono uppercase tracking-widest text-slate-400">Target Language structures Target:</span>
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
                                    : 'bg-slate-50 border-slate-150 text-slate-700 hover:bg-slate-105'
                                }`}
                              >
                                <span className={isChecked ? 'line-through opacity-75' : ''}>{trg}</span>
                                <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center font-bold text-[10px] ${
                                  isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'
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
                            <span className="font-bold text-xs font-mono uppercase tracking-widest text-slate-400">Transcription Sandbox</span>
                            <span className="text-[10px] text-slate-450 italic text-slate-400">Write your recitation for coach assessment</span>
                          </div>
                          
                          <textarea
                            value={speakingDraft}
                            onChange={(e) => setSpeakingDraft(e.target.value)}
                            placeholder="Type or draft your oral response here to activate lexical grading, or recite aloud and tick off the checklists above!"
                            className="w-full h-[120px] p-3 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 leading-relaxed font-sans placeholder:text-slate-400 resize-none"
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
                              <p className="text-slate-700 italic">"Lexical assessment complete. Grammatical structures look accurate. Excellent alignment with checked target phrases: **{Object.keys(checkedTargetPhrases).filter(k => checkedTargetPhrases[k]).length}** successfully verified."</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          onClick={() => setSpeakingSubmitted(true)}
                          disabled={!speakingDraft}
                          className="w-full py-2.5 mt-2 bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-850 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
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
                    <div className="xl:col-span-7 flex flex-col bg-white rounded-xl border border-slate-200 p-6 shadow-3xs justify-between">
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                          <div className="flex items-center gap-2">
                            <div className="p-2.5 bg-slate-50 text-slate-600 border border-slate-200/50 rounded-full">
                              <Edit3 className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 tracking-tight text-sm md:text-base">{activeUnit.writing.title}</h3>
                              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">Linguistic Genre: {activeUnit.writing.genre}</p>
                            </div>
                          </div>

                          <div className="text-[10px] font-mono text-slate-700 font-bold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 select-none">
                            COUNT: {activeUnit.writing.wordCount}
                          </div>
                        </div>

                        {/* Prompt Body */}
                        <div className="space-y-5">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-sm md:text-base leading-relaxed font-sans font-normal relative">
                            <span className="absolute left-4 top-4 font-serif text-3xl uppercase text-slate-200 select-none font-bold">"</span>
                            <p className="pl-4 italic text-slate-800">{activeUnit.writing.prompt}</p>
                          </div>

                          {/* Pedagogic Checklist progress triggers */}
                          <div className="p-4 bg-slate-100/30 rounded-xl border border-slate-150 space-y-3">
                            <span className="font-bold text-slate-900 text-xs font-mono uppercase tracking-widest block">Structural Writing Checklists and Rubric Criteria:</span>
                            
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
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className={isChecked ? 'line-through opacity-75' : ''}>{ct}</span>
                                    <span className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center font-bold text-[9px] ${
                                      isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'
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

                      <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center justify-between font-bold select-none mt-6">
                        <span>Task Focus: composition style & essay structure</span>
                        <span>CEFR level: {activeUnit.writing.difficulty}</span>
                      </div>
                    </div>

                    {/* Right text box composition interface */}
                    <div className="xl:col-span-5 flex flex-col bg-white rounded-xl border border-slate-200 p-6 shadow-3xs space-y-6">
                      
                      {/* Writing Board */}
                      <div className="space-y-3 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs font-mono uppercase tracking-widest text-slate-400">Your Composition Board</span>
                            <span className="text-[10px] text-slate-450 font-mono text-slate-400">
                              WORDS: <strong>{writingContent.trim() === '' ? 0 : writingContent.trim().split(/\s+/).length}</strong>
                            </span>
                          </div>

                          <textarea
                            value={writingContent}
                            onChange={(e) => setWritingContent(e.target.value)}
                            placeholder="Draft your essay response here. Pay attention to vocabulary density, paragraph groupings, and checked rubric elements in the left panel..."
                            className="w-full h-[220px] p-3 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 leading-relaxed font-sans placeholder:text-slate-400 resize-none"
                          />
                        </div>

                        {/* Reveal native reference essay */}
                        <div className="space-y-2 pt-2">
                          <button
                            onClick={() => setShowSampleWriting(!showSampleWriting)}
                            id="reveal-mentor-essay-trigger"
                            className="w-full py-2 bg-slate-105 hover:bg-slate-100 border border-slate-200 text-slate-700/80 hover:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {showSampleWriting ? 'Hide Teacher Reference Essay' : 'Reveal Native Writer Model Essay'}
                          </button>

                          <AnimatePresence>
                            {showSampleWriting && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-emerald-50/20 border border-emerald-100/80 rounded-xl text-xs leading-relaxed text-slate-700 font-sans space-y-2 mt-2"
                              >
                                <span className="font-bold text-emerald-800 font-mono text-[9px] uppercase tracking-wider block">Pedagogic Model Sample response:</span>
                                <p className="italic leading-relaxed whitespace-pre-line text-slate-700">
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

              </motion.div>
            </AnimatePresence>
          </div>

        </main>

        {/* Global Curriculum Tracker stamp */}
        <footer className="mt-12 p-5 bg-white border border-slate-200 rounded-2xl max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-3xs">
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-100/80 shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider font-mono">Curriculum Syllabus Overview</h4>
            <p className="text-slate-500 text-xs leading-relaxed mt-1">
              Currently navigating <strong>Unit {selectedUnitId}</strong> of 10 complete interactive lifestyle-guided English modules. Choose other units in the syllabus tray to study hotel check-ins, transit, workplace briefs, sustainable shopping, and remote routines.
            </p>
          </div>
        </footer>

      </div>

      {/* Footer copyright and license tag */}
      <footer className="py-6 border-t border-slate-150 bg-white text-center text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1.5">
        <span>Lifestyle English Pack v2.4</span>
        <span>•</span>
        <span>CEFR Interactive Studio</span>
        <span>•</span>
        <Heart className="w-3 h-3 text-red-300 animate-pulse fill-red-200" />
      </footer>

    </div>
  );
}
