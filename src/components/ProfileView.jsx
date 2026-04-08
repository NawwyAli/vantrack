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

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function ProfileView({ user, profile, engineerProfile, onSignOut, onResetPassword, onUpdateRole, onSaveEngineerProfile }) {
  const [editingRole, setEditingRole] = useState(false)
  const [selectedRole, setSelectedRole] = useState(profile?.role || '')
  const [savingRole, setSavingRole] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState(false)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState('')

  // Business profile fields
  const ep = engineerProfile || {}
  const [biz, setBiz] = useState({
    business_name: ep.business_name || '',
    business_address: ep.business_address || '',
    phone: ep.phone || '',
    email: ep.email || '',
    gas_safe_number: ep.gas_safe_number || '',
    vat_registered: ep.vat_registered || false,
    vat_number: ep.vat_number || '',
    bank_name: ep.bank_name || '',
    bank_sort_code: ep.bank_sort_code || '',
    bank_account_number: ep.bank_account_number || '',
  })

  // Keep biz in sync with engineerProfile when it loads/changes
  function openBusiness() {
    setBiz({
      business_name: ep.business_name || '',
      business_address: ep.business_address || '',
      phone: ep.phone || '',
      email: ep.email || '',
      gas_safe_number: ep.gas_safe_number || '',
      vat_registered: ep.vat_registered || false,
      vat_number: ep.vat_number || '',
      bank_name: ep.bank_name || '',
      bank_sort_code: ep.bank_sort_code || '',
      bank_account_number: ep.bank_account_number || '',
    })
    setEditingBusiness(true)
  }

  function getSubscriptionBadge() {
    if (!profile) return null
    const status = profile.subscription_status
    if (status === 'active') return <span className="status-badge status-active">Active</span>
    if (status === 'trialing' && profile.trial_ends_at) {
      const daysLeft = Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000)
      if (daysLeft > 0) return <span className="status-badge status-trial">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left in trial</span>
    }
    return <span className="status-badge status-expired">Expired</span>
  }

  async function handleSaveRole() {
    if (!selectedRole || selectedRole === profile?.role) { setEditingRole(false); return }
    setSavingRole(true)
    try { await onUpdateRole(selectedRole); setEditingRole(false) }
    catch (err) { setError(err.message) }
    finally { setSavingRole(false) }
  }

  async function handleSaveBusiness() {
    setSavingBusiness(true)
    try { await onSaveEngineerProfile(biz); setEditingBusiness(false) }
    catch (err) { setError(err.message) }
    finally { setSavingBusiness(false) }
  }

  async function handleResetPassword() {
    try { await onResetPassword(user.email); setResetSent(true) }
    catch (err) { setError(err.message) }
  }

  async function handleManageBilling() {
    setPortalLoading(true); setError('')
    try {
      const res = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to open billing portal')
      window.location.href = data.url
    } catch (err) { setError(err.message); setPortalLoading(false) }
  }

  return (
    <div className="page">
      <div className="profile-section">
        <div className="profile-avatar">{user?.email?.[0]?.toUpperCase() || '?'}</div>
        <div className="profile-email">{user?.email}</div>
      </div>

      {error && <div className="auth-error" style={{ margin: '0 16px 12px' }}>{error}</div>}

      {/* Business Details */}
      <div className="settings-group">
        <div className="settings-label">Business Details</div>
        {editingBusiness ? (
          <div style={{ padding: '12px 16px' }}>
            {[
              { key: 'business_name', label: 'Business Name', placeholder: 'Your business name' },
              { key: 'business_address', label: 'Business Address', placeholder: 'Full address' },
              { key: 'phone', label: 'Phone', placeholder: 'Phone number', type: 'tel' },
              { key: 'email', label: 'Business Email', placeholder: 'Business email', type: 'email' },
              { key: 'gas_safe_number', label: 'Gas Safe Reg. No.', placeholder: 'Optional' },
            ].map(f => (
              <div className="form-group" key={f.key} style={{ marginBottom: '10px' }}>
                <label className="form-label">{f.label}</label>
                <input className="form-input" type={f.type || 'text'} placeholder={f.placeholder}
                  value={biz[f.key]} onChange={e => setBiz(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}

            {/* VAT toggle */}
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>VAT Registered</span>
                <button type="button" className={`toggle-btn${biz.vat_registered ? ' on' : ''}`}
                  onClick={() => setBiz(p => ({ ...p, vat_registered: !p.vat_registered }))}>
                  <span className="toggle-knob" />
                </button>
              </label>
              {biz.vat_registered && (
                <input className="form-input" style={{ marginTop: '8px' }} type="text"
                  placeholder="VAT number" value={biz.vat_number}
                  onChange={e => setBiz(p => ({ ...p, vat_number: e.target.value }))} />
              )}
            </div>

            {/* Bank details */}
            <div className="form-section-label" style={{ marginTop: '12px', marginBottom: '8px' }}>Bank Details (for invoices)</div>
            {[
              { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. Lloyds' },
              { key: 'bank_sort_code', label: 'Sort Code', placeholder: '00-00-00' },
              { key: 'bank_account_number', label: 'Account Number', placeholder: '12345678' },
            ].map(f => (
              <div className="form-group" key={f.key} style={{ marginBottom: '10px' }}>
                <label className="form-label">{f.label}</label>
                <input className="form-input" type="text" placeholder={f.placeholder}
                  value={biz[f.key]} onChange={e => setBiz(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}

            <div className="form-actions" style={{ marginTop: '16px' }}>
              <button className="btn btn-ghost" onClick={() => setEditingBusiness(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveBusiness} disabled={savingBusiness}>
                {savingBusiness ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <button className="settings-row settings-row-btn" onClick={openBusiness}>
            <span>{ep.business_name || <span style={{ color: 'var(--text3)' }}>Not set — appears on PDFs</span>}</span>
            <ChevronRight />
          </button>
        )}
      </div>

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
              <button className="btn btn-primary" onClick={handleSaveRole} disabled={savingRole}>{savingRole ? 'Saving…' : 'Save'}</button>
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
          <span>Status</span>{getSubscriptionBadge()}
        </div>
        {profile?.subscription_status === 'active' && (
          <button className="settings-row settings-row-btn" onClick={handleManageBilling} disabled={portalLoading}>
            <span>{portalLoading ? 'Redirecting…' : 'Manage / Cancel Subscription'}</span>
            <ChevronRight />
          </button>
        )}
      </div>

      {/* Account */}
      <div className="settings-group">
        <div className="settings-label">Account</div>
        {resetSent ? (
          <div className="settings-row" style={{ cursor: 'default', color: 'var(--green)' }}>Reset email sent — check your inbox</div>
        ) : (
          <button className="settings-row settings-row-btn" onClick={handleResetPassword}>
            <span>Change Password</span><ChevronRight />
          </button>
        )}
        <button className="settings-row settings-row-btn settings-row-danger" onClick={onSignOut}>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
