/**
 * exercise-demo.jsx
 * Standalone page to test all 5 exercise types.
 * Access via /exercises or navigate('exercises') from any page.
 */
import ExercisePlayer from '../components/exercises/ExercisePlayer.jsx';

const DEMO_EXERCISES = [
  {
    type: 'multiple_choice',
    skill: 'Vocabulary',
    question: 'Which word best completes the sentence? "The scientist made an important ___ about climate change."',
    options: ['discover', 'discovery', 'discovered', 'discovering'],
    correct: 1,
  },
  {
    type: 'fill_blank',
    skill: 'Grammar',
    instruction: 'Complete the sentence with the correct form of the verb.',
    template: 'She ___ to school every day, but yesterday she ___ the bus.',
    blanks: ['walks', 'missed'],
  },
  {
    type: 'short_answer',
    skill: 'Speaking',
    prompt: 'Do you think teenagers spend too much time on social media? Give your opinion with one reason and one example.',
    rubric: [
      'State a clear opinion (agree / disagree)',
      'Give one reason to support it',
      'Give a specific example',
      'End with a consequence or conclusion',
    ],
  },
  {
    type: 'order_sentences',
    skill: 'Coherence',
    instruction: 'Put these sentences in the correct logical order to form a paragraph.',
    sentences: [
      'As a result, many cities are now investing in public transport.',
      'Air pollution has become a serious problem in urban areas.',
      'One major cause is the high number of cars on the road.',
      'This could significantly reduce the number of vehicles in city centres.',
    ],
  },
  {
    type: 'error_correction',
    skill: 'Grammar',
    errorText: 'She don\'t know where is the library.',
    correctedText: 'She doesn\'t know where the library is.',
    hint: 'Check the verb agreement and word order in indirect questions.',
  },
];

export default function ExerciseDemo({ onNavigate }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{
        borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: '#0B1F3A' }}>
            Exercise Practice
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
            Demo — all 5 exercise types
          </div>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('dashboard')}
            style={{
              padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)',
            }}
          >
            ← Back
          </button>
        )}
      </div>

      <ExercisePlayer
        exercises={DEMO_EXERCISES}
        title="MET Practice Session"
        onSessionComplete={({ results, score }) => {
          console.log('Session complete', { results, score });
        }}
      />
    </div>
  );
}
