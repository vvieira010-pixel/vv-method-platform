import { useState, useEffect, useCallback } from 'react';
import { Modal, Icon, Button } from './shared.jsx';
import { recordPractice } from '../lib/spaced-repetition.js';
import { exercisePreview } from '../lib/exercise-types.js';

export default function ReviewSession({ exercises, studentId, onClose }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  const ex = exercises[idx];
  const remaining = exercises.length - idx - 1;
  const isMcq = ex && (ex.type === 'mcq' || ex.type === 'listen' || (ex.options && ex.correct != null));
  const isBlank = ex && ex.type === 'blank';

  const handleSelect = useCallback(optionIndex => {
    setAnswers(prev => ({ ...prev, [ex.id]: optionIndex }));
  }, [ex]);

  const handleNext = useCallback(() => {
    if (!ex || answers[ex.id] == null) return;
    recordPractice(studentId, ex.reviewItemId, answers[ex.id] === ex.correct);
    if (idx + 1 >= exercises.length) {
      setFinished(true);
    } else {
      setIdx(i => i + 1);
    }
  }, [ex, studentId, idx, exercises.length, answers]);

  // Keyboard shortcuts: 1–4 selects option, Enter advances
  useEffect(() => {
    if (finished || !ex) return;
    if (!isMcq) return; // keyboard shortcuts only for MCQ-like
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= (ex?.options?.length ?? 0) && ex && answers[ex.id] == null) {
        handleSelect(num - 1);
        return;
      }
      if (e.key === 'Enter' && ex && answers[ex.id] != null) {
        handleNext();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finished, ex, answers, idx, handleSelect, handleNext, isMcq]);

  if (ex && !isMcq && !isBlank) {
    return (
      <Modal open onClose={onClose} kicker="Spaced Review" title={`Item ${idx + 1} of ${exercises.length}`} maxWidth={560}>
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
            Review for &ldquo;{ex.question || ex.prompt || ex.instruction || exercisePreview(ex)}&rdquo;
          </p>
          <Button variant="primary" onClick={handleNext}>Mark as reviewed &rarr;</Button>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)', marginTop: 12 }}>
            Non-MCQ items can be marked reviewed without answering.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      kicker="Spaced Review"
      title={finished ? 'Review complete!' : `Item ${idx + 1} of ${exercises.length}`}
      maxWidth={560}
    >
      {finished ? (
        <div className="review-finished">
          <div className="review-finished-icon"><Icon.check size={24} /></div>
          <h3>All reviews done</h3>
          <p>
            You reviewed {exercises.length} item{exercises.length !== 1 ? 's' : ''}.
            Come back when a new review is due.
          </p>
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      ) : ex && (
        <div>
          <p className="review-prompt-label">Choose the correct version</p>
          <p className="review-question">{ex.question?.replace(/"/g, '')}</p>
          <div className="review-options">
            {(ex.options || []).map((opt, i) => {
              const selected = answers[ex.id] === i;
              const isCorrect = ex.correct === i;
              const showResult = answers[ex.id] != null;
              let cls = 'review-option';
              let indicator = null;
              if (showResult && isCorrect) {
                cls += ' review-option--correct';
                indicator = <span className="review-option-indicator" aria-hidden="true">✓ Correct</span>;
              } else if (showResult && selected) {
                cls += ' review-option--wrong';
                indicator = <span className="review-option-indicator" aria-hidden="true">✗ Incorrect</span>;
              } else if (selected) {
                cls += ' review-option--selected';
              }
              return (
                <button key={i} className={cls} onClick={() => !showResult && handleSelect(i)} disabled={showResult}>
                  <span className="review-option-text">{opt}</span>
                  {indicator}
                </button>
              );
            })}
          </div>
          <div className="review-footer">
            <span className="review-remaining">{remaining > 0 ? `${remaining} more after this` : 'Last item'}</span>
            <button className="review-next-btn" onClick={handleNext} disabled={answers[ex.id] == null}>
              {remaining > 0 ? 'Next →' : 'Finish'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
