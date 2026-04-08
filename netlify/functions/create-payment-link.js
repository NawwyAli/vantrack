import Stripe from 'stripe'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { invoice_id, user_id, total, invoice_number } = JSON.parse(event.body)

    if (!invoice_id || !total) return { statusCode: 400, body: JSON.stringify({ error: 'Missing invoice_id or total' }) }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: `Invoice ${invoice_number}` },
          unit_amount: Math.round(parseFloat(total) * 100),
        },
        quantity: 1,
      }],
      success_url: `${process.env.APP_URL}/?invoice_paid=${invoice_id}`,
      cancel_url: `${process.env.APP_URL}/`,
      metadata: { invoice_id, user_id: user_id || '' },
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    }
  } catch (err) {
    console.error('Payment link error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
