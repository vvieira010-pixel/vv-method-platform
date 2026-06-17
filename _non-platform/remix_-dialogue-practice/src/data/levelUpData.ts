export interface LevelUpSentence {
  id: number;
  unitId: number;
  b1Sentence: string;
  b2Goal: string;
  b1Critique: string;
  targetKeywords: { word: string; equivalent: string; reason: string }[];
  options: {
    text: string;
    level: 'B1' | 'B2 (Incorrect)' | 'B2 (Correct)';
    explanation: string;
  }[];
  correctOptionIndex: number;
  c1AdvancedAlternative: string;
  sentenceInversionHint: string;
}

export const LEVEL_UP_DATA: LevelUpSentence[] = [
  // UNIT 1: Accommodation & Arrival (Hotel Calm Check-In)
  {
    id: 1,
    unitId: 1,
    b1Sentence: "I want a quiet room because I have an important meeting tomorrow morning.",
    b2Goal: "Upgrade with formal request constructs, precise adjectives, and causal transitions.",
    b1Critique: "Uses basic demand phrasing ('I want'), generic adjectives ('important', 'quiet'), and standard conjunction ('because').",
    targetKeywords: [
      { word: "highly appreciate", equivalent: "want", reason: "Softens the direct demand into a professional guest request." },
      { word: "tranquil", equivalent: "quiet", reason: "A more sophisticated adjective indicating peaceful quietness." },
      { word: "given that", equivalent: "because", reason: "An advanced subordinate conjunction to introduce a known premise." }
    ],
    options: [
      { text: "I want a quiet room since I have a very important meeting tomorrow morning.", level: 'B1', explanation: "Too informal. Swapping 'because' for 'since' is a minor lift, but 'I want' and 'important' remain basic." },
      { text: "I would highly appreciate a tranquil room, given that I have an indispensable meeting scheduled for tomorrow morning.", level: 'B2 (Correct)', explanation: "Excellent! 'Highly appreciate' is polite, 'tranquil' elevates 'quiet', and 'given that' is an elegant causal transition." },
      { text: "I need a silent room tomorrow morning because my meeting is very important.", level: 'B2 (Incorrect)', explanation: "Awkward expression. 'I need' is still demanding and 'very important' is repetitive." }
    ],
    correctOptionIndex: 1,
    c1AdvancedAlternative: "Should it be feasible, I would highly appreciate being assigned a tranquil room, given that I am hosting an indispensable online summit early tomorrow morning.",
    sentenceInversionHint: "Try beginning with: 'Given that...' or 'Should it be feasible, I would highly appreciate...'"
  },
  {
    id: 2,
    unitId: 1,
    b1Sentence: "The hotel is nice, but it is too far from the city center.",
    b2Goal: "Use concessive structures ('although', 'albeit') and descriptive distance terms.",
    b1Critique: "Relies on the weak adjective 'nice', basic contrastive coordinating conjunction 'but', and simple adverb 'too far'.",
    targetKeywords: [
      { word: "pleasant", equivalent: "nice", reason: "Adds refinement and avoids the overused, generic adjective 'nice'." },
      { word: "albeit", equivalent: "but", reason: "A high-level B2/C1 conjunction meaning 'though' or 'even though'." },
      { word: "somewhat inconvenient", equivalent: "too far", reason: "Expresses dissatisfaction with professional restraint." }
    ],
    options: [
      { text: "The hotel is pleasant, albeit its distance from the city center is somewhat inconvenient.", level: 'B2 (Correct)', explanation: "Superb! Uses 'pleasant' to replace 'nice', the elegant conjunction 'albeit' for contrast, and a nuanced description of the distance." },
      { text: "The hotel is fine but it is located very far away from the town center.", level: 'B1', explanation: "Too elementary. 'Fine' and 'very far away' lack CEFR B2 textuur." },
      { text: "The hotel is nice but indeed far from the center where everything is.", level: 'B2 (Incorrect)', explanation: "A bit conversational and circular. Doesn't reach professional written or spoken standard." }
    ],
    correctOptionIndex: 0,
    c1AdvancedAlternative: "Although the establishment is undoubtedly pleasant, its geographic isolation from the metropolitan core is somewhat inconvenient for my schedule.",
    sentenceInversionHint: "Try beginning with: 'Although the establishment is...'"
  },

  // UNIT 2: Coffee Shop Orders & Custom Requests
  {
    id: 3,
    unitId: 2,
    b1Sentence: "Give me a coffee with oat milk and without sugar because I am on a diet.",
    b2Goal: "Use polite hedging triggers, professional verbs, and healthier lifestyle phrasing.",
    b1Critique: "The imperative 'Give me' is excessively blunt. 'On a diet' is colloquial; 'monitor intake' is more analytical.",
    targetKeywords: [
      { word: "Could I please request", equivalent: "Give me", reason: "Standard hospitable request framing." },
      { word: "exclude", equivalent: "without", reason: "Active professional verb instead of a simple preposition." },
      { word: "monitoring my sugar intake", equivalent: "on a diet", reason: "A polished, modern way to refer to dietary restrictions." }
    ],
    options: [
      { text: "Please give me oat milk coffee with no sugar because I am doing a diet.", level: 'B1', explanation: "Uses incorrect collocation ('doing a diet') and keeps the direct command 'Please give me'." },
      { text: "I'd like a coffee with oat milk and please exclude the sugar, as I am currently monitoring my sugar intake.", level: 'B2 (Correct)', explanation: "Terrific! Polite modal request combined with 'exclude' and 'monitoring sugar intake' sounds very professional." },
      { text: "Give me oat-milk coffee, no sugar because I must follow strict diet rules.", level: 'B2 (Incorrect)', explanation: "Too aggressive and jerky in pace. Lacks smooth English cohesion." }
    ],
    correctOptionIndex: 1,
    c1AdvancedAlternative: "Could I please request an oat-milk coffee with sugar completely excluded, as I am currently monitoring my glycemic intake?",
    sentenceInversionHint: "Try: 'As I am currently monitoring my intake, I would like to request...'"
  },
  {
    id: 4,
    unitId: 2,
    b1Sentence: "This café is always busy, so we should find another place to talk.",
    b2Goal: "Integrate continuous adverbs, replace 'place' with 'venue', and elevate 'talk'.",
    b1Critique: "Overuses basic 'always', simple 'busy' adjective, and highly repetitious nouns like 'place'.",
    targetKeywords: [
      { word: "consistently crowded", equivalent: "always busy", reason: "More precise description of patron frequency." },
      { word: "alternative venue", equivalent: "another place", reason: "Using formal business nouns instead of high-frequency words." },
      { word: "conduct our conversation", equivalent: "talk", reason: "Formally frames a discussion as a polite action." }
    ],
    options: [
      { text: "Because this cafe is very busy, we need to go to another spot to speak.", level: 'B1', explanation: "Simply swaps words for basic synonyms without improving sentence structure." },
      { text: "This cafe is consistently crowded, so it would be wiser to seek an alternative venue to conduct our conversation.", level: 'B2 (Correct)', explanation: "Excellent! 'Consistently crowded', 'alternative venue', and 'conduct our conversation' are premium lexical choices." },
      { text: "This coffee shop is full, hence we should find an outdoor location to talk together.", level: 'B2 (Incorrect)', explanation: "Though 'hence' is formal, the ending remains casual with 'find a location to talk together'." }
    ],
    correctOptionIndex: 1,
    c1AdvancedAlternative: "Given that this establishment is consistently crowded, it would be highly advisable to seek an alternative venue to conduct our discussion in peace.",
    sentenceInversionHint: "Begin with a participial or causal clause: 'Given that this establishment is consistently crowded...'"
  },

  // UNIT 3: Transit Hub Navigations (Travel & Directions)
  {
    id: 5,
    unitId: 3,
    b1Sentence: "If you miss the fast train, you will arrive very late for the conference.",
    b2Goal: "Utilize conditional inversions without 'if' ('should you'), and advanced adverbs.",
    b1Critique: "The first conditional with 'if' is standard B1. We can elevate formatting by making it a formal warning.",
    targetKeywords: [
      { word: "Should you miss", equivalent: "If you miss", reason: "An inversion that replaces 'if' with auxiliary auxiliary 'should' for high-level conditional stance." },
      { word: "express train", equivalent: "fast train", reason: "The correct transportation terminology." },
      { word: "risk arriving significantly late", equivalent: "will arrive very late", reason: "Softens certainty to a professional threat risk, while upgrading 'very late'." }
    ],
    options: [
      { text: "If you do not catch the speed train, you're going to be extremely late for the meeting.", level: 'B1', explanation: "Informal. Swaps with basic contraction ('you're') and wrong terminology ('speed train')." },
      { text: "Should you miss the express train, you risk arriving significantly late for the conference.", level: 'B2 (Correct)', explanation: "Masterful! Using inverted conditional ('Should you miss') is a signature of C1/Advanced fluency, paired with 'significantly'." },
      { text: "Missing the fast train means you are surely arriving late for the scientific conference.", level: 'B2 (Incorrect)', explanation: "Gerund start is better, but 'surely arriving late' lacks the academic tone of 'significantly late'." }
    ],
    correctOptionIndex: 1,
    c1AdvancedAlternative: "Should you fail to board the express train, you run the distinct risk of arriving significantly late for the conference opening.",
    sentenceInversionHint: "Ditch 'if' completely and search for 'Should you...'"
  },
  {
    id: 6,
    unitId: 3,
    b1Sentence: "I got lost in the subway because there are not many signs.",
    b2Goal: "Use passive verbs, replace 'lost' with 'disoriented', and nominalize 'there are not many signs'.",
    b1Critique: "Colloquial 'got lost' and basic cause transition 'because there are not many...'.",
    targetKeywords: [
      { word: "became disoriented", equivalent: "got lost", reason: "Scientific, precise alternative explaining disorientation." },
      { word: "due to a lack of", equivalent: "because there are not many", reason: "Prepositional nominalizer indicating systemic absence." },
      { word: "clear signage", equivalent: "signs", reason: "Professional structural collective noun for signs." }
    ],
    options: [
      { text: "I became disoriented in the subway terminal due to a lack of clear signage.", level: 'B2 (Correct)', explanation: "Fantastic! 'Became disoriented', 'due to a lack of' and 'signage' fit B2/C1 specifications." },
      { text: "I got lost inside the underground station because the signs are small and few.", level: 'B1', explanation: "Weak and repetitive. Still relies on basic 'got lost' and basic adjectives." },
      { text: "Having no indicators, I lost my way in the huge subway transport system.", level: 'B2 (Incorrect)', explanation: "Slightly poetic but less natural for an professional traveler overview." }
    ],
    correctOptionIndex: 0,
    c1AdvancedAlternative: "I became thoroughly disoriented within the subterranean hub, which I attribute primarily to an absolute dearth of legible signage.",
    sentenceInversionHint: "Try starting with: 'I attribute my disorientation in the subway to...'"
  },

  // UNIT 4: Office Workspace Meeting Prep (Career & Collaboration)
  {
    id: 7,
    unitId: 4,
    b1Sentence: "We need to talk about this problem before we start the project.",
    b2Goal: "Inject subjunctive structures ('it is crucial that we...'), and verbs like 'address' and 'initiate'.",
    b1Critique: "Uses high-frequency 'need to talk', basic collision noun 'problem', and basic start verbs.",
    targetKeywords: [
      { word: "crucial that we address", equivalent: "need to talk about", reason: "Subjunctive mandate for urgent focus." },
      { word: "issue", equivalent: "problem", reason: "A professional business alternative that sounds constructive." },
      { word: "prior to initiating", equivalent: "before we start", reason: "Formal replacement for basic chronological prepositions." }
    ],
    options: [
      { text: "We must speak of this bad thing before launching the project action.", level: 'B1', explanation: "Uses basic structures and awkward wording like 'bad thing' and 'project action'." },
      { text: "It is crucial that we address this issue prior to initiating the project.", level: 'B2 (Correct)', explanation: "Incredible! 'Crucial that we address' uses the subjunctive correctly. 'Prior to initiating' is flawless." },
      { text: "It is very important that we talk about this obstacle before writing the project plan.", level: 'B2 (Incorrect)', explanation: "'Very important' and 'talk about' are still quite intermediate." }
    ],
    correctOptionIndex: 1,
    c1AdvancedAlternative: "It is imperative that we thoroughly address this underlying issue prior to the official initiation of the project.",
    sentenceInversionHint: "Start with an assertive subjective adjective phrase: 'It is imperative that we...'"
  },

  // UNIT 5: Household Routines (Habits & Routine)
  {
    id: 8,
    unitId: 5,
    b1Sentence: "I clean my room every Saturday so that it looks good.",
    b2Goal: "Nominalize goals, swap 'clean' for 'tidy', and introduce 'aesthetic' or 'organized'.",
    b1Critique: "Elementary coordinate 'so that it looks good' and basic transitive verb 'clean'.",
    targetKeywords: [
      { word: "tidy", equivalent: "clean", reason: "Refers specifically to organization and tidiness." },
      { word: "maintain", equivalent: "so that it looks", reason: "Action verb representing ongoing state custody." },
      { word: "organized living space", equivalent: "looks good", reason: "Polished and descriptive compound noun." }
    ],
    options: [
      { text: "I tidy my room every Saturday to maintain a clean and organized living space.", level: 'B2 (Correct)', explanation: "Spot on! Relplaces 'clean... so that' with an elegant infinitive of purpose 'to maintain a clean and organized living space'." },
      { text: "I clean up my bedroom each Saturday so that my style is nice.", level: 'B1', explanation: "Still very juvenile. 'Nice style' doesn't match B2 parameters." },
      { text: "Every Saturday, I sweep my domestic room for having an eye-friendly apartment.", level: 'B2 (Incorrect)', explanation: "Awkward or over-embellished language ('domestic room', 'eye-friendly') that sounds unnatural." }
    ],
    correctOptionIndex: 0,
    c1AdvancedAlternative: "I dedicate Saturday mornings to tidying my quarters, a ritual aimed at maintaining an aesthetically pleasing and highly organized living space.",
    sentenceInversionHint: "Try ending your rewrite with: '...to maintain an organized living space.'"
  },

  // UNIT 6: City Cycling Tour & Habits (Interests)
  {
    id: 9,
    unitId: 6,
    b1Sentence: "I like cycling in the park because it helps me relax after work.",
    b2Goal: "Elevate preference indicators ('thoroughly enjoy'), and replace 'help me relax' with an outlet concept.",
    b1Critique: "Repeated basic preference verb 'like' and high-frequency 'helps me relax'.",
    targetKeywords: [
      { word: "thoroughly enjoy", equivalent: "like", reason: "Adds intensity and emotional nuance to verbs." },
      { word: "serves as an excellent outlet", equivalent: "helps me", reason: "A sophisticated idiom describing functional relief." },
      { word: "relieving post-work stress", equivalent: "relax after work", reason: "Professional psychological noun phrasing." }
    ],
    options: [
      { text: "I like riding bikes in the green park as it works for relaxing my brain after labor.", level: 'B1', explanation: "Awkward vocabulary choices ('relaxing my brain', 'after labor') and basic grammar are stored." },
      { text: "I thoroughly enjoy cycling in the park, as it serves as an excellent outlet for relieving post-work stress.", level: 'B2 (Correct)', explanation: "Brilliant! This structure is cohesive, uses advanced prepositions ('as it serves as'), and upgraded lexical items." },
      { text: "Riding a bike in the park is good for me because I can forget work problems.", level: 'B2 (Incorrect)', explanation: "Very colloquial. 'Forget work problems' lacks academic or professional polish." }
    ],
    correctOptionIndex: 1,
    c1AdvancedAlternative: "I thoroughly enjoy traversing the local park by bicycle, as this activity serves as a vital outlet for releasing accumulated post-work tension.",
    sentenceInversionHint: "Try incorporating: '...serves as an invaluable outlet for...'"
  },

  // UNIT 7: Culinary Arts & Grocery Shopping
  {
    id: 10,
    unitId: 7,
    b1Sentence: "This dish tastes nice because it has fresh herbs in it.",
    b2Goal: "Use sensory nouns ('flavor profile'), and explain cause using 'largely owing to'.",
    b1Critique: "Basic active verb 'tastes nice', generic pronoun 'it has', and lazy causal link 'because'.",
    targetKeywords: [
      { word: "exceptional flavor profile", equivalent: "tastes nice", reason: "Advanced gastronomic vocabulary characterizing food quality." },
      { word: "largely owing to", equivalent: "because it has", reason: "High-level prepositional synonym for 'due to' or 'because of'." },
      { word: "incorporation of", equivalent: "in it", reason: "Refined noun form of 'including' or 'having'." }
    ],
    options: [
      { text: "This dish has an exceptional flavor profile, largely owing to the incorporation of fresh herbs.", level: 'B2 (Correct)', explanation: "Correct! 'Exceptional flavor profile' is culinary, and 'largely owing to the incorporation...' shows mastery of complex structures." },
      { text: "This dish is tasting great because of the many fresh greens placed inside it.", level: 'B1', explanation: "Using continuous tense ('is tasting great') is structurally weak in this context, and 'greens inside it' is basic." },
      { text: "The meal has a delicious nature, thanks to the green plants mixed in.", level: 'B2 (Incorrect)', explanation: "'Delicious nature' and 'green plants mixed in' are clumsy conversions." }
    ],
    correctOptionIndex: 0,
    c1AdvancedAlternative: "This culinary creation boasts an exceptional flavor profile, attributable in large part to the deliberate incorporation of freshly harvested herbs.",
    sentenceInversionHint: "Try beginning with: 'The exceptional flavor profile of this dish is...'"
  },

  // UNIT 8: Technical Support Dialogue (Tech & Troubleshooting)
  {
    id: 11,
    unitId: 8,
    b1Sentence: "My computer is slow, and I don't know what to do.",
    b2Goal: "Upgrade tech performance terms, and use indirect questions with 'unsure how to resolve'.",
    b1Critique: "Vague adjective 'slow', coordination 'and', and raw distress 'I don't know what to do'.",
    targetKeywords: [
      { word: "significantly degraded", equivalent: "slow", reason: "Technical descriptor regarding system speed bottlenecks." },
      { word: "unsure how to resolve", equivalent: "don't know what to do", reason: "Professional, solution-oriented statement." },
      { word: "underlying issue", equivalent: "what is wrong", reason: "Diagnostic language for tech troubleshooting." }
    ],
    options: [
      { text: "My PC is working very badly and I cannot fix the error myself.", level: 'B1', explanation: "Informal, diagnostic-deficient and lacking professional nuance." },
      { text: "My computer's performance is significantly degraded, and I am unsure how to resolve the underlying issue.", level: 'B2 (Correct)', explanation: "Splendid! Uses possessive nominalization ('performance'), precise adjective ('significantly degraded'), and a polite indirect clause." },
      { text: "The operating speed is down, and I am lost about doing a repair.", level: 'B2 (Incorrect)', explanation: "Grammatically awkward. Tech support contexts expect 'performance' and 'resolve'." }
    ],
    correctOptionIndex: 1,
    c1AdvancedAlternative: "My workstation’s processing performance has witnessed a significant degradation, leaving me thoroughly perplexed as to how to remedy the technical bottleneck.",
    sentenceInversionHint: "Try: 'With my workstation's performance significantly degraded, I am...'"
  },

  // UNIT 9: Nature Preserve Guide
  {
    id: 12,
    unitId: 9,
    b1Sentence: "We must protect these plants so they don't die.",
    b2Goal: "Deploy passive modal duties ('it is vital to'), and swap 'plants don't die' for 'prevent extinction'.",
    b1Critique: "The mandate 'We must' is repetitive. 'Save plants so they don't die' is flat; 'conserve species' is ecological.",
    targetKeywords: [
      { word: "vital to conserve", equivalent: "must protect", reason: "Academic obligation adjective to emphasize preservation." },
      { word: "endangered species", equivalent: "plants", reason: "Crucial scientific biology jargon." },
      { word: "prevent their extinction", equivalent: "so they don't die", reason: "Refined biological conclusion clause." }
    ],
    options: [
      { text: "It is vital to conserve these endangered species to prevent their extinction.", level: 'B2 (Correct)', explanation: "Brilliant! Directly substitutes ecological concepts ('conserve', 'endangered species', 'extinction') to create an scientific thesis sentence." },
      { text: "We need to keep these green flora alive so that we avoid their deaths.", level: 'B1', explanation: "'Keep flora alive' and 'avoid their deaths' sound amateurish and unscientific." },
      { text: "Safeguarding these botanical items is necessary so they don't cease to exist.", level: 'B2 (Incorrect)', explanation: "Better, but the phrasing 'botanical items' and 'don't cease to exist' is slightly robotic." }
    ],
    correctOptionIndex: 0,
    c1AdvancedAlternative: "It is of paramount importance that we actively conserve these fragile floral species to mitigate the immediate risk of extinction.",
    sentenceInversionHint: "Start with high urgency: 'It is of paramount importance that we...'"
  },

  // UNIT 10: Art Gallery Vernissage (Culture)
  {
    id: 13,
    unitId: 10,
    b1Sentence: "I think this painting is beautiful and makes me feel happy.",
    b2Goal: "Abolish 'I think', swap 'beautiful' for 'exquisite', and use emotive transit verbs like 'evoking'.",
    b1Critique: "Overuses high-frequency filter 'I think', simple adjective 'beautiful', and basic 'makes me feel happy'.",
    targetKeywords: [
      { word: "truly exquisite", equivalent: "beautiful", reason: "Strong artistic adjective denoting flawless aesthetic craftsmanship." },
      { word: "evoking a profound sense", equivalent: "makes me feel", reason: "Action verb representing emotional invocation." },
      { word: "uplifted", equivalent: "happy", reason: "Specific positive emotional adjective." }
    ],
    options: [
      { text: "This artwork is truly exquisite, evoking a profound sense of joy and leaving me feeling utterly uplifted.", level: 'B2 (Correct)', explanation: "Masterpiece! Excludes 'I think', transforms 'beautiful' into 'exquisite', uses 'evoking a profound sense' and high-level mood descriptors.", },
      { text: "To my view, this painting is extremely pretty, giving me a happy energy.", level: 'B1', explanation: "Lacks critical vocabulary. 'Happy energy' and 'extremely pretty' are grammatically elementary." },
      { text: "I find that this visual canvas is gorgeous, which causes me to be happy.", level: 'B2 (Incorrect)', explanation: "The ending clause 'causes me to be happy' is clinical and unpolished." }
    ],
    correctOptionIndex: 0,
    c1AdvancedAlternative: "This striking canvas is demonstrably exquisite, evoking a profound sense of tranquility while engendering an uplifted state of mind.",
    sentenceInversionHint: "Refuse the urge to state 'I outline' or 'I believe'; start directly with the subject."
  }
];
