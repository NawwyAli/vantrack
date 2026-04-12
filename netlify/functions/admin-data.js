import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' }

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

  // Verify the caller's JWT and check is_admin
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
    // Fetch all profiles
    const { data: profiles, error: profErr } = await adminClient
      .from('profiles')
      .select('id, subscription_status, trial_ends_at, created_at')

    if (profErr) throw profErr

    // Fetch auth users list via admin API
    const { data: authData, error: authListErr } = await adminClient.auth.admin.listUsers()
    if (authListErr) throw authListErr
    const authUsers = authData?.users || []
    const authMap = {}
    for (const u of authUsers) authMap[u.id] = u

    // Fetch usage counts
    const { data: clientCounts } = await adminClient
      .from('clients')
      .select('user_id')
    const { data: jobCounts } = await adminClient
      .from('jobs')
      .select('user_id')
    const { data: invoices } = await adminClient
      .from('invoices')
      .select('user_id, total, status')

    const clientMap = {}
    for (const r of clientCounts || []) clientMap[r.user_id] = (clientMap[r.user_id] || 0) + 1
    const jobMap = {}
    for (const r of jobCounts || []) jobMap[r.user_id] = (jobMap[r.user_id] || 0) + 1
    const revenueMap = {}
    for (const r of invoices || []) {
      if (r.status === 'paid') revenueMap[r.user_id] = (revenueMap[r.user_id] || 0) + Number(r.total)
    }

    const users = profiles.map(p => ({
      id: p.id,
      email: authMap[p.id]?.email || '—',
      subscriptionStatus: p.subscription_status || 'trialing',
      trialEndsAt: p.trial_ends_at || null,
      joinedAt: authMap[p.id]?.created_at || p.created_at || null,
      clients: clientMap[p.id] || 0,
      jobs: jobMap[p.id] || 0,
      revenue: revenueMap[p.id] || 0,
    }))

    // Stats
    const total = users.length
    const active = users.filter(u => u.subscriptionStatus === 'active').length
    const trialing = users.filter(u => u.subscriptionStatus === 'trialing').length
    const expired = users.filter(u => u.subscriptionStatus === 'expired' || u.subscriptionStatus === 'canceled').length

    return {
      statusCode: 200,
      body: JSON.stringify({ stats: { total, active, trialing, expired }, users }),
    }
  } catch (err) {
    console.error('admin-data error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
