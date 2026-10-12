import { CATEGORIES } from './config'
import type { Product, Seller } from './types'

const STOP = new Set(['in', 'of', 'for', 'and', 'the', 'a', 'inch', 'inches', 'hair', 'pcs', 'with', 'wigs?'])
const SYN: Record<string, string> = {
  weave: 'bundle', weaves: 'bundle', weft: 'bundle', extensions: 'bundle', extension: 'bundle', bundles: 'bundle',
  wigs: 'wig', closures: 'closure', frontals: 'frontal', ponytails: 'ponytail', clipins: 'clip', clip: 'clip',
  bulk: 'wholesale', wholesale: 'wholesale', kinky: 'kinky', curls: 'curly', wavy: 'wave', waves: 'wave',
  brush: 'brush', brushes: 'brush', tools: 'accessory', accessories: 'accessory', bonnets: 'bonnet', virgin: 'virgin',
}

export function tokenize(q: string) {
  return q
    .toLowerCase()
    .replace(/(\d+)\s*(?:"|''|inch|inches|in\b)/g, '$1 ')
    .replace(/[^a-z0-9x\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t))
    .map((t) => SYN[t] ?? (t.length > 3 && t.endsWith('s') && !/\d/.test(t) ? t.slice(0, -1) : t))
}

function lev(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return 2
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}

function haystack(p: Product, s?: Seller) {
  const cat = CATEGORIES.find((c) => c.id === p.category)
  const text = [
    p.title, cat?.label, p.texture, p.construction, p.lace && `${p.lace} lace`, p.hairType && `${p.hairType} hair`, p.origin, p.processing,
    p.colors.join(' '), s?.name, p.wholesale ? 'wholesale bulk' : '', p.category === 'bundles' ? 'bundle weave' : '', p.category === 'ponytails' ? 'ponytail clip' : '',
    p.category === 'accessories' ? 'accessory tool' : '',
  ].filter(Boolean).join(' ').toLowerCase()
  const words = text.replace(/[^a-z0-9x\s]/g, ' ').split(/\s+/).map((w) => SYN[w] ?? (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
  return { text: words.join(' '), words }
}

export function searchProducts(q: string, products: Product[], sellers: Seller[]) {
  const tokens = tokenize(q)
  if (!tokens.length) return []
  const nums = tokens.filter((t) => /^\d+$/.test(t)).map(Number)
  const words = tokens.filter((t) => !/^\d+$/.test(t))
  const scored: { p: Product; score: number }[] = []
  for (const p of products) {
    const s = sellers.find((x) => x.id === p.sellerId)
    const h = haystack(p, s)
    if (nums.length && !nums.some((n) => p.lengths.includes(n))) continue
    let score = nums.length ? 2 : 0
    let ok = true
    for (const w of words) {
      if (h.text.includes(w)) score += p.title.toLowerCase().includes(w) ? 3 : 2
      else if (w.length >= 5 && h.words.some((x) => x.length >= 4 && lev(x, w) <= 1)) score += 1
      else { ok = false; break }
    }
    if (ok) scored.push({ p, score: score + p.popularity / 100 })
  }
  return scored.sort((a, b) => b.score - a.score).map((x) => x.p)
}

export function suggest(q: string, products: Product[], sellers: Seller[]) {
  const t = q.trim().toLowerCase()
  const prods = searchProducts(q, products, sellers).slice(0, 4)
  const cats = CATEGORIES.filter((c) => c.label.toLowerCase().includes(t) || tokenize(q).some((w) => c.id.startsWith(w) || c.label.toLowerCase().includes(w))).slice(0, 3)
  const sel = sellers.filter((s) => s.name.toLowerCase().includes(t)).slice(0, 3)
  return { prods, cats, sellers: sel }
}

export const POPULAR_SEARCHES = ['body wave bundles', '13x4 frontal', 'glueless wig', 'human hair bob', 'bulk 20-inch bundles', 'kinky curly clip-ins']

export function altQueries(q: string) {
  const t = tokenize(q)
  const alts = new Set<string>()
  if (t.length > 1) alts.add(t.slice(0, -1).join(' '))
  if (t.length > 1) alts.add(t.slice(1).join(' '))
  POPULAR_SEARCHES.forEach((x) => alts.add(x))
  return [...alts].slice(0, 5)
}
