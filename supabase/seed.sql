-- =============================================================================
-- seed.sql  –  Development / preview seed data
-- =============================================================================
-- HOW TO USE
--   1. Replace the two UUIDs below with real auth.users IDs from your project.
--   2. Run:  supabase db seed  (local)
--            supabase db push --include-seed  (remote)
--
--   TEACHER_ID  – the teacher account that owns the exercises and roster.
--   STUDENT_UID – a Supabase auth user for one pre-linked student (optional).
--                 Leave as the placeholder if you don't need a linked student.
-- =============================================================================

\set TEACHER_ID  'aaaaaaaa-0000-0000-0000-000000000001'
\set STUDENT_UID 'bbbbbbbb-0000-0000-0000-000000000002'

-- ---------------------------------------------------------------------------
-- 0. Bypass RLS for seeding (seeds run as postgres superuser locally;
--    on a remote project you may need to comment these out)
-- ---------------------------------------------------------------------------
set session_replication_role = replica;

-- ---------------------------------------------------------------------------
-- 1. Students
-- ---------------------------------------------------------------------------
insert into public.students
  (id, teacher_id, local_id, name, first_name, email,
   current_level, target_level, focus_skill, auth_user_id, metadata)
values
  (
    gen_random_uuid(),
    :'TEACHER_ID',
    'stu-001',
    'Ana Silva',
    'Ana',
    'ana.silva@example.com',
    'B1', 'B2', 'Speaking',
    :'STUDENT_UID',
    '{"targetExam":"IELTS","timezone":"America/Sao_Paulo","coursePackage":"intensive"}'::jsonb
  ),
  (
    gen_random_uuid(),
    :'TEACHER_ID',
    'stu-002',
    'Carlos Mendes',
    'Carlos',
    'carlos.mendes@example.com',
    'A2', 'B1', 'Writing',
    null,
    '{"targetExam":"Cambridge","timezone":"America/Sao_Paulo","coursePackage":"standard"}'::jsonb
  ),
  (
    gen_random_uuid(),
    :'TEACHER_ID',
    'stu-003',
    'Flávia Costa',
    'Flávia',
    'flavia.costa@example.com',
    'B2', 'C1', 'Reading',
    null,
    '{"targetExam":"TOEFL","timezone":"America/Sao_Paulo","coursePackage":"exam-prep"}'::jsonb
  )
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 2. Exercises
-- ---------------------------------------------------------------------------
insert into public.exercises
  (id, teacher_id, type, title, tags, level, content)
values

  -- MCQ -----------------------------------------------------------------------
  (
    gen_random_uuid(), :'TEACHER_ID',
    'mcq',
    'Present Perfect vs Simple Past',
    array['grammar','tenses'],
    'B1',
    '{
      "id": "ex-mcq-001",
      "type": "mcq",
      "question": "She _____ in London for three years before moving to Brazil.",
      "options": ["lived","has lived","was living","had lived"],
      "correct": 3
    }'::jsonb
  ),

  -- Fill the Blank ------------------------------------------------------------
  (
    gen_random_uuid(), :'TEACHER_ID',
    'blank',
    'Conditional Sentences – Type 2',
    array['grammar','conditionals'],
    'B1',
    '{
      "id": "ex-blank-001",
      "type": "blank",
      "template": "If I {1} more time, I {2} study abroad.",
      "blanks": [
        {"index":1,"answer":"had","hint":"past simple of have"},
        {"index":2,"answer":"would","hint":"modal verb"}
      ]
    }'::jsonb
  ),

  -- Short Answer --------------------------------------------------------------
  (
    gen_random_uuid(), :'TEACHER_ID',
    'short',
    'Describe Your Ideal City',
    array['writing','vocabulary'],
    'B2',
    '{
      "id": "ex-short-001",
      "type": "short",
      "prompt": "In 100–150 words, describe the features that make a city ideal to live in.",
      "rubric": "Look for: cohesion, range of vocabulary (urban, infrastructure, amenities), and a clear structure.",
      "targetWords": 120,
      "scaffolding": {
        "vocabulary": ["infrastructure","amenities","sustainable","commute","vibrant"],
        "structure": "Introduction → two or three key features → conclusion"
      }
    }'::jsonb
  ),

  -- Speaking Prompt -----------------------------------------------------------
  (
    gen_random_uuid(), :'TEACHER_ID',
    'speak',
    'Talk About a Memorable Journey',
    array['speaking','fluency'],
    'B1',
    '{
      "id": "ex-speak-001",
      "type": "speak",
      "prompt": "Talk for about one minute about a journey that was memorable for you. Where did you go? Why was it special?",
      "targetSeconds": 60,
      "scaffolding": {
        "vocabulary": ["destination","breathtaking","unexpected","highlight","unforgettable"],
        "structure": "Where / When → What happened → Why it was special"
      }
    }'::jsonb
  ),

  -- Order Sentences -----------------------------------------------------------
  (
    gen_random_uuid(), :'TEACHER_ID',
    'order',
    'Rearrange: Cause & Effect',
    array['writing','cohesion'],
    'B1',
    '{
      "id": "ex-order-001",
      "type": "order",
      "sentences": [
        "As a result, many species are now endangered.",
        "Deforestation destroys natural habitats.",
        "Animals lose the food and shelter they depend on.",
        "Conservationists are working to reverse this trend."
      ]
    }'::jsonb
  ),

  -- Error Correction ----------------------------------------------------------
  (
    gen_random_uuid(), :'TEACHER_ID',
    'fix',
    'Spot the Error – Passive Voice',
    array['grammar','passive'],
    'B2',
    '{
      "id": "ex-fix-001",
      "type": "fix",
      "errorText": "The report was wrote by the team last week.",
      "correctedText": "The report was written by the team last week.",
      "hint": "Check the past participle of ''write''."
    }'::jsonb
  ),

  -- Flashcards ----------------------------------------------------------------
  (
    gen_random_uuid(), :'TEACHER_ID',
    'flash',
    'Academic Vocabulary – Set 1',
    array['vocabulary','academic'],
    'B2',
    '{
      "id": "ex-flash-001",
      "type": "flash",
      "pairs": [
        {"term":"analyse","def":"to examine something in detail"},
        {"term":"hypothesis","def":"an idea that has not yet been proved"},
        {"term":"significant","def":"important or large enough to be noticed"},
        {"term":"evidence","def":"facts that show something is true"},
        {"term":"conclude","def":"to decide something after considering all information"}
      ]
    }'::jsonb
  ),

  -- Listening -----------------------------------------------------------------
  (
    gen_random_uuid(), :'TEACHER_ID',
    'listen',
    'Airport Announcement – Main Idea',
    array['listening','travel'],
    'B1',
    '{
      "id": "ex-listen-001",
      "type": "listen",
      "audioText": "Attention passengers on flight BA204 to London Heathrow. Your gate has changed to Gate 32B. Boarding will begin in approximately 20 minutes. Please have your boarding pass and passport ready.",
      "plays": 0,
      "question": "Why is the announcement being made?",
      "options": [
        "To announce a flight delay",
        "To inform passengers of a gate change",
        "To ask passengers to board immediately",
        "To request passport checks at security"
      ],
      "correct": 1,
      "explanation": "The announcement specifically states that the gate has changed to 32B.",
      "pictureHint": ""
    }'::jsonb
  ),

  -- Reading -------------------------------------------------------------------
  (
    gen_random_uuid(), :'TEACHER_ID',
    'read',
    'The Benefits of Urban Green Spaces',
    array['reading','environment'],
    'B2',
    '{
      "id": "ex-read-001",
      "type": "read",
      "passage": "Urban green spaces – parks, gardens, and tree-lined streets – are increasingly recognised as essential infrastructure in modern cities. Beyond their aesthetic value, they provide measurable health benefits: studies show that people living near parks report lower levels of stress and higher life satisfaction. Green spaces also play a critical role in combating urban heat islands, where densely built areas absorb and retain heat, raising local temperatures by up to 5°C compared with surrounding rural areas.",
      "source": "Adapted from Urban Planning Today, 2025",
      "questions": [
        {
          "id": "q1",
          "question": "According to the passage, what is one health benefit of green spaces?",
          "options": [
            "They reduce air pollution levels",
            "They lower stress and raise life satisfaction",
            "They increase property values",
            "They improve public transport links"
          ],
          "correct": 1
        },
        {
          "id": "q2",
          "question": "What does the term ''urban heat island'' refer to?",
          "options": [
            "A park that becomes very hot in summer",
            "A city with no green spaces",
            "A built-up area that retains more heat than surrounding areas",
            "A type of solar energy installation"
          ],
          "correct": 2
        }
      ]
    }'::jsonb
  )

on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 3. Re-enable RLS
-- ---------------------------------------------------------------------------
set session_replication_role = default;
