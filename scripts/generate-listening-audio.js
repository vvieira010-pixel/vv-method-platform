import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_PATH = path.join(__dirname, '../src/data/met-listening-skills-bank.json');
const AUDIO_DIR = path.join(__dirname, '../public/audio/exercises');
const API_URL = 'http://localhost:3000/api/tts';

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
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: item.script,
            provider: 'deepgram' 
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`TTS request failed: ${response.status} ${errorText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(filePath, buffer);
        
        if (item.audioSrc !== audioSrc) {
          item.audioSrc = audioSrc;
          updated = true;
        }
        console.log(`    ✓ Saved to ${filename}`);
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
