import { useState } from 'react'
import { EXPENSE_CATEGORIES } from '../hooks/useExpenses.js'

const today = () => new Date().toISOString().split('T')[0]

export default function ExpenseForm({ expense, jobs, clients, saving, onSubmit, onClose }) {
  const [date, setDate] = useState(expense?.date || today())
  const [category, setCategory] = useState(expense?.category || EXPENSE_CATEGORIES[0])
  const [description, setDescription] = useState(expense?.description || '')
  const [amount, setAmount] = useState(expense?.amount != null ? String(expense.amount) : '')
  const [jobId, setJobId] = useState(expense?.jobId || '')
  const [errors, setErrors] = useState({})

  function handleSubmit() {
    const errs = {}
    if (!date) errs.date = 'Date is required'
    if (!description.trim()) errs.description = 'Description is required'
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) errs.amount = 'Enter a valid amount'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    onSubmit({ date, category, description: description.trim(), amount, jobId: jobId || null })
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">{expense ? 'Edit Expense' : 'Add Expense'}</div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className={`form-input${errors.date ? ' input-error' : ''}`}
            value={date} onChange={e => setDate(e.target.value)} />
          {errors.date && <div className="form-error">{errors.date}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <input className={`form-input${errors.description ? ' input-error' : ''}`}
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Boiler parts from Screwfix" />
          {errors.description && <div className="form-error">{errors.description}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Amount (£)</label>
          <input type="number" step="0.01" min="0"
            className={`form-input${errors.amount ? ' input-error' : ''}`}
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" />
          {errors.amount && <div className="form-error">{errors.amount}</div>}
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
            {saving ? 'Saving…' : expense ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}
