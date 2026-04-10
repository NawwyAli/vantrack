import { useState } from 'react'
import { getTaxYear, calcAllowance } from '../hooks/useExpenses.js'

function fmtMoney(n) {
  return '£' + parseFloat(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const CATEGORY_COLOURS = {
  'Parts & Materials': 'var(--blue)',
  'Fuel':              'var(--amber)',
  'Tools & Equipment': 'var(--green)',
  'PPE & Workwear':    'var(--text2)',
  'Parking & Tolls':   'var(--text2)',
  'Insurance':         'var(--red)',
  'Phone & Comms':     'var(--blue)',
  'Training & Certifications': 'var(--green)',
  'Van Maintenance':   'var(--amber)',
  'Other':             'var(--text3)',
}

// Stat card
function Stat({ label, value, sub, color }) {
  return (
    <div className="finance-stat">
      <div className="finance-stat-value" style={{ color: color || 'var(--text)' }}>{value}</div>
      <div className="finance-stat-label">{label}</div>
      {sub && <div className="finance-stat-sub">{sub}</div>}
    </div>
  )
}

// ── Expenses tab ──────────────────────────────────────────────────────────────

function ExpensesTab({ expenses, jobs, clients, onAdd, onEdit, onDelete }) {
  const [monthFilter, setMonthFilter] = useState('all')
  const [deleteId, setDeleteId] = useState(null)

  const taxYear = getTaxYear()
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Unique months from data
  const months = [...new Set(expenses.map(e => e.date.slice(0, 7)))].sort().reverse()

  const filtered = monthFilter === 'all'
    ? expenses
    : expenses.filter(e => e.date.startsWith(monthFilter))

  // Stats
  const taxYearExpenses = expenses.filter(e => {
    const d = new Date(e.date + 'T00:00:00')
    return d >= taxYear.start && d <= taxYear.end
  })
  const thisMonthExpenses = expenses.filter(e => e.date.startsWith(thisMonth))
  const taxYearTotal = taxYearExpenses.reduce((s, e) => s + e.amount, 0)
  const thisMonthTotal = thisMonthExpenses.reduce((s, e) => s + e.amount, 0)

  return (
    <>
      {/* Stats */}
      <div className="finance-stats-row">
        <Stat label="This Month" value={fmtMoney(thisMonthTotal)} />
        <Stat label={`Tax Year ${taxYear.label}`} value={fmtMoney(taxYearTotal)} sub={`${taxYearExpenses.length} entries`} />
      </div>

      {/* Month filter */}
      {months.length > 0 && (
        <div className="filter-bar">
          <button className={`filter-chip${monthFilter === 'all' ? ' active' : ''}`} onClick={() => setMonthFilter('all')}>All</button>
          {months.slice(0, 8).map(m => (
            <button key={m} className={`filter-chip${monthFilter === m ? ' active' : ''}`} onClick={() => setMonthFilter(m)}>
              {new Date(m + '-01').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
            </button>
          ))}
        </div>
      )}

      <div className="page-content">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: '60px' }}>
            <div className="empty-icon">🧾</div>
            <div className="empty-title">No expenses yet</div>
            <div className="empty-text">Track business expenses for your tax return.</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={onAdd}>Add Expense</button>
          </div>
        ) : (
          filtered.map(e => {
            const job = jobs.find(j => j.id === e.jobId)
            const client = job ? clients.find(c => c.id === job.clientId) : null
            const catColor = CATEGORY_COLOURS[e.category] || 'var(--text3)'
            return (
              <div key={e.id} className="finance-entry-card">
                <div className="finance-entry-left">
                  <div className="finance-entry-cat-dot" style={{ background: catColor }} />
                  <div>
                    <div className="finance-entry-desc">{e.description}</div>
                    <div className="finance-entry-meta">
                      <span style={{ color: catColor, fontSize: '11px', fontWeight: '500' }}>{e.category}</span>
                      {client && <><span className="job-card-dot">·</span><span>{client.name}</span></>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{fmtDate(e.date)}</div>
                  </div>
                </div>
                <div className="finance-entry-right">
                  <div className="finance-entry-amount">{fmtMoney(e.amount)}</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => onEdit(e)}>Edit</button>
                    {deleteId === e.id ? (
                      <>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: '12px' }} onClick={() => setDeleteId(null)}>✕</button>
                        <button className="btn btn-danger btn-sm" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => { onDelete(e.id); setDeleteId(null) }}>Del</button>
                      </>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '12px', color: 'var(--red)' }} onClick={() => setDeleteId(e.id)}>Delete</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <button className="fab" onClick={onAdd} aria-label="Add expense">+</button>
    </>
  )
}

// ── Mileage tab ───────────────────────────────────────────────────────────────

function MileageTab({ mileage, jobs, clients, onAdd, onEdit, onDelete }) {
  const [monthFilter, setMonthFilter] = useState('all')
  const [deleteId, setDeleteId] = useState(null)

  const taxYear = getTaxYear()
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const months = [...new Set(mileage.map(m => m.date.slice(0, 7)))].sort().reverse()

  const filtered = monthFilter === 'all'
    ? mileage
    : mileage.filter(m => m.date.startsWith(monthFilter))

  // Tax year stats
  const taxYearMileage = mileage.filter(m => {
    const d = new Date(m.date + 'T00:00:00')
    return d >= taxYear.start && d <= taxYear.end
  })
  const taxYearMiles = taxYearMileage.reduce((s, m) => s + m.miles, 0)
  const taxYearAllowance = calcAllowance(taxYearMiles)

  const thisMonthMileage = mileage.filter(m => m.date.startsWith(thisMonth))
  const thisMonthMiles = thisMonthMileage.reduce((s, m) => s + m.miles, 0)

  // Per-entry cumulative (sorted ascending by date for allowance calc)
  const sorted = [...taxYearMileage].sort((a, b) => a.date.localeCompare(b.date))
  const cumulativeMap = {}
  let cum = 0
  sorted.forEach(m => {
    cumulativeMap[m.id] = cum
    cum += m.miles
  })

  return (
    <>
      {/* Stats */}
      <div className="finance-stats-row">
        <Stat label="This Month" value={`${thisMonthMiles.toFixed(1)} mi`} />
        <Stat label={`Tax Year ${taxYear.label}`} value={`${taxYearMiles.toFixed(0)} mi`} sub={`${fmtMoney(taxYearAllowance)} allowance`} color="var(--green)" />
      </div>

      {/* HMRC note */}
      <div className="finance-hmrc-note">
        HMRC approved rate: 45p/mile (first 10,000) · 25p/mile thereafter
        {taxYearMiles >= 10000 && <span style={{ color: 'var(--amber)', marginLeft: '6px' }}>10,000 mi threshold reached</span>}
      </div>

      {/* Month filter */}
      {months.length > 0 && (
        <div className="filter-bar">
          <button className={`filter-chip${monthFilter === 'all' ? ' active' : ''}`} onClick={() => setMonthFilter('all')}>All</button>
          {months.slice(0, 8).map(m => (
            <button key={m} className={`filter-chip${monthFilter === m ? ' active' : ''}`} onClick={() => setMonthFilter(m)}>
              {new Date(m + '-01').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
            </button>
          ))}
        </div>
      )}

      <div className="page-content">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: '60px' }}>
            <div className="empty-icon">🚐</div>
            <div className="empty-title">No mileage logged</div>
            <div className="empty-text">Log journeys to claim your HMRC mileage allowance.</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={onAdd}>Log Mileage</button>
          </div>
        ) : (
          filtered.map(m => {
            const job = jobs.find(j => j.id === m.jobId)
            const client = job ? clients.find(c => c.id === job.clientId) : null
            const cumBefore = cumulativeMap[m.id] ?? 0
            const allowance = calcAllowance(m.miles, cumBefore)
            return (
              <div key={m.id} className="finance-entry-card">
                <div className="finance-entry-left">
                  <div className="finance-mileage-icon">🚐</div>
                  <div>
                    <div className="finance-entry-desc">{m.fromLocation} → {m.toLocation}</div>
                    <div className="finance-entry-meta">
                      {m.purpose && <span>{m.purpose}</span>}
                      {client && <><span className="job-card-dot">·</span><span>{client.name}</span></>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{fmtDate(m.date)}</div>
                  </div>
                </div>
                <div className="finance-entry-right">
                  <div className="finance-entry-amount">{m.miles} mi</div>
                  <div style={{ fontSize: '12px', color: 'var(--green)', fontWeight: '500' }}>{fmtMoney(allowance)}</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => onEdit(m)}>Edit</button>
                    {deleteId === m.id ? (
                      <>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: '12px' }} onClick={() => setDeleteId(null)}>✕</button>
                        <button className="btn btn-danger btn-sm" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => { onDelete(m.id); setDeleteId(null) }}>Del</button>
                      </>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '12px', color: 'var(--red)' }} onClick={() => setDeleteId(m.id)}>Delete</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <button className="fab" onClick={onAdd} aria-label="Log mileage">+</button>
    </>
  )
}

// ── Main FinanceView ──────────────────────────────────────────────────────────

export default function FinanceView({
  expenses, mileage, jobs, clients, loading,
  onAddExpense, onEditExpense, onDeleteExpense,
  onAddMileage, onEditMileage, onDeleteMileage,
}) {
  const [tab, setTab] = useState('expenses')

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state" style={{ paddingTop: '80px' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="work-segment-bar">
        <button className={`work-segment${tab === 'expenses' ? ' active' : ''}`} onClick={() => setTab('expenses')}>
          Expenses
        </button>
        <button className={`work-segment${tab === 'mileage' ? ' active' : ''}`} onClick={() => setTab('mileage')}>
          Mileage
        </button>
      </div>

      {tab === 'expenses' && (
        <ExpensesTab
          expenses={expenses}
          jobs={jobs}
          clients={clients}
          onAdd={onAddExpense}
          onEdit={onEditExpense}
          onDelete={onDeleteExpense}
        />
      )}

      {tab === 'mileage' && (
        <MileageTab
          mileage={mileage}
          jobs={jobs}
          clients={clients}
          onAdd={onAddMileage}
          onEdit={onEditMileage}
          onDelete={onDeleteMileage}
        />
      )}
    </div>
  )
}
