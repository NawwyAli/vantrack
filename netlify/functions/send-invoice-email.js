export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const {
      to, clientName, invoiceNumber, total, dueDate, paymentLinkUrl,
      engineerName, engineerEmail, engineerPhone, pdfBase64,
    } = JSON.parse(event.body)

    if (!to || !pdfBase64) return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }

    const dueDateStr = dueDate
      ? new Date(dueDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    const paymentSection = paymentLinkUrl
      ? `<p style="margin:0 0 16px">
           <a href="${paymentLinkUrl}" style="display:inline-block;background:#0a84ff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
             Pay Online →
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
          <p style="margin:0 0 16px">Please find attached invoice <strong>${invoiceNumber}</strong> for <strong>£${parseFloat(total).toFixed(2)}</strong>.</p>
          ${dueDateStr ? `<p style="margin:0 0 16px">Payment is due by <strong>${dueDateStr}</strong>.</p>` : ''}
          ${paymentSection}
          <p style="margin:0 0 24px">If you have any questions, please get in touch.</p>
          <div style="border-top:1px solid #d1d1d6;padding-top:16px;font-size:13px;color:#636366">
            ${engineerName}${engineerPhone ? ` · ${engineerPhone}` : ''}${engineerEmail ? ` · ${engineerEmail}` : ''}
          </div>
        </div>
      </div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'invoices@vantrack.co.uk',
        to,
        subject: `Invoice ${invoiceNumber} from ${engineerName}`,
        html,
        attachments: [{ filename: `Invoice-${invoiceNumber}.pdf`, content: pdfBase64 }],
      }),
    })

    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`)
    return { statusCode: 200, body: JSON.stringify({ sent: true }) }
  } catch (err) {
    console.error('Invoice email error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
