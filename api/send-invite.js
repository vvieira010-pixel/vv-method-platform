/**
 * api/send-invite.js — Vercel serverless function that emails a class invite
 * (an .ics calendar attachment) containing the Zoom join link to a student.
 *
 * The client (calendar.jsx → src/lib/send-invite.js) POSTs:
 *   { to, studentName, teacherName, title, date, startTime, endTime,
 *     zoomUrl, classFocus, timezone }
 * and gets back { ok: true, id } on success.
 *
 * Server-only env vars (never shipped to the browser):
 *   RESEND_API_KEY    — transactional email provider key (https://resend.com)
 *   INVITE_FROM_EMAIL — verified sender address, e.g. classes@yourdomain.com
 *   INVITE_FROM_NAME  — optional display name for the sender (default "MET Class")
 *
 * Email is sent through Resend's REST API. The .ics is attached so the student
 * can add the class (with the Zoom link) to any calendar app.
 */

const env = (name) => process.env[name] || process.env[`VITE_${name}`] || '';

/** Verify the caller's Supabase JWT and return the user object, or null on failure. */
async function requireTeacherSession(req) {
  const token = (req.headers['authorization'] || '').replace(/^bearer\s+/i, '').trim();
  if (!token) return null;
  const supabaseUrl = env('SUPABASE_URL') || env('VITE_SUPABASE_URL');
  const anonKey = env('SUPABASE_ANON_KEY') || env('VITE_SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) return null;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Minutes the given IANA timezone is ahead of UTC at `date`. */
function tzOffsetMinutes(timeZone, date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = dtf.formatToParts(date).reduce((a, x) => { a[x.type] = x.value; return a; }, {});
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

/** Convert a wall-clock time in `timeZone` to the matching UTC Date. */
function zonedWallTimeToUTC(y, mo, d, h, mi, timeZone) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const off = tzOffsetMinutes(timeZone, new Date(guess));
  return new Date(guess - off * 60000);
}

function pad(n) { return String(n).padStart(2, '0'); }
function toICSUtc(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}
/** Escape a value for an ICS TEXT field. */
function icsText(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Fold ICS lines to <=75 octets per RFC 5545. */
function foldLine(line) {
  if (line.length <= 75) return line;
  const out = [];
  let i = 0;
  while (i < line.length) {
    out.push((i === 0 ? '' : ' ') + line.slice(i, i + (i === 0 ? 75 : 74)));
    i += (i === 0 ? 75 : 74);
  }
  return out.join('\r\n');
}

function buildICS({ uid, dtStamp, dtStart, dtEnd, allDay, summary, description, location, url, organizerEmail, organizerName, attendeeEmail, attendeeName }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VV Method//MET Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
    `SUMMARY:${icsText(summary)}`,
    `DESCRIPTION:${icsText(description)}`,
    `LOCATION:${icsText(location)}`,
    url ? `URL:${icsText(url)}` : '',
    organizerEmail ? `ORGANIZER;CN=${icsText(organizerName || organizerEmail)}:mailto:${organizerEmail}` : '',
    attendeeEmail ? `ATTENDEE;CN=${icsText(attendeeName || attendeeEmail)};RSVP=TRUE:mailto:${attendeeEmail}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.map(foldLine).join('\r\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Require a valid teacher session — prevents open relay abuse.
  const user = await requireTeacherSession(req);
  if (!user) {
    return res.status(401).json({ error: { message: 'Teacher sign-in required to send invites.' } });
  }
  const teacherEmails = env('VITE_TEACHER_EMAIL').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (teacherEmails.length && !teacherEmails.includes((user.email || '').toLowerCase())) {
    return res.status(403).json({ error: { message: 'Only teachers can send class invites.' } });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const {
    to, studentName, teacherName, title, date, startTime, endTime,
    zoomUrl, classFocus, timezone,
  } = body;

  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(to))) {
    return res.status(400).json({ error: { message: 'A valid student email ("to") is required.' } });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    return res.status(400).json({ error: { message: 'A valid class "date" (YYYY-MM-DD) is required.' } });
  }
  if (!zoomUrl || !/^https?:\/\//.test(String(zoomUrl))) {
    return res.status(400).json({ error: { message: 'A Zoom link ("zoomUrl") is required. Set it in Settings.' } });
  }

  const apiKey = env('RESEND_API_KEY');
  const fromEmail = env('INVITE_FROM_EMAIL');
  const fromName = env('INVITE_FROM_NAME') || 'MET Class';
  if (!apiKey || !fromEmail) {
    return res.status(503).json({
      error: { message: 'Email is not configured on the server. Set RESEND_API_KEY and INVITE_FROM_EMAIL in the Vercel environment.' },
    });
  }

  const tz = timezone || 'America/Sao_Paulo';
  const [y, mo, d] = String(date).split('-').map(Number);
  const allDay = !startTime;

  let dtStart, dtEnd;
  if (allDay) {
    const next = new Date(Date.UTC(y, mo - 1, d + 1));
    dtStart = `${y}${pad(mo)}${pad(d)}`;
    dtEnd = `${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`;
  } else {
    const [sh, sm] = String(startTime).split(':').map(Number);
    const startUTC = zonedWallTimeToUTC(y, mo, d, sh, sm, tz);
    let endUTC;
    if (endTime) {
      const [eh, em] = String(endTime).split(':').map(Number);
      endUTC = zonedWallTimeToUTC(y, mo, d, eh, em, tz);
      if (endUTC <= startUTC) endUTC = new Date(startUTC.getTime() + 60 * 60000);
    } else {
      endUTC = new Date(startUTC.getTime() + 60 * 60000);
    }
    dtStart = toICSUtc(startUTC);
    dtEnd = toICSUtc(endUTC);
  }

  const summary = title || 'English Class';
  const whenLabel = allDay
    ? new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : `${new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })} · ${startTime}${endTime ? `–${endTime}` : ''} (${tz})`;

  const descriptionPlain = [
    `Join your English class on Zoom: ${zoomUrl}`,
    classFocus ? `Focus: ${classFocus}` : '',
    `When: ${whenLabel}`,
  ].filter(Boolean).join('\n');

  const ics = buildICS({
    uid: `${date}-${String(to).replace(/[^a-z0-9]/gi, '')}-${Date.now()}@vv-method`,
    dtStamp: toICSUtc(new Date()),
    dtStart, dtEnd, allDay,
    summary,
    description: descriptionPlain,
    location: zoomUrl,
    url: zoomUrl,
    organizerEmail: fromEmail,
    organizerName: teacherName || fromName,
    attendeeEmail: to,
    attendeeName: studentName,
  });

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#0f1b2d">
      <h2 style="margin:0 0 4px">${escapeHtml(summary)}</h2>
      <p style="margin:0 0 16px;color:#4a5f70">${escapeHtml(whenLabel)}</p>
      ${classFocus ? `<p style="margin:0 0 16px"><strong>Focus:</strong> ${escapeHtml(classFocus)}</p>` : ''}
      <p style="margin:0 0 20px">Hi${studentName ? ' ' + escapeHtml(String(studentName).split(' ')[0]) : ''}, here's your class invite. Tap below to join on Zoom:</p>
      <p style="margin:0 0 20px">
        <a href="${escapeAttr(zoomUrl)}" style="display:inline-block;background:#148891;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600">Join Zoom class</a>
      </p>
      <p style="margin:0;color:#4a5f70;font-size:13px">Or copy this link: <a href="${escapeAttr(zoomUrl)}">${escapeHtml(zoomUrl)}</a></p>
      <p style="margin:16px 0 0;color:#4a5f70;font-size:13px">The attached <code>invite.ics</code> adds this class to your calendar.</p>
    </div>`;

  const payload = {
    from: `${fromName} <${fromEmail}>`,
    to: [to],
    subject: `Class invite — ${summary} (${whenLabel})`,
    html,
    attachments: [{
      filename: 'invite.ics',
      content: Buffer.from(ics, 'utf-8').toString('base64'),
      content_type: 'text/calendar; method=REQUEST; charset=UTF-8',
    }],
  };

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(502).json({ error: { message: data?.message || `Email provider rejected the request (${r.status}).` } });
    }
    return res.status(200).json({ ok: true, id: data?.id || null });
  } catch (e) {
    return res.status(502).json({ error: { message: `Failed to send invite: ${e.message}` } });
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
