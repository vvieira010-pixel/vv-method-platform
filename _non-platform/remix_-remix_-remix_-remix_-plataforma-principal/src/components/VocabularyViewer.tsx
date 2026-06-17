import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Smile, Sparkles, CheckCircle, RotateCcw, Award, Info, Layers, ChevronLeft, ChevronRight, RefreshCw, Compass, Volume2, Search } from 'lucide-react';
import { VocabularyItem, PracticeUnit } from '../types';
import { VOCABULARY_SWAPPER_DATA, SwapperChallenge } from '../data/vocabularySwapperData';

interface VocabularyViewerProps {
  selectedWord: { word: string; definition: string; context: string } | null;
  onClearSelected: () => void;
  vocabularyList: VocabularyItem[];
  matchingGame: { phrase: string; definition: string }[];
  unitId?: number; // Passed from parent state
  masteredCards: { [key: string]: boolean };
  setMasteredCards: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  allUnits?: PracticeUnit[];
}

export default function VocabularyViewer({ 
  selectedWord, 
  onClearSelected, 
  vocabularyList, 
  matchingGame,
  unitId = 1,
  masteredCards,
  setMasteredCards,
  allUnits = []
}: VocabularyViewerProps) {
  // Matching mini-game states
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  const [selectedMatchPhrase, setSelectedMatchPhrase] = useState<string | null>(null);
  const [selectedMatchDef, setSelectedMatchDef] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]); // list of phrases matched
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  // Synonym Swapper States
  const [swappedWords, setSwappedWords] = useState<{ [key: string]: string }>({});
  const [selectedSimpleWord, setSelectedSimpleWord] = useState<string | null>(null);
  const [swapperFeedback, setSwapperFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [swapperMistakes, setSwapperMistakes] = useState(0);

  // Layout states (All phrases vs Flashcards vs Game vs Synonym Swapper)
  const [activeTab, setActiveTab] = useState<'list' | 'flashcards' | 'game' | 'swapper' | 'quiz'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMastery, setFilterMastery] = useState<'all' | 'mastered' | 'unmastered'>('all');
  const [filterScope, setFilterScope] = useState<'current' | 'all'>('current');

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [flashcardList, setFlashcardList] = useState<VocabularyItem[]>([]);

  const toggleFlip = () => {
    setIsCardFlipped(prev => !prev);
  };

  const speakText = (text: string) => {
    if (!text) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser.');
    }
  };

  const shuffleFlashcards = () => {
    setFlashcardList(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
  };

  const resetFlashcards = () => {
    setFlashcardList([...vocabularyList]);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setMasteredCards(prev => {
      const next = { ...prev };
      vocabularyList.forEach(item => {
        delete next[item.phrase];
      });
      return next;
    });
  };

  // Pre-cached shuffled items for the matching game
  const [shuffledPhrases, setShuffledPhrases] = useState<string[]>([]);
  const [shuffledDefs, setShuffledDefs] = useState<string[]>([]);

  // Flashcard Quiz States
  const [quizQuestions, setQuizQuestions] = useState<{ query: string; type: 'phrase_to_def' | 'def_to_phrase'; options: string[]; answer: string }[]>([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; selected: string } | null>(null);

  const startQuiz = () => {
    if (!vocabularyList || vocabularyList.length === 0) return;
    const questions = [...vocabularyList].sort(() => Math.random() - 0.5).slice(0, Math.min(5, vocabularyList.length)).map(item => {
       const isPhraseToDef = Math.random() > 0.5;
       const wrongOptions = vocabularyList
         .filter(v => v.phrase !== item.phrase)
         .sort(() => Math.random() - 0.5)
         .slice(0, 3)
         .map(v => isPhraseToDef ? v.definition : v.phrase);
         
       const answer = isPhraseToDef ? item.definition : item.phrase;
       const options = [...wrongOptions, answer].sort(() => Math.random() - 0.5);
       
       return {
         query: isPhraseToDef ? item.phrase : item.definition,
         type: (isPhraseToDef ? 'phrase_to_def' : 'def_to_phrase') as 'phrase_to_def' | 'def_to_phrase',
         options,
         answer
       };
    });
    setQuizQuestions(questions);
    setQuizCurrentIndex(0);
    setQuizScore(0);
    setQuizCompleted(false);
    setQuizFeedback(null);
    setActiveTab('quiz');
  };

  const handleQuizAnswer = (option: string) => {
    if (quizFeedback) return;
    const isCorrect = option === quizQuestions[quizCurrentIndex].answer;
    if (isCorrect) setQuizScore(prev => prev + 1);
    
    setQuizFeedback({ isCorrect, selected: option });
    
    setTimeout(() => {
       setQuizFeedback(null);
       if (quizCurrentIndex + 1 < quizQuestions.length) {
         setQuizCurrentIndex(prev => prev + 1);
       } else {
         setQuizCompleted(true);
       }
    }, 1200);
  };

  // Automatically reset states when vocabulary lists/unitId change
  useEffect(() => {
    setActiveTab('list');
    setIsPlayingGame(false);
    setSelectedMatchPhrase(null);
    setSelectedMatchDef(null);
    setMatchedPairs([]);
    setFailedAttempts(0);
    setGameWon(false);

    // Reset Swapper
    setSwappedWords({});
    setSelectedSimpleWord(null);
    setSwapperFeedback(null);
    setSwapperMistakes(0);

    // Reset Flashcards
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setFlashcardList([...vocabularyList]);

    // Reset Quiz
    setQuizQuestions([]);
    setQuizCurrentIndex(0);
    setQuizScore(0);
    setQuizCompleted(false);
    setQuizFeedback(null);
  }, [vocabularyList, unitId]);

  const startNewGame = () => {
    if (!matchingGame || matchingGame.length === 0) return;
    const phrases = matchingGame.map(v => v.phrase);
    const defs = matchingGame.map(v => v.definition);

    // Dynamic shuffle helper
    const shuffleArray = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);

    setShuffledPhrases(shuffleArray(phrases));
    setShuffledDefs(shuffleArray(defs));
    setMatchedPairs([]);
    setSelectedMatchPhrase(null);
    setSelectedMatchDef(null);
    setFailedAttempts(0);
    setGameWon(false);
    setIsPlayingGame(true);
    setActiveTab('game');
  };

  const handlePhraseClick = (phrase: string) => {
    if (matchedPairs.includes(phrase)) return;
    
    if (selectedMatchPhrase === phrase) {
      setSelectedMatchPhrase(null);
      return;
    }

    setSelectedMatchPhrase(phrase);

    if (selectedMatchDef !== null) {
      checkMatch(phrase, selectedMatchDef);
    }
  };

  const handleDefClick = (def: string) => {
    if (matchedPairs.some(p => matchingGame.find(v => v.phrase === p)?.definition === def)) return;

    if (selectedMatchDef === def) {
      setSelectedMatchDef(null);
      return;
    }

    setSelectedMatchDef(def);

    if (selectedMatchPhrase !== null) {
      checkMatch(selectedMatchPhrase, def);
    }
  };

  const checkMatch = (phrase: string, def: string) => {
    const realItem = matchingGame.find(v => v.phrase === phrase);
    if (realItem && realItem.definition === def) {
      const newMatched = [...matchedPairs, phrase];
      setMatchedPairs(newMatched);
      setSelectedMatchPhrase(null);
      setSelectedMatchDef(null);

      if (newMatched.length === matchingGame.length) {
        setGameWon(true);
      }
    } else {
      setFailedAttempts(prev => prev + 1);
      setTimeout(() => {
        setSelectedMatchPhrase(null);
        setSelectedMatchDef(null);
      }, 700);
    }
  };

  // Synonym Swapper logic
  const swapperChallenge = VOCABULARY_SWAPPER_DATA.find(c => c.unitId === unitId);

  const handleSwapOptionSelect = (option: string, target: any) => {
    if (option === target.correctWord) {
      setSwappedWords(prev => ({ ...prev, [target.simpleWord]: option }));
      setSwapperFeedback({
        isCorrect: true,
        text: target.explanation
      });
      setSelectedSimpleWord(null);
    } else {
      setSwapperMistakes(prev => prev + 1);
      setSwapperFeedback({
        isCorrect: false,
        text: `"${option}" doesn't fit here. Note the target rule and retry.`
      });
    }
  };

  const resetSwapper = () => {
    setSwappedWords({});
    setSelectedSimpleWord(null);
    setSwapperFeedback(null);
    setSwapperMistakes(0);
  };

  const isSwapperCompleted = swapperChallenge 
    ? swapperChallenge.targets.every(t => swappedWords[t.simpleWord] !== undefined)
    : false;

  const renderSentenceWithSwappableParts = () => {
    if (!swapperChallenge) return null;
    const parts = swapperChallenge.sentence.split(/(\[[^[\]]+\])/g);

    return (
      <div className="leading-relaxed text-sm md:text-base font-medium select-text text-stone-800 p-5 bg-stone-50 border border-stone-150 rounded-2xl relative shadow-3xs select-text">
        {parts.map((part, index) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            const simpleWord = part.slice(1, -1);
            const target = swapperChallenge.targets.find(t => t.simpleWord === simpleWord);
            if (!target) return <span key={index}>{part}</span>;

            const isUpgraded = swappedWords[simpleWord] !== undefined;
            const isSelected = selectedSimpleWord === simpleWord;

            if (isUpgraded) {
              return (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-250 font-bold px-2 py-0.5 rounded-lg text-xs md:text-sm mx-1 shadow-3xs select-text animate-pulse"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {swappedWords[simpleWord]}
                </span>
              );
            } else {
              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedSimpleWord(simpleWord);
                    setSwapperFeedback(null);
                  }}
                  className={`underline decoration-dashed decoration-2 font-bold px-1.5 py-0.5 rounded-lg text-xs md:text-sm mx-1 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-stone-900 text-white decoration-stone-900 shadow-3xs scale-102'
                      : 'bg-orange-50 border border-orange-100 hover:bg-orange-100 text-orange-700 decoration-orange-400'
                  }`}
                >
                  {simpleWord}
                </button>
              );
            }
          }
          return (
            <span key={index} className="font-sans text-stone-700">
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  // Fully formatted sentence for the upgraded summary
  const getUpgradedSentenceText = () => {
    if (!swapperChallenge) return '';
    let result = swapperChallenge.sentence;
    swapperChallenge.targets.forEach(t => {
      result = result.replace(`[${t.simpleWord}]`, t.correctWord);
    });
    return result;
  };

  // Get study flow advisor recommendation based on current unit topic
  const getAdvisorRecommendation = () => {
    switch (unitId) {
      case 1:
        return {
          exercise: 'swapper' as const,
          label: 'Synonym Swapper',
          reason: 'Hospitality environments require high-precision transactional phrases. Replacing casual words (like "booking", "front lobby", or "silent room") with professional B2 vocabulary (such as "reservation", "reception", or "quiet room") primes your active production for real-life travel transactions.',
          efficiency: 100,
          stars: 5,
        };
      case 2:
        return {
          exercise: 'swapper' as const,
          label: 'Synonym Swapper',
          reason: 'Short-stay vacation rentals rely heavily on conversational politeness and hosting terminology. Practice swapping colloquial synonyms like "landlord" and "suggests" to "host" and "recommends" to sound natural during apartment arrivals.',
          efficiency: 95,
          stars: 5,
        };
      case 3:
        return {
          exercise: 'swapper' as const,
          label: 'Synonym Swapper',
          reason: 'Delay situations and transit stations require spontaneous, high-clarity vocabulary. Upgrading terms like "ticket" or "station" to transit terms like "fare" and "terminal" makes you sound highly natural in transport hubs.',
          efficiency: 98,
          stars: 5,
        };
      case 4:
        return {
          exercise: 'swapper' as const,
          label: 'Synonym Swapper',
          reason: 'Professional meetings demand precise, low-emotion collocations. Upgrading basic nouns ("work plan", "duties") to formal structures ("agenda", "responsibilities") immediately boosts your executive speaking persona.',
          efficiency: 100,
          stars: 5,
        };
      case 5:
        return {
          exercise: 'swapper' as const,
          label: 'Synonym Swapper',
          reason: 'Academic and lecture styles rely on structural signposts and high-register nouns. Practice active substitution of synonyms to construct elegant topic transitions.',
          efficiency: 92,
          stars: 4,
        };
      default:
        return {
          exercise: 'flashcards' as const,
          label: 'Active Recall Flashcards',
          reason: 'Establishing the initial hook between a definition and its dialogue usage is critical. Use the flip-card memory triggers to move items from short-term memory to long-term vocabulary maps.',
          efficiency: 85,
          stars: 4,
        };
    }
  };

  const rec = getAdvisorRecommendation();

  return (
    <div id="vocabulary-section" className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between h-full select-text">
      <div>
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-4 mb-5 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-stone-50 text-stone-600 border border-stone-200/50 rounded-full">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 tracking-tight text-sm md:text-base font-serif">Vocabulary Studio</h3>
              <p className="text-[9px] text-stone-400 font-mono uppercase tracking-widest font-bold">Lexical Enrichment & Collocations</p>
            </div>
          </div>

          <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-[11px] sm:text-xs border border-stone-200/40 select-none flex-wrap">
            <button
              onClick={() => setActiveTab('list')}
              id="tab-vocab-list"
              className={`px-2.5 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
                activeTab === 'list' ? 'bg-white text-stone-900 shadow-3xs font-semibold' : 'text-stone-500 hover:text-stone-800'
               }`}
            >
              Lexicon
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              id="tab-vocab-flashcards"
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium cursor-pointer ${
                activeTab === 'flashcards' ? 'bg-white text-stone-900 shadow-3xs font-semibold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-stone-450 text-orange-500" /> Flashcards
            </button>
            <button
              onClick={startNewGame}
              id="tab-vocab-game"
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium cursor-pointer ${
                activeTab === 'game' ? 'bg-white text-stone-900 shadow-3xs font-semibold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-400" /> Match Game
            </button>
            <button
              onClick={() => setActiveTab('swapper')}
              id="tab-vocab-swapper"
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium cursor-pointer ${
                activeTab === 'swapper' ? 'bg-white text-stone-900 shadow-3xs font-semibold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-orange-500" /> Synonym Swapper
            </button>
            <button
              onClick={startQuiz}
              id="tab-vocab-quiz"
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-medium cursor-pointer ${
                activeTab === 'quiz' ? 'bg-white text-stone-900 shadow-3xs font-semibold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Flashcard Quiz
            </button>
          </div>
        </div>

        {/* Dynamic Study Flow Advisor (Addresses "which exercise do you suggest more?") */}
        <div className="mb-5 bg-gradient-to-r from-orange-50/45 via-orange-50/10 to-transparent border border-orange-150 rounded-xl p-4 flex flex-col sm:flex-row items-start justify-between gap-4 select-none">
          <div className="flex gap-3 items-start max-w-2xl">
            <div className="p-2 bg-orange-50 border border-orange-100 text-orange-600 rounded-lg shrink-0 mt-0.5 animate-pulse">
              <Compass className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-orange-650 uppercase tracking-widest font-extrabold text-orange-600">Active Tutor Recommendation</span>
                <span className="bg-emerald-50 text-emerald-800 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 border border-emerald-200/40 rounded-full flex items-center gap-1 font-bold">
                  ★ Best Match for this Topic
                </span>
              </div>
              <h4 className="font-semibold text-stone-900 text-xs sm:text-sm font-serif">
                Focus: {rec.label} <span className="text-[11px] font-mono text-stone-400 font-medium">({rec.efficiency}% cognitive retrieval yield)</span>
              </h4>
              <p className="text-stone-605 text-xs leading-relaxed font-sans select-text text-stone-600">
                {rec.reason}
              </p>
            </div>
          </div>
          {activeTab !== rec.exercise && (
            <button
              onClick={() => {
                if (rec.exercise === 'swapper') {
                  setActiveTab('swapper');
                } else if (rec.exercise === 'flashcards') {
                  setActiveTab('flashcards');
                }
              }}
              className="w-full sm:w-auto shrink-0 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors shadow-3xs flex items-center justify-center gap-1 select-none whitespace-nowrap"
            >
              Start Recommended Exercise <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Selected Word Pop-up detail screen */}
        <AnimatePresence>
          {selectedWord && activeTab !== 'swapper' && (
            <motion.div
              layoutId="selected-word-detail"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-5 p-4 bg-stone-50 border border-stone-200 rounded-xl relative overflow-hidden"
            >
              <div className="absolute right-2.5 top-2.5 select-none">
                <button
                  onClick={onClearSelected}
                  id="btn-clear-selected-word"
                  className="text-stone-450 hover:text-stone-700 text-[10px] font-mono cursor-pointer uppercase tracking-widest font-bold bg-white px-2 py-1 rounded border border-stone-200"
                >
                  ✕ close
                </button>
              </div>

              <div className="flex items-center gap-1.5 mb-2 select-none">
                <span className="text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 text-stone-500 bg-stone-200/50 rounded font-bold">Dialogue Context</span>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-stone-900 text-base capitalize font-serif">
                  {selectedWord.word}
                </h4>
                <button
                  onClick={() => speakText(selectedWord.word)}
                  className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                  title="Play Pronunciation"
                >
                  <Volume2 className="w-3.5 h-3.5 text-stone-500" />
                </button>
              </div>
              <p className="text-stone-600 text-xs md:text-sm mb-3 font-medium leading-relaxed">
                {selectedWord.definition}
              </p>
              
              <div className="bg-white p-3 rounded-lg border border-stone-150 text-[11px] md:text-xs text-stone-550 leading-relaxed">
                <span className="font-bold text-stone-500 block mb-1">How it matters:</span>
                {selectedWord.context}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab contents */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-stone-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vocabulary by target word or definition..."
                  className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all font-sans bg-stone-50 text-stone-700 placeholder-stone-400"
                />
              </div>

              <div className="flex gap-2">
                <select 
                  value={filterScope}
                  onChange={(e) => setFilterScope(e.target.value as 'current' | 'all')}
                  className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-[11px] font-medium text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-300 cursor-pointer"
                >
                  <option value="current">Current Unit Only</option>
                  <option value="all">Across All Units</option>
                </select>

                <select 
                  value={filterMastery}
                  onChange={(e) => setFilterMastery(e.target.value as 'all' | 'mastered' | 'unmastered')}
                  className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-[11px] font-medium text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-300 cursor-pointer"
                >
                  <option value="all">All Words</option>
                  <option value="mastered">Mastered Only</option>
                  <option value="unmastered">Unmastered Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
              {(() => {
                let listToRender = filterScope === 'current' 
                  ? vocabularyList 
                  : allUnits.flatMap(u => (u.vocabulary?.items || []).map(item => ({ ...item, unitId: u.id, unitTitle: u.title })));

                // Filter by search query
                listToRender = listToRender.filter(v => 
                  v.phrase.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  v.definition.toLowerCase().includes(searchQuery.toLowerCase())
                );

                // Filter by mastery
                if (filterMastery === 'mastered') {
                  listToRender = listToRender.filter(v => !!masteredCards[v.phrase]);
                } else if (filterMastery === 'unmastered') {
                  listToRender = listToRender.filter(v => !masteredCards[v.phrase]);
                }

                if (listToRender.length === 0) {
                  return (
                    <div className="p-10 text-center text-stone-400 text-xs italic border border-dashed rounded-2xl bg-stone-50/50">
                      <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-5 h-5 text-stone-300" />
                      </div>
                      <p className="font-medium text-stone-500 mb-1">No matches found</p>
                      <p className="text-[10px]">Try adjusting your search query or filters.</p>
                      {(searchQuery || filterMastery !== 'all') && (
                        <button 
                          onClick={() => { setSearchQuery(''); setFilterMastery('all'); }}
                          className="mt-4 text-stone-900 font-bold uppercase tracking-widest text-[9px] hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  );
                }

                return listToRender.map((vocab, idx) => (
                  <div
                    key={`${vocab.phrase}-${idx}`}
                    className="p-4 bg-white hover:bg-stone-50/50 rounded-xl border border-stone-200 transition-all group select-text relative"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-stone-900 text-sm capitalize font-serif">
                          {vocab.phrase}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(vocab.phrase);
                          }}
                          className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                          title="Play Pronunciation"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-stone-500" />
                        </button>
                        {masteredCards[vocab.phrase] && (
                          <span className="bg-emerald-50 text-emerald-700 text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-100 ml-1">
                            Mastered
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {filterScope === 'all' && (vocab as any).unitId && (
                          <span className="text-[8px] font-mono font-bold tracking-widest text-stone-400 uppercase select-none bg-stone-100 px-1.5 py-0.5 rounded">
                            Unit {(vocab as any).unitId}
                          </span>
                        )}
                        <span className="text-[9px] font-mono font-bold tracking-widest text-stone-400 uppercase select-none">
                          Target Word
                        </span>
                      </div>
                    </div>
                    <p className="text-stone-550 text-xs leading-relaxed mb-2">
                      {vocab.definition}
                    </p>
                    {vocab.example && (
                      <div className="border-t border-stone-100 pt-2 text-[11px] text-stone-500 flex gap-1.5 items-start">
                        <span className="font-mono text-[9px] text-stone-401 text-stone-500 shrink-0 select-none bg-stone-100 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">EG</span>
                        <span className="italic">"{vocab.example}"</span>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Flashcards Subsection Tab */}
        {activeTab === 'flashcards' && (
          <div className="space-y-5">
            {flashcardList.length === 0 ? (
              <div className="p-6 bg-stone-50 rounded-xl text-center text-stone-450 border border-dashed text-xs select-none">
                No vocabulary items available.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Intro / Control Bar */}
                <div className="flex flex-wrap items-center justify-between bg-stone-50 border border-stone-200/65 rounded-xl p-3 text-xs leading-relaxed text-stone-650 gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>
                      Track your lexical mastery. Click the card to flip!
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-auto sm:ml-0 select-none">
                    <button
                      onClick={shuffleFlashcards}
                      className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer"
                      title="Shuffle Cards"
                    >
                      Shuffle
                    </button>
                    <button
                      onClick={resetFlashcards}
                      className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer"
                      title="Reset Mastery"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono select-none">
                  <span>CARD {currentCardIndex + 1} OF {flashcardList.length}</span>
                  <span className="text-emerald-700 font-semibold uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/40">
                    Mastered: {Object.keys(masteredCards).filter(phrase => masteredCards[phrase] && vocabularyList.some(v => v.phrase === phrase)).length} / {flashcardList.length}
                  </span>
                </div>
                
                {/* Progress bar line */}
                <div className="w-full bg-stone-150 rounded-full h-1.5 overflow-hidden border border-stone-200/40 select-none">
                  <div 
                    className="bg-orange-600 h-1.5 transition-all duration-300"
                    style={{ width: `${((currentCardIndex + 1) / flashcardList.length) * 100}%` }}
                  />
                </div>

                {/* Highly-styled flip card with clean interactive shadows */}
                <div className="py-4 flex justify-center items-center select-none">
                  <div
                    onClick={toggleFlip}
                    className="w-full max-w-md h-60 relative cursor-pointer group"
                    id={`flashcard-container-${currentCardIndex}`}
                  >
                    <AnimatePresence initial={false} mode="wait">
                      {!isCardFlipped ? (
                        /* FRONT of Card: Large Word Title */
                        <motion.div
                          key="front"
                          initial={{ opacity: 0, scale: 0.95, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="w-full h-full bg-white border border-stone-200 hover:border-stone-300 rounded-2xl p-6 flex flex-col justify-between items-center text-center shadow-3xs hover:shadow-2xs transition-all relative"
                        >
                          <div className="w-full flex justify-between items-center text-[9px] font-mono font-bold tracking-widest text-stone-450 uppercase">
                            <span>Ready to review</span>
                            <span>Front</span>
                          </div>

                          <div className="grow flex flex-col items-center justify-center space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-stone-900 text-xl sm:text-2xl tracking-tight capitalize select-text font-serif">
                                {flashcardList[currentCardIndex]?.phrase}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakText(flashcardList[currentCardIndex]?.phrase);
                                }}
                                className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                                title="Play Pronunciation"
                              >
                                <Volume2 className="w-4 h-4 text-stone-500" />
                              </button>
                            </div>
                            <span className="text-[10px] text-stone-400 font-mono tracking-widest uppercase bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-full font-bold">
                              CEFR Target Word
                            </span>
                          </div>

                          <div className="w-full text-center text-[10px] font-mono text-stone-400 flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider">
                            <RefreshCw className="w-3.5 h-3.5 text-stone-400" />
                            Click to reveal definition
                          </div>
                        </motion.div>
                      ) : (
                        /* BACK of Card: Definitions and Examples */
                        <motion.div
                          key="back"
                          initial={{ opacity: 0, scale: 0.95, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="w-full h-full bg-stone-50 border border-orange-200 rounded-2xl p-6 flex flex-col justify-between items-start text-left shadow-3xs select-text overflow-y-auto"
                        >
                          <div className="w-full flex justify-between items-center text-[9px] font-mono font-bold tracking-widest text-orange-500 uppercase select-none pb-2 border-b border-stone-205">
                            <div className="flex items-center gap-1.5">
                              <span className="capitalize text-stone-900 font-bold">{flashcardList[currentCardIndex]?.phrase}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakText(flashcardList[currentCardIndex]?.phrase);
                                }}
                                className="p-0.5 text-orange-500 hover:text-orange-700 hover:bg-stone-100 rounded transition-colors cursor-pointer flex items-center justify-center"
                                title="Play Pronunciation"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-orange-500" />
                              </button>
                            </div>
                            <span>Back</span>
                          </div>

                          <div className="grow py-3 space-y-3 w-full">
                            <div>
                              <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest font-bold block mb-0.5 select-none">Definition</span>
                              <p className="text-stone-800 text-xs sm:text-sm font-semibold leading-relaxed">
                                {flashcardList[currentCardIndex]?.definition}
                              </p>
                            </div>

                            {flashcardList[currentCardIndex]?.example && (
                              <div className="pt-2.5 border-t border-stone-200/60 w-full">
                                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest font-bold block mb-0.5 select-none font-bold">In Dialogue</span>
                                <p className="text-stone-600 text-[11px] sm:text-xs leading-relaxed italic font-sans pl-2.5 border-l-2 border-orange-500">
                                  "{flashcardList[currentCardIndex]?.example}"
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="w-full text-center text-[10px] font-mono text-stone-400 flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider select-none border-t border-stone-200/40 pt-2 shrink-0">
                            <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
                            Click to flip back
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Self Assessment and Navigation */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                  {/* Mastery toggles */}
                  <div className="flex gap-2 w-full sm:w-auto select-none">
                    <button
                      onClick={() => {
                        const currentPhrase = flashcardList[currentCardIndex].phrase;
                        setMasteredCards(prev => ({
                          ...prev,
                          [currentPhrase]: !prev[currentPhrase]
                        }));
                      }}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                        masteredCards[flashcardList[currentCardIndex]?.phrase]
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                          : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${masteredCards[flashcardList[currentCardIndex]?.phrase] ? 'text-emerald-700' : 'text-stone-405'}`} />
                      {masteredCards[flashcardList[currentCardIndex]?.phrase] ? 'Mastered!' : 'Mark as Mastered'}
                    </button>
                  </div>

                  {/* Previous / Next buttons */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end select-none">
                    <button
                      onClick={() => {
                        setIsCardFlipped(false);
                        setTimeout(() => {
                          setCurrentCardIndex(prev => (prev === 0 ? flashcardList.length - 1 : prev - 1));
                        }, 50);
                      }}
                      className="p-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center group"
                      title="Previous Card"
                    >
                      <ChevronLeft className="w-4 h-4 text-stone-600 group-hover:-transtone-x-0.5 transition-transform" />
                    </button>

                    <button
                      onClick={toggleFlip}
                      className="px-4 py-2 bg-stone-105 hover:bg-stone-200 border border-stone-200/50 rounded-xl text-xs font-semibold text-stone-705 transition-all font-sans cursor-pointer"
                    >
                      Flip Card
                    </button>

                    <button
                      onClick={() => {
                        setIsCardFlipped(false);
                        setTimeout(() => {
                          setCurrentCardIndex(prev => (prev === flashcardList.length - 1 ? 0 : prev + 1));
                        }, 50);
                      }}
                      className="p-2.5 bg-stone-900 hover:bg-stone-850 border border-stone-900 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center text-white font-semibold group"
                      title="Next Card"
                    >
                      <ChevronRight className="w-4 h-4 text-white group-hover:transtone-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {activeTab === 'game' && (
          /* Match Game container box */
          <div className="space-y-4">
            {gameWon ? (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center select-none">
                <Award className="w-10 h-10 text-stone-400 mx-auto mb-2 animate-bounce" />
                <h4 className="text-base font-bold text-stone-900 font-sans font-serif">Matching Completed!</h4>
                <p className="text-stone-500 text-xs mt-1 mb-4">
                  Outstanding job. You identified all the vocabulary links. Failed attempts: <strong>{failedAttempts}</strong>
                </p>
                <button
                  onClick={startNewGame}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Play Again
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-stone-500 mb-4 bg-stone-50 p-3 rounded-lg border border-stone-200/60 flex items-center gap-1.5 leading-relaxed select-none">
                  <Award className="w-4 h-4 text-stone-400 shrink-0" /> Match each phrase on the left with its definition on the right!
                </p>

                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  
                  {/* Left block Column: Phrases */}
                  <div className="space-y-2 select-none">
                    <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest block font-bold">Phrases</span>
                    {shuffledPhrases.map((phrase) => {
                      const isMatched = matchedPairs.includes(phrase);
                      const isSelected = selectedMatchPhrase === phrase;

                      return (
                        <button
                          key={`phrase-${phrase}`}
                          onClick={() => handlePhraseClick(phrase)}
                          disabled={isMatched}
                          className={`w-full text-left p-3 rounded-xl border text-[11px] leading-relaxed transition-all cursor-pointer ${
                            isMatched
                              ? 'bg-stone-100 border-stone-200 text-stone-400 font-medium cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-stone-950 text-white border-stone-950 shadow-sm font-semibold'
                              : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700 font-normal hover:border-stone-300'
                          }`}
                        >
                          {phrase}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right block Column: Definitions */}
                  <div className="space-y-2 select-none">
                    <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest block font-bold">Definitions</span>
                    {shuffledDefs.map((def) => {
                      const associatedPhrase = matchingGame.find(v => v.definition === def)?.phrase || '';
                      const isMatched = matchedPairs.includes(associatedPhrase);
                      const isSelected = selectedMatchDef === def;

                      return (
                        <button
                          key={`def-${def}`}
                          onClick={() => handleDefClick(def)}
                          disabled={isMatched}
                          className={`w-full text-left p-3 rounded-xl border text-[11px] leading-relaxed transition-all cursor-pointer ${
                            isMatched
                              ? 'bg-stone-100 border-stone-200 text-stone-400 font-medium opacity-65 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-stone-950 text-white border-stone-950 shadow-sm font-semibold'
                              : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700 font-normal hover:border-stone-300'
                          }`}
                        >
                          {def}
                        </button>
                      );
                    })}
                  </div>

                </div>

                {/* Score panel below game */}
                <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs select-none">
                  <span className="font-mono text-stone-400 uppercase tracking-wider font-semibold text-[10px]">
                    Mistakes: <strong className={failedAttempts > 0 ? 'text-stone-705 font-bold' : 'text-stone-500'}>{failedAttempts}</strong>
                  </span>
                  <button
                    onClick={startNewGame}
                    className="text-[10px] font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Game
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Flashcard Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            {quizQuestions.length === 0 ? (
              <div className="p-6 bg-stone-50 rounded-xl text-center text-stone-450 border border-dashed text-xs select-none">
                Not enough vocabulary to generate a quiz.
              </div>
            ) : quizCompleted ? (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center select-none shadow-3xs">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-base font-bold text-stone-900 font-sans font-serif">Quiz Completed!</h4>
                <p className="text-stone-500 text-xs mt-1 mb-4">
                  You scored <strong>{quizScore}</strong> out of {quizQuestions.length}.
                </p>
                <button
                  onClick={startQuiz}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-3xs transition-colors"
                >
                  Retake Quiz
                </button>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-3xs relative">
                {/* Progress Tracking */}
                <div className="flex items-center justify-between mb-4 text-[10px] font-mono text-stone-400 uppercase font-bold tracking-widest select-none">
                  <span>Question {quizCurrentIndex + 1} of {quizQuestions.length}</span>
                  <span>Score: <span className="text-orange-500">{quizScore}</span></span>
                </div>
                
                <div className="w-full bg-stone-100 rounded-full h-1 mt-[-10px] mb-4">
                  <div 
                    className="bg-orange-500 h-1 rounded-full transition-all duration-300" 
                    style={{ width: `${((quizCurrentIndex) / quizQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <div className="mb-5 text-center">
                  <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-stone-400 mb-2">
                    {quizQuestions[quizCurrentIndex].type === 'phrase_to_def' 
                      ? "Select the correct definition for:" 
                      : "Which word matches this definition?"}
                  </p>
                  <h3 className="text-lg md:text-xl font-bold text-stone-900 capitalize px-2 font-serif">
                    {quizQuestions[quizCurrentIndex].query}
                  </h3>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 select-none">
                  {quizQuestions[quizCurrentIndex].options.map((option, idx) => {
                    const isSelected = quizFeedback?.selected === option;
                    const isCorrectOption = option === quizQuestions[quizCurrentIndex].answer;
                    
                    let btnClass = "bg-white border-stone-200 text-stone-700 hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer";
                    if (quizFeedback) {
                      if (isCorrectOption) {
                        btnClass = "bg-emerald-50 border-emerald-300 text-emerald-800 scale-[1.02] shadow-3xs z-10 font-bold";
                      } else if (isSelected && !isCorrectOption) {
                        btnClass = "bg-rose-50 border-rose-200 text-rose-800 line-through opacity-70";
                      } else {
                        btnClass = "bg-white border-stone-200 text-stone-400 opacity-50 cursor-not-allowed";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={quizFeedback !== null}
                        onClick={() => handleQuizAnswer(option)}
                        className={`text-left p-3 rounded-xl border text-xs md:text-sm font-medium leading-relaxed transition-all ${btnClass}`}
                      >
                        {option}
                        {quizFeedback && isCorrectOption && <CheckCircle className="w-4 h-4 inline-block ml-2 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Synonym Swapper Section Tab */}
        {activeTab === 'swapper' && (
          <div className="space-y-5">
            {!swapperChallenge ? (
              <div className="p-6 bg-stone-50 rounded-xl text-center text-stone-450 border border-dashed text-xs select-none">
                Synonym Swapper exercises not configured for this unit yet.
              </div>
            ) : isSwapperCompleted ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 text-center space-y-3 shadow-3xs select-none">
                <Sparkles className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-emerald-950 font-sans font-serif">Sentence Upgraded!</h4>
                
                <p className="text-emerald-800 text-xs md:text-sm leading-relaxed max-w-md mx-auto">
                  Phenomenal! You transformed a simple, repetitive B1 sentence into an advanced academic structure. 
                  Mistakes made: <strong>{swapperMistakes}</strong>
                </p>

                <div className="bg-white p-4 rounded-xl border border-emerald-150 inline-block text-left text-xs md:text-sm text-stone-800 leading-relaxed max-w-lg italic font-medium font-sans border shadow-4xs select-text">
                  "{getUpgradedSentenceText()}"
                </div>

                <div className="pt-2">
                  <button
                    onClick={resetSwapper}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-3xs transition-all"
                  >
                    Upgrade Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-lg border border-stone-200/50 text-xs text-stone-500 leading-relaxed select-none">
                  <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Upgrader Rules:</strong> Click on the underlined simple words below. Select their sophisticated CEFR B2/C1 academic equivalents to upgrade the overall sentence!
                  </span>
                </div>

                {/* Render parsed swappable sentence */}
                {renderSentenceWithSwappableParts()}

                {/* Selected word upgrader options box */}
                {selectedSimpleWord && (() => {
                  const target = swapperChallenge.targets.find(t => t.simpleWord === selectedSimpleWord);
                  if (!target) return null;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-stone-50 border border-stone-205 border-stone-200 p-4 rounded-xl space-y-3 shadow-3xs"
                    >
                      <div className="flex items-center justify-between select-none">
                        <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider font-bold">
                          Select the B2 equivalent for: <span className="text-stone-800 font-extrabold">"{selectedSimpleWord}"</span>
                        </span>
                        <button
                          onClick={() => {
                            setSelectedSimpleWord(null);
                            setSwapperFeedback(null);
                          }}
                          className="text-[10px] bg-white border border-stone-200 text-stone-500 hover:text-stone-800 rounded px-1.5 py-0.5 cursor-pointer font-bold uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 select-none">
                        {target.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handleSwapOptionSelect(opt, target)}
                            className="p-2.5 text-xs text-center font-semibold bg-white border border-stone-200 hover:border-orange-200 text-stone-700 hover:text-orange-900 rounded-xl cursor-pointer transition-all hover:bg-orange-50/30"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Feedback Panel */}
                {swapperFeedback && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-xs p-3.5 rounded-xl border leading-relaxed select-text ${
                      swapperFeedback.isCorrect 
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-medium' 
                        : 'bg-rose-50 border-rose-150 text-rose-950 font-normal'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 uppercase font-mono tracking-wider text-[9px] mb-1 select-none">
                      <Sparkles className={`w-3.5 h-3.5 ${swapperFeedback.isCorrect ? 'text-emerald-500' : 'text-rose-400'}`} />
                      {swapperFeedback.isCorrect ? 'Correct Lexical Upgrade' : 'Incorrect Choice'}
                    </div>
                    {swapperFeedback.text}
                  </motion.div>
                )}

              </div>
            )}
          </div>
        )}
      </div>

      {/* Decorative footer label */}
      <div className="pt-4 border-t border-stone-100 text-[9px] text-stone-400 font-mono text-right mt-6 uppercase tracking-wider font-bold select-none h-4">
        {activeTab === 'flashcards'
          ? `Flashcard Mastery: ${Object.keys(masteredCards).filter(phrase => masteredCards[phrase] && vocabularyList.some(v => v.phrase === phrase)).length} / ${flashcardList.length} Cards`
          : activeTab !== 'swapper' 
          ? `Lexical Size: ${vocabularyList.length} Active Target Items`
          : `Lexical upgrade: ${swapperChallenge ? swapperChallenge.targets.length : 0} Simple targets`
        }
      </div>
    </div>
  );
}
