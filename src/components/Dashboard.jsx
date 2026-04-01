import { getCertStatus, getDaysLabel, fmtDate, getExpiryDate } from '../utils.js'

export default function Dashboard({ clients, loading, onRenew, onClientClick, onAddCert }) {
  if (loading) {
    return (
      <div className="page">
        <div className="page-content" style={{ textAlign: 'center', paddingTop: '40px', color: 'var(--text2)' }}>
          Loading…
        </div>
      </div>
    )
  }
  // Flatten all properties across all clients
  const allEntries = []
  for (const client of clients) {
    for (const property of client.properties) {
      allEntries.push({ client, property })
    }
  }

  // Count by status (total = all properties with a cert)
  const totalCerts = allEntries.filter(e => e.property.certificate).length
  const redCount = allEntries.filter(e => getCertStatus(e.property.certificate?.issueDate) === 'red').length
  const amberCount = allEntries.filter(e => getCertStatus(e.property.certificate?.issueDate) === 'amber').length
  const greenCount = allEntries.filter(e => getCertStatus(e.property.certificate?.issueDate) === 'green').length

  // Sort: red, amber, green, none
  const statusOrder = { red: 0, amber: 1, green: 2, none: 3 }
  const sorted = [...allEntries].sort((a, b) => {
    const sa = getCertStatus(a.property.certificate?.issueDate)
    const sb = getCertStatus(b.property.certificate?.issueDate)
    return statusOrder[sa] - statusOrder[sb]
  })

  const groups = {
    red: sorted.filter(e => getCertStatus(e.property.certificate?.issueDate) === 'red'),
    amber: sorted.filter(e => getCertStatus(e.property.certificate?.issueDate) === 'amber'),
    green: sorted.filter(e => getCertStatus(e.property.certificate?.issueDate) === 'green'),
    none: sorted.filter(e => getCertStatus(e.property.certificate?.issueDate) === 'none'),
  }

  const groupLabels = {
    red: 'Needs Attention',
    amber: 'Due Soon',
    green: 'Up to Date',
    none: 'No Certificate',
  }

  if (clients.length === 0) {
    return (
      <div className="page">
        <div className="page-content">
          <div className="empty-state">
            <div className="empty-icon">🚐</div>
            <div className="empty-title">No clients yet</div>
            <div className="empty-text">Add your first client to start tracking CP12 certificates.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{totalCerts}</div>
            <div className="stat-label">Total Certs</div>
          </div>
          <div className="stat-card">
            <div className="stat-number red">{redCount}</div>
            <div className="stat-label">Expired</div>
          </div>
          <div className="stat-card">
            <div className="stat-number amber">{amberCount}</div>
            <div className="stat-label">Due Soon</div>
          </div>
          <div className="stat-card">
            <div className="stat-number green">{greenCount}</div>
            <div className="stat-label">Valid</div>
          </div>
        </div>

        {/* Groups */}
        {(['red', 'amber', 'green', 'none']).map(status => {
          const items = groups[status]
          if (items.length === 0) return null
          return (
            <div key={status}>
              <div className="section-header">{groupLabels[status]}</div>
              {items.map(({ client, property }) => {
                const issueDate = property.certificate?.issueDate
                const expiryDate = issueDate ? getExpiryDate(issueDate) : null
                const daysLabel = getDaysLabel(issueDate)
                const hasCert = !!property.certificate

                return (
                  <div
                    key={`${client.id}-${property.id}`}
                    className="cert-card"
                    onClick={() => onClientClick(client.id)}
                  >
                    <div className={`status-dot ${status}`} />
                    <div className="cert-info">
                      <div className="cert-client">{client.name}</div>
                      <div className="cert-address">{property.address}</div>
                      <div className={`cert-meta ${status}`}>{daysLabel}</div>
                    </div>
                    <div className="cert-action">
                      {hasCert ? (
                        <button
                          className="btn-renew"
                          onClick={e => { e.stopPropagation(); onRenew(client.id, property.id) }}
                        >
                          Renew
                        </button>
                      ) : (
                        <button
                          className="btn-add-cert"
                          onClick={e => { e.stopPropagation(); onAddCert(client.id, property.id) }}
                        >
                          Add Cert
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        {allEntries.length === 0 && clients.length > 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <div className="empty-title">No properties yet</div>
            <div className="empty-text">Add properties to your clients to start tracking certificates.</div>
          </div>
        )}
      </div>
    </div>
  )
}
