import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Sparkles, CheckCircle, Lightbulb, Volume2, 
  RotateCcw, Copy, HelpCircle, ArrowRight, Check, Award, Lock, BookOpen 
} from 'lucide-react';
import { LEVEL_UP_DATA, LevelUpSentence } from '../data/levelUpData';

interface SentenceLevelUpProps {
  unitId: number;
}

export default function SentenceLevelUp({ unitId }: SentenceLevelUpProps) {
  // Filter challenges for this unit
  const activeChallenges = LEVEL_UP_DATA.filter(c => c.unitId === unitId);
  
  // Track active challenge index
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  
  // Current challenge pointer
  const currentChallenge: LevelUpSentence | undefined = activeChallenges[activeChallengeIdx];

  // Selected level for the interactive comparative slider (B1, B2, C1)
  const [comparativeLevel, setComparativeLevel] = useState<'B1' | 'B2' | 'C1'>('B2');

  // Multiple Choice Quiz State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Gamified Sandbox Typing State
  const [userTypedSentence, setUserTypedSentence] = useState('');
  const [showModelAnswers, setShowModelAnswers] = useState(false);
  const [copiedLevel, setCopiedLevel] = useState<'b2' | 'c1' | null>(null);

  // Speech support state
  const [speakingText, setSpeakingText] = useState(false);

  // Reset challenge states whenever challenge or unit changes
  useEffect(() => {
    setSelectedOption(null);
    setQuizSubmitted(false);
    setUserTypedSentence('');
    setShowModelAnswers(false);
    setComparativeLevel('B2');
    setCopiedLevel(null);
  }, [unitId, activeChallengeIdx]);

  // Keep challenge index in bounds when switching units
  useEffect(() => {
    setActiveChallengeIdx(0);
  }, [unitId]);

  if (!currentChallenge) {
    return (
      <div className="bg-white rounded-2xl border border-slate-205 border-slate-200 p-8 text-center text-slate-400">
        <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="font-medium text-slate-500">No Level-Up challenge available for this unit yet.</p>
      </div>
    );
  }

  // Live check of target keywords as they type
  const checkKeywordTyped = (keyword: string) => {
    const cleanedKeyword = keyword.toLowerCase().trim();
    const typedCleaned = userTypedSentence.toLowerCase();
    
    // Check direct match or approximate match (accounting for slight punctuation/spacing)
    return typedCleaned.includes(cleanedKeyword);
  };

  // Count active matched keywords
  const matchedKeywordsCount = currentChallenge.targetKeywords.filter(k => 
    checkKeywordTyped(k.word)
  ).length;

  const totalKeywords = currentChallenge.targetKeywords.length;
  const allKeywordsMatched = matchedKeywordsCount === totalKeywords && totalKeywords > 0;

  // Render comparative sentence text dynamically
  const getComparativeTextByLevel = () => {
    if (comparativeLevel === 'B1') {
      return {
        text: currentChallenge.b1Sentence,
        color: 'text-slate-600 bg-slate-50 border-slate-300',
        badge: 'bg-slate-100 text-slate-700'
      };
    }
    if (comparativeLevel === 'B2') {
      // Find the correct B2 option
      const b2Correct = currentChallenge.options[currentChallenge.correctOptionIndex];
      return {
        text: b2Correct ? b2Correct.text : currentChallenge.b1Sentence,
        color: 'text-emerald-900 bg-emerald-50/50 border-emerald-300',
        badge: 'bg-emerald-500 text-white'
      };
    }
    return {
      text: currentChallenge.c1AdvancedAlternative,
      color: 'text-indigo-900 bg-indigo-50/50 border-indigo-300',
      badge: 'bg-indigo-600 text-white'
    };
  };

  // Text-To-Speech Pronunciation engine
  const handleSpeakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setSpeakingText(true);

    const utterance = new SpeechSynthesisUtterance(text);
    // Find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en-GB')) || voices[0];
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    utterance.rate = 0.95; // Slightly slower, highly clear rate

    utterance.onend = () => setSpeakingText(false);
    utterance.onerror = () => setSpeakingText(false);

    window.speechSynthesis.speak(utterance);
  };

  // Copy to clipboard helper
  const handleCopyText = (text: string, level: 'b2' | 'c1') => {
    navigator.clipboard.writeText(text);
    setCopiedLevel(level);
    setTimeout(() => setCopiedLevel(null), 2500);
  };

  const activeCompText = getComparativeTextByLevel();

  return (
    <div id="sentence-levelup-studio" className="bg-white rounded-2xl border border-slate-205 border-slate-200 p-6 flex flex-col justify-between h-full shadow-3xs">
      
      <div>
        {/* Module Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-slate-900 text-white rounded-full">
              <TrendingUp className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-1000 tracking-tight text-sm md:text-base text-slate-900">
                🚀 Sentence Level-Up Studio
              </h3>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest font-extrabold">
                B1 Intermediate ➔ B2 Upper-Intermediate CEFR Upgrade Lab
              </p>
            </div>
          </div>

          {/* Selector for inside-unit challenge nodes */}
          {activeChallenges.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Challenge Selector:</span>
              <div className="flex gap-1">
                {activeChallenges.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveChallengeIdx(idx)}
                    id={`levelup-node-trigger-${idx}`}
                    className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer ${
                      activeChallengeIdx === idx
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Level comparison stage slider - Visual Deck */}
        <div className="mb-8 bg-slate-50/50 rounded-2xl border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-extrabold block">Comparative Concept Deck</span>
              <h4 className="text-xs font-bold text-slate-700 font-sans">
                Observe the progression of complexity and polish:
              </h4>
            </div>

            {/* Quick-toggle Pills */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/40 text-xs">
              {(['B1', 'B2', 'C1'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setComparativeLevel(level)}
                  id={`btn-comp-level-${level}`}
                  className={`px-3 py-1 rounded-lg font-mono font-bold transition-all text-[11px] cursor-pointer ${
                    comparativeLevel === level
                      ? level === 'B1'
                        ? 'bg-slate-200 text-slate-800'
                        : level === 'B2'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {level === 'B1' ? 'B1 (Simple)' : level === 'B2' ? 'B2 (Robust)' : 'C1 (Advanced)'}
                </button>
              ))}
            </div>
          </div>

          {/* Current selected comparative sentence visual block */}
          <motion.div
            key={comparativeLevel}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${activeCompText.color} flex flex-col justify-between transition-all duration-300 min-h-[90px]`}
          >
            <div className="flex items-start gap-4 justify-between">
              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded tracking-wide shrink-0 ${
                comparativeLevel === 'B1'
                  ? 'bg-slate-200/80 text-slate-700'
                  : comparativeLevel === 'B2'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}>
                {comparativeLevel === 'B1' ? 'B1 Level Sentence' : comparativeLevel === 'B2' ? 'B2 Core Standard' : 'C1 Flow Alternative'}
              </span>

              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => handleSpeakText(activeCompText.text)}
                  className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-105 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Listen to native pacing pronunciation"
                >
                  <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>

            <p className="font-semibold text-slate-800 text-sm md:text-base leading-relaxed mt-3">
              "{activeCompText.text}"
            </p>
          </motion.div>

          <p className="text-[11px] text-slate-400 mt-2.5 font-sans italic">
            💡 <strong>Observation Note:</strong> {comparativeLevel === 'B1' && "The sentence utilizes basic coordination like 'because' and flat vocabulary."}
            {comparativeLevel === 'B2' && "Incorporates professional causal triggers and polished adjectives for balanced expression."}
            {comparativeLevel === 'C1' && "Uses conditional inversion or advanced nominal modifiers, creating a pristine academic stream."}
          </p>
        </div>

        {/* Double Interface Stage: MCQ or Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT: MCQ Transformation Quiz Block (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-1.5 mb-3 border-b border-slate-200/50 pb-2">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-xs font-mono uppercase tracking-widest text-slate-400">Upgrade Challenge Quiz</span>
              </div>

              <span className="text-[10px] text-indigo-600 font-mono uppercase tracking-wider font-extrabold block mb-1">THE MISSION:</span>
              <p className="text-xs text-slate-650 leading-relaxed font-medium mb-4 text-slate-800">
                Select the option that properly upgrades the B1 sentence to a B2 academic CEFR standard:
              </p>

              {/* Options lists */}
              <div className="space-y-2.5">
                {currentChallenge.options.map((opt, oIdx) => {
                  const isSelected = selectedOption === oIdx;
                  const isCorrect = oIdx === currentChallenge.correctOptionIndex;

                  let cardStyle = 'border-slate-200 bg-white hover:bg-slate-50';
                  
                  if (quizSubmitted) {
                    if (isCorrect) {
                      cardStyle = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-medium';
                    } else if (isSelected) {
                      cardStyle = 'border-rose-400 bg-rose-50 text-rose-950';
                    } else {
                      cardStyle = 'border-slate-100 bg-slate-50/30 text-slate-450 opacity-60 cursor-not-allowed';
                    }
                  } else if (isSelected) {
                    cardStyle = 'border-slate-900 bg-slate-100 text-slate-950 font-medium ring-1 ring-slate-900';
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => !quizSubmitted && setSelectedOption(oIdx)}
                      disabled={quizSubmitted}
                      id={`levelup-opt-${oIdx}`}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-2.5 cursor-pointer ${cardStyle}`}
                    >
                      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold mt-0.5 border ${
                        quizSubmitted && isCorrect
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : quizSubmitted && isSelected
                          ? 'bg-rose-500 text-white border-rose-500'
                          : isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-300 text-slate-500 animate-none'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="grow font-sans">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* MCQ Quiz Explanation Output */}
              <AnimatePresence>
                {quizSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-white rounded-xl border border-slate-200 mt-4 text-[11px] leading-relaxed select-text"
                  >
                    <div className="font-bold text-slate-800 mb-1 flex items-center gap-1 uppercase font-mono tracking-wider text-[9px]">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Professional Feedback:
                    </div>
                    {currentChallenge.options[selectedOption ?? 0]?.explanation}
                    {selectedOption === currentChallenge.correctOptionIndex && (
                      <p className="mt-2 text-emerald-800 font-medium">✨ Brilliant choice! Your selection matches the target academic CEFR criteria.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-end pt-3 mt-4 border-t border-slate-200/60">
              {!quizSubmitted ? (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={selectedOption === null}
                  className="px-4 py-2 bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white hover:bg-slate-820 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Confirm Choice
                </button>
              ) : (
                <button
                  onClick={() => { setSelectedOption(null); setQuizSubmitted(false); }}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retry Question
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Active Interactive Construction Sandbox (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-4 rounded-2xl border border-slate-200 bg-white">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-spin-slow" />
                  <span className="font-bold text-xs font-mono uppercase tracking-widest text-slate-400">Transformation Sandbox</span>
                </div>
                <span className="text-[10px] text-slate-400 italic">Test your own composition skills!</span>
              </div>

              {/* Goal setup banner info */}
              <div className="mb-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-normal">
                <strong>Upgrade Objective:</strong> {currentChallenge.b2Goal}
              </div>

              {/* Interactive target keyword tracker badges */}
              <div className="space-y-2 mb-4">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-extrabold block">Include these advanced keywords to light up the badges:</span>
                
                <div className="flex flex-wrap gap-2">
                  {currentChallenge.targetKeywords.map((tag, idx) => {
                    const isMatched = checkKeywordTyped(tag.word);
                    return (
                      <div
                        key={idx}
                        className={`px-3 py-1.5 rounded-xl border transition-all duration-300 flex items-center gap-1.5 text-xs ${
                          isMatched 
                            ? 'bg-emerald-50 border-emerald-450 text-emerald-900 font-bold scale-[1.02] shadow-3xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-650'
                        }`}
                        title={tag.reason}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                          isMatched ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-300/40'
                        }`}>
                          {isMatched ? '✓' : idx + 1}
                        </span>
                        <div className="text-left leading-none font-sans">
                          <span className={isMatched ? 'line-through decoration-emerald-500' : 'font-medium'}>{tag.word}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Typing Sandbox Area */}
              <div className="relative">
                <textarea
                  value={userTypedSentence}
                  onChange={(e) => setUserTypedSentence(e.target.value)}
                  placeholder="Draft your upgraded sentence here. Try to weave in the keywords above to build a robust B2 CEFR structure!"
                  className="w-full h-[110px] p-3 text-xs md:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-805 leading-relaxed placeholder:text-slate-400 resize-none font-sans font-normal"
                />

                {/* All Matched banner */}
                <AnimatePresence>
                  {allKeywordsMatched && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-emerald-950/90 text-white backdrop-blur-3xs rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1.5 z-10"
                    >
                      <Award className="w-10 h-10 text-emerald-300 animate-bounce" />
                      <h5 className="font-bold text-sm">Perfect Upgrade Link Crafted!</h5>
                      <p className="text-[11px] text-emerald-200 max-w-xs leading-normal">
                        You successfully utilized all B2 target grammatical keywords. Great control of complex structures!
                      </p>
                      <button
                        onClick={() => { setUserTypedSentence(''); }}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-[10px] font-bold font-mono transition-colors uppercase tracking-widest cursor-pointer"
                      >
                        Try alternative
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Keyword guide / hints section */}
              <div className="mt-4 bg-slate-50/50 rounded-xl border border-slate-200 p-3 text-[11px] leading-relaxed">
                <span className="font-bold text-slate-700 uppercase font-mono text-[9px] tracking-wider block mb-1">Structural Cheat Sheet:</span>
                <p className="text-slate-600">
                  💡 <strong>Inversion Trigger:</strong> {currentChallenge.sentenceInversionHint}
                </p>
                
                <div className="mt-2.5 space-y-1 bg-white p-2 rounded border border-slate-150">
                  <span className="font-semibold text-slate-400 text-[9px] uppercase font-mono tracking-widest block">Lexicon Upgrade Explainer:</span>
                  {currentChallenge.targetKeywords.map((k, i) => (
                    <div key={i} className="text-[10px] text-slate-550 leading-relaxed text-slate-600 flex items-start gap-1">
                      <span className="text-slate-400 font-bold">•</span>
                      <span><strong>{k.word}</strong> replaces basic word <em>"{k.equivalent}"</em>: {k.reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Answers Showcase section */}
              <AnimatePresence>
                {showModelAnswers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold font-mono text-[10px] text-indigo-800 uppercase tracking-wider block">Model B2 Target Sentence:</span>
                        <button
                          onClick={() => handleCopyText(currentChallenge.options[currentChallenge.correctOptionIndex].text, 'b2')}
                          className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest bg-white border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-slate-100 cursor-pointer"
                        >
                          {copiedLevel === 'b2' ? 'Copied ✓' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-slate-800 italic font-medium">"{currentChallenge.options[currentChallenge.correctOptionIndex].text}"</p>
                    </div>

                    <div className="border-t border-indigo-150 pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold font-mono text-[10px] text-indigo-800 uppercase tracking-wider block">C1 Advanced Target Alternative:</span>
                        <button
                          onClick={() => handleCopyText(currentChallenge.c1AdvancedAlternative, 'c1')}
                          className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest bg-white border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-slate-100 cursor-pointer"
                        >
                          {copiedLevel === 'c1' ? 'Copied ✓' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-slate-800 italic font-medium">"{currentChallenge.c1AdvancedAlternative}"</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-between items-center pt-3 mt-4 border-t border-slate-100">
              <button
                onClick={() => setShowModelAnswers(!showModelAnswers)}
                className="text-[10px] font-bold font-mono text-indigo-605 text-indigo-700 hover:text-indigo-900 uppercase tracking-wider cursor-pointer font-sans"
              >
                {showModelAnswers ? 'Hide Model Answers' : 'Reveal Model Answers 🔓'}
              </button>

              <button
                onClick={() => {
                  // Simulate typing help by giving B2 keywords
                  const phraseOpt = currentChallenge.options[currentChallenge.correctOptionIndex].text;
                  setUserTypedSentence(phraseOpt);
                }}
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold font-mono text-slate-600 uppercase tracking-wider cursor-pointer"
              >
                Insert Guide Draft
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer statistics */}
      <div className="pt-4 border-t border-slate-100 text-[9px] text-slate-400 font-mono tracking-wider flex items-center justify-between uppercase font-bold mt-6 select-none">
        <span>Level Up Progression: B1 ➔ B2 ➔ C1 Complete</span>
        <span>CEFR Linguistic Upgrade Tracker</span>
      </div>
    </div>
  );
}
