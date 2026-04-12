import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const authHeader = event.headers.authorization || event.headers.Authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing token' }) }
  }
  const token = authHeader.slice(7)

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured' }) }
  }

  // Verify caller's JWT and is_admin
  const userClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })
  const { data: { user }, error: authErr } = await userClient.auth.getUser(token)
  if (authErr || !user) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) }

  const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!callerProfile?.is_admin) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) }
  }

  try {
    const { action, targetUserId, days } = JSON.parse(event.body)

    if (!targetUserId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing targetUserId' }) }

    // Prevent admin from acting on themselves
    if (targetUserId === user.id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cannot perform action on your own account' }) }
    }

    if (action === 'extend_trial') {
      const extendDays = Number(days) || 7
      // Get current trial_ends_at; base from now if expired/missing
      const { data: profile } = await adminClient
        .from('profiles')
        .select('trial_ends_at')
        .eq('id', targetUserId)
        .single()

      const base = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : new Date()
      if (base < new Date()) base.setTime(new Date().getTime()) // reset base to now if in past
      base.setDate(base.getDate() + extendDays)

      const { error } = await adminClient
        .from('profiles')
        .update({ trial_ends_at: base.toISOString(), subscription_status: 'trialing' })
        .eq('id', targetUserId)

      if (error) throw error
      return { statusCode: 200, body: JSON.stringify({ ok: true }) }
    }

    if (action === 'delete_user') {
      const { error } = await adminClient.auth.admin.deleteUser(targetUserId)
      if (error) throw error
      return { statusCode: 200, body: JSON.stringify({ ok: true }) }
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) }
  } catch (err) {
    console.error('admin-action error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
