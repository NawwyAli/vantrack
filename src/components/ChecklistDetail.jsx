import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'pass', label: 'Pass', color: 'var(--green)', bg: 'var(--green-bg)' },
  { value: 'fail', label: 'Fail', color: 'var(--red)',   bg: 'var(--red-bg)' },
  { value: 'na',   label: 'N/A',  color: 'var(--text2)', bg: 'var(--surface3)' },
]

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ChecklistDetail({ checklist, jobs, clients, onClose, onSave, onComplete, onDelete }) {
  const [items, setItems] = useState(checklist.items)
  const [notes, setNotes] = useState(checklist.engineerNotes || '')
  const [expandedIdx, setExpandedIdx] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const isComplete = checklist.status === 'complete'
  const job = jobs.find(j => j.id === checklist.jobId)
  const client = clients.find(c => c.id === checklist.clientId)
    || (job ? clients.find(c => c.id === job.clientId) : null)

  const done = items.filter(i => i.status !== 'pending').length
  const failed = items.filter(i => i.status === 'fail').length
  const allAnswered = items.every(i => i.status !== 'pending')

  function setItemStatus(idx, status) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, status: item.status === status ? 'pending' : status } : item
    ))
  }

  function setItemNote(idx, noteText) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, notes: noteText } : item
    ))
  }

  async function handleSave() {
    setSaving(true)
    try { await onSave(checklist.id, { items, engineerNotes: notes }) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleComplete() {
    setSaving(true)
    try { await onComplete(checklist.id, { items, engineerNotes: notes }) }
    catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try { await onDelete(checklist.id); onClose() }
    catch (err) { alert(err.message); setSaving(false) }
  }

  const pct = items.length ? Math.round((done / items.length) * 100) : 0

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-tall">
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ marginBottom: '12px' }}>
          <div className="modal-title" style={{ marginBottom: '6px' }}>{checklist.name}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`checklist-status-badge ${checklist.status}`}>
              {isComplete ? 'Complete' : 'Draft'}
            </span>
            {client && <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{client.name}</span>}
            {job && (
              <span style={{ fontSize: '13px', color: 'var(--text3)' }}>· {job.description}</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="checklist-progress" style={{ marginBottom: '16px' }}>
          <div className="checklist-progress-bar">
            <div className="checklist-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text2)', whiteSpace: 'nowrap', minWidth: '48px', textAlign: 'right' }}>
            {done}/{items.length}
            {failed > 0 && <span style={{ color: 'var(--red)', marginLeft: '6px' }}>{failed} fail</span>}
          </span>
        </div>

        {/* Items */}
        <div>
          {items.map((item, idx) => (
            <div key={idx} className="checklist-item">
              <div className="checklist-item-row">
                <div style={{ flex: 1, fontSize: '14px', lineHeight: '1.4', paddingRight: '8px' }}>
                  {item.label}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      className="checklist-status-btn"
                      style={{
                        background: item.status === s.value ? s.bg : 'transparent',
                        color: item.status === s.value ? s.color : 'var(--text3)',
                        borderColor: item.status === s.value ? s.color : 'var(--border)',
                      }}
                      onClick={() => !isComplete && setItemStatus(idx, s.value)}
                      disabled={isComplete}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {!isComplete && (
                <button
                  className="checklist-notes-toggle"
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                >
                  {item.notes ? `Note: ${item.notes}` : '+ add note'}
                </button>
              )}

              {!isComplete && expandedIdx === idx && (
                <input
                  className="form-input"
                  style={{ marginTop: '6px', fontSize: '13px', height: '38px' }}
                  value={item.notes || ''}
                  onChange={e => setItemNote(idx, e.target.value)}
                  placeholder="Add a note for this item…"
                  autoFocus
                />
              )}

              {isComplete && item.notes && (
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
                  Note: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Engineer Notes */}
        <div style={{ marginTop: '16px' }}>
          <label className="form-label">Engineer Notes</label>
          <textarea
            className="form-textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="General notes for this checklist…"
            disabled={isComplete}
            rows={2}
          />
        </div>

        {isComplete && checklist.completedAt && (
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
            Completed {fmtDate(checklist.completedAt)}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
          {!isComplete && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleComplete}
                disabled={saving || !allAnswered}
                title={!allAnswered ? 'Answer all items to complete' : undefined}
              >
                Mark Complete
              </button>
            </>
          )}
          <div style={{ flex: 1 }} />
          {deleteConfirm ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={saving}>
                Confirm Delete
              </button>
            </>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--red)' }}
              onClick={() => setDeleteConfirm(true)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
