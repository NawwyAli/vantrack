import { useState, useEffect } from 'react'

export default function BookingPage({ slug }) {
  const [pageInfo, setPageInfo] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [description, setDescription] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetch(`/.netlify/functions/get-booking-page?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setNotFound(true) }
        else { setPageInfo(data) }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  function validate() {
    const errs = {}
    if (!clientName.trim()) errs.clientName = 'Required'
    if (!clientEmail.trim()) errs.clientEmail = 'Required'
    if (!description.trim()) errs.description = 'Required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/submit-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim() || null,
          description: description.trim(),
          preferredDate: preferredDate || null,
          message: message.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send booking request')
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="booking-page">
        <div className="booking-card">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔧</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Booking page not found
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text2)' }}>
              This booking link is not active or doesn't exist.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="booking-page">
        <div className="booking-card">
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
              Request sent!
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6 }}>
              Thanks, {clientName.split(' ')[0]}. {pageInfo.business_name || 'The engineer'} will be in touch to confirm your appointment.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-page">
      <div className="booking-card">
        {/* Header */}
        <div className="booking-header">
          {pageInfo.logo_url && (
            <img src={pageInfo.logo_url} alt="Logo" className="booking-logo" />
          )}
          <div>
            <div className="booking-business-name">{pageInfo.business_name || 'Book an Appointment'}</div>
            <div className="booking-powered">Powered by VanTrack</div>
          </div>
        </div>

        {pageInfo.booking_description && (
          <p className="booking-description">{pageInfo.booking_description}</p>
        )}

        <div className="booking-divider" />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Your name *</label>
            <input className={`form-input${errors.clientName ? ' input-error' : ''}`}
              type="text" placeholder="Full name"
              value={clientName} onChange={e => setClientName(e.target.value)} />
            {errors.clientName && <div className="form-error">{errors.clientName}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className={`form-input${errors.clientEmail ? ' input-error' : ''}`}
              type="email" placeholder="your@email.com"
              value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
            {errors.clientEmail && <div className="form-error">{errors.clientEmail}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
            <input className="form-input" type="tel" placeholder="07700 000000"
              value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">What do you need? *</label>
            <textarea className={`form-input${errors.description ? ' input-error' : ''}`}
              rows={3} placeholder="e.g. Annual boiler service and CP12 certificate"
              style={{ resize: 'vertical', minHeight: '80px' }}
              value={description} onChange={e => setDescription(e.target.value)} />
            {errors.description && <div className="form-error">{errors.description}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Preferred date <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
            <input className="form-input" type="date"
              min={new Date().toISOString().split('T')[0]}
              value={preferredDate} onChange={e => setPreferredDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Additional notes <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
            <textarea className="form-input" rows={2}
              placeholder="Any extra details, access instructions, etc."
              style={{ resize: 'vertical', minHeight: '64px' }}
              value={message} onChange={e => setMessage(e.target.value)} />
          </div>

          {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Booking Request'}
          </button>
        </form>

        {pageInfo.phone && (
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text3)' }}>
            Prefer to call? <a href={`tel:${pageInfo.phone}`} style={{ color: 'var(--blue)' }}>{pageInfo.phone}</a>
          </div>
        )}
      </div>
    </div>
  )
}
