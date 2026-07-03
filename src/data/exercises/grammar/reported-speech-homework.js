/**
 * Seed this homework for a given student via localStorage.
 * Usage in browser console:
 *   import('/src/data/reported-speech-homework.js').then(m => m.seedReportedSpeech('student_abc123'));
 */
export async function seedReportedSpeech(studentId) {
  const { saveHomework } = await import('../lib/workflow.js');
  const homeworks = Array.isArray(studentId) ? studentId : [studentId];
  const results = [];
  for (const sid of homeworks) {
    const hw = await saveHomework({
      ...REPORTED_SPEECH_HOMEWORK,
      studentId: sid,
      activities: REPORTED_SPEECH_HOMEWORK.activities.map(a => ({ ...a })),
      topicExplanations: REPORTED_SPEECH_HOMEWORK.topicExplanations.map(t => ({ ...t, content: t.content })),
    });
    results.push(hw);
  }
  window.toast?.(`Reported Speech homework assigned to ${results.length} student(s).`, 'ok');
  return results;
}

export const REPORTED_SPEECH_HOMEWORK = {
  title: 'Reported Speech — What someone said, in your own words',
  objective: 'Understand and use reported speech correctly: shifting tenses, pronouns, time references, and word order for statements, questions, and commands.',
  description: 'Read the topic explanation, then work through the exercises. Pay close attention to how tenses "shift back" when reporting what someone said.',
  skillType: 'grammar',
  type: 'grammar',
  estimatedTime: '20–25 minutes',
  metSkillConnection: 'Writing and Speaking tasks often ask you to report what a patient, colleague, or supervisor said — reported speech helps you do this accurately.',
  selfCheck: [
    'I can explain when and why we shift tenses in reported speech.',
    'I can report a statement, a question, and a command correctly.',
    'I can adjust pronouns and time references when changing direct speech to reported speech.',
  ],
  topicExplanations: [
    {
      id: 'rs_intro',
      title: 'What is Reported Speech?',
      content: `When you tell someone what another person said, you have two choices:

- **Direct speech** — the exact words: *She said, "I am tired."*
- **Reported (indirect) speech** — your paraphrase: *She said she was tired.*

Reported speech is more common in professional communication — you report what a patient reported, what the doctor instructed, or what a colleague mentioned — without quoting them word-for-word.`,
    },
    {
      id: 'rs_tense',
      title: 'Tense Shift (Backshift)',
      content: `When the reporting verb is in the **past tense** (said, told, asked, explained), the verb in the reported clause usually shifts **one tense back**:

- "I feel dizzy." → She said she **felt** dizzy.
- "The lab is closed." → He told me the lab **was closed**.
- "I have finished the report." → She said she **had finished** the report.
- "The patient took the medication." → He said the patient **had taken** the medication.
- "I will check the results." → The doctor said he **would** check the results.
- "You can go home." → The nurse said I **could** go home.
- "You must rest." → The doctor said I **had to** rest.

If the reported speech is still true or relevant **at the time of reporting**, the tense shift is optional: *"The earth orbits the sun." → He said the earth **orbits** (or orbited) the sun.*`,
    },
    {
      id: 'rs_pronouns',
      title: 'Pronoun and Possessive Changes',
      content: `Pronouns and possessives change to reflect the **reporter's perspective**:

- "I am a nurse." → She said **she** was a nurse.
- "We need more staff." → They said **they** needed more staff.
- "Is this your chart?" → He asked if it was **my** chart.
- "My shift starts at 7." → She said **her** shift started at 7.

Think about who is speaking and who is listening. Adjust *I → he/she, we → they, my → his/her, your → my/our* as needed.`,
    },
    {
      id: 'rs_time',
      title: 'Time and Place References',
      content: `Words that refer to **here and now** usually change when reporting something said earlier or elsewhere:

- now → then / at that moment
- today → that day
- yesterday → the day before / the previous day
- tomorrow → the next day / the following day
- here → there
- this week → that week
- last week → the week before
- next week → the following week
- ago → before / earlier

Example: *"I saw the results yesterday." → She said she had seen the results **the day before**.*`,
    },
    {
      id: 'rs_questions',
      title: 'Reporting Questions',
      content: `When reporting a question, two things change:

1. The word order becomes **statement order** (subject before verb — not inverted).
2. Wh-questions keep the question word; yes/no questions use **if** or **whether**.

- Yes/No: "Are you in pain?" → She asked **if** I was in pain.
- Wh-: "Where is the pharmacy?" → He asked **where** the pharmacy was.
- Yes/No: "Did you eat today?" → The nurse asked **whether** I had eaten that day.

Notice: no question mark, no auxiliary verb before the subject, and the tense still shifts back.`,
    },
    {
      id: 'rs_commands',
      title: 'Reporting Commands and Requests',
      content: `To report an order, instruction, or request, use **tell / ask + object + to-infinitive**:

- "Sit down." → He told me **to sit** down.
- "Don't eat before the blood test." → The doctor told me **not to eat** before the blood test.
- "Please wait here." → The receptionist asked me **to wait** there.

Negative commands: *not to + verb*. The reporting verb is usually **told** (stronger) or **asked** (politer).`,
    },
    {
      id: 'rs_summary',
      title: 'Quick Reference: How to Report',
      content: `- **Statements:** *said (that) + clause* → shift tense, pronouns, time/place words.
- **Yes/No questions:** *asked + if/whether + statement word order*.
- **Wh-questions:** *asked + question word + statement word order*.
- **Commands:** *told/asked + person + to-infinitive*. Negative: *not to*.

Always check: did you shift the tense? Did you adjust pronouns? Did you change here/now words? Are questions in statement order?`,
    },
  ],
  activities: [
    {
      id: 'rs_mcq_1',
      type: 'mcq',
      level: 'B1',
      instruction: 'Choose the correct reported speech form.',
      question: 'The patient said, "I feel pain in my lower back." → The patient said that ______ pain in his lower back.',
      options: [
        'he feels',
        'he felt',
        'he has felt',
        'he is feeling',
      ],
      correct: 1,
    },
    {
      id: 'rs_mcq_2',
      type: 'mcq',
      level: 'B1',
      instruction: '',
      question: 'The nurse asked, "Have you taken your medication today?" → The nurse asked ______ taken his medication that day.',
      options: [
        'if he has',
        'if he had',
        'that he had',
        'did he have',
      ],
      correct: 1,
    },
    {
      id: 'rs_mcq_3',
      type: 'mcq',
      level: 'B2',
      instruction: '',
      question: 'The doctor said, "You must stay in bed for 48 hours." → The doctor said I ______ in bed for 48 hours.',
      options: [
        'must stay',
        'had to stay',
        'must have stayed',
        'have to stay',
      ],
      correct: 1,
    },
    {
      id: 'rs_mcq_4',
      type: 'mcq',
      level: 'B2',
      instruction: '',
      question: '"When will the test results arrive?" she asked. → She asked ______.',
      options: [
        'when would the test results arrive',
        'when the test results would arrive',
        'when will the test results arrive',
        'that the test results would arrive',
      ],
      correct: 1,
    },
    {
      id: 'rs_blank_1',
      type: 'blank',
      level: 'B1',
      instruction: 'Type the missing word(s) in each blank (___).',
      template: 'She said, "I work at City Hospital." → She said that ___ at City Hospital.',
      blanks: ['she worked'],
    },
    {
      id: 'rs_blank_2',
      type: 'blank',
      level: 'B1',
      instruction: '',
      template: '"I will call you tomorrow," he said. → He said that he would call me ___.',
      blanks: ['the next day|tomorrow'],
    },
    {
      id: 'rs_blank_3',
      type: 'blank',
      level: 'B2',
      instruction: '',
      template: '"Did the doctor approve the discharge?" I asked. → I asked whether the doctor ___ approved the discharge.',
      blanks: ['had'],
    },
    {
      id: 'rs_fix_1',
      type: 'fix',
      level: 'B1',
      instruction: 'Find and fix the error in each reported speech sentence.',
      errorText: 'The supervisor told that the training starts next week.\nShe asked me where is the conference room.\nThe nurse said I can help you later.\nHe asked that I wanted to work overtime.',
      correctedText: 'The supervisor said that the training started the following week.\nShe asked me where the conference room was.\nThe nurse said she could help me later.\nHe asked if I wanted to work overtime.',
      hint: 'Check: tense shift, question word order, pronoun changes, and whether to use "if" for yes/no questions.',
    },
    {
      id: 'rs_short_1',
      type: 'short',
      level: 'B2',
      instruction: 'Rewrite the following short dialogue as a paragraph using reported speech. Change all four lines. Aim for about 80 words.',
      prompt: 'Doctor: "Take this prescription to the pharmacy."\nPatient: "When should I take the medication?"\nDoctor: "Take one tablet twice a day after meals."\nPatient: "I will start tomorrow morning."',
      rubric: '',
      targetWords: 80,
      scaffolding: {
        vocabulary: ['prescribed', 'instructed', 'explained', 'advised'],
        structure: ['Start with: The doctor told the patient to…', 'Use "asked" for the question.', 'End with: The patient said that…'],
      },
    },
  ],
};
