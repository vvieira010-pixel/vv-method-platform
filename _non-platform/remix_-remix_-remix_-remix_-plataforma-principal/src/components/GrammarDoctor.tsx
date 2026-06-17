import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, RotateCcw, Info, Lightbulb, Check, HelpCircle, AlertCircle
} from 'lucide-react';
import { GRAMMAR_DOCTOR_DATA, GrammarDoctorChallenge } from '../data/grammarDoctorData';

interface GrammarDoctorProps {
  unitId: number;
}

export default function GrammarDoctor({ unitId }: GrammarDoctorProps) {
  const challenge = GRAMMAR_DOCTOR_DATA.find(c => c.unitId === unitId);

  const [selectedRemedy, setSelectedRemedy] = useState<number | null>(null);
  const [remedyApplied, setRemedyApplied] = useState(false);

  useEffect(() => {
    setSelectedRemedy(null);
    setRemedyApplied(false);
  }, [unitId]);

  if (!challenge) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400 select-none">
        <AlertCircle className="w-10 h-10 text-stone-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-stone-500">Syntax Analysis not configured for this unit yet.</p>
      </div>
    );
  }

  const handleApplyRemedy = () => {
    if (selectedRemedy === null) return;
    setRemedyApplied(true);
  };

  const currentOption = selectedRemedy !== null ? challenge.remedyOptions[selectedRemedy] : null;
  const isCured = remedyApplied && currentOption?.isCorrect;

  return (
    <div id="grammar-doctor-studio" className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between h-full shadow-3xs select-text">
      
      <div>
        {/* Header - Academic & Understated */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-4 mb-6 gap-3 select-none">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-stone-50 border border-stone-200/60 text-stone-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 tracking-tight text-sm md:text-base font-serif">
                Syntax & Error Analysis
              </h3>
              <p className="text-[10px] text-stone-500 font-mono uppercase tracking-wider font-bold">
                Examine academic phrasing and correct common structural slip-ups
              </p>
            </div>
          </div>

          <div className="bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg text-[9px] font-mono text-stone-600 font-bold uppercase tracking-wider">
            Focus: {challenge.focus}
          </div>
        </div>

        {/* Clean, Underspaced Context Breakdown (No neon terminal/medical themes) */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6 relative">
          <span className="text-[9px] text-stone-400 font-mono uppercase tracking-widest font-bold block mb-3 select-none">
            Original Sentence Construction
          </span>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2 select-none">
              <span className="text-stone-700 text-xs font-semibold flex items-center gap-1.5 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                Error Type: <span className="font-mono text-[11px] text-stone-600">{challenge.errorType}</span>
              </span>
              <span className="text-[9px] text-stone-405 font-mono text-stone-400">REF_{challenge.unitId}</span>
            </div>

            {/* Crisp word processor grammar error highlight */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-150 flex items-start gap-3">
              <span className="text-stone-400 font-mono text-[10px] font-bold shrink-0 block mt-0.5 select-none uppercase tracking-wide">
                Issue:
              </span>
              <p className="leading-relaxed font-sans text-xs sm:text-sm text-stone-700">
                {challenge.symptom.split(challenge.highlightedBug)[0]}
                <span className="underline decoration-wavy decoration-amber-500 decoration-1 text-stone-900 font-semibold px-0.5 bg-amber-50 rounded mx-0.5" title="Grammar concern">
                  {challenge.highlightedBug}
                </span>
                {challenge.symptom.split(challenge.highlightedBug)[1]}
              </p>
            </div>

            <div className="leading-relaxed text-xs text-stone-550 font-sans pl-1 flex gap-2 items-start select-text">
              <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5 select-none" />
              <div>
                <span className="font-semibold text-stone-705">Linguistic Context:</span> {challenge.diagnosticExplanation}
              </div>
            </div>
          </div>
        </div>

        {/* Alternatives Board */}
        <div className="space-y-4">
          <div>
            <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest block mb-2 font-bold select-none">
              Select the correct phrasing upgrade:
            </span>
            
            <div className="space-y-2.5">
              {challenge.remedyOptions.map((opt, rIdx) => {
                const isSelected = selectedRemedy === rIdx;
                let btnStyle = 'border-stone-200 hover:bg-stone-50 text-stone-700 bg-white hover:border-stone-350 hover:shadow-4xs';
                
                if (remedyApplied) {
                  if (opt.isCorrect) {
                    btnStyle = 'border-emerald-250 bg-emerald-50/40 text-emerald-950 font-medium';
                  } else if (isSelected) {
                    btnStyle = 'border-rose-250 bg-rose-50/40 text-rose-950';
                  } else {
                    btnStyle = 'border-stone-100 bg-stone-50 pointer-events-none opacity-50';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-stone-900 bg-stone-50 hover:bg-stone-50 ring-1 ring-stone-900 text-stone-950 font-medium shadow-4xs';
                }

                return (
                  <button
                    key={rIdx}
                    disabled={remedyApplied}
                    onClick={() => setSelectedRemedy(rIdx)}
                    id={`remedy-choice-${rIdx}`}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed transition-all cursor-pointer flex gap-3 items-start select-none ${btnStyle}`}
                  >
                    <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold mt-0.5 border transition-all ${
                      remedyApplied && opt.isCorrect
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : remedyApplied && isSelected
                        ? 'bg-rose-600 text-white border-rose-600'
                        : isSelected
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-500 border-stone-200'
                    }`}>
                      {rIdx + 1}
                    </span>
                    <span className="grow font-sans pr-1">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Understated Explanation and Grammar Standard Principle */}
          <AnimatePresence>
            {remedyApplied && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`p-4 rounded-xl border text-xs sm:text-sm select-text ${
                  isCured 
                    ? 'bg-emerald-50/20 border-emerald-150 text-emerald-950'
                    : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}
                id="remedy-feedback-panel"
              >
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isCured ? 'bg-emerald-500' : 'bg-stone-400'}`}></span>
                    <span className="font-bold text-stone-800 uppercase font-mono text-[9px] tracking-wider select-none">
                      {isCured ? 'Analysis Result: Correct phrasing' : 'Analysis Clue'}
                    </span>
                  </div>
                  
                  <p className="font-sans leading-relaxed text-stone-600 pl-3">
                    {currentOption?.explanation}
                  </p>

                  <div className="mt-3.5 pt-3.5 border-t border-stone-200/50 text-[11px] leading-relaxed text-stone-550 pl-3">
                    <span className="font-bold text-stone-450 uppercase font-mono text-[8px] tracking-wider block mb-1 select-none">Standard Grammatical Concept:</span>
                    {challenge.linguisticRule}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Footer controls */}
      <div className="pt-4 border-t border-stone-150 flex items-center justify-between mt-6 select-none">
        {remedyApplied && (
          <button
            onClick={() => {
              setSelectedRemedy(null);
              setRemedyApplied(false);
            }}
            id="btn-re-diagnose"
            className="text-[10px] uppercase font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer font-mono tracking-wider transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Exercise
          </button>
        )}

        <div className="grow flex justify-end">
          {!remedyApplied && (
            <button
              onClick={handleApplyRemedy}
              disabled={selectedRemedy === null}
              id="btn-submit-remedy"
              className="px-4.5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold shadow-3xs cursor-pointer transition-all"
            >
              Verify Choice
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
