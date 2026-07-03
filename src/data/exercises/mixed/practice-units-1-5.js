export const UNITS_1_TO_5 = [
  {
    id: 1,
    title: "Unit 1: Hotel Calm Check-In",
    theme: "Accommodation & Arrival",
    difficulty: "B1+ CEFR",
    reading: {
      title: "A Calm Check-In",
      difficulty: "B1+",
      focus: "scanning, detailed comprehension, inference",
      text: "Maya arrived at the hotel just after 9 p.m. after a long day of travel. She had planned to go straight to bed, but the receptionist explained that the hotel café was still open for another thirty minutes. Maya asked for a quiet room because she had an online meeting early the next morning. The receptionist checked the system and moved her from a room near the elevator to one on the fourth floor, facing the garden. Before going upstairs, Maya bought a sandwich and a bottle of water from the café. She felt tired, but she was relieved that the first evening of her trip had become easier than expected.",
      questions: [
        {
          id: 1,
          question: "Why did Maya ask for a quiet room?",
          options: [
            "She disliked elevators.",
            "She had an early online meeting.",
            "She wanted to sleep late.",
            "She was traveling with children."
          ],
          correctAnswer: 1,
          explanation: "The text says: 'Maya asked for a quiet room because she had an online meeting early the next morning.'"
        },
        {
          id: 2,
          question: "The hotel café was already closed when Maya arrived.",
          options: ["True", "False"],
          correctAnswer: 1,
          explanation: "The hotel café was open for another thirty minutes when she arrived."
        },
        {
          id: 3,
          question: "What did the receptionist do to help Maya?",
          options: [
            "Booked a taxi for her",
            "Changed her room",
            "Carried her luggage",
            "Prepared dinner"
          ],
          correctAnswer: 1,
          explanation: "The receptionist moved her from a room near the elevator to one on the fourth floor, facing the garden."
        },
        {
          id: 4,
          question: "How did Maya probably feel at the end of the passage?",
          options: [
            "More relaxed",
            "Angry with the hotel",
            "Confused about her booking",
            "Worried about money"
          ],
          correctAnswer: 0,
          explanation: "At the end, Maya felt 'relieved that the first evening of her trip had become easier than expected.'"
        },
        {
          id: 5,
          question: "Where was Maya's new room facing?",
          options: ["The street", "The elevator", "The garden", "The café"],
          correctAnswer: 2,
          explanation: "The receptionist moved her to a room 'facing the garden.'"
        }
      ],
      teachingNote: "Use this as a gentle first reading task. Ask students to underline time references and hotel-service vocabulary."
    },
    listening: {
      title: "Hotel Check-In with a Room Request",
      difficulty: "B1+",
      type: "Conversation",
      script: [
        { id: 1, speaker: "Receptionist", text: "Good evening. Welcome to River View Hotel. How can I help you?" },
        { id: 2, speaker: "Guest", text: "Hi, I have a reservation under Daniel Costa." },
        { id: 3, speaker: "Receptionist", text: "Let me check. Yes, one single room for two nights." },
        { id: 4, speaker: "Guest", text: "That's right. I also requested a quiet room because I have an online meeting tomorrow morning." },
        { id: 5, speaker: "Receptionist", text: "I see the note here. We can give you a room on the fifth floor, away from the elevator." },
        { id: 6, speaker: "Guest", text: "That would be perfect. Is breakfast included?" },
        { id: 7, speaker: "Receptionist", text: "Yes, breakfast is served from seven to ten. The gym opens at six if you want to exercise before your meeting." },
        { id: 8, speaker: "Guest", text: "Great. I'll probably use it tomorrow." },
        { id: 9, speaker: "Receptionist", text: "Here is your key card. Enjoy your stay." }
      ],
      questions: [
        {
          id: 1,
          question: "How long is Daniel Costa staying?",
          options: ["One night", "Two nights", "Three nights", "Four nights"],
          correctAnswer: 1,
          explanation: "The receptionist confirms 'one single room for two nights.'"
        },
        {
          id: 2,
          question: "Why does Daniel Costa want a quiet room?",
          options: [
            "He needs to sleep in late.",
            "He has an online meeting tomorrow morning.",
            "He dislikes traffic noise.",
            "He wants to study vocabulary."
          ],
          correctAnswer: 1,
          explanation: "Daniel mentions: 'I also requested a quiet room because I have an online meeting tomorrow morning.'"
        },
        {
          id: 3,
          question: "What time does the gym open?",
          options: ["5:00 a.m.", "6:00 a.m.", "7:00 a.m.", "8:00 a.m."],
          correctAnswer: 1,
          explanation: "The receptionist explicitly states: 'The gym opens at six.'"
        }
      ],
      preListening: "Ask: What do people usually request when checking in at a hotel?",
      postListening: "Role-play a hotel check-in and make one lifestyle-related request."
    },
    vocabulary: {
      title: "Accommodation Target",
      difficulty: "B1+",
      type: "matching",
      items: [
        { phrase: "reception", definition: "the front desk area in a hotel", example: "Check in with the host at the reception." },
        { phrase: "reservation", definition: "an arrangement to keep a room or table for you", example: "We have a dinner reservation under Daniel Costa." },
        { phrase: "key card", definition: "a plastic card used to open a hotel room", example: "Put the key card near the door reader to unlock." },
        { phrase: "elevator", definition: "a machine that carries people between floors", example: "The elevator takes you to the fifth floor." },
        { phrase: "lobby", definition: "the entrance area of a hotel", example: "Let's meet in the lobby before going out." },
        { phrase: "available", definition: "free or ready to be used", example: "Is the quiet room available tonight?" },
        { phrase: "included", definition: "part of the price or service", example: "Is fresh breakfast included with the room?" },
        { phrase: "quiet room", definition: "a room away from noise", example: "They checked into a quiet room facing the garden." }
      ],
      matchingGame: [
        { phrase: "reception", definition: "the front desk area in a hotel" },
        { phrase: "reservation", definition: "an arrangement to keep a room/table" },
        { phrase: "key card", definition: "a plastic card used to open a room" },
        { phrase: "elevator", definition: "a machine carrying people between floors" },
        { phrase: "lobby", definition: "the entrance area of a hotel" },
        { phrase: "available", definition: "free or ready to be used" },
        { phrase: "included", definition: "part of the price or service" },
        { phrase: "quiet room", definition: "a room situated away from noise" }
      ],
      teachingNote: "Focus on hotel-service vocabulary. Have pupils practice matching words with definitions."
    },
    grammar: {
      title: "Present Simple vs Present Continuous",
      difficulty: "B1+",
      focus: "Routines and temporary situations",
      examples: [
        "I usually walk to work.",
        "This week I am staying at a hotel."
      ],
      questions: [
        {
          id: 1,
          sentence: "I usually ___ breakfast at home.",
          verb: "have",
          options: ["have", "am having", "haves", "had"],
          correctAnswer: 0,
          explanation: "Present simple is used for habitual routines (indicated by 'usually')."
        },
        {
          id: 2,
          sentence: "This week, she ___ in a rented apartment.",
          verb: "stay",
          options: ["stays", "is staying", "stay", "stayed"],
          correctAnswer: 1,
          explanation: "Present continuous is used for temporary situations occurring around now (indicated by 'This week')."
        },
        {
          id: 3,
          sentence: "They ___ yoga every Monday.",
          verb: "do",
          options: ["do", "are doing", "does", "done"],
          correctAnswer: 0,
          explanation: "Present simple is used for recurrent routines (indicated by 'every Monday')."
        },
        {
          id: 4,
          sentence: "We ___ for a quiet café right now.",
          verb: "look",
          options: ["are looking", "look", "looks", "is looking"],
          correctAnswer: 0,
          explanation: "Present continuous is used for actions happening at the exact moment of speaking ('right now')."
        },
        {
          id: 5,
          sentence: "He often ___ his phone before bed.",
          verb: "check",
          options: ["checks", "is checking", "check", "checking"],
          correctAnswer: 0,
          explanation: "Present simple is correct for regular habits (indicated by 'often')."
        }
      ]
    },
    speaking: {
      title: "Describe a Hotel Check-In Scene",
      difficulty: "B1+",
      mode: "individual",
      setup: "Show the hotel reception image from Reading Exercise 1",
      timing: "Preparation: 30 seconds. Speaking: 60 seconds.",
      instructions: "Describe the picture. Say where the people are, what they are doing, and how they probably feel.",
      followUp: [
        "Have you ever had a difficult check-in experience?",
        "What makes a hotel stay comfortable?"
      ],
      targetLanguage: [
        "There is / There are...",
        "...seems to be...",
        "...might be...",
        "probably",
        "in the background..."
      ],
      teachingNote: "Push students beyond listing objects: action + inference + reason."
    },
    writing: {
      title: "Informal Email: A Short Trip",
      difficulty: "B1+",
      genre: "informal email",
      wordCount: "80-120 words",
      prompt: "Write an email to a friend about a short trip you recently took. Mention where you stayed, what you did, and one thing you would do differently next time.",
      criteria: [
        "Use past tenses correctly",
        "Organize ideas clearly",
        "Include at least one feeling or opinion"
      ],
      teachingNote: "Good first writing task after Reading."
    }
  },
  {
    id: 2,
    title: "Unit 2: Perfect Weekend Apartment",
    theme: "Reviews & Recommendations",
    difficulty: "B1+ CEFR",
    reading: {
      title: "A Review of a Weekend Apartment",
      difficulty: "B1+",
      focus: "skimming, opinion recognition",
      text: "We stayed in a small apartment near the river for two nights. The location was excellent because we could walk to cafés, museums, and a weekend market. The apartment was clean and bright, although the kitchen was smaller than it looked in the photos. The host sent clear instructions before we arrived, so check-in was simple. At night, the street was a little noisy, especially on Saturday, but closing the windows helped. I would recommend this place to travelers who want to explore the city on foot and do not mind a lively neighborhood.",
      questions: [
        {
          id: 1,
          question: "What is the main purpose of the text?",
          options: [
            "To complain formally",
            "To review accommodation",
            "To advertise a museum",
            "To explain transport rules"
          ],
          correctAnswer: 1,
          explanation: "The text reviews a stay at an apartment, highlighting location, setup, noise, and recommendations."
        },
        {
          id: 2,
          question: "The reviewer says the kitchen was bigger than expected.",
          options: ["True", "False"],
          correctAnswer: 1,
          explanation: "The reviewer explicitly mentions the kitchen was 'smaller than it looked in the photos.'"
        },
        {
          id: 3,
          question: "Who would probably enjoy this apartment most?",
          options: [
            "Travelers who want a quiet countryside stay",
            "Travelers who like walking around the city",
            "People who need a large kitchen",
            "Families who need total silence"
          ],
          correctAnswer: 1,
          explanation: "The author recommends it 'to travelers who want to explore the city on foot.'"
        },
        {
          id: 4,
          question: "The reviewer's overall opinion is...",
          options: ["mostly positive", "completely negative", "unclear", "angry"],
          correctAnswer: 0,
          explanation: "The reviewer offers recommendation, lists mostly good benefits, and concludes positive."
        }
      ],
      teachingNote: "Good for distinguishing main idea from supporting details."
    },
    listening: {
      title: "Directions to a Healthy Café",
      difficulty: "B1+",
      type: "Conversation",
      script: [
        { id: 1, speaker: "Tourist", text: "Excuse me, is there a healthy café near here?" },
        { id: 2, speaker: "Local", text: "Yes, there's one called Green Corner. It's about ten minutes away on foot." },
        { id: 3, speaker: "Tourist", text: "Great. How do I get there?" },
        { id: 4, speaker: "Local", text: "Walk straight along this street until you see the public library. Turn left there, and keep walking for two blocks. The café is next to a bike shop." },
        { id: 5, speaker: "Tourist", text: "Is it expensive?" },
        { id: 6, speaker: "Local", text: "Not really. They have lunch bowls, smoothies, and soup. It's popular with students and office workers, so it can get crowded after twelve thirty." },
        { id: 7, speaker: "Tourist", text: "Maybe I'll go now, then." },
        { id: 8, speaker: "Local", text: "Good idea. If you arrive before noon, you'll probably find a table." }
      ],
      questions: [
        {
          id: 1,
          question: "How far away is the café on foot?",
          options: ["About five minutes", "About ten minutes", "About twenty minutes", "About half an hour"],
          correctAnswer: 1,
          explanation: "The local says 'It's about ten minutes away on foot.'"
        },
        {
          id: 2,
          question: "What is the café next to?",
          options: ["A public library", "A park", "A bike shop", "A gym"],
          correctAnswer: 2,
          explanation: "The local says: 'The café is next to a bike shop.'"
        },
        {
          id: 3,
          question: "When does the café get crowded?",
          options: ["Before noon", "After twelve thirty / 12:30", "Early morning", "Only on Saturday"],
          correctAnswer: 1,
          explanation: "The local warns: 'It can get crowded after twelve thirty.'"
        }
      ],
      preListening: "Students predict café vocabulary: smoothie, bowl, crowded, table.",
      postListening: "Students give directions from school/home to a healthy place nearby."
    },
    vocabulary: {
      title: "Healthy Food Options",
      difficulty: "B1+",
      type: "fill_in_the_blank",
      items: [
        { phrase: "whole-grain", definition: "made with the complete grain of wheat or other cereals", example: "I prefer whole-grain bread." },
        { phrase: "vegetarian", definition: "not containing meat or fish products", example: "The pasta dish is completely vegetarian." },
        { phrase: "dairy-free", definition: "not containing any milk, butter, or cheese products", example: "This vegetable soup is dairy-free." },
        { phrase: "smoothie", definition: "a thick drink made with fruit, vegetables, and yogurt or milk", example: "She ordered a strawberry and spinach smoothie." },
        { phrase: "portion", definition: "an amount of food served to one person", example: "A healthy portion of vegetables is crucial." },
        { phrase: "balanced meal", definition: "a meal containing different food groups in correct quantities", example: "A balanced meal contains proteins and fibers." },
        { phrase: "fresh", definition: "recently made, gathered, or picked; not preserved", example: "These apples are fresh from the garden." },
        { phrase: "ingredient", definition: "one of the substances that are combined to make a dish", example: "What is the primary ingredient in this sauce?" }
      ],
      matchingGame: [
        { phrase: "whole-grain", definition: "made with the complete grain" },
        { phrase: "vegetarian", definition: "not containing meat or fish" },
        { phrase: "dairy-free", definition: "not containing any milk products" },
        { phrase: "smoothie", definition: "a thick drink made with blended fruits" },
        { phrase: "portion", definition: "an amount of food served to one person" },
        { phrase: "balanced meal", definition: "a meal containing different food groups" },
        { phrase: "fresh", definition: "recently made, gathered, or picked" },
        { phrase: "ingredient", definition: "a substance used to make a dish" }
      ],
      teachingNote: "Review food adjectives. Excellent for meals planning."
    },
    grammar: {
      title: "Past Simple vs Past Continuous",
      difficulty: "B1+",
      focus: "Travel experiences and interrupting events",
      examples: [
        "I was waiting at reception when my friend arrived.",
        "We missed the bus yesterday."
      ],
      questions: [
        {
          id: 1,
          sentence: "I ___ dinner when the hotel called.",
          verb: "have",
          options: ["was having", "had", "am having", "were having"],
          correctAnswer: 0,
          explanation: "Continuous aspect describes an ongoing background action interrupted by a shorter simple past action."
        },
        {
          id: 2,
          sentence: "She ___ her suitcase at the airport.",
          verb: "lose",
          options: ["lost", "was losing", "loses", "loosing"],
          correctAnswer: 0,
          explanation: "Completed past simple is correct for a sudden singular event in the past."
        },
        {
          id: 3,
          sentence: "We ___ to the market when it started raining.",
          verb: "walk",
          options: ["were walking", "walked", "was walking", "are walking"],
          correctAnswer: 0,
          explanation: "Continuous format is crucial since walking was ongoing when the rain started."
        },
        {
          id: 4,
          sentence: "They ___ a great café last weekend.",
          verb: "find",
          options: ["found", "were finding", "finded", "find"],
          correctAnswer: 0,
          explanation: "Past simple indicates completed past event specified by time ('last weekend')."
        },
        {
          id: 5,
          sentence: "He ___ when the announcement started.",
          verb: "sleep",
          options: ["was sleeping", "slept", "is sleeping", "sleeping"],
          correctAnswer: 0,
          explanation: "Ongoing past action uses Past Continuous."
        }
      ]
    },
    speaking: {
      title: "Recommend a Healthy Restaurant",
      difficulty: "B1+",
      mode: "pair work",
      setup: "Student A is a visitor; Student B is a local resident.",
      timing: "Preparation: 2 minutes. Role-play: 3 minutes.",
      instructions: "Recommend a café, park, gym, market, or walking route. Explain where it is, why it is good, and who would enjoy it.",
      followUp: [
        "What places in a city support a healthy lifestyle?",
        "Are healthy options usually expensive?"
      ],
      targetLanguage: [
        "I'd recommend...",
        "It's suitable for...",
        "The best thing about it is...",
        "You should try..."
      ],
      teachingNote: "Useful for real-world recommendation language."
    },
    writing: {
      title: "Restaurant Review",
      difficulty: "B1+",
      genre: "review",
      wordCount: "100-140 words",
      prompt: "Write a review of a café or restaurant that supports a healthy lifestyle. Describe the food, atmosphere, service, and whether you would recommend it.",
      criteria: [
        "Use descriptive adjectives",
        "Give clear reasons for your opinion",
        "Mention at least one positive and one negative point"
      ],
      teachingNote: "Connect to food vocabulary and comparative language."
    }
  },
  {
    id: 3,
    title: "Unit 3: Mid-Mountain Health Retreat",
    theme: "Retreats & Reservations",
    difficulty: "B1+ CEFR",
    reading: {
      title: "A Health Retreat in the Mountains",
      difficulty: "B1+",
      focus: "detailed comprehension, vocabulary in context",
      text: "The three-day mountain retreat is designed for people who want a short break from busy routines. Each morning begins with light stretching and a guided walk through the forest. After breakfast, guests can join workshops on stress management, healthy cooking, or sleep habits. The program is flexible, so visitors may skip any activity and spend time reading or resting instead. Meals are included and are made with local vegetables, grains, and fresh fruit. The retreat is not a medical treatment, but many guests say they leave with more energy and a clearer plan for improving their daily lifestyle.",
      questions: [
        {
          id: 1,
          question: "What is the retreat mainly for?",
          options: [
            "Learning extreme sports",
            "Taking a break from busy routines",
            "Receiving medical treatment",
            "Training to become a chef"
          ],
          correctAnswer: 1,
          explanation: "The retreat is 'designed for people who want a short break from busy routines.'"
        },
        {
          id: 2,
          question: "Guests must attend every activity.",
          options: ["True", "False"],
          correctAnswer: 1,
          explanation: "The text says: 'The program is flexible, so visitors may skip any activity.'"
        },
        {
          id: 3,
          question: "Which activity is mentioned in the passage?",
          options: [
            "Rock climbing",
            "Stress management",
            "Language lessons",
            "Night skiing"
          ],
          correctAnswer: 1,
          explanation: "The text mentions workshops on 'stress management, healthy cooking, or sleep habits.'"
        },
        {
          id: 4,
          question: "In the text, 'flexible' means...",
          options: [
            "expensive",
            "easy to change",
            "very strict",
            "physically difficult"
          ],
          correctAnswer: 1,
          explanation: "'Flexible' indicates that guests do not have rigid mandates (they can swap or skip, so it is easy to change)."
        }
      ],
      teachingNote: "Follow up with a speaking question: Would you join this retreat? Why?"
    },
    listening: {
      title: "Making a Dinner Reservation",
      difficulty: "B1+",
      type: "Conversation",
      script: [
        { id: 1, speaker: "Host", text: "Good afternoon, Bella Vista Restaurant. How may I help you?" },
        { id: 2, speaker: "Caller", text: "Hi, I'd like to book a table for Friday evening." },
        { id: 3, speaker: "Host", text: "Of course. How many people?" },
        { id: 4, speaker: "Caller", text: "Four. We're celebrating my sister's new job, so we'd like a quiet table if possible." },
        { id: 5, speaker: "Host", text: "We have a table at seven or eight thirty." },
        { id: 6, speaker: "Caller", text: "Seven is better. Do you have vegetarian options?" },
        { id: 7, speaker: "Host", text: "Yes, we have several vegetarian dishes, and we can also prepare meals without dairy if you tell your server." },
        { id: 8, speaker: "Caller", text: "That's helpful. One person in our group avoids dairy." },
        { id: 9, speaker: "Host", text: "No problem. May I have your name and phone number?" }
      ],
      questions: [
        {
          id: 1,
          question: "What day is the reservation for?",
          options: ["Friday evening", "Saturday evening", "Sunday lunch", "Thursday"],
          correctAnswer: 0,
          explanation: "The caller says 'book a table for Friday evening.'"
        },
        {
          id: 2,
          question: "How many people will come?",
          options: ["Two", "Four", "Five", "Six"],
          correctAnswer: 1,
          explanation: "The caller requests a table for 'Four.'"
        },
        {
          id: 3,
          question: "What specific dietary exclusion is mentioned by the caller?",
          options: ["Gluten-free", "Nut-free", "Dairy-free / avoiding dairy", "Low sodium"],
          correctAnswer: 2,
          explanation: "The caller says: 'One person in our group avoids dairy.'"
        }
      ],
      preListening: "Ask students what information restaurants need for a reservation.",
      postListening: "Students create a reservation dialogue with one special request."
    },
    vocabulary: {
      title: "Transit & Movement Definitions",
      difficulty: "B1+",
      type: "collocation",
      items: [
        { phrase: "commute", definition: "travel regularly between home and work", example: "My daily commute takes thirty minutes." },
        { phrase: "delay", definition: "a situation when something happens later than planned", example: "There is a severe delay on the trains." },
        { phrase: "route", definition: "the way from one place to another", example: "This is the fastest route to the harbor." },
        { phrase: "gate", definition: "the area where passengers board a plane", example: "Please arrive at gate 18 thirty minutes before." },
        { phrase: "connection", definition: "a second bus, train, or flight to continue a journey", example: "We nearly missed our train connection." },
        { phrase: "traffic", definition: "vehicles moving on public roads", example: "Heavy morning traffic delayed the taxi." },
        { phrase: "cancel", definition: "to decide that a planned event will not happen", example: "They had to cancel the outdoor tour due to rain." },
        { phrase: "refund", definition: "money returned to a customer", example: "The agency provided a full refund for the ticket." }
      ],
      matchingGame: [
        { phrase: "commute", definition: "travel regularly between home and work" },
        { phrase: "delay", definition: "something happens later than planned" },
        { phrase: "route", definition: "the path or way between places" },
        { phrase: "gate", definition: "the boarding area for a plane" },
        { phrase: "connection", definition: "second transit vehicle to continue" },
        { phrase: "traffic", definition: "vehicles on roads" },
        { phrase: "cancel", definition: "decide an event will not happen" },
        { phrase: "refund", definition: "money returned to a customer" }
      ],
      teachingNote: "Focus on collocations related to transportation: 'heavy traffic', 'miss a connection'."
    },
    grammar: {
      title: "Present Perfect for Experiences",
      difficulty: "B1-B2",
      focus: "Life and travel experiences",
      examples: [
        "I have stayed in many hostels.",
        "She has never tried a digital detox."
      ],
      questions: [
        {
          id: 1,
          sentence: "I ___ never ___ a wellness retreat.",
          verb: "try",
          options: ["have / tried", "has / tried", "did / try", "am / trying"],
          correctAnswer: 0,
          explanation: "Present perfect utilizes 'subject + have/has + past participle' for life experiences."
        },
        {
          id: 2,
          sentence: "She ___ already ___ the hotel rooms.",
          verb: "book",
          options: ["has / booked", "have / booked", "did / book", "is / booking"],
          correctAnswer: 0,
          explanation: "'She' requires 'has', plus the past participle form."
        },
        {
          id: 3,
          sentence: "We ___ visited this market before.",
          verb: "not",
          options: ["have not", "has not", "did not", "never"],
          correctAnswer: 0,
          explanation: "'We' takes the helper verb 'have' negative: 'have not'."
        },
        {
          id: 4,
          sentence: "Have you ever ___ a connecting flight?",
          verb: "miss",
          options: ["missed", "miss", "missing", "misses"],
          correctAnswer: 0,
          explanation: "Use past participle 'missed' in the yes/no experience question."
        },
        {
          id: 5,
          sentence: "They ___ just ___ from their long trip.",
          verb: "return",
          options: ["have / returned", "has / returned", "re-turned", "returned"],
          correctAnswer: 0,
          explanation: "'They have just + past participle' is used to express recent events."
        }
      ]
    },
    speaking: {
      title: "Develop a Balanced Weekend Plan",
      difficulty: "B1+",
      mode: "presentation",
      setup: "Students create a balanced weekend including rest, chores, social time, and exercise.",
      timing: "Preparation: 3 minutes. Speaking: 90 seconds.",
      instructions: "Present your weekend plan and explain why it is balanced.",
      followUp: [
        "What would you remove if you became too busy?",
        "Do you prefer planned or spontaneous weekends?"
      ],
      targetLanguage: [
        "First, I'm going to...",
        "This helps me because...",
        "I would avoid...",
        "A good balance includes..."
      ],
      teachingNote: "Connect to future forms and lifestyle vocabulary."
    },
    writing: {
      title: "Travel Itinerary Draft",
      difficulty: "B1+",
      genre: "itinerary",
      wordCount: "80-120 words",
      prompt: "Create a one-day itinerary for a visitor who wants a relaxing lifestyle experience in your city. Include morning, afternoon, and evening activities.",
      criteria: [
        "Use appropriate time expressions",
        "Use future forms cleanly",
        "Include practical details (places, times)"
      ],
      teachingNote: "Useful for platform submissions with structured format."
    }
  },
  {
    id: 4,
    title: "Unit 4: Airport Announcements",
    theme: "Airport Wellness & Delays",
    difficulty: "B1+ CEFR",
    reading: {
      title: "Airport Wellness Announcement",
      difficulty: "B1+",
      focus: "scanning, specific information",
      text: "Attention passengers. During today's delays, the airport is offering free access to the Quiet Zone on Level 2, near Gate 18. This area includes comfortable seats, charging points, and low lighting. Passengers can also join a ten-minute stretching session at 3:00 p.m. and 5:00 p.m. near the information desk. Please remember that food is not allowed inside the Quiet Zone, but bottled water is permitted. Families with small children may prefer the play area opposite Gate 12.",
      questions: [
        {
          id: 1,
          question: "Why is the airport offering the Quiet Zone?",
          options: [
            "Because there are delays",
            "Because flights are canceled forever",
            "Because restaurants are closed",
            "Because Gate 12 is full"
          ],
          correctAnswer: 0,
          explanation: "The text starts: 'During today's delays, the airport is offering free access...'"
        },
        {
          id: 2,
          question: "Where is the Quiet Zone located?",
          options: [
            "Level 1, Gate 12",
            "Level 2, near Gate 18",
            "Opposite the café",
            "Near baggage claim"
          ],
          correctAnswer: 1,
          explanation: "The flyer notes: 'free access to the Quiet Zone on Level 2, near Gate 18.'"
        },
        {
          id: 3,
          question: "Passengers can take bottled water into the Quiet Zone.",
          options: ["True", "False"],
          correctAnswer: 0,
          explanation: "The text specifies: 'but bottled water is permitted.'"
        },
        {
          id: 4,
          question: "What may families with small children prefer?",
          options: [
            "The play area opposite Gate 12",
            "The stretching session",
            "The information desk",
            "The charging points"
          ],
          correctAnswer: 0,
          explanation: "The final line notes: 'Families with small children may prefer the play area opposite Gate 12.'"
        }
      ],
      teachingNote: "Practice fast scanning: give students 60 seconds to find times and places."
    },
    listening: {
      title: "Airport Announcement about Delays",
      difficulty: "B1-B2",
      type: "Announcement",
      script: [
        { id: 1, speaker: "Announcer", text: "Attention passengers traveling on Flight 482 to Lisbon. Due to strong winds, boarding will begin approximately forty minutes later than planned." },
        { id: 2, speaker: "Announcer", text: "Please remain near Gate 16 and check the screens for updates." },
        { id: 3, speaker: "Announcer", text: "Passengers who need assistance should speak to a member of staff at the service desk." },
        { id: 4, speaker: "Announcer", text: "The airport lounge is currently full, but free water is available near the gate." },
        { id: 5, speaker: "Announcer", text: "If you have a connecting flight, please do not leave the area." },
        { id: 6, speaker: "Announcer", text: "Our team will provide updated information as soon as possible. We apologize for the delay and thank you for your patience." }
      ],
      questions: [
        {
          id: 1,
          question: "What caused the delayed boarding?",
          options: ["Heavy rain", "Strong winds", "Mechanical failure", "Staff strike"],
          correctAnswer: 1,
          explanation: "The announcement states: 'Due to strong winds, boarding will begin...'"
        },
        {
          id: 2,
          question: "How long is the boarding delay?",
          options: ["Directly canceled", "Twenty minutes later", "Forty minutes later", "Two hours later"],
          correctAnswer: 2,
          explanation: "The boarding will start 'approximately forty minutes later than planned.'"
        },
        {
          id: 3,
          question: "What should passengers with connecting flights do?",
          options: [
            "Leave the gate immediately",
            "Speak to local security",
            "Do not leave the area",
            "Book a hotel room"
          ],
          correctAnswer: 2,
          explanation: "He advises: 'If you have a connecting flight, please do not leave the area.'"
        }
      ],
      preListening: "Students list common airport announcement words.",
      postListening: "Students write one short airport announcement."
    },
    vocabulary: {
      title: "Wellness Activities Vocabulary",
      difficulty: "B1-B2",
      type: "fill_in_the_blank",
      items: [
        { phrase: "stretching", definition: "moving muscles gently to make them less tight", example: "Doing 10 minutes of stretching relieves soreness." },
        { phrase: "guided walk", definition: "a walk led by someone who explains features of the place", example: "We joined a guided walk in the national park." },
        { phrase: "retreat", definition: "a quiet place or event for rest, healing, or personal development", example: "They booked a yoga and diet retreat." },
        { phrase: "stress management", definition: "techniques used to control personal stress levels", example: "The class focused on mindful breathing for stress management." },
        { phrase: "sleep habits", definition: "behaviors related to sleeping patterns and preparing for bed", example: "Better sleep habits include putting screens away." },
        { phrase: "energy", definition: "the strength and vigor required for physical or mental action", example: "Waking up early gives her high cognitive energy." },
        { phrase: "routine", definition: "a sequence of actions regularly followed", example: "A morning routine gives you control." },
        { phrase: "relaxation", definition: "the state of being free from tension or anxiety", example: "Reading a book brings pure relaxation." }
      ],
      matchingGame: [
        { phrase: "stretching", definition: "moving muscles to make them less tight" },
        { phrase: "guided walk", definition: "a walk led by an expert explaining context" },
        { phrase: "retreat", definition: "a quiet place for rest or development" },
        { phrase: "stress management", definition: "ways/techniques to control stress levels" },
        { phrase: "sleep habits", definition: "behaviors related to sleep patterns" },
        { phrase: "energy", definition: "strength required for physical action" },
        { phrase: "routine", definition: "regularly followed sequence of actions" },
        { phrase: "relaxation", definition: "the state of being free from tension" }
      ],
      teachingNote: "Encourage students to group words by 'mental' vs 'physical' wellness categories."
    },
    grammar: {
      title: "Future Forms",
      difficulty: "B1-B2",
      focus: "Plans, predictions, and arrangements",
      examples: [
        "I'm going to visit the market. (plan)",
        "I'll call the hotel now. (immediate decision)"
      ],
      questions: [
        {
          id: 1,
          sentence: "We ___ stay near the beach next month.",
          verb: "plan",
          options: ["are going to", "will", "stays", "stayed"],
          correctAnswer: 0,
          explanation: "Use 'be going to' to specify pre-planned future intentions."
        },
        {
          id: 2,
          sentence: "I think the café ___ be crowded at lunch.",
          verb: "predict",
          options: ["will", "is going", "being", "is"],
          correctAnswer: 0,
          explanation: "Use 'will' for predictions based on general thoughts or beliefs (indicated by 'I think')."
        },
        {
          id: 3,
          sentence: "The train is late, so I ___ take a taxi instead.",
          verb: "decision",
          options: ["will", "am going to", "taking", "was"],
          correctAnswer: 0,
          explanation: "Use 'will' for immediate spontaneous decision made at the moment of speaking."
        },
        {
          id: 4,
          sentence: "She ___ meeting the tour guide at 9 a.m.",
          verb: "arrange",
          options: ["is", "will", "going to", "does"],
          correctAnswer: 0,
          explanation: "Present continuous 'is meeting' denotes pre-arranged fixed appointments."
        },
        {
          id: 5,
          sentence: "They ___ probably enjoy the relaxation seminar.",
          verb: "predict",
          options: ["will", "are", "going to", "not"],
          correctAnswer: 0,
          explanation: "'Probably' is positioned after 'will' to state a likely future prediction."
        }
      ]
    },
    speaking: {
      title: "Collaboratively Solve a Travel Problem",
      difficulty: "B1-B2",
      mode: "pair work",
      setup: "Students receive a problem card: canceled train, lost booking, noisy room, or closed restaurant.",
      timing: "Preparation: 2 minutes. Role-play: 4 minutes.",
      instructions: "Discuss the problem, suggest two solutions, choose the best one, and explain your decision.",
      followUp: [
        "What is more important: saving time or saving money?",
        "How can people stay calm when travel plans change?"
      ],
      targetLanguage: [
        "We could...",
        "Another option is...",
        "The problem is that...",
        "I think the best solution is..."
      ],
      teachingNote: "Great for modals, negotiation, and decision-making."
    },
    writing: {
      title: "Formal Email: Booking Problem",
      difficulty: "B1-B2",
      genre: "formal email",
      wordCount: "120-160 words",
      prompt: "You stayed at a hotel, but your room was noisy and the Wi-Fi did not work well. Write a formal email to the hotel manager explaining the problem and requesting a solution.",
      criteria: [
        "Use polite formal language structures",
        "Explain the problem clearly with consequences",
        "Request a reasonable resolution"
      ],
      teachingNote: "Practice complaint structure: context → problem → impact → request."
    }
  },
  {
    id: 5,
    title: "Unit 5: Menus & Wellness Lifestyles",
    theme: "Nutrition & Holiday Choices",
    difficulty: "B1-B2 CEFR",
    reading: {
      title: "A Smart Lunch Menu",
      difficulty: "B1-B2",
      focus: "scanning, comparison",
      text: "Green Plate Café offers three lunch sets from Monday to Friday. The Energy Bowl includes brown rice, grilled chicken, avocado, and vegetables. The Garden Plate is vegetarian and comes with lentils, roasted carrots, salad, and yogurt sauce. The Quick Soup Set includes vegetable soup, whole-grain bread, and a small fruit cup. Customers who bring a reusable cup receive a discount on coffee or tea. The café is busiest between 12:30 and 1:15, so visitors who want a quieter lunch should arrive before noon or after 1:30.",
      questions: [
        {
          id: 1,
          question: "Which lunch key option is fully vegetarian?",
          options: ["Energy Bowl", "Garden Plate", "Quick Soup Set", "Coffee discount"],
          correctAnswer: 1,
          explanation: "The text notes: 'The Garden Plate is vegetarian and comes with lentils...'"
        },
        {
          id: 2,
          question: "Customers can get a discount if they bring a reusable cup.",
          options: ["True", "False"],
          correctAnswer: 0,
          explanation: "The menu specifies: 'Customers who bring a reusable cup receive a discount...'"
        },
        {
          id: 3,
          question: "What block of time is quietest for lunch?",
          options: ["12:45 p.m.", "1:00 p.m.", "Before noon or after 1:30", "12:30 p.m."],
          correctAnswer: 2,
          explanation: "The cafe is busiest 12:30-1:15. For quiet, arrive before noon or after 1:30."
        },
        {
          id: 4,
          question: "What comes as part of the Quick Soup Set?",
          options: [
            "Rice and chicken",
            "Whole-grain bread and a small fruit cup",
            "Avocado and salad",
            "Carrots and tea"
          ],
          correctAnswer: 1,
          explanation: "The Quick Soup Set includes: 'vegetable soup, whole-grain bread, and a small fruit cup.'"
        }
      ],
      teachingNote: "Useful for food vocabulary and making lifestyle recommendations."
    },
    listening: {
      title: "Travel Agent and Wellness Holiday",
      difficulty: "B1-B2",
      type: "Conversation",
      script: [
        { id: 1, speaker: "Agent", text: "So, what kind of holiday are you looking for?" },
        { id: 2, speaker: "Customer", text: "I want to relax, but I don't want to just sit by a pool all day." },
        { id: 3, speaker: "Agent", text: "In that case, a wellness holiday might suit you. There's a place by the lake with yoga classes, short hikes, and healthy cooking workshops." },
        { id: 4, speaker: "Customer", text: "That sounds interesting. Is it suitable for beginners?" },
        { id: 5, speaker: "Agent", text: "Definitely. The activities are gentle, and guests can choose what they want to join." },
        { id: 6, speaker: "Customer", text: "I like that. I also need reliable internet because I may have to check work emails." },
        { id: 7, speaker: "Agent", text: "The rooms have Wi-Fi, but the program encourages guests to limit screen time." }
      ],
      questions: [
        {
          id: 1,
          question: "What type of holiday does the agent suggest?",
          options: ["Cruise", "A wellness holiday", "Party weekend", "Backpacking expedition"],
          correctAnswer: 1,
          explanation: "The agent explicitly recommends a 'wellness holiday.'"
        },
        {
          id: 2,
          question: "What activities are offered at the lakeside site?",
          options: [
            "Yoga classes, short hikes, and healthy cooking workshops",
            "Surfing, diving, kayaking",
            "Historical museum walks and painting",
            "Tennis camps and bar parties"
          ],
          correctAnswer: 0,
          explanation: "The agent lists: 'yoga classes, short hikes, and healthy cooking workshops.'"
        },
        {
          id: 3,
          question: "Why does the customer require internet access?",
          options: [
            "To stream music",
            "To check work emails",
            "To download books",
            "To video call family"
          ],
          correctAnswer: 1,
          explanation: "The customer explains: 'I also need reliable internet because I may have to check work emails.'"
        }
      ],
      preListening: "Discuss: What makes a holiday relaxing but active?",
      postListening: "Students recommend a holiday for a busy professional."
    },
    vocabulary: {
      title: "Technology & Daily Habits",
      difficulty: "B1-B2",
      type: "word_family",
      items: [
        { phrase: "notification", definition: "a message or alert from an app on your smartphone", example: "I disabled every social app notification." },
        { phrase: "screen time", definition: "the amount of time spent looking at digital devices", example: "We recorded three hours of screen time." },
        { phrase: "device", definition: "an electronic tool like a phone, tablet, or calculator", example: "Keep your digital device out of the bedroom." },
        { phrase: "offline", definition: "not connected to the internet", example: "It is peaceful to spend Sunday offline." },
        { phrase: "app", definition: "abbreviation for application software", example: "She downloaded a meditation app." },
        { phrase: "digital detox", definition: "a set period where a person avoids electronic devices", example: "A weekend digital detox refreshed his focus." },
        { phrase: "message", definition: "a written or oral communication sent digitally", example: "He sent a quick voice message." },
        { phrase: "settings", definition: "the control adjustments on a phone or program", example: "Adjust active settings to do not disturb." }
      ],
      matchingGame: [
        { phrase: "notification", definition: "a digital alert or message from an app" },
        { phrase: "screen time", definition: "time spent looking at digital displays" },
        { phrase: "device", definition: "an electronic tool e.g., smartphone" },
        { phrase: "offline", definition: "not connected to the internet" },
        { phrase: "app", definition: "mobile application software" },
        { phrase: "digital detox", definition: "period spent using technology less" },
        { phrase: "message", definition: "communication sent electronically" },
        { phrase: "settings", definition: "options controlling a device setup" }
      ],
      teachingNote: "Have students discuss their personal screen time limits."
    },
    grammar: {
      title: "Modals for Advice and Suggestions",
      difficulty: "B1-B2",
      focus: "Lifestyle and habits recommendations",
      examples: [
        "You should drink more water.",
        "You could try walking after work."
      ],
      questions: [
        {
          id: 1,
          sentence: "You ___ book early because the hotel is very popular.",
          verb: "advice",
          options: ["should", "could", "mustn't", "would"],
          correctAnswer: 0,
          explanation: "Use 'should' for strong friendly advice or recommendations."
        },
        {
          id: 2,
          sentence: "You ___ try a digital detox if notifications stress you.",
          verb: "suggestion",
          options: ["could", "mustn't", "shouldn't", "must"],
          correctAnswer: 0,
          explanation: "Use 'could' to make gentle, non-authoritative suggestions."
        },
        {
          id: 3,
          sentence: "You ___ eat in the Quiet Zone; it is not permitted.",
          verb: "obligation",
          options: ["mustn't / can't", "could", "should", "might"],
          correctAnswer: 0,
          explanation: "'Mustn't' or 'can't' is correct for prohibition (actions not allowed)."
        },
        {
          id: 4,
          sentence: "We ___ take the bus, but a taxi is much faster.",
          verb: "possibility",
          options: ["could", "shouldn't", "must", "haven't"],
          correctAnswer: 0,
          explanation: "Use 'could' to list one possible option among alternatives."
        },
        {
          id: 5,
          sentence: "You ___ talk to reception if your room is too noisy.",
          verb: "advice",
          options: ["should", "mustn't", "couldn't", "aren't"],
          correctAnswer: 0,
          explanation: "'Should' is appropriate to state the best course of action."
        }
      ]
    },
    speaking: {
      title: "Express Opinion: Weekly Digital Detox",
      difficulty: "B2-",
      mode: "individual",
      setup: "Students respond to an opinion prompt.",
      timing: "Preparation: 30 seconds. Speaking: 90 seconds.",
      instructions: "Do you think people should spend one day a week without social media? Give reasons and examples.",
      followUp: [
        "Would this be realistic for students or workers?",
        "What are the disadvantages of being offline?"
      ],
      targetLanguage: [
        "In my opinion...",
        "One reason is that...",
        "On the other hand...",
        "For example..."
      ],
      teachingNote: "Train Statement → Reason → Support."
    },
    writing: {
      title: "Blog Post: Digital Detox Experience",
      difficulty: "B2-",
      genre: "blog post",
      wordCount: "150-200 words",
      prompt: "Write a blog post about spending a weekend with limited phone use. Explain what you did, how you felt, and whether you would recommend it.",
      criteria: [
        "Use engaging narrative language",
        "Reflect clearly on feelings and thoughts",
        "Conclude with a specific recommendation"
      ],
      teachingNote: "Encourage linking words: 'at first', 'later', 'by the end'."
    }
  }
];
