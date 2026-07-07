export const WRITING_TASKS = {
  task1: {
    label: 'Task 1 — Short Responses',
    instructions: 'Answer each question in 2-4 sentences.',
    questions: [
      { id: 'w1', text: 'What do you like to do in your free time? How often do you do it?', rows: 5 },
      { id: 'w2', text: 'What do you like about that activity and why?', rows: 5 },
      { id: 'w3', text: 'Tell about the last time you did this.', rows: 6 },
    ],
  },
  task2: {
    label: 'Task 2 — Formal Essay',
    instructions: 'Write a well-structured essay of 250+ words.',
    prompt: 'Some university students move away and live on their own while they are attending school, but others live at home with their family while they are students. Which do you think is a better choice?',
    rows: 16,
  },
};
