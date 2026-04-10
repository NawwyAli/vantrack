export default function BottomNav({ view, setView }) {
  const isDashboard = view === 'dashboard'
  const isClients = view === 'clients' || view === 'client-detail'
  const isJobs = view === 'jobs'
  const isFinance = view === 'finance'
  const isProfile = view === 'profile'

  return (
    <nav className="bottom-nav">
      <button className={`nav-tab${isDashboard ? ' active' : ''}`} onClick={() => setView('dashboard')} aria-label="Dashboard">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        Dashboard
      </button>
      <button className={`nav-tab${isClients ? ' active' : ''}`} onClick={() => setView('clients')} aria-label="Clients">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="7" r="3"/>
          <path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
          <circle cx="17" cy="8" r="2.5"/>
          <path d="M21 20c0-2.761-1.791-5-4-5"/>
        </svg>
        Clients
      </button>
      <button className={`nav-tab${isJobs ? ' active' : ''}`} onClick={() => setView('jobs')} aria-label="Jobs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
          <line x1="12" y1="12" x2="12" y2="16"/>
          <line x1="10" y1="14" x2="14" y2="14"/>
        </svg>
        Jobs
      </button>
      <button className={`nav-tab${isFinance ? ' active' : ''}`} onClick={() => setView('finance')} aria-label="Finance">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path d="M2 10h20"/>
          <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
        Finance
      </button>
      <button className={`nav-tab${isProfile ? ' active' : ''}`} onClick={() => setView('profile')} aria-label="Profile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/>
        </svg>
        Profile
      </button>
    </nav>
  )
}
