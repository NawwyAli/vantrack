import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  const { slug } = event.queryStringParameters || {}
  if (!slug) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing slug' }) }
  }

  const { data, error } = await supabase
    .from('engineer_profiles')
    .select('business_name, logo_url, booking_description, booking_enabled, phone')
    .eq('booking_slug', slug)
    .single()

  if (error || !data) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Booking page not found' }) }
  }

  if (!data.booking_enabled) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Booking is not available' }) }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      business_name: data.business_name,
      logo_url: data.logo_url,
      booking_description: data.booking_description,
      phone: data.phone,
    }),
  }
}
