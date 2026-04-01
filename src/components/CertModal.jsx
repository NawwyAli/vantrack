import { useState } from 'react'
import { fmtDate, getExpiryDate, getCertStatus } from '../utils.js'

function getTodayStr() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function CertModal({ property, saving, onSubmit, onClose }) {
  const existingCert = property?.certificate
  const isRenewing = !!existingCert

  const [issueDate, setIssueDate] = useState(getTodayStr())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!issueDate) {
      setError('Issue date is required')
      return
    }
    onSubmit(issueDate, notes.trim())
  }

  const expiryStr = existingCert?.issueDate
    ? (() => {
        const d = getExpiryDate(existingCert.issueDate)
        return d.toISOString().slice(0, 10)
      })()
    : null

  const status = existingCert ? getCertStatus(existingCert.issueDate) : 'none'

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">{isRenewing ? 'Renew CP12' : 'Add Certificate'}</div>

        {isRenewing && existingCert && (
          <div className="existing-cert-info">
            <div className="existing-cert-title">Current Certificate</div>
            <div className="existing-cert-row">
              <span className="existing-cert-label">Issued</span>
              <span className="existing-cert-value">{fmtDate(existingCert.issueDate)}</span>
            </div>
            <div className="existing-cert-row">
              <span className="existing-cert-label">Expires</span>
              <span className={`existing-cert-value cert-meta ${status}`}>
                {fmtDate(expiryStr)}
              </span>
            </div>
            {existingCert.notes && (
              <div className="existing-cert-row">
                <span className="existing-cert-label">Notes</span>
                <span className="existing-cert-value">{existingCert.notes}</span>
              </div>
            )}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Issue Date *</label>
          <input
            className="form-input"
            type="date"
            value={issueDate}
            onChange={e => { setIssueDate(e.target.value); setError('') }}
          />
          {error && <div className="form-error">{error}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Any notes about this certificate..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isRenewing ? 'Renew Certificate' : 'Save Certificate'}
          </button>
        </div>
      </div>
    </div>
  )
}
