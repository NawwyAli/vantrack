import { useState } from 'react'
import { fmtDate, getExpiryDate, getCertStatus } from '../utils.js'

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CertModal({ property, saving, onSubmit, onClose, editMode }) {
  const existingCert = property?.certificate
  const isRenewing = !!existingCert && !editMode

  const [issueDate, setIssueDate] = useState(
    editMode && existingCert?.issueDate ? existingCert.issueDate : getTodayStr()
  )
  const [notes, setNotes] = useState(editMode && existingCert?.notes ? existingCert.notes : '')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!issueDate) { setError('Issue date is required'); return }
    onSubmit(issueDate, notes.trim())
  }

  const expiryStr = existingCert?.issueDate
    ? getExpiryDate(existingCert.issueDate).toISOString().slice(0, 10)
    : null
  const status = existingCert ? getCertStatus(existingCert.issueDate) : 'none'

  const title = editMode ? 'Edit Certificate' : isRenewing ? 'Renew CP12' : 'Add Certificate'

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">{title}</div>

        {isRenewing && existingCert && (
          <div className="existing-cert-info">
            <div className="existing-cert-title">Current Certificate</div>
            <div className="existing-cert-row">
              <span className="existing-cert-label">Issued</span>
              <span className="existing-cert-value">{fmtDate(existingCert.issueDate)}</span>
            </div>
            <div className="existing-cert-row">
              <span className="existing-cert-label">Expires</span>
              <span className={`existing-cert-value cert-meta ${status}`}>{fmtDate(expiryStr)}</span>
            </div>
            {existingCert.notes && (
              <div className="existing-cert-row">
                <span className="existing-cert-label">Notes</span>
                <span className="existing-cert-value">{existingCert.notes}</span>
              </div>
            )}
          </div>
        )}

        {editMode && (
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
            This corrects the existing certificate — no history entry is created.
          </p>
        )}

        <div className="form-group">
          <label className="form-label">Issue Date *</label>
          <input className="form-input" type="date" value={issueDate}
            onChange={e => { setIssueDate(e.target.value); setError('') }} />
          {error && <div className="form-error">{error}</div>}
          {issueDate && (
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '6px' }}>
              Expiry:{' '}
              <strong style={{ color: 'var(--text)' }}>
                {fmtDate(getExpiryDate(issueDate).toISOString().slice(0, 10))}
              </strong>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-textarea" placeholder="Any notes about this certificate..."
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : editMode ? 'Save Changes' : isRenewing ? 'Renew Certificate' : 'Save Certificate'}
          </button>
        </div>
      </div>
    </div>
  )
}
