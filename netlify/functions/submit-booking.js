import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { slug, clientName, clientEmail, clientPhone, description, preferredDate, message } = body

  if (!slug || !clientName || !description) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  // Look up engineer by slug
  const { data: profile } = await supabase
    .from('engineer_profiles')
    .select('id, business_name, email, booking_enabled')
    .eq('booking_slug', slug)
    .single()

  if (!profile || !profile.booking_enabled) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Booking not available' }) }
  }

  // Insert booking request (using service role — bypasses RLS)
  const { error: insertErr } = await supabase.from('booking_requests').insert({
    user_id: profile.id,
    client_name: clientName,
    client_email: clientEmail || null,
    client_phone: clientPhone || null,
    description,
    preferred_date: preferredDate || null,
    message: message || null,
    status: 'pending',
  })

  if (insertErr) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save booking request' }) }
  }

  // Notify engineer by email
  if (profile.email) {
    const appUrl = process.env.URL || 'https://storied-sunburst-d7d0ae.netlify.app'
    await resend.emails.send({
      from: 'bookings@vantrack.co.uk',
      to: profile.email,
      subject: `New booking request from ${clientName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#0a84ff">New Booking Request</h2>
          <p>You have a new booking request via your VanTrack booking page.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:6px 0;color:#888;font-size:13px">Name</td><td style="padding:6px 0;font-size:14px"><strong>${clientName}</strong></td></tr>
            ${clientEmail ? `<tr><td style="padding:6px 0;color:#888;font-size:13px">Email</td><td style="padding:6px 0;font-size:14px">${clientEmail}</td></tr>` : ''}
            ${clientPhone ? `<tr><td style="padding:6px 0;color:#888;font-size:13px">Phone</td><td style="padding:6px 0;font-size:14px">${clientPhone}</td></tr>` : ''}
            ${preferredDate ? `<tr><td style="padding:6px 0;color:#888;font-size:13px">Preferred date</td><td style="padding:6px 0;font-size:14px">${preferredDate}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#888;font-size:13px">Job</td><td style="padding:6px 0;font-size:14px">${description}</td></tr>
            ${message ? `<tr><td style="padding:6px 0;color:#888;font-size:13px">Message</td><td style="padding:6px 0;font-size:14px">${message}</td></tr>` : ''}
          </table>
          <p style="margin-top:24px">
            <a href="${appUrl}" style="background:#0a84ff;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">
              View in VanTrack →
            </a>
          </p>
        </div>
      `,
    }).catch(() => {})
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  }
}
