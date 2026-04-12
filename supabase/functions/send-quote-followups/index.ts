import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY      = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL          = Deno.env.get('FROM_EMAIL') ?? 'noreply@vantrack.co.uk'

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Get engineers with quote follow-up enabled (days > 0)
  const { data: profiles, error: profErr } = await supabase
    .from('engineer_profiles')
    .select('id, business_name, phone, email, quote_followup_days')
    .gt('quote_followup_days', 0)

  if (profErr) return new Response(JSON.stringify({ error: profErr.message }), { status: 500 })
  if (!profiles?.length) return new Response(JSON.stringify({ sent: 0, skipped: 'no opted-in engineers' }))

  const profileMap: Record<string, any> = {}
  for (const p of profiles) profileMap[p.id] = p

  let sent = 0
  const errors: string[] = []

  for (const ep of profiles) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - ep.quote_followup_days)

    // Fetch stale sent quotes for this engineer
    const { data: quotes, error: qErr } = await supabase
      .from('quotes')
      .select('id, quote_number, total, notes, line_items, client_id, clients(name, email)')
      .eq('user_id', ep.id)
      .eq('status', 'sent')
      .is('followup_sent_at', null)
      .lt('created_at', cutoff.toISOString())

    if (qErr) { errors.push(`user ${ep.id}: ${qErr.message}`); continue }

    for (const quote of quotes ?? []) {
      const client = quote.clients as any
      if (!client?.email) continue

      const firstItem = (quote.line_items as any[])?.[0]
      const description = firstItem?.description || ''
      const engineerName = ep.business_name || 'Your Engineer'

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1c1c1e">
          <div style="background:#0a84ff;padding:24px 32px;border-radius:8px 8px 0 0">
            <h1 style="color:#fff;margin:0;font-size:22px">${engineerName}</h1>
          </div>
          <div style="background:#f2f2f7;padding:32px;border-radius:0 0 8px 8px">
            <p style="margin:0 0 16px">Dear ${client.name},</p>
            <p style="margin:0 0 16px">
              I just wanted to follow up on the quote I sent you
              (<strong>#${quote.quote_number}</strong>)${description ? ` for <em>${description}</em>` : ''}
              totalling <strong>£${parseFloat(quote.total).toFixed(2)}</strong>.
            </p>
            <p style="margin:0 0 24px">
              If you have any questions, need any changes, or would like to go ahead — please don't
              hesitate to get in touch. Happy to help!
            </p>
            <div style="border-top:1px solid #d1d1d6;padding-top:16px;font-size:13px;color:#636366">
              ${engineerName}${ep.phone ? ` · ${ep.phone}` : ''}${ep.email ? ` · ${ep.email}` : ''}
            </div>
          </div>
        </div>`

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: client.email,
          subject: `Following up on your quote #${quote.quote_number} — ${engineerName}`,
          html,
        }),
      })

      if (res.ok) {
        await supabase.from('quotes')
          .update({ followup_sent_at: new Date().toISOString() })
          .eq('id', quote.id)
        sent++
      } else {
        const errText = await res.text()
        errors.push(`quote ${quote.id}: ${errText}`)
        console.error('Resend error:', errText)
      }
    }
  }

  return new Response(
    JSON.stringify({ sent, errors }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
