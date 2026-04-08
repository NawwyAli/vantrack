import { useState, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { useData } from './hooks/useData.js'
import { useJobs } from './hooks/useJobs.js'
import { useQuotes } from './hooks/useQuotes.js'
import { useInvoices } from './hooks/useInvoices.js'
import { useEngineerProfile } from './hooks/useEngineerProfile.js'

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
import ProfileView from './components/ProfileView.jsx'
import JobsView from './components/JobsView.jsx'
import JobForm from './components/JobForm.jsx'
import JobDetail from './components/JobDetail.jsx'
import QuotesView from './components/QuotesView.jsx'
import QuoteForm from './components/QuoteForm.jsx'
import QuoteDetail from './components/QuoteDetail.jsx'
import InvoicesView from './components/InvoicesView.jsx'
import InvoiceForm from './components/InvoiceForm.jsx'
import InvoiceDetail from './components/InvoiceDetail.jsx'

export default function App() {
  const { user, profile, loading: authLoading, signIn, signUp, signOut, resetPassword, refreshProfile, updateRole } = useAuth()
  const {
    clients, loading: dataLoading,
    addClient, updateClient, deleteClient,
    addProperty, updateProperty, deleteProperty,
    saveCertificate, updateCertificate, deleteCertificate,
  } = useData(user)
  const {
    jobs, loading: jobsLoading,
    addJob, updateJob, updateJobStatus, archiveJob, deleteJob, duplicateJob,
    uploadJobPhoto, deleteJobPhoto,
    addNote, deleteNote, fetchNotes,
  } = useJobs(user)
  const { quotes, loading: quotesLoading, addQuote, updateQuote, updateQuoteStatus, deleteQuote, duplicateQuote } = useQuotes(user)
  const {
    invoices, loading: invoicesLoading,
    addInvoice, updateInvoice, updateInvoiceStatus, savePaymentLink,
    deleteInvoice, duplicateInvoice,
    invoiceDataFromJob, invoiceDataFromQuote,
  } = useInvoices(user)
  const { engineerProfile, saveEngineerProfile } = useEngineerProfile(user)

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
  const [subscribing, setSubscribing] = useState(false)
  const [jobFormOpen, setJobFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [jobFormClientId, setJobFormClientId] = useState(null)
  const [workTab, setWorkTab] = useState('jobs') // 'jobs' | 'quotes'
  const [quoteFormOpen, setQuoteFormOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState(null)
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [quoteFilter, setQuoteFilter] = useState('all')
  const [quoteFormJobId, setQuoteFormJobId] = useState(null)
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceFilter, setInvoiceFilter] = useState('all')
  const [prefillInvoice, setPrefillInvoice] = useState(null)

  async function handleSubscribe() {
    setSubscribing(true)
    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, email: user.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session')
      window.location.href = data.url
    } catch (err) {
      alert(err.message)
      setSubscribing(false)
    }
  }
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

  // --- Job handlers ---

  async function handleAddJob(data) {
    setSaving(true)
    try { await addJob(data); setJobFormOpen(false); setJobFormClientId(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleUpdateJob(id, data) {
    setSaving(true)
    try { await updateJob(id, data); setJobFormOpen(false); setEditingJob(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteJob(id) {
    setSaving(true)
    try { await deleteJob(id); setSelectedJob(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDuplicateJob(job) {
    setSaving(true)
    try { await duplicateJob(job); setSelectedJob(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  function handleOpenJobForm(clientId = null) {
    setEditingJob(null)
    setJobFormClientId(clientId)
    setJobFormOpen(true)
  }

  function handleEditJob(job) {
    setEditingJob(job)
    setSelectedJob(null)
    setJobFormOpen(true)
  }

  // --- Quote handlers ---

  async function handleAddQuote(data) {
    setSaving(true)
    try { await addQuote(data); setQuoteFormOpen(false); setQuoteFormJobId(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleUpdateQuote(id, data) {
    setSaving(true)
    try { await updateQuote(id, data); setQuoteFormOpen(false); setEditingQuote(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteQuote(id) {
    setSaving(true)
    try { await deleteQuote(id); setSelectedQuote(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDuplicateQuote(quote) {
    setSaving(true)
    try { await duplicateQuote(quote); setSelectedQuote(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  // --- Invoice handlers ---

  async function handleAddInvoice(data) {
    setSaving(true)
    try { await addInvoice(data); setInvoiceFormOpen(false); setPrefillInvoice(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleUpdateInvoice(id, data) {
    setSaving(true)
    try { await updateInvoice(id, data); setInvoiceFormOpen(false); setEditingInvoice(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteInvoice(id) {
    setSaving(true)
    try { await deleteInvoice(id); setSelectedInvoice(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDuplicateInvoice(invoice) {
    setSaving(true)
    try { await duplicateInvoice(invoice); setSelectedInvoice(null) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  function handleCreateInvoiceFromJob(job) {
    setSelectedJob(null)
    setEditingInvoice(null)
    setPrefillInvoice(invoiceDataFromJob(job))
    setWorkTab('invoices')
    setInvoiceFormOpen(true)
  }

  function handleConvertQuoteToInvoice(quote) {
    setSelectedQuote(null)
    setEditingInvoice(null)
    setPrefillInvoice(invoiceDataFromQuote(quote))
    setWorkTab('invoices')
    setInvoiceFormOpen(true)
  }

  function handleCreateQuoteFromJob(job) {
    setSelectedJob(null)
    setEditingQuote(null)
    setQuoteFormJobId(job.id)
    setWorkTab('quotes')
    setQuoteFormOpen(true)
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
          <span className="trial-banner-cta" onClick={handleSubscribe}>{subscribing ? 'Redirecting…' : 'Subscribe →'}</span>
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
          invoices={invoices}
          onGoToInvoices={() => { setView('jobs'); setWorkTab('invoices') }}
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
          jobs={jobs.filter(j => j.clientId === selectedClientId && !j.archived)}
          onJobClick={job => setSelectedJob(job)}
          onAddJob={() => handleOpenJobForm(selectedClientId)}
          fetchNotes={fetchNotes}
          addNote={addNote}
          deleteNote={deleteNote}
        />
      )}

      {view === 'jobs' && (
        <JobsView
          jobs={jobs}
          clients={clients}
          loading={jobsLoading}
          onJobClick={job => setSelectedJob(job)}
          onAddJob={() => handleOpenJobForm()}
          workTab={workTab}
          onWorkTabChange={setWorkTab}
          quotesSlot={
            <QuotesView
              quotes={quotes}
              clients={clients}
              loading={quotesLoading}
              filter={quoteFilter}
              onFilterChange={setQuoteFilter}
              onQuoteClick={q => setSelectedQuote(q)}
              onAddQuote={() => { setEditingQuote(null); setQuoteFormJobId(null); setQuoteFormOpen(true) }}
              engineerProfile={engineerProfile}
            />
          }
          invoicesSlot={
            <InvoicesView
              invoices={invoices}
              clients={clients}
              loading={invoicesLoading}
              filter={invoiceFilter}
              onFilterChange={setInvoiceFilter}
              onInvoiceClick={inv => setSelectedInvoice(inv)}
              onAddInvoice={() => { setEditingInvoice(null); setPrefillInvoice(null); setInvoiceFormOpen(true) }}
              engineerProfile={engineerProfile}
            />
          }
        />
      )}

      {view === 'profile' && (
        <ProfileView
          user={user}
          profile={profile}
          engineerProfile={engineerProfile}
          onSignOut={signOut}
          onResetPassword={resetPassword}
          onUpdateRole={updateRole}
          onSaveEngineerProfile={saveEngineerProfile}
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

      {/* Job form modal */}
      {jobFormOpen && (
        <JobForm
          clients={clients}
          job={editingJob ? { ...editingJob, clientId: editingJob.clientId } : (jobFormClientId ? { clientId: jobFormClientId } : null)}
          saving={saving}
          onSubmit={editingJob ? data => handleUpdateJob(editingJob.id, data) : handleAddJob}
          onClose={() => { setJobFormOpen(false); setEditingJob(null); setJobFormClientId(null) }}
        />
      )}

      {/* Job detail modal */}
      {selectedJob && (
        <JobDetail
          job={jobs.find(j => j.id === selectedJob.id) || selectedJob}
          clients={clients}
          onClose={() => setSelectedJob(null)}
          onEdit={() => handleEditJob(selectedJob)}
          onDelete={handleDeleteJob}
          onArchive={archiveJob}
          onDuplicate={() => handleDuplicateJob(selectedJob)}
          onStatusChange={updateJobStatus}
          onUploadPhoto={uploadJobPhoto}
          onDeletePhoto={deleteJobPhoto}
          onCreateQuote={() => handleCreateQuoteFromJob(selectedJob)}
          onCreateInvoice={() => handleCreateInvoiceFromJob(selectedJob)}
        />
      )}

      {/* Quote form modal */}
      {quoteFormOpen && (
        <QuoteForm
          clients={clients}
          jobs={jobs}
          engineerProfile={engineerProfile}
          quote={editingQuote ? editingQuote : (quoteFormJobId ? { jobId: quoteFormJobId, clientId: jobs.find(j => j.id === quoteFormJobId)?.clientId || '' } : null)}
          saving={saving}
          onSubmit={editingQuote ? data => handleUpdateQuote(editingQuote.id, data) : handleAddQuote}
          onClose={() => { setQuoteFormOpen(false); setEditingQuote(null); setQuoteFormJobId(null) }}
        />
      )}

      {/* Quote detail modal */}
      {selectedQuote && (
        <QuoteDetail
          quote={quotes.find(q => q.id === selectedQuote.id) || selectedQuote}
          clients={clients}
          engineerProfile={engineerProfile}
          onClose={() => setSelectedQuote(null)}
          onEdit={() => { setEditingQuote(selectedQuote); setSelectedQuote(null); setQuoteFormOpen(true) }}
          onDelete={handleDeleteQuote}
          onDuplicate={() => handleDuplicateQuote(selectedQuote)}
          onStatusChange={updateQuoteStatus}
          onConvertToInvoice={() => handleConvertQuoteToInvoice(selectedQuote)}
        />
      )}

      {/* Invoice form modal */}
      {invoiceFormOpen && (
        <InvoiceForm
          clients={clients}
          engineerProfile={engineerProfile}
          invoice={editingInvoice || prefillInvoice || null}
          saving={saving}
          onSubmit={editingInvoice ? data => handleUpdateInvoice(editingInvoice.id, data) : handleAddInvoice}
          onClose={() => { setInvoiceFormOpen(false); setEditingInvoice(null); setPrefillInvoice(null) }}
        />
      )}

      {/* Invoice detail modal */}
      {selectedInvoice && (
        <InvoiceDetail
          invoice={invoices.find(i => i.id === selectedInvoice.id) || selectedInvoice}
          clients={clients}
          engineerProfile={engineerProfile}
          onClose={() => setSelectedInvoice(null)}
          onEdit={() => { setEditingInvoice(selectedInvoice); setSelectedInvoice(null); setInvoiceFormOpen(true) }}
          onDelete={handleDeleteInvoice}
          onDuplicate={() => handleDuplicateInvoice(selectedInvoice)}
          onStatusChange={updateInvoiceStatus}
          onSavePaymentLink={savePaymentLink}
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
