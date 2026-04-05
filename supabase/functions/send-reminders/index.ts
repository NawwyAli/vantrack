import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'reminders@vantrack.co.uk'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Certs expiring within 6 weeks:
// issue_date + 1 year is between today and today + 42 days
// => issue_date between (today - 365 days) and (today - 323 days)
function getDateRange() {
  const today = new Date()
  const min = new Date(today)
  min.setDate(min.getDate() - 365)
  const max = new Date(today)
  max.setDate(max.getDate() - 323) // 365 - 42
  return {
    min: min.toISOString().slice(0, 10),
    max: max.toISOString().slice(0, 10),
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setFullYear(d.getFullYear() + 1)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { min, max } = getDateRange()

  // Fetch active certs in expiry window that haven't had a reminder sent yet
  const { data: certs, error } = await supabase
    .from('certificates')
    .select(`
      id,
      issue_date,
      properties (
        address,
        clients (
          name,
          email
        )
      )
    `)
    .eq('is_active', true)
    .is('reminder_sent_at', null)
    .gte('issue_date', min)
    .lte('issue_date', max)

  if (error) {
    console.error('Query error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0
  const errors: string[] = []

  for (const cert of certs ?? []) {
    const property = cert.properties as any
    const client = property?.clients as any
    if (!client?.email) continue

    const expiryFormatted = formatDate(cert.issue_date)

    const emailBody = {
      from: FROM_EMAIL,
      to: client.email,
      subject: `Action Required: CP12 Certificate Expiring Soon — ${property.address}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1a1a1a;">CP12 Gas Safety Certificate — Renewal Reminder</h2>
          <p>Dear ${client.name},</p>
          <p>
            This is a reminder that the CP12 gas safety certificate for the property at
            <strong>${property.address}</strong> is due to expire on <strong>${expiryFormatted}</strong>.
          </p>
          <p>
            Under the Gas Safety (Installation and Use) Regulations 1998, landlords are legally required
            to have gas appliances checked annually by a Gas Safe registered engineer.
          </p>
          <p>Please get in touch to arrange a convenient time for the inspection before the expiry date.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 13px;">
            This is an automated reminder sent via VanTrack CP12 Certificate Tracker.
          </p>
        </div>
      `,
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    })

    if (res.ok) {
      await supabase
        .from('certificates')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', cert.id)
      sent++
    } else {
      const err = await res.text()
      errors.push(`cert ${cert.id}: ${err}`)
      console.error('Email send error:', err)
    }
  }

  return new Response(
    JSON.stringify({ sent, total: certs?.length ?? 0, errors }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
