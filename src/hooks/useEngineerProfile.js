import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export function useEngineerProfile(user) {
  const [engineerProfile, setEngineerProfile] = useState(null)
  const [epLoading, setEpLoading] = useState(true)

  const fetchEngineerProfile = useCallback(async () => {
    if (!user) { setEngineerProfile(null); setEpLoading(false); return }
    const { data } = await supabase
      .from('engineer_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setEngineerProfile(data || null)
    setEpLoading(false)
  }, [user])

  useEffect(() => { fetchEngineerProfile() }, [fetchEngineerProfile])

  async function saveEngineerProfile(fields) {
    const { error } = await supabase
      .from('engineer_profiles')
      .upsert({ id: user.id, ...fields, updated_at: new Date().toISOString() })
    if (error) throw error
    await fetchEngineerProfile()
  }

  return { engineerProfile, epLoading, saveEngineerProfile, refreshEngineerProfile: fetchEngineerProfile }
}
