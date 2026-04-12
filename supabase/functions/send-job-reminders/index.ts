import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? ''
const TWILIO_AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
const TWILIO_FROM        = Deno.env.get('TWILIO_FROM_NUMBER') ?? ''

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function normalisePhone(phone: string): string {
  const p = phone.replace(/\s+/g, '')
  if (p.startsWith('07')) return '+44' + p.slice(1)
  if (p.startsWith('00')) return '+' + p.slice(2)
  return p
}

Deno.serve(async () => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    return new Response(JSON.stringify({ error: 'Twilio credentials not configured' }), { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const tomorrow = getTomorrow()

  // Get user_ids with auto SMS reminders enabled
  const { data: profiles, error: profErr } = await supabase
    .from('engineer_profiles')
    .select('id, business_name, phone, auto_sms_reminders')
    .eq('auto_sms_reminders', true)

  if (profErr) return new Response(JSON.stringify({ error: profErr.message }), { status: 500 })
  const userIds = (profiles ?? []).map((p: any) => p.id)
  if (userIds.length === 0) return new Response(JSON.stringify({ sent: 0, skipped: 'no opted-in engineers' }))

  // Build a map for quick lookup
  const profileMap: Record<string, any> = {}
  for (const p of profiles ?? []) profileMap[p.id] = p

  // Fetch jobs tomorrow that haven't had SMS sent, for opted-in engineers
  const { data: jobs, error: jobErr } = await supabase
    .from('jobs')
    .select('id, description, date, start_time, user_id, client_id, clients(name, phone)')
    .eq('date', tomorrow)
    .is('sms_reminder_sent_at', null)
    .neq('status', 'completed')
    .eq('archived', false)
    .in('user_id', userIds)

  if (jobErr) return new Response(JSON.stringify({ error: jobErr.message }), { status: 500 })

  let sent = 0
  const errors: string[] = []

  for (const job of jobs ?? []) {
    const ep = profileMap[job.user_id]
    const client = job.clients as any
    if (!client?.phone) continue

    const engineerName = ep?.business_name || 'Your Engineer'
    const dateStr = new Date(job.date + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const timeStr = job.start_time ? ` at ${job.start_time}` : ''
    const contactStr = ep?.phone ? ` Call ${ep.phone} for queries.` : ''

    const body =
      `Hi ${client.name}, reminder from ${engineerName}: ` +
      `${job.description} scheduled for tomorrow (${dateStr}${timeStr}).` +
      `${contactStr} Reply STOP to opt out.`

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: TWILIO_FROM, To: normalisePhone(client.phone), Body: body }).toString(),
      }
    )

    if (twilioRes.ok) {
      await supabase.from('jobs')
        .update({ sms_reminder_sent_at: new Date().toISOString() })
        .eq('id', job.id)
      sent++
    } else {
      const errText = await twilioRes.text()
      errors.push(`job ${job.id}: ${errText}`)
      console.error('Twilio error:', errText)
    }
  }

  return new Response(
    JSON.stringify({ sent, total: jobs?.length ?? 0, errors }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
