import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router'
import {
  Bell, Flag, LayoutDashboard, Lock, LogOut, Menu, ScrollText, Settings, ShieldCheck, ShoppingBag, Store, Tags, Users, X,
  Boxes, LifeBuoy, MessageSquareWarning, Megaphone, Percent, Wallet, FileText, RotateCcw, Undo2, ExternalLink,
} from 'lucide-react'
import { useStore } from '../store/store'
import { Logo } from '../components/Logo'
import { Badge, cx } from '../components/ui'
import { fmtDate } from '../lib/format'
import type { Permission } from '../lib/types'

type NavItem = { to: string; label: string; icon: typeof Users; perm?: Permission; end?: boolean }
const GROUPS: { title: string; items: NavItem[] }[] = [
  { title: 'Overview', items: [{ to: '/admin', label: 'Marketplace', icon: LayoutDashboard, end: true }] },
  {
    title: 'People',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users, perm: 'users' },
      { to: '/admin/sellers', label: 'Sellers', icon: Store, perm: 'sellers' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { to: '/admin/listings', label: 'Listings', icon: Boxes, perm: 'listings' },
      { to: '/admin/catalogue', label: 'Categories & attributes', icon: Tags, perm: 'catalogue' },
      { to: '/admin/merchandising', label: 'Merchandising', icon: Megaphone, perm: 'merchandising' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, perm: 'orders' },
      { to: '/admin/disputes', label: 'Disputes & returns', icon: Undo2, perm: 'disputes' },
      { to: '/admin/refunds', label: 'Refunds', icon: RotateCcw, perm: 'disputes' },
      { to: '/admin/fees', label: 'Marketplace fee', icon: Percent, perm: 'fees' },
      { to: '/admin/payouts', label: 'Payouts', icon: Wallet, perm: 'payouts' },
    ],
  },
  {
    title: 'Trust & care',
    items: [
      { to: '/admin/reviews', label: 'Reviews & reports', icon: MessageSquareWarning, perm: 'reviews' },
      { to: '/admin/fraud', label: 'Fraud flags', icon: Flag, perm: 'fraud' },
      { to: '/admin/support', label: 'Support tickets', icon: LifeBuoy, perm: 'support' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { to: '/admin/content', label: 'Content', icon: FileText, perm: 'content' },
      { to: '/admin/audit', label: 'Audit log', icon: ScrollText, perm: 'audit' },
      { to: '/admin/settings', label: 'Settings', icon: Settings, perm: 'settings' },
    ],
  },
]

function RailNav({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useStore()
  return (
    <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3 pb-6">
      {GROUPS.map((g) => (
        <div key={g.title} className="mt-5 first:mt-2">
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const allowed = !i.perm || can(i.perm)
              const Icon = i.icon
              if (!allowed)
                return (
                  <li key={i.to}>
                    <span
                      title={`Your admin role does not include the “${i.perm}” permission`}
                      aria-disabled="true"
                      tabIndex={0}
                      className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/35"
                    >
                      <Icon size={16} aria-hidden />
                      <span className="flex-1 truncate">{i.label}</span>
                      <Lock size={13} aria-label={`Locked: requires ${i.perm} permission`} />
                    </span>
                  </li>
                )
              return (
                <li key={i.to}>
                  <NavLink
                    to={i.to}
                    end={i.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors', isActive ? 'bg-pink font-semibold text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white')
                    }
                  >
                    <Icon size={16} aria-hidden />
                    <span className="truncate">{i.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function Bell_() {
  const { notifications, markRead, markAllRead } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const list = notifications.filter((n) => n.audience === 'admin')
  const unread = list.filter((n) => !n.read).length
  useEffect(() => {
    if (!open) return
    const d = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', d)
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', d); document.removeEventListener('keydown', k) }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Admin notifications, ${unread} unread`} className="relative grid size-10 place-items-center rounded-full border border-line hover:bg-fog">
        <Bell size={17} />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-pink ring-2 ring-white" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-[min(92vw,360px)] rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold">Notifications</p>
            <button onClick={() => markAllRead('admin')} disabled={!unread} className="text-xs font-semibold underline disabled:no-underline disabled:opacity-40">Mark all read</button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {list.length === 0 && <li className="px-4 py-8 text-center text-sm text-mute">Nothing new.</li>}
            {list.map((n) => (
              <li key={n.id} className="border-b border-line/70 last:border-0">
                <button
                  onClick={() => { markRead(n.id); setOpen(false); if (n.href) nav(n.href) }}
                  className="flex w-full gap-3 px-4 py-3 text-left hover:bg-fog"
                >
                  <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-line' : 'bg-pink ring-1 ring-ink/20')} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{n.title}</span>
                    <span className="block text-xs text-mute">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-mute">{fmtDate(n.at, true)}</span>
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

export default function AdminLayout() {
  const { user, signIn, signOut } = useStore()
  const [drawer, setDrawer] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  const main = useRef<HTMLElement>(null)
  useEffect(() => { setDrawer(false); main.current?.scrollTo({ top: 0 }) }, [loc.pathname])
  useEffect(() => {
    if (!drawer) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [drawer])
  const role = user?.adminRole ?? 'super_admin'
  const roleLabel = role.replace('_', ' ')

  return (
    <div className="fixed inset-0 z-[60] flex bg-fog text-ink">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      {/* desktop rail */}
      <aside className="on-dark hidden w-64 shrink-0 flex-col bg-ink text-white lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-5"><Link to="/admin" aria-label="BLENDD admin home"><Logo size={30} /></Link></div>
        <RailNav />
        <div className="border-t border-white/10 p-4 text-[11px] text-white/50">Demo workspace · local data only</div>
      </aside>
      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setDrawer(false)} />
          <aside className="on-dark absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ink text-white">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <Logo size={28} />
              <button onClick={() => setDrawer(false)} aria-label="Close navigation" className="grid size-9 place-items-center rounded-full hover:bg-white/10"><X size={18} /></button>
            </div>
            <RailNav onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-3 border-b border-line bg-white px-4 py-2.5 sm:px-6">
          <button onClick={() => setDrawer(true)} aria-label="Open navigation" className="grid size-10 place-items-center rounded-full border border-line hover:bg-fog lg:hidden"><Menu size={18} /></button>
          <span className="hidden font-wide text-[11px] tracking-[0.3em] sm:inline">ADMIN</span>
          <Badge tone="dark" className="capitalize"><ShieldCheck size={12} aria-hidden /> {roleLabel}</Badge>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2 max-sm:contents">
            <span className="flex-1 sm:hidden" aria-hidden />
            <div className="order-last flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-mute/50 px-2.5 py-1 sm:order-none sm:w-auto sm:justify-start">
              <label htmlFor="role-switch" className="max-w-[210px] text-[10px] font-semibold leading-tight text-mute"><span className="sm:hidden">Demo role</span><span className="hidden sm:inline">Demo: switch admin role to see permission-based access</span></label>
              <select
                id="role-switch"
                value={role === 'support' ? 'support' : 'admin'}
                onChange={(e) => { signIn(e.target.value as 'admin' | 'support'); nav('/admin') }}
                className="h-8 rounded-lg border border-line bg-white px-2 text-xs font-semibold outline-none focus:border-ink"
              >
                <option value="admin">Super admin</option>
                <option value="support">Support</option>
              </select>
            </div>
            <Bell_ />
            <Link to="/" className="hidden h-10 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold hover:bg-fog sm:inline-flex"><ExternalLink size={14} aria-hidden /> Shop</Link>
            <button onClick={() => { signOut(); nav('/') }} aria-label="Sign out" className="inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-sm sm:px-4 font-semibold text-white hover:bg-graphite"><LogOut size={14} aria-hidden /> <span className="hidden sm:inline">Sign out</span></button>
          </div>
        </header>
        <div role="status" className="shrink-0 border-b border-[#e8c98a] bg-[#fbefd6] px-4 py-1.5 text-center text-xs font-medium text-[#5f3c08] sm:px-6">
          Demo workspace — actions change local demo data only; nothing is sent to payment providers, couriers or email services.
        </div>
        <main id="admin-main" ref={main} tabIndex={-1} className="flex-1 overflow-y-auto px-4 py-6 outline-none sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}
