import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Bell, ChevronDown, ExternalLink, Menu, Store, X } from 'lucide-react'
import { Logo } from '../components/Logo'
import { Badge, ErrorState, LinkButton, cx } from '../components/ui'
import { fmtDate } from '../lib/format'
import { ACTION_STATUSES, useSellerData } from './lib/useSellerData'
import { NAV } from './lib/nav'
import { Notice } from './components/kit'

function Sidebar({ counts, onNavigate }: { counts: Record<string, number>; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  return (
    <div className="on-dark flex h-full flex-col bg-graphite text-white">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <Link to="/seller" onClick={onNavigate} aria-label="BLENDD seller centre"><Logo size={28} /></Link>
        <span className="eyebrow text-white/50" style={{ fontSize: 8 }}>Seller</span>
      </div>
      <nav aria-label="Seller navigation" className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((g) => {
          const hasActive = g.items.some((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)))
          const open = g.id === 'home' ? true : !closed[g.id] || hasActive
          return (
            <div key={g.id} className="mb-3">
              {g.id !== 'home' && (
                <button type="button" aria-expanded={open} onClick={() => setClosed((c) => ({ ...c, [g.id]: open }))} className="mb-1 flex w-full items-center justify-between rounded px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50 hover:text-white">
                  {g.label}
                  <ChevronDown size={14} className={cx('transition-transform', !open && '-rotate-90')} aria-hidden />
                </button>
              )}
              {open && (
                <ul className="space-y-0.5">
                  {g.items.map((i) => {
                    const c = i.badge ? counts[i.badge] : 0
                    return (
                      <li key={i.to}>
                        <NavLink
                          to={i.to}
                          end={i.end}
                          onClick={onNavigate}
                          className={({ isActive }) => cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', (i.to === '/seller/products' ? isActive && pathname !== '/seller/products/new' : isActive) ? 'bg-pink text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white')}
                        >
                          <i.icon size={17} aria-hidden />
                          <span className="flex-1">{i.label}</span>
                          {c > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-white px-1.5 text-[11px] font-bold leading-5 text-ink" aria-label={`${c} need attention`}>{c}</span>}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-3 text-[11px] leading-snug text-white/50">Demo workspace. Data is stored in your browser only.</div>
    </div>
  )
}

function Bell_({ unread }: { unread: number }) {
  const { notifications, markRead, markAllRead } = useSellerData()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const list = notifications.filter((n) => n.audience === 'seller')
  useEffect(() => {
    if (!open) return
    const click = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', click)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key) }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="true" aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative grid size-10 place-items-center rounded-full hover:bg-fog">
        <Bell size={18} />
        {unread > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full bg-pink ring-2 ring-ink" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] rounded-xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold">Notifications</p>
            <button type="button" disabled={!unread} onClick={() => markAllRead('seller')} className="text-xs font-semibold underline disabled:no-underline disabled:opacity-40">Mark all read</button>
          </div>
          <ul className="max-h-80 divide-y divide-line overflow-y-auto">
            {list.length === 0 && <li className="px-4 py-8 text-center text-sm text-mute">No notifications yet.</li>}
            {list.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => { markRead(n.id); setOpen(false); if (n.href) nav(n.href) }} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-fog">
                  <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-line' : 'bg-pink ring-1 ring-ink')} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{n.title}</span>
                    <span className="block truncate text-xs text-mute">{n.body}</span>
                    <span className="mt-0.5 block text-[11px] text-mute">{fmtDate(n.at, true)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function SellerLayout() {
  const d = useSellerData()
  const { seller, verified, myGroups, myConvos, myEnquiries, notifications } = d
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setDrawer(false), [pathname])
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => {
    if (!drawer) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [drawer])

  if (!seller) {
    return (
      <div className="grid min-h-screen place-items-center bg-fog px-4">
        <div className="max-w-md"><ErrorState title="Store not found" body="Your account is linked to a seller store that no longer exists. Reset the demo data or apply to sell again." /><div className="mt-4 flex justify-center"><LinkButton to="/" variant="dark">Back to shop</LinkButton></div></div>
      </div>
    )
  }

  const counts = {
    orders: myGroups.filter((g) => ACTION_STATUSES.includes(g.group.status)).length,
    messages: myConvos.reduce((a, c) => a + c.unread, 0),
    wholesale: myEnquiries.filter((e) => e.status === 'new').length,
  }
  const unread = notifications.filter((n) => n.audience === 'seller' && !n.read).length

  return (
    <div className="min-h-screen bg-fog text-ink">
      <a href="#seller-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[300] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"><Sidebar counts={counts} /></aside>

      {drawer && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Seller menu">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <Sidebar counts={counts} onNavigate={() => setDrawer(false)} />
            <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-[-48px] top-3 grid size-10 place-items-center rounded-full bg-white"><X size={18} /></button>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-white px-3 sm:px-5 print:hidden">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu" className="grid size-10 place-items-center rounded-full hover:bg-fog lg:hidden"><Menu size={20} /></button>
          <div className="flex min-w-0 items-center gap-2">
            <Store size={16} className="hidden shrink-0 sm:block" aria-hidden />
            <p className="truncate text-sm font-bold">{seller.name}</p>
            <Badge tone="line" className="hidden sm:inline-flex">Demo mode</Badge>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Link to={`/store/${seller.handle}`} className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold hover:bg-fog sm:flex">View storefront <ExternalLink size={13} aria-hidden /></Link>
            <Link to="/" className="hidden h-9 items-center rounded-full border border-line px-3 text-[13px] font-semibold hover:border-ink md:flex">Back to shop</Link>
            <Bell_ unread={unread} />
          </div>
        </header>

        <main id="seller-main" className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-5 space-y-2 print:hidden">
            {!verified && (
              <Notice tone="warn"><strong>Verification pending</strong> — listings are reviewed before publishing; payouts stay disabled until payout setup is confirmed by the backend.</Notice>
            )}
            <Notice>Financial figures and analytics in this workspace are illustrative demo values. No real payments, payouts or traffic data are connected.</Notice>
            <div className="flex gap-2 sm:hidden">
              <LinkButton to={`/store/${seller.handle}`} variant="outline" size="sm">View storefront</LinkButton>
              <LinkButton to="/" variant="ghost" size="sm">Back to shop</LinkButton>
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
