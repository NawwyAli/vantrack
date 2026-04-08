export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const {
      to, clientName, quoteNumber, total, validUntil,
      engineerName, engineerEmail, engineerPhone, pdfBase64,
    } = JSON.parse(event.body)

    if (!to || !pdfBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    const validStr = validUntil
      ? new Date(validUntil + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1c1c1e">
        <div style="background:#0a84ff;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">${engineerName}</h1>
        </div>
        <div style="background:#f2f2f7;padding:32px;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px">Dear ${clientName},</p>
          <p style="margin:0 0 16px">Please find attached your quote <strong>${quoteNumber}</strong> for <strong>£${parseFloat(total).toFixed(2)}</strong>.</p>
          ${validStr ? `<p style="margin:0 0 16px">This quote is valid until <strong>${validStr}</strong>.</p>` : ''}
          <p style="margin:0 0 24px">If you have any questions or would like to proceed, please get in touch.</p>
          <div style="border-top:1px solid #d1d1d6;padding-top:16px;font-size:13px;color:#636366">
            ${engineerName}${engineerPhone ? ` · ${engineerPhone}` : ''}${engineerEmail ? ` · ${engineerEmail}` : ''}
          </div>
        </div>
      </div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'quotes@vantrack.co.uk',
        to,
        subject: `Quote ${quoteNumber} from ${engineerName}`,
        html,
        attachments: [{
          filename: `Quote-${quoteNumber}.pdf`,
          content: pdfBase64,
        }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend error: ${err}`)
    }

    return { statusCode: 200, body: JSON.stringify({ sent: true }) }
  } catch (err) {
    console.error('Email error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
