export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { to, clientName, jobDescription, engineerName, engineerEmail, engineerPhone, reviewUrl } = JSON.parse(event.body)
    if (!to) return { statusCode: 400, body: JSON.stringify({ error: 'Missing recipient email' }) }

    const reviewSection = reviewUrl
      ? `<p style="margin:0 0 20px">
           <a href="${reviewUrl}"
              style="display:inline-block;background:#34c759;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
             Leave a Review →
           </a>
         </p>`
      : ''

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1c1c1e">
        <div style="background:#0a84ff;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">${engineerName}</h1>
        </div>
        <div style="background:#f2f2f7;padding:32px;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px">Dear ${clientName},</p>
          <p style="margin:0 0 16px">
            Thank you for choosing <strong>${engineerName}</strong>${jobDescription ? ` for your recent <em>${jobDescription}</em>` : ''}.
            We really appreciate your business!
          </p>
          <p style="margin:0 0 20px">
            We'd love to hear how we did. If you have a moment, leaving a review makes a huge difference
            to our small business and helps other customers find us.
          </p>
          ${reviewSection}
          <p style="margin:0 0 24px">
            If you have any questions or need anything else, please don't hesitate to get in touch.
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
        subject: `How did we do? — ${engineerName}`,
        html,
      }),
    })

    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`)
    return { statusCode: 200, body: JSON.stringify({ sent: true }) }
  } catch (err) {
    console.error('Review request error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
