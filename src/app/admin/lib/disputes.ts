import type { Order, OrderGroup } from '../../lib/types'

export type CaseStatus = 'open' | 'investigating' | 'resolved'
export interface CaseState { status: CaseStatus; assignee?: string; notes: { by: string; at: string; text: string }[]; outcome?: string }
export interface SeedCase { id: string; orderRef: string; buyer: string; seller: string; reason: string }

/** Seeded demo disputes. These reference demo order refs and do not change real order data. */
export const SEED_CASES: SeedCase[] = [
  { id: 'DSP-1042', orderRef: 'BL-260921-5510', buyer: 'Lindiwe Dlamini', seller: 'Cape Weave House', reason: 'Parcel marked delivered but buyer says it did not arrive.' },
  { id: 'DSP-1043', orderRef: 'BL-260930-7731', buyer: 'Keagan Naidoo', seller: 'Kasi Crown Wigs', reason: 'Listing stated “double drawn” but bundles appear mixed lengths.' },
  { id: 'DSP-1044', orderRef: 'BL-261002-2094', buyer: 'Palesa Sithole', seller: 'Lumi Hair Co.', reason: 'Seller cancelled after payment; buyer asks for confirmation of refund timing.' },
]

export const ASSIGNEES = ['Platform Admin', 'Support Agent']

export const groupGoods = (g: OrderGroup) => g.lines.reduce((a, l) => a + l.qty * l.unit, 0)
export const groupTotal = (g: OrderGroup) => groupGoods(g) + g.shipping

export interface Derived { id: string; order: Order; group: OrderGroup }
export const returnCases = (orders: Order[]): Derived[] =>
  orders.flatMap((o) => o.groups.filter((g) => g.history.some((h) => h.status === 'return_requested')).map((g) => ({ id: `RR-${o.ref.slice(-4)}-${g.sellerId.replace('s-', '').toUpperCase()}`, order: o, group: g })))
