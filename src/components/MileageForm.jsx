import { useState } from 'react'
import { calcAllowance, getTaxYear } from '../hooks/useExpenses.js'

const today = () => new Date().toISOString().split('T')[0]

export default function MileageForm({ entry, mileage, jobs, clients, saving, onSubmit, onClose }) {
  const [date, setDate] = useState(entry?.date || today())
  const [fromLocation, setFromLocation] = useState(entry?.fromLocation || '')
  const [toLocation, setToLocation] = useState(entry?.toLocation || '')
  const [miles, setMiles] = useState(entry?.miles != null ? String(entry.miles) : '')
  const [purpose, setPurpose] = useState(entry?.purpose || '')
  const [jobId, setJobId] = useState(entry?.jobId || '')
  const [errors, setErrors] = useState({})

  // Cumulative tax-year miles before this entry (excluding this entry if editing)
  const taxYear = getTaxYear()
  const cumulativeBefore = mileage
    .filter(m => {
      if (entry && m.id === entry.id) return false
      const d = new Date(m.date + 'T00:00:00')
      return d >= taxYear.start && d <= taxYear.end
    })
    .reduce((s, m) => s + m.miles, 0)

  const milesNum = parseFloat(miles) || 0
  const allowance = milesNum > 0 ? calcAllowance(milesNum, cumulativeBefore) : 0

  function handleSubmit() {
    const errs = {}
    if (!date) errs.date = 'Date is required'
    if (!fromLocation.trim()) errs.fromLocation = 'From location is required'
    if (!toLocation.trim()) errs.toLocation = 'To location is required'
    if (!miles || isNaN(parseFloat(miles)) || parseFloat(miles) <= 0) errs.miles = 'Enter valid miles'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    onSubmit({
      date, fromLocation: fromLocation.trim(), toLocation: toLocation.trim(),
      miles, purpose: purpose.trim(), jobId: jobId || null,
    })
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">{entry ? 'Edit Mileage' : 'Log Mileage'}</div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className={`form-input${errors.date ? ' input-error' : ''}`}
            value={date} onChange={e => setDate(e.target.value)} />
          {errors.date && <div className="form-error">{errors.date}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">From</label>
          <input className={`form-input${errors.fromLocation ? ' input-error' : ''}`}
            value={fromLocation} onChange={e => setFromLocation(e.target.value)}
            placeholder="e.g. Home / Office" />
          {errors.fromLocation && <div className="form-error">{errors.fromLocation}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">To</label>
          <input className={`form-input${errors.toLocation ? ' input-error' : ''}`}
            value={toLocation} onChange={e => setToLocation(e.target.value)}
            placeholder="e.g. Client address" />
          {errors.toLocation && <div className="form-error">{errors.toLocation}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Miles</label>
          <input type="number" step="0.1" min="0"
            className={`form-input${errors.miles ? ' input-error' : ''}`}
            value={miles} onChange={e => setMiles(e.target.value)}
            placeholder="0.0" />
          {errors.miles && <div className="form-error">{errors.miles}</div>}
          {milesNum > 0 && (
            <div className="mileage-allowance-hint">
              HMRC allowance: <strong>£{allowance.toFixed(2)}</strong>
              <span style={{ color: 'var(--text3)', marginLeft: '6px' }}>
                ({cumulativeBefore.toFixed(0)} miles used this tax year)
              </span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Purpose (optional)</label>
          <input className="form-input" value={purpose} onChange={e => setPurpose(e.target.value)}
            placeholder="e.g. Gas safety inspection" />
        </div>

        {jobs.length > 0 && (
          <div className="form-group">
            <label className="form-label">Link to Job (optional)</label>
            <select className="form-input" value={jobId} onChange={e => setJobId(e.target.value)}>
              <option value="">No job linked</option>
              {jobs.filter(j => !j.archived).map(j => {
                const c = clients.find(cl => cl.id === j.clientId)
                return <option key={j.id} value={j.id}>{j.description}{c ? ` — ${c.name}` : ''}</option>
              })}
            </select>
          </div>
        )}

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : entry ? 'Save Changes' : 'Log Mileage'}
          </button>
        </div>
      </div>
    </div>
  )
}
