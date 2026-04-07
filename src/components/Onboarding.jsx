import { useState } from 'react'

const today = new Date().toISOString().split('T')[0]

export default function Onboarding({ onComplete, onSkip, saving, onAddClient }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [propertyAddress, setPropertyAddress] = useState('')
  const [certIssueDate, setCertIssueDate] = useState('')
  const [errors, setErrors] = useState({})

  const clearErr = f => setErrors(p => ({ ...p, [f]: undefined }))

  async function handleAddClient() {
    const errs = {}
    if (!name.trim()) errs.name = 'Required'
    if (!address.trim()) errs.address = 'Required'
    if (!phone.trim()) errs.phone = 'Required'
    if (!email.trim()) errs.email = 'Required'
    if (!propertyAddress.trim()) errs.propertyAddress = 'Required'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    await onAddClient({
      name: name.trim(), address: address.trim(),
      phone: phone.trim(), email: email.trim(),
      propertyAddress: propertyAddress.trim(),
      certIssueDate: certIssueDate || null,
    })
    setStep(3)
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">

        {/* Progress dots */}
        <div className="onboarding-dots">
          {[1, 2, 3].map(n => (
            <div key={n} className={`onboarding-dot${step === n ? ' active' : step > n ? ' done' : ''}`} />
          ))}
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="onboarding-step">
            <div className="onboarding-icon">🚐</div>
            <h1 className="onboarding-title">Welcome to VanTrack</h1>
            <p className="onboarding-subtitle">Your CP12 certificate tracker — built for gas engineers and plumbers.</p>

            <div className="onboarding-features">
              {[
                { icon: '🏠', text: 'Track CP12 certificates for all your landlord clients' },
                { icon: '🚦', text: 'Traffic light dashboard — see what needs attention at a glance' },
                { icon: '📧', text: 'Automatic email reminders to landlords before expiry' },
                { icon: '📱', text: 'Works on your phone, tablet, or desktop' },
              ].map(f => (
                <div key={f.text} className="onboarding-feature">
                  <span className="onboarding-feature-icon">{f.icon}</span>
                  <span className="onboarding-feature-text">{f.text}</span>
                </div>
              ))}
            </div>

            <button className="btn btn-primary onboarding-btn" onClick={() => setStep(2)}>
              Get Started →
            </button>
            <button className="legal-link" style={{ display: 'block', margin: '12px auto 0' }} onClick={onSkip}>
              Skip for now
            </button>
          </div>
        )}

        {/* Step 2 — Add first client */}
        {step === 2 && (
          <div className="onboarding-step">
            <div className="onboarding-icon">👤</div>
            <h1 className="onboarding-title">Add Your First Client</h1>
            <p className="onboarding-subtitle">Enter a landlord's details and their first rental property.</p>

            <div className="onboarding-form">
              <div className="form-section-label">Landlord Details</div>

              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className={`form-input${errors.name ? ' input-error' : ''}`} type="text"
                  placeholder="Full name" value={name}
                  onChange={e => { setName(e.target.value); clearErr('name') }} />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Contact Address *</label>
                <input className={`form-input${errors.address ? ' input-error' : ''}`} type="text"
                  placeholder="Landlord's contact address" value={address}
                  onChange={e => { setAddress(e.target.value); clearErr('address') }} />
                {errors.address && <div className="form-error">{errors.address}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className={`form-input${errors.phone ? ' input-error' : ''}`} type="tel"
                  placeholder="Phone number" value={phone}
                  onChange={e => { setPhone(e.target.value); clearErr('phone') }} />
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className={`form-input${errors.email ? ' input-error' : ''}`} type="email"
                  placeholder="Email address" value={email}
                  onChange={e => { setEmail(e.target.value); clearErr('email') }} />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>

              <div className="form-section-label" style={{ marginTop: '20px' }}>First Property &amp; CP12</div>

              <div className="form-group">
                <label className="form-label">Property Address *</label>
                <input className={`form-input${errors.propertyAddress ? ' input-error' : ''}`} type="text"
                  placeholder="Rental property address" value={propertyAddress}
                  onChange={e => { setPropertyAddress(e.target.value); clearErr('propertyAddress') }} />
                {errors.propertyAddress && <div className="form-error">{errors.propertyAddress}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">CP12 Issue Date <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
                <input className="form-input" type="date" value={certIssueDate} max={today}
                  onChange={e => setCertIssueDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}
                onClick={handleAddClient} disabled={saving}>
                {saving ? 'Saving…' : 'Add Client →'}
              </button>
            </div>
            <button className="legal-link" style={{ display: 'block', margin: '12px auto 0' }} onClick={onSkip}>
              Skip for now
            </button>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="onboarding-step" style={{ textAlign: 'center' }}>
            <div className="onboarding-icon">🎉</div>
            <h1 className="onboarding-title">You're all set!</h1>
            <p className="onboarding-subtitle">
              Your first client has been added. Head to the dashboard to see your certificate tracker in action.
            </p>
            <div className="onboarding-features" style={{ textAlign: 'left' }}>
              {[
                'Add more clients from the Clients tab',
                'Tap a certificate to renew it',
                'Red certificates need immediate attention',
              ].map(tip => (
                <div key={tip} className="onboarding-feature">
                  <span className="onboarding-feature-icon">💡</span>
                  <span className="onboarding-feature-text">{tip}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-primary onboarding-btn" onClick={onComplete}>
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
