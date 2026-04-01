import { useState } from 'react'

const ROLES = [
  { value: 'gas_engineer', label: '🔥 Gas Engineer' },
  { value: 'plumber', label: '🔧 Plumber' },
  { value: 'both', label: '⚡ Both' },
]

export default function AuthScreen({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const switchMode = m => { setMode(m); setError(''); setSuccess('') }

  async function handleSubmit() {
    setError(''); setSuccess('')
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return }
    if (mode === 'signup' && !role) { setError('Please select your trade'); return }
    if (mode === 'signup' && password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        await onSignIn(email.trim(), password)
      } else {
        await onSignUp(email.trim(), password, role)
        setSuccess('Account created! Check your email to confirm, then log in.')
        switchMode('login')
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
        <div className="auth-logo-sub">CP12 Certificate Tracker</div>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => switchMode('login')}>Log In</button>
          <button className={`auth-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')}>Sign Up</button>
        </div>

        {success && <div className="auth-success">{success}</div>}
        {error && <div className="auth-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="your@email.com"
            value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey}
            autoComplete="email" />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password"
            placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Password'}
            value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </div>

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
          {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>
      </div>
    </div>
  )
}
