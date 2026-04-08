import { useState, useEffect } from 'react'
import { JOB_STATUSES, RECURRING_INTERVALS } from '../hooks/useJobs.js'

const today = new Date().toISOString().split('T')[0]

export default function JobForm({ clients, job, saving, onSubmit, onClose }) {
  // job may be a full job (edit) or a partial { clientId, date } (pre-fill)
  const isEdit = !!(job?.description)

  const [clientId, setClientId] = useState(job?.clientId || '')
  const [propertyId, setPropertyId] = useState(job?.propertyId || '')
  const [description, setDescription] = useState(job?.description || '')
  const [date, setDate] = useState(job?.date || today)
  const [startTime, setStartTime] = useState(job?.startTime || '')
  const [endTime, setEndTime] = useState(job?.endTime || '')
  const [price, setPrice] = useState(job?.price != null ? String(job.price) : '')
  const [status, setStatus] = useState(job?.status || 'pending')
  const [recurring, setRecurring] = useState(job?.recurring || false)
  const [recurringInterval, setRecurringInterval] = useState(job?.recurringInterval || 'monthly')
  const [notes, setNotes] = useState(job?.notes || '')
  const [errors, setErrors] = useState({})

  const selectedClient = clients.find(c => c.id === clientId)
  const properties = selectedClient?.properties || []

  useEffect(() => {
    if (!isEdit) setPropertyId('')
  }, [clientId, isEdit])

  function validate() {
    const errs = {}
    if (!clientId) errs.clientId = 'Required'
    if (!description.trim()) errs.description = 'Required'
    if (!date) errs.date = 'Required'
    return errs
  }

  function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      clientId,
      propertyId: propertyId || null,
      description: description.trim(),
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      price,
      status,
      recurring,
      recurringInterval: recurring ? recurringInterval : null,
      notes: notes.trim(),
    })
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-tall">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? 'Edit Job' : 'Add Job'}</div>

        <div className="form-group">
          <label className="form-label">Client *</label>
          <select className={`form-input${errors.clientId ? ' input-error' : ''}`}
            value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">Select client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.clientId && <div className="form-error">{errors.clientId}</div>}
        </div>

        {properties.length > 0 && (
          <div className="form-group">
            <label className="form-label">Property <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
            <select className="form-input" value={propertyId} onChange={e => setPropertyId(e.target.value)}>
              <option value="">No specific property</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea className={`form-input${errors.description ? ' input-error' : ''}`}
            rows={3} placeholder="e.g. Annual boiler service and CP12"
            value={description} onChange={e => setDescription(e.target.value)}
            style={{ resize: 'vertical', minHeight: '72px' }} />
          {errors.description && <div className="form-error">{errors.description}</div>}
        </div>

        {/* Date + Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className={`form-input${errors.date ? ' input-error' : ''}`}
              type="date" value={date} onChange={e => setDate(e.target.value)} />
            {errors.date && <div className="form-error">{errors.date}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Price (£)</label>
            <input className="form-input" type="number" min="0" step="0.01"
              placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
        </div>

        {/* Time slots */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Start time <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
            <input className="form-input" type="time" value={startTime}
              onChange={e => setStartTime(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">End time <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
            <input className="form-input" type="time" value={endTime}
              onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <div className="role-grid">
            {JOB_STATUSES.map(s => (
              <button key={s.value} type="button"
                className={`role-btn${status === s.value ? ' active' : ''}`}
                onClick={() => setStatus(s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Recurring Job</span>
            <button type="button" className={`toggle-btn${recurring ? ' on' : ''}`} onClick={() => setRecurring(r => !r)}>
              <span className="toggle-knob" />
            </button>
          </label>
          {recurring && (
            <select className="form-input" style={{ marginTop: '8px' }}
              value={recurringInterval} onChange={e => setRecurringInterval(e.target.value)}>
              {RECURRING_INTERVALS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Notes <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
          <textarea className="form-input" rows={2} placeholder="Any additional notes…"
            value={notes} onChange={e => setNotes(e.target.value)}
            style={{ resize: 'vertical', minHeight: '56px' }} />
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Job'}
          </button>
        </div>
      </div>
    </div>
  )
}
