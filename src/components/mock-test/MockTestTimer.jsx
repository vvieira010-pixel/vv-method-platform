import { useState, useEffect, useRef } from 'react';

export default function MockTestTimer({ totalSeconds, onTimeUp, running }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onTimeUpRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const display = `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const pct = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;

  return (
    <div className="mtt">
      <div className="mtt__bar-bg">
        <div className="mtt__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className={`mtt__time ${remaining < 60 ? 'mtt__time--warn' : ''}`}>{display}</span>
      <style>{`
        .mtt { display: flex; align-items: center; gap: 10px; }
        .mtt__bar-bg { flex: 1; height: 6px; background: rgba(255,255,255,.2); border-radius: 3px; }
        .mtt__bar-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 1s linear; }
        .mtt__time { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 15px; color: #fff; min-width: 5em; text-align: right; }
        .mtt__time--warn { color: #fca5a5; }
      `}</style>
    </div>
  );
}
