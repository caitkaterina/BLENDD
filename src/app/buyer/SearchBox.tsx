import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Clock, Search, TrendingUp, X } from 'lucide-react'
import { useStore } from '../store/store'
import { POPULAR_SEARCHES, suggest } from '../lib/search'
import { CATEGORIES } from '../lib/config'
import { money } from '../lib/format'
import { Img } from '../components/ui'

export default function SearchBox({ autoFocus, onDone, dark = true }: { autoFocus?: boolean; onDone?: () => void; dark?: boolean }) {
  const { products, sellers, recentSearches, addRecentSearch, clearRecentSearches } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const box = useRef<HTMLDivElement>(null)
  const live = useMemo(() => products.filter((p) => p.status === 'published'), [products])
  const sg = useMemo(() => (q.trim() ? suggest(q, live, sellers) : null), [q, live, sellers])

  useEffect(() => {
    const h = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const go = (term: string) => {
    const t = term.trim()
    if (!t) return
    addRecentSearch(t)
    setOpen(false)
    nav(`/search?q=${encodeURIComponent(t)}`)
    onDone?.()
  }
  const close = () => { setOpen(false); onDone?.() }

  return (
    <div ref={box} className="relative w-full">
      <form role="search" onSubmit={(e) => { e.preventDefault(); go(q) }} className={`flex h-11 items-center gap-2 rounded-full px-4 ${dark ? 'bg-graphite text-white focus-within:ring-2 focus-within:ring-pink' : 'border border-line bg-white text-ink'}`}>
        <Search size={17} className="shrink-0 opacity-70" aria-hidden />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          aria-label="Search BLENDD"
          placeholder="Search hair, vendors, styles…"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-current placeholder:opacity-50 focus-visible:shadow-none"
          style={{ boxShadow: 'none', outline: 'none' }}
        />
        {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="opacity-70 hover:opacity-100"><X size={16} /></button>}
      </form>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl bg-white p-3 text-ink shadow-2xl ring-1 ring-black/5">
          {!sg ? (
            <div className="grid gap-4 p-2 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between"><p className="eyebrow text-mute">Recent</p>{recentSearches.length > 0 && <button onClick={clearRecentSearches} className="text-xs text-mute hover:text-ink">Clear</button>}</div>
                {recentSearches.length === 0 ? <p className="text-sm text-mute">Your recent searches will show here.</p> : recentSearches.map((r) => (
                  <button key={r} onClick={() => go(r)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-fog"><Clock size={14} className="text-mute" />{r}</button>
                ))}
              </div>
              <div>
                <p className="eyebrow mb-2 text-mute">Popular</p>
                {POPULAR_SEARCHES.map((r) => (
                  <button key={r} onClick={() => go(r)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-fog"><TrendingUp size={14} className="text-mute" />{r}</button>
                ))}
              </div>
              <div className="sm:col-span-2">
                <p className="eyebrow mb-2 text-mute">Categories</p>
                <div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <Link key={c.id} onClick={close} to={`/shop/${c.id}`} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:bg-ink hover:text-white">{c.short}</Link>)}</div>
              </div>
            </div>
          ) : (
            <div className="p-1">
              {sg.prods.length === 0 && sg.cats.length === 0 && sg.sellers.length === 0 && <p className="p-3 text-sm text-mute">No suggestions for “{q}”. Press Enter to search anyway.</p>}
              {sg.prods.map((p) => (
                <Link key={p.id} onClick={close} to={`/product/${p.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-fog">
                  <Img id={p.images[0]} w={120} h={150} alt="" className="h-14 w-11 shrink-0 rounded" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.title}</span><span className="block truncate text-xs text-mute">{sellers.find((s) => s.id === p.sellerId)?.name}</span></span>
                  <span className="text-sm font-bold">{money(p.price)}</span>
                </Link>
              ))}
              {sg.cats.length > 0 && <div className="mt-2 flex flex-wrap gap-2 border-t border-line px-2 pt-3">{sg.cats.map((c) => <Link key={c.id} onClick={close} to={`/shop/${c.id}`} className="rounded-full bg-fog px-3 py-1.5 text-xs font-semibold hover:bg-pink">in {c.label}</Link>)}</div>}
              {sg.sellers.length > 0 && <div className="mt-2 border-t border-line px-2 pt-3"><p className="eyebrow mb-2 text-mute">Sellers</p>{sg.sellers.map((s) => <Link key={s.id} onClick={close} to={`/store/${s.handle}`} className="block rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-fog">{s.name}</Link>)}</div>}
              <button onClick={() => go(q)} className="mt-2 w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-white">See all results for “{q}”</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
