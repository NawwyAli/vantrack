import { useState } from 'react'

export function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const v = localStorage.getItem(key)
      return v ? JSON.parse(v) : initial
    } catch {
      return initial
    }
  })

  const set = v => {
    const next = v instanceof Function ? v(val) : v
    setVal(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
  }

  return [val, set]
}
