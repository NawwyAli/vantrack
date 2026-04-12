export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { to, clientName, jobDescription, jobDate, jobTime, engineerName, engineerPhone } = JSON.parse(event.body)
    if (!to) return { statusCode: 400, body: JSON.stringify({ error: 'Missing recipient phone number' }) }

    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
    const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN
    const TWILIO_FROM        = process.env.TWILIO_FROM_NUMBER

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Twilio credentials not configured' }) }
    }

    // Normalise UK mobile numbers: 07xxx → +447xxx
    let toNorm = to.replace(/\s+/g, '')
    if (toNorm.startsWith('07')) toNorm = '+44' + toNorm.slice(1)
    else if (toNorm.startsWith('00')) toNorm = '+' + toNorm.slice(2)

    const dateStr = jobDate
      ? new Date(jobDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
      : ''
    const timeStr = jobTime ? ` at ${jobTime}` : ''
    const contactStr = engineerPhone ? ` Call ${engineerPhone} for queries.` : ''

    const body =
      `Hi ${clientName}, reminder from ${engineerName}: ` +
      `${jobDescription}${dateStr ? ` scheduled for ${dateStr}${timeStr}` : ''}.` +
      `${contactStr} Reply STOP to opt out.`

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: TWILIO_FROM, To: toNorm, Body: body }).toString(),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Twilio error')
    }

    return { statusCode: 200, body: JSON.stringify({ sent: true }) }
  } catch (err) {
    console.error('SMS reminder error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
