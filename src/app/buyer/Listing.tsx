import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import { ChevronRight, LayoutGrid, List, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useStore } from '../store/store'
import { CATEGORIES } from '../lib/config'
import { EMPTY_FILTERS, SORTS, activeChips, applyFilters, type Filters, type SortId } from '../lib/filters'
import { altQueries, searchProducts } from '../lib/search'
import type { CategoryId, Product } from '../lib/types'
import ProductCard from '../components/ProductCard'
import { Button, DemoBadge, Empty, Modal, Skeleton, cx } from '../components/ui'
import FilterPanel from './FilterPanel'

type Mode = 'shop' | 'search' | 'top' | 'new'
const PAGE = 12

function Inner({ mode, products: scope, heading, eyebrow, sellerScoped }: { mode: Mode; products?: Product[]; heading?: string; eyebrow?: string; sellerScoped?: boolean }) {
  const { products, sellers } = useStore()
  const { category } = useParams()
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const cat = CATEGORIES.find((c) => c.id === category)

  const init = useMemo<Filters>(() => {
    const f: Filters = { ...EMPTY_FILTERS, categories: cat ? [cat.id as CategoryId] : [] }
    const tex = sp.get('texture'); if (tex) f.textures = [tex]
    const lace = sp.get('lace'); if (lace) f.lace = [lace]
    const len = Number(sp.get('length')); if (len) f.lengths = [len]
    const hair = sp.get('hair'); if (hair === 'human' || hair === 'synthetic' || hair === 'blended') f.hairTypes = [hair]
    const under = sp.get('under'); if (under) f.priceMax = Number(under)
    const ch = sp.get('channel'); if (ch === 'wholesale' || ch === 'retail') f.channel = ch
    if (mode === 'top') f.sort = 'rated'
    if (mode === 'new') f.sort = 'newest'
    const sort = sp.get('sort') as SortId | null; if (sort) f.sort = sort
    return f
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [f, setF] = useState<Filters>(init)
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [shown, setShown] = useState(PAGE)
  const [drawer, setDrawer] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t) }, [])
  useEffect(() => setShown(PAGE), [f, q])

  const live = useMemo(() => (scope ?? products).filter((p) => p.status === 'published'), [scope, products])
  const base = useMemo(() => (mode === 'search' && q ? searchProducts(q, live, sellers) : live), [mode, q, live, sellers])
  const filtered = useMemo(() => {
    const out = applyFilters(base, sellers, f)
    if (mode === 'search' && q && f.sort === 'recommended') return out.sort((a, b) => base.indexOf(a) - base.indexOf(b))
    return out
  }, [base, sellers, f, mode, q])
  const chips = activeChips(f)
  const title = heading ?? (mode === 'search' ? (q ? `Results for “${q}”` : 'Search') : mode === 'top' ? 'Top rated' : mode === 'new' ? 'New arrivals' : cat ? cat.label : 'Shop all hair')
  const visible = filtered.slice(0, shown)

  const panel = <FilterPanel f={f} set={setF} lockCategory={!!cat} />

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-xs text-mute">
        <Link to="/" className="hover:text-ink">Home</Link><ChevronRight size={12} />
        {mode === 'shop' && cat ? <><Link to="/shop" className="hover:text-ink">Shop</Link><ChevronRight size={12} /><span className="font-semibold text-ink">{cat.label}</span></> : <span className="font-semibold text-ink">{title}</span>}
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow mb-3 text-mute">{eyebrow}</p>}
          <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
          {cat && <p className="mt-2 text-sm text-mute">{cat.blurb}</p>}
          <p className="mt-2 text-sm text-mute" aria-live="polite">{loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "product" : "products"}`} <span className="ml-2 inline-block align-middle"><DemoBadge /></span></p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}><SlidersHorizontal size={15} /> Filters{chips.length > 0 && ` (${chips.length})`}</Button>
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value as SortId })} className="h-9 rounded-full border border-line bg-white px-4 text-[13px] font-semibold">{SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          <div className="hidden overflow-hidden rounded-full border border-line sm:flex" role="group" aria-label="Layout">
            {([['grid', LayoutGrid], ['list', List]] as const).map(([k, Icon]) => <button key={k} aria-pressed={layout === k} aria-label={`${k} view`} onClick={() => setLayout(k)} className={cx('grid size-9 place-items-center', layout === k ? 'bg-ink text-white' : 'hover:bg-fog')}><Icon size={15} /></button>)}
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {chips.map((c) => <button key={c.key} onClick={() => setF(c.clear(f))} className="inline-flex items-center gap-1.5 rounded-full bg-pink px-3 py-1.5 text-xs font-semibold">{c.label}<X size={12} aria-label="Remove filter" /></button>)}
          <button onClick={() => setF({ ...EMPTY_FILTERS, sort: f.sort, categories: cat ? f.categories : [] })} className="text-xs font-semibold underline">Clear all</button>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside aria-label="Filters" className="no-scrollbar sticky top-32 hidden max-h-[calc(100vh-9rem)] self-start overflow-y-auto pr-2 lg:block">{panel}</aside>
        <section>
          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i}><Skeleton className="aspect-[4/5]" /><Skeleton className="mt-3 h-4 w-3/4" /><Skeleton className="mt-2 h-4 w-1/3" /></div>)}</div>
          ) : filtered.length === 0 ? (
            <Empty icon={<SearchX size={22} />} title={q ? `No results for “${q}”` : 'No products match these filters'} body={q ? 'Check the spelling, or try a broader term. We only show listings that match what you typed.' : 'Try removing a filter or two.'}
              action={<><Button variant="dark" onClick={() => setF({ ...EMPTY_FILTERS, categories: cat ? f.categories : [] })}>Clear filters</Button></>} />
          ) : (
            <>
              <div className={cx(layout === 'grid' ? 'grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 xl:grid-cols-4' : 'grid gap-3')}>
                {visible.map((p) => <ProductCard key={p.id} p={p} layout={layout === 'list' ? 'list' : 'grid'} />)}
              </div>
              <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-sm text-mute">Showing {visible.length} of {filtered.length}</p>
                {visible.length < filtered.length && <Button variant="outline" onClick={() => setShown(shown + PAGE)}>Load more</Button>}
              </div>
            </>
          )}
          {!loading && filtered.length === 0 && mode === 'search' && (
            <div className="mt-8">
              <p className="mb-3 text-sm font-bold">Try instead</p>
              <div className="flex flex-wrap gap-2">{altQueries(q).map((a) => <button key={a} onClick={() => setSp({ q: a })} className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-pink">{a}</button>)}</div>
              <div className="mt-6 flex flex-wrap gap-2">{CATEGORIES.map((c) => <Link key={c.id} to={`/shop/${c.id}`} className="rounded-full bg-fog px-4 py-2 text-sm font-semibold hover:bg-ink hover:text-white">{c.label}</Link>)}</div>
            </div>
          )}
        </section>
      </div>

      <Modal open={drawer} onClose={() => setDrawer(false)} title="Filters" footer={<Button variant="dark" full onClick={() => setDrawer(false)}>Show {filtered.length} products</Button>}>{panel}</Modal>
      {sellerScoped && null}
    </div>
  )
}

export default function Listing({ mode }: { mode: Mode }) {
  const loc = useLocation()
  return <Inner key={loc.pathname + loc.search} mode={mode} eyebrow={mode === 'top' ? 'Rated by buyers' : mode === 'new' ? 'Fresh listings' : undefined} />
}
