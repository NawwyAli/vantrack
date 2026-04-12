import { useState } from 'react'
import { getCertStatus, getDaysLabel, fmtDate, getExpiryDate } from '../utils.js'
import ClientNotes from './ClientNotes.jsx'
import { JOB_STATUSES } from '../hooks/useJobs.js'

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)

export default function ClientDetail({
  client, onBack, onEdit, onDelete,
  onAddProperty, onEditProperty, onDeleteProperty,
  onRenew, onAddCert, onEditCert, onDeleteCert,
  jobs, onJobClick, onAddJob,
  fetchNotes, addNote, deleteNote,
  onSendCertSummary,
}) {
  const [summarySending, setSummarySending] = useState(false)
  const [summaryResult, setSummaryResult] = useState(null)

  if (!client) return null

  const propCount = client.properties.length
  const expired  = client.properties.filter(p => getCertStatus(p.certificate?.issueDate) === 'red').length
  const dueSoon  = client.properties.filter(p => getCertStatus(p.certificate?.issueDate) === 'amber').length
  const valid    = client.properties.filter(p => getCertStatus(p.certificate?.issueDate) === 'green').length

  return (
    <div className="page">
      <div className="page-content">

        {/* Quick stats */}
        {propCount > 0 && (
          <div className="client-stats-row">
            <div className="client-stat">
              <div className="client-stat-num">{propCount}</div>
              <div className="client-stat-lbl">Properties</div>
            </div>
            {expired > 0 && (
              <div className="client-stat">
                <div className="client-stat-num" style={{ color: 'var(--red)' }}>{expired}</div>
                <div className="client-stat-lbl">Expired</div>
              </div>
            )}
            {dueSoon > 0 && (
              <div className="client-stat">
                <div className="client-stat-num" style={{ color: 'var(--amber)' }}>{dueSoon}</div>
                <div className="client-stat-lbl">Due Soon</div>
              </div>
            )}
            {valid > 0 && (
              <div className="client-stat">
                <div className="client-stat-num" style={{ color: 'var(--green)' }}>{valid}</div>
                <div className="client-stat-lbl">Valid</div>
              </div>
            )}
          </div>
        )}

        {/* Client info card */}
        <div className="info-card">
          <div className="info-row">
            <div className="info-icon">👤</div>
            <div style={{ flex: 1 }}>
              <div className="info-label">Landlord Name</div>
              <div className="info-value">{client.name}</div>
            </div>
            <button className="icon-btn" onClick={onEdit} style={{ color: 'var(--text2)' }} aria-label="Edit client">
              <EditIcon />
            </button>
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
                <a href={`tel:${client.phone}`} className="info-value info-link">{client.phone}</a>
              </div>
            </div>
          )}
          {client.email && (
            <div className="info-row">
              <div className="info-icon">✉️</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="info-label">Email</div>
                <a href={`mailto:${client.email}`} className="info-value info-link">{client.email}</a>
              </div>
              {onSendCertSummary && propCount > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flexShrink: 0 }}
                  disabled={summarySending || summaryResult === 'sent'}
                  onClick={async () => {
                    setSummarySending(true)
                    try { await onSendCertSummary(client); setSummaryResult('sent') }
                    catch (err) { alert(err.message); setSummaryResult('error') }
                    finally { setSummarySending(false) }
                  }}
                >
                  {summarySending ? 'Sending…' : summaryResult === 'sent' ? '✓ Sent' : '✉ Cert Summary'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Properties section */}
        <div className="section-row">
          <div className="section-title">Properties</div>
          <button className="btn btn-ghost btn-sm" onClick={onAddProperty}>+ Add Property</button>
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
          const expiryDate = issueDate
            ? fmtDate(getExpiryDate(issueDate).toISOString().slice(0, 10))
            : null
          const daysLabel = getDaysLabel(issueDate)

          return (
            <div key={property.id} className="property-card">
              <div className="property-header">
                <div className={`status-dot ${status}`} />
                <div className="property-address">{property.address}</div>
                <button className="icon-btn" style={{ color: 'var(--text2)', minWidth: 'auto', minHeight: 'auto', padding: '4px' }}
                  onClick={() => onEditProperty(property.id, property.address)} aria-label="Edit property">
                  <EditIcon />
                </button>
                <button className="property-delete-btn" onClick={() => onDeleteProperty(property.id)} aria-label="Delete property">
                  <TrashIcon />
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
                  <>
                    <button className="btn-renew" onClick={() => onRenew(property.id)}>Renew CP12</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onEditCert(property.id)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                      onClick={() => onDeleteCert(property.id)}>Delete</button>
                  </>
                ) : (
                  <button className="btn-add-cert" onClick={() => onAddCert(property.id)}>Add Certificate</button>
                )}
              </div>

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

        {/* Job history for this client */}
        {jobs && (
          <>
            <div className="section-row">
              <div className="section-title">Jobs</div>
              <button className="btn btn-ghost btn-sm" onClick={onAddJob}>+ Add Job</button>
            </div>
            {jobs.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <div className="empty-text">No jobs logged for this client yet.</div>
              </div>
            ) : (
              jobs.map(job => {
                const statusInfo = JOB_STATUSES.find(s => s.value === job.status)
                return (
                  <div key={job.id} className="job-card" onClick={() => onJobClick(job)}
                    style={{ margin: '0 0 8px' }}>
                    <div className="job-card-header">
                      <div className="job-card-status-bar" style={{ background: statusInfo?.color }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="job-card-description">{job.description}</div>
                        <div className="job-card-date">{new Date(job.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                      {job.price != null && (
                        <div className="job-card-price">£{parseFloat(job.price).toFixed(2)}</div>
                      )}
                    </div>
                    <span className="job-status-badge" style={{ background: statusInfo?.color + '22', color: statusInfo?.color, marginTop: '6px', display: 'inline-block' }}>
                      {statusInfo?.label}
                    </span>
                  </div>
                )
              })
            )}
          </>
        )}

        {/* Communication log */}
        {fetchNotes && (
          <ClientNotes
            clientId={client.id}
            fetchNotes={fetchNotes}
            addNote={addNote}
            deleteNote={deleteNote}
          />
        )}

        <div className="danger-zone">
          <div className="danger-zone-title">Danger Zone</div>
          <button className="btn btn-danger" onClick={onDelete}>Delete Client</button>
        </div>
      </div>
    </div>
  )
}
