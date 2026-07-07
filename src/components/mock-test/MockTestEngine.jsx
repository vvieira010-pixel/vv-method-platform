import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_TEST_1 } from '../../data/mock-test-1/index.js';
import MockTestTimer from './MockTestTimer.jsx';
import ReadingSection from './ReadingSection.jsx';
import ListeningSection from './ListeningSection.jsx';
import SpeakingSection from './SpeakingSection.jsx';
import WritingSection from './WritingSection.jsx';
import MockTestThanks from './MockTestThanks.jsx';
import { Button } from '../ui/Button.jsx';
import { Icon } from '../shared.jsx';

const STORAGE_KEY = 'met:mock1:state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export default function MockTestEngine({ student, onBack }) {
  const [phase, setPhase] = useState('home');
  const [activeSection, setActiveSection] = useState(null);
  const [completedSections, setCompletedSections] = useState({});
  const [answers, setAnswers] = useState({});
  const timerRunning = phase === 'section';

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setCompletedSections(saved.completedSections || {});
      setAnswers(saved.answers || {});
    }
  }, []);

  useEffect(() => {
    if (phase !== 'home') return;
    saveState({ completedSections, answers });
  }, [completedSections, answers, phase]);

  const startSection = useCallback((sectionId) => {
    const section = MOCK_TEST_1.sections.find(s => s.id === sectionId);
    setActiveSection(section);
    setPhase('section');
  }, []);

  const completeSection = useCallback((sectionId, sectionAnswers) => {
    setCompletedSections(prev => ({ ...prev, [sectionId]: true }));
    setAnswers(prev => ({ ...prev, ...sectionAnswers }));
    setPhase('home');
    setActiveSection(null);
  }, []);

  const allDone = MOCK_TEST_1.sections.every(s => completedSections[s.id]);
  const sectionConfig = activeSection ? MOCK_TEST_1.sections.find(s => s.id === activeSection.id) : null;

  return (
    <div className="mte">
      {phase === 'home' && !allDone && (
        <MockTestHome
          sections={MOCK_TEST_1.sections}
          completedSections={completedSections}
          onStart={startSection}
          onBack={onBack}
        />
      )}
      {phase === 'home' && allDone && (
        <MockTestThanks answers={answers} student={student} onBack={onBack} />
      )}
      {phase === 'section' && sectionConfig && (
        <SectionShell
          section={sectionConfig}
          timerRunning={timerRunning}
          onComplete={(sectionAnswers) => completeSection(sectionConfig.id, sectionAnswers)}
          onBack={() => setPhase('home')}
          student={student}
        />
      )}
      <style>{`
        .mte { display: flex; flex-direction: column; min-height: 100%; }
      `}</style>
    </div>
  );
}

function SectionShell({ section, timerRunning, onComplete, onBack, student }) {
  const [timeLeft, setTimeLeft] = useState(section.time);
  const timerKey = `met:timer:${section.id}`;

  useEffect(() => {
    const saved = (() => {
      try { return JSON.parse(localStorage.getItem(timerKey)); } catch { return null; }
    })();
    if (saved && saved.remainingSeconds > 0) {
      const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
      setTimeLeft(Math.max(0, saved.remainingSeconds - elapsed));
    } else {
      setTimeLeft(section.time);
      try { localStorage.setItem(timerKey, JSON.stringify({ remainingSeconds: section.time, startedAt: Date.now() })); } catch {}
    }

    const handleBefore = (e) => {
      if (timeLeft > 0) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBefore);
    return () => window.removeEventListener('beforeunload', handleBefore);
  }, [section.id, section.time]);

  useEffect(() => {
    try { localStorage.setItem(timerKey, JSON.stringify({ remainingSeconds: timeLeft, startedAt: Date.now() })); } catch {}
  }, [timeLeft, timerKey]);

  const handleTimeUp = useCallback(() => {
    const currentAnswers = (() => {
      try { return JSON.parse(sessionStorage.getItem(`met:section:${section.id}:answers`) || '{}'); } catch { return {}; }
    })();
    onComplete(currentAnswers);
  }, [section.id, onComplete]);

  const handleSectionComplete = useCallback((sectionAnswers) => {
    try { localStorage.removeItem(timerKey); } catch {}
    try { sessionStorage.removeItem(`met:section:${section.id}:answers`); } catch {}
    onComplete(sectionAnswers);
  }, [section.id, timerKey, onComplete]);

  const renderSection = () => {
    switch (section.id) {
      case 'reading': return <ReadingSection onComplete={handleSectionComplete} />;
      case 'listening': return <ListeningSection onComplete={handleSectionComplete} />;
      case 'speaking': return <SpeakingSection student={student} onComplete={handleSectionComplete} />;
      case 'writing': return <WritingSection onComplete={handleSectionComplete} />;
      default: return null;
    }
  };

  return (
    <div className="mte-shell">
      <header className="mte-shell__topbar">
        <div className="mte-shell__left">
          <Button variant="ghost" size="sm" onClick={onBack} style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>
            <Icon.arrowLeft size={14} /> Back
          </Button>
          <span className="mte-shell__label">{section.label}</span>
        </div>
        <div className="mte-shell__right">
          <MockTestTimer totalSeconds={section.time} onTimeUp={handleTimeUp} running={timerRunning} />
        </div>
      </header>
      <div className="mte-shell__body">
        {renderSection()}
      </div>
      <style>{`
        .mte-shell { display: flex; flex-direction: column; height: 100%; }
        .mte-shell__topbar { 
          display: flex; align-items: center; justify-content: space-between; 
          padding: 12px 24px; background: var(--primary); color: #fff; 
          flex-shrink: 0; z-index: var(--z-sticky);
        }
        .mte-shell__left { display: flex; align-items: center; gap: 16px; }
        .mte-shell__label { font-weight: 700; font-size: 16px; letter-spacing: -0.01em; }
        .mte-shell__right { display: flex; align-items: center; }
        .mte-shell__body { flex: 1; overflow-y: auto; padding: 0; background: var(--bg); }
      `}</style>
    </div>
  );
}

function MockTestHome({ sections, completedSections, onStart, onBack }) {
  return (
    <motion.div 
      className="mte-home" 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mte-home__header">
        <Button variant="ghost" size="sm" onClick={onBack} style={{ marginBottom: 20, color: 'var(--primary)' }}>
          <Icon.arrowLeft size={14} /> Back to Dashboard
        </Button>
        <h2 className="mte-home__title">{MOCK_TEST_1.title}</h2>
        <p className="mte-home__sub">Complete all four sections to finalize your mock exam. Each section is timed separately.</p>
      </div>
      <div className="mte-home__grid">
        {sections.map((s, i) => {
          const done = completedSections[s.id];
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`mte-home__card ${done ? 'mte-home__card--done' : ''}`}
              onClick={() => !done && onStart(s.id)}
              disabled={done}
              whileHover={!done ? { scale: 1.02, translateY: -4 } : {}}
              whileTap={!done ? { scale: 0.98 } : {}}
            >
              <div className="mte-home__card-icon">{s.icon === 'book' ? '\u{1F4D6}' : s.icon === 'headphones' ? '\u{1F50A}' : s.icon === 'mic' ? '\u{1F3A4}' : '\u{270D}'}</div>
              <div className="mte-home__card-name">{s.label}</div>
              <div className="mte-home__card-time">{Math.floor(s.time / 60)} min</div>
              {done && <div className="mte-home__card-check">&#10003;</div>}
            </motion.button>
          );
        })}
      </div>
      <style>{`
        .mte-home { max-width: 800px; margin: 0 auto; padding: 48px 24px; }
        .mte-home__header { text-align: center; margin-bottom: 40px; }
        .mte-home__title { font-size: 32px; font-weight: 800; margin: 0 0 8px; color: var(--text); letter-spacing: -0.02em; }
        .mte-home__sub { color: var(--text-muted); font-size: 16px; margin: 0; line-height: 1.6; }
        .mte-home__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .mte-home__card { 
          display: flex; flex-direction: column; align-items: center; gap: 12px; 
          padding: 32px 24px; border: 1px solid var(--border); border-radius: var(--radius-md); 
           background: var(--surface); cursor: pointer; transition: background-color, border-color, color, opacity, transform .2s var(--transition-fast); 
          position: relative; overflow: hidden;
        }
        .mte-home__card:hover:not(:disabled) { border-color: var(--primary); box-shadow: var(--shadow-md); }
        .mte-home__card--done { opacity: .6; cursor: default; background: var(--bg); border-style: dashed; }
        .mte-home__card-icon { font-size: 32px; margin-bottom: 8px; }
        .mte-home__card-name { font-weight: 700; font-size: 18px; color: var(--text); }
        .mte-home__card-time { font-size: 14px; color: var(--text-muted); }
        .mte-home__card-check { 
          position: absolute; top: 16px; right: 16px; color: var(--success); 
          font-size: 20px; font-weight: bold; 
        }
        @media (max-width: 600px) { .mte-home__grid { grid-template-columns: 1fr; } }
      `}</style>
    </motion.div>
  );
}
