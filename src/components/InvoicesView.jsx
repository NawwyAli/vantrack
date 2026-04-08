import { INVOICE_STATUSES } from '../hooks/useInvoices.js'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const FILTERS = [
  { value: 'all',     label: 'All' },
  { value: 'draft',   label: 'Draft' },
  { value: 'sent',    label: 'Sent' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid',    label: 'Paid' },
]

export default function InvoicesView({ invoices, clients, loading, filter, onFilterChange, onInvoiceClick, onAddInvoice, engineerProfile }) {
  // Auto-flag overdue for display (status still 'sent' in DB until manually changed)
  const now = new Date()
  const enriched = invoices.map(inv => ({
    ...inv,
    displayStatus: inv.status === 'sent' && inv.dueDate && new Date(inv.dueDate) < now ? 'overdue' : inv.status,
  }))

  const filtered = filter === 'all' ? enriched : enriched.filter(i => i.displayStatus === filter)

  // Outstanding total (sent + overdue, unpaid)
  const outstanding = enriched.filter(i => i.status === 'sent')
  const outstandingTotal = outstanding.reduce((s, i) => s + i.total, 0)

  if (loading) return <div className="page"><div className="empty-state" style={{ paddingTop: '80px' }}><div className="loading-spinner" /></div></div>

  return (
    <div className="page">
      {!engineerProfile?.bank_account_number && (
        <div className="profile-warn-banner">
          ⚠️ Add bank details in Profile so they appear on invoice PDFs for BACS payment.
        </div>
      )}

      {outstanding.length > 0 && (
        <div className="outstanding-banner">
          <span>💰 {outstanding.length} outstanding invoice{outstanding.length !== 1 ? 's' : ''}</span>
          <span className="outstanding-total">£{outstandingTotal.toFixed(2)}</span>
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
            <div className="empty-icon">🧾</div>
            <div className="empty-title">No invoices</div>
            <div className="empty-text">{filter === 'all' ? 'Create your first invoice or convert a completed job.' : `No ${filter} invoices.`}</div>
            {filter === 'all' && (
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={onAddInvoice}>New Invoice</button>
            )}
          </div>
        ) : (
          filtered.map(inv => <InvoiceCard key={inv.id} invoice={inv} clients={clients} onClick={() => onInvoiceClick(inv)} />)
        )}
      </div>

      <button className="fab" onClick={onAddInvoice} aria-label="New invoice">+</button>
    </div>
  )
}

function InvoiceCard({ invoice, clients, onClick }) {
  const client = clients.find(c => c.id === invoice.clientId)
  const statusInfo = INVOICE_STATUSES.find(s => s.value === invoice.status)
  const displayColor = invoice.displayStatus === 'overdue' ? 'var(--red)' : statusInfo?.color

  return (
    <div className="job-card" onClick={onClick}>
      <div className="job-card-header">
        <div className="job-card-status-bar" style={{ background: displayColor }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="job-card-description">{client?.name || 'Unknown Client'}</div>
          <div className="job-card-meta">
            #{invoice.invoiceNumber}
            {invoice.dueDate ? ` · Due ${fmtDate(invoice.dueDate)}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="job-card-price">£{invoice.total.toFixed(2)}</div>
          <div className="job-card-date">{fmtDate(invoice.createdAt?.slice(0, 10))}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
        <span className="job-status-badge" style={{ background: displayColor + '22', color: displayColor }}>
          {invoice.displayStatus === 'overdue' ? 'Overdue' : statusInfo?.label}
        </span>
        {invoice.paymentLinkUrl && (
          <span className="job-status-badge" style={{ background: 'var(--green)22', color: 'var(--green)' }}>🔗 Payment Link</span>
        )}
      </div>
    </div>
  )
}
