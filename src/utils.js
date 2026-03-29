export function genId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function getExpiryDate(issueDate) {
  const d = new Date(issueDate + 'T00:00:00')
  d.setFullYear(d.getFullYear() + 1)
  return d
}

export function getCertStatus(issueDate) {
  if (!issueDate) return 'none'
  const expiry = getExpiryDate(issueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((expiry - today) / 86400000)
  if (diffDays <= 0) return 'red'
  if (expiry.getFullYear() === today.getFullYear() && expiry.getMonth() === today.getMonth()) return 'red'
  if (diffDays <= 90) return 'amber'
  return 'green'
}

export function getDaysLabel(issueDate) {
  if (!issueDate) return 'No certificate'
  const expiry = getExpiryDate(issueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((expiry - today) / 86400000)
  if (diffDays < 0) return `Expired ${Math.abs(diffDays)} days ago`
  if (diffDays === 0) return 'Expires today'
  if (diffDays === 1) return 'Expires tomorrow'
  return `${diffDays} days until expiry`
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getClientWorstStatus(client) {
  if (!client.properties || client.properties.length === 0) return 'none'
  const statuses = client.properties.map(p => getCertStatus(p.certificate?.issueDate))
  if (statuses.includes('red')) return 'red'
  if (statuses.includes('amber')) return 'amber'
  if (statuses.includes('green')) return 'green'
  return 'none'
}
