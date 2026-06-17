/**
 * send-invite.js — client helper that asks the serverless endpoint
 * (/api/send-invite) to email a class invite (.ics + Zoom link) to a student.
 * The Resend API key and sender stay server-side; the browser only passes
 * the class details.
 */

export const ZOOM_URL_KEY = 'vv:zoom_meeting_url';
export const TEACHER_NAME_KEY = 'vv:teacher_name';

export function getZoomUrl() {
  return (localStorage.getItem(ZOOM_URL_KEY) || '').trim();
}

/**
 * @param {object} p
 * @param {string} p.to          student email (required)
 * @param {string} [p.studentName]
 * @param {string} [p.teacherName]
 * @param {string} [p.title]
 * @param {string} p.date        YYYY-MM-DD (required)
 * @param {string} [p.startTime] HH:MM
 * @param {string} [p.endTime]   HH:MM
 * @param {string} p.zoomUrl     join link (required)
 * @param {string} [p.classFocus]
 * @param {string} [p.timezone]  IANA tz of the class wall-clock time
 */
export async function sendClassInvite(p) {
  const r = await fetch('/api/send-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(data?.error?.message || `Invite failed (${r.status})`);
  }
  return data;
}
