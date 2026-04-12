import { useState } from 'react'
import { getCertStatus, getClientWorstStatus, getExpiryDate, fmtDate } from '../utils.js'

const STATUS_FILTERS = [
  { value: 'all',    label: 'All' },
  { value: 'red',    label: 'Expired' },
  { value: 'amber',  label: 'Due Soon' },
  { value: 'green',  label: 'Up to Date' },
  { value: 'none',   label: 'No Cert' },
]

const STATUS_LABELS = {
  red:   'Expired',
  amber: 'Due Soon',
  green: 'Up to Date',
  none:  'No Certificate',
}

const STATUS_COLOURS = {
  red:   'var(--red)',
  amber: 'var(--amber)',
  green: 'var(--green)',
  none:  'var(--text3)',
}

// Find the soonest-expiring cert across all properties (for display on card)
function getSoonestExpiry(client) {
  const dates = client.properties
    .map(p => p.certificate?.issueDate)
    .filter(Boolean)
    .map(d => {
      const exp = getExpiryDate(d)
      return exp
    })
  if (!dates.length) return null
  dates.sort((a, b) => a - b)
  return dates[0]
}

const STATUS_SORT_ORDER = { red: 0, amber: 1, none: 2, green: 3 }

export default function ClientsView({ clients, loading, onClientClick }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('urgent') // 'urgent' | 'az' | 'za'

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state" style={{ paddingTop: '80px' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  let filtered = clients.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter === 'all') return true
    return getClientWorstStatus(c) === statusFilter
  })

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'az') return a.name.localeCompare(b.name)
    if (sort === 'za') return b.name.localeCompare(a.name)
    // urgent: red → amber → none → green, then name
    const sa = STATUS_SORT_ORDER[getClientWorstStatus(a)] ?? 2
    const sb = STATUS_SORT_ORDER[getClientWorstStatus(b)] ?? 2
    return sa !== sb ? sa - sb : a.name.localeCompare(b.name)
  })

  // Counts for filter badges
  const counts = clients.reduce((acc, c) => {
    const s = getClientWorstStatus(c)
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  return (
    <div className="page">
      <div className="page-content">
        {/* Search */}
        <input
          className="search-bar"
          type="text"
          placeholder="Search clients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Sort toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px', gap: '4px' }}>
          {[
            { value: 'urgent', label: 'Most Urgent' },
            { value: 'az',     label: 'A – Z' },
            { value: 'za',     label: 'Z – A' },
          ].map(s => (
            <button
              key={s.value}
              className={`filter-chip${sort === s.value ? ' active' : ''}`}
              style={{ fontSize: '11px', padding: '4px 10px' }}
              onClick={() => setSort(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="filter-bar" style={{ marginBottom: '12px' }}>
          {STATUS_FILTERS.map(f => {
            const count = f.value === 'all' ? clients.length : (counts[f.value] || 0)
            return (
              <button
                key={f.value}
                className={`filter-chip${statusFilter === f.value ? ' active' : ''}`}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}{count > 0 && f.value !== 'all' ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            {clients.length === 0 ? (
              <>
                <div className="empty-icon">👥</div>
                <div className="empty-title">No clients yet</div>
                <div className="empty-text">Tap + to add your first client.</div>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <div className="empty-title">No results</div>
                <div className="empty-text">
                  {search ? `No clients match "${search}"` : `No clients with ${STATUS_LABELS[statusFilter]?.toLowerCase()} status.`}
                </div>
              </>
            )}
          </div>
        ) : (
          filtered.map(client => {
            const worstStatus = getClientWorstStatus(client)
            const propCount = client.properties.length
            const soonestExpiry = getSoonestExpiry(client)
            const expiryLabel = soonestExpiry
              ? (worstStatus === 'red'
                  ? `Expired ${fmtDate(soonestExpiry.toISOString().slice(0, 10))}`
                  : `Expires ${fmtDate(soonestExpiry.toISOString().slice(0, 10))}`)
              : null

            return (
              <div key={client.id} className="client-card" onClick={() => onClientClick(client.id)}>
                <div className="client-avatar">{client.name.charAt(0).toUpperCase()}</div>
                <div className="client-info">
                  <div className="client-name">{client.name}</div>
                  {client.phone && <div className="client-detail-text">{client.phone}</div>}
                  {client.address && <div className="client-detail-text">{client.address}</div>}
                  <div className="client-badges">
                    <span
                      className="client-badge"
                      style={{
                        background: STATUS_COLOURS[worstStatus] + '22',
                        color: STATUS_COLOURS[worstStatus],
                        border: 'none',
                      }}
                    >
                      {propCount === 0 ? 'No properties' : STATUS_LABELS[worstStatus]}
                    </span>
                    {propCount > 0 && (
                      <span className="client-badge none">
                        {propCount} {propCount === 1 ? 'property' : 'properties'}
                      </span>
                    )}
                  </div>
                  {expiryLabel && (worstStatus === 'red' || worstStatus === 'amber') && (
                    <div style={{ fontSize: '11px', color: STATUS_COLOURS[worstStatus], marginTop: '4px', fontWeight: '500' }}>
                      {expiryLabel}
                    </div>
                  )}
                </div>
                <div className="chevron">›</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
