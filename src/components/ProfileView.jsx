import { useState, useRef } from 'react'

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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function ProfileView({ user, profile, engineerProfile, logoDataUrl, onSignOut, onResetPassword, onUpdateRole, onSaveEngineerProfile, onUploadLogo, onGenerateBookingSlug }) {
  const ep = engineerProfile || {}

  const [editingRole, setEditingRole] = useState(false)
  const [selectedRole, setSelectedRole] = useState(profile?.role || '')
  const [savingRole, setSavingRole] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState(false)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')
  const [bookingTogglingOn, setBookingTogglingOn] = useState(false)
  const [bookingDescSaving, setBookingDescSaving] = useState(false)
  const [bookingDesc, setBookingDesc] = useState(ep.booking_description || '')
  const [bookingDescEditing, setBookingDescEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState('')
  const logoInputRef = useRef()

  const [reviewUrl, setReviewUrl] = useState(ep.review_url || '')
  const [reviewUrlEditing, setReviewUrlEditing] = useState(false)
  const [reviewUrlSaving, setReviewUrlSaving] = useState(false)

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
    working_days: ep.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    working_hours_start: ep.working_hours_start || '08:00',
    working_hours_end: ep.working_hours_end || '17:00',
  })

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
      working_days: ep.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      working_hours_start: ep.working_hours_start || '08:00',
      working_hours_end: ep.working_hours_end || '17:00',
    })
    setEditingBusiness(true)
  }

  function toggleDay(day) {
    setBiz(p => ({
      ...p,
      working_days: p.working_days.includes(day)
        ? p.working_days.filter(d => d !== day)
        : [...p.working_days, day],
    }))
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

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    setLogoError('')
    try {
      await onUploadLogo(file)
    } catch (err) {
      setLogoError('Upload failed — ensure the "logos" storage bucket exists in Supabase.')
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
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

  const fmtWorkingHours = () => {
    const days = ep.working_days?.join(', ') || 'Mon–Fri'
    const start = ep.working_hours_start || '08:00'
    const end = ep.working_hours_end || '17:00'
    return `${days} · ${start}–${end}`
  }

  return (
    <div className="page">
      <div className="profile-section">
        <div className="profile-avatar">{user?.email?.[0]?.toUpperCase() || '?'}</div>
        <div className="profile-email">{user?.email}</div>
      </div>

      {error && <div className="auth-error" style={{ margin: '0 16px 12px' }}>{error}</div>}

      {/* Logo */}
      <div className="settings-group">
        <div className="settings-label">Business Logo</div>
        <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => !logoUploading && logoInputRef.current?.click()}>
          {logoDataUrl ? (
            <img src={logoDataUrl} alt="Business logo"
              style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: '8px', background: 'var(--surface2)' }} />
          ) : (
            <span style={{ fontSize: '13px', color: 'var(--text3)' }}>No logo — appears on quotes &amp; invoices</span>
          )}
          <span style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: 500 }}>
            {logoUploading ? 'Uploading…' : logoDataUrl ? 'Change' : 'Upload'}
          </span>
        </div>
        <input ref={logoInputRef} type="file" accept="image/png,image/jpeg"
          style={{ display: 'none' }} onChange={handleLogoUpload} />
        {logoError && <div className="auth-error" style={{ margin: '0 16px 8px', fontSize: '13px' }}>{logoError}</div>}
      </div>

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

            {/* Working hours */}
            <div className="form-section-label" style={{ marginTop: '12px', marginBottom: '8px' }}>Working Hours</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {DAYS.map(day => (
                <button key={day} type="button"
                  className={`filter-chip${biz.working_days.includes(day) ? ' active' : ''}`}
                  onClick={() => toggleDay(day)}>
                  {day}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div className="form-group">
                <label className="form-label">Start time</label>
                <input className="form-input" type="time" value={biz.working_hours_start}
                  onChange={e => setBiz(p => ({ ...p, working_hours_start: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">End time</label>
                <input className="form-input" type="time" value={biz.working_hours_end}
                  onChange={e => setBiz(p => ({ ...p, working_hours_end: e.target.value }))} />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '16px' }}>
              <button className="btn btn-ghost" onClick={() => setEditingBusiness(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveBusiness} disabled={savingBusiness}>
                {savingBusiness ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <button className="settings-row settings-row-btn" onClick={openBusiness}>
              <span>{ep.business_name || <span style={{ color: 'var(--text3)' }}>Not set — appears on PDFs</span>}</span>
              <ChevronRight />
            </button>
            {ep.working_days && (
              <div className="settings-row" style={{ cursor: 'default' }}>
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{fmtWorkingHours()}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Link */}
      <div className="settings-group">
        <div className="settings-label">Booking Link</div>
        {!ep.booking_slug ? (
          <button className="settings-row settings-row-btn" onClick={async () => {
            setBookingTogglingOn(true)
            try { await onGenerateBookingSlug() } catch {}
            finally { setBookingTogglingOn(false) }
          }} disabled={bookingTogglingOn}>
            <span style={{ color: 'var(--blue)' }}>{bookingTogglingOn ? 'Activating…' : 'Enable Online Booking'}</span>
            <ChevronRight />
          </button>
        ) : (
          <>
            {/* Enable / disable toggle */}
            <div className="settings-row" style={{ cursor: 'default' }}>
              <span>Booking enabled</span>
              <button type="button" className={`toggle-btn${ep.booking_enabled ? ' on' : ''}`}
                onClick={() => onSaveEngineerProfile({ booking_enabled: !ep.booking_enabled })}>
                <span className="toggle-knob" />
              </button>
            </div>
            {/* URL + copy */}
            {ep.booking_enabled && (
              <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px', cursor: 'default' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Your booking link</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <div style={{ flex: 1, fontSize: '12px', color: 'var(--blue)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                    {`${window.location.origin}/book/${ep.booking_slug}`}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => {
                    navigator.clipboard?.writeText(`${window.location.origin}/book/${ep.booking_slug}`)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
            {/* Custom description */}
            <div style={{ padding: '8px 16px 12px' }}>
              <div className="form-label" style={{ marginBottom: '6px' }}>
                Booking page message <span style={{ color: 'var(--text3)' }}>(optional)</span>
              </div>
              {bookingDescEditing ? (
                <>
                  <textarea className="form-input" rows={3}
                    placeholder="e.g. Based in Manchester. Covering all gas & heating work."
                    value={bookingDesc}
                    onChange={e => setBookingDesc(e.target.value)}
                    style={{ resize: 'vertical', minHeight: '72px', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setBookingDescEditing(false); setBookingDesc(ep.booking_description || '') }}>Cancel</button>
                    <button className="btn btn-primary btn-sm" disabled={bookingDescSaving} onClick={async () => {
                      setBookingDescSaving(true)
                      try { await onSaveEngineerProfile({ booking_description: bookingDesc }); setBookingDescEditing(false) } catch {}
                      finally { setBookingDescSaving(false) }
                    }}>
                      {bookingDescSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </>
              ) : (
                <button className="settings-row settings-row-btn" style={{ margin: 0, padding: '6px 0', background: 'transparent', border: 'none', width: '100%', justifyContent: 'space-between' }}
                  onClick={() => { setBookingDesc(ep.booking_description || ''); setBookingDescEditing(true) }}>
                  <span style={{ fontSize: '13px', color: ep.booking_description ? 'var(--text2)' : 'var(--text3)' }}>
                    {ep.booking_description || 'Add a message for clients…'}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path d="M14.5 2.5L17.5 5.5L7 16H4V13L14.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Follow-ups & Reminders */}
      <div className="settings-group">
        <div className="settings-label">Follow-ups &amp; Reminders</div>

        {/* SMS reminders toggle */}
        <div className="settings-row" style={{ cursor: 'default' }}>
          <div>
            <div>Auto SMS Reminders</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
              Send clients an SMS the day before their job
            </div>
          </div>
          <button
            type="button"
            className={`toggle-btn${ep.auto_sms_reminders ? ' on' : ''}`}
            onClick={() => onSaveEngineerProfile({ auto_sms_reminders: !ep.auto_sms_reminders })}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        {/* Quote follow-up days */}
        <div className="settings-row" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <div>
            <div>Auto Quote Follow-up</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
              Days after sending before a follow-up email is sent (0 = disabled)
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {[0, 2, 3, 5, 7].map(d => (
              <button
                key={d}
                className={`filter-chip${(ep.quote_followup_days || 0) === d ? ' active' : ''}`}
                onClick={() => onSaveEngineerProfile({ quote_followup_days: d })}
              >
                {d === 0 ? 'Off' : `${d}d`}
              </button>
            ))}
          </div>
        </div>

        {/* Review URL */}
        <div style={{ padding: '8px 16px 12px' }}>
          <div className="form-label" style={{ marginBottom: '6px' }}>
            Review Link <span style={{ color: 'var(--text3)' }}>(Google, Trustpilot, etc.)</span>
          </div>
          {reviewUrlEditing ? (
            <>
              <input
                className="form-input"
                type="url"
                placeholder="https://g.page/r/your-review-link"
                value={reviewUrl}
                onChange={e => setReviewUrl(e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setReviewUrlEditing(false); setReviewUrl(ep.review_url || '') }}>Cancel</button>
                <button className="btn btn-primary btn-sm" disabled={reviewUrlSaving} onClick={async () => {
                  setReviewUrlSaving(true)
                  try { await onSaveEngineerProfile({ review_url: reviewUrl }); setReviewUrlEditing(false) } catch {}
                  finally { setReviewUrlSaving(false) }
                }}>
                  {reviewUrlSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <button
              className="settings-row settings-row-btn"
              style={{ margin: 0, padding: '6px 0', background: 'transparent', border: 'none', width: '100%', justifyContent: 'space-between' }}
              onClick={() => { setReviewUrl(ep.review_url || ''); setReviewUrlEditing(true) }}
            >
              <span style={{ fontSize: '13px', color: ep.review_url ? 'var(--blue)' : 'var(--text3)', wordBreak: 'break-all', textAlign: 'left' }}>
                {ep.review_url || 'Add your review link…'}
              </span>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                <path d="M14.5 2.5L17.5 5.5L7 16H4V13L14.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
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
