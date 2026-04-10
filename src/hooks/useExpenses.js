import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export const EXPENSE_CATEGORIES = [
  'Parts & Materials',
  'Fuel',
  'Tools & Equipment',
  'PPE & Workwear',
  'Parking & Tolls',
  'Insurance',
  'Phone & Comms',
  'Training & Certifications',
  'Van Maintenance',
  'Other',
]

// UK tax year runs 6 Apr – 5 Apr
export function getTaxYear(date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth() // 0-indexed
  const d = date.getDate()
  const startYear = (m > 3 || (m === 3 && d >= 6)) ? y : y - 1
  return {
    start: new Date(startYear, 3, 6),   // 6 Apr
    end: new Date(startYear + 1, 3, 5), // 5 Apr next year
    label: `${startYear}/${String(startYear + 1).slice(2)}`,
  }
}

// HMRC approved mileage: 45p first 10,000 miles, 25p thereafter (cars/vans)
export function calcAllowance(miles, cumulativeBefore = 0) {
  const THRESHOLD = 10000
  const before = Math.min(cumulativeBefore, THRESHOLD)
  const remaining = Math.max(0, THRESHOLD - before)
  const at45 = Math.min(miles, remaining)
  const at25 = Math.max(0, miles - remaining)
  return at45 * 0.45 + at25 * 0.25
}

function transformExpense(e) {
  return {
    id: e.id,
    jobId: e.job_id,
    date: e.date,
    category: e.category,
    description: e.description,
    amount: parseFloat(e.amount),
    createdAt: e.created_at,
  }
}

function transformMileage(m) {
  return {
    id: m.id,
    jobId: m.job_id,
    date: m.date,
    fromLocation: m.from_location,
    toLocation: m.to_location,
    miles: parseFloat(m.miles),
    purpose: m.purpose || '',
    createdAt: m.created_at,
  }
}

export function useExpenses(user) {
  const [expenses, setExpenses] = useState([])
  const [mileage, setMileage] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) { setExpenses([]); setMileage([]); setLoading(false); return }
    const [expRes, milRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('mileage_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }),
    ])
    if (!expRes.error) setExpenses((expRes.data || []).map(transformExpense))
    if (!milRes.error) setMileage((milRes.data || []).map(transformMileage))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Expenses CRUD
  async function addExpense(data) {
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      job_id: data.jobId || null,
      date: data.date,
      category: data.category,
      description: data.description,
      amount: parseFloat(data.amount),
    })
    if (error) throw error
    await fetchAll()
  }

  async function updateExpense(id, data) {
    const { error } = await supabase.from('expenses').update({
      job_id: data.jobId || null,
      date: data.date,
      category: data.category,
      description: data.description,
      amount: parseFloat(data.amount),
    }).eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  // Mileage CRUD
  async function addMileage(data) {
    const { error } = await supabase.from('mileage_entries').insert({
      user_id: user.id,
      job_id: data.jobId || null,
      date: data.date,
      from_location: data.fromLocation,
      to_location: data.toLocation,
      miles: parseFloat(data.miles),
      purpose: data.purpose || '',
    })
    if (error) throw error
    await fetchAll()
  }

  async function updateMileage(id, data) {
    const { error } = await supabase.from('mileage_entries').update({
      job_id: data.jobId || null,
      date: data.date,
      from_location: data.fromLocation,
      to_location: data.toLocation,
      miles: parseFloat(data.miles),
      purpose: data.purpose || '',
    }).eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  async function deleteMileage(id) {
    const { error } = await supabase.from('mileage_entries').delete().eq('id', id)
    if (error) throw error
    setMileage(prev => prev.filter(m => m.id !== id))
  }

  return {
    expenses, mileage, loading,
    addExpense, updateExpense, deleteExpense,
    addMileage, updateMileage, deleteMileage,
  }
}
