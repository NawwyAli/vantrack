import { useState } from 'react'

const STATUS_FILTERS = [
  { value: 'all',      label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
]

const STATUS_COLORS = {
  pending:  'var(--amber)',
  accepted: 'var(--green)',
  declined: 'var(--text3)',
}

function fmtDate(d) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function BookingRequestsView({ requests, loading, onAccept, onDecline, onDelete, bookingEnabled, bookingUrl }) {
  const [filter, setFilter] = useState('pending')
  const [decliningId, setDecliningId] = useState(null)

  const filtered = requests.filter(r => filter === 'all' || r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  if (loading) {
    return <div className="empty-state" style={{ paddingTop: '60px' }}><div className="loading-spinner" /></div>
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Booking link info banner */}
      {!bookingEnabled && (
        <div className="profile-warn-banner" style={{ margin: '12px 16px' }}>
          Online booking is disabled. Enable it in Profile → Booking Link to start receiving requests.
        </div>
      )}
      {bookingEnabled && bookingUrl && (
        <div className="booking-active-banner">
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '2px' }}>Your booking link</div>
          <div style={{ fontSize: '13px', color: 'var(--blue)', fontWeight: 500, wordBreak: 'break-all' }}>{bookingUrl}</div>
        </div>
      )}

      {/* Filter chips */}
      <div className="filter-bar">
        {STATUS_FILTERS.map(f => (
          <button key={f.value}
            className={`filter-chip${filter === f.value ? ' active' : ''}`}
            onClick={() => setFilter(f.value)}>
            {f.label}{f.value === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      <div className="page-content">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: '50px' }}>
            <div className="empty-icon">📋</div>
            <div className="empty-title">
              {filter === 'pending' ? 'No pending requests' : `No ${filter} requests`}
            </div>
            <div className="empty-text">
              {filter === 'pending' && bookingEnabled
                ? 'Share your booking link and requests will appear here.'
                : filter === 'pending'
                  ? 'Enable booking in your profile to receive requests.'
                  : ''}
            </div>
          </div>
        ) : (
          filtered.map(req => (
            <div key={req.id} className="booking-request-card">
              <div className="booking-request-header">
                <div>
                  <div className="booking-request-name">{req.client_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{fmtTime(req.created_at)}</div>
                </div>
                <span className="job-status-badge"
                  style={{ background: STATUS_COLORS[req.status] + '22', color: STATUS_COLORS[req.status] }}>
                  {req.status}
                </span>
              </div>

              <div className="booking-request-body">
                <p style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>{req.description}</p>

                {(req.client_email || req.client_phone) && (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {req.client_email && (
                      <a href={`mailto:${req.client_email}`} style={{ fontSize: '13px', color: 'var(--blue)' }}>
                        {req.client_email}
                      </a>
                    )}
                    {req.client_phone && (
                      <a href={`tel:${req.client_phone}`} style={{ fontSize: '13px', color: 'var(--blue)' }}>
                        {req.client_phone}
                      </a>
                    )}
                  </div>
                )}

                {req.preferred_date && (
                  <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>
                    Preferred date: <strong>{fmtDate(req.preferred_date)}</strong>
                  </div>
                )}

                {req.message && (
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>
                    "{req.message}"
                  </p>
                )}
              </div>

              {req.status === 'pending' && (
                <div className="booking-request-actions">
                  {decliningId === req.id ? (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDecliningId(null)}>Cancel</button>
                      <button className="btn btn-danger btn-sm" onClick={() => { onDecline(req.id); setDecliningId(null) }}>
                        Confirm Decline
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                        onClick={() => setDecliningId(req.id)}>Decline</button>
                      <button className="btn btn-primary btn-sm" onClick={() => onAccept(req)}>
                        Accept → Create Job
                      </button>
                    </>
                  )}
                </div>
              )}

              {req.status !== 'pending' && (
                <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)', fontSize: '12px' }}
                    onClick={() => onDelete(req.id)}>Remove</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
