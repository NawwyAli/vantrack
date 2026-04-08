import { JOB_STATUSES } from '../hooks/useJobs.js'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtMoney(n) {
  if (!n) return '£0'
  return '£' + parseFloat(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Get monthly revenue for last N months from paid invoices
function getMonthlyRevenue(invoices, n = 6) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const revenue = invoices
      .filter(inv => {
        if (inv.status !== 'paid' || !inv.paidAt) return false
        const pd = new Date(inv.paidAt)
        return pd.getFullYear() === y && pd.getMonth() === m
      })
      .reduce((s, inv) => s + inv.total, 0)
    return { label: MONTHS[m], revenue, isCurrent: i === n - 1 }
  })
}

// Stat card
function StatCard({ label, value, sub, color }) {
  return (
    <div className="analytics-stat-card">
      <div className="analytics-stat-value" style={{ color: color || 'var(--text)' }}>{value}</div>
      <div className="analytics-stat-label">{label}</div>
      {sub && <div className="analytics-stat-sub">{sub}</div>}
    </div>
  )
}

// Simple SVG bar chart
function RevenueChart({ data }) {
  const max = Math.max(...data.map(d => d.revenue), 1)
  const barW = 32
  const gap = 8
  const chartH = 80
  const totalW = data.length * (barW + gap) - gap

  return (
    <svg viewBox={`0 0 ${totalW} ${chartH + 22}`} style={{ width: '100%', maxWidth: `${totalW * 1.5}px`, overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(3, (d.revenue / max) * chartH)
        const x = i * (barW + gap)
        const y = chartH - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={5}
              fill={d.isCurrent ? '#0a84ff' : 'rgba(10,132,255,0.25)'} />
            <text x={x + barW / 2} y={chartH + 16}
              textAnchor="middle" fontSize="11" fill="var(--text3)">{d.label}</text>
            {d.revenue > 0 && (
              <text x={x + barW / 2} y={y - 4}
                textAnchor="middle" fontSize="9" fill={d.isCurrent ? '#0a84ff' : 'var(--text3)'}>
                £{d.revenue >= 1000 ? (d.revenue / 1000).toFixed(1) + 'k' : d.revenue.toFixed(0)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// Horizontal status bar
function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ color: 'var(--text3)' }}>{count}</span>
      </div>
      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

export default function AnalyticsView({ jobs, invoices, clients, onJobClick }) {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  // Revenue
  const revenueThisMonth = invoices
    .filter(i => i.status === 'paid' && i.paidAt && new Date(i.paidAt) >= thisMonthStart)
    .reduce((s, i) => s + i.total, 0)

  const revenueLastMonth = invoices
    .filter(i => i.status === 'paid' && i.paidAt && new Date(i.paidAt) >= lastMonthStart && new Date(i.paidAt) <= lastMonthEnd)
    .reduce((s, i) => s + i.total, 0)

  const outstanding = invoices
    .filter(i => i.status === 'sent')
    .reduce((s, i) => s + i.total, 0)

  const overdue = invoices
    .filter(i => i.status === 'sent' && i.dueDate && new Date(i.dueDate) < now)
    .reduce((s, i) => s + i.total, 0)

  const monthlyRevenue = getMonthlyRevenue(invoices, 6)
  const totalRevenue6m = monthlyRevenue.reduce((s, m) => s + m.revenue, 0)

  // Jobs
  const activeJobs = jobs.filter(j => !j.archived && j.status !== 'completed')
  const completedThisMonth = jobs.filter(j => {
    if (j.status !== 'completed' || !j.date) return false
    const d = new Date(j.date + 'T00:00:00')
    return d >= thisMonthStart
  })

  const totalActiveJobs = activeJobs.length
  const statusCounts = JOB_STATUSES.reduce((acc, s) => {
    acc[s.value] = jobs.filter(j => !j.archived && j.status === s.value).length
    return acc
  }, {})

  // Upcoming jobs (today + next 6 days)
  const todayStr = now.toISOString().slice(0, 10)
  const next7End = new Date(now)
  next7End.setDate(now.getDate() + 6)
  const next7Str = next7End.toISOString().slice(0, 10)

  const upcoming = jobs
    .filter(j => !j.archived && j.status !== 'completed' && j.date >= todayStr && j.date <= next7Str)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))

  // Top clients by job count
  const clientJobCounts = clients.map(c => ({
    client: c,
    count: jobs.filter(j => j.clientId === c.id && !j.archived).length,
  })).filter(x => x.count > 0).sort((a, b) => b.count - a.count).slice(0, 5)

  const revenueChange = revenueLastMonth > 0
    ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100).toFixed(0)
    : null

  return (
    <div style={{ padding: '16px 16px 80px' }}>

      {/* Revenue cards */}
      <div className="analytics-section-label">Revenue</div>
      <div className="analytics-stat-grid">
        <StatCard
          label="This month"
          value={fmtMoney(revenueThisMonth)}
          sub={revenueChange !== null ? `${revenueChange > 0 ? '+' : ''}${revenueChange}% vs last month` : null}
          color={revenueThisMonth > 0 ? 'var(--green)' : 'var(--text)'}
        />
        <StatCard label="Last month" value={fmtMoney(revenueLastMonth)} />
        <StatCard
          label="Outstanding"
          value={fmtMoney(outstanding)}
          sub={overdue > 0 ? `${fmtMoney(overdue)} overdue` : null}
          color={overdue > 0 ? 'var(--red)' : outstanding > 0 ? 'var(--amber)' : 'var(--text)'}
        />
      </div>

      {/* 6-month bar chart */}
      <div className="analytics-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Revenue — last 6 months</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{fmtMoney(totalRevenue6m)} total</div>
        </div>
        <RevenueChart data={monthlyRevenue} />
      </div>

      {/* Jobs cards */}
      <div className="analytics-section-label">Jobs</div>
      <div className="analytics-stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <StatCard label="Completed this month" value={completedThisMonth.length} color={completedThisMonth.length > 0 ? 'var(--green)' : 'var(--text)'} />
        <StatCard label="Active jobs" value={totalActiveJobs} />
      </div>

      {/* Jobs by status */}
      {totalActiveJobs > 0 && (
        <div className="analytics-card">
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Active by status</div>
          {JOB_STATUSES.filter(s => s.value !== 'completed').map(s => (
            <StatusBar key={s.value} label={s.label} count={statusCounts[s.value]} total={totalActiveJobs} color={s.color} />
          ))}
        </div>
      )}

      {/* Upcoming jobs */}
      <div className="analytics-section-label">Upcoming (next 7 days)</div>
      {upcoming.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '8px 0 16px' }}>No jobs scheduled in the next 7 days</div>
      ) : (
        upcoming.map(job => {
          const client = clients.find(c => c.id === job.clientId)
          const si = JOB_STATUSES.find(s => s.value === job.status)
          return (
            <div key={job.id} className="analytics-upcoming-job" onClick={() => onJobClick(job)}>
              <div className="analytics-upcoming-bar" style={{ background: si?.color }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{job.description}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  {client?.name || 'Unknown client'}
                  {job.startTime && <span style={{ color: 'var(--blue)', marginLeft: '6px' }}>⏱ {job.startTime}{job.endTime ? `–${job.endTime}` : ''}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 500 }}>{fmtDate(job.date)}</div>
              </div>
            </div>
          )
        })
      )}

      {/* Top clients */}
      {clientJobCounts.length > 0 && (
        <>
          <div className="analytics-section-label">Top clients by jobs</div>
          <div className="analytics-card" style={{ padding: '12px 14px' }}>
            {clientJobCounts.map(({ client, count }, i) => (
              <div key={client.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < clientJobCounts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>{client.name}</span>
                <span style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: 500 }}>{count} job{count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
