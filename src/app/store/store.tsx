import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  PRODUCTS, REVIEWS, SELLERS, SEED_AUDIT, SEED_CONVERSATIONS, SEED_ENQUIRIES, SEED_NOTIFICATIONS, SEED_ORDERS, USERS,
} from '../lib/data'
import { ANNOUNCEMENT, MARKETPLACE_FEE, PERMISSIONS } from '../lib/config'
import { lineKey, minQty } from '../lib/pricing'
import { nowIso, uid } from '../lib/format'
import type {
  Address, AuditEntry, CartLine, Conversation, Enquiry, GroupStatus, Notification, Order, Permission, Product, Review, Seller, User,
} from '../lib/types'

export interface StockLog { id: string; productId: string; delta: number; reason: string; at: string; by: string }
export interface Settings { feePercent: number; announcement: string; featuredIds: string[] }

interface State {
  products: Product[]
  sellers: Seller[]
  reviews: Review[]
  cart: CartLine[]
  wishlist: string[]
  recent: string[]
  recentSearches: string[]
  followed: string[]
  orders: Order[]
  user: User | null
  addresses: Address[]
  notifications: Notification[]
  conversations: Conversation[]
  enquiries: Enquiry[]
  stockLog: StockLog[]
  audit: AuditEntry[]
  settings: Settings
  extra: Record<string, unknown>
}

const KEY = 'blendd-demo-v3'

/**
 * Personal slices (wishlist, followed stores, saved addresses) belong to one
 * account. They are parked per user id in `extra` and swapped in on sign-in so
 * a guest or another demo persona never sees someone else's saved items.
 */
const PROFILES = '__profiles'
type Profile = Pick<State, 'wishlist' | 'followed' | 'addresses'>
function switchUser(c: State, next: User | null): Partial<State> {
  const profiles = { ...((c.extra[PROFILES] as Record<string, Profile> | undefined) ?? {}) }
  const curKey = c.user?.id ?? 'guest'
  profiles[curKey] = { wishlist: c.wishlist, followed: c.followed, addresses: c.addresses }
  const nextKey = next?.id ?? 'guest'
  const p = next ? profiles[nextKey] : undefined
  if (!next) delete profiles.guest
  // A guest's picks carry into the account they sign in to, like a guest cart.
  const carry = !c.user && next ? profiles.guest : undefined
  if (carry) delete profiles.guest
  const merge = (a: string[] = [], b: string[] = []) => [...new Set([...a, ...b])]
  return {
    user: next,
    wishlist: merge(p?.wishlist, carry?.wishlist),
    followed: merge(p?.followed, carry?.followed),
    addresses: p?.addresses ?? [],
    cart: next ? c.cart : [],
    extra: { ...c.extra, [PROFILES]: profiles },
  }
}

function seed(): State {
  return {
    products: PRODUCTS, sellers: SELLERS, reviews: REVIEWS, cart: [], wishlist: [], recent: [], recentSearches: [], followed: [],
    orders: SEED_ORDERS, user: null, addresses: [], notifications: SEED_NOTIFICATIONS, conversations: SEED_CONVERSATIONS, enquiries: SEED_ENQUIRIES,
    stockLog: [], audit: SEED_AUDIT, settings: { feePercent: MARKETPLACE_FEE.percent, announcement: ANNOUNCEMENT, featuredIds: ['bw20', 'wg13', 'dw16', 'st18'] }, extra: { [PROFILES]: { 'u-buyer': { wishlist: ['wg13', 'dw16'], followed: [], addresses: [] } } },
  }
}
function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const fresh = seed()
      const byId = <T extends { id: string }>(list: T[] | undefined, seedList: T[], pick: (x: T) => Partial<T>) =>
        list?.map((x) => { const f = seedList.find((y) => y.id === x.id); return f ? { ...x, ...pick(f) } : x })
      return {
        ...fresh, ...saved,
        products: byId(saved.products, fresh.products, (f) => ({ images: f.images })) ?? fresh.products,
        sellers: byId(saved.sellers, fresh.sellers, (f) => ({ cover: f.cover })) ?? fresh.sellers,
        reviews: byId(saved.reviews, fresh.reviews, (f) => ({ images: f.images })) ?? fresh.reviews,
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return seed()
}

type Result = { ok: boolean; message?: string }
export interface Toast { id: string; text: string; kind: 'ok' | 'error' | 'info' }

function useStoreImpl() {
  const [s, setS] = useState<State>(load)
  const [toasts, setToasts] = useState<Toast[]>([])
  const ref = useRef(s)
  ref.current = s

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s))
    } catch {
      /* storage full or blocked */
    }
  }, [s])

  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  const up = useCallback((fn: (st: State) => Partial<State>) => setS((st) => ({ ...st, ...fn(st) })), [])
  const pushNotif = (st: State, n: Omit<Notification, 'id' | 'at' | 'read'>): Notification[] => [{ ...n, id: uid('n'), at: nowIso(), read: false }, ...st.notifications]
  const addAudit = (st: State, action: string, target: string): AuditEntry[] => [{ id: uid('a'), at: nowIso(), actor: st.user?.name ?? 'System', action, target }, ...st.audit]

  const api = useMemo(() => {
    const A = {
      toast,
      signIn(persona: keyof typeof USERS) {
        const user = USERS[persona]
        up((c) => switchUser(c, user))
        toast(`Signed in as ${user.name} (demo account)`, 'info')
      },
      signUp(name: string, email: string) {
        const user: User = { id: uid('u'), name, email, roles: ['buyer'], emailVerified: false, phoneVerified: false, phone: '' }
        up((c) => switchUser(c, user))
        toast('Demo account created. Nothing is stored on a server.', 'info')
      },
      signOut() {
        up((c) => switchUser(c, null))
        toast('Signed out', 'info')
      },
      updateUser(patch: Partial<User>) {
        up((st) => ({ user: st.user ? { ...st.user, ...patch } : st.user }))
      },
      can(p: Permission) {
        const u = ref.current.user
        return !!u?.roles.includes('admin') && !!u.adminRole && PERMISSIONS[u.adminRole].includes(p)
      },
      // ---- cart
      addToCart(productId: string, selection: Record<string, string>, qty: number): Result {
        const st = ref.current
        const p = st.products.find((x) => x.id === productId)
        if (!p || p.status !== 'published') return { ok: false, message: 'This listing is not available.' }
        const key = lineKey(productId, selection)
        const existing = st.cart.find((l) => l.key === key && !l.saved)
        const total = (existing?.qty ?? 0) + qty
        if (p.stock <= 0) return { ok: false, message: 'Out of stock.' }
        if (total > p.stock) return { ok: false, message: `Only ${p.stock} in stock.` }
        if (total < minQty(p)) return { ok: false, message: `Minimum order quantity is ${minQty(p)}.` }
        up((c) => ({
          cart: existing ? c.cart.map((l) => (l === existing ? { ...l, qty: total } : l)) : [...c.cart, { key, productId, qty, selection }],
        }))
        toast('Added to cart')
        return { ok: true }
      },
      setQty(key: string, qty: number): Result {
        const st = ref.current
        const l = st.cart.find((x) => x.key === key)
        const p = l && st.products.find((x) => x.id === l.productId)
        if (!l || !p) return { ok: false }
        if (qty > p.stock) { toast(`Only ${p.stock} in stock`, 'error'); qty = p.stock }
        qty = Math.max(1, qty)
        up((c) => ({ cart: c.cart.map((x) => (x.key === key ? { ...x, qty } : x)) }))
        return { ok: true }
      },
      removeLine(key: string) { up((c) => ({ cart: c.cart.filter((l) => l.key !== key) })); toast('Removed from cart', 'info') },
      saveForLater(key: string) { up((c) => ({ cart: c.cart.map((l) => (l.key === key ? { ...l, saved: true } : l)) })); toast('Saved for later', 'info') },
      moveToCart(key: string) { up((c) => ({ cart: c.cart.map((l) => (l.key === key ? { ...l, saved: false } : l)) })) },
      // ---- buyer lists
      toggleWishlist(id: string) {
        const has = ref.current.wishlist.includes(id)
        up((c) => ({ wishlist: has ? c.wishlist.filter((x) => x !== id) : [...c.wishlist, id] }))
        toast(has ? 'Removed from wishlist' : 'Saved to wishlist', 'info')
      },
      toggleFollow(id: string) {
        const has = ref.current.followed.includes(id)
        up((c) => ({ followed: has ? c.followed.filter((x) => x !== id) : [...c.followed, id] }))
        toast(has ? 'Store unfollowed' : 'Following store', 'info')
      },
      pushRecent(id: string) { up((c) => ({ recent: [id, ...c.recent.filter((x) => x !== id)].slice(0, 12) })) },
      addRecentSearch(q: string) { up((c) => ({ recentSearches: [q, ...c.recentSearches.filter((x) => x !== q)].slice(0, 6) })) },
      clearRecentSearches() { up(() => ({ recentSearches: [] })) },
      saveAddress(a: Address) { up((c) => ({ addresses: c.addresses.some((x) => x.id === a.id) ? c.addresses.map((x) => (x.id === a.id ? a : x)) : [...c.addresses, a] })) },
      removeAddress(id: string) { up((c) => ({ addresses: c.addresses.filter((x) => x.id !== id) })) },
      // ---- orders
      placeOrder(order: Order) {
        up((c) => {
          let notifications = pushNotif(c, { audience: 'buyer', userId: order.userId, kind: 'order', title: 'Order placed (demo)', body: `Order ${order.ref} was recorded. No real payment was taken.`, href: `/account/orders/${order.id}` })
          order.groups.forEach((g) => {
            const s = c.sellers.find((x) => x.id === g.sellerId)
            notifications = [{ id: uid('n'), audience: 'seller' as const, kind: 'order', title: 'New order to fulfil', body: `${order.ref} from ${order.address.name} — ${s?.name ?? ''}`, at: nowIso(), read: false, href: '/seller/orders' }, ...notifications]
          })
          const sold = new Map<string, number>()
          order.groups.forEach((g) => g.lines.forEach((l) => sold.set(l.productId, (sold.get(l.productId) ?? 0) + l.qty)))
          const logs = [...sold].map(([productId, q]) => ({ id: uid('sl'), productId, delta: -q, reason: `Order ${order.ref}`, at: nowIso(), by: 'System' }))
          const lineKeys = new Set(order.groups.flatMap((g) => g.lines.map((l) => lineKey(l.productId, l.selection))))
          return {
            orders: [order, ...c.orders],
            notifications,
            stockLog: [...logs, ...c.stockLog],
            products: c.products.map((p) => (sold.has(p.id) ? { ...p, stock: Math.max(0, p.stock - (sold.get(p.id) ?? 0)) } : p)),
            cart: c.cart.filter((l) => l.saved || !lineKeys.has(l.key)),
          }
        })
      },
      updateGroupStatus(orderId: string, sellerId: string, status: GroupStatus, note?: string, tracking?: { carrier: string; number: string }) {
        up((c) => ({
          orders: c.orders.map((o) =>
            o.id !== orderId ? o : { ...o, groups: o.groups.map((g) => g.sellerId !== sellerId ? g : { ...g, status, tracking: tracking ?? g.tracking, history: [...g.history, { status, at: nowIso(), note }] }) },
          ),
          notifications: pushNotif(c, { audience: 'buyer', userId: c.orders.find((o) => o.id === orderId)?.userId, kind: 'order', title: `Order update: ${status.replace('_', ' ')}`, body: `Seller updated part of an order${note ? ` — ${note}` : ''}.`, href: `/account/orders/${orderId}` }),
        }))
        toast('Order updated')
      },
      requestReturn(orderId: string, sellerId: string, reason: string) { A.updateGroupStatus(orderId, sellerId, 'return_requested', reason) },
      // ---- notifications
      markRead(id: string) { up((c) => ({ notifications: c.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })) },
      markAllRead(aud: Notification['audience']) { up((c) => ({ notifications: c.notifications.map((n) => (n.audience === aud ? { ...n, read: true } : n)) })) },
      notify(n: Omit<Notification, 'id' | 'at' | 'read'>) { up((c) => ({ notifications: pushNotif(c, n) })) },
      // ---- catalogue
      upsertProduct(p: Product) {
        up((c) => ({ products: c.products.some((x) => x.id === p.id) ? c.products.map((x) => (x.id === p.id ? p : x)) : [p, ...c.products] }))
      },
      setProductStatus(id: string, status: Product['status']) {
        up((c) => ({ products: c.products.map((p) => (p.id === id ? { ...p, status } : p)) }))
      },
      duplicateProduct(id: string) {
        const p = ref.current.products.find((x) => x.id === id)
        if (!p) return
        const copy = { ...p, id: uid('p'), title: `${p.title} (copy)`, sku: `${p.sku}-COPY`, status: 'draft' as const, createdAt: nowIso().slice(0, 10), rating: undefined, reviewCount: 0 }
        up((c) => ({ products: [copy, ...c.products] }))
        toast('Listing duplicated as a draft')
      },
      adjustStock(productId: string, delta: number, reason: string) {
        up((c) => ({
          products: c.products.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p)),
          stockLog: [{ id: uid('sl'), productId, delta, reason, at: nowIso(), by: c.user?.name ?? 'Seller' }, ...c.stockLog],
        }))
      },
      setStock(productId: string, stock: number, reason = 'Manual set') {
        const p = ref.current.products.find((x) => x.id === productId)
        if (p) A.adjustStock(productId, Math.max(0, stock) - p.stock, reason)
      },
      updateSeller(id: string, patch: Partial<Seller>) { up((c) => ({ sellers: c.sellers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })) },
      addSeller(sl: Seller) { up((c) => ({ sellers: [...c.sellers, sl] })) },
      // ---- messaging
      sendMessage(convId: string, from: 'buyer' | 'seller', text: string) {
        up((c) => ({
          conversations: c.conversations.map((x) => (x.id === convId ? { ...x, unread: from === 'buyer' ? x.unread + 1 : x.unread, messages: [...x.messages, { from, text, at: nowIso() }] } : x)),
        }))
      },
      startConversation(sellerId: string, productId: string | undefined, text: string, buyerName: string) {
        const ex = ref.current.conversations.find((x) => x.sellerId === sellerId && x.productId === productId && x.buyerName === buyerName)
        if (ex) { A.sendMessage(ex.id, 'buyer', text); return ex.id }
        const id = uid('c')
        up((c) => ({
          conversations: [{ id, buyerName, sellerId, productId, unread: 1, messages: [{ from: 'buyer', text, at: nowIso() }] }, ...c.conversations],
          notifications: pushNotif(c, { audience: 'seller', kind: 'message', title: `Message from ${buyerName}`, body: text.slice(0, 80), href: '/seller/messages' }),
        }))
        return id
      },
      readConversation(id: string) { up((c) => ({ conversations: c.conversations.map((x) => (x.id === id ? { ...x, unread: 0 } : x)) })) },
      patchConversation(id: string, patch: Partial<Conversation>) { up((c) => ({ conversations: c.conversations.map((x) => (x.id === id ? { ...x, ...patch } : x)) })) },
      // ---- enquiries
      createEnquiry(e: Omit<Enquiry, 'id' | 'at' | 'status'>) {
        up((c) => ({
          enquiries: [{ ...e, id: uid('e'), at: nowIso(), status: 'new' }, ...c.enquiries],
          notifications: pushNotif(c, { audience: 'seller', kind: 'enquiry', title: 'New wholesale enquiry', body: `${e.buyerName} asked for a quote on ${e.qty} units.`, href: '/seller/wholesale' }),
        }))
      },
      patchEnquiry(id: string, patch: Partial<Enquiry>) { up((c) => ({ enquiries: c.enquiries.map((x) => (x.id === id ? { ...x, ...patch } : x)) })) },
      // ---- reviews
      addReview(r: Omit<Review, 'id' | 'date' | 'moderation'>) {
        up((c) => ({ reviews: [{ ...r, id: uid('r'), date: nowIso().slice(0, 10), moderation: 'pending' }, ...c.reviews] }))
        toast('Review submitted for moderation')
      },
      patchReview(id: string, patch: Partial<Review>) { up((c) => ({ reviews: c.reviews.map((x) => (x.id === id ? { ...x, ...patch } : x)) })) },
      // ---- admin
      audit(action: string, target: string) { up((c) => ({ audit: addAudit(c, action, target) })) },
      updateSettings(patch: Partial<Settings>) { up((c) => ({ settings: { ...c.settings, ...patch } })) },
      resetDemo() { localStorage.removeItem(KEY); setS(seed()); toast('Demo data reset', 'info') },
      setExtra(key: string, value: unknown) { up((c) => ({ extra: { ...c.extra, [key]: value } })) },
    }
    return A
  }, [toast, up])

  return { ...s, ...api, toasts, dismissToast: (id: string) => setToasts((t) => t.filter((x) => x.id !== id)) }
}

type Store = ReturnType<typeof useStoreImpl>
// Reused across hot reloads so an edited store module doesn't orphan the mounted provider.
const g = globalThis as { __blenddStoreCtx?: React.Context<Store | null> }
const Ctx = (g.__blenddStoreCtx ??= createContext<Store | null>(null))

export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreImpl()
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside StoreProvider')
  return v
}

/** Persisted key/value slice for feature-local data (tickets, flags, etc). */
export function useExtra<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const { extra, setExtra } = useStore()
  const val = (extra[key] as T | undefined) ?? initial
  const valRef = useRef(val)
  valRef.current = val
  const set = useCallback((v: T | ((p: T) => T)) => setExtra(key, typeof v === 'function' ? (v as (p: T) => T)(valRef.current) : v), [key, setExtra])
  return [val, set]
}

export function useSeller(id: string | undefined) {
  const { sellers } = useStore()
  return sellers.find((s) => s.id === id)
}
