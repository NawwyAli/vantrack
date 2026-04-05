const Stripe = require('stripe')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
    const { user_id, email } = JSON.parse(event.body)

    if (!user_id || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing user_id or email' }) }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.APP_URL}/?payment=success`,
      cancel_url: `${process.env.APP_URL}/`,
      metadata: { user_id },
      subscription_data: { metadata: { user_id } },
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    }
  } catch (err) {
    console.error('Stripe error:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
