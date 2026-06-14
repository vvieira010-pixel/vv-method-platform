import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, CheckCircle, AlertTriangle, ChevronRight, Award, RotateCcw, Lightbulb } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizSectionProps {
  questions: QuizQuestion[];
  topicTitle?: string;
}

export default function QuizSection({ questions, topicTitle = "Understanding Check" }: QuizSectionProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // If questions prop changes, reset quiz state immediately to prevent index bounds issues
  useEffect(() => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  }, [questions]);

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center text-stone-400">
        No quiz available for this activity.
      </div>
    );
  }

  const activeQuestion = questions[currentIdx] || questions[0];

  const handleOptionClick = (idx: number) => {
    if (isSubmitted) return;
    setSelectedAnswer(idx);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || isSubmitted) return;
    
    setIsSubmitted(true);
    if (selectedAnswer === activeQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div id="quiz-section-container" className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Quiz Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-stone-50 text-stone-600 border border-stone-200/50 rounded-full">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 tracking-tight text-sm md:text-base font-serif">{topicTitle}</h3>
              <p className="text-[9px] text-stone-400 font-mono uppercase tracking-widest font-bold">Comprehension Drills</p>
            </div>
          </div>

          <div className="text-[10px] font-mono text-stone-400 font-bold bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {!quizFinished ? `${currentIdx + 1} / ${questions.length}` : 'DONE'}
          </div>
        </div>

        {/* Quiz Body */}
        {quizFinished ? (
          <div className="text-center py-6">
            <Award className="w-10 h-10 text-stone-400 mx-auto mb-3 animate-pulse" />
            <h4 className="text-base font-bold text-stone-950 font-serif">Quiz Completed!</h4>
            <p className="text-stone-500 text-xs mt-1 mb-5">
              Let's evaluate your interaction score. You scored:
            </p>

            <div className="inline-flex items-center justify-center p-4 bg-stone-50 rounded-2xl border border-stone-200 mb-6">
              <span className="text-3xl font-extrabold text-stone-900">{score}</span>
              <span className="text-stone-400 text-lg mx-1.5">/</span>
              <span className="text-xl font-bold text-stone-500">{questions.length}</span>
            </div>

            <p className="text-xs text-stone-500 italic max-w-sm mx-auto mb-6">
              {score === questions.length 
                ? 'Outstanding performance! You listened and digested every crucial detail of the interaction!'
                : 'Excellent reading trial! Retake the quiz or review the dialogue with practice audio to get a perfect score!'}
            </p>

            <button
              onClick={restartQuiz}
              id="quiz-btn-restart"
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restart Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Question Text */}
            <h4 className="font-semibold text-stone-800 text-sm md:text-base leading-snug font-serif">
              {activeQuestion.question}
            </h4>

            {/* Questions Options */}
            <div className="space-y-2 mt-3">
              {activeQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === activeQuestion.correctAnswer;
                
                // Styling switches
                let optionStyle = 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700';
                
                if (isSubmitted) {
                  if (isCorrect) {
                     optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium';
                  } else if (isSelected) {
                    optionStyle = 'border-rose-400 bg-rose-50 text-rose-950';
                  } else {
                    optionStyle = 'border-stone-100 bg-stone-50/30 text-stone-400 cursor-not-allowed';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-stone-900 bg-stone-50 text-stone-950 font-medium';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={isSubmitted}
                    id={`quiz-option-${currentIdx}-${idx}`}
                    className={`w-full text-left p-3 rounded-xl border text-xs md:text-sm leading-relaxed transition-all flex items-start gap-2.5 cursor-pointer ${optionStyle}`}
                  >
                    <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold mt-0.5 border ${
                      isSubmitted && isCorrect
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : isSubmitted && isSelected
                        ? 'bg-rose-500 text-white border-rose-500'
                        : isSelected
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white border-stone-300 text-stone-500'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="grow">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation box */}
            <AnimatePresence>
              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-3.5 rounded-xl border mt-4 text-xs leading-relaxed ${
                    selectedAnswer === activeQuestion.correctAnswer
                      ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950'
                      : 'bg-stone-50 border-stone-200 text-stone-705'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1.5 uppercase font-mono tracking-wider text-[10px]">
                    <Lightbulb className="w-4 h-4 shrink-0 text-stone-400" />
                    {selectedAnswer === activeQuestion.correctAnswer ? 'Correct Explanation' : 'Explanation Clarified'}
                  </div>
                  {activeQuestion.explanation}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action control triggers */}
            <div className="flex justify-end pt-3 mt-4 border-t border-stone-200">
              {!isSubmitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedAnswer === null}
                  id="quiz-btn-submit"
                  className="px-4 py-2 bg-stone-900 disabled:opacity-40 disabled:cursor-not-allowed text-white hover:bg-stone-850 leading-none py-2.5 rounded-xl text-xs font-semibold select-none flex items-center gap-1 cursor-pointer"
                >
                  Confirm Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  id="quiz-btn-next"
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white leading-none py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'} 
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Decorative footer stamp */}
      <div className="pt-4 border-t border-stone-100 text-[10px] text-stone-400 font-mono text-left mt-6">
        CHALLENGE SCORE: {score} OVER {questions.length}
      </div>
    </div>
  );
}
