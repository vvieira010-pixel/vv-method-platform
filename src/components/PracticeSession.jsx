import { useState } from 'react';
import { Icon, Modal } from './shared.jsx';
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

export default function PracticeSession({ mode, onClose }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);

  const topics = getTopicList();

  function getExercises() {
    if (mode === 'grammar') return getGrammarExercises();
    if (mode === 'vocab') return selectedTopic ? getVocabExercises(selectedTopic) : [];
    if (mode === 'speaking') return selectedTopic ? getSpeakingExercises(selectedTopic) : [];
    return [];
  }

  const exercises = getExercises();
  const showTopicPicker = mode !== 'grammar' && !selectedTopic;
  const selectedTopicTitle = topics.find(t => t.id === selectedTopic)?.title || '';

  function handleTryAnother() {
    setSelectedTopic(null);
    setSessionKey(k => k + 1);
  }

  return (
    <Modal
      open
      onClose={onClose}
      kicker="Practice Studio"
      title={MODE_LABELS[mode] + (selectedTopicTitle ? ` — ${selectedTopicTitle}` : '')}
      subtitle={MODE_SUBTITLES[mode]}
    >
      {showTopicPicker ? (
        <TopicPicker
          topics={topics}
          mode={mode}
          onSelect={setSelectedTopic}
        />
      ) : (
        <div key={sessionKey}>
          <ExercisePlayer exercises={exercises} />
          {mode !== 'grammar' && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                onClick={handleTryAnother}
                style={{
                  background: 'none',
                border: '1.5px solid var(--accent, #148891)',
                color: 'var(--accent, #148891)',
                  borderRadius: 99,
                  padding: '8px 20px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent, #148891)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--accent, #148891)'; }}
              >
                ← Try another topic
              </button>
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
      }}>
        Choose a topic to practice — {descriptions[mode] || ''}.
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}>
        {topics.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              background: 'var(--bg, #fff)',
              border: '1.5px solid var(--border, #e5e7eb)',
              borderRadius: 14,
              padding: '14px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text, #0F172A)',
              lineHeight: 1.4,
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent, #148891)';
              e.currentTarget.style.background = 'rgba(20,136,145,0.05)';
              e.currentTarget.style.color = 'var(--accent, #148891)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
              e.currentTarget.style.background = 'var(--bg, #fff)';
              e.currentTarget.style.color = 'var(--text, #0F172A)';
            }}
          >
            {t.title}
          </button>
        ))}
      </div>
    </div>
  );
}
