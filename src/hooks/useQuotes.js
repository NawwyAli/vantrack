import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export const QUOTE_STATUSES = [
  { value: 'draft',    label: 'Draft',    color: 'var(--text3)' },
  { value: 'sent',     label: 'Sent',     color: 'var(--blue)' },
  { value: 'accepted', label: 'Accepted', color: 'var(--green)' },
  { value: 'declined', label: 'Declined', color: 'var(--red)' },
]

function transformQuote(q) {
  return {
    id: q.id,
    clientId: q.client_id,
    jobId: q.job_id,
    quoteNumber: q.quote_number,
    status: q.status,
    lineItems: q.line_items || [],
    subtotal: parseFloat(q.subtotal || 0),
    vatRate: parseFloat(q.vat_rate || 0),
    vatAmount: parseFloat(q.vat_amount || 0),
    total: parseFloat(q.total || 0),
    notes: q.notes || '',
    validUntil: q.valid_until,
    followupSentAt: q.followup_sent_at || null,
    createdAt: q.created_at,
    updatedAt: q.updated_at,
  }
}

function calcTotals(lineItems, vatRate) {
  const subtotal = lineItems.reduce((sum, item) => sum + parseFloat(item.total || 0), 0)
  const vatAmount = (subtotal * parseFloat(vatRate || 0)) / 100
  const total = subtotal + vatAmount
  return { subtotal, vatAmount, total }
}

export function useQuotes(user) {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchQuotes = useCallback(async () => {
    if (!user) { setQuotes([]); setLoading(false); return }
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setQuotes((data || []).map(transformQuote))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  async function nextQuoteNumber() {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    const num = String((count || 0) + 1).padStart(3, '0')
    return `QT-${year}-${num}`
  }

  async function addQuote(data) {
    const quoteNumber = await nextQuoteNumber()
    const { subtotal, vatAmount, total } = calcTotals(data.lineItems, data.vatRate)
    const { error } = await supabase.from('quotes').insert({
      user_id: user.id,
      client_id: data.clientId,
      job_id: data.jobId || null,
      quote_number: quoteNumber,
      status: 'draft',
      line_items: data.lineItems,
      subtotal,
      vat_rate: data.vatRate || 0,
      vat_amount: vatAmount,
      total,
      notes: data.notes || '',
      valid_until: data.validUntil || null,
    })
    if (error) throw error
    await fetchQuotes()
  }

  async function updateQuote(id, data) {
    const { subtotal, vatAmount, total } = calcTotals(data.lineItems, data.vatRate)
    const { error } = await supabase.from('quotes').update({
      client_id: data.clientId,
      job_id: data.jobId || null,
      line_items: data.lineItems,
      subtotal,
      vat_rate: data.vatRate || 0,
      vat_amount: vatAmount,
      total,
      notes: data.notes || '',
      valid_until: data.validUntil || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) throw error
    await fetchQuotes()
  }

  async function updateQuoteStatus(id, status) {
    const { error } = await supabase.from('quotes').update({ status }).eq('id', id)
    if (error) throw error
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q))
  }

  async function deleteQuote(id) {
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (error) throw error
    setQuotes(prev => prev.filter(q => q.id !== id))
  }

  async function duplicateQuote(quote) {
    const quoteNumber = await nextQuoteNumber()
    const { error } = await supabase.from('quotes').insert({
      user_id: user.id,
      client_id: quote.clientId,
      job_id: quote.jobId || null,
      quote_number: quoteNumber,
      status: 'draft',
      line_items: quote.lineItems,
      subtotal: quote.subtotal,
      vat_rate: quote.vatRate,
      vat_amount: quote.vatAmount,
      total: quote.total,
      notes: quote.notes || '',
      valid_until: null,
    })
    if (error) throw error
    await fetchQuotes()
  }

  async function markFollowupSent(id) {
    const sentAt = new Date().toISOString()
    const { error } = await supabase.from('quotes').update({ followup_sent_at: sentAt }).eq('id', id)
    if (error) throw error
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, followupSentAt: sentAt } : q))
  }

  return {
    quotes, loading, fetchQuotes,
    addQuote, updateQuote, updateQuoteStatus, deleteQuote, duplicateQuote,
    calcTotals, markFollowupSent,
  }
}
