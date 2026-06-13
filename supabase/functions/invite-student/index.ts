import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let p = 'Met-'
  for (let i = 0; i < 6; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // Require an authenticated caller (must be the teacher)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Not authenticated' }, 401)
    }

    const { email, name, firstName } = await req.json()
    if (!email) return json({ error: 'email is required' }, 400)

    const displayName = firstName || (name || '').split(' ')[0] || 'there'

    // Admin client — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Generate a password and create (or reset) the account
    const password = genPassword()

    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip the confirmation-email requirement
    })

    if (createErr) {
      if (
        createErr.message.toLowerCase().includes('already') ||
        createErr.message.toLowerCase().includes('registered')
      ) {
        // Account exists — update the password so the email stays current
        const { data: list } = await admin.auth.admin.listUsers()
        const existing = list?.users?.find((u) => u.email === email)
        if (existing) {
          await admin.auth.admin.updateUserById(existing.id, { password })
        } else {
          return json({ error: createErr.message }, 400)
        }
      } else {
        return json({ error: createErr.message }, 400)
      }
    }

    // Send a credentials email via Resend if RESEND_API_KEY is set
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const siteUrl = 'https://met-mastery.vercel.app'

    if (resendKey) {
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
          <h2 style="color:#0f1b2d;margin-bottom:8px;">Welcome to MET Proficiency Mastery, ${displayName}!</h2>
          <p style="color:#555;line-height:1.6;">Teacher Vinicius has set up your account. Use the credentials below to sign in.</p>
          <div style="background:#f7f9fb;border:1.5px solid #d0e4e7;border-radius:8px;padding:18px 22px;margin:24px 0;font-family:monospace;font-size:15px;line-height:2;">
            <div><strong>Website:</strong> <a href="${siteUrl}" style="color:#148891;">${siteUrl}</a></div>
            <div><strong>Email:</strong> ${email}</div>
            <div><strong>Password:</strong> ${password}</div>
          </div>
          <a href="${siteUrl}" style="display:inline-block;background:#148891;color:#fff;padding:12px 26px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;">
            Open platform →
          </a>
          <p style="margin-top:28px;font-size:13px;color:#888;line-height:1.6;">
            After logging in, go to <strong>Settings → Account Password</strong> to change your password whenever you like.
          </p>
          <p style="font-size:11px;color:#aaa;margin-top:24px;">MET Proficiency Mastery · Private platform</p>
        </div>
      `
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Teacher Vinicius <onboarding@resend.dev>',
          to: [email],
          subject: 'Your MET Proficiency Mastery login',
          html,
        }),
      })
    }

    return json({ ok: true, password, emailSent: Boolean(resendKey) })
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
