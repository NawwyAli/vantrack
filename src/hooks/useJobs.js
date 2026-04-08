import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export const JOB_STATUSES = [
  { value: 'pending',     label: 'Pending',     color: 'var(--text3)' },
  { value: 'confirmed',   label: 'Confirmed',   color: 'var(--blue)' },
  { value: 'in_progress', label: 'In Progress', color: 'var(--amber)' },
  { value: 'completed',   label: 'Completed',   color: 'var(--green)' },
]

export const RECURRING_INTERVALS = [
  { value: 'weekly',    label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually',  label: 'Annually' },
]

function transformJob(j) {
  return {
    id: j.id,
    clientId: j.client_id,
    propertyId: j.property_id,
    description: j.description,
    date: j.date,
    price: j.price,
    status: j.status,
    recurring: j.is_recurring,
    recurringInterval: j.recurring_interval,
    archived: j.archived,
    notes: j.notes || '',
    createdAt: j.created_at,
    photos: (j.job_photos || []).map(p => ({
      id: p.id,
      storagePath: p.storage_path,
      url: supabase.storage.from('uploads').getPublicUrl(p.storage_path).data.publicUrl,
    })),
  }
}

export function useJobs(user) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    if (!user) { setJobs([]); setLoading(false); return }
    const { data, error } = await supabase
      .from('jobs')
      .select('*, job_photos(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (!error) setJobs((data || []).map(transformJob))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  async function addJob(data) {
    const { error } = await supabase.from('jobs').insert({
      user_id: user.id,
      client_id: data.clientId,
      property_id: data.propertyId || null,
      description: data.description,
      date: data.date,
      price: data.price ? parseFloat(data.price) : null,
      status: data.status || 'pending',
      is_recurring: data.recurring || false,
      recurring_interval: data.recurringInterval || null,
      notes: data.notes || '',
    })
    if (error) throw error
    await fetchJobs()
  }

  async function updateJob(id, data) {
    const { error } = await supabase.from('jobs').update({
      client_id: data.clientId,
      property_id: data.propertyId || null,
      description: data.description,
      date: data.date,
      price: data.price ? parseFloat(data.price) : null,
      status: data.status,
      is_recurring: data.recurring || false,
      recurring_interval: data.recurringInterval || null,
      notes: data.notes || '',
    }).eq('id', id)
    if (error) throw error
    await fetchJobs()
  }

  async function updateJobStatus(id, status) {
    const { error } = await supabase.from('jobs').update({ status }).eq('id', id)
    if (error) throw error
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j))
  }

  async function archiveJob(id, archived = true) {
    const { error } = await supabase.from('jobs').update({ archived }).eq('id', id)
    if (error) throw error
    setJobs(prev => prev.map(j => j.id === id ? { ...j, archived } : j))
  }

  async function deleteJob(id) {
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) throw error
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  async function duplicateJob(job) {
    const { error } = await supabase.from('jobs').insert({
      user_id: user.id,
      client_id: job.clientId,
      property_id: job.propertyId || null,
      description: job.description,
      date: new Date().toISOString().split('T')[0],
      price: job.price,
      status: 'pending',
      is_recurring: job.recurring,
      recurring_interval: job.recurringInterval || null,
      notes: job.notes || '',
    })
    if (error) throw error
    await fetchJobs()
  }

  async function uploadJobPhoto(jobId, file) {
    const ext = file.name.split('.').pop()
    const path = `job-photos/${jobId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('uploads').upload(path, file)
    if (upErr) throw upErr
    const { error: dbErr } = await supabase.from('job_photos').insert({
      job_id: jobId, user_id: user.id, storage_path: path,
    })
    if (dbErr) throw dbErr
    await fetchJobs()
  }

  async function deleteJobPhoto(photoId, storagePath) {
    await supabase.storage.from('uploads').remove([storagePath])
    const { error } = await supabase.from('job_photos').delete().eq('id', photoId)
    if (error) throw error
    await fetchJobs()
  }

  // Client notes
  async function addNote(clientId, note) {
    const { error } = await supabase.from('client_notes').insert({
      user_id: user.id, client_id: clientId, note,
    })
    if (error) throw error
  }

  async function deleteNote(noteId) {
    const { error } = await supabase.from('client_notes').delete().eq('id', noteId)
    if (error) throw error
  }

  async function fetchNotes(clientId) {
    const { data, error } = await supabase
      .from('client_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  return {
    jobs, loading, fetchJobs,
    addJob, updateJob, updateJobStatus, archiveJob, deleteJob, duplicateJob,
    uploadJobPhoto, deleteJobPhoto,
    addNote, deleteNote, fetchNotes,
  }
}
