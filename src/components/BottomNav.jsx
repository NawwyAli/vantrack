export default function BottomNav({ view, setView }) {
  const isDashboard = view === 'dashboard'
  const isClients = view === 'clients' || view === 'client-detail'
  const isProfile = view === 'profile'

  return (
    <nav className="bottom-nav">
      <button
        className={`nav-tab${isDashboard ? ' active' : ''}`}
        onClick={() => setView('dashboard')}
        aria-label="Dashboard"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        Dashboard
      </button>
      <button
        className={`nav-tab${isClients ? ' active' : ''}`}
        onClick={() => setView('clients')}
        aria-label="Clients"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="7" r="3"/>
          <path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
          <circle cx="17" cy="8" r="2.5"/>
          <path d="M21 20c0-2.761-1.791-5-4-5"/>
        </svg>
        Clients
      </button>
      <button
        className={`nav-tab${isProfile ? ' active' : ''}`}
        onClick={() => setView('profile')}
        aria-label="Profile"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/>
        </svg>
        Profile
      </button>
    </nav>
  )
}
