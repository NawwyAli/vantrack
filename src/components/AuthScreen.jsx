import { useState } from 'react'

const ROLES = [
  { value: 'gas_engineer', label: '🔥 Gas Engineer' },
  { value: 'plumber', label: '🔧 Plumber' },
  { value: 'both', label: '⚡ Both' },
]

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function AuthScreen({ onSignIn, onSignUp, onResetPassword, onShowLegal }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const switchMode = m => {
    setMode(m); setError(''); setSuccess('')
    setShowPassword(false); setShowConfirmPassword(false)
  }

  async function handleSubmit() {
    setError(''); setSuccess('')

    if (mode === 'forgot') {
      if (!email.trim()) { setError('Please enter your email'); return }
      setLoading(true)
      try {
        await onResetPassword(email.trim())
        setMode('login')
        setSuccess('Password reset email sent — check your inbox.')
      } catch (err) {
        setError(err.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return }
    if (mode === 'signup') {
      if (!role) { setError('Please select your trade'); return }
      if (password.length < 6) { setError('Password must be at least 6 characters'); return }
      if (password !== confirmPassword) { setError('Passwords do not match'); return }
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await onSignIn(email.trim(), password)
      } else {
        await onSignUp(email.trim(), password, role)
        setMode('login')
        setSuccess('Account created! Check your email to confirm, then log in.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <div className="auth-logo-icon">🚐</div>
        <div className="auth-logo-title">VanTrack</div>
        <div className="auth-logo-sub">Trade Management for Gas Engineers &amp; Plumbers</div>
      </div>

      <div className="auth-card">

        {mode !== 'forgot' && (
          <div className="auth-tabs">
            <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => switchMode('login')}>Log In</button>
            <button className={`auth-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')}>Sign Up</button>
          </div>
        )}

        {mode === 'forgot' && (
          <div style={{ marginBottom: '20px' }}>
            <button className="back-btn" style={{ padding: 0, minWidth: 0 }} onClick={() => switchMode('login')}>
              ← Back to log in
            </button>
            <div className="modal-title" style={{ marginTop: '12px', marginBottom: '4px' }}>Reset Password</div>
            <p style={{ fontSize: '13px', color: 'var(--text2)' }}>Enter your email and we'll send you a reset link.</p>
          </div>
        )}

        {success && <div className="auth-success">{success}</div>}
        {error && <div className="auth-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="your@email.com"
            value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey}
            autoComplete="email" />
        </div>

        {mode !== 'forgot' && (
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Password</span>
              {mode === 'login' && (
                <button type="button" onClick={() => switchMode('forgot')}
                  style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                  Forgot password?
                </button>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Password'}
                value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={{ paddingRight: '40px' }} />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '2px', display: 'flex', alignItems: 'center' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>
        )}

        {mode === 'signup' && (
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={handleKey}
                autoComplete="new-password"
                style={{ paddingRight: '40px' }} />
              <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '2px', display: 'flex', alignItems: 'center' }}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                <EyeIcon open={showConfirmPassword} />
              </button>
            </div>
          </div>
        )}

        {mode === 'signup' && (
          <div className="form-group">
            <label className="form-label">I am a...</label>
            <div className="role-grid">
              {ROLES.map(r => (
                <button key={r.value} type="button"
                  className={`role-btn${role === r.value ? ' active' : ''}`}
                  onClick={() => setRole(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary auth-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait…'
            : mode === 'login' ? 'Log In'
            : mode === 'signup' ? 'Create Account'
            : 'Send Reset Email'}
        </button>
      </div>

      <div className="legal-footer">
        <button className="legal-link" onClick={() => onShowLegal('privacy')}>Privacy Policy</button>
        <span style={{ color: 'var(--text3)' }}>·</span>
        <button className="legal-link" onClick={() => onShowLegal('terms')}>Terms &amp; Conditions</button>
      </div>
    </div>
  )
}
