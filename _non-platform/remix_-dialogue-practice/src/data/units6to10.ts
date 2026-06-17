import { PracticeUnit } from '../types';

export const UNITS_6_TO_10: PracticeUnit[] = [
  {
    id: 6,
    title: "Unit 6: City Lifestyles & Habits",
    theme: "Urban Cycling & Routines",
    difficulty: "B2- CEFR",
    reading: {
      title: "City Cycling Tour",
      difficulty: "B2-",
      focus: "detailed comprehension, inference",
      text: "The City Cycling Tour is a relaxed two-hour ride designed for visitors who want to see everyday life beyond the main tourist streets. The route passes through a public park, a university area, two quiet residential streets, and a small food market. Helmets and bikes are provided, and the guide stops several times for photos and short explanations. Participants should be comfortable riding in light traffic, but the tour avoids busy roads whenever possible. It is not recommended for people who have not ridden a bike recently. In case of heavy rain, the tour is moved to the next morning or fully refunded.",
      questions: [
        {
          id: 1,
          question: "What makes the tour different from typical tourist routes?",
          options: [
            "It focuses on everyday city life",
            "It only visits historical museums",
            "It is performed solely at night",
            "It uses electric scooters"
          ],
          correctAnswer: 0,
          explanation: "The text says it is 'designed for visitors who want to see everyday life beyond the main tourist streets.'"
        },
        {
          id: 2,
          question: "Participants need to bring their own helmets.",
          options: ["True", "False"],
          correctAnswer: 1,
          explanation: "The text explicitly states: 'Helmets and bikes are provided.'"
        },
        {
          id: 3,
          question: "Who should probably avoid this tour?",
          options: [
            "People who enjoy organic food markets",
            "People comfortable in light traffic",
            "People who have not ridden a bike recently",
            "People who like visiting university campuses"
          ],
          correctAnswer: 2,
          explanation: "The passage notes: 'It is not recommended for people who have not ridden a bike recently.'"
        },
        {
          id: 4,
          question: "The tour organizers seem to care about...",
          options: [
            "speed more than safety",
            "safety and flexibility",
            "luxury shopping opportunities",
            "avoiding all residential zones"
          ],
          correctAnswer: 1,
          explanation: "Providing helmets, avoiding busy roads, and offering flexible rain rescheduling/refunds show care for safety and flexibility."
        }
      ],
      teachingNote: "Ask students to identify risk/safety language."
    },
    listening: {
      title: "Interview: Changing Morning Habits",
      difficulty: "B2-",
      type: "Interview",
      script: [
        { id: 1, speaker: "Interviewer", text: "Welcome to the podcast. I'm your host, and today we're joined by our special guest. We'll be exploring how changing a morning routine can profoundly impact one's entire day." },
        { id: 2, speaker: "Interviewer", text: "To start us off, you changed your morning routine last year. What was the biggest difference?" },
        { id: 3, speaker: "Guest", text: "I stopped checking my phone as soon as I woke up. At first, it felt strange because I was used to reading messages in bed." },
        { id: 4, speaker: "Interviewer", text: "What do you do instead?" },
        { id: 5, speaker: "Guest", text: "I drink water, stretch for five minutes, and write down the three most important things I need to do. You can do this using a digital app, or simply write it in a physical notebook. Focusing on just three tasks is effective for productivity and focus because it prevents overwhelming you and forces you to prioritize what truly matters. It sounds simple, but it helps me start the day calmly." },
        { id: 6, speaker: "Interviewer", text: "Did it improve your productivity?" },
        { id: 7, speaker: "Guest", text: "Yes, but not magically. I still have busy days. The main benefit is that I feel more in control before other people's messages enter my mind." },
        { id: 8, speaker: "Interviewer", text: "Thank you so much for being on the show. For everyone listening, the main benefit we discussed today is that taking charge of your morning helps you feel more in control of your entire day. I encourage you to reflect on your own routines tomorrow morning and see what you could change." }
      ],
      questions: [
        {
          id: 1,
          question: "What habit did the guest abandon?",
          options: [
            "Skipping early breakfast",
            "Sleeping past eight",
            "Checking the phone immediately after waking up",
            "Stretching in bed"
          ],
          correctAnswer: 2,
          explanation: "The guest stated: 'I stopped checking my phone as soon as I woke up.'"
        },
        {
          id: 2,
          question: "What three constructive things does the guest do now?",
          options: [
            "Checks email, runs, prepares tea",
            "Reads a novel, drinks coffee, exercises",
            "Drinks water, stretches for five minutes, writes down three key tasks",
            "Cleans the room, cooks oatmeal, plans agenda"
          ],
          correctAnswer: 2,
          explanation: "The guest recounts: 'I drink water, stretch for five minutes, and write down the three most important things...'"
        },
        {
          id: 3,
          question: "What is described as the primary benefit?",
          options: [
            "Higher salary",
            "Less workload",
            "Feeling more in control before external messages enter their mind",
            "Zero stressful days"
          ],
          correctAnswer: 2,
          explanation: "The guest says: 'The main benefit is that I feel more in control before other people's messages enter my mind.'"
        }
      ],
      preListening: "Students rank morning habits from healthiest to least healthy.",
      postListening: "Students describe one habit they would like to change."
    },
    vocabulary: {
      title: "City & Community Target",
      difficulty: "B2-",
      type: "matching",
      items: [
        { phrase: "neighborhood", definition: "an area of a town or city, and the people who live in it", example: "Our neighborhood organizes cleanups." },
        { phrase: "resident", definition: "a person who lives in a particular place", example: "She is a local resident of the old town." },
        { phrase: "community", definition: "people living or working together in an area", example: "The organic café serves the entire community." },
        { phrase: "inclusive", definition: "open and suitable for many different kinds of people", example: "The walk was extremely inclusive." },
        { phrase: "volunteer", definition: "a person who works or helps without being paid", example: "He is a volunteer at the public garden." },
        { phrase: "public space", definition: "an area like a park or plaza that anyone can use", example: "Libraries are important public spaces." },
        { phrase: "local", definition: "connected to the particular area you are discussing", example: "They buy fresh local ingredients." },
        { phrase: "connection", definition: "a relationship or feeling of closeness with others", example: "Walking together fosters a deep social connection." }
      ],
      matchingGame: [
        { phrase: "neighborhood", definition: "an area of a town or city" },
        { phrase: "resident", definition: "a person who lives in a area" },
        { phrase: "community", definition: "people living or working together" },
        { phrase: "inclusive", definition: "open and suitable for everyone" },
        { phrase: "volunteer", definition: "someone who helps without pay" },
        { phrase: "public space", definition: "area that anyone can freely use" },
        { phrase: "local", definition: "connected to a particular near area" },
        { phrase: "connection", definition: "relationship or feeling of closeness" }
      ],
      teachingNote: "Ask students to find contrast words: however, still, especially."
    },
    grammar: {
      title: "Comparatives and Superlatives",
      difficulty: "B1-B2",
      focus: "Comparing lifestyle and routines",
      examples: [
        "This room is quieter than the first one.",
        "The earliest train is the most convenient."
      ],
      questions: [
        {
          id: 1,
          sentence: "A smaller city is usually ___ than a capital.",
          verb: "quiet",
          options: ["quieter", "more quiet", "quietest", "the quietest"],
          correctAnswer: 0,
          explanation: "Flat one-syllable adjectives form their comparative using '-er' (quieter)."
        },
        {
          id: 2,
          sentence: "This local café is ___ than the one near the train station.",
          verb: "healthy",
          options: ["healthier", "more healthy", "healthiest", "healthier than"],
          correctAnswer: 0,
          explanation: "Adjectives ending in '-y' change to 'i' and add '-er' (healthier)."
        },
        {
          id: 3,
          sentence: "The gym is the ___ place in the hotel during peak hours.",
          verb: "busy",
          options: ["busiest", "busyest", "more busy", "busier"],
          correctAnswer: 0,
          explanation: "The definite article 'the' triggers the superlative form (busiest)."
        },
        {
          id: 4,
          sentence: "Walking to work is ___ expensive than hiring taxis daily.",
          verb: "little",
          options: ["less", "least", "lesser", "little"],
          correctAnswer: 0,
          explanation: "'Less' is the correct comparative modifier for negative comparisons."
        },
        {
          id: 5,
          sentence: "This is the ___ routine I have tried for productivity.",
          verb: "good",
          options: ["best", "better", "goodest", "most good"],
          correctAnswer: 0,
          explanation: "'Best' is the irregular superlative of 'good'."
        }
      ]
    },
    speaking: {
      title: "Compare Lifestyles: City vs Town",
      difficulty: "B2-",
      mode: "group work",
      setup: "Group compares city lifestyle and small-town lifestyle.",
      timing: "Preparation: 4 minutes. Group discussion: 6 minutes.",
      instructions: "Compare advantages and disadvantages of living in a big city and a smaller town. Decide which is better for a remote worker.",
      followUp: [
        "Which lifestyle is healthier?",
        "Which offers more opportunities?",
        "Which is more stressful?"
      ],
      targetLanguage: [
        "Compared with...",
        "Whereas...",
        "A major advantage is...",
        "It depends on..."
      ],
      teachingNote: "Encourage balanced answers rather than one-sided opinions."
    },
    writing: {
      title: "Opinion Paragraph: Remote Work",
      difficulty: "B2-",
      genre: "opinion paragraph",
      wordCount: "120-160 words",
      prompt: "Some people say remote work improves lifestyle. Others say it makes work-life balance harder. What is your opinion? Use Statement → Reason → Support.",
      criteria: [
        "State a clear, focused opinion",
        "Give at least two logical reasons",
        "Include one realistic supporting example"
      ],
      teachingNote: "Supports argumentative structuring."
    }
  },
  {
    id: 7,
    title: "Unit 7: Digital Detox Planning",
    theme: "Technology Balance & Offlines",
    difficulty: "B2- CEFR",
    reading: {
      title: "A Digital Detox Weekend",
      difficulty: "B2-",
      focus: "inference, main idea",
      text: "When Leo booked a digital detox weekend, he imagined it would be easy to turn off his phone. By Saturday morning, he realized how often he reached for it without thinking. The retreat organizers collected devices at reception and offered paper maps, board games, nature walks, and cooking classes instead. At first, Leo felt disconnected from everything, but after a few hours, he started noticing small things: the sound of rain on the windows, the taste of fresh bread, and the fact that conversations lasted longer when nobody checked messages. On Sunday, he got his phone back. He did not decide to delete every app, but he changed his notification settings before leaving.",
      questions: [
        {
          id: 1,
          question: "What is the main idea of the passage?",
          options: [
            "Leo learned that cooking healthy is difficult.",
            "Leo discovered how phone habits affected him.",
            "The wellness retreat had poor organization.",
            "All phones should be banned in hotel lobbies."
          ],
          correctAnswer: 1,
          explanation: "The passage focus is on Leo's self-realization of device habits and how he adjusted settings afterward."
        },
        {
          id: 2,
          question: "Leo immediately found the detox easy.",
          options: ["True", "False"],
          correctAnswer: 1,
          explanation: "The text says: 'At first, Leo felt disconnected...'"
        },
        {
          id: 3,
          question: "What concrete parameter did Leo change before leaving?",
          options: [
            "His hotel room class",
            "His traveler route map",
            "His notification settings",
            "His phone casing model"
          ],
          correctAnswer: 2,
          explanation: "The text mentions: 'he changed his notification settings before leaving.'"
        },
        {
          id: 4,
          question: "What can we infer about Leo's attitude?",
          options: [
            "He wants a balanced use of technology.",
            "He hates outdoor sessions completely.",
            "He permanently lost his physical phone.",
            "He was forced by family to attend."
          ],
          correctAnswer: 0,
          explanation: "He didn't delete every app, but he changed notifications, reflecting a balanced, mindful approach."
        },
        {
          id: 5,
          question: "In the text, 'without thinking' means...",
          options: ["carefully", "automatically", "politely", "secretly"],
          correctAnswer: 1,
          explanation: "'Without thinking' refers to habitual, automated actions (automatically)."
        }
      ],
      teachingNote: "Good transition into lifestyle habits and technology discussion."
    },
    listening: {
      title: "Narration: A Weekend Without Plans",
      difficulty: "B2-",
      type: "Narration",
      script: [
        { id: 1, speaker: "Narrator", text: "Last month, I decided not to plan my weekend. Usually, I fill every free hour with errands, social events, and exercise classes." },
        { id: 2, speaker: "Narrator", text: "This time, I only made one rule: no work emails." },
        { id: 3, speaker: "Narrator", text: "On Saturday morning, I walked to a bakery without checking the time. Later, I cleaned my apartment while listening to music and called a friend I had not spoken to in weeks." },
        { id: 4, speaker: "Narrator", text: "By Sunday evening, I realized that an unplanned weekend was not lazy." },
        { id: 5, speaker: "Narrator", text: "It gave me space to notice what I actually wanted to do. Now I try to leave at least one afternoon free every week." }
      ],
      questions: [
        {
          id: 1,
          question: "What was the speaker's only rule for the weekend?",
          options: [
            "No drinking coffee",
            "No work emails",
            "No speaking aloud",
            "No leaving the house"
          ],
          correctAnswer: 1,
          explanation: "The narrator says: 'This time, I only made one rule: no work emails.'"
        },
        {
          id: 2,
          question: "Who did the speaker call on Saturday?",
          options: [
            "Their hotel host",
            "A friend they had not spoken to in weeks",
            "Their work manager",
            "The library volunteer"
          ],
          correctAnswer: 1,
          explanation: "The narrator specifically 'called a friend I had not spoken to in weeks.'"
        },
        {
          id: 3,
          question: "What lesson did the speaker realize by Sunday evening?",
          options: [
            "An unplanned weekend is lazy.",
            "An unplanned weekend provides space to notice what they actually want to do.",
            "They should work overtime.",
            "Social media is necessary."
          ],
          correctAnswer: 1,
          explanation: "The speaker found 'unplanned weekend was not lazy' and 'gave me space to notice what I actually wanted to do.'"
        }
      ],
      preListening: "Students discuss planned vs unplanned weekends.",
      postListening: "Students plan a balanced weekend with free time."
    },
    vocabulary: {
      title: "Work-Life Boundaries",
      difficulty: "B2-",
      type: "fill_in_the_blank",
      items: [
        { phrase: "boundary", definition: "a limit or rule that defines acceptable behavior or separates lifestyle areas", example: "It's vital to set a strict boundary between office and home." },
        { phrase: "flexible hours", definition: "working hours that can be changed to suit worker needs", example: "My job has flexible hours so I start late." },
        { phrase: "productivity", definition: "the efficiency of your output", example: "Calm mornings boost your productivity." },
        { phrase: "burnout", definition: "exhaustion caused by chronic workplace stress", example: "Working every weekend leads directly to burnout." },
        { phrase: "commuting", definition: "the journey between home and work", example: "Commuting by bike is a healthy habit." },
        { phrase: "remote work", definition: "tasks performed away from the standard corporate office", example: "Remote work allows her to live near the beach." },
        { phrase: "schedule", definition: "a plan of items and target times", example: "Her schedule has a block for daily exercises." },
        { phrase: "priority", definition: "something that is regarded as more critical than other items", example: "Maintaining well-being is my main priority." }
      ],
      matchingGame: [
        { phrase: "boundary", definition: "limit separating lifestyle areas" },
        { phrase: "flexible hours", definition: "changeable working hours" },
        { phrase: "productivity", definition: "the efficiency of of productive output" },
        { phrase: "burnout", definition: "exhaustion caused by chronic stress" },
        { phrase: "commuting", definition: "journey between home and workplace" },
        { phrase: "remote work", definition: "work performed away from standard offices" },
        { phrase: "schedule", definition: "list of events and target times" },
        { phrase: "priority", definition: "most critical parameter of focus" }
      ],
      teachingNote: "Ideal transition into lifestyle habits and wellness discussion grids."
    },
    grammar: {
      title: "First Conditional",
      difficulty: "B1-B2",
      focus: "Real future possibilities and outcomes",
      examples: [
        "If the train is late, we will take the bus.",
        "If you arrive early, you will find a table."
      ],
      questions: [
        {
          id: 1,
          sentence: "If the local café ___ crowded, we ___ take-out instead.",
          verb: "be / buy",
          options: [
            "is / will get",
            "will be / get",
            "be / will got",
            "are / would get"
          ],
          correctAnswer: 0,
          explanation: "Present simple in the if-clause ('is') combines with 'will + verb' in the main clause ('will get')."
        },
        {
          id: 2,
          sentence: "If you ___ before noon, you ___ a quiet table.",
          verb: "arrive / find",
          options: [
            "arrive / will find",
            "arrives / will find",
            "will arrive / find",
            "arrived / would find"
          ],
          correctAnswer: 0,
          explanation: "Real future conditionals utilize present tense in the condition, future in result."
        },
        {
          id: 3,
          sentence: "If it ___ heavily, the outdoor cycling tour ___ canceled.",
          verb: "rain / be",
          options: [
            "rains / will be",
            "rain / is",
            "will rain / will be",
            "rained / would be"
          ],
          correctAnswer: 0,
          explanation: "Third-person singular 'rains' goes into conditional condition; 'will be' is future passive."
        },
        {
          id: 4,
          sentence: "If she ___ off her notifications, she ___ calmer.",
          verb: "turn / feel",
          options: [
            "turns / will feel",
            "turn / feel",
            "will turn / feels",
            "turned / felt"
          ],
          correctAnswer: 0,
          explanation: "Singular present 'turns' in conditional condition + 'will feel' for likely outcome."
        },
        {
          id: 5,
          sentence: "If we ___ late, we ___ the instructor immediately.",
          verb: "be / message",
          options: [
            "are / will message",
            "will be / message",
            "are / message",
            "were / would message"
          ],
          correctAnswer: 0,
          explanation: "'We are' in present conditional + 'will message' as the certain future plan."
        }
      ]
    },
    speaking: {
      title: "Plan a Community Fitness Day",
      difficulty: "B2-",
      mode: "group work",
      setup: "Groups design a simple event for different ages.",
      timing: "Preparation: 5 minutes. Presentation: 2 minutes per group.",
      instructions: "Plan three activities, choose a location, decide what equipment is needed, and explain how you will make the event inclusive.",
      followUp: [
        "How can communities encourage healthier habits?",
        "Should local governments pay for free health events?"
      ],
      targetLanguage: [
        "Our first activity will be...",
        "This would encourage...",
        "We need to consider...",
        "It should be accessible for..."
      ],
      teachingNote: "Links community topic with planning language."
    },
    writing: {
      title: "Advice Email: Healthy Lifestyle Advice",
      difficulty: "B2-",
      genre: "advice email",
      wordCount: "120-170 words",
      prompt: "A friend says they feel tired and disorganized because of their routine. Write an email giving practical advice about sleep, food, exercise, or screen time.",
      criteria: [
        "Use modal auxiliary verbs for advice (should, could, might want to)",
        "Sound supportive and non-judgmental",
        "Offer specific, realistic suggestions"
      ],
      teachingNote: "Good for advice structures."
    }
  },
  {
    id: 8,
    title: "Unit 8: Support Groups & Travel Solutions",
    theme: "Community Walking & Transportation Problems",
    difficulty: "B2- CEFR",
    reading: {
      title: "The Wednesday Walking Group",
      difficulty: "B2-",
      focus: "inference, purpose",
      text: "Every Wednesday evening, a group of neighbors meets outside the library for a forty-minute walk. The idea began when a local nurse noticed that many older residents wanted to exercise but felt uncomfortable joining a gym. Now the group includes people of different ages, including students who want a break from screens and parents pushing strollers. The pace is gentle, and nobody is expected to be athletic. After the walk, some members stay for tea at a nearby café. The organizer says the goal is not only fitness, but also connection. For some participants, it is the only regular social event of the week.",
      questions: [
        {
          id: 1,
          question: "Why did the walking group begin?",
          options: [
            "A nurse saw a community need.",
            "The library catalog wanted more visitors.",
            "A franchise gym closed suddenly.",
            "Local students organized a running race."
          ],
          correctAnswer: 0,
          explanation: "The walk 'began when a local nurse noticed that many older residents wanted to exercise...'"
        },
        {
          id: 2,
          question: "Only older residents can join the walking group.",
          options: ["True", "False"],
          correctAnswer: 1,
          explanation: "The text specifies: 'Now the group includes people of different ages, including students... and parents.'"
        },
        {
          id: 3,
          question: "What is one purpose of the group besides exercise?",
          options: ["Competition", "Connection", "Shopping discounts", "Studying library catalogs"],
          correctAnswer: 1,
          explanation: "The organizer explicitly states: 'the goal is not only fitness, but also connection.'"
        },
        {
          id: 4,
          question: "The walking group is probably successful because it is...",
          options: [
            "expensive and exclusive",
            "simple and welcoming",
            "fast and physically difficult",
            "solely online check-in"
          ],
          correctAnswer: 1,
          explanation: "The pace is 'gentle', 'nobody is expected to be athletic', and includes all ages, meaning it is simple & welcoming."
        }
      ],
      teachingNote: "Use to discuss community lifestyle and social well-being."
    },
    listening: {
      title: "Conversation: Solving a Travel Problem",
      difficulty: "B2-",
      type: "Conversation",
      script: [
        { id: 1, speaker: "Speaker A", text: "I just checked the train app. Our train has been canceled." },
        { id: 2, speaker: "Speaker B", text: "Seriously? The cooking class starts in an hour." },
        { id: 3, speaker: "Speaker A", text: "I know. There's a bus, but it takes forty-five minutes and leaves in ten." },
        { id: 4, speaker: "Speaker B", text: "That might work if we walk fast. What about a taxi?" },
        { id: 5, speaker: "Speaker A", text: "It's expensive, and traffic looks bad. The bus lane may actually be quicker." },
        { id: 6, speaker: "Speaker B", text: "Okay, let's take the bus. Can you message the instructor and say we might arrive a few minutes late?" },
        { id: 7, speaker: "Speaker A", text: "Sure. I'll explain the train was canceled." },
        { id: 8, speaker: "Speaker B", text: "Thanks. At least we planned to leave early, or this would be much worse." }
      ],
      questions: [
        {
          id: 1,
          question: "What happened to the train?",
          options: ["It is delayed by an hour", "It was canceled", "It was full", "It went to a different city"],
          correctAnswer: 1,
          explanation: "Speaker A starts: 'Our train has been canceled.'"
        },
        {
          id: 2,
          question: "Why is the bus potentially quicker than a taxi?",
          options: [
            "The taxi driver is slow.",
            "The bus lane avoids the bad automobile traffic.",
            "The bus route is shorter.",
            "The taxi is currently broken."
          ],
          correctAnswer: 1,
          explanation: "Speaker A notes: 'traffic looks bad. The bus lane may actually be quicker.'"
        },
        {
          id: 3,
          question: "Who will receive a warning message?",
          options: [
            "Their hotel host",
            "The cooking class instructor",
            "The train operator",
            "The taxi service agent"
          ],
          correctAnswer: 1,
          explanation: "Speaker B asks to 'message the instructor' because they might arrive late."
        }
      ],
      preListening: "Students predict transport problems during a trip.",
      postListening: "Students role-play solving a late-arrival problem."
    },
    vocabulary: {
      title: "Sustainable Lifestyles",
      difficulty: "B2-",
      type: "collocation",
      items: [
        { phrase: "reusable", definition: "able to be used more than once", example: "Always bring a reusable water bottle." },
        { phrase: "container", definition: "an object like a box or jar for holding items", example: "Bring an empty glass container for rice." },
        { phrase: "packaging", definition: "materials used to wrap or protect goods", example: "Avoid cereal boxes with heavy plastic packaging." },
        { phrase: "waste", definition: "unwanted materials that are thrown away", example: "Refill shopping reduces home plastic waste." },
        { phrase: "refill", definition: "to fill a container again with a substance", example: "I need to refill our soap bottles." },
        { phrase: "by weight", definition: "paying based on the heavy mass unit of the item", example: "All beans at the store are sold by weight." },
        { phrase: "habit", definition: "something you do regularly and automatically", example: "Waking early is a fantastic habit." },
        { phrase: "convenient", definition: "easy to use, near, or fitting your plans", example: "The nearby market is so convenient." }
      ],
      matchingGame: [
        { phrase: "reusable", definition: "able to be used multiple times" },
        { phrase: "container", definition: "box or jar holding food/liquid" },
        { phrase: "packaging", definition: "wrapping material around products" },
        { phrase: "waste", definition: "unwanted material thrown away" },
        { phrase: "refill", definition: "to fill a container again" },
        { phrase: "by weight", definition: "pricing based on product mass" },
        { phrase: "habit", definition: "automated regular behavior pattern" },
        { phrase: "convenient", definition: "easy, nearby, or practical to do" }
      ],
      teachingNote: "Encourage students to discuss local recycling habits."
    },
    grammar: {
      title: "Second Conditional",
      difficulty: "B2-",
      focus: "Hypothetical lifestyle choices and unreal conditions",
      examples: [
        "If I lived near the beach, I would walk every morning.",
        "If I had more time, I would cook healthy dinners."
      ],
      questions: [
        {
          id: 1,
          sentence: "If I ___ remotely, I ___ to a smaller coastal town.",
          verb: "work / move",
          options: [
            "worked / would move",
            "work / would move",
            "worked / will move",
            "work / will move"
          ],
          correctAnswer: 0,
          explanation: "Unreal conditions use past simple in the if-clause ('worked') and 'would + verb' in the result clause ('would move')."
        },
        {
          id: 2,
          sentence: "If she ___ more free time, she ___ a local walking group.",
          verb: "have / join",
          options: [
            "had / would join",
            "has / will join",
            "have / joined",
            "had / will join"
          ],
          correctAnswer: 0,
          explanation: "Irregular past tense 'had' is used plus 'would join' for hypothetical outcomes."
        },
        {
          id: 3,
          sentence: "If we ___ near an organic market, we ___ healthier ingredients.",
          verb: "live / buy",
          options: [
            "lived / would buy",
            "live / will buy",
            "lived / will buy",
            "lives / buy"
          ],
          correctAnswer: 0,
          explanation: "Hypothetical condition 'lived' goes with main clause 'would buy' for unreal setups."
        },
        {
          id: 4,
          sentence: "If he ___ fewer smartphone notifications, he ___ less overwhelmed.",
          verb: "receive / feel",
          options: [
            "received / would feel",
            "receives / will feel",
            "received / will feel",
            "receives / would feel"
          ],
          correctAnswer: 0,
          explanation: "Past simple 'received' specifies unreal present condition; 'would feel' represents hypothetical state."
        },
        {
          id: 5,
          sentence: "If they ___ a digital device, they ___ more board games.",
          verb: "not have / play",
          options: [
            "didn't have / would play",
            "don't have / would play",
            "didn't have / will play",
            "hadn't / would played"
          ],
          correctAnswer: 0,
          explanation: "Negative past unreal condition 'didn't have' matches result 'would play'."
        }
      ]
    },
    speaking: {
      title: "Roleplay: Special Dietary Requests",
      difficulty: "B2-",
      mode: "pair work",
      setup: "Student A is a customer with a dietary need; Student B is a restaurant host.",
      timing: "Preparation: 2 minutes. Role-play: 4 minutes.",
      instructions: "Make a reservation and ask about vegetarian, dairy-free, or low-salt options. The host must offer solutions politely.",
      followUp: [
        "How should restaurants deal with special requests?",
        "Is healthy food more popular now than before?"
      ],
      targetLanguage: [
        "Would it be possible to...?",
        "Do you offer...?",
        "We can prepare...",
        "Let me check that for you."
      ],
      teachingNote: "Politeness and functional language practice."
    },
    writing: {
      title: "For-and-Against Essay: Rural Relocations",
      difficulty: "B2",
      genre: "for-and-against essay",
      wordCount: "180-230 words",
      prompt: "Discuss the advantages and disadvantages of moving from a large city to a smaller city for a better lifestyle.",
      criteria: [
        "Present arguments for both sides clearly",
        "Use appropriate comparative language structures",
        "Conclude with a balanced personal opinion"
      ],
      teachingNote: "Supports B2 contrast and argument structure."
    }
  },
  {
    id: 9,
    title: "Unit 9: Refill Shopping & Team Fitness",
    theme: "Sustainability & Group Workouts",
    difficulty: "B2 CEFR",
    reading: {
      title: "Shopping with Less Waste",
      difficulty: "B2",
      focus: "main idea, vocabulary, detailed comprehension",
      text: "Refill stores are becoming more common in some neighborhoods. Instead of buying rice, soap, or cereal in new packages each time, customers bring their own containers and pay by weight. Supporters say this reduces plastic waste and encourages people to buy only what they need. However, refill shopping also requires planning. Customers must remember clean containers, check prices carefully, and sometimes visit more than one store to find everything. For people with busy schedules, convenience can be a barrier. Still, some families say the habit becomes easier after a few weeks, especially when they keep a shopping kit near the door.",
      questions: [
        {
          id: 1,
          question: "What is the main topic of the passage?",
          options: [
            "Opening organic chain restaurants",
            "A way to shop with less packaging",
            "Analyzing the rates of home deliveries",
            "How to open a large supermarket"
          ],
          correctAnswer: 1,
          explanation: "The passage introduces 'refill stores' as a way to buy products in existing packages."
        },
        {
          id: 2,
          question: "Refill shopping may require more planning than regular shopping.",
          options: ["True", "False"],
          correctAnswer: 0,
          explanation: "The writer says: 'refill shopping also requires planning. Customers must remember clean containers...'"
        },
        {
          id: 3,
          question: "In the text, 'barrier' means...",
          options: ["an advantage", "an obstacle", "a container", "a discount"],
          correctAnswer: 1,
          explanation: "A 'barrier' represents an impediment or difficulty (an obstacle)."
        },
        {
          id: 4,
          question: "What practical suggestion is mentioned to secure the habit?",
          options: [
            "Keep a shopping kit near the door",
            "Buy separate plastic bags",
            "Avoid comparing prices",
            "Shop only once a year"
          ],
          correctAnswer: 0,
          explanation: "The author suggests keeping a 'shopping kit near the door' to make the habit easier."
        },
        {
          id: 5,
          question: "The writer presents refill shopping as...",
          options: [
            "perfect for everyone",
            "useful but sometimes inconvenient",
            "illegal in most countries",
            "only for very wealthy people"
          ],
          correctAnswer: 1,
          explanation: "The author notes positive benefits (reduces waste) but highlights constraints (requires planning, multiple store visits)."
        }
      ],
      teachingNote: "Ask students to find contrast words: however, still, especially."
    },
    listening: {
      title: "Announcement: Community Fitness Day",
      difficulty: "B2",
      type: "Announcement",
      script: [
        { id: 1, speaker: "Organizer", text: "Good morning, everyone. Welcome to Community Fitness Day. Activities will begin at nine thirty with a gentle warm-up in the main square." },
        { id: 2, speaker: "Organizer", text: "At ten, you can choose between a beginner cycling session, a family walk through the park, or a short workshop on healthy meal planning." },
        { id: 3, speaker: "Organizer", text: "Please sign your name at each activity table before joining, as spaces are limited." },
        { id: 4, speaker: "Organizer", text: "Water stations are located beside the library and near the playground." },
        { id: 5, speaker: "Organizer", text: "If you feel unwell at any time, speak to one of the volunteers wearing blue shirts. Remember, today is not a competition. The goal is to try something new and meet people." }
      ],
      questions: [
        {
          id: 1,
          question: "What time does the gentle warm-up begin?",
          options: ["9:00 a.m.", "9:30 a.m.", "10:00 a.m.", "10:30 a.m."],
          correctAnswer: 1,
          explanation: "The organizer announces: 'Activities will begin at nine thirty...'"
        },
        {
          id: 2,
          question: "Why are participants asked to sign their names at tables?",
          options: [
            "To win organic foods",
            "Because spaces are limited",
            "To qualify for a marathon",
            "To collect custom key cards"
          ],
          correctAnswer: 1,
          explanation: "The text says: 'Please sign your name... as spaces are limited.'"
        },
        {
          id: 3,
          question: "What is stated as the main goal of the day?",
          options: [
            "To break speed records",
            "To try something new and meet neighbors",
            "To raise money for the library",
            "To test cycling equipment"
          ],
          correctAnswer: 1,
          explanation: "The organizer confirms: 'The goal is to try something new and meet people.'"
        }
      ],
      preListening: "Students match activity names to pictures or definitions.",
      postListening: "Students design a community lifestyle event."
    },
    vocabulary: {
      title: "Feelings and Reactions",
      difficulty: "B2",
      type: "choose_the_best_word",
      items: [
        { phrase: "relieved", definition: "happy because a difficult problem is gone or avoided", example: "She was relieved that her travel went smoothly." },
        { phrase: "overwhelmed", definition: "feeling unable to deal with too much stimulus or work", example: "Too many notifications left him overwhelmed." },
        { phrase: "motivated", definition: "wanting to do something due to interest or drive", example: "She felt motivated to try yoga." },
        { phrase: "frustrated", definition: "annoyed or impatient because something is hard or blocked", example: "He got frustrated when the train was delayed." },
        { phrase: "disconnected", definition: "not feeling emotionally or digitally linked to people/surroundings", example: "Without his phone, he felt disconnected at first." },
        { phrase: "calm", definition: "peaceful, quiet, and free from worry", example: "A quiet room facing the garden made her feel calm." },
        { phrase: "aware", definition: "knowing or noticing that something exists", example: "Be aware of your screens habits. " },
        { phrase: "satisfied", definition: "pleased because you got what you wanted or did well", example: "She felt satisfied with her test score." }
      ],
      matchingGame: [
        { phrase: "relieved", definition: "happy because a problem is solved" },
        { phrase: "overwhelmed", definition: "feeling unable to handle too much" },
        { phrase: "motivated", definition: "driven and eager to do something" },
        { phrase: "frustrated", definition: "annoyed because progress is blocked" },
        { phrase: "disconnected", definition: "isolated, not linked to devices/others" },
        { phrase: "calm", definition: "peaceful, quiet, and free from worry" },
        { phrase: "aware", definition: "knowing or noticing something exists" },
        { phrase: "satisfied", definition: "pleased with results or actions" }
      ],
      teachingNote: "Great vocabulary for discussing emotional states during change."
    },
    grammar: {
      title: "Relative Clauses",
      difficulty: "B2-",
      focus: "Defining relative clauses to describe places, things, and people",
      examples: [
        "The café that opened near my office is excellent.",
        "The guide, who was very friendly, explained the route."
      ],
      questions: [
        {
          id: 1,
          sentence: "The hotel ___ we stayed was near the beautiful river.",
          verb: "place",
          options: ["where", "which", "who", "when"],
          correctAnswer: 0,
          explanation: "Use relative adverb 'where' to describe locations."
        },
        {
          id: 2,
          sentence: "The friendly receptionist ___ changed my room was helpful.",
          verb: "person",
          options: ["who", "which", "where", "whose"],
          correctAnswer: 0,
          explanation: "Use 'who' or 'that' as the relative pronoun for people."
        },
        {
          id: 3,
          sentence: "The smartphone app ___ tracks my routines sends daily alerts.",
          verb: "thing",
          options: ["that / which", "who", "where", "whom"],
          correctAnswer: 0,
          explanation: "'That' or 'which' is standard relative pronoun to define things or ideas."
        },
        {
          id: 4,
          sentence: "The local food market ___ opens on Sundays sells organic grains.",
          verb: "thing",
          options: ["which", "who", "where", "whose"],
          correctAnswer: 0,
          explanation: "'Which' introduces defining details on an inanimate noun."
        },
        {
          id: 5,
          sentence: "The active neighbors ___ meet outside the library are friendly.",
          verb: "people",
          options: ["who", "which", "where", "whose"],
          correctAnswer: 0,
          explanation: "Use 'who' for plural active human subjects."
        }
      ]
    },
    speaking: {
      title: "Mini Lesson: A Mindful Routine Shift",
      difficulty: "B2",
      mode: "individual presentation",
      setup: "Students choose one habit: sleep routine, walking, meal planning, budgeting, reading, or reducing screen time.",
      timing: "Preparation: 5 minutes. Speaking: 2 minutes.",
      instructions: "Explain the habit, why you started it, what was difficult, and what changed.",
      followUp: [
        "Would you recommend this habit to everyone?",
        "What makes habits difficult to maintain?"
      ],
      targetLanguage: [
        "I started because...",
        "At first...",
        "Gradually...",
        "The biggest change was..."
      ],
      teachingNote: "Excellent for past tenses, sequencing, and reflection."
    },
    writing: {
      title: "Proposal: Neighborhood Wellness Event",
      difficulty: "B2",
      genre: "proposal",
      wordCount: "180-230 words",
      prompt: "Your school or workplace wants to organize a community wellness event. Write a proposal suggesting activities, explaining benefits, and mentioning possible challenges.",
      criteria: [
        "Use appropriate headings to organize sections",
        "Explain benefits clearly with action vocabulary",
        "Address specific, practical challenges"
      ],
      teachingNote: "Useful for workplace/community English."
    }
  },
  {
    id: 10,
    title: "Unit 10: Remote Work Variables",
    theme: "Provincial Moves & Life Boundaries",
    difficulty: "B2 CEFR",
    reading: {
      title: "Working Remotely from a Smaller City",
      difficulty: "B2",
      focus: "inference, argument structure, detailed comprehension",
      text: "After two years of remote work, Ana moved from a capital city to a smaller coastal town. She expected lower rent and quieter mornings, and she found both. However, the change also affected her routine in unexpected ways. There were fewer professional events, and the internet was less reliable during storms. On the other hand, she spent less time commuting and more time cooking, exercising, and meeting neighbors. Ana says the move did not solve every problem, but it made her more aware of how location influences lifestyle. She now visits the capital once a month for meetings and cultural events, while keeping her daily life slower and less expensive.",
      questions: [
        {
          id: 1,
          question: "Why did Ana relocate to a smaller town?",
          options: [
            "She wanted a different lifestyle.",
            "She lost her remote job.",
            "She disliked coastal environments.",
            "She needed a massive office room."
          ],
          correctAnswer: 0,
          explanation: "She expected lower rent, quieter mornings, and more time for wellness (a different lifestyle)."
        },
        {
          id: 2,
          question: "The internet was always reliable in the coastal town.",
          options: ["True", "False"],
          correctAnswer: 1,
          explanation: "The text says: 'the internet was less reliable during storms.'"
        },
        {
          id: 3,
          question: "Which of these benefits is explicitly mentioned?",
          options: [
            "More professional events",
            "More time for cooking and exercise",
            "An increase in commuting hours",
            "Lower food costs"
          ],
          correctAnswer: 1,
          explanation: "The text notes: 'she spent less time commuting and more time cooking, exercising, and meeting neighbors.'"
        },
        {
          id: 4,
          question: "Ana's holistic perspective on the move is best described as...",
          options: ["balanced", "completely negative", "regretful only", "uninterested"],
          correctAnswer: 0,
          explanation: "She states the move didn't solve everything, but it made her aware of lifestyle variables, showing a balanced view."
        },
        {
          id: 5,
          question: "Why does Ana visit the capital monthly?",
          options: [
            "For client meetings and cultural events",
            "To find a brand new apartment",
            "To repair her home internet connection",
            "For medical treatments"
          ],
          correctAnswer: 0,
          explanation: "The text says: 'She now visits the capital once a month for meetings and cultural events...'"
        }
      ],
      teachingNote: "Useful for B2 comparison and balanced opinion practice."
    },
    listening: {
      title: "Interview: Remote Work and Lifestyle Boundaries",
      difficulty: "B2",
      type: "Interview",
      script: [
        { id: 1, speaker: "Interviewer", text: "You moved to a smaller city while keeping your remote job. Was it difficult?" },
        { id: 2, speaker: "Guest", text: "In some ways, yes. I had to create clearer boundaries because my home became my office. At first, I worked longer hours because there was no commute to mark the end of the day." },
        { id: 3, speaker: "Interviewer", text: "How did you solve that?" },
        { id: 4, speaker: "Guest", text: "I started leaving the house for a short walk at six, even if I was not going anywhere special. It became a signal that work was over." },
        { id: 5, speaker: "Interviewer", text: "Do you miss the capital?" },
        { id: 6, speaker: "Guest", text: "Sometimes. I miss cultural events, but I don't miss the noise or the rent." }
      ],
      questions: [
        {
          id: 1,
          question: "What problem did the guest encounter first after moving?",
          options: [
            "Poor cellular signal",
            "Working longer hours due to blurred boundaries",
            "Noisy apartments",
            "Difficulty communicating with their manager"
          ],
          correctAnswer: 1,
          explanation: "The guest mentions working longer hours because 'home became my office' and they had 'no commute to mark the end of the day.'"
        },
        {
          id: 2,
          question: "What daily act does the guest perform at six o'clock?",
          options: [
            "Cooks a healthy dinner",
            "Goes for a short walk",
            "Checks new messages",
            "Does stretching exercises"
          ],
          correctAnswer: 1,
          explanation: "The guest started 'leaving the house for a short walk at six' to signal that work was over."
        },
        {
          id: 3,
          question: "What aspects of the capital city does the guest miss?",
          options: [
            "High rent costs",
            "Noisy streets",
            "Cultural events",
            "Long commute hours"
          ],
          correctAnswer: 2,
          explanation: "The guest says: 'Sometimes. I miss cultural events...'"
        }
      ],
      preListening: "Students discuss advantages and disadvantages of remote work.",
      postListening: "Students give advice to a remote worker."
    },
    vocabulary: {
      title: "Essential B2 Lifestyle Collocations",
      difficulty: "B2",
      type: "sentence_completion",
      items: [
        { phrase: "make a reservation", definition: "to arrange to keep a table, hotel room, or seat custom-booked", example: "We need to make a reservation for dinner." },
        { phrase: "set boundaries", definition: "to set rules dividing work and personal life", example: "Remote workers must set boundaries." },
        { phrase: "keep a routine", definition: "to maintain a regular set of daily habits", example: "It is helpful to keep a routine even on vacation." },
        { phrase: "reduce stress", definition: "to lower feelings of continuous tension", example: "Stretching for five minutes helps reduce stress." },
        { phrase: "miss a connection", definition: "to arrive late and fail to board a second vehicle", example: "If the train is delayed, we might miss a connection." },
        { phrase: "save time", definition: "to accomplish tasks in less time", example: "Taking a taxi was expensive but it saved time." },
        { phrase: "improve well-being", definition: "to make health and happiness better", example: "Eating vegetables helps improve well-being." },
        { phrase: "face a challenge", definition: "to confront and deal with a difficult situation", example: "She expects to face a challenge during screen-free days." }
      ],
      matchingGame: [
        { phrase: "make a reservation", definition: "to book a table, room, or ticket in advance" },
        { phrase: "set boundaries", definition: "to declare limits dividing life aspects" },
        { phrase: "keep a routine", definition: "to follow a regular morning habit set" },
        { phrase: "reduce stress", definition: "to ease cognitive or physical tension" },
        { phrase: "miss a connection", definition: "to arrive late for a continuing transit" },
        { phrase: "save time", definition: "to use fewer minutes to finish something" },
        { phrase: "improve well-being", definition: "to enhance general health and happiness" },
        { phrase: "face a challenge", definition: "to confront a difficult circumstance" }
      ],
      teachingNote: "Useful for B2 comparison and balanced opinion practice."
    },
    grammar: {
      title: "Linking Words for B2 Answers",
      difficulty: "B2",
      focus: "Contrast, result, reason, and addition transitions",
      examples: [
        "The city is expensive; however, it offers many opportunities.",
        "I turned off notifications because they distracted me."
      ],
      questions: [
        {
          id: 1,
          sentence: "The apartment was small; ___, it was very clean.",
          verb: "contrast",
          options: ["however", "because", "therefore", "although"],
          correctAnswer: 0,
          explanation: "Use semicolon + 'however' + comma for showing contrast between two independent clauses."
        },
        {
          id: 2,
          sentence: "I booked early ___ prices increase quickly.",
          verb: "reason",
          options: ["because", "however", "therefore", "in addition"],
          correctAnswer: 0,
          explanation: "Use 'because' to introduce the physical cause or reason."
        },
        {
          id: 3,
          sentence: "The train was canceled; ___, we took the bus to the wellness center.",
          verb: "result",
          options: ["therefore", "because", "although", "however"],
          correctAnswer: 0,
          explanation: "Use 'therefore' to connect an event to its direct logical outcome or result."
        },
        {
          id: 4,
          sentence: "___ the café was extremely crowded, the service was fast.",
          verb: "contrast",
          options: ["Although", "Because", "Therefore", "In addition"],
          correctAnswer: 0,
          explanation: "Use 'Although' to introduce a subordinate concession clause."
        },
        {
          id: 5,
          sentence: "The hotel has a luxury gym; ___, it offers healthy fresh food.",
          verb: "addition",
          options: ["in addition", "because", "although", "therefore"],
          correctAnswer: 0,
          explanation: "Use 'in addition' (or 'moreover') to introduce supplementary points of information."
        }
      ]
    },
    speaking: {
      title: "Persuade a Manager regarding Balance",
      difficulty: "B2",
      mode: "individual or pair role-play",
      setup: "Student speaks to a manager and proposes one lifestyle-friendly workplace change.",
      timing: "Preparation: 3 minutes. Speaking: 90 seconds.",
      instructions: "Persuade a manager to introduce one change: flexible hours, walking meetings, healthier cafeteria options, or no-meeting Friday afternoons. Give reasons and address one possible concern.",
      followUp: [
        "What concern might the manager have?",
        "How can you make your idea practical?"
      ],
      targetLanguage: [
        "I'd like to suggest...",
        "This would benefit...",
        "I understand the concern, but...",
        "A practical solution would be..."
      ],
      teachingNote: "This is close to MET persuasive speaking: position + reasons + audience awareness."
    },
    writing: {
      title: "Argumentative Essay: Lifestyle & Tech",
      difficulty: "B2",
      genre: "argumentative essay",
      wordCount: "200-250 words",
      prompt: "Technology has made modern life more convenient, but not necessarily healthier. To what extent do you agree? Include a counterargument and examples.",
      criteria: [
        "Develop a clear, consistent argument throughout",
        "Include and answer a solid counterargument",
        "Use realistic illustrative examples from daily routines"
      ],
      teachingNote: "Final writing task; assess coherence, paragraphing, and range."
    }
  }
];
