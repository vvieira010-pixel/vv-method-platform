let _seq = 0;
function drId(prefix = 'dr') {
  return `${prefix}_${Date.now().toString(36)}_${(++_seq).toString(36)}`;
}

const LISTENING = [
  {
    id: drId('dr_L01'), type: 'read', level: 'B2', skill: 'Listening', hidePassage: true,
    source: 'MET B2 Listening — L-01',
    passage: 'W: Are you going to the careers workshop this afternoon?\nM: Not today. They moved it to next Thursday because the guest speaker missed her flight.\nW: I\'m glad you told me. I was about to leave for the hall.\nN: What does the man say about the workshop?',
    questions: [
      { id: drId('drq'), question: 'What does the man say about the workshop?', options: ['It has started late.', 'It will happen on another day.', 'It is only for new students.', 'It has changed rooms.'], correct: 1 },
    ],
  },
  {
    id: drId('dr_L02'), type: 'read', level: 'B2', skill: 'Listening', hidePassage: true,
    source: 'MET B2 Listening — L-02',
    passage: 'W: Did you print the handouts for the meeting?\nM: I tried, but the printer is out of paper, so I emailed everyone a copy instead.\nW: Fine. That should work for today.\nN: What problem did the man have?',
    questions: [
      { id: drId('drq'), question: 'What problem did the man have?', options: ['He forgot the handouts at home.', 'The printer had no paper.', 'He sent the wrong file.', 'The meeting started early.'], correct: 1 },
    ],
  },
  {
    id: drId('dr_L03'), type: 'read', level: 'B2', skill: 'Listening', hidePassage: true,
    source: 'MET B2 Listening — L-03',
    passage: 'M: I can\'t believe your phone still works after all these years.\nW: Barely. I\'m keeping it until next month, when the newer model goes on sale.\nN: What will the woman probably do next month?',
    questions: [
      { id: drId('drq'), question: 'What will the woman probably do next month?', options: ['Repair her old phone.', 'Borrow a phone from a friend.', 'Change her phone plan.', 'Buy a new phone.'], correct: 3 },
    ],
  },
  {
    id: drId('dr_L04'), type: 'read', level: 'B2', skill: 'Listening', hidePassage: true,
    source: 'MET B2 Listening — L-04',
    passage: 'W: Could you close the window? The traffic is really loud today.\nM: I\'d rather leave it open because it\'s warm in here, but if the noise is bothering you, I can shut it.\nN: What does the man mean?',
    questions: [
      { id: drId('drq'), question: 'What does the man mean?', options: ['He thinks the room is already too cold.', 'He wants the woman to move seats.', 'He prefers the window open but is willing to close it.', 'He cannot hear the traffic at all.'], correct: 2 },
    ],
  },
  {
    id: drId('dr_L05'), type: 'read', level: 'B2', skill: 'Listening', hidePassage: true,
    source: 'MET B2 Listening — L-05',
    passage: 'N: Listen to a conversation between a student and an academic advisor.\nAdvisor: So, you\'re thinking about taking Introduction to Marketing next term?\nStudent: Yes, but the only section I can see is on Tuesday evenings, and that\'s when I usually work.\nAdvisor: There is an online section, but it fills up quickly. If you want that one, you should register today.\nStudent: I was hoping to take the in-person class because I learn better when I can ask questions right away.\nAdvisor: That makes sense. Still, the online section might be the better choice if your work schedule can\'t change.\nStudent: True. I\'ll call my manager this afternoon and see whether I can switch shifts. If not, I\'ll take the online class.\nN: Now answer the questions.',
    questions: [
      { id: drId('drq'), question: 'Why is the student worried about the course?', options: ['He has already failed it once.', 'He may not be free at the class time.', 'He cannot find the classroom.', 'He thinks the teacher is too strict.'], correct: 1 },
      { id: drId('drq'), question: 'What will the student probably do first?', options: ['Drop the course completely.', 'Register for a different subject.', 'Ask his manager about his work hours.', 'Join the online class immediately.'], correct: 2 },
    ],
  },
  {
    id: drId('dr_L06'), type: 'read', level: 'B2', skill: 'Listening', hidePassage: true,
    source: 'MET B2 Listening — L-06',
    passage: 'N: Listen to a conversation in a bike rental shop.\nAssistant: Are you renting for the city or for the trails?\nCustomer: For the trails. My brother is visiting, and we planned a ride for Saturday.\nAssistant: In that case, I should tell you that the hill trail is partly closed after last week\'s heavy rain.\nCustomer: Oh. Is there another route you\'d recommend?\nAssistant: Yes. The river route is open, and it\'s easier too. I\'d also suggest helmets and a repair kit.\nCustomer: We definitely need helmets. Do they come with the bikes?\nAssistant: They do, but the repair kit costs extra.\nCustomer: That\'s fine. Let\'s do two bikes, two helmets, and one repair kit.\nN: Now answer the questions.',
    questions: [
      { id: drId('drq'), question: 'Why does the assistant mention the hill trail?', options: ['To explain why the shop is busy', 'To warn the customer about a route problem', 'To suggest a more expensive bike', 'To ask whether the customer is experienced'], correct: 1 },
      { id: drId('drq'), question: 'What will the customer probably rent?', options: ['Two bikes and one helmet', 'One bike and one repair kit', 'Two bikes, helmets, and a repair kit', 'Two bikes only'], correct: 2 },
    ],
  },
  {
    id: drId('dr_L07'), type: 'read', level: 'B2', skill: 'Listening', hidePassage: true,
    source: 'MET B2 Listening — L-07',
    passage: 'N: Listen to two roommates talking about an apartment.\nW: I like the apartment on Green Street. It\'s cheaper than the others, and the kitchen is much nicer.\nM: I liked that one too, but it\'s pretty far from the train station.\nW: That\'s true, although the bus stop is right outside.\nM: Did you notice how small the bedrooms were? I\'m not sure my desk would fit.\nW: Mine probably would, but just barely. On the other hand, internet is included in the rent, which would save us money every month.\nM: Good point. Why don\'t we visit it again on Friday and measure the rooms?\nW: That sounds like the best plan.\nN: Now answer the questions.',
    questions: [
      { id: drId('drq'), question: 'What does the woman see as an advantage of the apartment?', options: ['It is close to the train station.', 'It has larger bedrooms.', 'It costs less and has a better kitchen.', 'It has new furniture included.'], correct: 2 },
      { id: drId('drq'), question: 'What do the speakers decide to do?', options: ['Sign the contract that day', 'Visit the apartment again', 'Look for a third roommate', 'Cancel all future viewings'], correct: 1 },
    ],
  },
  {
    id: drId('dr_L08'), type: 'read', level: 'B2', skill: 'Listening', hidePassage: true,
    source: 'MET B2 Listening — L-08',
    passage: 'N: Listen to a volunteer coordinator speaking at a museum.\nCoordinator: Welcome, everyone, and thank you for volunteering at the City Museum this weekend. Please arrive fifteen minutes before your shift starts so you have time to collect your name badge and leave your bags in the staff room. During the event, most of you will be helping visitors find the correct galleries. If a visitor asks you a question you cannot answer, do not guess. Instead, send the visitor to the information desk near the main entrance. Finally, remember that food and drinks are not allowed in the exhibition rooms, so please finish them before you begin your shift.\nN: Now answer the questions.',
    questions: [
      { id: drId('drq'), question: 'What is the main purpose of the talk?', options: ['To invite people to a new museum exhibition', 'To explain weekend procedures to volunteers', 'To describe the history of the museum', 'To advertise paid positions'], correct: 1 },
      { id: drId('drq'), question: 'What should volunteers do if they do not know an answer?', options: ['Ask another visitor', 'Look it up on their phones', 'Send the visitor to the information desk', 'Write the question down for later'], correct: 2 },
    ],
  },
  {
    id: drId('dr_L09'), type: 'read', level: 'B2', skill: 'Listening', hidePassage: true,
    source: 'MET B2 Listening — L-09',
    passage: 'N: Listen to a public service announcement.\nAnnouncer: This is a reminder for residents of North Park. Water service will be temporarily interrupted tonight from ten p.m. until approximately six a.m. while the city replaces an old underground pipe. Residents are advised to store enough water for drinking and basic cleaning before ten p.m. If possible, avoid using washing machines or dishwashers until service is fully restored in the morning. A supply tank with bottled water will be available at the North Park Community Center for elderly residents and others with urgent needs.\nN: Now answer the questions.',
    questions: [
      { id: drId('drq'), question: 'Why will the water service be interrupted?', options: ['Because of unusually hot weather', 'Because the city is replacing a pipe', 'Because the community center is being repaired', 'Because residents used too much water'], correct: 1 },
      { id: drId('drq'), question: 'Who is the bottled water especially intended for?', options: ['Visitors from outside the area', 'Families with school-age children', 'Residents with urgent needs, including older people', 'City workers on the night shift'], correct: 2 },
    ],
  },
  {
    id: drId('dr_L11'), type: 'read', level: 'B2', skill: 'Listening', hidePassage: true,
    source: 'MET B2 Listening — L-11 (healthcare)',
    passage: 'N: Listen to a nurse giving a handoff report to the next shift.\nNurse: Room 204, Mr. Thompson, admitted yesterday with pneumonia. He completed his first dose of IV antibiotics at six p.m. and tolerated it well. His temperature this morning was 37.8, down from 38.5 yesterday. He is still on oxygen at two liters, and his saturation is holding at 96 percent. He can eat soft foods but has had a reduced appetite. The main concern is his mobility — he is at risk of falls, so please ensure the bed alarm is on and assist him to the bathroom. His wife will visit at seven. That is all for now.\nN: Now answer the questions.',
    questions: [
      { id: drId('drq'), question: 'Why was Mr. Thompson admitted to the hospital?', options: ['He had a heart condition.', 'He has pneumonia.', 'He broke his leg.', 'He had an allergic reaction.'], correct: 1 },
      { id: drId('drq'), question: 'What is the main safety concern mentioned by the nurse?', options: ['The patient may have an allergic reaction to the antibiotics.', 'The patient is at risk of falling.', 'The patient\'s oxygen level is too low.', 'The patient refuses to eat.'], correct: 1 },
    ],
  },
  {
    id: drId('dr_L10'), type: 'read', level: 'B2', skill: 'Listening', hidePassage: true,
    source: 'MET B2 Listening — L-10',
    passage: 'N: Listen to part of a podcast.\nHost: When people feel stuck on a problem, they often assume they should stay at their desks and try harder. In fact, short walks can be surprisingly productive. Movement changes your environment and can interrupt repetitive thinking. One design team I interviewed now holds ten-minute walking meetings whenever they cannot agree on a solution. They say the conversations become calmer, and people tend to suggest more creative ideas. Of course, walking is not a replacement for focused work. You still need time to sit down, review options, and make a decision. But if your thinking starts to go in circles, getting up may be exactly what helps.\nN: Now answer the questions.',
    questions: [
      { id: drId('drq'), question: 'What is the speaker\'s main point?', options: ['Good ideas only come from group discussions', 'Walking can help people think more effectively', 'Meetings should always take place outdoors', 'Designers are more creative than other workers'], correct: 1 },
      { id: drId('drq'), question: 'Why does the speaker mention the design team?', options: ['To show an example of the strategy in practice', 'To criticize the way they make decisions', 'To explain why meetings waste time', 'To argue against working at a desk'], correct: 0 },
    ],
  },
];

const READING = [
  {
    id: drId('dr_R01'), type: 'read', level: 'B2', skill: 'Reading',
    source: 'Texto original para este pacote.',
    passage: 'For years, people have complained that modern products are made to be replaced, not repaired. A broken toaster or lamp is often cheaper to throw away than to fix, especially if spare parts are expensive or difficult to find. In response, many cities have seen the growth of "repair cafés," informal events where volunteers help local residents examine damaged objects and, when possible, repair them. At first glance, these gatherings may look like a practical way to save money. In reality, their biggest effect may be social rather than financial.\n\nAt a typical repair café, visitors bring household items, clothing, toys, or small electronics. They sit with volunteers who have experience in sewing, wiring, woodworking, or basic mechanical repair. The atmosphere is usually patient rather than hurried. Nobody promises that every object can be saved, and even when something cannot be fixed, the owner often leaves with a better understanding of why it failed. That educational aspect matters. In everyday life, many people interact with devices only as users, not as problem-solvers. A repair café slows that relationship down.\n\nThe financial side is more complicated than many supporters admit. Some products are so poorly designed that opening them does more damage. Others require parts that simply are not available. In such cases, a repair café cannot compete with mass retail. Even so, people continue to attend. Organizers say that visitors often return with a second or third object, not because they expect every repair to succeed, but because they value the process itself. They enjoy meeting people with useful skills and seeing that practical knowledge still exists within their community.\n\nThere is also an emotional element. When an item has been in a family for years, replacing it can feel like giving up on a small part of personal history. A lamp from a grandparent\'s house or a jacket repaired several times already may not be valuable in the market, but it can still matter to its owner. Repair cafés make space for that attitude. They encourage a view of possessions as things with stories, not only functions.\n\nCritics sometimes argue that repair culture is too small to make a real difference in global waste. They are probably right in one sense: a few volunteers in a public library cannot transform industrial manufacturing. Yet it would be a mistake to judge these events only by the number of objects they save. Their larger contribution may be the habit they promote — the habit of pausing before replacing, asking questions before buying, and seeing broken things as problems to understand rather than reasons to consume again.',
    questions: [
      { id: drId('drq'), question: 'What is the main idea of the article?', options: ['Repair cafés are mainly successful because they reduce shopping costs.', 'Repair cafés matter as much for community learning and attitudes as for repair itself.', 'Repair cafés should receive government funding in every city.', 'Modern devices are impossible to repair.'], correct: 1 },
      { id: drId('drq'), question: 'Why does the author mention people returning with a second or third object?', options: ['To show that repairs always succeed', 'To suggest that volunteers charge low prices', 'To support the idea that visitors value the process, not only the result', 'To prove that old products are better made'], correct: 2 },
      { id: drId('drq'), question: 'What does the phrase "slows that relationship down" most nearly mean?', options: ['It makes people buy fewer devices for a short time', 'It gives people more time to understand how objects work', 'It forces volunteers to work more carefully', 'It delays the opening of the event'], correct: 1 },
      { id: drId('drq'), question: 'Which statement would the author most likely agree with?', options: ['Repair cafés are useful even when they do not fix every item.', 'Repair cafés should focus only on expensive objects.', 'Emotional attachment makes repair decisions irrational.', 'Community events should avoid dealing with electronics.'], correct: 0 },
      { id: drId('drq'), question: 'What is the author\'s attitude toward repair cafés?', options: ['Strongly negative', 'Cautiously supportive', 'Completely impartial', 'Mainly disappointed'], correct: 1 },
    ],
  },
  {
    id: drId('dr_R02'), type: 'read', level: 'B2', skill: 'Reading',
    source: 'Texto original.',
    passage: 'Libraries are often imagined as places defined by silence. For some users, that expectation is exactly the point. They want an environment where conversation is limited and attention can settle. Yet many modern libraries are rethinking what silence should mean. Instead of separating people completely, some are creating spaces that encourage what designers call "quiet togetherness": being in the presence of others without being required to speak to them.\n\nThis idea has grown partly because of changes in work and study habits. More people now divide their day between home, cafés, transport, and temporary study spaces. Working alone at home may be comfortable, but it can also feel isolating. Busy cafés solve the loneliness problem, although they create a different one: noise, movement, and the expectation that customers keep buying something. Libraries occupy a useful middle position. They can offer a public environment where people feel accompanied by others while still being protected from the pressure to socialize or consume.\n\nQuiet togetherness is not simply another name for a silent room. In some libraries, it appears through layout decisions rather than rules. Tables are placed in ways that allow people to notice one another without interrupting concentration. Lighting is warm rather than severe. There may be soft indicators that remind users to lower their voices, but staff do not try to remove every sound from the space. The goal is not total silence; it is a shared understanding that everyone is there for focused activity.\n\nSupporters say this approach has psychological value. Seeing others reading, writing, or studying can make difficult tasks feel more manageable. People often work longer when they sense a collective purpose around them. At the same time, they are spared the effort of conversation, which can be exhausting after a long day. In other words, quiet togetherness offers companionship without demand.\n\nNot everyone likes the concept. Some traditional users worry that any move away from strict silence weakens the identity of the library. Others say the term is too vague to guide policy. These concerns are reasonable. A library that becomes too relaxed risks disappointing users who need deep concentration. Still, the most successful examples seem to rely on balance rather than replacement. They keep silent rooms for those who want them while also designing other zones where social presence is possible without becoming intrusive.\n\nThe popularity of these spaces suggests that public institutions still have an important role in urban life. People do not always need entertainment, advice, or conversation. Sometimes they simply need a place to be serious, together.',
    questions: [
      { id: drId('drq'), question: 'The article is mainly about', options: ['why cafés are better than libraries for studying', 'how libraries are adapting public study space for modern users', 'why strict silence should return to libraries', 'how urban design affects transportation'], correct: 1 },
      { id: drId('drq'), question: 'Why does the author mention cafés?', options: ['To argue that libraries should sell drinks', 'To show that cafés are more affordable than libraries', 'To contrast a social but noisy option with the library model', 'To explain where librarians prefer to work'], correct: 2 },
      { id: drId('drq'), question: 'What is true of "quiet togetherness," according to the article?', options: ['It requires users to work in groups.', 'It removes all sound from a space.', 'It allows social presence without demanding conversation.', 'It is only useful for school students.'], correct: 2 },
      { id: drId('drq'), question: 'Which concern do critics raise?', options: ['The concept may be too unclear to guide decisions.', 'Libraries are spending too much on furniture.', 'Silent rooms have become unpopular.', 'Staff members are unwilling to enforce rules.'], correct: 0 },
      { id: drId('drq'), question: 'What is the author\'s attitude?', options: ['Supportive, while recognizing possible limits', 'Opposed to any change in library design', 'Uncertain because there is no evidence', 'Mostly amused by a passing trend'], correct: 0 },
    ],
  },
  {
    id: drId('dr_R03'), type: 'read', level: 'B2', skill: 'Reading',
    source: 'Conjunto original.',
    passage: 'Text A: Rail company brochure\nNight travel gives you a full day at your destination instead of a long journey in daylight. On our new Moonline route, passengers can choose standard seats, shared sleeper cabins, or private cabins with breakfast included. Free Wi-Fi is available in all cars, and bicycles may be transported for an additional fee if booked in advance. The service leaves Central Station at 21:40 and arrives in River City at 07:10.\n\nText B: Travel blog\nI took the Moonline last month and was surprised by how rested I felt on arrival. The cabin was small, but much quieter than I expected. The only real inconvenience was breakfast, which was delivered too early for me. I would definitely choose the train again over a budget flight, especially because I didn\'t lose half a day getting to and from airports.\n\nText C: News report\nRegional officials say the return of overnight rail could reduce short domestic flights if prices remain competitive. However, transport analysts warn that the service will only attract regular users if reliability improves. In earlier trials, delays on morning arrival made the option less appealing to business travelers. Operators insist the new timetable includes greater recovery time to avoid that problem.',
    questions: [
      { id: drId('drq'), question: 'What is the purpose of Text A?', options: ['To criticize airline travel', 'To describe and promote a service', 'To report on transport policy', 'To compare train companies'], correct: 1 },
      { id: drId('drq'), question: 'What complaint does the writer of Text B mention?', options: ['The train was noisy', 'Breakfast came too early', 'Wi-Fi was unreliable', 'The cabin was expensive'], correct: 1 },
      { id: drId('drq'), question: 'According to Text C, what condition is important for long-term success?', options: ['Free bicycle transport', 'Fewer sleeper cabins', 'Competitive prices and reliable arrival times', 'Later evening departures'], correct: 2 },
      { id: drId('drq'), question: 'Which text is most positive in tone?', options: ['Text A', 'Text B', 'Text C', 'All are equally neutral'], correct: 1 },
      { id: drId('drq'), question: 'Which idea appears in more than one text?', options: ['Airport security is stressful', 'Night trains appeal partly because they save daytime hours', 'Private cabins should be removed', 'Breakfast quality determines user satisfaction'], correct: 1 },
    ],
  },
  {
    id: drId('dr_R04'), type: 'read', level: 'B2', skill: 'Reading',
    source: 'Conjunto original.',
    passage: 'Text A: Festival volunteer notice\nVolunteers are needed for the Riverside Food Festival next month. Tasks include greeting visitors, checking tickets, and helping stall owners move light equipment before opening. Morning and evening shifts are available. Volunteers receive a festival T-shirt, free entry on one day, and a reference letter on request.\n\nText B: Email from a volunteer coordinator\nThanks for your interest in helping at the festival. Since you said you\'re comfortable speaking to the public, the greeting team might suit you best. Please note that the morning shift starts at 7:30 a.m., earlier than many first-time volunteers expect. If that is a problem, let me know and I can assign you to an afternoon role instead.\n\nText C: Volunteer review\nI volunteered last year and ended up enjoying it more than I expected. The work was tiring at times, especially before the gates opened, but the team leaders explained things clearly and everyone was friendly. What I appreciated most was being trusted to solve small problems instead of waiting for instructions all the time.',
    questions: [
      { id: drId('drq'), question: 'Which text is mainly designed to recruit people?', options: ['Text A', 'Text B', 'Text C', 'Texts A and C'], correct: 0 },
      { id: drId('drq'), question: 'What does Text B suggest about the candidate?', options: ['They asked for office work only.', 'They may be well suited to greeting visitors.', 'They volunteered the previous year.', 'They are not available in the afternoon.'], correct: 1 },
      { id: drId('drq'), question: 'What is the reviewer\'s overall opinion in Text C?', options: ['Mostly negative', 'Positive despite some tiring moments', 'Unclear because of missing details', 'Frustrated with management'], correct: 1 },
      { id: drId('drq'), question: 'Which text mentions a possible scheduling issue?', options: ['Text A only', 'Text B only', 'Text C only', 'Texts A and B'], correct: 3 },
      { id: drId('drq'), question: 'Which statement is supported by the set as a whole?', options: ['Festival volunteering is unpaid but may bring other benefits.', 'New volunteers cannot speak to the public.', 'All roles begin before 8:00 a.m.', 'Team leaders expect volunteers to work independently immediately.'], correct: 0 },
    ],
  },
  {
    id: drId('dr_R05'), type: 'read', level: 'B2', skill: 'Reading',
    source: 'Texto original. Extensão alinhada ao MET.',
    passage: 'In many offices, long emails are treated as signs of seriousness. A detailed message can look thoughtful and complete, especially when a topic is complicated. Yet communication researchers have increasingly questioned whether length improves workplace understanding. In many cases, the opposite seems to be true: when readers are busy, they often respond more effectively to shorter emails with a clear structure and one obvious purpose.\n\nThis does not mean all emails should be extremely brief. Some decisions require explanation, and some messages need context, especially when writers are asking readers to change a process or approve a plan. The problem appears when writers include too many small points in one message. Readers then have to decide what matters most. If they miss the real request, both sides lose time.\n\nA more effective strategy is often to divide communication by function. One email can ask for a decision. Another can provide background information. Bullet points and short paragraphs can also reduce misunderstanding because they make the writer\'s priorities visible. Surprisingly, shorter emails may even sound more polite. A reader who receives a focused message may feel that the writer has respected their time.\n\nHowever, this trend has limits. In highly sensitive situations, very short emails can appear cold or abrupt. Tone matters, and so does the relationship between the people involved. A manager writing to a close colleague may choose different wording from a company writing to a customer. Good email practice, then, is not about making every message short. It is about matching length and structure to purpose.',
    questions: [
      { id: drId('drq'), question: 'The text says long emails are always ineffective.', options: ['True', 'False', 'Not Given'], correct: 1 },
      { id: drId('drq'), question: 'Researchers have questioned the value of length in workplace emails.', options: ['True', 'False', 'Not Given'], correct: 0 },
      { id: drId('drq'), question: 'The writer thinks one email should contain only one clear purpose whenever possible.', options: ['True', 'False', 'Not Given'], correct: 0 },
      { id: drId('drq'), question: 'The text says short emails are always more polite.', options: ['True', 'False', 'Not Given'], correct: 1 },
      { id: drId('drq'), question: 'Very short emails can sometimes sound unfriendly.', options: ['True', 'False', 'Not Given'], correct: 0 },
      { id: drId('drq'), question: 'The article states that customers prefer bullet points to short paragraphs.', options: ['True', 'False', 'Not Given'], correct: 2 },
    ],
  },
  {
    id: drId('dr_R06'), type: 'read', level: 'B2', skill: 'Reading',
    source: 'Texto original. Extensão alinhada ao MET.',
    passage: 'Paragraph 1\nFor many years, museums were associated with large buildings, famous collections, and national history. Smaller institutions often seemed less important by comparison. Recently, however, many towns have begun opening "micro-museums": very small exhibition spaces built around a street, a neighborhood, or even a single kind of object.\n\nParagraph 2\nPart of their appeal is practical. A micro-museum can fit into an unused shop or community building, so it costs less to create and maintain than a traditional museum. It can also change exhibitions quickly. That flexibility makes it easier to react to local interest rather than following a long institutional plan.\n\nParagraph 3\nThe most successful examples avoid copying the style of major museums. Instead of asking, "What is our most impressive object?" they ask, "What object tells a story people here recognize?" A bus ticket machine, a bakery sign, or a school desk may seem ordinary, yet such items often trigger strong memories.\n\nParagraph 4\nVisitors are not always treated as an audience only. In many projects they become contributors, lending objects, identifying people in photographs, or recording short memories connected to a place. In this way, the museum becomes less like a finished display and more like a community conversation.\n\nParagraph 5\nTeachers have found this useful. Students who may feel distant from national history often respond differently when a display includes familiar streets or everyday tools. The objects are modest, but the learning can be powerful because it begins from what students can imagine directly.\n\nParagraph 6\nSome early critics argued that these museums were too small to matter. Yet that objection has weakened over time. Supporters no longer claim that micro-museums should replace national institutions. Instead, they suggest that both types can coexist, each doing different cultural work.\n\nChoose the correct heading for each paragraph. (One heading is extra.)\nHeadings: A. Objects that carry local memory  B. A criticism that changed direction  C. Why tiny institutions became attractive  D. A new role for neighborhood residents  E. A model based on low costs and flexibility  F. Learning through ordinary things  G. When digital copies are enough',
    questions: [
      { id: drId('drq'), question: 'Paragraph 1', options: ['Objects that carry local memory', 'A criticism that changed direction', 'Why tiny institutions became attractive', 'A new role for neighborhood residents', 'A model based on low costs and flexibility', 'Learning through ordinary things', 'When digital copies are enough'], correct: 2 },
      { id: drId('drq'), question: 'Paragraph 2', options: ['Objects that carry local memory', 'A criticism that changed direction', 'Why tiny institutions became attractive', 'A new role for neighborhood residents', 'A model based on low costs and flexibility', 'Learning through ordinary things', 'When digital copies are enough'], correct: 4 },
      { id: drId('drq'), question: 'Paragraph 3', options: ['Objects that carry local memory', 'A criticism that changed direction', 'Why tiny institutions became attractive', 'A new role for neighborhood residents', 'A model based on low costs and flexibility', 'Learning through ordinary things', 'When digital copies are enough'], correct: 0 },
      { id: drId('drq'), question: 'Paragraph 4', options: ['Objects that carry local memory', 'A criticism that changed direction', 'Why tiny institutions became attractive', 'A new role for neighborhood residents', 'A model based on low costs and flexibility', 'Learning through ordinary things', 'When digital copies are enough'], correct: 3 },
      { id: drId('drq'), question: 'Paragraph 5', options: ['Objects that carry local memory', 'A criticism that changed direction', 'Why tiny institutions became attractive', 'A new role for neighborhood residents', 'A model based on low costs and flexibility', 'Learning through ordinary things', 'When digital copies are enough'], correct: 5 },
      { id: drId('drq'), question: 'Paragraph 6', options: ['Objects that carry local memory', 'A criticism that changed direction', 'Why tiny institutions became attractive', 'A new role for neighborhood residents', 'A model based on low costs and flexibility', 'Learning through ordinary things', 'When digital copies are enough'], correct: 1 },
    ],
  },
  {
    id: drId('dr_R07'), type: 'read', level: 'B2', skill: 'Reading',
    source: 'Texto original. Extensão alinhada ao MET.',
    passage: 'In several countries, cities have begun planting what are sometimes called "pocket forests" or "micro-forests." These are very small areas where trees and shrubs are planted densely in order to create a fast-growing patch of urban woodland. The areas may be no bigger than a tennis court. [1]\n\nThe approach has attracted attention because it seems to offer several benefits at once. Trees provide shade, support insects and birds, and can improve the visual quality of neighborhoods that otherwise contain large amounts of concrete. [2] Residents often report that one side of a street feels cooler after planting begins, even before the trees reach full height.\n\nSupporters also like the fact that micro-forests can be created in places where a traditional park would be unrealistic. Because the planted area is small, cities do not need to redesign an entire district. [3] A former parking strip, a fenced corner, or land beside a school can be enough.\n\nStill, expectations need to be realistic. [4] A dense planting may take years to establish itself properly, and the early stages can seem unimpressive to people who expect neat lawns and obvious order. Some organizers deliberately explain this from the start. [5] If every leaf and branch is strictly controlled, the area may not develop the messy diversity that gives the method ecological value.\n\nSchools and community groups are often involved in planting days, and this can make the project more visible and more meaningful to local residents. Students can observe seasonal change in a place they helped create. [6] It connects environmental learning to a real site rather than a distant example in a textbook.\n\nChoose the best sentence for each gap. (One sentence is extra.)\nSentences: A. That means they can become difficult to defend in public debate.  B. As a result, the method is often used on neglected urban corners.  C. In fact, some projects are planned to look almost untidy at first.  D. Yet the idea is not to produce an instant park.  E. This slower growth can actually protect the young trees.  F. For city residents, the change is often easiest to notice through temperature.  G. This is one reason schools have shown interest in the idea.',
    questions: [
      { id: drId('drq'), question: 'Gap 1', options: ['That means they can become difficult to defend in public debate.', 'As a result, the method is often used on neglected urban corners.', 'In fact, some projects are planned to look almost untidy at first.', 'Yet the idea is not to produce an instant park.', 'This slower growth can actually protect the young trees.', 'For city residents, the change is often easiest to notice through temperature.', 'This is one reason schools have shown interest in the idea.'], correct: 1 },
      { id: drId('drq'), question: 'Gap 2', options: ['That means they can become difficult to defend in public debate.', 'As a result, the method is often used on neglected urban corners.', 'In fact, some projects are planned to look almost untidy at first.', 'Yet the idea is not to produce an instant park.', 'This slower growth can actually protect the young trees.', 'For city residents, the change is often easiest to notice through temperature.', 'This is one reason schools have shown interest in the idea.'], correct: 5 },
      { id: drId('drq'), question: 'Gap 3', options: ['That means they can become difficult to defend in public debate.', 'As a result, the method is often used on neglected urban corners.', 'In fact, some projects are planned to look almost untidy at first.', 'Yet the idea is not to produce an instant park.', 'This slower growth can actually protect the young trees.', 'For city residents, the change is often easiest to notice through temperature.', 'This is one reason schools have shown interest in the idea.'], correct: 3 },
      { id: drId('drq'), question: 'Gap 4', options: ['That means they can become difficult to defend in public debate.', 'As a result, the method is often used on neglected urban corners.', 'In fact, some projects are planned to look almost untidy at first.', 'Yet the idea is not to produce an instant park.', 'This slower growth can actually protect the young trees.', 'For city residents, the change is often easiest to notice through temperature.', 'This is one reason schools have shown interest in the idea.'], correct: 2 },
      { id: drId('drq'), question: 'Gap 5', options: ['That means they can become difficult to defend in public debate.', 'As a result, the method is often used on neglected urban corners.', 'In fact, some projects are planned to look almost untidy at first.', 'Yet the idea is not to produce an instant park.', 'This slower growth can actually protect the young trees.', 'For city residents, the change is often easiest to notice through temperature.', 'This is one reason schools have shown interest in the idea.'], correct: 4 },
      { id: drId('drq'), question: 'Gap 6', options: ['That means they can become difficult to defend in public debate.', 'As a result, the method is often used on neglected urban corners.', 'In fact, some projects are planned to look almost untidy at first.', 'Yet the idea is not to produce an instant park.', 'This slower growth can actually protect the young trees.', 'For city residents, the change is often easiest to notice through temperature.', 'This is one reason schools have shown interest in the idea.'], correct: 6 },
    ],
  },
  {
    id: drId('dr_R08'), type: 'read', level: 'B2', skill: 'Reading',
    source: 'Conjunto original. Extensão alinhada ao MET.',
    passage: 'Text A: School circular\nFrom September, families may donate clean school uniforms that students have outgrown. Items will be sorted by size and offered free of charge at the school exchange table. The exchange will open on the first Friday of each month in the assembly hall.\n\nText B: Parent forum post\nI used the uniform exchange last year and found it much more helpful than I expected. The quality was good, but I wish the opening hours had been longer because many working parents could not get there before closing time.\n\nText C: Principal\'s message\nThe exchange is designed to reduce unnecessary spending and textile waste. We know some families worry that donated items may look untidy or inconsistent. For that reason, staff will check all clothing before it is placed on the table. We hope the project will become a normal part of school life rather than something families feel embarrassed to use.\n\nMatch each statement to the correct text (A, B, or C).',
    questions: [
      { id: drId('drq'), question: 'mentions a practical complaint about access', options: ['Text A', 'Text B', 'Text C'], correct: 1 },
      { id: drId('drq'), question: 'explains how often the exchange will happen', options: ['Text A', 'Text B', 'Text C'], correct: 0 },
      { id: drId('drq'), question: 'stresses both financial and environmental reasons', options: ['Text A', 'Text B', 'Text C'], correct: 2 },
      { id: drId('drq'), question: 'says clothes will be checked before use', options: ['Text A', 'Text B', 'Text C'], correct: 2 },
      { id: drId('drq'), question: 'describes the project as more useful than expected', options: ['Text A', 'Text B', 'Text C'], correct: 1 },
      { id: drId('drq'), question: 'includes a precise location', options: ['Text A', 'Text B', 'Text C'], correct: 0 },
    ],
  },
  {
    id: drId('dr_R09'), type: 'read', level: 'B2', skill: 'Reading',
    source: 'Texto original.',
    passage: 'When people talk about hybrid work, they often focus on productivity. They ask whether staff do more at home, whether meetings become shorter, or whether offices should shrink. A quieter concern receives less attention: friendship. Many workers say that what has changed most is not their task list but the social texture of their day.\n\nOffice friendships once grew through repeated, low-pressure contact. People chatted while making coffee, noticed each other\'s moods, or solved small problems side by side. None of these interactions looked important on their own. Together, however, they built familiarity and trust. In a hybrid system, those moments do not disappear completely, but they become less predictable. A person may come in on Tuesday while their closest colleague works from home. After a few months, both people still collaborate, yet they may feel less informed about each other\'s lives.\n\nSome managers respond by creating more formal social events. Team lunches, online quizzes, and scheduled "connection sessions" are intended to replace what used to happen naturally. These efforts are not useless, but they often feel artificial when overused. Friendship rarely grows because a calendar invitation says it should. It tends to emerge from shared routines and small, repeated exchanges.\n\nThat does not mean hybrid work inevitably weakens relationships. Some employees report the opposite. They say that seeing colleagues less often makes in-person time feel more valuable, so conversations become more intentional. Others appreciate the reduced pressure to appear sociable every day. For them, hybrid work protects energy without ending connection.\n\nThe challenge, then, is not to recreate the old office exactly. It is to notice what kinds of interaction are disappearing and decide which ones matter enough to support. A team may not need weekly social games. It may simply need overlap in schedules, enough common time for informal talk, and managers who understand that culture is built partly in the unplanned spaces between tasks.',
    questions: [
      { id: drId('drq'), question: 'What is the article mainly about?', options: ['Why productivity matters more than friendship', 'How hybrid work can affect workplace friendships', 'Why offices should return to full-time schedules', 'How managers can organize better quizzes'], correct: 1 },
      { id: drId('drq'), question: 'What does the author suggest about office friendships in the past?', options: ['They were usually caused by formal team-building events.', 'They depended on salary incentives.', 'They often developed through ordinary repeated contact.', 'They distracted workers from serious tasks.'], correct: 2 },
      { id: drId('drq'), question: 'Why are "connection sessions" mentioned?', options: ['As an example of a forced substitute for natural interaction', 'As proof that hybrid work has failed', 'As a low-cost way to reduce office space', 'As something employees strongly prefer'], correct: 0 },
      { id: drId('drq'), question: 'Which statement would the author most likely agree with?', options: ['Cultural problems disappear if people meet less often.', 'Intentional schedule overlap may matter more than social games.', 'Friendship at work is unprofessional.', 'Hybrid work affects all employees in exactly the same way.'], correct: 1 },
      { id: drId('drq'), question: 'The word "texture" in paragraph 1 most nearly refers to', options: ['the physical design of a building', 'the speed of office internet', 'the social feel of everyday experience', 'a written company policy'], correct: 2 },
    ],
  },
  {
    id: drId('dr_R11'), type: 'read', level: 'B2', skill: 'Reading',
    source: 'Adaptado de diretrizes de comunicação em saúde.',
    hidePassage: false,
    passage: 'Clear communication between healthcare workers and patients is essential for safe and effective care. Studies show that when patients understand their diagnosis and treatment plan, they are more likely to follow medical advice and less likely to be readmitted to hospital. Yet many patients leave consultations unsure of what they were told.\n\nOne common problem is the use of medical jargon. A doctor may say "hypertension" when a patient only knows the word "high blood pressure." A nurse might mention "subcutaneous injection" while the patient has no idea what that means. These small mismatches can lead to confusion about medication, missed appointments, and unnecessary anxiety.\n\nThe solution is not to avoid technical terms completely — future nurses need to know them — but to learn how to explain them in plain language. Good patient communication has three steps: first, say what you need to say using the correct professional term. Second, immediately explain it in everyday words. Third, check that the patient understood by asking them to repeat the information in their own words.\n\nThis method is sometimes called "teach-back" or "show-me." It is widely used in nursing education and is considered a best practice for patient safety. Research suggests that teach-back reduces misunderstanding by more than forty percent, especially among patients with limited health literacy or lower English proficiency.\n\nFor international nurses preparing for exams like the MET, mastering this kind of communication is doubly important. They must show they can use professional English accurately while also adjusting their language to meet the patient\'s level. This balance — between precision and accessibility — is at the heart of effective healthcare communication.',
    questions: [
      { id: drId('drq'), question: 'What is the main idea of the article?', options: ['Nurses should never use medical terms with patients.', 'Clear healthcare communication improves patient outcomes and requires skill.', 'Hospital readmissions are mainly caused by language barriers.', 'The MET exam tests patient communication skills directly.'], correct: 1 },
      { id: drId('drq'), question: 'Why does the author mention the term "teach-back"?', options: ['To describe a technique that checks patient understanding.', 'To argue that patients should teach medical students.', 'To recommend returning to traditional teaching methods.', 'To criticize a time-consuming nursing practice.'], correct: 0 },
      { id: drId('drq'), question: 'What does the article suggest about medical jargon?', options: ['It should never be used in healthcare settings.', 'It is useful but should be followed by plain language explanation.', 'It is the only accurate way to describe medical conditions.', 'It is more common in written forms than in speech.'], correct: 1 },
      { id: drId('drq'), question: 'Which group is specifically mentioned as benefiting from teach-back?', options: ['Experienced doctors only', 'Patients with limited health literacy or lower English proficiency', 'Hospital administrators', 'Medical researchers'], correct: 1 },
      { id: drId('drq'), question: 'What challenge does the article identify for international nurses?', options: ['Learning medical terminology in English', 'Balancing professional accuracy with accessible language', 'Passing the reading section of the MET', 'Adapting to different hospital cultures'], correct: 1 },
    ],
  },
  {
    id: drId('dr_R10'), type: 'read', level: 'B2', skill: 'Reading',
    source: 'Conjunto original.',
    passage: 'Text A: Community sports flyer\nTry a new activity this summer at Eastside Sports Center. Adults can choose beginner tennis, evening running groups, and low-impact fitness classes. Reduced prices are available for residents over sixty and for students with valid identification. Registration opens online on Monday.\n\nText B: Interview excerpt\nCoach Marina Lopez says the biggest challenge for adult beginners is not physical ability but confidence. "People think everyone else already knows what they\'re doing," she says. "Once they realize the class is designed for first-timers, they usually relax."\n\nText C: Local news item\nCity health officials welcomed the expansion of low-cost sports programs, saying that access matters as much as motivation. Previous surveys showed strong interest in exercise classes, but cost and travel distance often prevented residents from joining.',
    questions: [
      { id: drId('drq'), question: 'Which text mainly provides practical sign-up information?', options: ['Text A', 'Text B', 'Text C', 'Texts B and C'], correct: 0 },
      { id: drId('drq'), question: 'According to Text B, what stops many adult beginners?', options: ['Lack of free time', 'Fear of not being good enough', 'High equipment costs', 'Limited bus service'], correct: 1 },
      { id: drId('drq'), question: 'What point is made in Text C?', options: ['Coaches should design harder classes.', 'Motivation is the only real problem.', 'Access barriers can prevent participation.', 'Tennis is more popular than running.'], correct: 2 },
      { id: drId('drq'), question: 'Which text would be most useful to someone deciding whether the classes are suitable for a novice?', options: ['Text A', 'Text B', 'Text C', 'None of them'], correct: 1 },
      { id: drId('drq'), question: 'Which idea connects Texts A and C most clearly?', options: ['Discounts and affordability can influence participation.', 'Running groups should be moved online.', 'Surveys are more useful than coaching.', 'Programs should only target older residents.'], correct: 0 },
    ],
  },
];

const WRITING = [
  {
    id: drId('dr_W01'), type: 'short', level: 'B2', skill: 'Writing',
    prompt: 'Task 1: Write sentences to answer the questions.\n1. Do you work or study better at home or in another place?\n2. What helps you concentrate there?\n3. Describe a time when your work or study space caused a problem.\n\nTask 2: Many companies now allow some employees to work from home several days a week. What are the advantages and disadvantages of this change? Give reasons and examples to support your answer.',
    rubric: '4 (B2 strong): fully addresses both tasks, clear structure, varied vocabulary, few errors. | 3 (B2 adequate): addresses both tasks, generally organized, adequate vocabulary, some errors. | 2 (Below B2): partially addresses tasks, limited organization, basic vocabulary, frequent errors. | 1 (Limited): minimal task completion, no clear structure, very basic language. | 0: No functional response.',
    targetWords: 250,
    scaffolding: { vocabulary: ['flexibility', 'commute', 'productive', 'communication', 'colleagues', 'suitable', 'balanced'], structure: ['Introduction stating your position', 'Body paragraph with advantages and examples', 'Body paragraph with disadvantages', 'Conclusion with balanced view'] },
    note: 'Sample Task 1 (40-80 words): I usually study better in the library because it is quieter than my apartment. The main thing that helps me concentrate is having fewer distractions around me. Last month, I had to finish an assignment at home while my neighbors were having a party, and it was very difficult.',
  },
  {
    id: drId('dr_W02'), type: 'short', level: 'B2', skill: 'Writing',
    prompt: 'Task 1: Write sentences to answer the questions.\n1. What time do you usually wake up on weekdays?\n2. Do you feel more energetic in the morning or in the evening?\n3. Describe a day when you were too tired to study or work well.\n\nTask 2: Some people believe schools should start later in the morning. Do you agree or disagree? Give reasons and examples.',
    rubric: '4 (B2 strong): fully addresses both tasks, clear structure, varied vocabulary, few errors. | 3 (B2 adequate): addresses both tasks, generally organized, adequate vocabulary, some errors. | 2 (Below B2): partially addresses tasks, limited organization, basic vocabulary, frequent errors. | 1 (Limited): minimal task completion, no clear structure, very basic language. | 0: No functional response.',
    targetWords: 250,
    scaffolding: { vocabulary: ['concentration', 'schedule', 'routine', 'alert', 'effective', 'practical', 'benefit'], structure: ['Introduction with clear opinion', 'Reason 1 with example', 'Reason 2 with example', 'Concession addressing practical difficulties', 'Conclusion'] },
    note: 'Sample Task 1: I usually wake up at 6:30 on weekdays. I normally feel more energetic in the late morning than very early in the day. Last semester I had an early class after sleeping badly, and I could hardly concentrate.',
  },
  {
    id: drId('dr_W03'), type: 'short', level: 'B2', skill: 'Writing',
    prompt: 'Task 1: Write sentences to answer the questions.\n1. How do you usually travel around your town or city?\n2. What do you like or dislike about public transportation there?\n3. Describe a time when transportation caused you to be late.\n\nTask 2: Should cities offer cheaper public transportation to students and young workers? Give your opinion and support it with examples.',
    rubric: '4 (B2 strong): fully addresses task, clear structure, varied vocabulary, few errors. | 3 (B2 adequate): addresses task, organized, adequate vocabulary, some errors. | 2 (Below B2): partially addresses task, limited organization, basic vocabulary, frequent errors. | 1 (Limited): minimal response, no structure. | 0: No functional response.',
    targetWords: 250,
    scaffolding: { vocabulary: ['accessible', 'income', 'discount', 'pollution', 'revenue', 'investment', 'sustainable'], structure: ['Introduction with opinion', 'Argument 1: financial support for students/workers', 'Argument 2: environmental and community benefits', 'Counterargument and response', 'Conclusion'] },
    note: 'Model answer: Cities should offer cheaper public transportation to students and young workers because the policy can support both individuals and the wider community.\n\nFirst, many people in these groups have limited income. Students usually spend money on books, food, and rent, while young workers may receive low salaries at the beginning of their careers. Lower transport costs would make education and employment more accessible because people could travel without worrying about every ticket price.\n\nSecond, cheaper public transport can reduce traffic and pollution. If buses and trains become more attractive, fewer people may depend on private cars or ride-hailing services. This would benefit the city as a whole, not only the people receiving the discount.\n\nSome critics argue that transport systems already have financial problems and cannot afford lower prices. That concern is understandable, but cities can treat discounts as an investment. If more people use public transport regularly, revenue may become more stable over time.\n\nFor these reasons, I believe reduced fares are a sensible policy. They help young people study and work more easily while also encouraging a more efficient and sustainable urban transport system.\n\nExaminer comment: Clara relação entre ponto de vista, razões e consequências. O texto demonstra maturidade discursiva condizente com B2.',
  },
  {
    id: drId('dr_W04'), type: 'short', level: 'B2', skill: 'Writing',
    prompt: 'Task 1: Write sentences to answer the questions.\n1. How often do you answer messages after work or class?\n2. Do you find it easy to switch off from your phone?\n3. Tell us about a time when a message interrupted your rest.\n\nTask 2: Do companies have a responsibility to limit work messages outside normal working hours? Explain your opinion.',
    rubric: '4 (B2 strong): fully addresses task, clear structure, varied vocabulary, few errors. | 3 (B2 adequate): addresses task, organized, adequate vocabulary, some errors. | 2 (Below B2): partially addresses task, limited organization, basic vocabulary, frequent errors. | 1 (Limited): minimal response, no structure. | 0: No functional response.',
    targetWords: 250,
    scaffolding: { vocabulary: ['responsibility', 'disconnect', 'sustainable', 'fairness', 'emergency', 'exception', 'productivity'], structure: ['Introduction with position', 'Reason 1: rest and performance', 'Reason 2: fairness across employees', 'Concession about emergencies', 'Conclusion'] },
    note: 'Model answer: In my opinion, companies do have a responsibility to limit work messages outside normal working hours.\n\nThe strongest reason is that rest is necessary for good performance. If employees feel that they must check messages all evening, they never fully disconnect from work. Over time, this can create stress, reduce motivation, and even damage health. A person who is always "available" may look efficient for a short period, but in the long term that situation is not sustainable.\n\nAnother reason is fairness. Not all employees have the same home life. Some people care for children or relatives, while others study after work or need time to travel. When late messages become normal, workers with more responsibilities may be unfairly judged.\n\nOf course, certain jobs involve emergencies, and companies must sometimes contact staff outside regular hours. However, emergencies should remain exceptions, not everyday practice. Clear rules can help managers decide when contact is truly necessary.\n\nOverall, limiting after-hours messaging is good for both employees and employers. Workers who can rest properly are more focused, more loyal, and more productive when the next working day begins.\n\nExaminer comment: Boa adequação ao registro formal e boa capacidade de elaborar razões. A conclusão retoma a tese com clareza.',
  },
  {
    id: drId('dr_W05'), type: 'short', level: 'B2', skill: 'Writing',
    prompt: 'Task 1: Write sentences to answer the questions.\n1. Have you ever done volunteer work?\n2. What kind of community problem would you most like to help solve?\n3. Describe a positive experience you had helping another person.\n\nTask 2: Some universities want to make community service a required part of graduation. Is this a good idea? Why or why not?',
    rubric: '4 (B2 strong): fully addresses task, clear structure, varied vocabulary, few errors. | 3 (B2 adequate): addresses task, organized, adequate vocabulary, some errors. | 2 (Below B2): partially addresses task, limited organization, basic vocabulary, frequent errors. | 1 (Limited): minimal response, no structure. | 0: No functional response.',
    targetWords: 250,
    scaffolding: { vocabulary: ['volunteer', 'community', 'requirement', 'engagement', 'flexible', 'meaningful', 'obligation'], structure: ['Introduction with balanced view', 'Arguments in favor (skills, responsibility)', 'Counterargument (rigidity, workload)', 'Middle-ground proposal', 'Conclusion'] },
    note: 'Model answer: Making community service part of graduation can be a good idea, but only if universities organize it carefully.\n\nOne argument in favor of the policy is that students learn important skills outside the classroom. Through service projects, they may improve communication, teamwork, and problem-solving while also understanding social issues more directly. This kind of experience can make education feel more connected to real life.\n\nCommunity service can also encourage a stronger sense of responsibility. Universities do not only prepare students for jobs; they also prepare them to participate in society. Working with local organizations may help students see that their knowledge can be useful beyond academic success.\n\nHowever, there is a risk if the requirement is too rigid. Students already have heavy workloads, and some have jobs or family obligations. If the program is inflexible, it may feel like an extra burden rather than a meaningful experience. For this reason, universities should offer different options and realistic schedules.\n\nIn conclusion, I support the idea in principle. Community service can enrich education, but it should be designed as genuine engagement, not simply another bureaucratic box to tick.\n\nExaminer comment: Texto equilibrado, com argumento favorável e ressalva bem desenvolvida. Forte adequação ao descritor B2 de discussão de opções e suas desvantagens.',
  },
  {
    id: drId('dr_W06'), type: 'short', level: 'B2', skill: 'Writing',
    prompt: 'Task 1: Write sentences to answer the questions.\n1. How often do you buy things online?\n2. What kind of packaging do you usually receive?\n3. Describe a time when something you ordered arrived with too much packaging.\n\nTask 2: Should online stores be required to use simpler, reusable, or recyclable packaging whenever possible? Give your opinion.',
    rubric: '4 (B2 strong): fully addresses task, clear structure, varied vocabulary, few errors. | 3 (B2 adequate): addresses task, organized, adequate vocabulary, some errors. | 2 (Below B2): partially addresses task, limited organization, basic vocabulary, frequent errors. | 1 (Limited): minimal response, no structure. | 0: No functional response.',
    targetWords: 250,
    scaffolding: { vocabulary: ['packaging', 'waste', 'sustainable', 'recyclable', 'environmental', 'flexibility', 'responsibility'], structure: ['Introduction with clear opinion', 'Environmental argument', 'Financial/business argument', 'Concession about fragile items', 'Conclusion'] },
    note: 'Model answer: I believe online stores should be required to use simpler, reusable, or recyclable packaging whenever possible.\n\nThe main reason is environmental. Online shopping is convenient, but it often creates unnecessary waste. Many customers receive small products in oversized boxes or with several layers of plastic. If companies reduced this packaging, they could lower the amount of rubbish produced by everyday purchases.\n\nThere is also a financial argument. Better packaging design may reduce shipping materials and storage costs over time. Some businesses worry that more sustainable packaging will always be more expensive, but wasteful packaging also has a price. In addition, many customers now prefer companies that show environmental responsibility, so good policy can improve a brand\'s public image.\n\nOf course, not every product can be packed in the same way. Fragile items or food may require stronger protection. That is why the rule should include the phrase "whenever possible." Stores still need flexibility for products that genuinely need special packaging.\n\nOverall, online retailers should be encouraged — and in many cases required — to choose packaging that protects products without creating avoidable waste.\n\nExaminer comment: Tese clara, exemplos concretos e concessão bem administrada. Linguagem funcional e organizadamente B2.',
  },
  {
    id: drId('dr_W07'), type: 'short', level: 'B2', skill: 'Writing',
    prompt: 'Task 1: Write sentences to answer the questions.\n1. Have you ever taken a long break from study or work?\n2. What useful activity would you do during a year off?\n3. Describe a time when a break helped you make a better decision.\n\nTask 2: Is taking a gap year before university a good idea for most students? Explain your view.',
    rubric: '4 (B2 strong): fully addresses task, clear structure, varied vocabulary, few errors. | 3 (B2 adequate): addresses task, organized, adequate vocabulary, some errors. | 2 (Below B2): partially addresses task, limited organization, basic vocabulary, frequent errors. | 1 (Limited): minimal response, no structure. | 0: No functional response.',
    targetWords: 250,
    scaffolding: { vocabulary: ['gap year', 'mature', 'independence', 'reflect', 'opportunity', 'disadvantage', 'purposeful'], structure: ['Introduction with nuanced view', 'Positive aspects (independence, clarity)', 'Negative aspects (loss of habit, equity)', 'Conditional recommendation', 'Conclusion'] },
    note: 'Model answer: A gap year before university can be a good idea, but it is not automatically the best choice for everyone.\n\nOn the positive side, a year away from formal study can help young people become more independent. They may work, travel, volunteer, or learn practical skills. These experiences can make students more mature and more certain about what they want to study. Someone who enters university with clearer goals may use the opportunity more effectively.\n\nA gap year can also prevent students from making rushed decisions. Many people choose a degree simply because they feel pressure to continue studying immediately. Extra time may help them reflect and avoid selecting the wrong course.\n\nHowever, there are disadvantages. Some students lose their study habits during a long break and find it difficult to return to academic life. Others cannot afford to spend a year traveling or volunteering, which means the experience may not be equally available to everyone.\n\nFor these reasons, I would say a gap year is a good idea for some students, but not for all. It is most valuable when it has a clear purpose rather than being just a delay.\n\nExaminer comment: Boa capacidade de pesar vantagens e desvantagens com conclusão matizada. Perfil bem alinhado a B2.',
  },
  {
    id: drId('dr_W08'), type: 'short', level: 'B2', skill: 'Writing',
    prompt: 'Task 1: Write sentences to answer the questions.\n1. Do you use your phone in class or meetings?\n2. What is one useful thing a phone can do for learning?\n3. Describe a situation when a phone became a distraction.\n\nTask 2: Should phones be completely banned in classrooms? Give reasons for your answer.',
    rubric: '4 (B2 strong): fully addresses task, clear structure, varied vocabulary, few errors. | 3 (B2 adequate): addresses task, organized, adequate vocabulary, some errors. | 2 (Below B2): partially addresses task, limited organization, basic vocabulary, frequent errors. | 1 (Limited): minimal response, no structure. | 0: No functional response.',
    targetWords: 250,
    scaffolding: { vocabulary: ['distraction', 'resource', 'policy', 'ban', 'responsible', 'tool', 'management'], structure: ['Introduction with position', 'Arguments against a total ban (learning tools)', 'Arguments for control (distraction, atmosphere)', 'Middle-ground solution', 'Conclusion'] },
    note: 'Model answer: I do not think phones should be completely banned in classrooms, but their use should be controlled.\n\nPhones can support learning in practical ways. Students can use dictionaries, calendars, calculators, and online resources within seconds. In some lessons, teachers may also ask students to answer polls, record observations, or search for information. A total ban would remove these useful possibilities.\n\nAt the same time, the disadvantages are real. Phones can interrupt attention very easily. Even a short glance at a message can cause a student to miss instructions or lose the main point of an explanation. In addition, if some students are using phones for unrelated activities, the atmosphere of the class may become less serious.\n\nThe best solution is to create clear rules instead of using an absolute ban. Teachers should decide when phones are allowed for academic purposes and when they must be put away. This is more realistic than pretending the devices do not exist.\n\nIn conclusion, phones are tools. They can be useful or harmful depending on how they are managed. Schools should teach responsible use rather than relying only on prohibition.\n\nExaminer comment: Argumento equilibrado, com posição clara e justificativas funcionais. Conectores e desenvolvimento sustentam um nível B2 seguro.',
  },
  {
    id: drId('dr_W09'), type: 'short', level: 'B2', skill: 'Writing',
    prompt: 'Task 1: Write sentences to answer the questions.\n1. Would you prefer to work four long days or five shorter days?\n2. Why?\n3. Describe a time when changing your schedule improved your productivity.\n\nTask 2: Do you think a four-day working week is a good idea for most businesses? Explain your answer.',
    rubric: '4 (B2 strong): fully addresses task, clear structure, varied vocabulary, few errors. | 3 (B2 adequate): addresses task, organized, adequate vocabulary, some errors. | 2 (Below B2): partially addresses task, limited organization, basic vocabulary, frequent errors. | 1 (Limited): minimal response, no structure. | 0: No functional response.',
    targetWords: 250,
    scaffolding: { vocabulary: ['well-being', 'productivity', 'schedule', 'coverage', 'flexibility', 'universal', 'adaptation'], structure: ['Introduction with nuanced view', 'Advantages (well-being, attraction)', 'Disadvantages (coverage, fatigue)', 'Context-dependent recommendation', 'Conclusion'] },
    note: 'Model answer: A four-day working week is an attractive idea, but I do not think it is suitable for every business.\n\nIts biggest advantage is probably employee well-being. An extra day away from work can reduce stress and allow people to return with more energy. In some jobs, this can improve focus and productivity rather than reducing it. Companies may also find it easier to attract staff if they offer a schedule that workers value.\n\nHowever, the model also creates challenges. Some services need daily coverage, and in those cases a shorter week may require more staff or more complex scheduling. In addition, if the four days become much longer, employees may feel tired by the end of each day, which could reduce the expected benefits.\n\nFor office-based work, especially where tasks depend more on concentration than on physical presence, the four-day week may be worth testing. For other sectors, adaptation could be much harder.\n\nOverall, I support the idea as an option rather than a universal rule. Businesses should examine the nature of their work before deciding whether a shorter week will help or create new problems.\n\nExaminer comment: O texto lida bem com generalização e limitação do argumento. Boa maturidade discursiva para B2.',
  },
  {
    id: drId('dr_W10'), type: 'short', level: 'B2', skill: 'Writing',
    prompt: 'Task 1: Write sentences to answer the questions.\n1. Do you live in a place that receives tourists?\n2. What do visitors usually like there?\n3. Describe one positive or negative effect of tourism you have seen.\n\nTask 2: Tourism can help small towns, but it can also create problems. Discuss the advantages and disadvantages.',
    rubric: '4 (B2 strong): fully addresses task, clear structure, varied vocabulary, few errors. | 3 (B2 adequate): addresses task, organized, adequate vocabulary, some errors. | 2 (Below B2): partially addresses task, limited organization, basic vocabulary, frequent errors. | 1 (Limited): minimal response, no structure. | 0: No functional response.',
    targetWords: 250,
    scaffolding: { vocabulary: ['tourism', 'economy', 'preservation', 'quality of life', 'crowded', 'strategy', 'balance'], structure: ['Introduction framing the issue', 'Economic advantages', 'Social/environmental disadvantages', 'Need for balanced strategy', 'Conclusion'] },
    note: 'Model answer: Tourism can be very helpful for small towns, but it also needs careful management.\n\nThe main advantage is economic. Visitors spend money in hotels, restaurants, shops, and local attractions. This can create jobs and support small businesses that might otherwise struggle. Tourism can also encourage towns to protect historic buildings and cultural traditions because these become valuable to both residents and visitors.\n\nOn the other hand, too much tourism can damage the quality of life for local people. Prices may rise, streets can become crowded, and services may focus more on visitors than on residents. In some places, the character of the town changes because businesses start offering only what tourists want.\n\nFor this reason, the goal should not be simply to attract the largest number of visitors possible. Small towns need a balanced strategy that protects local life while still welcoming guests. Limits on traffic, better planning, and support for local businesses can all help.\n\nIn conclusion, tourism is neither entirely good nor entirely bad. It can strengthen a small town, but only if growth is controlled and local needs remain the priority.\n\nExaminer comment: Excelente fechamento com posição balanceada. Resposta claramente dentro do tipo textual esperado pelo MET B2.',
  },
];

const SPEAKING = [
  {
    id: drId('dr_S01'), type: 'speak', level: 'B2', skill: 'Speaking', imageUrl: '/images/met/speaking/s01-picture.jpg', imageAlt: 'Two people assembling a bookshelf in a small apartment, boxes on the floor, one reading a manual',
    prompt: 'Look at the picture. Describe what you see.',
    targetSeconds: 60,
    scaffolding: { vocabulary: ['furniture', 'apartment', 'instructions', 'boxes', 'building', 'together'], structure: ['Describe the setting and people', 'Describe what they are doing', 'Add inference about the situation', 'Give overall impression'] },
    note: 'Sample response (45-60s): In this picture, I can see two people in a small apartment, and they seem to be building a piece of furniture, probably a bookcase. There are boxes on the floor, so I think they have just moved in or bought something new for the room. One person is holding the wooden parts, and the other is looking at the instructions, which suggests they are trying to work together carefully. The room looks bright but not completely organized yet. Overall, the picture gives the impression of a practical activity that may be a little stressful, but also satisfying.',
  },
  {
    id: drId('dr_S02'), type: 'speak', level: 'B2', skill: 'Speaking',
    prompt: 'Look at the picture. Describe what you see.\n\n(Picture description: pessoas esperando o ônibus sob chuva forte; uma pessoa compartilha um guarda-chuva com outra; carros ao fundo)',
    targetSeconds: 60,
    scaffolding: { vocabulary: ['weather', 'umbrella', 'public transportation', 'crowded', 'uncomfortable', 'waiting'], structure: ['Describe the setting and weather', 'Describe the people and actions', 'Make an inference about the mood', 'Conclude with overall impression'] },
    note: 'Sample response (45-60s): This picture shows several people waiting for public transportation in bad weather. It is raining heavily, and most of the people look uncomfortable because they are trying to stay dry. In the center, one person is sharing an umbrella with someone else, which creates a friendly feeling in the scene. The street behind them seems busy, so perhaps the bus is late and they have no choice except to wait. The mood is not exactly positive, but it is also not completely negative, because the people appear calm. The image suggests an ordinary situation that becomes difficult because of the weather.',
  },
  {
    id: drId('dr_S03'), type: 'speak', level: 'B2', skill: 'Speaking',
    prompt: 'Tell me about a time when you learned a practical skill from someone else.',
    targetSeconds: 60,
    scaffolding: { vocabulary: ['skill', 'teach', 'patient', 'explain', 'nervous', 'independent', 'confident'], structure: ['Set up the situation (who, when)', 'Describe the learning process', 'Explain how you felt', 'Conclude with what you gained'] },
    note: 'Sample response (45-60s): A good example was when my uncle taught me how to change a bicycle tire. Before that, I depended on repair shops even for small problems. One weekend, the tire went flat while we were planning a ride, and he said it was a perfect chance to learn. At first I was nervous because I thought I might damage the wheel, but he explained each step slowly. After doing it once, I realized it was much simpler than I had imagined. The experience was useful because it made me feel more independent, and now I can solve the same problem by myself.',
  },
  {
    id: drId('dr_S04'), type: 'speak', level: 'B2', skill: 'Speaking',
    prompt: 'Tell me about a time when you were late and had to solve the problem quickly.',
    targetSeconds: 60,
    scaffolding: { vocabulary: ['late', 'panic', 'communicate', 'solution', 'calm', 'manage'], structure: ['Describe the situation', 'Explain the problem', 'Describe your actions', 'Conclude with the outcome and lesson'] },
    note: 'Sample response (45-60s): Last year I was late for an important class presentation because the bus I usually take simply did not arrive. At first I panicked, because I had prepared for days and did not want to miss my turn. I immediately sent a message to my classmate and asked her to tell the teacher I was on my way. Then I took a different bus and walked the last part quite fast. I still arrived a little late, but because I had communicated clearly, the teacher allowed me to present at the end. I learned that when a problem happens, staying calm and informing people quickly can really help.',
  },
  {
    id: drId('dr_S05'), type: 'speak', level: 'B2', skill: 'Speaking',
    prompt: 'Some people prefer buying things new. Other people prefer buying second-hand items. What do you prefer? Give reasons.',
    targetSeconds: 60,
    scaffolding: { vocabulary: ['second-hand', 'cost', 'environmental', 'quality', 'warranty', 'responsible'], structure: ['State your preference', 'Give reason 1 with example', 'Give reason 2 with example', 'Acknowledge a limitation', 'Conclude'] },
    note: 'Sample response (45-60s): I generally prefer buying second-hand items when it makes sense, especially for books, furniture, and clothes. The first reason is cost, because used items are often much cheaper and still in very good condition. The second reason is environmental. If people reuse things more often, there may be less waste and less unnecessary production. Of course, I would not buy everything second-hand. For example, electronics can be risky if there is no warranty. However, for many everyday products, I think second-hand shopping is a practical and responsible choice.',
  },
  {
    id: drId('dr_S06'), type: 'speak', level: 'B2', skill: 'Speaking',
    prompt: 'Is it better to study or work in silence, or with background music? Give your opinion and reasons.',
    targetSeconds: 60,
    scaffolding: { vocabulary: ['silence', 'concentrate', 'distraction', 'lyrics', 'instrumental', 'task-dependent'], structure: ['State your general preference', 'Support with reasons', 'Acknowledge exceptions', 'Conclude with your position'] },
    note: 'Sample response (45-60s): For me, it depends on the task, but overall I think silence is better for serious study. If I am reading something complex or writing an essay, music can divide my attention, especially if it has lyrics. In that situation, silence helps me concentrate more deeply and make fewer mistakes. However, I do sometimes like soft instrumental music for repetitive tasks, such as organizing notes or answering simple emails. So my opinion is that silence is the best default option, but a small amount of background music can be useful when the task is less demanding.',
  },
  {
    id: drId('dr_S07'), type: 'speak', level: 'B2', skill: 'Speaking',
    prompt: 'Your college is considering moving one day of classes each week online. What are the advantages and disadvantages of this idea?',
    targetSeconds: 90,
    scaffolding: { vocabulary: ['flexibility', 'commute', 'interaction', 'inequality', 'access', 'blended'], structure: ['Introduce the topic', 'Advantage 1 with explanation', 'Advantage 2 with explanation', 'Disadvantage 1 with explanation', 'Disadvantage 2 with explanation', 'Conclude with opinion'] },
    note: 'Sample response (75-90s): There are both clear advantages and disadvantages to having one online day each week. On the positive side, students and teachers could save travel time and money, which might reduce stress. It could also make scheduling easier, especially for students who have jobs or long commutes. In addition, some activities, such as lectures or discussion boards, can work well online.\n\nHowever, there are disadvantages too. Communication may become less natural, and some students may participate less when they are at home. Another issue is inequality, because not everyone has a quiet place to study or a reliable internet connection. Practical subjects may also be harder to teach online.\n\nIn my opinion, the plan could work if the college chooses the right day and provides support, but it should not weaken interaction or access.',
  },
  {
    id: drId('dr_S08'), type: 'speak', level: 'B2', skill: 'Speaking',
    prompt: 'A company wants employees to use shared desks instead of having fixed desks. What are the advantages and disadvantages?',
    targetSeconds: 90,
    scaffolding: { vocabulary: ['shared', 'efficient', 'personal space', 'flexible', 'team feeling', 'adjust'], structure: ['Introduce the idea', 'Advantages (efficiency, cost)', 'Disadvantages (personal space, time)', 'Evaluate', 'Conclude'] },
    note: 'Sample response (75-90s): Using shared desks can be useful for a company, but it also creates some challenges. One advantage is that office space can be used more efficiently. If many employees work remotely part of the week, fixed desks may remain empty for long periods. Shared desks can reduce costs and make the office more flexible.\n\nOn the other hand, some workers may dislike the change because they lose a sense of personal space. It can also waste time if employees arrive and need to search for a place, connect equipment, or adjust the desk every day. In some cases, it may even reduce team feeling, especially if colleagues are not sitting near the same people regularly.\n\nSo, I think shared desks can work, but only if the company organizes the system well and listens to employees\' concerns.',
  },
  {
    id: drId('dr_S09'), type: 'speak', level: 'B2', skill: 'Speaking',
    prompt: 'The school principal is considering whether to extend library opening hours in the evening. Talk to the principal. Explain what you think and try to convince the principal to agree with you.',
    targetSeconds: 90,
    scaffolding: { vocabulary: ['extend', 'valuable', 'performance', 'staffing', 'trial', 'investment'], structure: ['Address the principal politely', 'State your position', 'Give reasons with examples', 'Acknowledge concerns', 'Propose a practical solution', 'Conclude persuasively'] },
    note: 'Sample response (75-90s): Principal, I strongly support extending the library opening hours, at least on some weekdays. Many students cannot use the library effectively during the day because they have classes, group work, or part-time jobs. In the evening, the building would be especially valuable as a quiet place to study. This could improve students\' performance, particularly for those who do not have a suitable place to work at home.\n\nI understand that longer opening hours may create extra costs for staffing and security. However, the school could begin with a small trial, perhaps two evenings per week, and then review how many students use the service. If demand is high, the investment would clearly be worthwhile.\n\nFor these reasons, I believe extended hours would be a practical and fair improvement for the student community.',
  },
  {
    id: drId('dr_S11'), type: 'speak', level: 'B2', skill: 'Speaking',
    prompt: 'You are a nurse. A patient who does not speak English well has just been prescribed a new medication. Explain to the patient: what the medication is for, when to take it, and what to do if they miss a dose. Use clear, simple language.',
    targetSeconds: 90,
    scaffolding: { vocabulary: ['medication', 'prescribe', 'dose', 'side effect', 'pharmacy', 'instruction', 'confirm'], structure: ['Greet the patient and introduce the topic', 'Explain what the medication is for in simple terms', 'Explain when and how to take it', 'Explain what to do if a dose is missed', 'Check that the patient understood'] },
    note: 'Sample response (75-90s): Hello Mrs. Silva, I am going to explain the new medicine your doctor prescribed for you. This medicine is for your blood pressure. It helps keep your heart healthy. You need to take one pill every morning with breakfast. It is important to take it at about the same time each day. If you forget to take it in the morning, take it as soon as you remember — but if it is almost time for your next dose, skip the missed one. Do not take two pills at the same time. Do you understand? Can you tell me in your own words when you will take this medicine?',
  },
  {
    id: drId('dr_S10'), type: 'speak', level: 'B2', skill: 'Speaking',
    prompt: 'A city official is deciding whether to add more bicycle parking near the train station. Talk to the official and explain why you agree or disagree.',
    targetSeconds: 90,
    scaffolding: { vocabulary: ['bicycle parking', 'convenient', 'traffic', 'affordable', 'investment', 'accessible'], structure: ['Address the official', 'State your position', 'Give benefits', 'Acknowledge cost concerns', 'Propose a measured approach', 'Conclude with public value'] },
    note: 'Sample response (75-90s): I would strongly encourage the city to add more bicycle parking near the train station. At the moment, many people could combine cycling and rail travel, but they may choose not to because they are worried about leaving their bikes in an unsafe or inconvenient place. Better parking would make this form of transport much more practical.\n\nThis change could bring several benefits. It may reduce traffic, support healthier travel habits, and make the station more accessible for people who live too far away to walk comfortably. It could also help residents who cannot afford a car but still need an efficient way to reach work or school.\n\nI realize there is a cost involved, but compared with larger transport projects, bicycle parking is relatively affordable. For that reason, I think it is a sensible investment with wide public value.',
  },
];

const GRAMMAR = [
  {
    id: drId('dr_G01'), type: 'read', level: 'B2', skill: 'Grammar',
    source: 'Sentence completion — mixed grammar B2',
    passage: 'Complete each sentence with the correct option.',
    questions: [
      { id: drId('drq'), question: 'By the time we arrived, the meeting ______.', options: ['already finished', 'has already finished', 'had already finished', 'was already finishing'], correct: 2 },
      { id: drId('drq'), question: 'She apologized ______ replying so late.', options: ['for', 'of', 'about', 'to'], correct: 0 },
      { id: drId('drq'), question: 'If I ______ more free time, I\'d join the evening course.', options: ['have', 'had', 'would have', 'will have'], correct: 1 },
      { id: drId('drq'), question: 'The manager suggested ______ the decision until Monday.', options: ['to delay', 'delaying', 'delay', 'delayed'], correct: 1 },
      { id: drId('drq'), question: 'This is the shop ______ I bought my laptop.', options: ['which', 'where', 'who', 'whose'], correct: 1 },
    ],
  },
  {
    id: drId('dr_G02'), type: 'blank', level: 'B2', skill: 'Grammar',
    template: 'Last year our neighborhood started a small book exchange. At first, people were unsure ___ it would work, but within a few weeks the shelves were full. The success came partly ___ the rules were simple: take a book, leave a book, and keep the area clean. Since then, many residents ___ discovered authors they had never read before. The project is small, ___ it has changed the way people talk to one another. It has even given neighbors a reason to stop ___ chat for a few minutes.',
    blanks: ['whether', 'because', 'have', 'but|yet', 'and'],
    explanation: 'whether = conjunction of uncertainty; because = cause linker; have = present perfect auxiliary; but/yet = contrast linker; and = adds purpose.',
  },
  {
    id: drId('dr_G03'), type: 'fix', level: 'B2', skill: 'Grammar',
    errorText: '1. He asked me where was the station.\n2. I look forward to hear from you.\n3. She has less friends than her brother.\n4. If I would know the answer, I\'d tell you.\n5. The report was wrote yesterday.',
    correctedText: '1. He asked me where the station was.\n2. I look forward to hearing from you.\n3. She has fewer friends than her brother.\n4. If I knew the answer, I\'d tell you.\n5. The report was written yesterday.',
    hint: 'Each sentence has one grammar error. Look for: reported speech word order, verb pattern after preposition, countable vs uncountable, conditional structure, passive participle.',
  },
  {
    id: drId('dr_G04'), type: 'blank', level: 'B2', skill: 'Grammar',
    template: 'Complete each sentence using the word in brackets. Type the full phrase.\n\n1. I last saw Ana two months ago. (for)\n   I haven\'t ___ two months.\n2. It wasn\'t necessary for him to come early. (have)\n   He ___ come early.\n3. Perhaps Marta forgot about the meeting. (might)\n   Marta ___ about the meeting.\n4. The teacher said, "Don\'t talk during the test." (told)\n   The teacher ___ during the test.\n5. This is the best café in the neighborhood. (than)\n   No other café in the neighborhood is ___ this one.',
    blanks: ['seen Ana for', "didn't have to|did not have to", 'might have forgotten', 'told the students not to talk|told us not to talk', 'better than'],
    explanation: 'Key word transformation requires paraphrasing while keeping the same meaning. Use the given word exactly.',
  },
  {
    id: drId('dr_G05'), type: 'blank', level: 'B2', skill: 'Grammar',
    template: '1. The new system was designed to improve ___ between departments. (COMMUNICATE)\n2. Her explanation was clear and very ___. (CONVINCE)\n3. We were surprised by the ___ of the final results. (ACCURATE)\n4. Good public transport increases the ___ of jobs and services. (ACCESS)\n5. The course encourages students to think more ___. (CRITIC)',
    blanks: ['communication', 'convincing', 'accuracy', 'accessibility', 'critically'],
    explanation: 'Word formation: noun (communication), adjective (convincing), abstract noun (accuracy), noun from adjective (accessibility), adverb (critically).',
  },
  {
    id: drId('dr_G06'), type: 'blank', level: 'B2', skill: 'Grammar',
    template: '1. While I ___ (walk) to work, I saw an old friend.\n2. They ___ (live) here since 2022.\n3. By next June, she ___ (finish) her degree.\n4. I didn\'t answer because I ___ (drive).\n5. He said he ___ (not/see) the message yet.',
    blanks: ['was walking', 'have lived|have been living', 'will have finished', 'was driving', 'had not seen|hadn\'t seen'],
    explanation: 'Past continuous for background action; present perfect for duration; future perfect; past continuous interrupted; past perfect backshift in reported speech.',
  },
  {
    id: drId('dr_G07'), type: 'blank', level: 'B2', skill: 'Grammar',
    template: '1. If people ___ (cycle) more often, the city would be less polluted.\n2. I wish I ___ (have) enough time to join the course last year.\n3. If she had left earlier, she ___ (catch) the train.\n4. If I were you, I ___ (speak) to the manager directly.\n5. He wishes he ___ (not/spend) so much money on things he didn\'t need.',
    blanks: ['cycled', 'had had', 'would have caught', 'would speak', "hadn't spent|had not spent"],
    explanation: 'Second conditional (present unreal); wish about past (past perfect); third conditional; advice (would + base); regret about past (past perfect).',
  },
  {
    id: drId('dr_G08'), type: 'read', level: 'B2', skill: 'Grammar',
    source: 'Modal verbs — necessity, deduction, possibility, prohibition',
    passage: 'Choose the best modal expression for each sentence.',
    questions: [
      { id: drId('drq'), question: 'You ______ bring your ID; they won\'t let you in without it.', options: ['must', 'might', 'could', 'don\'t have to'], correct: 0 },
      { id: drId('drq'), question: 'She looks exhausted. She ______ have slept very little.', options: ['can\'t', 'must', 'should', 'might not'], correct: 1 },
      { id: drId('drq'), question: 'They ______ have taken the earlier train; they\'re already here.', options: ['must', 'can\'t', 'shouldn\'t', 'could'], correct: 0 },
      { id: drId('drq'), question: 'You ______ smoke here; it\'s against the rules.', options: ['don\'t have to', 'mustn\'t', 'needn\'t', 'won\'t'], correct: 1 },
      { id: drId('drq'), question: 'We ______ meet tomorrow if you\'re free, but it isn\'t final yet.', options: ['must', 'should', 'might', 'have to'], correct: 2 },
    ],
  },
  {
    id: drId('dr_G09'), type: 'short', level: 'B2', skill: 'Grammar',
    prompt: 'Combine each pair of ideas using the word given.\n\n1. The woman is my former teacher. She gave the talk. (who)\n2. The app is useful. It is not very easy to use. (although)\n3. This is the building. My father worked here. (where)\n4. He missed the bus. He left home late. (because)\n5. The project was successful. The team worked under pressure. (despite)',
    rubric: 'Each answer must use the given linking word correctly and form one grammatical sentence.',
    targetWords: 120,
    scaffolding: { vocabulary: ['relative clause', 'concession', 'reason', 'contrast'], structure: ['Use who/which/that for people/things', 'Use although + clause for concession', 'Use where for places', 'Use because + clause for reason', 'Use despite + noun/-ing for contrast'] },
  },
  {
    id: drId('dr_G10'), type: 'blank', level: 'B2', skill: 'Grammar',
    template: '1. They will announce the results next week. (passive)\n   The results ___ next week.\n2. Someone repaired my laptop yesterday. (causative)\n   I ___ yesterday.\n3. "I can help you tomorrow," she said. (reported)\n   She said that she ___ the next day.\n4. People believe the painter lived here briefly. (passive reporting)\n   The painter ___ here briefly.\n5. They are cleaning the windows at the moment. (passive)\n   The windows ___ at the moment.',
    blanks: ['will be announced', 'had my laptop repaired', 'could help me', 'is believed to have lived', 'are being cleaned'],
    explanation: 'Passive voice (will be + past participle); causative have (had + object + past participle); reported speech backshift; passive reporting (is believed to + infinitive); present continuous passive.',
  },
];

const MODULES = [
  { id: 'dr_listening', label: 'MET B2 — Listening', skill: 'Listening', level: 'B2', note: '11 tasks incl. healthcare handoff scenario (MCQ)', exercises: LISTENING },
  { id: 'dr_reading', label: 'MET B2 — Reading', skill: 'Reading', level: 'B2', note: '11 tasks incl. patient communication text (MCQ, T/F/NG, matching, gapped text)', exercises: READING },
  { id: 'dr_writing', label: 'MET B2 — Writing', skill: 'Writing', level: 'B2', note: '10 MET-format writing sets (Task 1 + essay)', exercises: WRITING },
  { id: 'dr_speaking', label: 'MET B2 — Speaking', skill: 'Speaking', level: 'B2', note: '11 tasks incl. nurse-patient medication explanation', exercises: SPEAKING },
  { id: 'dr_grammar', label: 'MET B2 — Grammar', skill: 'Grammar', level: 'B2', note: '10 grammar exercises (MCQ, cloze, error correction, transformations)', exercises: GRAMMAR },
];

export const deepResearchMeta = {
  id: 'deep_research_pack',
  title: 'MET B2 Deep Research Pack',
  subtitle: '53 exam-style exercises (including 3 healthcare-themed tasks)',
  level: 'B2',
  moduleCount: MODULES.length,
  exerciseCount: MODULES.reduce((n, m) => n + m.exercises.length, 0),
};

export function getDeepResearchModules() {
  return MODULES;
}

export function getDeepResearchModuleExercises(moduleId) {
  const mod = MODULES.find(m => m.id === moduleId);
  return mod ? mod.exercises : [];
}
