import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const DARK = [30, 30, 35]
const MID = [100, 100, 110]
const LIGHT = [220, 220, 225]
const ACCENT = [10, 132, 255]
const WHITE = [255, 255, 255]

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtMoney(n) {
  return '£' + parseFloat(n || 0).toFixed(2)
}

function addEngineerHeader(doc, ep, docType, docNumber, docDate, validUntil) {
  const pageW = doc.internal.pageSize.getWidth()

  // Top accent bar
  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, pageW, 8, 'F')

  // Logo (if present)
  let textX = 16
  if (ep.logoDataUrl) {
    try {
      const fmt = ep.logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      doc.addImage(ep.logoDataUrl, fmt, 14, 11, 22, 22)
      textX = 42
    } catch {
      // ignore logo errors — fall back to text-only layout
    }
  }

  // Business name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...DARK)
  doc.text(ep.business_name || 'Your Business Name', textX, 24)

  // Business details
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MID)
  let y = 31
  if (ep.business_address) { doc.text(ep.business_address, textX, y); y += 5 }
  if (ep.phone) { doc.text(ep.phone, textX, y); y += 5 }
  if (ep.email) { doc.text(ep.email, textX, y); y += 5 }
  if (ep.gas_safe_number) { doc.text(`Gas Safe Reg: ${ep.gas_safe_number}`, textX, y); y += 5 }
  if (ep.vat_registered && ep.vat_number) { doc.text(`VAT No: ${ep.vat_number}`, textX, y) }

  // Document type block (right)
  doc.setFillColor(245, 245, 247)
  doc.roundedRect(pageW - 80, 12, 64, 30, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...DARK)
  doc.text(docType.toUpperCase(), pageW - 48, 23, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MID)
  doc.text(`#${docNumber}`, pageW - 48, 30, { align: 'center' })
  doc.text(`Date: ${fmtDate(docDate)}`, pageW - 48, 36, { align: 'center' })
  if (validUntil) doc.text(`Valid until: ${fmtDate(validUntil)}`, pageW - 48, 41, { align: 'center' })

  // Divider
  doc.setDrawColor(...LIGHT)
  doc.setLineWidth(0.5)
  doc.line(16, 52, pageW - 16, 52)

  return 58
}

function addClientBlock(doc, client, startY) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...MID)
  doc.text('BILL TO', 16, startY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...DARK)
  doc.text(client.name || '—', 16, startY + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MID)
  let y = startY + 12
  if (client.address) { doc.text(client.address, 16, y); y += 5 }
  if (client.phone) { doc.text(client.phone, 16, y); y += 5 }
  if (client.email) { doc.text(client.email, 16, y) }

  return startY + 36
}

function addLineItems(doc, lineItems, startY) {
  const pageW = doc.internal.pageSize.getWidth()

  autoTable(doc, {
    startY,
    margin: { left: 16, right: 16 },
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: (lineItems || []).map(item => [
      item.description || '',
      item.qty ?? 1,
      fmtMoney(item.unit_price),
      fmtMoney(item.total),
    ]),
    headStyles: {
      fillColor: ACCENT,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: [248, 248, 250] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
    },
    tableWidth: pageW - 32,
  })

  return doc.lastAutoTable.finalY + 4
}

function addTotals(doc, subtotal, vatRate, vatAmount, total, startY) {
  const pageW = doc.internal.pageSize.getWidth()
  const col1 = pageW - 80
  const col2 = pageW - 16

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MID)

  let y = startY + 6
  doc.text('Subtotal:', col1, y)
  doc.setTextColor(...DARK)
  doc.text(fmtMoney(subtotal), col2, y, { align: 'right' })

  if (vatRate > 0) {
    y += 6
    doc.setTextColor(...MID)
    doc.text(`VAT (${vatRate}%):`, col1, y)
    doc.setTextColor(...DARK)
    doc.text(fmtMoney(vatAmount), col2, y, { align: 'right' })
  }

  // Total box
  y += 8
  doc.setFillColor(...ACCENT)
  doc.roundedRect(col1 - 4, y - 5, col2 - col1 + 8, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...WHITE)
  doc.text('TOTAL', col1, y + 3)
  doc.text(fmtMoney(total), col2, y + 3, { align: 'right' })

  return y + 16
}

function addNotes(doc, notes, startY) {
  if (!notes) return startY
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...MID)
  doc.text('NOTES', 16, startY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK)
  const lines = doc.splitTextToSize(notes, 120)
  doc.text(lines, 16, startY + 6)
  return startY + 6 + lines.length * 5
}

function addFooter(doc) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(...ACCENT)
  doc.rect(0, pageH - 6, pageW, 6, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...MID)
  doc.text('Generated by VanTrack · vantrack@outlook.com', pageW / 2, pageH - 10, { align: 'center' })
}

export function generateQuotePdf(quote, client, engineerProfile) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const ep = engineerProfile || {}

  let y = addEngineerHeader(doc, ep, 'Quote', quote.quote_number, quote.created_at?.slice(0, 10), quote.valid_until)
  y = addClientBlock(doc, client, y)
  y = addLineItems(doc, quote.line_items, y + 4)
  y = addTotals(doc, quote.subtotal, quote.vat_rate, quote.vat_amount, quote.total, y)
  addNotes(doc, quote.notes, y)
  addFooter(doc)

  return doc
}

export function quoteToBase64(quote, client, engineerProfile) {
  const doc = generateQuotePdf(quote, client, engineerProfile)
  return doc.output('datauristring').split(',')[1]
}

function addBankDetails(doc, ep, startY) {
  if (!ep.bank_account_number && !ep.bank_sort_code) return startY
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFillColor(245, 245, 247)
  doc.roundedRect(16, startY, pageW - 32, 28, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...MID)
  doc.text('PAYMENT — BACS BANK TRANSFER', 22, startY + 8)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK)
  let x = 22
  let y = startY + 15
  if (ep.bank_name) { doc.text(`Bank: ${ep.bank_name}`, x, y); x += 60 }
  if (ep.bank_sort_code) { doc.text(`Sort Code: ${ep.bank_sort_code}`, x, y); x += 55 }
  if (ep.bank_account_number) { doc.text(`Account: ${ep.bank_account_number}`, x, y) }

  return startY + 34
}

function addPaidStamp(doc) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity: 0.12 }))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(72)
  doc.setTextColor(52, 199, 89)
  doc.text('PAID', pageW / 2, pageH / 2, { align: 'center', angle: 35 })
  doc.restoreGraphicsState()
}

export function generateInvoicePdf(invoice, client, engineerProfile) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const ep = engineerProfile || {}

  let y = addEngineerHeader(doc, ep, 'Invoice', invoice.invoice_number, invoice.created_at?.slice(0, 10), invoice.due_date ? invoice.due_date : null)
  y = addClientBlock(doc, client, y)
  y = addLineItems(doc, invoice.line_items, y + 4)
  y = addTotals(doc, invoice.subtotal, invoice.vat_rate, invoice.vat_amount, invoice.total, y)
  y = addNotes(doc, invoice.notes, y)
  y = addBankDetails(doc, ep, y + 4)

  if (invoice.status === 'paid') addPaidStamp(doc)

  addFooter(doc)
  return doc
}

export function invoiceToBase64(invoice, client, engineerProfile) {
  const doc = generateInvoicePdf(invoice, client, engineerProfile)
  return doc.output('datauristring').split(',')[1]
}
