import { useState } from 'react'

export default function AddPropertyModal({ saving, onSubmit, onClose, initialAddress }) {
  const [address, setAddress] = useState(initialAddress || '')
  const [error, setError] = useState('')
  const isEditing = !!initialAddress

  const handleSubmit = () => {
    if (!address.trim()) { setError('Property address is required'); return }
    onSubmit(address.trim())
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">{isEditing ? 'Edit Property' : 'Add Property'}</div>

        <div className="form-group">
          <label className="form-label">Property Address *</label>
          <input
            className="form-input"
            type="text"
            placeholder="Rental property address"
            value={address}
            onChange={e => { setAddress(e.target.value); setError('') }}
            autoFocus
          />
          {error && <div className="form-error">{error}</div>}
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Property'}
          </button>
        </div>
      </div>
    </div>
  )
}
