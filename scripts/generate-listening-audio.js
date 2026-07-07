import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function cleanText(raw) {
  return raw
    .replace(/\\n/g, '\n')
    .split('\n')
    .map(line => line.replace(/^(N|W|M|Advisor|Student|Assistant|Customer|Coordinator|Announcer|Host|Nurse|Narrator):\s*/g, '').trim())
    .filter(Boolean)
    .join(' ');
}

const EXERCISES = [
  {
    id: 'L12', label: 'urban-planning', voice: 'en-US-AriaNeural',
    exerciseIds: ['dr_L12a', 'dr_L12b', 'dr_L12c'],
    text: 'Although many urban planners argue that high-density housing is essential for growth, some residents believe it may alleviate the housing shortage while simultaneously diminishing community green spaces. The challenge lies in balancing modern infrastructure needs with the preservation of local parks, which are vital for the well-being of citizens. Ultimately, town councils must prioritize sustainable designs that integrate nature into the urban landscape rather than sacrificing it for concrete expansion.',
  },
  {
    id: 'L01', label: 'careers-workshop', voice: 'en-US-GuyNeural',
    exerciseIds: ['dr_L01'],
    text: 'W: Are you going to the careers workshop this afternoon?\nM: Not today. They moved it to next Thursday because the guest speaker missed her flight.\nW: I\'m glad you told me. I was about to leave for the hall.\nN: What does the man say about the workshop?',
  },
  {
    id: 'L02', label: 'printer-handouts', voice: 'en-US-JennyNeural',
    exerciseIds: ['dr_L02'],
    text: 'W: Did you print the handouts for the meeting?\nM: I tried, but the printer is out of paper, so I emailed everyone a copy instead.\nW: Fine. That should work for today.\nN: What problem did the man have?',
  },
  {
    id: 'L03', label: 'old-phone', voice: 'en-US-GuyNeural',
    exerciseIds: ['dr_L03'],
    text: 'M: I can\'t believe your phone still works after all these years.\nW: Barely. I\'m keeping it until next month, when the newer model goes on sale.\nN: What will the woman probably do next month?',
  },
  {
    id: 'L04', label: 'noisy-window', voice: 'en-US-BrianNeural',
    exerciseIds: ['dr_L04'],
    text: 'W: Could you close the window? The traffic is really loud today.\nM: I\'d rather leave it open because it\'s warm in here, but if the noise is bothering you, I can shut it.\nN: What does the man mean?',
  },
  {
    id: 'L05', label: 'academic-advisor', voice: 'en-US-BrianNeural',
    exerciseIds: ['dr_L05a', 'dr_L05b'],
    text: 'N: Listen to a conversation between a student and an academic advisor.\nAdvisor: So, you\'re thinking about taking Introduction to Marketing next term?\nStudent: Yes, but the only section I can see is on Tuesday evenings, and that\'s when I usually work.\nAdvisor: There is an online section, but it fills up quickly. If you want that one, you should register today.\nStudent: I was hoping to take the in-person class because I learn better when I can ask questions right away.\nAdvisor: That makes sense. Still, the online section might be the better choice if your work schedule can\'t change.\nStudent: True. I\'ll call my manager this afternoon and see whether I can switch shifts. If not, I\'ll take the online class.\nN: Now answer the questions.',
  },
  {
    id: 'L06', label: 'bike-rental', voice: 'en-US-GuyNeural',
    exerciseIds: ['dr_L06a', 'dr_L06b'],
    text: 'N: Listen to a conversation in a bike rental shop.\nAssistant: Are you renting for the city or for the trails?\nCustomer: For the trails. My brother is visiting, and we planned a ride for Saturday.\nAssistant: In that case, I should tell you that the hill trail is partly closed after last week\'s heavy rain.\nCustomer: Oh. Is there another route you\'d recommend?\nAssistant: Yes. The river route is open, and it\'s easier too. I\'d also suggest helmets and a repair kit.\nCustomer: We definitely need helmets. Do they come with the bikes?\nAssistant: They do, but the repair kit costs extra.\nCustomer: That\'s fine. Let\'s do two bikes, two helmets, and one repair kit.\nN: Now answer the questions.',
  },
  {
    id: 'L07', label: 'apartment-roommates', voice: 'en-US-GuyNeural',
    exerciseIds: ['dr_L07a', 'dr_L07b'],
    text: 'N: Listen to two roommates talking about an apartment.\nW: I like the apartment on Green Street. It\'s cheaper than the others, and the kitchen is much nicer.\nM: I liked that one too, but it\'s pretty far from the train station.\nW: That\'s true, although the bus stop is right outside.\nM: Did you notice how small the bedrooms were? I\'m not sure my desk would fit.\nW: Mine probably would, but just barely. On the other hand, internet is included in the rent, which would save us money every month.\nM: Good point. Why don\'t we visit it again on Friday and measure the rooms?\nW: That sounds like the best plan.\nN: Now answer the questions.',
  },
  {
    id: 'L08', label: 'museum-volunteer', voice: 'en-US-BrianNeural',
    exerciseIds: ['dr_L08a', 'dr_L08b'],
    text: 'N: Listen to a volunteer coordinator speaking at a museum.\nCoordinator: Welcome, everyone, and thank you for volunteering at the City Museum this weekend. Please arrive fifteen minutes before your shift starts so you have time to collect your name badge and leave your bags in the staff room. During the event, most of you will be helping visitors find the correct galleries. If a visitor asks you a question you cannot answer, do not guess. Instead, send the visitor to the information desk near the main entrance. Finally, remember that food and drinks are not allowed in the exhibition rooms, so please finish them before you begin your shift.\nN: Now answer the questions.',
  },
  {
    id: 'L09', label: 'water-service', voice: 'en-US-GuyNeural',
    exerciseIds: ['dr_L09a', 'dr_L09b'],
    text: 'N: Listen to a public service announcement.\nAnnouncer: This is a reminder for residents of North Park. Water service will be temporarily interrupted tonight from ten p.m. until approximately six a.m. while the city replaces an old underground pipe. Residents are advised to store enough water for drinking and basic cleaning before ten p.m. If possible, avoid using washing machines or dishwashers until service is fully restored in the morning. A supply tank with bottled water will be available at the North Park Community Center for elderly residents and others with urgent needs.\nN: Now answer the questions.',
  },
  {
    id: 'L11', label: 'nurse-handoff', voice: 'en-US-AriaNeural',
    exerciseIds: ['dr_L11a', 'dr_L11b'],
    text: 'N: Listen to a nurse giving a handoff report to the next shift.\nNurse: Room 204, Mr. Thompson, admitted yesterday with pneumonia. He completed his first dose of IV antibiotics at six p.m. and tolerated it well. His temperature this morning was 37.8, down from 38.5 yesterday. He is still on oxygen at two liters, and his saturation is holding at 96 percent. He can eat soft foods but has had a reduced appetite. The main concern is his mobility — he is at risk of falls, so please ensure the bed alarm is on and assist him to the bathroom. His wife will visit at seven. That is all for now.\nN: Now answer the questions.',
  },
  {
    id: 'L10', label: 'walking-podcast', voice: 'en-US-BrianNeural',
    exerciseIds: ['dr_L10a', 'dr_L10b'],
    text: 'N: Listen to part of a podcast.\nHost: When people feel stuck on a problem, they often assume they should stay at their desks and try harder. In fact, short walks can be surprisingly productive. Movement changes your environment and can interrupt repetitive thinking. One design team I interviewed now holds ten-minute walking meetings whenever they cannot agree on a solution. They say the conversations become calmer, and people tend to suggest more creative ideas. Of course, walking is not a replacement for focused work. You still need time to sit down, review options, and make a decision. But if your thinking starts to go in circles, getting up may be exactly what helps.\nN: Now answer the questions.',
  },
];

const EXERCISE_FILE = path.join(__dirname, '..', 'src', 'lib', 'met-b2-exercises.js');
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'exercises', 'audio', 'listening');

async function fileExists(fp) {
  try { await fs.access(fp); return true; } catch { return false; }
}

async function generateAudio(ex) {
  const cleaned = cleanText(ex.text);
  const filename = `listening-${ex.id}-${ex.label}.mp3`;
  const filePath = path.join(AUDIO_DIR, filename);
  const audioSrc = `/exercises/listening/${filename}`;

  if (await fileExists(filePath)) {
    console.log(`  [SKIP] ${filename} (already exists)`);
    return audioSrc;
  }

  console.log(`  [GEN] ${filename} ...`);

  const tmpFile = path.join(os.tmpdir(), `edge-tts-${ex.id}-${Date.now()}.txt`);
  await fs.writeFile(tmpFile, cleaned, 'utf-8');

  try {
    execSync(
      `edge-tts --voice "${ex.voice}" -f "${tmpFile}" --write-media "${filePath}"`,
      { timeout: 30000, stdio: 'pipe', encoding: 'utf-8' }
    );
    console.log(`    ✓ ${filename} (${ex.voice})`);
    return audioSrc;
  } catch (err) {
    console.error(`    ✗ Failed ${filename}:`, err.stderr?.toString() || err.message);
    return null;
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }
}

async function updateExerciseFile(mapping) {
  let content = await fs.readFile(EXERCISE_FILE, 'utf-8');

  for (const [exerciseId, audioSrc] of Object.entries(mapping)) {
    if (!audioSrc) continue;

    const pattern = `    id: drId('${exerciseId}'), type: 'listen', level: 'B2', skill: 'listening', plays: 2,\r\n    audioText:`;
    const replacement = `    id: drId('${exerciseId}'), type: 'listen', level: 'B2', skill: 'listening', plays: 2,\r\n    audioSrc: '${audioSrc}',\r\n    audioText:`;

    if (content.includes(pattern)) {
      content = content.replace(pattern, replacement);
      console.log(`  [UPD] ${exerciseId} -> ${audioSrc}`);
    } else {
      console.warn(`  [WARN] Could not find pattern for ${exerciseId}`);
    }
  }

  await fs.writeFile(EXERCISE_FILE, content, 'utf-8');
  console.log('\nExercise file updated successfully.');
}

async function main() {
  console.log('Generating Listening Lab audio with edge-tts...\n');

  await fs.mkdir(AUDIO_DIR, { recursive: true });

  const mapping = {};
  for (const ex of EXERCISES) {
    const src = await generateAudio(ex);
    for (const eid of ex.exerciseIds) {
      mapping[eid] = src;
    }
  }

  console.log('\n── Updating exercise file with audioSrc paths ──');
  await updateExerciseFile(mapping);

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
