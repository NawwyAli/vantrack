import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export function useBookingRequests(user) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    if (!user) { setRequests([]); setLoading(false); return }
    const { data, error } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setRequests(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  async function updateRequestStatus(id, status) {
    const { error } = await supabase
      .from('booking_requests')
      .update({ status })
      .eq('id', id)
    if (error) throw error
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  async function deleteRequest(id) {
    const { error } = await supabase
      .from('booking_requests')
      .delete()
      .eq('id', id)
    if (error) throw error
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  return { requests, loading, updateRequestStatus, deleteRequest, refreshRequests: fetchRequests }
}
