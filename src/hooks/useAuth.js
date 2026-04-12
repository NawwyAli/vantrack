import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('reset') === 'true' || window.location.hash.includes('type=recovery')
  })
  const [loading, setLoading] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const onRecoveryUrl = params.get('reset') === 'true' || window.location.hash.includes('type=recovery')
    return !onRecoveryUrl
  })

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    return data
  }

  async function refreshProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null
    return fetchProfile(session.user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
        setUser(session?.user ?? null)
        setLoading(false)
        return
      }
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setIsPasswordRecovery(false)
        return
      }
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, role) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
        emailRedirectTo: 'https://storied-sunburst-d7d0ae.netlify.app',
      },
    })
    if (error) throw error
    // Profile is created automatically via the handle_new_user trigger in Supabase
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://storied-sunburst-d7d0ae.netlify.app/?reset=true',
    })
    if (error) throw error
  }

  async function updateRole(role) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', session.user.id)
    if (error) throw error
    setProfile(p => ({ ...p, role }))
  }

  async function updatePassword(newPassword) {
    // With PKCE flow the code must be exchanged for a session before updateUser works
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (!code) throw new Error('No auth session — please request a new password reset link.')
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) throw exchangeError
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    window.history.replaceState({}, '', '/')
    setIsPasswordRecovery(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, profile, loading, isPasswordRecovery, signIn, signUp, signOut, resetPassword, updatePassword, refreshProfile, updateRole }
}
