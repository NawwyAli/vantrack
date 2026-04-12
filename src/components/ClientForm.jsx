import { useState } from 'react'

const today = new Date().toISOString().split('T')[0]

export default function ClientForm({ client, saving, onSubmit, onClose }) {
  const [name, setName] = useState(client?.name || '')
  const [address, setAddress] = useState(client?.address || '')
  const [phone, setPhone] = useState(client?.phone || '')
  const [email, setEmail] = useState(client?.email || '')
  const [propertyAddress, setPropertyAddress] = useState('')
  const [certIssueDate, setCertIssueDate] = useState('')
  const [errors, setErrors] = useState({})

  const isEditing = !!client

  const clearError = field => setErrors(prev => ({ ...prev, [field]: undefined }))

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'Required'
    if (!isEditing && !propertyAddress.trim()) errs.propertyAddress = 'Required'
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      propertyAddress: propertyAddress.trim(),
      certIssueDate: certIssueDate || null,
    })
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">{isEditing ? 'Edit Client' : 'Add Client'}</div>

        <div className="form-section-label">Landlord Details</div>

        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className={`form-input${errors.name ? ' input-error' : ''}`} type="text"
            placeholder="Full name" value={name}
            onChange={e => { setName(e.target.value); clearError('name') }} />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Contact Address <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
          <input className="form-input" type="text"
            placeholder="Landlord's contact address" value={address}
            onChange={e => setAddress(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Phone <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
          <input className="form-input" type="tel"
            placeholder="Phone number" value={phone}
            onChange={e => setPhone(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Email <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
          <input className="form-input" type="email"
            placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} />
        </div>

        {!isEditing && (
          <>
            <div className="form-section-label" style={{ marginTop: '20px' }}>First Property &amp; CP12</div>

            <div className="form-group">
              <label className="form-label">Property Address *</label>
              <input className={`form-input${errors.propertyAddress ? ' input-error' : ''}`} type="text"
                placeholder="Rental property address" value={propertyAddress}
                onChange={e => { setPropertyAddress(e.target.value); clearError('propertyAddress') }} />
              {errors.propertyAddress && <div className="form-error">{errors.propertyAddress}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">CP12 Issue Date <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
              <input className="form-input" type="date" value={certIssueDate} max={today}
                onChange={e => setCertIssueDate(e.target.value)} />
            </div>
          </>
        )}

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  )
}
