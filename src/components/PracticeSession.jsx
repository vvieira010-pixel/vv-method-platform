import { useState, useEffect } from 'react';
import { Modal } from './shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import ExercisePlayer from './exercises/ExercisePlayer.jsx';
import {
  getGrammarExercises,
  getTopicList,
  getVocabExercises,
  getSpeakingExercises,
} from '../lib/vocab-homework-bank.js';

const MODE_LABELS = {
  grammar: 'Grammar Sprint',
  vocab: 'Vocab Deep-Dive',
  speaking: 'Speaking Mirror',
};

const MODE_SUBTITLES = {
  grammar: '10 grammar questions · B2 level',
  vocab: 'Vocabulary matching & fill-in-the-blank',
  speaking: 'Speaking & writing practice prompts',
};

const KIND_OPTIONS = [
  { id: 'grammar', label: 'Grammar' },
  { id: 'vocab', label: 'Vocabulary' },
  { id: 'speaking', label: 'Speaking' },
];

export default function PracticeSession({ mode, onClose, onSessionComplete }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedKind, setSelectedKind] = useState(mode);
  const [sessionKey, setSessionKey] = useState(0);

  const topics = getTopicList();

  useEffect(() => {
    setSelectedKind(mode);
    setSelectedTopic(null);
    setSessionKey(k => k + 1);
  }, [mode]);

  function getExercises() {
    if (selectedKind === 'grammar') return getGrammarExercises();
    if (selectedKind === 'vocab') return selectedTopic ? getVocabExercises(selectedTopic) : [];
    if (selectedKind === 'speaking') return selectedTopic ? getSpeakingExercises(selectedTopic) : [];
    return [];
  }

  const exercises = getExercises();
  const showTopicPicker = selectedKind !== 'grammar' && !selectedTopic;
  const selectedTopicTitle = topics.find(t => t.id === selectedTopic)?.title || '';

  function handleTryAnother() {
    setSelectedTopic(null);
    setSessionKey(k => k + 1);
  }

  function handleSessionComplete(summary) {
    onSessionComplete?.({
      ...summary,
      mode: selectedKind,
      topicId: selectedTopic,
      topicTitle: selectedTopicTitle,
      exerciseCount: exercises.length,
    });
  }

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
      ) : (
        <div key={sessionKey}>
          <ExercisePlayer exercises={exercises} onSessionComplete={handleSessionComplete} />
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
