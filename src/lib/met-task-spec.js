/**
 * met-task-spec.js — Single source of truth for MET task scaffolding.
 *
 * Defines each MET Speaking (Q1–Q5) and Writing (W1Q1–W1Q3, W2) task with the
 * structure, sentence frames, self-check items, and the common trap. Consumed by:
 *   - the exercise player (ShortAnswer / SpeakingRecorder) to scaffold students
 *   - the exercise editor to let teachers tag a speak/short exercise with its task
 *   - AI generation prompts to tag generated exercises with the right task
 *
 * Previously this lived inline in ShortAnswer.jsx, decoupled from authoring (audit
 * findings A1 + A2). Keep this the only definition.
 */

export const MET_TASK_CONFIG = {
  Q1: {
    label: 'Speaking Q1 — Describe a Picture (60s)',
    structure: 'General scene → people/actions → details → possible inference',
    executionFormula: 'General situation (who, where, what) → key details (actions, objects, relationships) → logical inferences',
    stages: [
      'General situation: who, where, what',
      'Key details: actions, objects, relationships',
      'Logical inferences: what may be happening and why',
    ],
    frames: ['This picture shows…', 'In the foreground, I can see…', 'In the background, there is/are…', 'The people seem to be…', 'It looks like…'],
    checks: [
      'I started with a general description of the scene',
      'I described people, their actions, and objects — not just a list of things',
      'I covered foreground, background, and spatial details',
      'I ended with an inference about the situation ("They might be…")',
    ],
    trap: 'Only listing objects without explaining the situation.',
  },
  Q2: {
    label: 'Speaking Q2 — Personal Experience (60s)',
    structure: 'When/where → what happened → result/feeling',
    executionFormula: 'Situation → Problem/Main Event → Action Taken → Result → Reflection/Lesson',
    stages: [
      'Situation: set the scene (when, where, who)',
      'Problem/Main Event: what happened',
      'Action Taken: what you did about it',
      'Result: what was the outcome',
      'Reflection/Lesson: what you learned or felt',
    ],
    frames: ['I remember a time when…', 'This happened when I was…', 'At first…', 'After that…', 'In the end…', 'I felt… because…'],
    checks: [
      'I described a specific experience, not a general habit',
      'I used past tense consistently',
      'I followed the setup → event → result arc',
      'I used narrative connectors (at first, after that, in the end…)',
    ],
    trap: 'Speaking generally instead of telling a specific experience.',
  },
  Q3: {
    label: 'Speaking Q3 — Personal Opinion (60s)',
    structure: 'Opinion → reason 1 → reason 2/example → final comment',
    executionFormula: 'Opinion → Reason 1 → Example → Reason 2 → Conclusion',
    stages: [
      'Opinion: state your clear position',
      'Reason 1: first supporting argument',
      'Example: concrete illustration',
      'Reason 2: second supporting argument',
      'Conclusion: restate and close',
    ],
    frames: ['In my opinion…', 'I believe that…', 'The main reason is…', 'Another reason is…', 'For example…', 'That is why I think…'],
    checks: [
      'I stated ONE clear opinion — not both sides',
      'I gave two reasons or one reason and one example',
      'I used informal but committed language ("I believe…", "I think…")',
      'I did NOT give a balanced answer — this task is ONE-SIDED',
    ],
    trap: 'Giving both sides weakens the answer — this is an opinion task, not a discussion.',
  },
  Q4: {
    label: 'Speaking Q4 — Advantages & Disadvantages (90s)',
    structure: 'Introduction → advantages → disadvantages → balanced conclusion',
    executionFormula: 'Introduce both sides → advantage with support → drawback with support → balanced concluding synthesis',
    stages: [
      'Introduce both sides of the situation',
      'Present one major advantage with support',
      'Contrast with one major drawback with support',
      'Deliver a balanced concluding synthesis',
    ],
    frames: ['There are several advantages to this.', 'One benefit is…', 'However, there are also disadvantages.', 'One problem is…', 'On balance, I think…'],
    checks: [
      'I covered BOTH advantages AND disadvantages — covering only one side loses ~1/3 of marks',
      'I gave roughly equal time to each side',
      'I used NEUTRAL register — no personal opinion in this task',
      'I used a clear transition between sides ("However…", "On the other hand…")',
    ],
    trap: 'Covering only one side, or giving a personal opinion — this task requires neutral, balanced coverage.',
  },
  Q5: {
    label: 'Speaking Q5 — Persuade an Authority (90s)',
    structure: 'Recommendation → reasons → benefits → respectful closing',
    executionFormula: 'Address authority → State problem → Present reasons → Offer practical solution → Formal request',
    stages: [
      'Respectfully address the authority figure',
      'State the core problem clearly',
      'Present strong supporting reasons',
      'Offer a highly practical solution',
      'Close with a direct, formal request',
    ],
    frames: ['I strongly believe that…', 'I would recommend…', 'This would be beneficial because…', 'One important reason is…', 'I understand there may be concerns, but…', 'For these reasons, I hope you will consider this.'],
    checks: [
      'I stated my position or recommendation in the FIRST 10–15 seconds',
      'I used FORMAL register throughout — not "I think", but "I strongly believe…"',
      'I addressed the authority figure directly',
      'I maintained commitment — no hedging or giving the other side',
    ],
    trap: 'Sounding informal, not committing to a position, or presenting both sides — this is a persuasion task, not a discussion.',
  },
  W1Q1: {
    label: 'Writing Task 1 — Question 1',
    structure: 'Direct answer → detail → small explanation',
    responseModel: 'direct answer + reason + concrete personal detail',
    frames: [],
    checks: [
      'I answered the question directly in my first sentence',
      'I added at least one specific detail or example',
      'I expanded beyond a single short sentence',
      'I used appropriate tense (usually past simple or present simple)',
    ],
    trap: 'Giving only one short sentence with no development.',
  },
  W1Q2: {
    label: 'Writing Task 1 — Question 2',
    structure: 'Answer → reason → support',
    responseModel: 'direct answer + reason + concrete personal detail',
    frames: ['Because…', 'Since…', 'For example…', 'However…', 'I prefer…', 'In my opinion…'],
    checks: [
      'I gave a clear reason — not just repeating my Q1 answer',
      'I supported my reason with an example or explanation',
      'I used connectors (because, since, for example, however)',
      'I did NOT simply repeat ideas from Question 1',
    ],
    trap: 'Repeating the same idea from Q1 without expanding it.',
  },
  W1Q3: {
    label: 'Writing Task 1 — Question 3',
    structure: 'Position/idea → explanation → example or consequence',
    responseModel: 'direct answer + reason + concrete personal detail',
    frames: ['Should…', 'Would…', 'Could…', 'Might…', 'On the other hand…', 'As a result…'],
    checks: [
      'I extended the topic — gave advice, a comparison, or a future consequence',
      'I used appropriate modal verbs (should, would, could, might)',
      'I organised my ideas clearly',
      'I answered the EXACT question — not a general comment',
    ],
    trap: 'Ending too quickly or not answering the exact question.',
  },
  W2: {
    label: 'Writing Task 2 — Formal Essay',
    structure: 'Introduction → Body ×2 → Conclusion',
    model: 'Intro → Body 1 → Body 2 → Conclusion',
    assessmentStandards: ['Task Completion', 'Organization', 'Development', 'Grammar Accuracy', 'Vocabulary Range', 'Coherence', 'Register'],
    connectors: ['In addition', 'Furthermore', 'This is because', 'For instance', 'However', 'Overall', 'In conclusion'],
    frames: [],
    checks: [
      'I understood the prompt and gave a clear position or main idea in the introduction',
      'Each body paragraph has one main reason + explanation + example or consequence',
      'I used formal or semi-formal language throughout — no informal spoken phrases',
      'My conclusion restates the main idea and adds a final comment',
      'I wrote at least 250 words and used multiple paragraphs',
    ],
    trap: 'Writing one long paragraph, giving opinions without support, or using informal spoken language.',
  },
};

/** Task keys grouped by exercise type, for editor dropdowns and AI prompts. */
export const MET_SPEAKING_TASKS = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
export const MET_WRITING_TASKS = ['W1Q1', 'W1Q2', 'W1Q3', 'W2'];

/** [{ value, label }] options for a given exercise type ('speak' | 'short'). */
export function metTaskOptions(exerciseType) {
  const keys = exerciseType === 'speak' ? MET_SPEAKING_TASKS
            : exerciseType === 'short' ? MET_WRITING_TASKS
            : [];
  return keys.map(value => ({ value, label: MET_TASK_CONFIG[value].label }));
}
