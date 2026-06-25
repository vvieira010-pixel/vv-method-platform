/**
 * upload-q1-images.js — Browser console script.
 *
 * PASTE this entire file into the browser console while on met-mastery.vercel.app.
 * It will:
 *   1. Open a file picker for you to select image files
 *   2. Upload each to Supabase storage
 *   3. Display the public URLs
 *   4. Optionally update Q1 speaking exercises in the current form
 *
 * Usage:
 *   1. Open Chrome DevTools (F12 → Console)
 *   2. Paste this entire script and press Enter
 *   3. Select the image files when the file picker opens
 */

(async function uploadQ1Images() {
  const raw = localStorage.getItem('vv:supabase_session');
  if (!raw) {
    console.error('%c[X] No Supabase session found. Sign in to the app first.', 'color:red;font-weight:bold');
    return;
  }
  const session = JSON.parse(raw);
  const token = session.access_token;
  const SUPABASE_URL = 'https://grnzzgzqizoxfcbflnwq.supabase.co';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdybnp6Z3pxaXpveGZjYmZsbndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODQ0MzcsImV4cCI6MjA5NjE2MDQzN30.5T7xFRlbJ9GQX9WvhJ5o2nIDgp3T99fJeGk5wCpuVnI';
  const BUCKET = 'exercise-images';

  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'image/*';
  picker.multiple = true;
  picker.click();

  const files = await new Promise(resolve => {
    picker.onchange = () => resolve([...picker.files]);
  });

  if (!files.length) {
    console.log('No files selected.');
    return;
  }

  const urls = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `q1_batch/${Date.now()}_${safeName}`;
    console.log(`Uploading ${file.name} (${(file.size / 1024).toFixed(1)} KB)…`);

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': file.type,
        'x-upsert': 'true',
      },
      body: file,
    });

    if (!res.ok) {
      console.error(`  [FAIL] ${file.name}: HTTP ${res.status} ${await res.text().catch(() => '')}`);
      continue;
    }

    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
    urls.push({ name: file.name, url });
    console.log(`  [OK] ${url}`);
  }

  console.log(`\nUploaded ${urls.length} / ${files.length} images.\n`);
  console.log('=== IMAGE URLs (paste these into the Speaking editor) ===');
  urls.forEach(({ name, url }) => {
    console.log(`  ${name}:`);
    console.log(`    ${url}`);
  });
  console.log('========================================================\n');

  return urls;
})();
