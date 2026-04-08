import { useState } from 'react'
import { INVOICE_STATUSES } from '../hooks/useInvoices.js'
import { generateInvoicePdf, invoiceToBase64 } from '../utils/pdfUtils.js'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function InvoiceDetail({ invoice, clients, engineerProfile, onClose, onEdit, onDelete, onDuplicate, onStatusChange, onSavePaymentLink }) {
  const [emailing, setEmailing] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const client = clients.find(c => c.id === invoice.clientId)
  const statusInfo = INVOICE_STATUSES.find(s => s.value === invoice.status)
  const ep = engineerProfile || {}

  const isOverdue = invoice.status === 'sent' && invoice.dueDate && new Date(invoice.dueDate) < new Date()

  function handleDownload() {
    const doc = generateInvoicePdf(invoice, client || {}, ep)
    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`)
  }

  async function handleEmail() {
    if (!client?.email) { setEmailError('Client has no email address on file.'); return }
    setEmailing(true); setEmailError('')
    try {
      const pdfBase64 = invoiceToBase64(invoice, client, ep)
      const res = await fetch('/.netlify/functions/send-invoice-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.email,
          clientName: client.name,
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          dueDate: invoice.dueDate,
          paymentLinkUrl: invoice.paymentLinkUrl,
          engineerName: ep.business_name || 'Your Engineer',
          engineerEmail: ep.email || '',
          engineerPhone: ep.phone || '',
          pdfBase64,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to send') }
      await onStatusChange(invoice.id, 'sent')
      setEmailSent(true)
    } catch (err) { setEmailError(err.message) }
    finally { setEmailing(false) }
  }

  async function handleCreatePaymentLink() {
    setPaymentLoading(true); setEmailError('')
    try {
      const res = await fetch('/.netlify/functions/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.id, user_id: client?.id, total: invoice.total, invoice_number: invoice.invoiceNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create payment link')
      await onSavePaymentLink(invoice.id, data.url)
    } catch (err) { setEmailError(err.message) }
    finally { setPaymentLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-tall">
        <div className="modal-handle" />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '2px' }}>#{invoice.invoiceNumber}</div>
            <div className="modal-title" style={{ marginBottom: '4px' }}>{client?.name || 'Unknown Client'}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="job-status-badge" style={{ background: statusInfo?.color + '22', color: statusInfo?.color }}>
                {statusInfo?.label}
              </span>
              {isOverdue && <span className="job-status-badge" style={{ background: 'var(--red)22', color: 'var(--red)' }}>Overdue</span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>
        </div>

        <div className="job-detail-grid">
          <div className="job-detail-item"><span className="job-detail-label">Date</span><span>{fmtDate(invoice.createdAt?.slice(0, 10))}</span></div>
          <div className="job-detail-item"><span className="job-detail-label">Due Date</span><span style={{ color: isOverdue ? 'var(--red)' : undefined }}>{fmtDate(invoice.dueDate)}</span></div>
          <div className="job-detail-item"><span className="job-detail-label">Subtotal</span><span>£{invoice.subtotal.toFixed(2)}</span></div>
          {invoice.vatRate > 0 && <div className="job-detail-item"><span className="job-detail-label">VAT ({invoice.vatRate}%)</span><span>£{invoice.vatAmount.toFixed(2)}</span></div>}
          <div className="job-detail-item"><span className="job-detail-label">Total</span><span style={{ fontWeight: 700, color: 'var(--blue)' }}>£{invoice.total.toFixed(2)}</span></div>
          {invoice.paidAt && <div className="job-detail-item"><span className="job-detail-label">Paid</span><span style={{ color: 'var(--green)' }}>{fmtDate(invoice.paidAt?.slice(0, 10))}</span></div>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="job-detail-label" style={{ marginBottom: '8px' }}>Line Items</div>
          {(invoice.lineItems || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ flex: 1, color: 'var(--text)' }}>{item.description}</span>
              <span style={{ color: 'var(--text3)', marginRight: '12px' }}>×{item.qty}</span>
              <span>£{parseFloat(item.total || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {invoice.notes && (
          <div style={{ marginBottom: '16px' }}>
            <div className="job-detail-label" style={{ marginBottom: '4px' }}>Notes</div>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.5', margin: 0 }}>{invoice.notes}</p>
          </div>
        )}

        {/* Status */}
        <div style={{ marginBottom: '16px' }}>
          <div className="job-detail-label" style={{ marginBottom: '8px' }}>Status</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {INVOICE_STATUSES.map(s => (
              <button key={s.value} type="button"
                onClick={() => onStatusChange(invoice.id, s.value)}
                style={{
                  padding: '5px 12px', borderRadius: '20px', border: '1.5px solid',
                  borderColor: invoice.status === s.value ? s.color : 'var(--border)',
                  background: invoice.status === s.value ? s.color + '22' : 'transparent',
                  color: invoice.status === s.value ? s.color : 'var(--text2)',
                  fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment link */}
        <div style={{ marginBottom: '16px' }}>
          <div className="job-detail-label" style={{ marginBottom: '8px' }}>Online Payment</div>
          {invoice.paymentLinkUrl ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--green)' }}>✓ Payment link ready</span>
              <button className="btn btn-ghost btn-sm"
                onClick={() => navigator.clipboard?.writeText(invoice.paymentLinkUrl)}>
                Copy Link
              </button>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={handleCreatePaymentLink} disabled={paymentLoading}>
              {paymentLoading ? 'Creating…' : '🔗 Create Stripe Payment Link'}
            </button>
          )}
        </div>

        {/* PDF / Email */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDownload}>↓ Download PDF</button>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleEmail} disabled={emailing || emailSent}>
            {emailing ? 'Sending…' : emailSent ? '✓ Sent' : '✉ Email to Client'}
          </button>
        </div>
        {emailError && <div className="auth-error" style={{ marginBottom: '12px' }}>{emailError}</div>}
        {emailSent && <div className="auth-success" style={{ marginBottom: '12px' }}>Invoice emailed to {client?.email} and marked as Sent.</div>}

        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={onDuplicate}>Duplicate</button>
          <div style={{ flex: 1 }} />
          {deleteConfirm ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(invoice.id)}>Confirm Delete</button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setDeleteConfirm(true)}>Delete</button>
          )}
        </div>
      </div>
    </div>
  )
}
