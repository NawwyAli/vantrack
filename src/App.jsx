import { useState } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { useData } from './hooks/useData.js'

import AuthScreen from './components/AuthScreen.jsx'
import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import Dashboard from './components/Dashboard.jsx'
import ClientsView from './components/ClientsView.jsx'
import ClientDetail from './components/ClientDetail.jsx'
import ClientForm from './components/ClientForm.jsx'
import CertModal from './components/CertModal.jsx'
import AddPropertyModal from './components/AddPropertyModal.jsx'

export default function App() {
  const { user, profile, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const {
    clients, loading: dataLoading,
    addClient, updateClient, deleteClient,
    addProperty, deleteProperty, saveCertificate,
  } = useData(user)

  const [view, setView] = useState('dashboard')
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [certModal, setCertModal] = useState(null)
  const [addPropertyModal, setAddPropertyModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving] = useState(false)

  const selectedClient = clients.find(c => c.id === selectedClientId) || null

  // Show full-screen loader while checking auth
  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading-icon">🚐</div>
        <div className="app-loading-text">VanTrack</div>
      </div>
    )
  }

  // Not logged in → show auth screen
  if (!user) return <AuthScreen onSignIn={signIn} onSignUp={signUp} />

  // --- Async CRUD handlers ---

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

  // --- Navigation ---

  function handleClientClick(clientId) { setSelectedClientId(clientId); setView('client-detail') }
  function handleBack() { setView('clients'); setSelectedClientId(null) }
  function handleEditClient() { setEditingClient(selectedClient); setClientFormOpen(true) }
  function handleAddClientOpen() { setEditingClient(null); setClientFormOpen(true) }
  function handleRenewFromDashboard(clientId, propertyId) { setCertModal({ clientId, propertyId }) }
  function handleAddCertFromDashboard(clientId, propertyId) { setCertModal({ clientId, propertyId }) }
  function handleRenewFromDetail(propertyId) { setCertModal({ clientId: selectedClientId, propertyId }) }
  function handleAddCertFromDetail(propertyId) { setCertModal({ clientId: selectedClientId, propertyId }) }
  function handleAddPropertyClick() { setAddPropertyModal({ clientId: selectedClientId }) }
  function handleDeletePropertyPrompt(propertyId) { setDeleteConfirm({ type: 'property', clientId: selectedClientId, propertyId }) }
  function handleDeleteClientPrompt() { setDeleteConfirm({ type: 'client', clientId: selectedClientId }) }
  function handleConfirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'client') handleDeleteClient(deleteConfirm.clientId)
    else handleDeleteProperty(deleteConfirm.clientId, deleteConfirm.propertyId)
  }

  const certModalProperty = certModal
    ? clients.find(c => c.id === certModal.clientId)?.properties.find(p => p.id === certModal.propertyId)
    : null

  return (
    <div className="app">
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
          onRenew={handleRenewFromDashboard}
          onClientClick={handleClientClick}
          onAddCert={handleAddCertFromDashboard}
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
          onDeleteProperty={handleDeletePropertyPrompt}
          onRenew={handleRenewFromDetail}
          onAddCert={handleAddCertFromDetail}
        />
      )}

      {view === 'clients' && (
        <button className="fab" onClick={handleAddClientOpen} aria-label="Add client">+</button>
      )}

      <BottomNav view={view} setView={v => { setView(v); if (v !== 'client-detail') setSelectedClientId(null) }} />

      {/* Modals */}
      {clientFormOpen && (
        <ClientForm
          client={editingClient}
          saving={saving}
          onSubmit={editingClient ? data => handleUpdateClient(editingClient.id, data) : handleAddClient}
          onClose={() => { setClientFormOpen(false); setEditingClient(null) }}
        />
      )}

      {certModal && certModalProperty && (
        <CertModal
          property={certModalProperty}
          saving={saving}
          onSubmit={(issueDate, notes) => handleSaveCertificate(certModal.clientId, certModal.propertyId, issueDate, notes)}
          onClose={() => setCertModal(null)}
        />
      )}

      {addPropertyModal && (
        <AddPropertyModal
          saving={saving}
          onSubmit={address => handleAddProperty(addPropertyModal.clientId, address)}
          onClose={() => setAddPropertyModal(null)}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">
              {deleteConfirm.type === 'client' ? 'Delete Client?' : 'Delete Property?'}
            </div>
            <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.5', marginBottom: '8px' }}>
              {deleteConfirm.type === 'client'
                ? 'This will permanently delete the client and all their properties and certificate history.'
                : 'This will permanently delete the property and its certificate history.'}
            </p>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '8px' }}>This action cannot be undone.</p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleConfirmDelete} disabled={saving}>
                {saving ? 'Deleting…' : deleteConfirm.type === 'client' ? 'Delete Client' : 'Delete Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
