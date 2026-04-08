import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const sig = event.headers['stripe-signature']
  let stripeEvent

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  const obj = stripeEvent.data.object

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const userId = obj.metadata?.user_id
        if (userId) {
          await supabase.from('profiles').update({
            subscription_status: 'active',
            stripe_customer_id: obj.customer,
            stripe_subscription_id: obj.subscription,
          }).eq('id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', obj.customer)
        if (profiles?.[0]) {
          await supabase.from('profiles')
            .update({ subscription_status: 'canceled' })
            .eq('id', profiles[0].id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', obj.customer)
        if (profiles?.[0]) {
          await supabase.from('profiles')
            .update({ subscription_status: 'expired' })
            .eq('id', profiles[0].id)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`)
    }
  } catch (err) {
    console.error('Handler error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
