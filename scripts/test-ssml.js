import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testSSML() {
  const ssml = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AriaNeural">Hello, I am Aria.</voice>
    <voice name="en-US-GuyNeural">And I am Guy.</voice>
</speak>`;

  const ssmlFile = path.join(os.tmpdir(), 'test-ssml.xml');
  const outputFile = path.join(os.tmpdir(), 'test-output.mp3');

  try {
    await fs.writeFile(ssmlFile, ssml, 'utf-8');
    console.log('SSML file written.');

    // edge-tts might require the --text to be the SSML if it doesn't have a specific SSML flag, 
    // or it might support reading from a file. 
    // Let's try providing the SSML as the text.
    console.log('Running edge-tts with SSML...');
    
    // If edge-tts doesn't support SSML via --text, I might need to check its options.
    // Many tools allow passing a file.
    
    execSync(`edge-tts --text "${ssml.replace(/"/g, '\\"')}" --write-media "${outputFile}"`, { stdio: 'inherit' });
    
    console.log('Success! Output file:', outputFile);
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await fs.unlink(ssmlFile).catch(() => {});
  }
}

testSSML();
