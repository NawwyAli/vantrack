import { useState } from 'react'

export const BUILT_IN_TEMPLATES = [
  {
    id: 'gas_safety',
    name: 'Gas Safety Inspection (CP12)',
    items: [
      'Visual inspection of all gas appliances',
      'Check gas meter and emergency control valve',
      'Inspect all visible gas pipework for damage or corrosion',
      'Carry out gas tightness test',
      'Test all gas appliances for correct operation',
      'Check flue and terminal condition on all appliances',
      'Check ventilation provisions are adequate',
      'Test all appliance safety devices',
      'Verify correct gas pressure at appliances',
      'CO alarm present, correctly positioned, and tested',
      'Confirm all appliances are safe to use',
    ],
  },
  {
    id: 'boiler_service',
    name: 'Boiler Annual Service',
    items: [
      'Check boiler casing for damage or corrosion',
      'Inspect and clean heat exchanger',
      'Clean or replace burner assembly as required',
      'Inspect ignition electrodes — replace if worn',
      'Check flue integrity and terminal condition',
      'Test boiler controls and programmer/thermostat',
      'Check system pressure (cold fill 1–1.5 bar)',
      'Inspect expansion vessel and repressurise if needed',
      'Check condensate trap and pipe (condensing boilers)',
      'Test water quality and inhibitor level',
      'Test all safety limits (overheat thermostat etc.)',
      'Verify correct gas rate and operating pressure',
      'Run boiler through full heating cycle',
    ],
  },
  {
    id: 'landlord_cp12',
    name: 'Landlord Gas Safety Record (CP12)',
    items: [
      'Inspect all gas appliances at the property',
      'Gas tightness test on installation',
      'Check emergency control valve accessible and operational',
      'Inspect all visible pipework for condition',
      'Test all appliances for correct operation',
      'Check all flues and ventilation',
      'Test all safety devices on each appliance',
      'Verify gas pressure is correct at each appliance',
      'Check CO alarms present and tested',
      'Confirm appliances are safe to use',
      'Record all appliance details (make, model, location)',
    ],
  },
  {
    id: 'gas_tightness',
    name: 'Gas Tightness Test',
    items: [
      'Identify and record all gas appliances',
      'Turn off all appliances at the appliance valve',
      'Connect manometer to test point',
      'Pressurise installation to 20 mbar',
      'Allow 2 minutes stabilisation',
      'Record initial gauge pressure',
      'Allow 2 minutes test period',
      'Record final gauge pressure',
      'Confirm pressure drop ≤0.5 mbar',
      'If failed: locate and repair leak before retesting',
      'Purge and relight all appliances',
      'Confirm all appliances working correctly after purge',
    ],
  },
  {
    id: 'blank',
    name: 'Blank Checklist',
    items: [],
  },
]

export default function ChecklistForm({ jobs, clients, prefillJobId, saving, onSubmit, onClose }) {
  const [step, setStep] = useState('template')
  const [name, setName] = useState('')
  const [jobId, setJobId] = useState(prefillJobId || '')
  const [clientId, setClientId] = useState('')
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [errors, setErrors] = useState({})

  function handleSelectTemplate(tpl) {
    setName(tpl.id === 'blank' ? '' : tpl.name)
    setItems(tpl.items.map(label => ({ label, status: 'pending', notes: '' })))
    setStep('form')
  }

  function addItem() {
    const trimmed = newItem.trim()
    if (!trimmed) return
    setItems(prev => [...prev, { label: trimmed, status: 'pending', notes: '' }])
    setNewItem('')
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function moveItem(idx, dir) {
    setItems(prev => {
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  function handleSubmit() {
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (items.length === 0) errs.items = 'Add at least one checklist item'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const linkedJob = jobs.find(j => j.id === jobId)
    onSubmit({
      name: name.trim(),
      jobId: jobId || null,
      clientId: clientId || linkedJob?.clientId || null,
      items,
      engineerNotes: '',
    })
  }

  if (step === 'template') {
    return (
      <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="modal modal-tall">
          <div className="modal-handle" />
          <div className="modal-title">Choose Template</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {BUILT_IN_TEMPLATES.map(tpl => (
              <button key={tpl.id} className="template-option" onClick={() => handleSelectTemplate(tpl)}>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{tpl.name}</div>
                {tpl.items.length > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                    {tpl.items.length} items
                  </div>
                )}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-tall">
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setStep('template')}>← Back</button>
          <div className="modal-title" style={{ margin: 0, flex: 1 }}>New Checklist</div>
        </div>

        <div className="form-group">
          <label className="form-label">Checklist Name</label>
          <input
            className={`form-input${errors.name ? ' input-error' : ''}`}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Gas Safety Inspection"
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>

        {jobs.length > 0 && (
          <div className="form-group">
            <label className="form-label">Link to Job (optional)</label>
            <select className="form-input" value={jobId} onChange={e => setJobId(e.target.value)}>
              <option value="">No job linked</option>
              {jobs.filter(j => !j.archived).map(j => {
                const c = clients.find(cl => cl.id === j.clientId)
                return (
                  <option key={j.id} value={j.id}>
                    {j.description}{c ? ` — ${c.name}` : ''}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {!jobId && clients.length > 0 && (
          <div className="form-group">
            <label className="form-label">Link to Client (optional)</label>
            <select className="form-input" value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">No client linked</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0 }}>Checklist Items</label>
            <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{items.length} items</span>
          </div>
          {errors.items && <div className="form-error" style={{ marginBottom: '8px' }}>{errors.items}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
            {items.map((item, idx) => (
              <div key={idx} className="checklist-edit-item">
                <span style={{ flex: 1, fontSize: '14px', lineHeight: '1.4' }}>{item.label}</span>
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  <button className="icon-btn" style={{ minWidth: '28px', minHeight: '28px', fontSize: '14px' }}
                    onClick={() => moveItem(idx, -1)} disabled={idx === 0}>↑</button>
                  <button className="icon-btn" style={{ minWidth: '28px', minHeight: '28px', fontSize: '14px' }}
                    onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1}>↓</button>
                  <button className="icon-btn" style={{ minWidth: '28px', minHeight: '28px', color: 'var(--red)', fontSize: '18px' }}
                    onClick={() => removeItem(idx)}>×</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
              placeholder="Add an item…"
            />
            <button className="btn btn-ghost btn-sm" onClick={addItem} disabled={!newItem.trim()}>Add</button>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating…' : 'Create Checklist'}
          </button>
        </div>
      </div>
    </div>
  )
}
