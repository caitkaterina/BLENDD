import { REGION } from './config'
import type { GroupStatus, Order } from './types'

const SYMBOLS: Record<string, string> = { ZAR: 'R', USD: '$', GBP: '£', EUR: '€' }

export function money(n: number, currency = REGION.currency) {
  const sym = SYMBOLS[currency] ?? currency + ' '
  const hasCents = Math.abs(n % 1) > 0.004
  return sym + n.toLocaleString('en-US', { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 })
}

export function fmtDate(iso: string, withTime = false) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
  return d.toLocaleString(REGION.locale, {
    timeZone: REGION.timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export const nowIso = () => new Date().toISOString()
export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 9)}`

export const STATUS_LABEL: Record<GroupStatus, string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  return_requested: 'Return requested',
  refunded: 'Refunded',
}

const RANK: GroupStatus[] = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'completed']

export function orderStatus(o: Order): GroupStatus {
  const s = o.groups.map((g) => g.status)
  if (s.every((x) => x === s[0])) return s[0]
  if (s.includes('return_requested')) return 'return_requested'
  const active = s.filter((x) => RANK.includes(x))
  if (!active.length) return s[0]
  return active.sort((a, b) => RANK.indexOf(a) - RANK.indexOf(b))[0]
}

export function selectionLabel(sel: Record<string, string>) {
  return Object.values(sel).filter(Boolean).join(' · ')
}
