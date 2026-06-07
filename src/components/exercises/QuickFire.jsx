import { useState, useEffect, useRef } from 'react';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';

export default function QuickFire({ exercise, onComplete }) {
  const { items, timeLimitSeconds, instruction, context } = exercise;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds || 20);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef(null);

  const currentItem = items[currentIndex];

  function startTimer() {
    clearInterval(timerRef.current);
    setTimeLeft(timeLimitSeconds || 20);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(null); // Time out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    if (!isFinished && !submitted) {
      startTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [currentIndex, isFinished]);

  const [submitted, setSubmitted] = useState(false);

  function handleAnswer(givenValue = null) {
    const actualValue = givenValue !== null ? givenValue : inputValue;
    const correct = actualValue?.toLowerCase().trim() === currentItem.correctAnswer?.toLowerCase().trim();
    
    const newResult = {
      correct,
      given: actualValue,
      expected: currentItem.correctAnswer
    };

    const updatedResults = [...results, newResult];
    setResults(updatedResults);
    setInputValue('');

    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      clearInterval(timerRef.current);
      if (onComplete) {
        const allCorrect = updatedResults.every(r => r.correct);
        onComplete({ correct: allCorrect, score: updatedResults.filter(r => r.correct).length, total: items.length });
      }
    }
  }

  if (isFinished) {
    const correctCount = results.filter(r => r.correct).length;
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h3 style={{ color: NAVY }}>Session Complete!</h3>
        <p style={{ fontSize: 24, fontWeight: 700, color: TEAL }}>{correctCount} / {items.length}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 10, padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>Restart</button>
      </div>
    );
  }

  return (
    <div>
      {instruction && <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 8 }}>{instruction}</p>}
      {context && <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, marginBottom: 14, fontSize: 14 }}>{context}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>Question {currentIndex + 1} of {items.length}</span>
        <div style={{ 
          padding: '4px 12px', borderRadius: 20, background: timeLeft < 5 ? '#FEE2E2' : '#F0FDFA', 
          color: timeLeft < 5 ? '#991B1B' : TEAL, fontWeight: 700, fontSize: 14 
        }}>
          ⏱ {timeLeft}s
        </div>
      </div>

      <div style={{ padding: '24px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: NAVY, marginBottom: 0 }}>{currentItem.prompt}</p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <input
          autoFocus
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAnswer()}
          placeholder="Type answer..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 8, border: '2px solid var(--border)',
            fontSize: 16, fontFamily: 'var(--font-ui)', outline: 'none'
          }}
        />
        <button
          onClick={() => handleAnswer()}
          style={{
            padding: '0 24px', borderRadius: 8, border: 'none',
            background: `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)`,
            color: '#fff', fontWeight: 600, cursor: 'pointer'
          }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
