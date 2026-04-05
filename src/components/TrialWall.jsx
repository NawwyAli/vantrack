import { useState } from 'react'

export default function TrialWall({ user, onSignOut }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubscribe() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, email: user.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <div className="auth-logo-icon">🚐</div>
        <div className="auth-logo-title">VanTrack</div>
        <div className="auth-logo-sub">CP12 Certificate Tracker</div>
      </div>

      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏰</div>
        <div className="modal-title" style={{ marginBottom: '8px' }}>Your Free Trial Has Ended</div>
        <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          Your 14-day free trial is up. Subscribe for <strong style={{ color: 'var(--text)' }}>£25/month</strong> to
          keep full access to VanTrack — unlimited clients, properties, and CP12 tracking.
        </p>

        <div style={{ marginBottom: '24px' }}>
          {[
            '✓ Unlimited landlord clients',
            '✓ Unlimited properties',
            '✓ CP12 certificate tracking',
            '✓ Traffic light dashboard',
            '✓ Automatic landlord email reminders',
          ].map(f => (
            <div key={f} style={{ fontSize: '14px', color: 'var(--text2)', padding: '4px 0' }}>{f}</div>
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="btn btn-primary auth-submit" onClick={handleSubscribe} disabled={loading}>
          {loading ? 'Redirecting to checkout…' : 'Subscribe — £25/month'}
        </button>

        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
          onClick={onSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
