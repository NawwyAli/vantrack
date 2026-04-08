import { useState } from 'react'
import { JOB_STATUSES } from '../hooks/useJobs.js'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function padDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// Returns Mon-first offset (0=Mon … 6=Sun)
function getMonFirstOffset(y, m) {
  const dow = new Date(y, m, 1).getDay() // 0=Sun
  return (dow + 6) % 7
}

export default function CalendarView({ jobs, clients, onJobClick, onAddJob }) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(todayStr)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function goToday() {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setSelectedDate(todayStr)
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = getMonFirstOffset(year, month)

  // Build jobs-by-date map (non-archived only)
  const jobsByDate = {}
  for (const job of jobs) {
    if (job.archived || !job.date) continue
    if (!jobsByDate[job.date]) jobsByDate[job.date] = []
    jobsByDate[job.date].push(job)
  }

  // Sort jobs for selected day by start_time
  const selectedJobs = (jobsByDate[selectedDate] || []).slice().sort((a, b) => {
    if (!a.startTime) return 1
    if (!b.startTime) return -1
    return a.startTime.localeCompare(b.startTime)
  })

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <div style={{ padding: '0 0 80px' }}>
      {/* Month navigation */}
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="cal-month-title">{MONTH_NAMES[month]} {year}</span>
          {!isCurrentMonth && (
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={goToday}>Today</button>
          )}
        </div>
        <button className="cal-nav-btn" onClick={nextMonth}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="cal-grid">
        {DAY_HEADERS.map(d => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}

        {/* Leading empty cells */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`e${i}`} className="cal-cell cal-cell-empty" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = padDate(year, month, day)
          const dayJobs = jobsByDate[dateStr] || []
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate

          return (
            <div key={day}
              className={`cal-cell${isToday ? ' cal-today' : ''}${isSelected ? ' cal-selected' : ''}`}
              onClick={() => setSelectedDate(dateStr)}>
              <div className="cal-day-num">{day}</div>
              {dayJobs.length > 0 && (
                <div className="cal-dots">
                  {dayJobs.slice(0, 3).map((j, idx) => {
                    const si = JOB_STATUSES.find(s => s.value === j.status)
                    return <div key={idx} className="cal-dot" style={{ background: si?.color || 'var(--blue)' }} />
                  })}
                  {dayJobs.length > 3 && <div className="cal-dot-more">+{dayJobs.length - 3}</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected day panel */}
      <div className="cal-day-panel">
        <div className="cal-day-panel-header">
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
              {selectedDate === todayStr ? 'Today' : fmtDate(selectedDate)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '1px' }}>
              {selectedJobs.length === 0 ? 'No jobs' : `${selectedJobs.length} job${selectedJobs.length !== 1 ? 's' : ''}`}
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onAddJob(selectedDate)}>+ Add Job</button>
        </div>

        {selectedJobs.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
            Nothing scheduled
          </div>
        ) : (
          selectedJobs.map(job => {
            const client = clients.find(c => c.id === job.clientId)
            const si = JOB_STATUSES.find(s => s.value === job.status)
            const timeStr = job.startTime
              ? job.endTime ? `${job.startTime}–${job.endTime}` : job.startTime
              : null
            return (
              <div key={job.id} className="cal-job-card" onClick={() => onJobClick(job)}>
                <div className="cal-job-status-bar" style={{ background: si?.color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text)', marginBottom: '2px' }}>
                    {job.description}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    {client?.name || 'Unknown client'}
                    {timeStr && <span style={{ color: 'var(--blue)', marginLeft: '6px' }}>⏱ {timeStr}</span>}
                  </div>
                </div>
                <span className="job-status-badge" style={{ background: si?.color + '22', color: si?.color, flexShrink: 0 }}>
                  {si?.label}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
