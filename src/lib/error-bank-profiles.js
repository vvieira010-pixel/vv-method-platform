/**
 * error-bank-profiles.js
 * Structured error bank profiles for individual students.
 * Each profile contains categorized error patterns, feedback templates,
 * and homework suggestions — used to seed the error bank and
 * enrich the AI diagnostic prompt with known student patterns.
 */

export const ANA_PAULA_PROFILE = {
  student_profile: {
    student_name: "Ana Paula Silva",
    target_exam: "MET",
    target_level: "B2+",
    professional_context: "Registered Nurse seeking English proficiency for nursing license reactivation in Massachusetts",
    main_needs: [
      "structured speaking under pressure",
      "writing support and evidence",
      "vocabulary upgrading",
      "contrast connectors",
      "time management",
      "confidence building"
    ]
  },
  error_categories: [
    {
      category_id: "grammar_articles",
      category_name: "Articles",
      skill_area: ["writing", "speaking"],
      priority: "medium",
      definition: "Errors with a, an, the, or zero article before nouns and professional roles.",
      common_error_patterns: [
        { error: "I work as nurse.", correction: "I work as a nurse.", explanation: "Use 'a/an' before singular countable jobs or roles." },
        { error: "I went to hospital.", correction: "I went to the hospital.", explanation: "Use 'the' when referring to a specific known place." }
      ],
      teacher_feedback_template: "You communicated the idea clearly, but you need to control article use before singular nouns and professional roles.",
      student_action: "Review each sentence and check if singular countable nouns need 'a', 'an', or 'the'.",
      suggested_homework: [
        "Write 10 sentences about your nursing work using job titles and workplace locations.",
        "Underline every singular noun and check if it needs an article."
      ]
    },
    {
      category_id: "grammar_tenses",
      category_name: "Verb Tense Accuracy",
      skill_area: ["writing", "speaking"],
      priority: "high",
      definition: "Errors with past simple, present perfect, and tense consistency when narrating experiences.",
      common_error_patterns: [
        { error: "I study for four months and I receive my license.", correction: "I studied for four months and received my license.", explanation: "Use past simple for completed events in the past." },
        { error: "It take four months.", correction: "It took four months.", explanation: "The past form of 'take' is 'took'." }
      ],
      teacher_feedback_template: "Your message is understandable, but tense consistency needs more control, especially when telling past experiences.",
      student_action: "Before answering, decide if the story is happening now, happened in the past, or connects past to present.",
      suggested_homework: [
        "Retell one personal story twice: first slowly, then again using only past simple verbs.",
        "Create a list of 15 common irregular verbs connected to work and study."
      ]
    },
    {
      category_id: "writing_support_evidence",
      category_name: "Support and Evidence",
      skill_area: ["writing", "speaking"],
      priority: "critical",
      definition: "Answers include an opinion and reason but do not include examples, evidence, or elaboration.",
      common_error_patterns: [
        { error: "I agree because it is important.", correction: "I agree because it improves communication. For example, in a hospital, clear communication helps nurses understand patients' needs and avoid mistakes.", explanation: "The corrected answer adds a specific example to support the reason." }
      ],
      teacher_feedback_template: "Your opinion is clear, and your reason is present. The missing part is support. Add one example, personal experience, or real-life situation.",
      student_action: "Use the structure: Opinion → Reason → Support.",
      suggested_homework: [
        "Answer 5 opinion questions using exactly 3 sentences: opinion, reason, support.",
        "Highlight the support sentence in every answer."
      ]
    },
    {
      category_id: "connectors_contrast",
      category_name: "Contrast Connectors",
      skill_area: ["writing", "speaking"],
      priority: "high",
      definition: "Limited or inaccurate use of contrast connectors such as however, although, even though, and on the other hand.",
      common_error_patterns: [
        { error: "I like studying English, although it helps my career.", correction: "I like studying English because it helps my career.", explanation: "'Although' shows contrast, not reason." },
        { error: "I want to speak more. Although, I feel nervous.", correction: "I want to speak more. However, I feel nervous.", explanation: "Use 'however' at the beginning of a new sentence to show contrast." }
      ],
      teacher_feedback_template: "You are using connectors, which is good. Now we need to choose the correct connector based on the relationship between the ideas.",
      student_action: "Memorize 4 contrast connectors and practice their sentence position.",
      suggested_homework: [
        "Write 8 contrast sentences using however, although, even though, and on the other hand.",
        "Rewrite 5 sentences replacing 'but' with a more formal connector."
      ]
    },
    {
      category_id: "vocabulary_leveling",
      category_name: "Vocabulary Leveling",
      skill_area: ["writing", "speaking"],
      priority: "high",
      definition: "Use of basic vocabulary when more precise B2-level words would improve the response.",
      common_error_patterns: [
        { basic_word: "happy", upgraded_options: ["glad", "pleased", "grateful", "satisfied"], example: "I felt grateful because my family supported me." },
        { basic_word: "good", upgraded_options: ["effective", "beneficial", "valuable", "reliable"], example: "This habit is beneficial because it improves patient communication." },
        { basic_word: "bad", upgraded_options: ["harmful", "negative", "challenging", "stressful"], example: "Poor communication can be harmful in a healthcare environment." }
      ],
      teacher_feedback_template: "Your vocabulary is clear, but some words are too basic for your target level. Let's upgrade simple words to more precise B2 options.",
      student_action: "Use Cambridge Dictionary to check the CEFR level of new words.",
      suggested_homework: [
        "Create a personal vocabulary upgrade list with 20 basic words and B2 alternatives.",
        "Rewrite one paragraph replacing at least 5 basic words with stronger alternatives."
      ]
    },
    {
      category_id: "speaking_pressure",
      category_name: "Speaking Under Pressure",
      skill_area: ["speaking"],
      priority: "critical",
      definition: "The student freezes or produces weaker language when answering timed speaking questions.",
      common_error_patterns: [
        { problem: "Long pauses before starting an answer", solution: "Use a starter phrase immediately, such as 'In my opinion...' or 'One experience I remember is...'" },
        { problem: "Answer becomes too short", solution: "Add one reason and one example before stopping." }
      ],
      teacher_feedback_template: "Your English is stronger than you think. The main issue is not knowledge; it is accessing your language under pressure.",
      student_action: "Start every answer with a simple structure instead of waiting for a perfect sentence.",
      suggested_homework: [
        "Practice 10 one-minute speaking answers using a timer.",
        "Record yourself answering the same question twice and compare the second version."
      ]
    },
    {
      category_id: "template_dependency",
      category_name: "Template Dependency",
      skill_area: ["writing", "speaking"],
      priority: "medium",
      definition: "Risk of memorizing fixed templates instead of internalizing flexible answer structures.",
      common_error_patterns: [
        { problem: "Student forgets part of a memorized answer", solution: "Use flexible sentence functions instead of full memorized scripts." }
      ],
      teacher_feedback_template: "The template is useful as training support, but the goal is to internalize the structure, not memorize a fixed script.",
      student_action: "Practice answering the same question with different vocabulary while keeping the same structure.",
      suggested_homework: [
        "Answer one question in three different ways using the same Opinion–Reason–Support structure.",
        "Create phrase banks for functions: giving an opinion, giving a reason, adding an example, and contrasting."
      ]
    },
    {
      category_id: "mechanics_punctuation",
      category_name: "Mechanics and Punctuation",
      skill_area: ["writing"],
      priority: "medium",
      definition: "Errors in punctuation, sentence boundaries, capitalization, and written clarity.",
      common_error_patterns: [
        { error: "I believe English is important because it helps nurses communicate with patients it also helps avoid mistakes.", correction: "I believe English is important because it helps nurses communicate with patients. It also helps avoid mistakes.", explanation: "Separate complete ideas into different sentences." }
      ],
      teacher_feedback_template: "Your idea is clear, but punctuation affects readability. Separate complete ideas clearly.",
      student_action: "At the end of writing, check sentence length, periods, commas, and capitalization.",
      suggested_homework: [
        "Edit one paragraph and mark every complete sentence.",
        "Rewrite 5 long sentences as two shorter sentences."
      ]
    },
    {
      category_id: "time_management",
      category_name: "Time Management",
      skill_area: ["writing", "reading", "listening", "test_strategy"],
      priority: "high",
      definition: "The student spends too much time rereading questions or overthinking answers during timed tasks.",
      common_error_patterns: [
        { problem: "Rereading the same question many times", solution: "Read once for meaning, underline keywords, answer, and move forward." },
        { problem: "Spending too much time on short writing questions", solution: "Use approximately 3 minutes per short answer and save time for the essay." }
      ],
      teacher_feedback_template: "Accuracy matters, but timing is part of the test skill. You need to trust your first understanding and move forward.",
      student_action: "Use a timer for all practice tasks.",
      suggested_homework: [
        "Complete one timed writing practice with 3 minutes per short question.",
        "Do one reading set without rereading each question more than twice."
      ]
    },
    {
      category_id: "inference_grammar",
      category_name: "Inference and Applied Grammar",
      skill_area: ["reading", "listening", "writing", "speaking"],
      priority: "medium",
      definition: "Difficulty using grammar and context clues to infer meaning beyond directly stated information.",
      common_error_patterns: [
        { problem: "Only looking for exact words from the question", solution: "Look for paraphrases, context, tone, and implied meaning." }
      ],
      teacher_feedback_template: "This question is not asking for only a direct detail. You need to infer the meaning from context.",
      student_action: "Ask: What does the speaker/writer suggest but not say directly?",
      suggested_homework: [
        "Practice 5 reading inference questions and explain the clue for each answer.",
        "Listen to a short audio and identify what the speaker implies."
      ]
    }
  ],
  auto_suggestion_rules: [
    { trigger: ["because it is important", "because it is good", "I agree because"], suggested_category: "writing_support_evidence", suggestion: "Ask the student to add one concrete example or personal experience." },
    { trigger: ["happy", "good", "bad", "thing", "very"], suggested_category: "vocabulary_leveling", suggestion: "Suggest a B2-level synonym and ask the student to rewrite the sentence." },
    { trigger: ["but", "although,", "however in the middle"], suggested_category: "connectors_contrast", suggestion: "Suggest a more formal contrast connector and explain sentence position." },
    { trigger: ["long pause", "I don't know", "short answer"], suggested_category: "speaking_pressure", suggestion: "Provide a starter phrase and ask for Opinion–Reason–Support." },
    { trigger: ["run-on sentence", "missing period", "too long sentence"], suggested_category: "mechanics_punctuation", suggestion: "Ask the student to divide the sentence into two clear complete ideas." }
  ],
  recommended_feedback_format: {
    error_detected: "Name the error clearly.",
    why_it_matters: "Explain how it affects MET performance.",
    correction: "Show the corrected version.",
    upgrade: "Offer a stronger B2-level alternative.",
    student_task: "Give one immediate practice action."
  },
  sample_feedback_objects: [
    { original_sentence: "I was happy because my husband gave me flowers.", error_type: "vocabulary_leveling", corrected_sentence: "I felt grateful because my husband gave me flowers.", upgrade_reason: "The word 'grateful' is more precise and emotionally specific than 'happy'.", practice_task: "Write 3 sentences using grateful, pleased, and satisfied." },
    { original_sentence: "I agree because English is important.", error_type: "writing_support_evidence", corrected_sentence: "I agree because English is essential for safe communication in healthcare. For example, nurses need to understand patients' symptoms clearly to avoid mistakes.", upgrade_reason: "The corrected version adds a specific healthcare-related example.", practice_task: "Add one example to each opinion answer." },
    { original_sentence: "I want to improve my speaking, although I feel nervous.", error_type: "connectors_contrast", corrected_sentence: "I want to speak more. However, I feel nervous under pressure.", upgrade_reason: "The contrast is clearer and the sentence structure is more appropriate for formal writing.", practice_task: "Write 5 sentences using 'however' at the beginning of the second sentence." }
  ]
};

// Map student firstName to profile — extend as you add more students
export const STUDENT_ERROR_PROFILES = {
  'Ana': ANA_PAULA_PROFILE,
};

/**
 * Build a concise diagnostic context string from a student's error profile.
 * Used to enrich the AI prompt with known error categories.
 */
export function buildErrorProfileContext(profile) {
  if (!profile?.error_categories) return '';

  const categories = profile.error_categories
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
    });

  const lines = categories.map(cat => {
    const example = cat.common_error_patterns?.[0];
    const errorExample = example?.error
      ? `Example error: "${example.error}" → "${example.correction}"`
      : example?.problem
        ? `Problem: "${example.problem}" → "${example.solution}"`
        : '';
    return `- ${cat.category_name} [${cat.priority.toUpperCase()}]: ${cat.definition}${errorExample ? '. ' + errorExample : ''}`;
  });

  return `Known error categories for this student (from previous sessions):
${lines.join('\n')}

Teacher's recommended feedback format: State the error → explain why it matters for MET → show correction → suggest B2 upgrade → give one immediate practice task.`;
}
