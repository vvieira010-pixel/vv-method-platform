import { useState, useEffect, useCallback } from 'react';
import { Modal } from './shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from './ui/Card.jsx';
import ExercisePlayer from './exercises/ExercisePlayer.jsx';
import FadingBanner from './FadingBanner.jsx';
import {
  getGrammarExercises,
  getTopicList,
  getVocabExercises,
  getSpeakingExercises,
  getWritingExercises,
  getListeningExercises,
} from '../lib/vocab-homework-bank.js';
import {
  getScaffoldLevel,
  setScaffoldLevel,
  logSession,
  classifyRetrieval,
  evaluateFading,
  getLevelInfo,
} from '../lib/fading-manager.js';

const MODE_LABELS = {
  grammar: 'Grammar Sprint',
  vocab: 'Vocab Deep-Dive',
  speaking: 'Speaking Mirror',
  writing: 'Writing Studio',
  listening: 'Listening Lab',
};

const MODE_SUBTITLES = {
  grammar: '10 grammar questions · B2 level',
  vocab: 'Vocabulary matching & fill-in-the-blank',
  speaking: 'Speaking & writing practice prompts',
  writing: 'Paragraph & short-answer writing tasks',
  listening: 'Interactive listening & embedded lessons',
};

const KIND_OPTIONS = [
  { id: 'grammar', label: 'Grammar' },
  { id: 'vocab', label: 'Vocabulary' },
  { id: 'speaking', label: 'Speaking' },
  { id: 'writing', label: 'Writing' },
  { id: 'listening', label: 'Listening' },
];

export default function PracticeSession({ mode, onClose, onSessionComplete }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedKind, setSelectedKind] = useState(mode);
  const [sessionKey, setSessionKey] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  const topics = getTopicList();
  const topicKey = selectedTopic || selectedKind;

  const [scaffoldLevel, setScaffoldLevelState] = useState(4);
  const [fadingVerdict, setFadingVerdict] = useState(null);
  const [sessionScore, setSessionScore] = useState(null);

  useEffect(() => {
    setSelectedKind(mode);
    setSelectedTopic(null);
    setSessionKey(k => k + 1);
    setFadingVerdict(null);
    setSessionScore(null);
  }, [mode]);

  useEffect(() => {
    const level = getScaffoldLevel(selectedKind, selectedTopic);
    setScaffoldLevelState(level);
  }, [selectedKind, selectedTopic]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFadingVerdict(null);
    setSessionScore(null);
    async function load() {
      let ex = [];
      if (selectedKind === 'grammar') {
        ex = await getGrammarExercises();
      } else if (selectedKind === 'vocab' && selectedTopic) {
        ex = await getVocabExercises(selectedTopic);
      } else if (selectedKind === 'speaking' && selectedTopic) {
        ex = await getSpeakingExercises(selectedTopic);
      } else if (selectedKind === 'writing' && selectedTopic) {
        ex = await getWritingExercises(selectedTopic);
      } else if (selectedKind === 'listening' && selectedTopic) {
        ex = await getListeningExercises(selectedTopic);
      }
      if (!cancelled) {
        setExercises(ex);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedKind, selectedTopic, sessionKey]);

  const showTopicPicker = selectedKind !== 'grammar' && !selectedTopic;
  const selectedTopicTitle = topics.find(t => t.id === selectedTopic)?.title || '';

  function handleTryAnother() {
    setSelectedTopic(null);
    setSessionKey(k => k + 1);
  }

  const handleSessionComplete = useCallback((summary) => {
    const { score, maxHintLevel, hintUsed, results } = summary;
    setSessionScore(score);

    if (score !== null) {
      const quality = classifyRetrieval(maxHintLevel || 0, hintUsed || false, score);
      logSession(selectedKind, selectedTopic, {
        score,
        maxHintLevel: maxHintLevel || 0,
        hintUsed: hintUsed || false,
        quality,
        unassisted: !hintUsed,
        exerciseCount: exercises.length,
        correctCount: results?.filter(r => r?.correct === true).length || 0,
        totalScored: results?.filter(r => r?.correct !== null && r?.correct !== undefined).length || 0,
      });

      const result = evaluateFading(selectedKind, selectedTopic);
      setFadingVerdict(result);

      if (result.verdict === 'reduce' || result.verdict === 'restore') {
        setScaffoldLevel(selectedKind, selectedTopic, result.newLevel);
        setScaffoldLevelState(result.newLevel);
      }
    }

    onSessionComplete?.({
      ...summary,
      mode: selectedKind,
      topicId: selectedTopic,
      topicTitle: selectedTopicTitle,
      exerciseCount: exercises.length,
    });
  }, [selectedKind, selectedTopic, exercises.length, selectedTopicTitle, onSessionComplete]);

  return (
    <Modal
      open
      onClose={onClose}
      kicker="Practice Studio"
      title={MODE_LABELS[selectedKind] + (selectedTopicTitle ? `: ${selectedTopicTitle}` : '')}
      subtitle={MODE_SUBTITLES[selectedKind]}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {KIND_OPTIONS.map(k => (
          <button
            key={k.id}
            type="button"
            onClick={() => {
              setSelectedKind(k.id);
              setSelectedTopic(null);
              setSessionKey(key => key + 1);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: selectedKind === k.id ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              background: selectedKind === k.id ? 'var(--accent-subtle)' : 'var(--surface)',
              color: selectedKind === k.id ? 'var(--primary)' : 'var(--text)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {k.label}
          </button>
        ))}
      </div>

      {showTopicPicker ? (
        <TopicPicker
          topics={topics}
          mode={selectedKind}
          onSelect={setSelectedTopic}
        />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          Loading exercises…
        </div>
      ) : (
        <div key={sessionKey}>
          <FadingBanner level={scaffoldLevel} verdict={fadingVerdict?.verdict} reason={fadingVerdict?.reason} />
          <ExercisePlayer
            exercises={exercises}
            onSessionComplete={handleSessionComplete}
            scaffoldLevel={scaffoldLevel}
          />
          {fadingVerdict && sessionScore !== null && (
            <div className={`fading-verdict fading-verdict--${fadingVerdict.verdict}`} style={{ marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
              {fadingVerdict.verdict === 'reduce' && (
                <>You've progressed to <strong>Level {fadingVerdict.newLevel}</strong> ({getLevelInfo(fadingVerdict.newLevel).label}) for this topic. {fadingVerdict.reason}.</>
              )}
              {fadingVerdict.verdict === 'restore' && (
                <>{fadingVerdict.reason}. You're now at <strong>Level {fadingVerdict.newLevel}</strong>.</>
              )}
              {fadingVerdict.verdict === 'hold' && (
                <>Holding at <strong>Level {fadingVerdict.currentLevel}</strong>. Keep practising — consistency builds confidence.</>
              )}
            </div>
          )}
          {selectedKind !== 'grammar' && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button variant="ghost" onClick={handleTryAnother}>← Try another topic</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function TopicPicker({ topics, mode, onSelect }) {
  const descriptions = {
    vocab: 'Vocabulary MCQ + fill-in-the-blank',
    speaking: 'Speaking prompt + writing task',
    writing: 'Paragraph & short-answer writing tasks',
    listening: 'Audio & embedded interactive lessons',
  };

  return (
    <div>
      <p style={{
        fontSize: '0.9rem',
        color: 'var(--muted, #6b7280)',
        marginBottom: 18,
        marginTop: 0,
        textAlign: 'center'
      }}>
        Choose a topic to practice: {descriptions[mode] || ''}.
      </p>
      <div className="grid-square">
        {topics.map(t => (
          <Card
            key={t.id}
            className="square-card"
            onClick={() => onSelect(t.id)}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center' }}>
              {t.title}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
