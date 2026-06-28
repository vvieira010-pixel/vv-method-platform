/**
 * print-homework.js — render a homework as a clean, paper-friendly page and
 * open the browser print dialog. Students who prefer paper can print and write
 * by hand. Each exercise type is laid out with space to write answers.
 */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** N blank writing lines. */
function lines(n = 3) {
  return `<div class="lines">${Array.from({ length: n }).map(() => '<div class="line"></div>').join('')}</div>`;
}

function exerciseHtml(ex, n) {
  const t = ex.type;
  let body;

  if (t === 'mcq') {
    const opts = (ex.options || []).filter(o => o !== undefined);
    body = `<p class="q">${esc(ex.question)}</p>
      <ol type="A" class="opts">${opts.map(o => `<li>${esc(o)}</li>`).join('')}</ol>
      <p class="ans">Answer: ______</p>`;
  } else if (t === 'blank') {
    body = `<p class="q">Fill in the blanks:</p>
      <p class="passage">${esc(ex.template || '').replace(/_{2,}/g, '____________')}</p>`;
  } else if (t === 'short') {
    body = `<p class="q">${esc(ex.prompt)}</p>
      ${ex.targetWords ? `<p class="note">Target: ~${ex.targetWords} words.</p>` : ''}
      ${lines(7)}`;
  } else if (t === 'speak') {
    body = `${ex.imageUrl ? `<img class="promptimg" src="${esc(ex.imageUrl)}" alt="${esc(ex.imageAlt || 'Speaking prompt image')}" />` : ''}
      <p class="q">🎤 ${esc(ex.prompt)}</p>
      <p class="note">Speaking task — practise aloud (${ex.targetSeconds || 60}s). Notes / outline:</p>
      ${lines(4)}`;
  } else if (t === 'order') {
    // Shuffle so the printed list is not in answer-key order (mirrors OrderPlayer behaviour).
    const shuffled = (ex.sentences || []).slice().sort(() => Math.random() - 0.5);
    body = `<p class="q">Put these in the correct order — number them 1, 2, 3…:</p>
      <ul class="scramble">${shuffled.map(s => `<li>____ &nbsp; ${esc(s)}</li>`).join('')}</ul>`;
  } else if (t === 'fix') {
    body = `<p class="q">Find and correct the mistake(s):</p>
      <p class="passage">${esc(ex.errorText)}</p>
      <p class="note">Your correction:</p>${lines(2)}`;
  } else if (t === 'flash') {
    body = `<p class="q">Study / match the terms:</p>
      <ul class="pairs">${(ex.pairs || []).map(p => `<li><strong>${esc(p.term)}</strong> — ${esc(p.def)}</li>`).join('')}</ul>`;
  } else if (t === 'listen') {
    const opts = (ex.options || []).filter(o => o !== undefined);
    body = `<p class="q">Listening script:</p>
      <p class="passage">${esc(ex.audioText || 'Audio script not set yet.')}</p>
      <p class="q">${esc(ex.question || 'Question not set yet.')}</p>
      <ol type="A" class="opts">${opts.map(o => `<li>${esc(o)}</li>`).join('')}</ol>
      <p class="ans">Answer: ______</p>`;
  } else {
    body = `<p class="q">${esc(ex.prompt || ex.question || ex.instruction || '')}</p>${lines(4)}`;
  }

  return `<section class="ex"><div class="exnum">${n}.</div><div class="exbody">${body}</div></section>`;
}

export function buildPrintableHomeworkHtml(homework, { studentName = '' } = {}) {
  const activities = Array.isArray(homework?.activities) ? homework.activities : [];
  const due = homework?.dueDate
    ? new Date(homework.dueDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';
  const selfCheck = Array.isArray(homework?.selfCheck) ? homework.selfCheck.filter(Boolean) : [];

  return `<!doctype html><html><head><meta charset="utf-8">
<title>${esc(homework?.title || 'Homework')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111; line-height: 1.6; max-width: 720px; margin: 24px auto; padding: 0 16px; }
  .head { border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 18px; }
  .head h1 { font-family: 'Sora', 'Outfit', sans-serif; font-size: 24px; margin: 0 0 4px; font-weight: 700; letter-spacing: -0.02em; }
  .meta { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.06em; }
  .nameline { margin: 14px 0 18px; font-size: 12px; }
  .goal { font-size: 13px; background: #f4f4f4; padding: 10px 12px; border-radius: 6px; margin-bottom: 18px; }
  .ex { display: flex; gap: 10px; padding: 12px 0; border-top: 1px solid #ddd; page-break-inside: avoid; }
  .exnum { font-weight: bold; min-width: 22px; }
  .exbody { flex: 1; }
  .q { font-weight: 600; margin: 0 0 8px; }
  .passage { background: #fafafa; padding: 8px 10px; border-radius: 4px; }
  .promptimg { display: block; width: 100%; max-height: 300px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px; margin: 0 0 10px; }
  .opts { margin: 6px 0; } .opts li { margin: 3px 0; }
  .scramble, .pairs { margin: 6px 0; padding-left: 18px; } .scramble li, .pairs li { margin: 4px 0; }
  .ans { margin-top: 8px; font-size: 12px; color: #333; }
  .note { font-size: 11px; color: #555; margin: 6px 0 4px; }
  .lines .line { border-bottom: 1px solid #aaa; height: 22px; }
  .selfcheck { margin-top: 22px; border-top: 2px solid #111; padding-top: 10px; font-size: 12px; }
  .selfcheck li { margin: 4px 0; }
  @media print { body { margin: 0; } .noprint { display: none; } }
</style></head><body>
  <div class="head">
    <h1>${esc(homework?.title || 'Homework')}</h1>
    <div class="meta">${due ? `Due: ${esc(due)}` : ''}${homework?.type ? `${due ? ' · ' : ''}${esc(homework.type)}` : ''}</div>
  </div>
  <div class="nameline">Name: ${esc(studentName) || '______________________________'} &nbsp;&nbsp; Date: ______________</div>
  ${homework?.objective ? `<div class="goal"><strong>Goal:</strong> ${esc(homework.objective)}</div>` : ''}
  ${homework?.description ? `<div class="goal">${esc(homework.description)}</div>` : ''}
  ${activities.map((ex, i) => exerciseHtml(ex, i + 1)).join('')}
  ${selfCheck.length ? `<div class="selfcheck"><strong>Self-check before you submit:</strong><ul>${selfCheck.map(c => `<li>☐ ${esc(c)}</li>`).join('')}</ul></div>` : ''}
</body></html>`;
}

/** Open a print-ready window for this homework and trigger the print dialog. */
export function printHomework(homework, opts = {}) {
  const html = buildPrintableHomeworkHtml(homework, opts);
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) { window.toast?.('Allow pop-ups for this site to print.', 'warn'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  // Let the new document lay out before printing.
  setTimeout(() => { try { w.print(); } catch { /* user can print manually */ } }, 250);
}
