import { useState } from 'react'

const FILTERS = [
  { value: 'all',      label: 'All' },
  { value: 'draft',    label: 'Draft' },
  { value: 'complete', label: 'Complete' },
]

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ChecklistsView({ checklists, jobs, clients, loading, onChecklistClick, onAddChecklist }) {
  const [filter, setFilter] = useState('all')

  const filtered = checklists.filter(c => filter === 'all' || c.status === filter)

  if (loading) {
    return (
      <div className="empty-state" style={{ paddingTop: '80px' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <>
      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`filter-chip${filter === f.value ? ' active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="page-content">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: '60px' }}>
            <div className="empty-icon">✅</div>
            <div className="empty-title">No checklists yet</div>
            <div className="empty-text">
              {filter === 'all'
                ? 'Create a compliance checklist to record safety checks for your jobs.'
                : `No ${filter} checklists.`}
            </div>
            {filter === 'all' && (
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={onAddChecklist}>
                New Checklist
              </button>
            )}
          </div>
        ) : (
          filtered.map(c => (
            <ChecklistCard
              key={c.id}
              checklist={c}
              jobs={jobs}
              clients={clients}
              onClick={() => onChecklistClick(c)}
            />
          ))
        )}
      </div>

      <button className="fab" onClick={onAddChecklist} aria-label="New checklist">+</button>
    </>
  )
}

function ChecklistCard({ checklist, jobs, clients, onClick }) {
  const job = jobs.find(j => j.id === checklist.jobId)
  const client = clients.find(c => c.id === checklist.clientId)
    || (job ? clients.find(c => c.id === job.clientId) : null)

  const total = checklist.items.length
  const done = checklist.items.filter(i => i.status !== 'pending').length
  const failed = checklist.items.filter(i => i.status === 'fail').length

  return (
    <div className="job-card" onClick={onClick}>
      <div className="job-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="job-card-description">{checklist.name}</div>
          <div className="job-card-meta">
            {client && <span>{client.name}</span>}
            {job && (
              <>
                <span className="job-card-dot">·</span>
                <span>{job.description}</span>
              </>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600' }}>
            {done}/{total}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
            {fmtDate(checklist.createdAt)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
        <span className={`checklist-status-badge ${checklist.status}`}>
          {checklist.status === 'complete' ? 'Complete' : 'Draft'}
        </span>
        {failed > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--red)', fontWeight: '500' }}>
            {failed} failed
          </span>
        )}
        {total > 0 && (
          <div className="checklist-mini-progress" style={{ flex: 1 }}>
            <div
              className="checklist-mini-fill"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
