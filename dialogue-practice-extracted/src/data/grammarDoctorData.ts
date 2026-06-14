export interface GrammarDoctorChallenge {
  id: number;
  unitId: number;
  focus: string; // e.g., "State Verbs vs Dynamic Verbs"
  symptom: string; // The incorrect sentence
  highlightedBug: string; // The specific wrong part
  errorType: string; // e.g., "Incorrect Progressive Aspect"
  diagnosticExplanation: string; // High-level why it is wrong
  remedyOptions: {
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  linguisticRule: string; // The deep dive rule
}

export const GRAMMAR_DOCTOR_DATA: GrammarDoctorChallenge[] = [
  {
    id: 1,
    unitId: 1,
    focus: "Present Simple vs Present Continuous",
    symptom: "I am usually having breakfast at my hotel, but this week I eat in local cafés.",
    highlightedBug: "am usually having ... eat",
    errorType: "Aspect Confusion (Habitual vs. Temporary)",
    diagnosticExplanation: "Habitual routines ('usually') require the Present Simple, while temporary situations running around now ('this week') require the Present Continuous.",
    remedyOptions: [
      {
        text: "I usually have breakfast at my hotel, but this week I am eating in local cafés.",
        isCorrect: true,
        explanation: "Perfect! 'I usually have' correctly denotes habit, and 'I am eating' describes a temporary event."
      },
      {
        text: "I am usually having breakfast at my hotel, but this week I am eating in local cafés.",
        isCorrect: false,
        explanation: "Incorrect. The first verb still uses the progressive aspect for a habitual routine."
      },
      {
        text: "I usually have breakfast at my hotel, but this week I eat in local cafés.",
        isCorrect: false,
        explanation: "Incorrect. The second verb uses the Present Simple for a temporary event indicating 'this week'."
      }
    ],
    linguisticRule: "Do not confuse state/habits with temporary actions. Adverbs of frequency (usually, often, always) trigger Present Simple. Limited duration markers (this week, currently, today) trigger Present Continuous."
  },
  {
    id: 2,
    unitId: 2,
    focus: "Past Simple vs Past Continuous",
    symptom: "While I walked down the street yesterday, it was starting to rain heavily.",
    highlightedBug: "walked ... was starting",
    errorType: "Tense Aspect Swap",
    diagnosticExplanation: "Long continuous background actions ('walking') require the Past Continuous, while sudden, short completed actions that interrupt them require the Past Simple.",
    remedyOptions: [
      {
        text: "While I was walking down the street yesterday, it was starting to rain heavily.",
        isCorrect: false,
        explanation: "Incorrect. Both tenses are now continuous, which makes the sudden rain sound like a background state rather than an interruptive event."
      },
      {
        text: "While I walked down the street yesterday, it started to rain heavily.",
        isCorrect: false,
        explanation: "Incorrect. Using simple past for both lacks relative depth, failing to contextualize the continuous backdrop of your walk."
      },
      {
        text: "While I was walking down the street yesterday, it started to rain heavily.",
        isCorrect: true,
        explanation: "Excellent! 'Was walking' establishes the active background scene, and 'started' registers the sudden past interruption."
      }
    ],
    linguisticRule: "Use Past Continuous (was/were + -ing) for background activities that were in progress. Use Past Simple for the sudden events that broke into or interrupted that backdrop."
  },
  {
    id: 3,
    unitId: 3,
    focus: "Irregular and Double Comparatives",
    symptom: "Taking the train is much more faster than flying, but it is also more expensiver.",
    highlightedBug: "more faster ... more expensiver",
    errorType: "Double Comparative Suffixing",
    diagnosticExplanation: "Short adjective comparatives (fast ➔ faster) should never be preceded by 'more'. Long adjectives (expensive) should use 'more' but never receive the '-er' suffix.",
    remedyOptions: [
      {
        text: "Taking the train is much faster than flying, but it is also more expensive.",
        isCorrect: true,
        explanation: "Flawless! 'Faster' is a single-syllable comparative adjective, and 'more expensive' is correct for a three-syllable adjective."
      },
      {
        text: "Taking the train is much more fast than flying, but it is also expensiver.",
        isCorrect: false,
        explanation: "Incorrect. 'More fast' is structurally weak and 'expensiver' is grammatically non-existent."
      },
      {
        text: "Taking the train is much faster than flying, but it is also expensivist.",
        isCorrect: false,
        explanation: "Incorrect. 'Expensivist' is a made-up superlative form rather than a comparative term."
      }
    ],
    linguisticRule: "1-syllable adjectives take '-er' (smaller, faster). 3+ syllable adjectives take 'more' (more comfortable, more expensive). Never combine both on a single word."
  },
  {
    id: 4,
    unitId: 4,
    focus: "Modals of Prohibitions and Obligations",
    symptom: "You don't have to park here; there is a strict 'No Parking' sign and you will get a fine.",
    highlightedBug: "don't have to",
    errorType: "Incorrect Modal Selection",
    diagnosticExplanation: "'Don't have to' means there is no obligation (it is optional), whereas 'must not' is mandatory prohibition (forbidden by law or strict rules).",
    remedyOptions: [
      {
        text: "You shouldn't have to park here; there is a strict 'No Parking' sign.",
        isCorrect: false,
        explanation: "Incorrect. 'Shouldn't have to' is advice regarding personal obligation rather than an absolute ban."
      },
      {
        text: "You must not park here; there is a strict 'No Parking' sign and you will get a fine.",
        isCorrect: true,
        explanation: "Exactly! 'Must not' expresses strong, legally enforced prohibition. To park here is forbidden."
      },
      {
        text: "You needn't park here; there is a strict 'No Parking' sign and you will get a fine.",
        isCorrect: false,
        explanation: "Incorrect. 'Needn't' means lack of necessity, which means you are still technically allowed to if you wish."
      }
    ],
    linguisticRule: "Use 'must not / mustn't' to signal strict rules, laws, and things that are completely forbidden. Use 'don't have to / needn't' when an action is optional or unnecessary."
  },
  {
    id: 5,
    unitId: 5,
    focus: "Present Perfect vs Past Simple",
    symptom: "I have lived in this apartment since three years, and I key-unlocked the door yesterday.",
    highlightedBug: "since three years",
    errorType: "Prepositional Timeline Drift",
    diagnosticExplanation: "'Since' denotes a specific starting point in the past (e.g., since 2023), whereas 'for' is used to measure a duration or length of time (e.g., for three years).",
    remedyOptions: [
      {
        text: "I have lived in this apartment since yesterday, and I have key-unlocked the door.",
        isCorrect: false,
        explanation: "Incorrect. While grammatically correct in isolation, this changes the timeline of 'yesterday' into a present-result aspect."
      },
      {
        text: "I live in this apartment for three years, and I key-unlocked the door yesterday.",
        isCorrect: false,
        explanation: "Incorrect. Simple present 'live' cannot capture an ongoing action spanning three years to the present."
      },
      {
        text: "I have lived in this apartment for three years, and I unlocked the door yesterday.",
        isCorrect: true,
        explanation: "Superb! Use 'for' for duration (three years) with Present Perfect, and past simple for the simple action ('unlocked') yesterday."
      }
    ],
    linguisticRule: "Specify duration using 'for' + length of time (for 5 days, for 3 years). Specify starting boundaries with 'since' + point in time (since Monday, since 2018)."
  },
  {
    id: 6,
    unitId: 6,
    focus: "Second Conditionals",
    symptom: "If I have more leisure time, I would cycle around the national park every single day.",
    highlightedBug: "have ... would cycle",
    errorType: "Mixed Conditional Chaos",
    diagnosticExplanation: "A hypothetical, imaginary present situation (indicated by 'would cycle') requires the Second Conditional structure: 'If' + Past Simple, followed by 'would' + Verb Infinitive.",
    remedyOptions: [
      {
        text: "If I will have more leisure time, I would cycle around the national park.",
        isCorrect: false,
        explanation: "Incorrect. In English, you never place 'will' directly in the conditional 'if' clause."
      },
      {
        text: "If I had more leisure time, I would cycle around the national park every single day.",
        isCorrect: true,
        explanation: "Outstanding! Second conditional uses simple past 'had' inside the 'if' clause to express a speculative present premise."
      },
      {
        text: "If I had more leisure time, I will cycle around the national park.",
        isCorrect: false,
        explanation: "Incorrect. Blends past conditional premise ('had') with futuristic certain result ('will')."
      }
    ],
    linguisticRule: "Form the Second Conditional with: If + Past Simple ➔ would + Base Verb. This frames current hypothetical or counterfactual setups in standard CEFR."
  },
  {
    id: 7,
    unitId: 7,
    focus: "Passive Voice Structure",
    symptom: "The traditional Italian dish was prepare beautifully by the chef during the vernissage.",
    highlightedBug: "was prepare",
    errorType: "Missing Past Participle",
    diagnosticExplanation: "Passive sentences are formed using 'be' + Past Participle. 'Prepare' must be conjugated to its participial form 'prepared'.",
    remedyOptions: [
      {
        text: "The traditional Italian dish went prepared beautifully by the chef.",
        isCorrect: false,
        explanation: "Incorrect. Avoid replacing 'be' with auxiliary 'go' in standard, formal academic translations."
      },
      {
        text: "The traditional Italian dish was preparing beautifully by the chef.",
        isCorrect: false,
        explanation: "Incorrect. The progressive participle 'preparing' implies the dish was actively doing the preparation itself."
      },
      {
        text: "The traditional Italian dish was prepared beautifully by the chef during the vernissage.",
        isCorrect: true,
        explanation: "Excellent! 'Was' (past tense of be) + 'prepared' (past participle) represents passive voice correctly."
      }
    ],
    linguisticRule: "Form passive voice via: Object + [Conjugated Be] + Past Participle (V3). Ensure the participle agrees, e.g. was taken, were built, is known."
  },
  {
    id: 8,
    unitId: 8,
    focus: "Gerunds vs Infinitives",
    symptom: "She decided planning an upgrade, but she completely forgot calling the reception.",
    highlightedBug: "planning ... calling",
    errorType: "Verb Complement Mismatch",
    diagnosticExplanation: "The verb 'decide' is only followed by an infinitive (to plan). The verb 'forget' can take a gerund for memory, but for a task omission, it must be the infinitive (to call).",
    remedyOptions: [
      {
        text: "She decided to plan an upgrade, but she completely forgot calling the reception.",
        isCorrect: false,
        explanation: "Incorrect. 'Forgot calling' means she does not remember doing the call in her memory, which isn't the intended task omission."
      },
      {
        text: "She decided to plan an upgrade, but she completely forgot to call the reception.",
        isCorrect: true,
        explanation: "Outstanding choice! 'Decided to plan' and 'forgot to call' are grammatically precise for decisions and forgotten obligations."
      },
      {
        text: "She decided planning an upgrade, but she forgot to call the reception.",
        isCorrect: false,
        explanation: "Incorrect. The first verb complement 'decided planning' is still ungrammatical."
      }
    ],
    linguisticRule: "Certain verbs require an infinitive complement (decide, refuse, manage, promise). Others require a gerund (enjoy, avoid, practice, suggest)."
  },
  {
    id: 9,
    unitId: 9,
    focus: "Relative Clauses",
    symptom: "I met a tour guide which explained us the historical significance of the flora.",
    highlightedBug: "which ... explained us",
    errorType: "Relative Pronoun Discord",
    diagnosticExplanation: "For human subjects (tour guide), you must use relative pronouns 'who' or 'that'. 'Which' is strictly restricted to inanimate objects or non-human animals.",
    remedyOptions: [
      {
        text: "I met a tour guide who explained the historical significance of the flora to us.",
        isCorrect: true,
        explanation: "Perfect! 'Who' refers to the human guide, and 'explained... to us' is the correct dative object prepositional setup."
      },
      {
        text: "I met a tour guide which explained the historical significance of the flora to us.",
        isCorrect: false,
        explanation: "Incorrect. 'Which' is still used for the human guide."
      },
      {
        text: "I met a tour guide whose explained the historical significance of the flora.",
        isCorrect: false,
        explanation: "Incorrect. 'Whose' is a possessive relative pronoun (e.g., 'whose camera was lost'), which doesn't fit before the action verb here."
      }
    ],
    linguisticRule: "Use relative pronoun 'who' (or 'that') for people. Use 'which' (or 'that') for things and contexts. Use 'whose' for possessive links."
  },
  {
    id: 10,
    unitId: 10,
    focus: "Indirect Questions & Word Order",
    symptom: "Could you tell me where is the local modern art gallery located?",
    highlightedBug: "where is the local modern art gallery located",
    errorType: "Embedded Question Order",
    diagnosticExplanation: "When a question is embedded inside an introductory phrase like 'Could you tell me...', it must follow standard statement word order [Subject + Verb] rather than question word order [Verb + Subject].",
    remedyOptions: [
      {
        text: "Could you tell me where the local modern art gallery is located?",
        isCorrect: true,
        explanation: "Sublime! Subject ('the local modern art gallery') correctly precedes verb ('is') in this embedded statement layout."
      },
      {
        text: "Could you tell me where is located the local modern art gallery?",
        isCorrect: false,
        explanation: "Incorrect. This maintains verb-subject inversion ('is' before the gallery)."
      },
      {
        text: "Could you tell me where does locate the local modern art gallery?",
        isCorrect: false,
        explanation: "Incorrect. Relies on auxiliary 'does' which is forbidden in indirect question alignments."
      }
    ],
    linguisticRule: "Direct questions invert subject & verb (Where is it?). Embedded or indirect questions do not invert (Could you tell me where it is?). Never double-interrogate."
  }
];
