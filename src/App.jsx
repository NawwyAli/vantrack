import { useState, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { useData } from './hooks/useData.js'

import AuthScreen from './components/AuthScreen.jsx'
import TrialWall from './components/TrialWall.jsx'
import LegalPage from './components/LegalPage.jsx'
import Onboarding from './components/Onboarding.jsx'
import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import Dashboard from './components/Dashboard.jsx'
import ClientsView from './components/ClientsView.jsx'
import ClientDetail from './components/ClientDetail.jsx'
import ClientForm from './components/ClientForm.jsx'
import CertModal from './components/CertModal.jsx'
import AddPropertyModal from './components/AddPropertyModal.jsx'

export default function App() {
  const { user, profile, loading: authLoading, signIn, signUp, signOut, resetPassword, refreshProfile } = useAuth()
  const {
    clients, loading: dataLoading,
    addClient, updateClient, deleteClient,
    addProperty, updateProperty, deleteProperty,
    saveCertificate, updateCertificate, deleteCertificate,
  } = useData(user)

  const [view, setView] = useState('dashboard')
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  // certModal: { clientId, propertyId, editMode? }
  const [certModal, setCertModal] = useState(null)
  // addPropertyModal: { clientId, propertyId?, initialAddress? }
  const [addPropertyModal, setAddPropertyModal] = useState(null)
  // deleteConfirm: { type: 'client'|'property'|'certificate', clientId, propertyId? }
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [legalPage, setLegalPage] = useState(null) // 'privacy' | 'terms'
  const [showOnboarding, setShowOnboarding] = useState(
    () => user ? !localStorage.getItem(`vantrack_onboarded_${user.id}`) : false
  )
  const [paymentProcessing, setPaymentProcessing] = useState(
    () => new URLSearchParams(window.location.search).get('payment') === 'success'
  )
  const pollRef = useRef(null)

  // Poll for subscription activation after Stripe redirect
  useEffect(() => {
    if (!paymentProcessing || !user) return
    window.history.replaceState({}, '', '/')
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      const updated = await refreshProfile()
      if (updated?.subscription_status === 'active' || attempts >= 10) {
        clearInterval(pollRef.current)
        setPaymentProcessing(false)
      }
    }, 2000)
    return () => clearInterval(pollRef.current)
  }, [paymentProcessing, user])

  const selectedClient = clients.find(c => c.id === selectedClientId) || null

  if (legalPage) return <LegalPage page={legalPage} onBack={() => setLegalPage(null)} />

  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading-icon">🚐</div>
        <div className="app-loading-text">VanTrack</div>
      </div>
    )
  }

  if (!user) return <AuthScreen onSignIn={signIn} onSignUp={signUp} onResetPassword={resetPassword} onShowLegal={setLegalPage} />

  if (paymentProcessing) {
    return (
      <div className="app-loading">
        <div className="app-loading-icon">✅</div>
        <div className="app-loading-text">Activating your subscription…</div>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '8px' }}>This usually takes a few seconds.</p>
      </div>
    )
  }

  // --- Access check ---
  function getTrialInfo(profile) {
    if (!profile) return { hasAccess: null, daysLeft: 0, isTrial: false }
    if (profile.subscription_status === 'active') return { hasAccess: true, daysLeft: null, isTrial: false }
    if (profile.subscription_status === 'trialing' && profile.trial_ends_at) {
      const daysLeft = Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000)
      return { hasAccess: daysLeft > 0, daysLeft, isTrial: true }
    }
    return { hasAccess: false, daysLeft: 0, isTrial: false }
  }

  const { hasAccess, daysLeft, isTrial } = getTrialInfo(profile)
  if (hasAccess === null) {
    return (
      <div className="app-loading">
        <div className="app-loading-icon">🚐</div>
        <div className="app-loading-text">VanTrack</div>
      </div>
    )
  }
  if (!hasAccess) return <TrialWall user={user} onSignOut={signOut} />
  const showTrialBanner = isTrial && daysLeft !== null && daysLeft > 0

  function dismissOnboarding() {
    localStorage.setItem(`vantrack_onboarded_${user.id}`, '1')
    setShowOnboarding(false)
  }

  // --- CRUD handlers ---

  async function handleAddClient(data) {
    setSaving(true)
    try { await addClient(data); setClientFormOpen(false) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleUpdateClient(id, data) {
    setSaving(true)
    try { await updateClient(id, data); setClientFormOpen(false); setEditingClient(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteClient(id) {
    setSaving(true)
    try {
      await deleteClient(id)
      if (selectedClientId === id) { setSelectedClientId(null); setView('clients') }
      setDeleteConfirm(null)
    }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleAddProperty(clientId, address) {
    setSaving(true)
    try { await addProperty(clientId, address); setAddPropertyModal(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleUpdateProperty(propertyId, address) {
    setSaving(true)
    try { await updateProperty(propertyId, address); setAddPropertyModal(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteProperty(clientId, propertyId) {
    setSaving(true)
    try { await deleteProperty(clientId, propertyId); setDeleteConfirm(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleSaveCertificate(clientId, propertyId, issueDate, notes) {
    setSaving(true)
    try { await saveCertificate(clientId, propertyId, issueDate, notes); setCertModal(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleUpdateCertificate(certId, issueDate, notes) {
    setSaving(true)
    try { await updateCertificate(certId, issueDate, notes); setCertModal(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteCertificate(propertyId) {
    setSaving(true)
    try { await deleteCertificate(propertyId); setDeleteConfirm(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  // --- Navigation ---

  function handleClientClick(clientId) { setSelectedClientId(clientId); setView('client-detail') }
  function handleBack() { setView('clients'); setSelectedClientId(null) }
  function handleEditClient() { setEditingClient(selectedClient); setClientFormOpen(true) }
  function handleAddClientOpen() { setEditingClient(null); setClientFormOpen(true) }
  function handleAddPropertyClick() { setAddPropertyModal({ clientId: selectedClientId }) }
  function handleEditPropertyClick(propertyId, address) {
    setAddPropertyModal({ clientId: selectedClientId, propertyId, initialAddress: address })
  }
  function handleDeletePropertyPrompt(propertyId) {
    setDeleteConfirm({ type: 'property', clientId: selectedClientId, propertyId })
  }
  function handleDeleteClientPrompt() {
    setDeleteConfirm({ type: 'client', clientId: selectedClientId })
  }
  function handleDeleteCertPrompt(propertyId) {
    setDeleteConfirm({ type: 'certificate', clientId: selectedClientId, propertyId })
  }
  function handleConfirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'client') handleDeleteClient(deleteConfirm.clientId)
    else if (deleteConfirm.type === 'property') handleDeleteProperty(deleteConfirm.clientId, deleteConfirm.propertyId)
    else if (deleteConfirm.type === 'certificate') handleDeleteCertificate(deleteConfirm.propertyId)
  }

  const certModalProperty = certModal
    ? clients.find(c => c.id === certModal.clientId)?.properties.find(p => p.id === certModal.propertyId)
    : null

  const deleteMessages = {
    client: {
      title: 'Delete Client?',
      body: 'This will permanently delete the client and all their properties and certificate history.',
      btn: 'Delete Client',
    },
    property: {
      title: 'Delete Property?',
      body: 'This will permanently delete the property and its certificate history.',
      btn: 'Delete Property',
    },
    certificate: {
      title: 'Delete Certificate?',
      body: 'This will remove the current active certificate. Past certificates in history are unaffected.',
      btn: 'Delete Certificate',
    },
  }
  const confirmMsg = deleteConfirm ? deleteMessages[deleteConfirm.type] : null

  return (
    <div className={`app${showTrialBanner ? ' has-trial-banner' : ''}`}>
      {showTrialBanner && (
        <div className="trial-banner">
          ⏰ {daysLeft === 1 ? 'Last day' : `${daysLeft} days`} left in your free trial
          <span className="trial-banner-cta" onClick={() => alert('Stripe integration coming soon')}>Subscribe →</span>
        </div>
      )}
      <Header
        view={view}
        selectedClient={selectedClient}
        profile={profile}
        onBack={handleBack}
        onEdit={handleEditClient}
        onAddClient={handleAddClientOpen}
        onSignOut={signOut}
      />

      {view === 'dashboard' && (
        <Dashboard
          clients={clients}
          loading={dataLoading}
          onRenew={(clientId, propertyId) => setCertModal({ clientId, propertyId })}
          onClientClick={handleClientClick}
          onAddCert={(clientId, propertyId) => setCertModal({ clientId, propertyId })}
        />
      )}

      {view === 'clients' && (
        <ClientsView clients={clients} loading={dataLoading} onClientClick={handleClientClick} />
      )}

      {view === 'client-detail' && selectedClient && (
        <ClientDetail
          client={selectedClient}
          onBack={handleBack}
          onEdit={handleEditClient}
          onDelete={handleDeleteClientPrompt}
          onAddProperty={handleAddPropertyClick}
          onEditProperty={handleEditPropertyClick}
          onDeleteProperty={handleDeletePropertyPrompt}
          onRenew={propertyId => setCertModal({ clientId: selectedClientId, propertyId })}
          onAddCert={propertyId => setCertModal({ clientId: selectedClientId, propertyId })}
          onEditCert={propertyId => setCertModal({ clientId: selectedClientId, propertyId, editMode: true })}
          onDeleteCert={handleDeleteCertPrompt}
        />
      )}

      {view === 'clients' && (
        <button className="fab" onClick={handleAddClientOpen} aria-label="Add client">+</button>
      )}

      <div className="app-legal-footer">
        <button className="legal-link" onClick={() => setLegalPage('privacy')}>Privacy</button>
        <span style={{ color: 'var(--text3)' }}>·</span>
        <button className="legal-link" onClick={() => setLegalPage('terms')}>Terms</button>
      </div>

      <BottomNav view={view} setView={v => { setView(v); if (v !== 'client-detail') setSelectedClientId(null) }} />

      {/* Client form modal */}
      {clientFormOpen && (
        <ClientForm
          client={editingClient}
          saving={saving}
          onSubmit={editingClient ? data => handleUpdateClient(editingClient.id, data) : handleAddClient}
          onClose={() => { setClientFormOpen(false); setEditingClient(null) }}
        />
      )}

      {/* Add / Renew / Edit certificate modal */}
      {certModal && certModalProperty && (
        <CertModal
          property={certModalProperty}
          saving={saving}
          editMode={!!certModal.editMode}
          onSubmit={(issueDate, notes) => {
            if (certModal.editMode) {
              handleUpdateCertificate(certModalProperty.certificate.id, issueDate, notes)
            } else {
              handleSaveCertificate(certModal.clientId, certModal.propertyId, issueDate, notes)
            }
          }}
          onClose={() => setCertModal(null)}
        />
      )}

      {/* Add / Edit property modal */}
      {addPropertyModal && (
        <AddPropertyModal
          saving={saving}
          initialAddress={addPropertyModal.initialAddress}
          onSubmit={address => {
            if (addPropertyModal.propertyId) {
              handleUpdateProperty(addPropertyModal.propertyId, address)
            } else {
              handleAddProperty(addPropertyModal.clientId, address)
            }
          }}
          onClose={() => setAddPropertyModal(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {/* Onboarding overlay */}
      {showOnboarding && (
        <Onboarding
          saving={saving}
          onAddClient={async data => {
            setSaving(true)
            try { await addClient(data) }
            catch (err) { alert(err.message); throw err }
            finally { setSaving(false) }
          }}
          onComplete={dismissOnboarding}
          onSkip={dismissOnboarding}
        />
      )}

      {deleteConfirm && confirmMsg && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">{confirmMsg.title}</div>
            <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.5', marginBottom: '8px' }}>
              {confirmMsg.body}
            </p>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '8px' }}>This action cannot be undone.</p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleConfirmDelete} disabled={saving}>
                {saving ? 'Deleting…' : confirmMsg.btn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
