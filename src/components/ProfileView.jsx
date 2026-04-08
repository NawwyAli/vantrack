import { useState } from 'react'

const TRADE_LABELS = {
  gas_engineer: '🔥 Gas Engineer',
  plumber: '🔧 Plumber',
  both: '⚡ Both',
}

const ROLES = [
  { value: 'gas_engineer', label: '🔥 Gas Engineer' },
  { value: 'plumber', label: '🔧 Plumber' },
  { value: 'both', label: '⚡ Both' },
]

export default function ProfileView({ user, profile, onSignOut, onResetPassword, onUpdateRole }) {
  const [editingRole, setEditingRole] = useState(false)
  const [selectedRole, setSelectedRole] = useState(profile?.role || '')
  const [savingRole, setSavingRole] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState('')

  function getSubscriptionBadge() {
    if (!profile) return null
    const status = profile.subscription_status
    if (status === 'active') {
      return <span className="status-badge status-active">Active</span>
    }
    if (status === 'trialing' && profile.trial_ends_at) {
      const daysLeft = Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000)
      if (daysLeft > 0) {
        return <span className="status-badge status-trial">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left in trial</span>
      }
    }
    return <span className="status-badge status-expired">Expired</span>
  }

  async function handleSaveRole() {
    if (!selectedRole || selectedRole === profile?.role) { setEditingRole(false); return }
    setSavingRole(true)
    try {
      await onUpdateRole(selectedRole)
      setEditingRole(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingRole(false)
    }
  }

  async function handleResetPassword() {
    try {
      await onResetPassword(user.email)
      setResetSent(true)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to open billing portal')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setPortalLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="profile-section">
        <div className="profile-avatar">
          {user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="profile-email">{user?.email}</div>
      </div>

      {error && <div className="auth-error" style={{ margin: '0 16px 12px' }}>{error}</div>}

      {/* Trade */}
      <div className="settings-group">
        <div className="settings-label">Trade</div>
        {editingRole ? (
          <div style={{ padding: '12px 16px' }}>
            <div className="role-grid" style={{ marginBottom: '12px' }}>
              {ROLES.map(r => (
                <button key={r.value} type="button"
                  className={`role-btn${selectedRole === r.value ? ' active' : ''}`}
                  onClick={() => setSelectedRole(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => { setEditingRole(false); setSelectedRole(profile?.role || '') }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRole} disabled={savingRole}>
                {savingRole ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-row" onClick={() => setEditingRole(true)}>
            <span>{TRADE_LABELS[profile?.role] || '—'}</span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M14.5 2.5L17.5 5.5L7 16H4V13L14.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Subscription */}
      <div className="settings-group">
        <div className="settings-label">Subscription</div>
        <div className="settings-row" style={{ cursor: 'default' }}>
          <span>Status</span>
          {getSubscriptionBadge()}
        </div>
        {profile?.subscription_status === 'active' && (
          <button className="settings-row settings-row-btn" onClick={handleManageBilling} disabled={portalLoading}>
            <span>{portalLoading ? 'Redirecting…' : 'Manage / Cancel Subscription'}</span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Account */}
      <div className="settings-group">
        <div className="settings-label">Account</div>
        {resetSent ? (
          <div className="settings-row" style={{ cursor: 'default', color: 'var(--green)' }}>
            Reset email sent — check your inbox
          </div>
        ) : (
          <button className="settings-row settings-row-btn" onClick={handleResetPassword}>
            <span>Change Password</span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <button className="settings-row settings-row-btn settings-row-danger" onClick={onSignOut}>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
