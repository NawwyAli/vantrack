import { useState } from 'react'
import { QUOTE_STATUSES } from '../hooks/useQuotes.js'
import { generateQuotePdf, quoteToBase64 } from '../utils/pdfUtils.js'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function QuoteDetail({ quote, clients, engineerProfile, onClose, onEdit, onDelete, onDuplicate, onStatusChange, onConvertToInvoice }) {
  const [emailing, setEmailing] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const client = clients.find(c => c.id === quote.clientId)
  const statusInfo = QUOTE_STATUSES.find(s => s.value === quote.status)
  const ep = engineerProfile || {}

  function handleDownload() {
    const doc = generateQuotePdf(quote, client || {}, ep)
    doc.save(`Quote-${quote.quoteNumber}.pdf`)
  }

  async function handleEmail() {
    if (!client?.email) {
      setEmailError('Client has no email address on file.')
      return
    }
    setEmailing(true)
    setEmailError('')
    try {
      const pdfBase64 = quoteToBase64(quote, client, ep)
      const res = await fetch('/.netlify/functions/send-quote-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.email,
          clientName: client.name,
          quoteNumber: quote.quoteNumber,
          total: quote.total,
          validUntil: quote.validUntil,
          engineerName: ep.business_name || 'Your Engineer',
          engineerEmail: ep.email || '',
          engineerPhone: ep.phone || '',
          pdfBase64,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to send email')
      }
      await onStatusChange(quote.id, 'sent')
      setEmailSent(true)
    } catch (err) {
      setEmailError(err.message)
    } finally {
      setEmailing(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-tall">
        <div className="modal-handle" />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '2px' }}>#{quote.quoteNumber}</div>
            <div className="modal-title" style={{ marginBottom: '4px' }}>
              {client?.name || 'Unknown Client'}
            </div>
            <span className="job-status-badge"
              style={{ background: statusInfo?.color + '22', color: statusInfo?.color }}>
              {statusInfo?.label}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>
        </div>

        {/* Details grid */}
        <div className="job-detail-grid">
          <div className="job-detail-item"><span className="job-detail-label">Date</span><span>{fmtDate(quote.createdAt?.slice(0, 10))}</span></div>
          <div className="job-detail-item"><span className="job-detail-label">Valid Until</span><span>{fmtDate(quote.validUntil)}</span></div>
          <div className="job-detail-item"><span className="job-detail-label">Subtotal</span><span>£{quote.subtotal.toFixed(2)}</span></div>
          {quote.vatRate > 0 && <div className="job-detail-item"><span className="job-detail-label">VAT ({quote.vatRate}%)</span><span>£{quote.vatAmount.toFixed(2)}</span></div>}
          <div className="job-detail-item"><span className="job-detail-label">Total</span><span style={{ fontWeight: 700, color: 'var(--blue)' }}>£{quote.total.toFixed(2)}</span></div>
        </div>

        {/* Line items */}
        <div style={{ marginBottom: '16px' }}>
          <div className="job-detail-label" style={{ marginBottom: '8px' }}>Line Items</div>
          {(quote.lineItems || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ flex: 1, color: 'var(--text)' }}>{item.description}</span>
              <span style={{ color: 'var(--text3)', marginRight: '12px' }}>×{item.qty}</span>
              <span style={{ color: 'var(--text)' }}>£{parseFloat(item.total || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {quote.notes && (
          <div style={{ marginBottom: '16px' }}>
            <div className="job-detail-label" style={{ marginBottom: '4px' }}>Notes</div>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.5', margin: 0 }}>{quote.notes}</p>
          </div>
        )}

        {/* Status */}
        <div style={{ marginBottom: '16px' }}>
          <div className="job-detail-label" style={{ marginBottom: '8px' }}>Status</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {QUOTE_STATUSES.map(s => (
              <button key={s.value} type="button"
                onClick={() => onStatusChange(quote.id, s.value)}
                style={{
                  padding: '5px 12px', borderRadius: '20px', border: '1.5px solid',
                  borderColor: quote.status === s.value ? s.color : 'var(--border)',
                  background: quote.status === s.value ? s.color + '22' : 'transparent',
                  color: quote.status === s.value ? s.color : 'var(--text2)',
                  fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* PDF / Email actions */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDownload}>
            ↓ Download PDF
          </button>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleEmail} disabled={emailing || emailSent}>
            {emailing ? 'Sending…' : emailSent ? '✓ Sent' : '✉ Email to Client'}
          </button>
        </div>
        {emailError && <div className="auth-error" style={{ marginBottom: '12px' }}>{emailError}</div>}
        {emailSent && <div className="auth-success" style={{ marginBottom: '12px' }}>Quote emailed to {client?.email} and marked as Sent.</div>}

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={onDuplicate}>Duplicate</button>
          {quote.status === 'accepted' && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }} onClick={onConvertToInvoice}>→ Invoice</button>
          )}
          <div style={{ flex: 1 }} />
          {deleteConfirm ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(quote.id)}>Confirm Delete</button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setDeleteConfirm(true)}>Delete</button>
          )}
        </div>
      </div>
    </div>
  )
}
