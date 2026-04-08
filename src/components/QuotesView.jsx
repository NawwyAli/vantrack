import { QUOTE_STATUSES } from '../hooks/useQuotes.js'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const FILTERS = [
  { value: 'all',      label: 'All' },
  { value: 'draft',    label: 'Draft' },
  { value: 'sent',     label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
]

export default function QuotesView({ quotes, clients, loading, filter, onFilterChange, onQuoteClick, onAddQuote, engineerProfile }) {
  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.status === filter)

  if (loading) return <div className="page"><div className="empty-state" style={{ paddingTop: '80px' }}><div className="loading-spinner" /></div></div>

  return (
    <div className="page">
      {!engineerProfile?.business_name && (
        <div className="profile-warn-banner">
          ⚠️ Add your business details in Profile so they appear on quote PDFs.
        </div>
      )}

      <div className="filter-bar">
        {FILTERS.map(f => (
          <button key={f.value}
            className={`filter-chip${filter === f.value ? ' active' : ''}`}
            onClick={() => onFilterChange(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="page-content">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: '60px' }}>
            <div className="empty-icon">📄</div>
            <div className="empty-title">No quotes</div>
            <div className="empty-text">{filter === 'all' ? 'Create your first quote to get started.' : `No ${filter} quotes.`}</div>
            {filter === 'all' && (
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={onAddQuote}>New Quote</button>
            )}
          </div>
        ) : (
          filtered.map(q => <QuoteCard key={q.id} quote={q} clients={clients} onClick={() => onQuoteClick(q)} />)
        )}
      </div>

      <button className="fab" onClick={onAddQuote} aria-label="New quote">+</button>
    </div>
  )
}

function QuoteCard({ quote, clients, onClick }) {
  const client = clients.find(c => c.id === quote.clientId)
  const statusInfo = QUOTE_STATUSES.find(s => s.value === quote.status)

  return (
    <div className="job-card" onClick={onClick}>
      <div className="job-card-header">
        <div className="job-card-status-bar" style={{ background: statusInfo?.color }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="job-card-description">{client?.name || 'Unknown Client'}</div>
          <div className="job-card-meta">#{quote.quoteNumber}{quote.validUntil ? ` · Valid until ${fmtDate(quote.validUntil)}` : ''}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="job-card-price">£{quote.total.toFixed(2)}</div>
          <div className="job-card-date">{fmtDate(quote.createdAt?.slice(0, 10))}</div>
        </div>
      </div>
      <div style={{ marginTop: '8px' }}>
        <span className="job-status-badge" style={{ background: statusInfo?.color + '22', color: statusInfo?.color }}>
          {statusInfo?.label}
        </span>
      </div>
    </div>
  )
}
