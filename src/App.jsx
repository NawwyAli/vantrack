import { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { genId } from './utils.js'

import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import Dashboard from './components/Dashboard.jsx'
import ClientsView from './components/ClientsView.jsx'
import ClientDetail from './components/ClientDetail.jsx'
import ClientForm from './components/ClientForm.jsx'
import CertModal from './components/CertModal.jsx'
import AddPropertyModal from './components/AddPropertyModal.jsx'

export default function App() {
  const [clients, setClients] = useLocalStorage('vantrack_clients', [])
  const [view, setView] = useState('dashboard')
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [certModal, setCertModal] = useState(null) // { clientId, propertyId }
  const [addPropertyModal, setAddPropertyModal] = useState(null) // { clientId }
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { type, clientId, propertyId? }

  const selectedClient = clients.find(c => c.id === selectedClientId) || null

  // --- CRUD Operations ---

  function addClient(data) {
    const properties = []
    if (data.propertyAddress) {
      const cert = data.certIssueDate
        ? { id: genId(), issueDate: data.certIssueDate, notes: '' }
        : null
      properties.push({ id: genId(), address: data.propertyAddress, certificate: cert, history: [] })
    }
    const newClient = {
      id: genId(),
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email || '',
      properties,
      createdAt: new Date().toISOString(),
    }
    setClients(prev => [...prev, newClient])
    setClientFormOpen(false)
  }

  function updateClient(id, data) {
    setClients(prev => prev.map(c => c.id === id ? { ...c, name: data.name, address: data.address, phone: data.phone, email: data.email || '' } : c))
    setClientFormOpen(false)
    setEditingClient(null)
  }

  function deleteClient(id) {
    setClients(prev => prev.filter(c => c.id !== id))
    if (selectedClientId === id) {
      setSelectedClientId(null)
      setView('clients')
    }
    setDeleteConfirm(null)
  }

  function addProperty(clientId, address) {
    const newProperty = {
      id: genId(),
      address,
      certificate: null,
      history: [],
    }
    setClients(prev => prev.map(c =>
      c.id === clientId
        ? { ...c, properties: [...c.properties, newProperty] }
        : c
    ))
    setAddPropertyModal(null)
  }

  function deleteProperty(clientId, propertyId) {
    setClients(prev => prev.map(c =>
      c.id === clientId
        ? { ...c, properties: c.properties.filter(p => p.id !== propertyId) }
        : c
    ))
    setDeleteConfirm(null)
  }

  function saveCertificate(clientId, propertyId, issueDate, notes) {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c
      return {
        ...c,
        properties: c.properties.map(p => {
          if (p.id !== propertyId) return p
          const newCert = { id: genId(), issueDate, notes }
          const history = p.certificate
            ? [...(p.history || []), p.certificate]
            : (p.history || [])
          return { ...p, certificate: newCert, history }
        })
      }
    }))
    setCertModal(null)
  }

  // --- Navigation handlers ---

  function handleClientClick(clientId) {
    setSelectedClientId(clientId)
    setView('client-detail')
  }

  function handleBack() {
    setView('clients')
    setSelectedClientId(null)
  }

  function handleEditClient() {
    setEditingClient(selectedClient)
    setClientFormOpen(true)
  }

  function handleAddClient() {
    setEditingClient(null)
    setClientFormOpen(true)
  }

  // Dashboard: open cert modal for renew/add
  function handleRenewFromDashboard(clientId, propertyId) {
    setCertModal({ clientId, propertyId })
  }

  function handleAddCertFromDashboard(clientId, propertyId) {
    setCertModal({ clientId, propertyId })
  }

  // Client detail: open cert modal
  function handleRenewFromDetail(propertyId) {
    setCertModal({ clientId: selectedClientId, propertyId })
  }

  function handleAddCertFromDetail(propertyId) {
    setCertModal({ clientId: selectedClientId, propertyId })
  }

  function handleAddProperty() {
    setAddPropertyModal({ clientId: selectedClientId })
  }

  function handleDeletePropertyPrompt(propertyId) {
    setDeleteConfirm({ type: 'property', clientId: selectedClientId, propertyId })
  }

  function handleDeleteClientPrompt() {
    setDeleteConfirm({ type: 'client', clientId: selectedClientId })
  }

  // Confirm delete
  function handleConfirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'client') {
      deleteClient(deleteConfirm.clientId)
    } else if (deleteConfirm.type === 'property') {
      deleteProperty(deleteConfirm.clientId, deleteConfirm.propertyId)
    }
  }

  // Cert modal: get property
  const certModalProperty = certModal
    ? clients
        .find(c => c.id === certModal.clientId)
        ?.properties.find(p => p.id === certModal.propertyId)
    : null

  return (
    <div className="app">
      <Header
        view={view}
        selectedClient={selectedClient}
        onBack={handleBack}
        onEdit={handleEditClient}
        onAddClient={handleAddClient}
      />

      {view === 'dashboard' && (
        <Dashboard
          clients={clients}
          onRenew={handleRenewFromDashboard}
          onClientClick={handleClientClick}
          onAddCert={handleAddCertFromDashboard}
        />
      )}

      {view === 'clients' && (
        <ClientsView
          clients={clients}
          onClientClick={handleClientClick}
        />
      )}

      {view === 'client-detail' && selectedClient && (
        <ClientDetail
          client={selectedClient}
          onBack={handleBack}
          onEdit={handleEditClient}
          onDelete={handleDeleteClientPrompt}
          onAddProperty={handleAddProperty}
          onDeleteProperty={handleDeletePropertyPrompt}
          onRenew={handleRenewFromDetail}
          onAddCert={handleAddCertFromDetail}
        />
      )}

      {/* FAB for adding clients on the clients view */}
      {view === 'clients' && (
        <button className="fab" onClick={handleAddClient} aria-label="Add client">
          +
        </button>
      )}

      <BottomNav view={view} setView={v => {
        setView(v)
        if (v !== 'client-detail') setSelectedClientId(null)
      }} />

      {/* Modals */}
      {clientFormOpen && (
        <ClientForm
          client={editingClient}
          onSubmit={editingClient ? data => updateClient(editingClient.id, data) : addClient}
          onClose={() => { setClientFormOpen(false); setEditingClient(null) }}
        />
      )}

      {certModal && certModalProperty && (
        <CertModal
          property={certModalProperty}
          onSubmit={(issueDate, notes) => saveCertificate(certModal.clientId, certModal.propertyId, issueDate, notes)}
          onClose={() => setCertModal(null)}
        />
      )}

      {addPropertyModal && (
        <AddPropertyModal
          onSubmit={address => addProperty(addPropertyModal.clientId, address)}
          onClose={() => setAddPropertyModal(null)}
        />
      )}

      {/* Delete confirm overlay */}
      {deleteConfirm && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}
        >
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
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '8px' }}>
              This action cannot be undone.
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                {deleteConfirm.type === 'client' ? 'Delete Client' : 'Delete Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
