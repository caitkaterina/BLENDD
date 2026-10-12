import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../../store/store'
import type { GroupStatus, Order, OrderGroup } from '../../lib/types'

export interface SG {
  key: string
  order: Order
  group: OrderGroup
  /** Sum of line totals (excludes shipping). */
  subtotal: number
  /** Subtotal + shipping charged for this seller's group. */
  total: number
}

export const groupSubtotal = (g: OrderGroup) => g.lines.reduce((a, l) => a + l.qty * l.unit, 0)
export const ACTION_STATUSES: GroupStatus[] = ['paid', 'processing', 'return_requested']

/** All seller-scoped data. Everything is filtered by `user.sellerId`. */
export function useSellerData() {
  const st = useStore()
  const sellerId = st.user?.sellerId ?? ''
  const seller = st.sellers.find((s) => s.id === sellerId)
  const myProducts = useMemo(() => st.products.filter((p) => p.sellerId === sellerId), [st.products, sellerId])
  const myGroups = useMemo<SG[]>(
    () =>
      st.orders
        .flatMap((o) => o.groups.filter((g) => g.sellerId === sellerId).map((g) => ({ key: `${o.id}:${g.sellerId}`, order: o, group: g, subtotal: groupSubtotal(g), total: groupSubtotal(g) + g.shipping })))
        .sort((a, b) => b.order.placedAt.localeCompare(a.order.placedAt)),
    [st.orders, sellerId],
  )
  const myReviews = useMemo(() => st.reviews.filter((r) => r.sellerId === sellerId), [st.reviews, sellerId])
  const myConvos = useMemo(() => st.conversations.filter((c) => c.sellerId === sellerId), [st.conversations, sellerId])
  const myEnquiries = useMemo(() => st.enquiries.filter((e) => e.sellerId === sellerId), [st.enquiries, sellerId])
  const myStockLog = useMemo(() => {
    const ids = new Set(myProducts.map((p) => p.id))
    return st.stockLog.filter((l) => ids.has(l.productId))
  }, [st.stockLog, myProducts])
  const verified = seller?.verificationStatus === 'verified'
  return { ...st, sellerId, seller, verified, myProducts, myGroups, myReviews, myConvos, myEnquiries, myStockLog }
}

/** Short fake loading state so every page shows a skeleton on first mount. */
export function useLoading(ms = 400) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, [ms])
  return loading
}

export interface Finance {
  gross: number
  refunds: number
  fees: number
  net: number
  pending: number
  available: number
  onHold: number
}

/** Illustrative only: derived from demo orders and the demo fee setting. */
export function computeFinance(groups: SG[], feePercent: number): Finance {
  const live = groups.filter((g) => g.group.status !== 'cancelled' && g.group.status !== 'pending_payment')
  const gross = live.reduce((a, g) => a + g.subtotal, 0)
  const refunds = live.filter((g) => g.group.status === 'refunded').reduce((a, g) => a + g.subtotal, 0)
  const kept = live.filter((g) => g.group.status !== 'refunded')
  const fee = (n: number) => (n * feePercent) / 100
  const net = (list: SG[]) => list.reduce((a, g) => a + g.subtotal - fee(g.subtotal), 0)
  return {
    gross,
    refunds,
    fees: fee(gross - refunds),
    net: net(kept),
    pending: net(kept.filter((g) => ['paid', 'processing', 'shipped'].includes(g.group.status))),
    available: net(kept.filter((g) => ['delivered', 'completed'].includes(g.group.status))),
    onHold: net(kept.filter((g) => g.group.status === 'return_requested')),
  }
}

/** Deterministic pseudo-random (illustrative analytics must not change between renders). */
export function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return Math.abs(h)
}
