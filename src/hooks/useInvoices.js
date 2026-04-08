import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export const INVOICE_STATUSES = [
  { value: 'draft',   label: 'Draft',   color: 'var(--text3)' },
  { value: 'sent',    label: 'Sent',    color: 'var(--blue)' },
  { value: 'paid',    label: 'Paid',    color: 'var(--green)' },
  { value: 'overdue', label: 'Overdue', color: 'var(--red)' },
]

function transformInvoice(i) {
  return {
    id: i.id,
    clientId: i.client_id,
    jobId: i.job_id,
    quoteId: i.quote_id,
    invoiceNumber: i.invoice_number,
    status: i.status,
    lineItems: i.line_items || [],
    subtotal: parseFloat(i.subtotal || 0),
    vatRate: parseFloat(i.vat_rate || 0),
    vatAmount: parseFloat(i.vat_amount || 0),
    total: parseFloat(i.total || 0),
    notes: i.notes || '',
    dueDate: i.due_date,
    paidAt: i.paid_at,
    paymentLinkUrl: i.payment_link_url,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
  }
}

function calcTotals(lineItems, vatRate) {
  const subtotal = lineItems.reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const vatAmount = (subtotal * parseFloat(vatRate || 0)) / 100
  return { subtotal, vatAmount, total: subtotal + vatAmount }
}

export function useInvoices(user) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchInvoices = useCallback(async () => {
    if (!user) { setInvoices([]); setLoading(false); return }
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setInvoices((data || []).map(transformInvoice))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  async function nextInvoiceNumber() {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    return `INV-${year}-${String((count || 0) + 1).padStart(3, '0')}`
  }

  async function addInvoice(data) {
    const invoiceNumber = await nextInvoiceNumber()
    const { subtotal, vatAmount, total } = calcTotals(data.lineItems, data.vatRate)
    const { error } = await supabase.from('invoices').insert({
      user_id: user.id,
      client_id: data.clientId,
      job_id: data.jobId || null,
      quote_id: data.quoteId || null,
      invoice_number: invoiceNumber,
      status: 'draft',
      line_items: data.lineItems,
      subtotal, vat_rate: data.vatRate || 0, vat_amount: vatAmount, total,
      notes: data.notes || '',
      due_date: data.dueDate || null,
    })
    if (error) throw error
    await fetchInvoices()
  }

  async function updateInvoice(id, data) {
    const { subtotal, vatAmount, total } = calcTotals(data.lineItems, data.vatRate)
    const { error } = await supabase.from('invoices').update({
      client_id: data.clientId,
      job_id: data.jobId || null,
      line_items: data.lineItems,
      subtotal, vat_rate: data.vatRate || 0, vat_amount: vatAmount, total,
      notes: data.notes || '',
      due_date: data.dueDate || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) throw error
    await fetchInvoices()
  }

  async function updateInvoiceStatus(id, status) {
    const update = { status }
    if (status === 'paid') update.paid_at = new Date().toISOString()
    const { error } = await supabase.from('invoices').update(update).eq('id', id)
    if (error) throw error
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status, paidAt: update.paid_at || i.paidAt } : i))
  }

  async function savePaymentLink(id, url) {
    const { error } = await supabase.from('invoices').update({ payment_link_url: url, status: 'sent' }).eq('id', id)
    if (error) throw error
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, paymentLinkUrl: url, status: 'sent' } : i))
  }

  async function deleteInvoice(id) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  async function duplicateInvoice(invoice) {
    const invoiceNumber = await nextInvoiceNumber()
    const { error } = await supabase.from('invoices').insert({
      user_id: user.id,
      client_id: invoice.clientId,
      job_id: invoice.jobId || null,
      invoice_number: invoiceNumber,
      status: 'draft',
      line_items: invoice.lineItems,
      subtotal: invoice.subtotal, vat_rate: invoice.vatRate,
      vat_amount: invoice.vatAmount, total: invoice.total,
      notes: invoice.notes || '',
      due_date: null,
    })
    if (error) throw error
    await fetchInvoices()
  }

  // Create invoice pre-filled from a completed job
  function invoiceDataFromJob(job) {
    return {
      clientId: job.clientId,
      jobId: job.id,
      lineItems: [{ description: job.description, qty: 1, unit_price: job.price ?? 0, total: job.price ?? 0 }],
      vatRate: 0,
      notes: '',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    }
  }

  // Create invoice pre-filled from a quote
  function invoiceDataFromQuote(quote) {
    return {
      clientId: quote.clientId,
      quoteId: quote.id,
      lineItems: quote.lineItems,
      vatRate: quote.vatRate,
      notes: quote.notes,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    }
  }

  return {
    invoices, loading, fetchInvoices,
    addInvoice, updateInvoice, updateInvoiceStatus, savePaymentLink,
    deleteInvoice, duplicateInvoice,
    invoiceDataFromJob, invoiceDataFromQuote,
    calcTotals,
  }
}
