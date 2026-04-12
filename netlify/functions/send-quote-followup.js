export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { to, clientName, quoteNumber, total, description, engineerName, engineerEmail, engineerPhone } = JSON.parse(event.body)
    if (!to) return { statusCode: 400, body: JSON.stringify({ error: 'Missing recipient email' }) }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1c1c1e">
        <div style="background:#0a84ff;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">${engineerName}</h1>
        </div>
        <div style="background:#f2f2f7;padding:32px;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px">Dear ${clientName},</p>
          <p style="margin:0 0 16px">
            I just wanted to follow up on the quote I sent you
            ${quoteNumber ? `(<strong>#${quoteNumber}</strong>) ` : ''}${description ? `for <em>${description}</em> ` : ''}
            ${total ? `totalling <strong>£${parseFloat(total).toFixed(2)}</strong>` : ''}.
          </p>
          <p style="margin:0 0 24px">
            If you have any questions, need to make changes, or would like to go ahead — please don't
            hesitate to get in touch. I'm happy to help!
          </p>
          <div style="border-top:1px solid #d1d1d6;padding-top:16px;font-size:13px;color:#636366">
            ${engineerName}${engineerPhone ? ` · ${engineerPhone}` : ''}${engineerEmail ? ` · ${engineerEmail}` : ''}
          </div>
        </div>
      </div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'noreply@vantrack.co.uk',
        to,
        subject: `Following up on your quote${quoteNumber ? ` #${quoteNumber}` : ''} — ${engineerName}`,
        html,
      }),
    })

    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`)
    return { statusCode: 200, body: JSON.stringify({ sent: true }) }
  } catch (err) {
    console.error('Quote follow-up error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
