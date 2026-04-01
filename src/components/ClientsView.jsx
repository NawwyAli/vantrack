import { useState } from 'react'
import { getClientWorstStatus } from '../utils.js'

const statusLabels = {
  red: 'Needs Attention',
  amber: 'Due Soon',
  green: 'Up to Date',
  none: 'No Certificate',
}

export default function ClientsView({ clients, loading, onClientClick }) {
  if (loading) {
    return (
      <div className="page">
        <div className="page-content" style={{ textAlign: 'center', paddingTop: '40px', color: 'var(--text2)' }}>
          Loading…
        </div>
      </div>
    )
  }
  const [search, setSearch] = useState('')

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div className="page-content">
        <input
          className="search-bar"
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {filtered.length === 0 && (
          <div className="empty-state">
            {clients.length === 0 ? (
              <>
                <div className="empty-icon">👥</div>
                <div className="empty-title">No clients yet</div>
                <div className="empty-text">Tap the + button to add your first client.</div>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <div className="empty-title">No results</div>
                <div className="empty-text">No clients match "{search}"</div>
              </>
            )}
          </div>
        )}

        {filtered.map(client => {
          const worstStatus = getClientWorstStatus(client)
          const propCount = client.properties.length

          return (
            <div
              key={client.id}
              className="client-card"
              onClick={() => onClientClick(client.id)}
            >
              <div className="client-avatar">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="client-info">
                <div className="client-name">{client.name}</div>
                {client.phone && (
                  <div className="client-detail-text">{client.phone}</div>
                )}
                {client.address && (
                  <div className="client-detail-text">{client.address}</div>
                )}
                <div className="client-badges">
                  <span className={`client-badge ${worstStatus}`}>
                    {propCount === 0 ? 'No properties' : statusLabels[worstStatus]}
                  </span>
                  {propCount > 0 && (
                    <span className="client-badge none">
                      {propCount} {propCount === 1 ? 'property' : 'properties'}
                    </span>
                  )}
                </div>
              </div>
              <div className="chevron">›</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
