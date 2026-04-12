export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { to, clientName, properties, engineerName, engineerEmail, engineerPhone } = JSON.parse(event.body)
    if (!to) return { statusCode: 400, body: JSON.stringify({ error: 'Missing recipient email' }) }

    function fmtDate(dateStr) {
      if (!dateStr) return '—'
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    }

    function getExpiry(issueDate) {
      if (!issueDate) return null
      const d = new Date(issueDate + 'T00:00:00')
      d.setFullYear(d.getFullYear() + 1)
      return d.toISOString().slice(0, 10)
    }

    function statusLabel(issueDate) {
      if (!issueDate) return { text: 'No Certificate', color: '#636366' }
      const expiry = new Date(issueDate + 'T00:00:00')
      expiry.setFullYear(expiry.getFullYear() + 1)
      const diffDays = Math.ceil((expiry - new Date()) / 86400000)
      if (diffDays <= 0) return { text: 'Expired', color: '#ff3b30' }
      if (diffDays <= 90) return { text: `Due in ${diffDays} days`, color: '#ff9f0a' }
      return { text: 'Valid', color: '#34c759' }
    }

    const rows = (properties || []).map(p => {
      const certDate = p.certificate?.issueDate || null
      const expiry = getExpiry(certDate)
      const { text, color } = statusLabel(certDate)
      return `
        <tr style="border-bottom:1px solid #e5e5ea">
          <td style="padding:10px 12px;font-size:14px;color:#1c1c1e">${p.address}</td>
          <td style="padding:10px 12px;font-size:14px;color:#1c1c1e;white-space:nowrap">${fmtDate(certDate)}</td>
          <td style="padding:10px 12px;font-size:14px;color:#1c1c1e;white-space:nowrap">${fmtDate(expiry)}</td>
          <td style="padding:10px 12px;font-size:13px;font-weight:600;color:${color};white-space:nowrap">${text}</td>
        </tr>`
    }).join('')

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1c1c1e">
        <div style="background:#0a84ff;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">${engineerName}</h1>
        </div>
        <div style="background:#f2f2f7;padding:32px;border-radius:0 0 8px 8px">
          <p style="margin:0 0 8px">Dear ${clientName},</p>
          <p style="margin:0 0 24px;color:#3a3a3c">
            Please find below a summary of your gas safety certificate status for all registered properties.
          </p>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e5ea">
            <thead>
              <tr style="background:#f2f2f7">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#636366;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Property</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#636366;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Issue Date</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#636366;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Expiry Date</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#636366;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin:24px 0 0;font-size:13px;color:#636366">
            If you have any questions or need to book a service, please get in touch.
          </p>
          <div style="border-top:1px solid #d1d1d6;padding-top:16px;margin-top:16px;font-size:13px;color:#636366">
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
        subject: `Your Gas Safety Certificate Summary — ${engineerName}`,
        html,
      }),
    })

    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`)
    return { statusCode: 200, body: JSON.stringify({ sent: true }) }
  } catch (err) {
    console.error('Cert summary error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
