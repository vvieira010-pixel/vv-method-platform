import { useState } from 'react';
import { Modal } from './shared.jsx';
import { recordPractice } from '../lib/spaced-repetition.js';

export default function ReviewSession({ exercises, studentId, onClose }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  const ex = exercises[idx];
  const remaining = exercises.length - idx - 1;

  function handleSelect(optionIndex) {
    setAnswers(prev => ({ ...prev, [ex.id]: optionIndex }));
  }

  function handleNext() {
    if (!ex || answers[ex.id] == null) return;
    recordPractice(studentId, ex.reviewItemId, answers[ex.id] === ex.correct);
    if (idx + 1 >= exercises.length) {
      setFinished(true);
    } else {
      setIdx(i => i + 1);
    }
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
          <div className="review-finished-icon">✓</div>
          <h3>All reviews done</h3>
          <p>
            You reviewed {exercises.length} item{exercises.length !== 1 ? 's' : ''}.
            Come back when a new review is due.
          </p>
          <button onClick={onClose} className="btn btn-primary">Done</button>
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
              if (showResult && isCorrect) cls += ' review-option--correct';
              else if (showResult && selected) cls += ' review-option--wrong';
              else if (selected) cls += ' review-option--selected';
              return (
                <button key={i} className={cls} onClick={() => !showResult && handleSelect(i)} disabled={showResult}>
                  {opt}
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
