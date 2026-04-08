import { useState, useEffect } from 'react'

const today = new Date().toISOString().split('T')[0]
const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

function emptyItem() {
  return { description: '', qty: 1, unit_price: '', total: '' }
}

function calcItem(item) {
  const qty = parseFloat(item.qty) || 0
  const up = parseFloat(item.unit_price) || 0
  return { ...item, total: (qty * up).toFixed(2) }
}

export default function QuoteForm({ clients, jobs, engineerProfile, quote, saving, onSubmit, onClose }) {
  const isEdit = !!quote?.quoteNumber
  const vatDefault = engineerProfile?.vat_registered ? 20 : 0

  const [clientId, setClientId] = useState(quote?.clientId || '')
  const [jobId, setJobId] = useState(quote?.jobId || '')
  const [lineItems, setLineItems] = useState(
    quote?.lineItems?.length ? quote.lineItems : [emptyItem()]
  )
  const [vatRate, setVatRate] = useState(quote?.vatRate ?? vatDefault)
  const [notes, setNotes] = useState(quote?.notes || '')
  const [validUntil, setValidUntil] = useState(quote?.validUntil || in30days)
  const [errors, setErrors] = useState({})

  const clientJobs = jobs.filter(j => j.clientId === clientId && !j.archived)

  // Pre-fill line items from a job
  useEffect(() => {
    if (!jobId || isEdit) return
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    setLineItems([{
      description: job.description,
      qty: 1,
      unit_price: job.price != null ? String(job.price) : '',
      total: job.price != null ? String(job.price) : '',
    }])
  }, [jobId, isEdit, jobs])

  function updateItem(idx, field, value) {
    setLineItems(prev => {
      const updated = [...prev]
      updated[idx] = calcItem({ ...updated[idx], [field]: value })
      return updated
    })
  }

  function addItem() { setLineItems(prev => [...prev, emptyItem()]) }
  function removeItem(idx) { setLineItems(prev => prev.filter((_, i) => i !== idx)) }

  const subtotal = lineItems.reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const vatAmount = (subtotal * vatRate) / 100
  const total = subtotal + vatAmount

  function validate() {
    const errs = {}
    if (!clientId) errs.clientId = 'Required'
    if (lineItems.every(i => !i.description.trim())) errs.lineItems = 'Add at least one line item'
    return errs
  }

  function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({ clientId, jobId: jobId || null, lineItems, vatRate, notes, validUntil })
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-tall">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? 'Edit Quote' : 'New Quote'}</div>

        {!engineerProfile?.business_name && (
          <div className="profile-warn-banner">
            ⚠️ Add your business details in Profile → Business Details so they appear on PDFs.
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Client *</label>
          <select className={`form-input${errors.clientId ? ' input-error' : ''}`}
            value={clientId} onChange={e => { setClientId(e.target.value); setJobId('') }}>
            <option value="">Select client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.clientId && <div className="form-error">{errors.clientId}</div>}
        </div>

        {clientJobs.length > 0 && (
          <div className="form-group">
            <label className="form-label">Link to Job <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
            <select className="form-input" value={jobId} onChange={e => setJobId(e.target.value)}>
              <option value="">No linked job</option>
              {clientJobs.map(j => <option key={j.id} value={j.id}>{j.description}</option>)}
            </select>
          </div>
        )}

        {/* Line items */}
        <div className="form-group">
          <label className="form-label">Line Items *</label>
          {errors.lineItems && <div className="form-error" style={{ marginBottom: '6px' }}>{errors.lineItems}</div>}

          {lineItems.map((item, idx) => (
            <div key={idx} className="line-item-row">
              <input className="form-input line-item-desc" placeholder="Description"
                value={item.description}
                onChange={e => updateItem(idx, 'description', e.target.value)} />
              <div className="line-item-nums">
                <input className="form-input line-item-qty" type="number" min="0" step="0.01"
                  placeholder="Qty" value={item.qty}
                  onChange={e => updateItem(idx, 'qty', e.target.value)} />
                <input className="form-input line-item-price" type="number" min="0" step="0.01"
                  placeholder="Unit £" value={item.unit_price}
                  onChange={e => updateItem(idx, 'unit_price', e.target.value)} />
                <div className="line-item-total">£{parseFloat(item.total || 0).toFixed(2)}</div>
                {lineItems.length > 1 && (
                  <button type="button" className="line-item-remove" onClick={() => removeItem(idx)}>×</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addItem} style={{ marginTop: '8px' }}>
            + Add Line
          </button>
        </div>

        {/* VAT */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>VAT</span>
            <span style={{ color: 'var(--text3)', fontWeight: 400 }}>{vatRate > 0 ? `${vatRate}%` : 'None'}</span>
          </label>
          <div className="role-grid">
            {[0, 20].map(rate => (
              <button key={rate} type="button"
                className={`role-btn${vatRate === rate ? ' active' : ''}`}
                onClick={() => setVatRate(rate)}>
                {rate === 0 ? 'No VAT' : `${rate}% VAT`}
              </button>
            ))}
          </div>
        </div>

        {/* Totals summary */}
        <div className="quote-totals-preview">
          <div className="quote-totals-row">
            <span>Subtotal</span><span>£{subtotal.toFixed(2)}</span>
          </div>
          {vatRate > 0 && (
            <div className="quote-totals-row">
              <span>VAT ({vatRate}%)</span><span>£{vatAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="quote-totals-row total">
            <span>Total</span><span>£{total.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Valid Until</label>
            <input className="form-input" type="date" value={validUntil}
              onChange={e => setValidUntil(e.target.value)} min={today} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
          <textarea className="form-input" rows={2} placeholder="Any terms, exclusions, or additional info…"
            value={notes} onChange={e => setNotes(e.target.value)}
            style={{ resize: 'vertical', minHeight: '56px' }} />
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Quote'}
          </button>
        </div>
      </div>
    </div>
  )
}
