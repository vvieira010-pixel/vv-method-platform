import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_PATH = path.join(__dirname, '../src/data/met-listening-skills-bank.json');
const AUDIO_DIR = path.join(__dirname, '../public/audio/exercises');
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE = '21m00Tcm4TlvDq8ikWAM'; // Rachel

if (!ELEVENLABS_API_KEY) {
  console.error('Error: ELEVENLABS_API_KEY is not set in the environment.');
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generate() {
  const rawData = await fs.readFile(DATA_PATH, 'utf8');
  const data = JSON.parse(rawData);
  
  let updated = false;

  for (const mod of data.modules) {
    console.log(`\nProcessing module: ${mod.title}`);
    for (const item of mod.items) {
      const filename = `met_listening_${item.id}.mp3`;
      const filePath = path.join(AUDIO_DIR, filename);
      const audioSrc = `/audio/exercises/${filename}`;

      // If audioSrc already exists and file exists, skip
      try {
        await fs.access(filePath);
        console.log(`  [SKIP] ${item.id} (audio already exists)`);
        if (item.audioSrc !== audioSrc) {
          item.audioSrc = audioSrc;
          updated = true;
        }
        continue;
      } catch {
        // File doesn't exist, proceed to generate
      }

      console.log(`  [GEN] ${item.id} (${item.script.substring(0, 30).replace(/\n/g, ' ')}...)`);

      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE}`, {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: item.script,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`ElevenLabs TTS request failed: ${response.status} ${errorText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(filePath, buffer);
        
        if (item.audioSrc !== audioSrc) {
          item.audioSrc = audioSrc;
          updated = true;
        }
        console.log(`    ✓ Saved to ${filename}`);
        
        // Delay to avoid rate limits
        await sleep(1000);
      } catch (err) {
        console.error(`    ✗ Failed ${item.id}:`, err.message);
      }
    }
  }

  if (updated) {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    console.log('\nSuccessfully updated JSON with audioSrc paths.');
  } else {
    console.log('\nNo changes made to JSON.');
  }
}

generate().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
