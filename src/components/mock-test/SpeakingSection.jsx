import { useState, useCallback, useRef, useEffect } from 'react';
import { SPEAKING_TASKS } from '../../data/mock-test-1/speaking.js';

export default function SpeakingSection({ onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase_, setPhase] = useState('intro');
  const [prepRemaining, setPrepRemaining] = useState(0);
  const [speakRemaining, setSpeakRemaining] = useState(0);
  const [recordings, setRecordings] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [promptPlayed, setPromptPlayed] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startSpeakingRef = useRef(null);

  const task = SPEAKING_TASKS[currentIdx];
  const total = SPEAKING_TASKS.length;

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startPrep = useCallback(() => {
    setPhase('prep');
    setPrepRemaining(task.prepSeconds);
    timerRef.current = setInterval(() => {
      setPrepRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          startSpeakingRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [task.prepSeconds]);

  const startSpeaking = useCallback(async () => {
    setPhase('speak');
    setSpeakRemaining(task.speakSeconds);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = 'Your browser does not support audio recording. Please use a modern browser and ensure you are using HTTPS.';
      window.toast?.(msg, 'warn') || alert(msg);
      setPhase('done');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e => { if (e.data.size > 0) chunksRef.current.push(e.data); });
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordings(prev => ({ ...prev, [currentIdx]: URL.createObjectURL(blob) }));
      };
      recorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setSpeakRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            if (recorder.state !== 'inactive') recorder.stop();
            setIsRecording(false);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      console.error('[SpeakingSection] startSpeaking failed:', e);
      const msg = 'Microphone access denied or not available. Please check your browser permissions.';
      window.toast?.(msg, 'warn') || alert(msg);
      setPhase('done');
    }
  }, [currentIdx, task.speakSeconds]);

  useEffect(() => { startSpeakingRef.current = startSpeaking; }, [startSpeaking]);

  const handlePlayPrompt = useCallback(() => {
    const audio = new Audio(task.audio);
    audio.play().catch(e => console.warn('[speaking] audio playback failed:', e));
    setPromptPlayed(true);
    audio.addEventListener('ended', () => startPrep());
  }, [task.audio]);

  const handleNext = useCallback(() => {
    cleanup();
    setPromptPlayed(false);
    if (currentIdx < total - 1) {
      setCurrentIdx(i => i + 1);
      setPhase('intro');
    } else {
      onComplete(recordings);
    }
  }, [currentIdx, total, recordings, onComplete, cleanup]);

  return (
    <div className="ss">
      <div className="ss__content">
        <div className="ss__task-label">Task {task.id} of {total}</div>
        <h3 className="ss__task-title">{task.label}</h3>

        {phase_ === 'intro' && (
          <div className="ss__phase">
            <p className="ss__prompt">{task.prompt}</p>
            {!promptPlayed ? (
              <button className="ss__btn ss__btn--primary" onClick={handlePlayPrompt}>
                {'\u25B6'} Play Prompt &amp; Begin
              </button>
            ) : (
              <div className="ss__prep-count">Preparing...</div>
            )}
          </div>
        )}

        {phase_ === 'prep' && (
          <div className="ss__phase">
            <div className="ss__countdown ss__countdown--prep">
              <div className="ss__countdown-label">Prepare</div>
              <div className="ss__countdown-time">{prepRemaining}s</div>
               <div className="ss__countdown-bar"><div className="ss__countdown-fill" style={{ transform: `scaleX(${(prepRemaining / task.prepSeconds)})` }} /></div>
            </div>
          </div>
        )}

        {phase_ === 'speak' && (
          <div className="ss__phase">
            <div className="ss__countdown ss__countdown--speak">
              <div className="ss__countdown-label">{isRecording ? 'Recording' : 'Speaking'}</div>
              <div className="ss__countdown-time">{speakRemaining}s</div>
               <div className="ss__countdown-bar"><div className="ss__countdown-fill" style={{ transform: `scaleX(${(speakRemaining / task.speakSeconds)})` }} /></div>
            </div>
            <div className="ss__waveform">{isRecording ? '\u{1F3B5}' : ''} {isRecording ? 'Recording...' : 'Preparing microphone...'}</div>
          </div>
        )}

        {phase_ === 'done' && (
          <div className="ss__phase">
            <p className="ss__done-msg">{recordings[currentIdx] ? '\u2705' : '\u26A0'} Task {task.id} {recordings[currentIdx] ? 'recorded' : 'skipped'}</p>
            <button className="ss__btn ss__btn--primary" onClick={handleNext}>
              {currentIdx < total - 1 ? 'Next Task \u2192' : 'Finish Speaking Section'}
            </button>
          </div>
        )}
      </div>
      <style>{`
        .ss { display: flex; justify-content: center; padding: 32px 20px; }
        .ss__content { max-width: 600px; width: 100%; }
        .ss__task-label { font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 4px; }
        .ss__task-title { font-size: 18px; font-weight: 700; color: var(--text); margin: 0 0 20px; }
        .ss__phase { display: flex; flex-direction: column; gap: 20px; }
        .ss__prompt { font-size: 15px; line-height: 1.7; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; }
        .ss__btn { padding: 12px 24px; border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-size: 14px; font-weight: 700; align-self: flex-start; }
        .ss__btn--primary { background: var(--primary); color: #fff; }
        .ss__btn--primary:hover { background: var(--primary-hover); }
        .ss__countdown { text-align: center; padding: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
        .ss__countdown--prep { border-color: var(--accent); }
        .ss__countdown--speak { border-color: var(--primary); }
        .ss__countdown-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; }
        .ss__countdown-time { font-size: 36px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
        .ss__countdown-bar { height: 6px; background: var(--bg); border-radius: 3px; margin-top: 8px; }
         .ss__countdown-fill { height: 100%; width: 100%; border-radius: 3px; transition: transform 1s linear; transform-origin: left; background: var(--primary); }
        .ss__countdown--prep .ss__countdown-fill { background: var(--accent); }
        .ss__waveform { text-align: center; font-size: 14px; color: var(--text-muted); }
        .ss__done-msg { font-size: 16px; font-weight: 600; color: var(--text); text-align: center; padding: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
      `}</style>
    </div>
  );
}
