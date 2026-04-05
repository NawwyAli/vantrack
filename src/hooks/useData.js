import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

function transform(rawClients) {
  return (rawClients || []).map(client => ({
    id: client.id,
    name: client.name,
    address: client.address,
    phone: client.phone,
    email: client.email || '',
    createdAt: client.created_at,
    properties: (client.properties || []).map(prop => {
      const certs = prop.certificates || []
      const active = certs.find(c => c.is_active) || null
      const history = certs.filter(c => !c.is_active)
      return {
        id: prop.id,
        address: prop.address,
        certificate: active
          ? { id: active.id, issueDate: active.issue_date, notes: active.notes || '' }
          : null,
        history: history.map(c => ({ id: c.id, issueDate: c.issue_date, notes: c.notes || '' })),
      }
    }),
  }))
}

export function useData(user) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    if (!user) { setClients([]); setLoading(false); return }
    const { data, error } = await supabase
      .from('clients')
      .select(`*, properties (*, certificates (*))`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setClients(transform(data))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchClients() }, [fetchClients])

  async function addClient(data) {
    const { data: c, error: e1 } = await supabase
      .from('clients')
      .insert({ user_id: user.id, name: data.name, address: data.address, phone: data.phone, email: data.email || '' })
      .select().single()
    if (e1) throw e1

    if (data.propertyAddress) {
      const { data: p, error: e2 } = await supabase
        .from('properties')
        .insert({ client_id: c.id, user_id: user.id, address: data.propertyAddress })
        .select().single()
      if (e2) throw e2

      if (data.certIssueDate) {
        const { error: e3 } = await supabase
          .from('certificates')
          .insert({ property_id: p.id, user_id: user.id, issue_date: data.certIssueDate, notes: '', is_active: true })
        if (e3) throw e3
      }
    }
    await fetchClients()
  }

  async function updateClient(id, data) {
    const { error } = await supabase
      .from('clients')
      .update({ name: data.name, address: data.address, phone: data.phone, email: data.email || '' })
      .eq('id', id)
    if (error) throw error
    await fetchClients()
  }

  async function deleteClient(id) {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
    await fetchClients()
  }

  async function addProperty(clientId, address) {
    const { error } = await supabase
      .from('properties')
      .insert({ client_id: clientId, user_id: user.id, address })
    if (error) throw error
    await fetchClients()
  }

  async function deleteProperty(clientId, propertyId) {
    const { error } = await supabase.from('properties').delete().eq('id', propertyId)
    if (error) throw error
    await fetchClients()
  }

  async function updateProperty(propertyId, address) {
    const { error } = await supabase.from('properties').update({ address }).eq('id', propertyId)
    if (error) throw error
    await fetchClients()
  }

  async function saveCertificate(clientId, propertyId, issueDate, notes) {
    // Archive old active cert
    await supabase.from('certificates')
      .update({ is_active: false })
      .eq('property_id', propertyId)
      .eq('is_active', true)
    // Insert new
    const { error } = await supabase.from('certificates')
      .insert({ property_id: propertyId, user_id: user.id, issue_date: issueDate, notes: notes || '', is_active: true })
    if (error) throw error
    await fetchClients()
  }

  async function updateCertificate(certId, issueDate, notes) {
    const { error } = await supabase.from('certificates')
      .update({ issue_date: issueDate, notes: notes || '' })
      .eq('id', certId)
    if (error) throw error
    await fetchClients()
  }

  async function deleteCertificate(propertyId) {
    const { error } = await supabase.from('certificates')
      .delete()
      .eq('property_id', propertyId)
      .eq('is_active', true)
    if (error) throw error
    await fetchClients()
  }

  return {
    clients, loading, addClient, updateClient, deleteClient,
    addProperty, updateProperty, deleteProperty,
    saveCertificate, updateCertificate, deleteCertificate,
    refresh: fetchClients,
  }
}
