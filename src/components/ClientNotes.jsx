import { useState, useEffect } from 'react'

function fmtDateTime(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ClientNotes({ clientId, fetchNotes, addNote, deleteNote }) {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchNotes(clientId).then(data => {
      if (!cancelled) { setNotes(data); setLoading(false) }
    }).catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [clientId, fetchNotes])

  async function handleAdd() {
    if (!newNote.trim()) return
    setSaving(true)
    try {
      await addNote(clientId, newNote.trim())
      const data = await fetchNotes(clientId)
      setNotes(data)
      setNewNote('')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await deleteNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="client-notes-section">
      <div className="section-title" style={{ marginBottom: '12px' }}>Communication Log</div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input className="form-input" style={{ flex: 1 }}
          placeholder="Add a note…"
          value={newNote} onChange={e => setNewNote(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }} />
        <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={saving || !newNote.trim()}>
          {saving ? '…' : 'Add'}
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Loading…</div>
      ) : notes.length === 0 ? (
        <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No notes yet.</div>
      ) : (
        <div className="notes-list">
          {notes.map(note => (
            <div key={note.id} className="note-item">
              <div className="note-text">{note.note}</div>
              <div className="note-footer">
                <span className="note-date">{fmtDateTime(note.created_at)}</span>
                <button className="note-delete-btn" onClick={() => handleDelete(note.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
