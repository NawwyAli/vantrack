import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export function useEngineerProfile(user) {
  const [engineerProfile, setEngineerProfile] = useState(null)
  const [epLoading, setEpLoading] = useState(true)
  const [logoDataUrl, setLogoDataUrl] = useState(null)

  const fetchEngineerProfile = useCallback(async () => {
    if (!user) { setEngineerProfile(null); setEpLoading(false); return }
    const { data } = await supabase
      .from('engineer_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setEngineerProfile(data || null)
    setEpLoading(false)
    if (data?.logo_url) {
      try {
        const res = await fetch(data.logo_url)
        const blob = await res.blob()
        const reader = new FileReader()
        reader.onload = () => setLogoDataUrl(reader.result)
        reader.readAsDataURL(blob)
      } catch {
        setLogoDataUrl(null)
      }
    } else {
      setLogoDataUrl(null)
    }
  }, [user])

  useEffect(() => { fetchEngineerProfile() }, [fetchEngineerProfile])

  async function saveEngineerProfile(fields) {
    const { error } = await supabase
      .from('engineer_profiles')
      .upsert({ id: user.id, ...fields, updated_at: new Date().toISOString() })
    if (error) throw error
    await fetchEngineerProfile()
  }

  async function uploadLogo(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${user.id}/logo.${ext}`
    const { error: upErr } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) throw upErr
    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
    await saveEngineerProfile({ logo_url: urlData.publicUrl })
  }

  return { engineerProfile, epLoading, logoDataUrl, saveEngineerProfile, uploadLogo, refreshEngineerProfile: fetchEngineerProfile }
}
