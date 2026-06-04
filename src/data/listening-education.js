/**
 * listening-education.js
 * MET-Style Listening Practice Set — Theme: Education and Learning (B1–C1)
 *
 * Each exercise carries filter metadata:
 *   part    — 'part1' | 'part2a' | 'part2b' | 'part3'
 *   level   — 'B1-B2' | 'B2' | 'B2-C1'
 *   format  — 'short-conversation' | 'recording' | 'lecture'
 *   theme   — 'education-learning'
 *   title   — human-readable group name
 *
 * Grouped exports:
 *   PART1  — 8 short conversations (B1–B2)
 *   PART2A — Recording 1: Choosing a Study Method (B2)
 *   PART2B — Recording 2: Online Learning After the Pandemic (B2)
 *   PART3  — Academic Lecture: How Technology Can Support Better Learning (B2–C1)
 *   ALL_LISTENING_EDUCATION — flat array of all 20 exercises
 *
 * Filter helpers:
 *   byPart(exercises, 'part1')
 *   byLevel(exercises, 'B2')
 *   byFormat(exercises, 'recording')
 */

/* ── Filter helpers ────────────────────────────────────────────── */
export function byPart(exercises, part) {
  return exercises.filter(e => e.part === part);
}
export function byLevel(exercises, level) {
  return exercises.filter(e => e.level === level);
}
export function byFormat(exercises, format) {
  return exercises.filter(e => e.format === format);
}

/* ── Shared metadata per group ─────────────────────────────────── */
const META_P1  = { part: 'part1',  level: 'B1-B2', format: 'short-conversation', theme: 'education-learning', title: 'Part 1 — Short Conversations' };
const META_P2A = { part: 'part2a', level: 'B2',    format: 'recording',          theme: 'education-learning', title: 'Part 2 — Recording 1: Choosing a Study Method' };
const META_P2B = { part: 'part2b', level: 'B2',    format: 'recording',          theme: 'education-learning', title: 'Part 2 — Recording 2: Online Learning After the Pandemic' };
const META_P3  = { part: 'part3',  level: 'B2-C1', format: 'lecture',            theme: 'education-learning', title: 'Part 3 — Academic Lecture: How Technology Can Support Better Learning' };

/* ── Part 1 — Short Conversations (B1–B2) ─────────────────────── */

export const P1_Q1 = {
  id: 'listen_p1_q1', type: 'listen', plays: 2, ...META_P1,
  pictureHint: 'A student sitting at a desk with books open, looking tired. A phone is next to the books.',
  audioText:
    'Girl: I was going to study for two hours, but I kept checking my phone. ' +
    'Then I got tired and only finished one chapter. ' +
    'Boy: Maybe put your phone in another room next time. ' +
    'Girl: Yeah, that\'s probably the only way I\'ll focus.',
  question: 'What problem did the girl have?',
  options: [
    'She forgot her textbook.',
    'She was distracted while studying.',
    'She studied the wrong chapter.',
    'She could not find her phone.',
  ],
  correct: 1,
  explanation: 'The girl says she "kept checking" her phone and only finished one chapter, so the main problem was distraction.',
};

export const P1_Q2 = {
  id: 'listen_p1_q2', type: 'listen', plays: 2, ...META_P1,
  pictureHint: 'A teacher standing near a digital board while students raise their hands.',
  audioText:
    'Teacher: Okay, before we move on, can someone explain why the answer is C? ' +
    'Don\'t just tell me the letter. Tell me your reasoning. ' +
    'Student: Because the speaker changes his opinion after the second example? ' +
    'Teacher: Exactly.',
  question: 'What does the teacher want the students to do?',
  options: [
    'Guess the answer quickly.',
    'Copy the answer from the board.',
    'Explain how they reached the answer.',
    'Ask fewer questions during class.',
  ],
  correct: 2,
  explanation: 'The teacher says, "Tell me your reasoning," which means students must explain their thinking.',
};

export const P1_Q3 = {
  id: 'listen_p1_q3', type: 'listen', plays: 2, ...META_P1,
  pictureHint: 'Two students watching a video lesson on a laptop.',
  audioText:
    'Man: I actually like online lessons when the teacher gives us short videos first. ' +
    'Then class time feels more useful. ' +
    'Woman: Because you can ask questions instead of just listening? ' +
    'Man: Exactly. I already know the basic idea before class starts.',
  question: 'Why does the man like short videos before class?',
  options: [
    'They replace homework completely.',
    'They help him prepare for class.',
    'They are easier than reading books.',
    'They allow him to skip class.',
  ],
  correct: 1,
  explanation: 'He says he already knows the basic idea before class, so the videos help him prepare.',
};

export const P1_Q4 = {
  id: 'listen_p1_q4', type: 'listen', plays: 2, ...META_P1,
  pictureHint: 'A student looking at a low test score while another student points to a study schedule.',
  audioText:
    'Boy: I don\'t understand. I studied the night before the test. ' +
    'Girl: That might be the problem. You should review a little every day, not everything at once. ' +
    'Boy: Yeah, I guess memorizing at midnight wasn\'t my best plan.',
  question: 'What advice does the girl give?',
  options: [
    'Study in shorter sessions over several days.',
    'Study only the night before the test.',
    'Take fewer notes in class.',
    'Memorize answers instead of concepts.',
  ],
  correct: 0,
  explanation: 'She tells him to "review a little every day," which means using shorter, spaced study sessions.',
};

export const P1_Q5 = {
  id: 'listen_p1_q5', type: 'listen', plays: 2, ...META_P1,
  pictureHint: 'A student speaking nervously in front of a small class.',
  audioText:
    'Woman: I practiced my presentation a lot, but when I stood up, I forgot the first sentence. ' +
    'After that, though, I looked at my notes and continued. ' +
    'Man: That happens. At least you didn\'t stop completely.',
  question: 'What happened during the woman\'s presentation?',
  options: [
    'She refused to present.',
    'She forgot part of it but continued.',
    'She lost all her notes.',
    'She finished earlier than expected.',
  ],
  correct: 1,
  explanation: 'She forgot the first sentence, then used her notes and continued.',
};

export const P1_Q6 = {
  id: 'listen_p1_q6', type: 'listen', plays: 2, ...META_P1,
  pictureHint: 'A classroom with students working in pairs.',
  audioText:
    'Teacher: For this activity, don\'t work alone. ' +
    'Choose a partner, compare your answers, and try to explain your choices in English. ' +
    'Student: Should we write the final answer together? ' +
    'Teacher: Yes, but discuss it first.',
  question: 'What should students do first?',
  options: [
    'Work individually in silence.',
    'Write the answer without speaking.',
    'Compare and discuss their answers.',
    'Ask the teacher for the correct answer.',
  ],
  correct: 2,
  explanation: 'The teacher asks students to choose a partner, compare answers, and explain their choices.',
};

export const P1_Q7 = {
  id: 'listen_p1_q7', type: 'listen', plays: 2, ...META_P1,
  pictureHint: 'A student using headphones and a notebook while listening to an audio lesson.',
  audioText:
    'Girl: I used to pause the recording every few seconds, but now I listen once without stopping. ' +
    'Then I listen again and take notes. ' +
    'Boy: That sounds more like a real test. ' +
    'Girl: Exactly. I\'m trying to build confidence.',
  question: 'What changed in the girl\'s listening practice?',
  options: [
    'She stopped taking notes completely.',
    'She listens once without pausing first.',
    'She studies only with videos now.',
    'She avoids difficult recordings.',
  ],
  correct: 1,
  explanation: 'She says she now listens once without stopping before listening again and taking notes.',
};

export const P1_Q8 = {
  id: 'listen_p1_q8', type: 'listen', plays: 2, ...META_P1,
  pictureHint: 'A student looking at a tablet showing a vocabulary app.',
  audioText:
    'Man: This app reminds me to review old words every few days. ' +
    'It\'s annoying sometimes, but honestly, I remember more now. ' +
    'Woman: So the reminders help? ' +
    'Man: Yeah, especially with words I thought I already knew.',
  question: 'What is the man\'s opinion of the app?',
  options: [
    'It is sometimes annoying but useful.',
    'It is too difficult for his level.',
    'It gives too many wrong answers.',
    'It is only useful for beginners.',
  ],
  correct: 0,
  explanation: 'He says the app is annoying sometimes, but he remembers more, so his opinion is mixed but positive.',
};

/* ── Part 2A — Recording 1: Choosing a Study Method (B2) ────────── */

const P2A_SCRIPT =
  'Woman: Hey, Daniel, you look busy. Are you studying for the history exam already? ' +
  'Man: Kind of. I\'m trying to. But honestly, I don\'t know if I\'m studying the right way. ' +
  'I\'ve been rereading the textbook, but after twenty minutes, everything starts to feel the same. ' +
  'Woman: Yeah, rereading can feel productive, but it doesn\'t always help you remember. ' +
  'Our teacher said retrieval practice works better. ' +
  'Man: Retrieval practice? Is that just a fancy way of saying "take a quiz"? ' +
  'Woman: Sort of, but not exactly. It means trying to remember information before checking your notes. ' +
  'Like, you close the book and ask yourself, "What were the three causes of the conflict?" ' +
  'Then you write what you remember. ' +
  'Man: That sounds harder than rereading. ' +
  'Woman: It is harder. But that\'s the point. ' +
  'When your brain has to work to remember something, the memory usually gets stronger. ' +
  'Man: Hmm. I usually avoid that because I hate realizing how much I don\'t know. ' +
  'Woman: Same. But it\'s better to find out today than during the exam. ' +
  'Also, you don\'t have to do it for hours. ' +
  'You could study one section, close the book, write five questions, and answer them. ' +
  'Man: That sounds manageable. I\'ve also heard about studying in shorter sessions. ' +
  'Like, not doing everything the night before. ' +
  'Woman: Yeah, spacing. I\'m doing thirty minutes a day this week. ' +
  'Nothing dramatic. Just review, quiz myself, and check mistakes. ' +
  'Man: I wish I had started earlier. But I still have three days. ' +
  'Maybe I can do a mini-version of that. ' +
  'Woman: Definitely. Tonight, choose two chapters. ' +
  'Tomorrow, review them again and add the next one. ' +
  'Then the day before the test, do mixed questions from all chapters. ' +
  'Man: That actually sounds like a plan. Not a fun plan, but a plan. ' +
  'Woman: Education is not always glamorous, Daniel. ' +
  'Man: Sadly true.';

export const P2A_Q1 = {
  id: 'listen_p2a_q1', type: 'listen', plays: 2, ...META_P2A,
  pictureHint: '',
  audioText: P2A_SCRIPT,
  question: 'What is the main topic of the conversation?',
  options: [
    'Why history is more difficult than other subjects',
    'How to choose better study strategies for an exam',
    'Why students should read textbooks more slowly',
    'How teachers create history exams',
  ],
  correct: 1,
  explanation: 'The speakers discuss rereading, retrieval practice, spacing, and how Daniel should prepare for his exam.',
};

export const P2A_Q2 = {
  id: 'listen_p2a_q2', type: 'listen', plays: 2, ...META_P2A,
  pictureHint: '',
  audioText: P2A_SCRIPT,
  question: 'According to the woman, what is retrieval practice?',
  options: [
    'Reading the same information many times',
    'Highlighting the most important details',
    'Trying to remember information before checking notes',
    'Listening to a teacher explain a topic again',
  ],
  correct: 2,
  explanation: 'She explains that retrieval practice means closing the book and trying to recall information first.',
};

export const P2A_Q3 = {
  id: 'listen_p2a_q3', type: 'listen', plays: 2, ...META_P2A,
  pictureHint: '',
  audioText: P2A_SCRIPT,
  question: 'How does Daniel feel about retrieval practice at first?',
  options: [
    'He thinks it sounds uncomfortable.',
    'He believes it is too easy.',
    'He has already mastered it.',
    'He thinks it is only useful for vocabulary.',
  ],
  correct: 0,
  explanation: 'Daniel says it sounds harder and admits he dislikes realizing how much he does not know.',
};

export const P2A_Q4 = {
  id: 'listen_p2a_q4', type: 'listen', plays: 2, ...META_P2A,
  pictureHint: '',
  audioText: P2A_SCRIPT,
  question: 'What can be inferred about the woman\'s study habits?',
  options: [
    'She usually waits until the night before exams.',
    'She prefers studying without checking mistakes.',
    'She is trying to study consistently over several days.',
    'She only studies when someone reminds her.',
  ],
  correct: 2,
  explanation: 'She says she is studying thirty minutes a day, reviewing, quizzing herself, and checking mistakes.',
};

/* ── Part 2B — Recording 2: Online Learning After the Pandemic (B2) */

const P2B_SCRIPT =
  'Speaker: Today, I want to talk about online learning — not as a perfect solution, ' +
  'and not as a disaster, either. It\'s more complicated than that. ' +
  'A few years ago, many schools had to move classes online very quickly. ' +
  'At first, both teachers and students were mainly trying to survive the situation. ' +
  'Some lessons were just video calls with worksheets. ' +
  'Some students had poor internet connections. ' +
  'Others had to share a computer with family members. ' +
  'So, when people say "Online learning didn\'t work," we need to ask, ' +
  '"What kind of online learning are we talking about?" ' +
  'Good online learning is not simply a normal class copied onto a screen. ' +
  'It needs different planning. ' +
  'For example, students may need shorter explanations, clearer deadlines, and more frequent check-ins. ' +
  'Teachers may also need to use discussion boards, short quizzes, recorded instructions, and small-group tasks. ' +
  'These tools can help students stay active instead of just watching silently. ' +
  'However, online learning also has limits. ' +
  'Many students miss the energy of the classroom. ' +
  'It can be harder to ask a quick question, notice classmates\' reactions, or feel part of a group. ' +
  'Younger learners especially may need more structure and support. ' +
  'One interesting result is that many schools are now using blended learning. ' +
  'This means students do some work online and some work in person. ' +
  'For example, they might watch a short lecture at home and then use classroom time for discussion, practice, or problem-solving. ' +
  'This approach can be effective because students get flexibility, but they still have personal interaction. ' +
  'So, the real question is not "Is online learning good or bad?" ' +
  'The better question is, "For which students, for which goals, and with what kind of support?" ' +
  'Technology can improve education, but only when it is used with careful teaching decisions.';

export const P2B_Q1 = {
  id: 'listen_p2b_q1', type: 'listen', plays: 2, ...META_P2B,
  pictureHint: '',
  audioText: P2B_SCRIPT,
  question: 'What is the main idea of the talk?',
  options: [
    'Online learning should replace classroom learning completely.',
    'Online learning can work well, but it requires careful design and support.',
    'Online learning failed because students dislike technology.',
    'Teachers should avoid using digital tools in class.',
  ],
  correct: 1,
  explanation: 'The speaker presents a balanced view: online learning has benefits and limits, and it works best with careful planning.',
};

export const P2B_Q2 = {
  id: 'listen_p2b_q2', type: 'listen', plays: 2, ...META_P2B,
  pictureHint: '',
  audioText: P2B_SCRIPT,
  question: 'What does the speaker say about early online classes?',
  options: [
    'They were always carefully planned.',
    'They were mostly more effective than in-person classes.',
    'Many were created quickly under difficult conditions.',
    'Most students had excellent technology access.',
  ],
  correct: 2,
  explanation: 'The speaker says schools moved online quickly, and many people were trying to "survive the situation."',
};

export const P2B_Q3 = {
  id: 'listen_p2b_q3', type: 'listen', plays: 2, ...META_P2B,
  pictureHint: '',
  audioText: P2B_SCRIPT,
  question: 'Which of the following is mentioned as a possible problem with online learning?',
  options: [
    'Students may miss classroom interaction.',
    'Teachers cannot give homework online.',
    'Students always learn too quickly.',
    'Online tools prevent discussion.',
  ],
  correct: 0,
  explanation: 'The speaker says students may miss the energy of the classroom, quick questions, and group feeling.',
};

export const P2B_Q4 = {
  id: 'listen_p2b_q4', type: 'listen', plays: 2, ...META_P2B,
  pictureHint: '',
  audioText: P2B_SCRIPT,
  question: 'What is the speaker\'s attitude toward educational technology?',
  options: [
    'Strongly negative',
    'Completely uncritical',
    'Balanced and cautious',
    'Confused and uncertain',
  ],
  correct: 2,
  explanation: 'The speaker says technology can help, but only when used with careful teaching decisions.',
};

/* ── Part 3 — Academic Lecture (B2–C1) ────────────────────────── */

const P3_SCRIPT =
  'Professor: Good morning, everyone. ' +
  'Today we\'re going to examine a question that sounds simple but is actually quite complex: ' +
  'Can educational technology improve learning? ' +
  'Now, many people assume that adding technology automatically makes learning more modern, more efficient, or more engaging. ' +
  'But from a learning science perspective, the tool itself is less important than the learning behavior it encourages. ' +
  'Let\'s begin with an example. ' +
  'Imagine two students using the same vocabulary app. ' +
  'Student A quickly taps through flashcards while watching television. ' +
  'Student B looks at each word, says an example sentence aloud, checks the meaning, and later reviews missed items. ' +
  'Technically, both students are "using technology," but only one is using it in a way that supports deep learning. ' +
  'This brings us to the first key principle: active recall. ' +
  'Active recall means trying to produce information from memory instead of simply recognizing it. ' +
  'For example, answering a question without looking at your notes is usually more powerful than rereading the same page. ' +
  'Educational apps can support active recall if they require students to retrieve answers, explain concepts, or solve problems before receiving feedback. ' +
  'The second principle is spaced practice. ' +
  'Research in learning science has shown that reviewing information over time is generally more effective than studying everything in one long session. ' +
  'Many digital platforms now use spaced repetition systems. ' +
  'These systems show difficult items more often and easier items less often. ' +
  'That sounds efficient, but there is a warning here: ' +
  'students may rely too much on the app\'s schedule and stop making independent decisions about what they need to study. ' +
  'The third principle is feedback. ' +
  'Good feedback should help learners understand not only whether an answer is correct, but why. ' +
  'A simple red X may tell a student that something is wrong, but it does not teach them how to improve. ' +
  'Stronger feedback might say, "Your answer is partly correct, but you confused the cause with the result." ' +
  'That kind of message guides the next attempt. ' +
  'Finally, let\'s consider motivation. ' +
  'Technology can make learning feel more interactive. ' +
  'Points, badges, progress bars, and streaks can encourage students to return regularly. ' +
  'However, these features can also create shallow motivation. ' +
  'A learner may focus on maintaining a streak rather than improving a skill. ' +
  'So, teachers need to connect digital tasks to meaningful goals, ' +
  'such as preparing for a speaking test, understanding a lecture, or communicating more clearly at work. ' +
  'To summarize, educational technology is not automatically effective or ineffective. ' +
  'Its value depends on how it is designed, how it is used, and how teachers connect it to learning goals. ' +
  'The best digital tools do not replace good teaching. They support it.';

export const P3_Q1 = {
  id: 'listen_p3_q1', type: 'listen', plays: 2, ...META_P3,
  pictureHint: '',
  audioText: P3_SCRIPT,
  question: 'What is the main purpose of the lecture?',
  options: [
    'To argue that technology should replace traditional teaching',
    'To explain how technology can support learning when used appropriately',
    'To compare vocabulary apps with classroom textbooks',
    'To criticize students who use learning apps incorrectly',
  ],
  correct: 1,
  explanation: 'The professor explains that technology can help learning, but only when it encourages effective learning behaviors.',
};

export const P3_Q2 = {
  id: 'listen_p3_q2', type: 'listen', plays: 2, ...META_P3,
  pictureHint: '',
  audioText: P3_SCRIPT,
  question: 'According to the professor, what matters most when evaluating educational technology?',
  options: [
    'Whether the tool looks modern',
    'Whether students enjoy the design',
    'What learning behavior the tool encourages',
    'How expensive the tool is',
  ],
  correct: 2,
  explanation: 'The professor says the tool itself is less important than the learning behavior it encourages.',
};

export const P3_Q3 = {
  id: 'listen_p3_q3', type: 'listen', plays: 2, ...META_P3,
  pictureHint: '',
  audioText: P3_SCRIPT,
  question: 'Which action best describes active recall, according to the professor?',
  options: [
    'Rereading the same paragraph several times',
    'Answering a question without looking at your notes',
    'Highlighting every unknown word in a text',
    'Watching a video without taking notes',
  ],
  correct: 1,
  explanation: 'Active recall means producing information from memory. Answering without looking at notes is the clearest example given.',
};

export const P3_Q4 = {
  id: 'listen_p3_q4', type: 'listen', plays: 2, ...META_P3,
  pictureHint: '',
  audioText: P3_SCRIPT,
  question: 'What warning does the professor give about spaced repetition apps?',
  options: [
    'They usually show easy items too often.',
    'They may stop students from making their own study decisions.',
    'They are only useful for advanced students.',
    'They make feedback less important.',
  ],
  correct: 1,
  explanation: 'The professor says students may rely too much on the app\'s schedule and stop deciding what they need to study.',
};

export const P3_Q5 = {
  id: 'listen_p3_q5', type: 'listen', plays: 2, ...META_P3,
  pictureHint: '',
  audioText: P3_SCRIPT,
  question: 'In what order does the professor discuss the learning principles?',
  options: [
    'Feedback → Active recall → Motivation → Spaced practice',
    'Active recall → Spaced practice → Feedback → Motivation',
    'Motivation → Feedback → Spaced practice → Active recall',
    'Spaced practice → Active recall → Feedback → Motivation',
  ],
  correct: 1,
  explanation: 'The lecture discusses active recall first, then spaced practice, then feedback, and finally motivation.',
};

export const P3_Q6 = {
  id: 'listen_p3_q6', type: 'listen', plays: 2, ...META_P3,
  pictureHint: '',
  audioText: P3_SCRIPT,
  question: 'What does the professor say about a simple red X as feedback?',
  options: [
    'It is the most effective kind of feedback.',
    'It encourages students to try harder next time.',
    'It tells students something is wrong but not how to improve.',
    'It is only appropriate for younger learners.',
  ],
  correct: 2,
  explanation: 'The professor says a red X tells students something is wrong but does not teach them how to improve.',
};

export const P3_Q7 = {
  id: 'listen_p3_q7', type: 'listen', plays: 2, ...META_P3,
  pictureHint: '',
  audioText: P3_SCRIPT,
  question: 'What can be inferred about the professor\'s view of teachers?',
  options: [
    'Teachers are less important when students use technology.',
    'Teachers should only use technology for homework.',
    'Teachers play an important role in connecting technology to learning goals.',
    'Teachers should avoid apps because they reduce motivation.',
  ],
  correct: 2,
  explanation: 'The professor says teachers need to connect digital tasks to meaningful goals and that tools support good teaching rather than replace it.',
};

export const P3_Q8 = {
  id: 'listen_p3_q8', type: 'listen', plays: 2, ...META_P3,
  pictureHint: '',
  audioText: P3_SCRIPT,
  question: 'Which statement best reflects the professor\'s conclusion?',
  options: [
    'Technology is effective only when students use expensive tools.',
    'Digital tools should support good teaching, not replace it.',
    'Learning technology is always more effective than classroom instruction.',
    'Motivation features always lead to deep learning.',
  ],
  correct: 1,
  explanation: 'The professor concludes that technology\'s value depends on design, use, and goals, and that good tools support teaching rather than replace it.',
};

/* ── Grouped exports ───────────────────────────────────────────── */

/** Part 1 — 8 short conversations (B1–B2) */
export const PART1  = [P1_Q1, P1_Q2, P1_Q3, P1_Q4, P1_Q5, P1_Q6, P1_Q7, P1_Q8];

/** Part 2A — Recording 1: Choosing a Study Method (B2) */
export const PART2A = [P2A_Q1, P2A_Q2, P2A_Q3, P2A_Q4];

/** Part 2B — Recording 2: Online Learning After the Pandemic (B2) */
export const PART2B = [P2B_Q1, P2B_Q2, P2B_Q3, P2B_Q4];

/** Part 3 — Academic Lecture: How Technology Can Support Better Learning (B2–C1) */
export const PART3  = [P3_Q1, P3_Q2, P3_Q3, P3_Q4, P3_Q5, P3_Q6, P3_Q7, P3_Q8];

/** All 20 exercises flat */
export const ALL_LISTENING_EDUCATION = [...PART1, ...PART2A, ...PART2B, ...PART3];

export default ALL_LISTENING_EDUCATION;
