import { getCertStatus, getDaysLabel, fmtDate, getExpiryDate } from '../utils.js'

export default function ClientDetail({
  client,
  onBack,
  onEdit,
  onDelete,
  onAddProperty,
  onDeleteProperty,
  onRenew,
  onAddCert,
}) {
  if (!client) return null

  return (
    <div className="page">
      <div className="page-content">
        {/* Client info card */}
        <div className="info-card">
          <div className="info-row">
            <div className="info-icon">👤</div>
            <div>
              <div className="info-label">Landlord Name</div>
              <div className="info-value">{client.name}</div>
            </div>
          </div>
          {client.address && (
            <div className="info-row">
              <div className="info-icon">📍</div>
              <div>
                <div className="info-label">Contact Address</div>
                <div className="info-value">{client.address}</div>
              </div>
            </div>
          )}
          {client.phone && (
            <div className="info-row">
              <div className="info-icon">📞</div>
              <div>
                <div className="info-label">Phone</div>
                <div className="info-value">{client.phone}</div>
              </div>
            </div>
          )}
          {client.email && (
            <div className="info-row">
              <div className="info-icon">✉️</div>
              <div>
                <div className="info-label">Email</div>
                <div className="info-value">{client.email}</div>
              </div>
            </div>
          )}
        </div>

        {/* Properties section */}
        <div className="section-row">
          <div className="section-title">Properties</div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onAddProperty}
          >
            + Add Property
          </button>
        </div>

        {client.properties.length === 0 && (
          <div className="empty-state" style={{ padding: '32px 24px' }}>
            <div className="empty-icon">🏠</div>
            <div className="empty-title">No properties</div>
            <div className="empty-text">Add a rental property to start tracking CP12 certificates.</div>
          </div>
        )}

        {client.properties.map(property => {
          const issueDate = property.certificate?.issueDate
          const status = getCertStatus(issueDate)
          const hasCert = !!property.certificate
          const expiryDate = issueDate ? fmtDate(
            (() => {
              const d = getExpiryDate(issueDate)
              return d.toISOString().slice(0, 10)
            })()
          ) : null
          const daysLabel = getDaysLabel(issueDate)

          return (
            <div key={property.id} className="property-card">
              <div className="property-header">
                <div className={`status-dot ${status}`} />
                <div className="property-address">{property.address}</div>
                <button
                  className="property-delete-btn"
                  onClick={() => onDeleteProperty(property.id)}
                  aria-label="Delete property"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
              </div>

              {hasCert ? (
                <>
                  <div className="cert-detail-row">
                    <span className="cert-date-label">Issue Date</span>
                    <span className="cert-date-value">{fmtDate(property.certificate.issueDate)}</span>
                  </div>
                  <div className="cert-detail-row">
                    <span className="cert-date-label">Expiry Date</span>
                    <span className="cert-date-value">{expiryDate}</span>
                  </div>
                  {property.certificate.notes && (
                    <div className="cert-detail-row">
                      <span className="cert-date-label">Notes</span>
                      <span className="cert-date-value" style={{ textAlign: 'right', maxWidth: '60%' }}>
                        {property.certificate.notes}
                      </span>
                    </div>
                  )}
                  <div className={`cert-status-label ${status}`}>{daysLabel}</div>
                </>
              ) : (
                <div className="no-cert-text">No certificate logged</div>
              )}

              <div className="property-actions">
                {hasCert ? (
                  <button
                    className="btn-renew"
                    onClick={() => onRenew(property.id)}
                  >
                    Renew CP12
                  </button>
                ) : (
                  <button
                    className="btn-add-cert"
                    onClick={() => onAddCert(property.id)}
                  >
                    Add Certificate
                  </button>
                )}
              </div>

              {/* History */}
              {property.history && property.history.length > 0 && (
                <div className="history-section">
                  <div className="history-title">Previous Certificates</div>
                  {property.history.map(cert => (
                    <div key={cert.id} className="history-item">
                      <span className="history-date">{fmtDate(cert.issueDate)}</span>
                      <span className="history-expired">Expired</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Danger zone */}
        <div className="danger-zone">
          <div className="danger-zone-title">Danger Zone</div>
          <button
            className="btn btn-danger"
            onClick={onDelete}
          >
            Delete Client
          </button>
        </div>
      </div>
    </div>
  )
}
