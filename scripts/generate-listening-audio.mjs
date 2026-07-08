/**
 * generate-listening-audio.mjs
 *
 * Batch-generates WAV files for every utterance in dialogue-bank.json using
 * the local Piper TTS service. Saves to public/audio/listening/dialogue-bank/
 * and writes a manifest for the listening component to load statically.
 *
 * Requirements:
 *   - Piper service running at PIPER_URL (default http://localhost:8000)
 *   - The libritts-high .onnx model downloaded into piper-service/models/
 *
 * Usage:
 *   node scripts/generate-listening-audio.mjs
 *   PIPER_URL=http://localhost:8000 node scripts/generate-listening-audio.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PIPER_URL = (process.env.PIPER_URL || 'http://localhost:8000').replace(/\/+$/, '');
const DIALOGUE_BANK_PATH = resolve(__dirname, '..', 'src', 'data', 'exercises', 'listening', 'dialogue-bank.json');
const OUTPUT_DIR = resolve(__dirname, '..', 'public', 'audio', 'listening', 'dialogue-bank');
const MANIFEST_PATH = resolve(__dirname, '..', 'public', 'audio', 'listening', 'dialogue-bank', 'manifest.json');

const GENDER_MAP = { A: 'female', B: 'male' };

async function main() {
  console.log(`Piper URL: ${PIPER_URL}`);
  console.log(`Dialogue bank: ${DIALOGUE_BANK_PATH}`);
  console.log(`Output dir: ${OUTPUT_DIR}`);

  // Check Piper is reachable
  try {
    const health = await fetch(`${PIPER_URL}/healthz`);
    if (!health.ok) throw new Error(`Health check returned ${health.status}`);
    console.log('Piper service: OK');
  } catch (e) {
    console.error(`Cannot reach Piper at ${PIPER_URL}: ${e.message}`);
    console.error('Start the Piper service first: cd piper-service && python app.py');
    process.exit(1);
  }

  // Read dialogue bank
  const raw = readFileSync(DIALOGUE_BANK_PATH, 'utf-8');
  const bank = JSON.parse(raw);
  const items = bank.modules?.[0]?.items || [];
  console.log(`Found ${items.length} dialogue items`);

  // Ensure output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest = { schemaVersion: '1.0', generated: new Date().toISOString(), dialogues: [] };

  for (const item of items) {
    const { id, title, script } = item;
    if (!script || !script.length) {
      console.warn(`  Skipping ${id} — no script`);
      continue;
    }

    const files = [];
    console.log(`\n[${id}] ${title} (${script.length} utterances)`);

    for (let i = 0; i < script.length; i++) {
      const { speaker, text } = script[i];
      const gender = GENDER_MAP[speaker] || 'female';
      const filename = `${id}_uttr${i}_${speaker.toLowerCase()}.wav`;
      const filepath = resolve(OUTPUT_DIR, filename);

      console.log(`  → Utterance ${i} (${speaker}, ${gender}): "${text.slice(0, 50)}..."`);

      try {
        const res = await fetch(`${PIPER_URL}/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, gender }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error(`    ✗ Piper error: ${err.detail || res.statusText}`);
          continue;
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        writeFileSync(filepath, buffer);
        console.log(`    ✓ Saved ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
        files.push({ utterance: i, speaker, gender, text, file: `dialogue-bank/${filename}` });
      } catch (e) {
        console.error(`    ✗ Request failed: ${e.message}`);
      }
    }

    manifest.dialogues.push({ id, title, files });
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ Manifest written to ${MANIFEST_PATH}`);
  console.log(`Done. Generated ${manifest.dialogues.reduce((s, d) => s + d.files.length, 0)} audio files across ${manifest.dialogues.length} dialogues.`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
