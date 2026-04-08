export default function Header({ view, selectedClient, profile, onBack, onEdit, onAddClient, onSignOut }) {
  const renderLeft = () => {
    if (view === 'client-detail') {
      return (
        <button className="back-btn" onClick={onBack}>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      )
    }
    return null
  }

  const renderTitle = () => {
    if (view === 'dashboard') return 'VanTrack 🚐'
    if (view === 'clients') return 'Clients'
    if (view === 'client-detail') return selectedClient?.name || 'Client'
    if (view === 'profile') return 'Profile'
    return 'VanTrack'
  }

  const handleSupport = () => {
    window.location.href = 'mailto:vantrack@outlook.com?subject=VanTrack%20Support'
  }

  const supportBtn = (
    <button className="icon-btn" onClick={handleSupport} aria-label="Contact support" title="Contact support">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <circle cx="12" cy="17" r=".5" fill="currentColor"/>
      </svg>
    </button>
  )

  const renderRight = () => {
    if (view === 'dashboard') {
      return (
        <div style={{ display: 'flex', gap: '4px' }}>
          {supportBtn}
          <button className="icon-btn" onClick={onSignOut} aria-label="Sign out" title="Sign out">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M13 14l3-4-3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )
    }
    if (view === 'clients') {
      return (
        <div style={{ display: 'flex', gap: '4px' }}>
          {supportBtn}
          <button className="icon-btn" onClick={onAddClient} aria-label="Add client">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )
    }
    if (view === 'client-detail') {
      return (
        <div style={{ display: 'flex', gap: '4px' }}>
          {supportBtn}
          <button className="icon-btn" onClick={onEdit} aria-label="Edit client">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M14.5 2.5L17.5 5.5L7 16H4V13L14.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )
    }
    if (view === 'profile') {
      return supportBtn
    }
    return null
  }

  return (
    <div className="header">
      <div className="header-left">{renderLeft()}</div>
      <div className="header-title">{renderTitle()}</div>
      <div className="header-right">{renderRight()}</div>
    </div>
  )
}
