import { useState, useRef } from 'react'
import { JOB_STATUSES } from '../hooks/useJobs.js'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtPrice(p) {
  if (p == null || p === '') return '—'
  return '£' + parseFloat(p).toFixed(2)
}

export default function JobDetail({ job, clients, onClose, onEdit, onDelete, onArchive, onDuplicate, onStatusChange, onUploadPhoto, onDeletePhoto, onCreateQuote }) {
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const fileRef = useRef()

  const client = clients.find(c => c.id === job.clientId)
  const property = client?.properties.find(p => p.id === job.propertyId)
  const statusInfo = JOB_STATUSES.find(s => s.value === job.status)

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    setPhotoError('')
    try {
      await onUploadPhoto(job.id, file)
    } catch (err) {
      setPhotoError('Upload failed — ensure the "uploads" storage bucket exists in Supabase.')
    } finally {
      setPhotoUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-tall">
        <div className="modal-handle" />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <div className="modal-title" style={{ marginBottom: '4px' }}>{job.description}</div>
            <span className="job-status-badge" style={{ background: statusInfo?.color + '22', color: statusInfo?.color }}>
              {statusInfo?.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" onClick={onCreateQuote}>Quote</button>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>
          </div>
        </div>

        {/* Details */}
        <div className="job-detail-grid">
          <div className="job-detail-item"><span className="job-detail-label">Client</span><span>{client?.name || '—'}</span></div>
          {property && <div className="job-detail-item"><span className="job-detail-label">Property</span><span>{property.address}</span></div>}
          <div className="job-detail-item"><span className="job-detail-label">Date</span><span>{fmtDate(job.date)}</span></div>
          <div className="job-detail-item"><span className="job-detail-label">Price</span><span>{fmtPrice(job.price)}</span></div>
          {job.recurring && (
            <div className="job-detail-item">
              <span className="job-detail-label">Recurring</span>
              <span style={{ textTransform: 'capitalize' }}>{job.recurringInterval}</span>
            </div>
          )}
        </div>

        {job.notes && (
          <div style={{ marginBottom: '16px' }}>
            <div className="job-detail-label" style={{ marginBottom: '4px' }}>Notes</div>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.5', margin: 0 }}>{job.notes}</p>
          </div>
        )}

        {/* Status change */}
        <div style={{ marginBottom: '16px' }}>
          <div className="job-detail-label" style={{ marginBottom: '8px' }}>Change Status</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {JOB_STATUSES.map(s => (
              <button key={s.value} type="button"
                onClick={() => onStatusChange(job.id, s.value)}
                style={{
                  padding: '5px 12px', borderRadius: '20px', border: '1.5px solid',
                  borderColor: job.status === s.value ? s.color : 'var(--border)',
                  background: job.status === s.value ? s.color + '22' : 'transparent',
                  color: job.status === s.value ? s.color : 'var(--text2)',
                  fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div className="job-detail-label">Photos</div>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={photoUploading}>
              {photoUploading ? 'Uploading…' : '+ Add Photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
          </div>
          {photoError && <div className="form-error" style={{ marginBottom: '8px' }}>{photoError}</div>}
          {job.photos?.length > 0 ? (
            <div className="photo-grid">
              {job.photos.map(photo => (
                <div key={photo.id} className="photo-thumb">
                  <img src={photo.url} alt="Job photo" />
                  <button className="photo-delete-btn" onClick={() => onDeletePhoto(photo.id, photo.storagePath)}>×</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text3)' }}>No photos attached</div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={onDuplicate}>Duplicate</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onArchive(job.id, !job.archived)}>
            {job.archived ? 'Unarchive' : 'Archive'}
          </button>
          <div style={{ flex: 1 }} />
          {deleteConfirm ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(job.id)}>Confirm Delete</button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setDeleteConfirm(true)}>Delete</button>
          )}
        </div>
      </div>
    </div>
  )
}
