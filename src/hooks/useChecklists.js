import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

function transform(c) {
  return {
    id: c.id,
    jobId: c.job_id,
    clientId: c.client_id,
    name: c.name,
    items: c.items || [],
    engineerNotes: c.engineer_notes || '',
    status: c.status,
    completedAt: c.completed_at,
    createdAt: c.created_at,
  }
}

export function useChecklists(user) {
  const [checklists, setChecklists] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchChecklists = useCallback(async () => {
    if (!user) { setChecklists([]); setLoading(false); return }
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setChecklists((data || []).map(transform))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchChecklists() }, [fetchChecklists])

  async function addChecklist(data) {
    const { error } = await supabase.from('checklists').insert({
      user_id: user.id,
      job_id: data.jobId || null,
      client_id: data.clientId || null,
      name: data.name,
      items: data.items,
      engineer_notes: data.engineerNotes || '',
      status: 'draft',
    })
    if (error) throw error
    await fetchChecklists()
  }

  async function saveChecklist(id, { items, engineerNotes }) {
    const { error } = await supabase.from('checklists')
      .update({ items, engineer_notes: engineerNotes })
      .eq('id', id)
    if (error) throw error
    setChecklists(prev => prev.map(c =>
      c.id === id ? { ...c, items, engineerNotes } : c
    ))
  }

  async function completeChecklist(id, { items, engineerNotes }) {
    const completedAt = new Date().toISOString()
    const { error } = await supabase.from('checklists')
      .update({ items, engineer_notes: engineerNotes, status: 'complete', completed_at: completedAt })
      .eq('id', id)
    if (error) throw error
    setChecklists(prev => prev.map(c =>
      c.id === id ? { ...c, items, engineerNotes, status: 'complete', completedAt } : c
    ))
  }

  async function deleteChecklist(id) {
    const { error } = await supabase.from('checklists').delete().eq('id', id)
    if (error) throw error
    setChecklists(prev => prev.filter(c => c.id !== id))
  }

  return { checklists, loading, addChecklist, saveChecklist, completeChecklist, deleteChecklist }
}
