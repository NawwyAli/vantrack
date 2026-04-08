import { useState } from 'react'
import { JOB_STATUSES } from '../hooks/useJobs.js'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtPrice(p) {
  if (p == null || p === '') return null
  return '£' + parseFloat(p).toFixed(2)
}

const FILTERS = [
  { value: 'active',      label: 'Active' },
  { value: 'pending',     label: 'Pending' },
  { value: 'confirmed',   label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'archived',    label: 'Archived' },
]

export default function JobsView({ jobs, clients, loading, onJobClick, onAddJob, workTab, onWorkTabChange, quotesSlot, invoicesSlot }) {
  const [filter, setFilter] = useState('active')
  const [clientFilter, setClientFilter] = useState('')

  const filtered = jobs.filter(j => {
    if (clientFilter && j.clientId !== clientFilter) return false
    if (filter === 'active') return !j.archived && j.status !== 'completed'
    if (filter === 'archived') return j.archived
    return !j.archived && j.status === filter
  })

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state" style={{ paddingTop: '80px' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  const segmentBar = (
    <div className="work-segment-bar">
      <button className={`work-segment${workTab === 'jobs' ? ' active' : ''}`} onClick={() => onWorkTabChange('jobs')}>Jobs</button>
      <button className={`work-segment${workTab === 'quotes' ? ' active' : ''}`} onClick={() => onWorkTabChange('quotes')}>Quotes</button>
      <button className={`work-segment${workTab === 'invoices' ? ' active' : ''}`} onClick={() => onWorkTabChange('invoices')}>Invoices</button>
    </div>
  )

  if (workTab === 'quotes') {
    return <div className="page">{segmentBar}{quotesSlot}</div>
  }

  if (workTab === 'invoices') {
    return <div className="page">{segmentBar}{invoicesSlot}</div>
  }

  return (
    <div className="page">
      {segmentBar}
      {/* Filter bar */}
      <div className="filter-bar">
        {FILTERS.map(f => (
          <button key={f.value}
            className={`filter-chip${filter === f.value ? ' active' : ''}`}
            onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Client filter */}
      {clients.length > 0 && (
        <div style={{ padding: '0 16px 8px' }}>
          <select className="form-input" style={{ fontSize: '13px', height: '36px' }}
            value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="">All clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Jobs list */}
      <div className="page-content">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: '60px' }}>
            <div className="empty-icon">🔧</div>
            <div className="empty-title">No jobs here</div>
            <div className="empty-text">
              {filter === 'active' ? 'Add your first job to get started.' : `No ${filter} jobs.`}
            </div>
            {filter === 'active' && (
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={onAddJob}>Add Job</button>
            )}
          </div>
        ) : (
          filtered.map(job => <JobCard key={job.id} job={job} clients={clients} onClick={() => onJobClick(job)} />)
        )}
      </div>

      <button className="fab" onClick={onAddJob} aria-label="Add job">+</button>
    </div>
  )
}

function JobCard({ job, clients, onClick }) {
  const client = clients.find(c => c.id === job.clientId)
  const property = client?.properties.find(p => p.id === job.propertyId)
  const statusInfo = JOB_STATUSES.find(s => s.value === job.status)
  const price = fmtPrice(job.price)

  return (
    <div className="job-card" onClick={onClick}>
      <div className="job-card-header">
        <div className="job-card-status-bar" style={{ background: statusInfo?.color }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="job-card-description">{job.description}</div>
          <div className="job-card-meta">
            <span>{client?.name || 'Unknown client'}</span>
            {property && <><span className="job-card-dot">·</span><span>{property.address}</span></>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {price && <div className="job-card-price">{price}</div>}
          <div className="job-card-date">{fmtDate(job.date)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
        <span className="job-status-badge" style={{ background: statusInfo?.color + '22', color: statusInfo?.color }}>
          {statusInfo?.label}
        </span>
        {job.recurring && <span className="job-recurring-badge">↻ {job.recurringInterval}</span>}
        {job.archived && <span className="job-archived-badge">Archived</span>}
        {job.photos?.length > 0 && <span style={{ fontSize: '11px', color: 'var(--text3)' }}>📷 {job.photos.length}</span>}
      </div>
    </div>
  )
}
