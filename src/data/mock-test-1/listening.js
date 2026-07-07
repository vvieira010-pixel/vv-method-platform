export const LISTENING_PART1 = {
  id: 'listening-part1',
  label: 'Part 1 — Short Conversations',
  instructions: 'Listen to each conversation and choose the best answer.',
  questions: [
    { id: 'l1', type: 'detail',    audio: '/audio/listening/part1/part1_conv01.mp3', text: 'What is the woman concerned about?', options: ['Class cancellation', 'Holiday opening hours', 'Equipment availability', 'Gym membership cost'], answer: 0 },
    { id: 'l2', type: 'main_idea',      audio: '/audio/listening/part1/part1_conv02.mp3', text: 'What are the speakers discussing?', options: ['Lab equipment problems', 'A science project result', 'Changes to an event schedule', 'A report they submitted'], answer: 2 },
    { id: 'l3', type: 'main_idea',      audio: '/audio/listening/part1/part1_conv03.mp3', text: 'What does the woman want to do?', options: ['Exchange an item she bought', 'Complain about the quality', 'Ask about a discount', 'Get a refund for a jacket'], answer: 0 },
    { id: 'l4', type: 'inference',  audio: '/audio/listening/part1/part1_conv04.mp3', text: 'Why does the man mention not having eaten?', options: ['The caf\u00e9 doesn\'t serve food', 'He wants to eat while they study', 'They are meeting near a restaurant', 'He forgot to bring lunch'], answer: 1 },
    { id: 'l5', type: 'inference',  audio: '/audio/listening/part1/part1_conv05.mp3', text: 'Why does the woman mention her umbrella?', options: ['She broke it at work', 'She wants to borrow one', 'She bought a new one', 'She cannot locate it'], answer: 3 },
    { id: 'l6', type: 'detail',     audio: '/audio/listening/part1/part1_conv06.mp3', text: 'What does the professor tell the man to do?', options: ['Work with another student', 'Find a different topic', 'Submit the essay by himself', 'Ask a classmate for help'], answer: 0 },
    { id: 'l7', type: 'detail',     audio: '/audio/listening/part1/part1_conv07.mp3', text: 'What is the woman happy about?', options: ['Getting praised by a coworker', 'A quiet day at work', 'Leaving work early', 'How quickly the shift passed'], answer: 3 },
    { id: 'l8', type: 'inference',  audio: '/audio/listening/part1/part1_conv08.mp3', text: 'Why did the woman miss part of the festival?', options: ['She only wanted the last film', 'She went to the wrong venue', 'She was delayed by traffic', 'She left before it ended'], answer: 2 },
    { id: 'l9', type: 'detail',     audio: '/audio/listening/part1/part1_conv09.mp3', text: 'What do we learn about the woman?', options: ['She has a research degree', 'She applied for the department head role', 'She previously worked with Dr. Torres', 'She knows the new head personally'], answer: 2 },
    { id: 'l10', type: 'detail',    audio: '/audio/listening/part1/part1_conv10.mp3', text: 'What does the woman prefer to do before buying?', options: ['Read online reviews', 'Try a laptop in person', 'Ask a technician', 'Compare prices online'], answer: 1 },
    { id: 'l11', type: 'inference', audio: '/audio/listening/part1/part1_conv11.mp3', text: 'How does the man feel about another cancellation?', options: ['Not surprised', 'Disappointed', 'Worried', 'Excited'], answer: 0 },
    { id: 'l12', type: 'detail',    audio: '/audio/listening/part1/part1_conv12.mp3', text: 'What does the man suggest about Carlos?', options: ['He wants to join them', 'He is waiting for them', 'He should not be disturbed', 'He finished his work already'], answer: 2 },
    { id: 'l13', type: 'inference', audio: '/audio/listening/part1/part1_conv13.mp3', text: 'What is the woman\'s reaction?', options: ['She plans to move closer', 'She wants to complain', 'She thinks the increase is unfair', 'She is not shocked by it'], answer: 3 },
    { id: 'l14', type: 'inference', audio: '/audio/listening/part1/part1_conv14.mp3', text: 'What will the speakers do next?', options: ['Talk to their professor', 'Read their textbook alone', 'Review study material together', 'Meet other students'], answer: 2 },
    { id: 'l15', type: 'inference', audio: '/audio/listening/part1/part1_conv15.mp3', text: 'Why does the man take this bus?', options: ['It stops closer to the station', 'He does not want to wait for a direct one', 'It arrives faster', 'His ticket is only valid here'], answer: 1 },
    { id: 'l16', type: 'detail',    audio: '/audio/listening/part1/part1_conv16.mp3', text: 'What happened in the electronics section?', options: ['New items arrived', 'Products were sold out during a promotion', 'Staff forgot to restock', 'Shelves were damaged'], answer: 1 },
    { id: 'l17', type: 'inference', audio: '/audio/listening/part1/part1_conv17.mp3', text: 'How does the man feel about street photography?', options: ['It does not interest him', 'He finds it confusing', 'He has never heard of it', 'He loves it'], answer: 3 },
    { id: 'l18', type: 'main_idea',      audio: '/audio/listening/part1/part1_conv18.mp3', text: 'What are the speakers discussing?', options: ['A book they are both reading', 'A film script', 'A homework assignment', 'A story the man is writing'], answer: 3 },
    { id: 'l19', type: 'detail',    audio: '/audio/listening/part1/part1_conv19.mp3', text: 'What will the speakers do?', options: ['Schedule a meeting instead', 'Have dinner on Friday', 'Cancel the dinner', 'Adjust the dinner time'], answer: 1 },
  ],
};

export const LISTENING_PART2 = {
  id: 'listening-part2',
  label: 'Part 2 — Extended Talks',
  instructions: 'Listen to each talk or conversation and answer the questions.',
  conversations: [
    {
      title: 'Conversation A',
      audio: '/audio/listening/part2/conv a.mp3',
      questions: [
        { id: 'l20', type: 'main_idea', text: 'What does the woman want to do?', options: ['Join a photography workshop', 'Rent photography equipment', 'Buy a new camera', 'Get her photos edited'], answer: 0 },
        { id: 'l21', type: 'inference', text: 'Why does the woman ask about beginners?', options: ['To recommend the class to a friend', 'To find out the skill level required', 'To ask for a discount', 'To compare it with another course'], answer: 1 },
        { id: 'l22', type: 'detail', text: 'What does the woman need to bring?', options: ['Editing software', 'Her own camera', 'A registration form', 'Printed guides'], answer: 1 },
        { id: 'l23', type: 'detail', text: 'What must the woman do before Friday?', options: ['Choose her camera model', 'Pay in person only', 'Register for the class', 'Contact the instructor'], answer: 2 },
      ],
    },
    {
      title: 'Conversation B',
      audio: '/audio/listening/part2/conv b.mp3',
      questions: [
        { id: 'l24', type: 'main_idea', text: 'What is the man planning to do?', options: ['Change his career field', 'Start his own engineering firm', 'Study environmental science full time', 'Apply for a promotion at his company'], answer: 0 },
        { id: 'l25', type: 'detail', text: 'What will the man do next to prepare?', options: ['Ask his employer for support', 'Attend a networking event', 'Enroll in a full-time degree', 'Quit his current job'], answer: 0 },
        { id: 'l26', type: 'inference', text: 'What does the man mean when he says the program seems manageable?', options: ['He can complete it without working', 'He can do it while keeping his job', 'It is easier than expected', 'It does not require any certifications'], answer: 1 },
      ],
    },
    {
      title: 'Conversation C',
      audio: '/audio/listening/part2/conv c.mp3',
      questions: [
        { id: 'l27', type: 'detail', text: 'What does the woman still need to do?', options: ['Write a business plan', 'Decide what to sell', 'Find a business partner', 'Register her company name'], answer: 1 },
        { id: 'l28', type: 'inference', text: 'Why does the woman mention her sister?', options: ['She already runs a business', 'She will invest in the bakery', 'She can help with the finances', 'She found a location for the shop'], answer: 2 },
        { id: 'l29', type: 'detail', text: 'What does the woman say about downtown locations?', options: ['They are too far from customers', 'The rent is very high', 'They are not available yet', 'She has already signed a lease'], answer: 1 },
        { id: 'l30', type: 'detail', text: 'What does the man suggest the woman do first?', options: ['Open a large bakery immediately', 'Hire professional staff', 'Apply for a business loan', 'Test demand at smaller markets'], answer: 3 },
      ],
    },
    {
      title: 'Conversation D',
      audio: '/audio/listening/part2/conv d.mp3',
      questions: [
        { id: 'l31', type: 'main_idea', text: 'What are the speakers mainly discussing?', options: ['A documentary about ocean pollution', 'A company environmental policy', 'A news report about fishing', 'A science class assignment'], answer: 0 },
        { id: 'l32', type: 'detail', text: 'What has the man already done to help?', options: ['Started using a reusable bottle', 'Stopped eating fish', 'Convinced his company to change', 'Joined an environmental group'], answer: 0 },
        { id: 'l33', type: 'inference', text: 'What does the man mean when he says corporate changes have a bigger impact?', options: ['He wants to work for an environmental firm', 'Company-level changes affect more people', 'He is suggesting a new company policy', 'He thinks individual actions are useless'], answer: 1 },
      ],
    },
  ],
};

export const LISTENING_PART3 = {
  id: 'listening-part3',
  label: 'Part 3 — Short Talks',
  instructions: 'Listen to each short talk and answer the questions.',
  talks: [
    {
      title: 'Talk A',
      audio: '/audio/listening/part3/conv a.mp3',
      questions: [
        { id: 'l34', type: 'main_idea', text: 'What is the speaker mainly announcing?', options: ['The opening of a new school building', 'Exam results for science students', 'A new school timetable for the year', 'Schedule changes due to a staff event'], answer: 3 },
        { id: 'l35', type: 'detail', text: 'Who will be most affected by the changes?', options: ['All students equally', 'Science and mathematics students', 'Students in the arts department', 'Library staff members'], answer: 1 },
        { id: 'l36', type: 'inference', text: 'Why does the speaker mention the student cafe?', options: ['It will offer free meals that day', 'It will be closed all day Wednesday', 'It is moving to a new location', 'It will close earlier than usual'], answer: 3 },
        { id: 'l37', type: 'inference', text: 'What will probably happen right after this announcement?', options: ['Homeroom teachers will hand out schedules', 'Lab sessions will begin immediately', 'Students will go to the library', 'The coordinator will speak next'], answer: 0 },
      ],
    },
    {
      title: 'Talk B',
      audio: '/audio/listening/part3/conv b.mp3',
      questions: [
        { id: 'l38', type: 'inference', text: 'Why does the speaker mention architects and community groups?', options: ['To describe who urban planners work with', 'To explain who funded a project', 'To introduce other guest speakers', 'To list the most important careers'], answer: 0 },
        { id: 'l39', type: 'detail', text: 'What can listeners pick up on their way out?', options: ['A job application form', 'Information about internships', 'A copy of the speaker\'s project', 'A map of the city center'], answer: 1 },
        { id: 'l40', type: 'inference', text: 'What will the speaker most likely do next?', options: ['Hand out internship applications', 'Show a recent planning project', 'Answer questions from the audience', 'Introduce another guest speaker'], answer: 2 },
        { id: 'l41', type: 'inference', text: 'What does the speaker mean when he says geography wasn\'t an obvious path?', options: ['It was not a typical route into his career', 'His employers were surprised by his degree', 'He didn\'t enjoy studying geography', 'He struggled with the subject at school'], answer: 0 },
      ],
    },
    {
      title: 'Talk C',
      audio: '/audio/listening/part3/conv c.mp3',
      questions: [
        { id: 'l42', type: 'main_idea', text: 'What is the speaker mainly talking about?', options: ['Why people work too many hours', 'The benefits of afternoon naps', 'How to treat sleep disorders', 'The importance of regular sleep'], answer: 3 },
        { id: 'l43', type: 'inference', text: 'Who might benefit most from this information?', options: ['People who exercise every morning', 'People who work night shifts only', 'People who regularly sleep less than six hours', 'People who already sleep nine hours'], answer: 2 },
        { id: 'l44', type: 'detail', text: 'What did the Japan study show?', options: ['Weekend sleep improves work performance', 'Japanese workers sleep more than others', 'Sleep-deprived workers are less productive', 'Six hours of sleep is enough for most people'], answer: 2 },
        { id: 'l45', type: 'main_idea', text: 'What is the speaker\'s main point?', options: ['Sleep needs vary greatly between individuals', 'Sleep disorders require medical treatment', 'Technology is the main cause of sleep loss', 'Good sleep is necessary for health and performance'], answer: 3 },
        { id: 'l46', type: 'inference', text: 'What does the speaker mean by \u201cwhat surprises many people\u201d?', options: ['Most people sleep more than they think', 'People underestimate how tired they are', 'Weekend sleep does not fix weekday sleep loss', 'Sleep research is still very new'], answer: 2 },
      ],
    },
    {
      title: 'Talk D',
      audio: '/audio/listening/part3/conv d.mp3',
      questions: [
        { id: 'l47', type: 'main_idea', text: 'What is the talk mainly about?', options: ['How plants send chemical signals to each other', 'How insects damage tropical plants', 'Why scientists study tropical forests', 'How plants produce food through photosynthesis'], answer: 0 },
        { id: 'l48', type: 'detail', text: 'What does the speaker say about this research?', options: ['It is still considered controversial today', 'It was discovered by Dr. Nguyen', 'It was once thought to be impossible', 'It is very old and well established'], answer: 1 },
        { id: 'l49', type: 'detail', text: 'Why is Dr. Nguyen going to speak?', options: ['To talk about a different plant species', 'To discuss her university position', 'To present findings using special equipment', 'To explain the dangers of field research'], answer: 2 },
        { id: 'l50', type: 'inference', text: 'Why does the speaker say students will be challenged?', options: ['He thinks the topic is very complex', 'He is unfamiliar with Dr. Nguyen\'s work', 'He believes the findings will surprise them', 'He wants them to ask difficult questions'], answer: 2 },
      ],
    },
  ],
};
