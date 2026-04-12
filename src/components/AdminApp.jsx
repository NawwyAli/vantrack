import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtCurrency(amount) {
  return `£${Number(amount || 0).toFixed(2)}`
}

function StatusBadge({ status }) {
  const colors = {
    active: 'var(--green)',
    trialing: 'var(--blue)',
    expired: 'var(--red)',
    canceled: 'var(--red)',
  }
  const color = colors[status] || 'var(--text3)'
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px',
      background: `${color}22`, color, textTransform: 'capitalize',
    }}>
      {status || 'unknown'}
    </span>
  )
}

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [data, setData] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')

  const [actionState, setActionState] = useState({}) // { [userId]: { loading, error, result } }
  const [deleteConfirm, setDeleteConfirm] = useState(null) // userId pending delete confirm
  const [extendTarget, setExtendTarget] = useState(null) // userId for extend modal
  const [extendDays, setExtendDays] = useState(7)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s) checkAdmin(s)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) checkAdmin(s)
      else { setIsAdmin(false); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function checkAdmin(s) {
    setLoading(true)
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', s.user.id)
      .single()
    setIsAdmin(!!profile?.is_admin)
    setLoading(false)
  }

  const fetchData = useCallback(async () => {
    if (!session) return
    setDataLoading(true)
    setDataError('')
    try {
      const token = session.access_token
      const res = await fetch('/.netlify/functions/admin-data', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
    } catch (err) {
      setDataError(err.message)
    } finally {
      setDataLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (session && isAdmin) fetchData()
  }, [session, isAdmin, fetchData])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginError(error.message)
    setLoginLoading(false)
  }

  async function doAction(targetUserId, action, extra = {}) {
    setActionState(prev => ({ ...prev, [targetUserId]: { loading: true } }))
    try {
      const token = session.access_token
      const res = await fetch('/.netlify/functions/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, targetUserId, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Action failed')
      setActionState(prev => ({ ...prev, [targetUserId]: { result: 'Done' } }))
      fetchData()
    } catch (err) {
      setActionState(prev => ({ ...prev, [targetUserId]: { error: err.message } }))
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        Loading…
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)' }}>VanTrack</div>
            <div style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '4px' }}>Admin Panel</div>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {loginError && <div className="form-error" style={{ marginBottom: '12px' }}>{loginError}</div>}
            <button className="btn btn-primary" type="submit" disabled={loginLoading} style={{ width: '100%' }}>
              {loginLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text)', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🚫</div>
        <div style={{ fontSize: '20px', fontWeight: 600 }}>Access Denied</div>
        <div style={{ fontSize: '14px', color: 'var(--text2)' }}>Your account does not have admin access.</div>
        <button className="btn btn-ghost" onClick={handleSignOut}>Sign Out</button>
      </div>
    )
  }

  const stats = data?.stats
  const users = data?.users || []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Admin Panel</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>VanTrack</div>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: '13px', padding: '6px 14px' }} onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total Users', value: stats.total, color: 'var(--text)' },
              { label: 'Active', value: stats.active, color: 'var(--green)' },
              { label: 'Trialing', value: stats.trialing, color: 'var(--blue)' },
              { label: 'Expired', value: stats.expired, color: 'var(--red)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button className="btn btn-ghost" style={{ fontSize: '13px', padding: '6px 14px' }}
            onClick={fetchData} disabled={dataLoading}>
            {dataLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {dataError && (
          <div style={{ background: '#ff3b3022', color: 'var(--red)', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
            {dataError}
          </div>
        )}

        {/* User Table */}
        {users.length > 0 && (
          <div style={{ background: 'var(--surface)', borderRadius: '12px', overflow: 'hidden' }}>
            {users.map((u, i) => {
              const state = actionState[u.id] || {}
              const isLast = i === users.length - 1
              return (
                <div key={u.id} style={{ padding: '16px', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.email}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', alignItems: 'center' }}>
                        <StatusBadge status={u.subscriptionStatus} />
                        {u.trialEndsAt && (
                          <span style={{ fontSize: '11px', color: 'var(--text2)' }}>
                            Trial ends {fmtDate(u.trialEndsAt)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Joined {fmtDate(u.joinedAt)}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{u.clients} clients</span>
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{u.jobs} jobs</span>
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{fmtCurrency(u.revenue)} revenue</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                        disabled={state.loading}
                        onClick={() => { setExtendTarget(u.id); setExtendDays(7) }}
                      >
                        Extend Trial
                      </button>
                      <button
                        className="btn"
                        style={{ fontSize: '12px', padding: '5px 10px', background: '#ff3b3020', color: 'var(--red)', border: '1px solid #ff3b3040' }}
                        disabled={state.loading}
                        onClick={() => setDeleteConfirm(u.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {state.loading && (
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '8px' }}>Working…</div>
                  )}
                  {state.result && (
                    <div style={{ fontSize: '12px', color: 'var(--green)', marginTop: '8px' }}>{state.result}</div>
                  )}
                  {state.error && (
                    <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '8px' }}>{state.error}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!dataLoading && !dataError && users.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '60px 20px' }}>No users found.</div>
        )}
      </div>

      {/* Extend Trial Modal */}
      {extendTarget && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setExtendTarget(null) }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">Extend Trial</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
              {users.find(u => u.id === extendTarget)?.email}
            </div>
            <div className="form-group">
              <label className="form-label">Days to extend</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[7, 14, 30].map(d => (
                  <button
                    key={d}
                    className={`btn ${extendDays === d ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '13px', padding: '6px 16px' }}
                    onClick={() => setExtendDays(d)}
                  >
                    +{d}d
                  </button>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setExtendTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                doAction(extendTarget, 'extend_trial', { days: extendDays })
                setExtendTarget(null)
              }}>
                Extend +{extendDays} days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title" style={{ color: 'var(--red)' }}>Delete User?</div>
            <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '8px' }}>
              This will permanently delete the account for:
            </p>
            <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
              {users.find(u => u.id === deleteConfirm)?.email}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--red)', marginBottom: '0' }}>
              This action cannot be undone. All their data will be removed.
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn"
                style={{ background: 'var(--red)', color: '#fff' }}
                onClick={() => {
                  doAction(deleteConfirm, 'delete_user')
                  setDeleteConfirm(null)
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
