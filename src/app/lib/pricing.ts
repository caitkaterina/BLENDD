import { DELIVERY_METHODS, PROMO_CODES, TAX } from './config'
import type { CartLine, Product, Seller } from './types'

export function minQty(p: Product) {
  return p.wholesale && !p.wholesale.retailAlso ? p.wholesale.moq : 1
}

export function selectionDelta(p: Product, sel: Record<string, string>) {
  let d = 0
  for (const o of p.options) {
    const v = o.values.find((x) => x.value === sel[o.key])
    if (v?.priceDelta) d += v.priceDelta
  }
  return d
}

export function tierFor(p: Product, qty: number) {
  if (!p.wholesale) return undefined
  return [...p.wholesale.tiers].sort((a, b) => b.min - a.min).find((t) => qty >= t.min)
}

/** Unit price in rand for a product, selection and quantity. Wholesale tiers only apply at/above MOQ. */
export function unitPrice(p: Product, sel: Record<string, string>, qty: number) {
  const tier = p.wholesale && qty >= p.wholesale.moq ? tierFor(p, qty) : undefined
  return (tier ? tier.price : p.price) + selectionDelta(p, sel)
}

export function discountPct(p: Product) {
  return p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0
}

export function lineKey(productId: string, sel: Record<string, string>) {
  return productId + '|' + Object.keys(sel).sort().map((k) => `${k}=${sel[k]}`).join('&')
}

export function stockState(p: Product): 'out' | 'low' | 'in' {
  return p.stock <= 0 ? 'out' : p.stock <= p.lowStockAt ? 'low' : 'in'
}

export type MethodId = (typeof DELIVERY_METHODS)[number]['id']

export function methodsFor(s: Seller) {
  const out: { id: MethodId; label: string; fee: number; days: [number, number]; freeOver?: number }[] = []
  out.push({ id: 'standard', label: 'Standard courier', fee: s.shipping.standard.fee, days: s.shipping.standard.days, freeOver: s.shipping.standard.freeOver })
  if (s.shipping.express) out.push({ id: 'express', label: 'Express courier', fee: s.shipping.express.fee, days: s.shipping.express.days })
  if (s.shipping.collect) out.push({ id: 'collect', label: 'Collect from seller', fee: 0, days: [1, 2] })
  return out
}

export function shippingFee(s: Seller, method: MethodId, groupSubtotal: number) {
  const m = methodsFor(s).find((x) => x.id === method) ?? methodsFor(s)[0]
  if (m.freeOver && groupSubtotal >= m.freeOver) return 0
  return m.fee
}

export interface Group {
  seller: Seller
  lines: (CartLine & { product: Product; unit: number; total: number; problem?: string })[]
  subtotal: number
}

export function groupCart(lines: CartLine[], products: Product[], sellers: Seller[]): Group[] {
  const map = new Map<string, Group>()
  for (const l of lines) {
    const product = products.find((p) => p.id === l.productId)
    if (!product) continue
    const seller = sellers.find((s) => s.id === product.sellerId)
    if (!seller) continue
    const unit = unitPrice(product, l.selection, l.qty)
    let problem: string | undefined
    if (product.status !== 'published') problem = 'No longer available'
    else if (product.stock <= 0) problem = 'Out of stock'
    else if (l.qty > product.stock) problem = `Only ${product.stock} left`
    else if (l.qty < minQty(product)) problem = `Minimum order is ${minQty(product)}`
    const g = map.get(seller.id) ?? { seller, lines: [], subtotal: 0 }
    g.lines.push({ ...l, product, unit, total: unit * l.qty, problem })
    if (!problem) g.subtotal += unit * l.qty
    map.set(seller.id, g)
  }
  return [...map.values()]
}

export function applyPromo(code: string, subtotal: number) {
  const c = PROMO_CODES[code.trim().toUpperCase()]
  if (!c) return { ok: false as const, error: 'That code is not valid.' }
  if (subtotal < c.minSpend) return { ok: false as const, error: `Spend at least R${c.minSpend} to use this code.` }
  const amount = c.percent ? Math.round(subtotal * (c.percent / 100)) : (c.flat ?? 0)
  return { ok: true as const, amount, label: c.label, code: code.trim().toUpperCase() }
}

export function vatIncluded(totalIncl: number) {
  return TAX.includedInPrices ? Math.round((totalIncl * TAX.rate) / (1 + TAX.rate)) : 0
}
