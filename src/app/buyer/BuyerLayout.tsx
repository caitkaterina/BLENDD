import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Bell, ChevronDown, ChevronRight, Heart, Home, LayoutGrid, LogOut, Menu, Search, ShoppingBag, Store, User as UserIcon, X } from 'lucide-react'
import { useStore } from '../store/store'
import { CATEGORIES } from '../lib/config'
import { fmtDate } from '../lib/format'
import { Logo } from '../components/Logo'
import { cx } from '../components/ui'
import SearchBox from './SearchBox'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop', end: true },
  { to: '/#stores', label: 'Stores', end: true },
  { to: '/categories', label: 'Categories', end: false },
  { to: '/top-rated', label: 'Top Rated', end: false },
  { to: '/new', label: 'New Arrivals', end: false },
  { to: '/wholesale', label: 'Wholesale', end: false },
]

function Dropdown({ label, icon, children, align = 'right', badge }: { label: string; icon: React.ReactNode; children: (close: () => void) => React.ReactNode; align?: 'left' | 'right'; badge?: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const h = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', h); document.addEventListener('keydown', k)
    return () => { document.removeEventListener('pointerdown', h); document.removeEventListener('keydown', k) }
  }, [])
  return (
    <div ref={ref} className="sm:relative">
      <button onClick={() => setOpen(!open)} aria-label={label} aria-expanded={open} className="relative grid size-10 place-items-center rounded-full text-white hover:bg-white/10 sm:size-11">
        {icon}
        {!!badge && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-pink px-1 text-[10px] font-bold leading-4 text-ink">{badge}</span>}
      </button>
      {/* On phones the panel spans the header (its containing block) so it always fits the viewport. */}
      {open && <div className={cx('absolute inset-x-3 top-full z-50 mt-2 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl bg-white p-2 text-ink shadow-2xl ring-1 ring-black/5 sm:inset-x-auto sm:top-12 sm:mt-0 sm:w-80', align === 'right' ? 'sm:right-0' : 'sm:left-0')}>{children(() => setOpen(false))}</div>}
    </div>
  )
}

function Header() {
  const { cart, wishlist, user, signOut, notifications, markAllRead, markRead } = useStore()
  const nav = useNavigate()
  const [mobileSearch, setMobileSearch] = useState(false)
  const [menu, setMenu] = useState(false)
  const count = cart.filter((l) => !l.saved).reduce((n, l) => n + l.qty, 0)
  const notifs = notifications.filter((n) => n.audience === 'buyer' && (!n.userId || n.userId === user?.id))
  const unread = notifs.filter((n) => !n.read).length

  return (
    <header className="on-dark sticky top-0 z-40 bg-ink text-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-1.5 px-2 sm:gap-3 sm:px-4 lg:gap-6 lg:px-8">
        <button onClick={() => setMenu(true)} aria-label="Open menu" aria-expanded={menu} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-white/10 sm:size-11 lg:hidden"><Menu size={22} /></button>
        <Link to="/" aria-label="BLENDD home" className="shrink-0"><span className="sm:hidden"><Logo size={28} /></span><span className="hidden sm:inline"><Logo size={34} /></span></Link>
        <div className="hidden max-w-2xl flex-1 lg:block"><SearchBox /></div>
        <div className="ml-auto flex shrink-0 items-center sm:gap-0.5">
          <button onClick={() => setMobileSearch(true)} aria-label="Search" className="grid size-10 place-items-center rounded-full hover:bg-white/10 sm:size-11 lg:hidden"><Search size={20} /></button>
          <Link to="/account/wishlist" aria-label={`Wishlist, ${wishlist.length} items`} className="relative hidden size-10 place-items-center rounded-full hover:bg-white/10 sm:grid">
            <Heart size={20} />{wishlist.length > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-pink px-1 text-[10px] font-bold leading-4 text-ink">{wishlist.length}</span>}
          </Link>
          {/* Phones reach notifications from the menu drawer, keeping the header within 320px. */}
          {user && <div className="hidden sm:block">
            <Dropdown label="Notifications" icon={<Bell size={20} />} badge={unread || undefined}>
              {(close) => (
                <div>
                  <div className="flex items-center justify-between px-3 py-2"><p className="font-bold">Notifications</p><button onClick={() => markAllRead('buyer')} className="text-xs font-semibold text-mute hover:text-ink">Mark all read</button></div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 && <p className="p-4 text-sm text-mute">Nothing yet.</p>}
                    {notifs.slice(0, 6).map((n) => (
                      <button key={n.id} onClick={() => { markRead(n.id); close(); if (n.href) nav(n.href) }} className="flex w-full gap-2 rounded-xl p-3 text-left hover:bg-fog">
                        <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-line' : 'bg-pink ring-1 ring-ink')} />
                        <span><span className="block text-sm font-semibold">{n.title}</span><span className="block text-xs text-mute">{n.body}</span><span className="mt-1 block text-[11px] text-mute">{fmtDate(n.at, true)}</span></span>
                      </button>
                    ))}
                  </div>
                  <Link onClick={close} to="/account/notifications" className="block rounded-xl p-3 text-center text-sm font-semibold hover:bg-fog">All notifications</Link>
                </div>
              )}
            </Dropdown>
          </div>}
          <Link to="/cart" aria-label={`Cart, ${count} items`} className="relative grid size-10 place-items-center rounded-full hover:bg-white/10 sm:size-11">
            <ShoppingBag size={20} />{count > 0 && <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-pink px-1 text-[10px] font-bold leading-4 text-ink">{count}</span>}
          </Link>
          <Dropdown label="Account" icon={<UserIcon size={20} />}>
            {(close) => user ? (
              <div>
                <div className="px-3 py-2"><p className="font-bold">{user.name}</p><p className="text-xs text-mute">{user.email}</p></div>
                {[['/account', 'My account'], ['/account/orders', 'My orders'], ['/account/wishlist', 'Wishlist'], ['/account/messages', 'Messages'], ...(user.roles.includes('seller') ? [['/seller', 'Seller dashboard']] : [['/sell', 'Become a seller']]), ...(user.roles.includes('admin') ? [['/admin', 'Admin workspace']] : [])].map(([to, l]) => <Link key={to} onClick={close} to={to} className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-fog">{l}</Link>)}
                <button onClick={() => { close(); signOut(); nav('/') }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-fog"><LogOut size={15} /> Sign out</button>
              </div>
            ) : (
              <div className="p-2"><p className="px-2 pb-3 pt-1 text-sm text-mute">Sign in to track orders, message sellers and save your wishlist.</p><Link onClick={close} to="/signin" className="block rounded-full bg-pink py-2.5 text-center text-sm font-semibold">Sign in or create account</Link></div>
            )}
          </Dropdown>
        </div>
      </div>

      <nav aria-label="Main" className="hidden border-t border-white/10 lg:block">
        <div className="mx-auto flex h-11 max-w-[1440px] items-center gap-1 px-8">
          {NAV.map((n) => n.to === '/categories' ? (
            <CategoryMenu key={n.to} />
          ) : (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx('caps px-4 py-2 text-[10px] transition-colors border-b-2', isActive && !n.to.includes('#') ? 'border-pink text-white' : 'border-transparent text-white/65 hover:text-white')}>{n.label}</NavLink>
          ))}
          <Link to="/sell" className="caps ml-auto inline-flex items-center gap-2 rounded-full border border-pink/60 px-4 py-1.5 text-[10px] text-pink transition-colors hover:bg-pink hover:text-ink"><Store size={14} /> Sell on BLENDD</Link>
        </div>
      </nav>

      {menu && <MobileMenu onClose={() => setMenu(false)} onSearch={() => { setMenu(false); setMobileSearch(true) }} />}
      {mobileSearch && (
        <div className="safe-top fixed inset-0 z-50 bg-ink p-4 lg:hidden" onKeyDown={(e) => e.key === 'Escape' && setMobileSearch(false)}>
          <div className="flex items-center gap-2"><div className="flex-1"><SearchBox autoFocus onDone={() => setMobileSearch(false)} /></div><button onClick={() => setMobileSearch(false)} aria-label="Close search" className="grid size-11 place-items-center"><X /></button></div>
        </div>
      )}
    </header>
  )
}

function CategoryMenu() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname])
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button aria-expanded={open} onClick={() => setOpen(!open)} className={cx('caps inline-flex items-center gap-1 border-b-2 px-4 py-2 text-[10px]', loc.pathname.startsWith('/categories') || loc.pathname.startsWith('/shop/') ? 'border-pink text-white' : 'border-transparent text-white/65 hover:text-white')}>Categories <ChevronDown size={13} /></button>
      {open && (
        <div className="absolute left-0 top-full z-50 w-[22rem] pt-2">
          <div className="grid gap-0.5 rounded-2xl bg-white p-2 text-ink shadow-2xl">
            {CATEGORIES.map((c) => <Link key={c.id} to={`/shop/${c.id}`} className="rounded-xl px-3 py-2.5 hover:bg-fog"><span className="block text-sm font-semibold">{c.label}</span><span className="block text-xs text-mute">{c.blurb}</span></Link>)}
            <Link to="/categories" className="rounded-xl px-3 py-2.5 text-sm font-semibold link-pink">All categories →</Link>
          </div>
        </div>
      )}
    </div>
  )
}

/** Phone/tablet navigation drawer: every desktop destination, grouped. */
function MobileMenu({ onClose, onSearch }: { onClose: () => void; onSearch: () => void }) {
  const { user, signOut } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const first = useRef(loc.pathname)
  useEffect(() => { if (loc.pathname !== first.current) onClose() }, [loc.pathname, onClose])
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [onClose])
  const row = 'flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 text-[15px] font-semibold hover:bg-white/5'
  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="safe-top safe-bottom absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-ink text-white shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <Logo size={30} />
          <button onClick={onClose} aria-label="Close menu" className="grid size-11 place-items-center rounded-full hover:bg-white/10"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-4">
          <button onClick={onSearch} className="mx-1 mb-4 flex h-12 w-[calc(100%-0.5rem)] items-center gap-3 rounded-full bg-graphite px-4 text-left text-sm text-white/60"><Search size={18} /> Search hair, sellers, styles</button>
          <nav aria-label="Mobile main">
            {NAV.filter((n) => n.to !== '/categories').map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx(row, isActive && !n.to.includes('#') && 'text-pink')}>{n.label}<ChevronRight size={16} className="text-white/40" /></NavLink>
            ))}
          </nav>
          <p className="eyebrow mb-2 mt-6 px-3 text-pink">Categories</p>
          {CATEGORIES.map((c) => <NavLink key={c.id} to={`/shop/${c.id}`} className={({ isActive }) => cx(row, 'font-medium text-white/85', isActive && 'text-pink')}>{c.label}<ChevronRight size={16} className="text-white/40" /></NavLink>)}
          <Link to="/categories" className={cx(row, 'text-pink')}>All categories</Link>
          <p className="eyebrow mb-2 mt-6 px-3 text-pink">Account</p>
          {user ? (
            <>
              {[['/account', 'My account'], ['/account/orders', 'My orders'], ['/account/wishlist', 'Wishlist'], ['/account/messages', 'Messages'], ['/account/notifications', 'Notifications'], ...(user.roles.includes('seller') ? [['/seller', 'Seller dashboard']] : []), ...(user.roles.includes('admin') ? [['/admin', 'Admin workspace']] : [])].map(([to, l]) => <Link key={to} to={to} className={cx(row, 'font-medium text-white/85')}>{l}</Link>)}
              <button onClick={() => { onClose(); signOut(); nav('/') }} className={cx(row, 'w-full font-medium text-white/85')}>Sign out <LogOut size={16} className="text-white/40" /></button>
            </>
          ) : <Link to="/signin" className={cx(row, 'font-medium text-white/85')}>Sign in or create account</Link>}
          <Link to="/help" className={cx(row, 'font-medium text-white/85')}>Help centre</Link>
        </div>
        <div className="shrink-0 border-t border-white/10 p-4">
          <Link to="/sell" className="caps flex h-12 items-center justify-center gap-2 rounded-full border border-pink/60 text-[10px] text-pink"><Store size={15} /> Sell on BLENDD</Link>
        </div>
      </div>
    </div>
  )
}

function BottomNav() {
  const { wishlist } = useStore()
  const loc = useLocation()
  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/categories', label: 'Categories', icon: LayoutGrid, end: false, also: ['/shop', '/search', '/top-rated', '/new'] },
    { to: '/sell', label: 'Sell', icon: Store, end: false },
    { to: '/account/wishlist', label: 'Wishlist', icon: Heart, end: false, badge: wishlist.length },
    { to: '/account', label: 'Account', icon: UserIcon, end: false, not: '/account/wishlist' },
  ]
  return (
    <nav aria-label="Mobile" className="on-dark safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, end, also, not, badge }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => {
              const on = (isActive && !(not && loc.pathname.startsWith(not))) || !!also?.some((a) => loc.pathname.startsWith(a))
              return cx('relative flex h-[var(--bottom-nav)] flex-col items-center justify-center gap-1 text-[10px] font-medium', on ? 'text-pink' : 'text-white/70')
            }}>
              <Icon size={21} aria-hidden />{label}
              {!!badge && <span className="absolute left-1/2 top-1.5 ml-1.5 grid min-w-4 place-items-center rounded-full bg-pink px-1 text-[10px] font-bold leading-4 text-ink">{badge}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Footer() {
  const { settings } = useStore()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const sub = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.')
    setErr(''); setDone(true)
  }
  const cols: [string, [string, string][]][] = [
    ['Shop', [['/shop/wigs', 'Wigs'], ['/shop/bundles', 'Bundles'], ['/shop/closures', 'Closures'], ['/shop/frontals', 'Frontals'], ['/wholesale', 'Wholesale']]],
    ['Support', [['/help', 'Help centre & FAQs'], ['/help#delivery', 'Delivery'], ['/help#returns', 'Returns & refunds'], ['/help#authenticity', 'Authenticity guidance'], ['/account/messages', 'Contact a seller']]],
    ['Sellers', [['/sell', 'Sell on BLENDD'], ['/sell/apply', 'Open a shop'], ['/seller', 'Seller dashboard'], ['/help#sellers', 'Seller resources']]],
    ['Policies', [['/help#terms', 'Terms of use'], ['/help#privacy', 'Privacy'], ['/help#returns', 'Returns policy'], ['/help#reporting', 'Report a listing']]],
  ]
  return (
    <footer className="on-dark mt-16 bg-ink pb-[calc(var(--bottom-nav)+env(safe-area-inset-bottom))] text-white sm:mt-24 lg:pb-0">
      <div className="mx-auto max-w-[1440px] px-4 py-14 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo size={42} tag />
            <p className="mt-8 max-w-sm font-display text-3xl font-extrabold leading-tight">Your hair. Your people. Your place.</p>
            <form onSubmit={sub} className="mt-6 max-w-sm" noValidate>
              <label htmlFor="nl" className="text-sm text-white/70">Optional marketing emails — unsubscribe any time.</label>
              {done ? <p className="mt-3 rounded-lg bg-white/10 p-3 text-sm">Thanks! This demo has no email service connected, so nothing was sent or stored.</p> : (
                <div className="mt-3 flex gap-2"><input id="nl" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.co.za" className="h-11 min-w-0 flex-1 rounded-full bg-graphite px-4 text-sm outline-none focus:ring-2 focus:ring-pink" /><button className="h-11 rounded-full bg-pink px-5 text-sm font-semibold text-ink">Subscribe</button></div>
              )}
              {err && <p role="alert" className="mt-2 text-xs text-pink">{err}</p>}
            </form>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {cols.map(([h, links]) => (
              <div key={h}><p className="eyebrow mb-4 text-pink">{h}</p><ul className="space-y-2.5 text-sm text-white/75">{links.map(([to, l]) => <li key={l}><Link to={to} className="hover:text-white hover:underline">{l}</Link></li>)}</ul></div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 BLENDD · Hair supply marketplace · South Africa · support@blendd.example · {settings.announcement.includes('demo') ? 'Demo preview' : ''}</p>
          <div className="flex gap-4"><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a><a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:text-white">TikTok</a><a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a></div>
        </div>
        <p className="mt-4 max-w-3xl text-[11px] leading-relaxed text-white/40">Demo mode: all sellers, products, prices, ratings and orders are illustrative sample data; photography is stock imagery. BLENDD is a marketplace — products are sold by the independent seller shown on each listing. No payments, couriers, email or push services are connected.</p>
      </div>
    </footer>
  )
}

export default function BuyerLayout() {
  const { settings } = useStore()
  const [hide, setHide] = useState(false)
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[300] focus:rounded-full focus:bg-pink focus:px-4 focus:py-2">Skip to content</a>
      {!hide && settings.announcement && (
        <div className="relative bg-pink py-2 pl-4 pr-11 text-center text-xs font-medium text-ink sm:px-12">
          {settings.announcement}
          <button onClick={() => setHide(true)} aria-label="Dismiss announcement" className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center"><X size={14} /></button>
        </div>
      )}
      <Header />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
      <BottomNav />
    </div>
  )
}
