import type { CategoryId, HairType, Product, Seller, SellerType } from './types'
import { discountPct } from './pricing'

export type SortId = 'recommended' | 'popular' | 'rated' | 'newest' | 'price_asc' | 'price_desc' | 'discount'
export const SORTS: { id: SortId; label: string }[] = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'popular', label: 'Most popular' },
  { id: 'rated', label: 'Top rated' },
  { id: 'newest', label: 'Newest' },
  { id: 'price_asc', label: 'Price: low to high' },
  { id: 'price_desc', label: 'Price: high to low' },
  { id: 'discount', label: 'Biggest discount' },
]

export interface Filters {
  categories: CategoryId[]
  priceMin: number | null
  priceMax: number | null
  textures: string[]
  lengths: number[]
  hairTypes: HairType[]
  colors: string[]
  lace: string[]
  minSellerRating: number
  sellerTypes: SellerType[]
  channel: 'all' | 'retail' | 'wholesale'
  maxMoq: number | null
  inStockOnly: boolean
  provinces: string[]
  delivery: string[]
  sort: SortId
}

export const EMPTY_FILTERS: Filters = {
  categories: [], priceMin: null, priceMax: null, textures: [], lengths: [], hairTypes: [], colors: [], lace: [], minSellerRating: 0,
  sellerTypes: [], channel: 'all', maxMoq: null, inStockOnly: false, provinces: [], delivery: [], sort: 'recommended',
}

export function applyFilters(products: Product[], sellers: Seller[], f: Filters): Product[] {
  const sMap = new Map(sellers.map((s) => [s.id, s]))
  const out = products.filter((p) => {
    const s = sMap.get(p.sellerId)
    if (!s || s.status === 'suspended') return false
    if (f.categories.length && !f.categories.includes(p.category)) return false
    if (f.priceMin != null && p.price < f.priceMin) return false
    if (f.priceMax != null && p.price > f.priceMax) return false
    if (f.textures.length && !(p.texture && f.textures.includes(p.texture))) return false
    if (f.lengths.length && !p.lengths.some((l) => f.lengths.includes(l))) return false
    if (f.hairTypes.length && !(p.hairType && f.hairTypes.includes(p.hairType))) return false
    if (f.colors.length && !p.colors.some((c) => f.colors.includes(c)) && !p.options.some((o) => o.key === 'color' && o.values.some((v) => f.colors.includes(v.value)))) return false
    if (f.lace.length && !(p.lace && f.lace.includes(p.lace))) return false
    if (f.minSellerRating && (s.rating ?? 0) < f.minSellerRating) return false
    if (f.sellerTypes.length && !s.types.some((t) => f.sellerTypes.includes(t))) return false
    if (f.channel === 'wholesale' && !p.wholesale) return false
    if (f.channel === 'retail' && p.wholesale && !p.wholesale.retailAlso) return false
    if (f.maxMoq != null && !(p.wholesale && p.wholesale.moq <= f.maxMoq)) return false
    if (f.inStockOnly && p.stock <= 0) return false
    if (f.provinces.length && !f.provinces.includes(s.province)) return false
    if (f.delivery.includes('express') && !s.shipping.express) return false
    if (f.delivery.includes('collect') && !s.shipping.collect) return false
    if (f.delivery.includes('free') && !s.shipping.standard.freeOver) return false
    return true
  })
  const by: Record<SortId, (a: Product, b: Product) => number> = {
    recommended: (a, b) => b.popularity * (b.rating ?? 4) - a.popularity * (a.rating ?? 4),
    popular: (a, b) => b.popularity - a.popularity,
    rated: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount,
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    discount: (a, b) => discountPct(b) - discountPct(a),
  }
  return [...out].sort(by[f.sort])
}

export function activeChips(f: Filters): { key: string; label: string; clear: (f: Filters) => Filters }[] {
  const chips: { key: string; label: string; clear: (f: Filters) => Filters }[] = []
  const arr = <K extends keyof Filters>(k: K, fmt: (v: any) => string) =>
    (f[k] as any[]).forEach((v) => chips.push({ key: `${k}:${v}`, label: fmt(v), clear: (x) => ({ ...x, [k]: (x[k] as any[]).filter((y) => y !== v) }) }))
  arr('textures', (v) => v)
  arr('lengths', (v) => `${v}"`)
  arr('hairTypes', (v) => `${v[0].toUpperCase()}${v.slice(1)} hair`)
  arr('colors', (v) => v)
  arr('lace', (v) => `${v} lace`)
  arr('sellerTypes', (v) => v)
  arr('provinces', (v) => v)
  arr('delivery', (v) => ({ express: 'Express available', collect: 'Seller collection', free: 'Free-delivery threshold' } as any)[v] ?? v)
  if (f.priceMin != null || f.priceMax != null) chips.push({ key: 'price', label: `R${f.priceMin ?? 0} – ${f.priceMax != null ? 'R' + f.priceMax : 'any'}`, clear: (x) => ({ ...x, priceMin: null, priceMax: null }) })
  if (f.minSellerRating) chips.push({ key: 'rating', label: `Seller ${f.minSellerRating}★+`, clear: (x) => ({ ...x, minSellerRating: 0 }) })
  if (f.channel !== 'all') chips.push({ key: 'channel', label: f.channel === 'wholesale' ? 'Wholesale' : 'Retail', clear: (x) => ({ ...x, channel: 'all' }) })
  if (f.maxMoq != null) chips.push({ key: 'moq', label: `MOQ ≤ ${f.maxMoq}`, clear: (x) => ({ ...x, maxMoq: null }) })
  if (f.inStockOnly) chips.push({ key: 'stock', label: 'In stock', clear: (x) => ({ ...x, inStockOnly: false }) })
  return chips
}
