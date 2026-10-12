import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useStore } from '../../store/store'
import { IMG } from '../../lib/data'
import { money } from '../../lib/format'
import ProductCard from '../../components/ProductCard'
import { DemoBadge, Img, SectionHead, cx } from '../../components/ui'

type TabId = 'trending' | 'new' | 'best' | 'budget' | 'wholesale'

export function ProductRow({ items }: { items: ReturnType<typeof useStore>['products'] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 xl:grid-cols-5">
      {items.map((p) => <div key={p.id} className="w-[44vw] shrink-0 snap-start sm:w-56 lg:w-auto"><ProductCard p={p} /></div>)}
    </div>
  )
}

const TEXTURES = [
  { t: 'Straight', img: IMG.honeyBack }, { t: 'Body wave', img: IMG.bundleOmbre }, { t: 'Deep wave', img: IMG.bundleOrange },
  { t: 'Curly', img: IMG.curlyMannequin }, { t: 'Kinky curly', img: IMG.extWall }, { t: 'Coily', img: IMG.braidHair },
]
const LENGTHS = [12, 16, 20, 24, 28]
const BUILDS = ['4x4', '5x5', '13x4', '13x6']

const chip = 'inline-flex h-10 items-center rounded-full border border-line px-4 text-[13px] font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-white'

export default function ProductDiscovery() {
  const { products } = useStore()
  const [tab, setTab] = useState<TabId>('trending')
  const live = useMemo(() => products.filter((p) => p.status === 'published'), [products])

  const lists = useMemo(() => ({
    trending: { items: [...live].sort((a, b) => b.popularity - a.popularity), note: 'Ordered by demo popularity score.', to: '/shop?sort=popular' },
    new: { items: [...live].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), note: 'Most recently listed.', to: '/new' },
    best: { items: live.filter((p) => p.reviewCount > 0).sort((a, b) => b.reviewCount - a.reviewCount), note: 'Ordered by number of sample reviews. No real sales data exists yet.', to: '/shop?sort=rated' },
    budget: { items: live.filter((p) => p.price < 1000 && !p.wholesale), note: 'Retail listings under R1,000.', to: '/shop?under=1000' },
    wholesale: { items: live.filter((p) => p.wholesale), note: 'Listings with supplier-set MOQs and tier pricing.', to: '/shop?channel=wholesale' },
  }), [live])

  const TABS: [TabId, string][] = [['trending', 'Trending'], ['new', 'New arrivals'], ['best', 'Bestsellers'], ['budget', 'Budget-friendly'], ['wholesale', 'Wholesale deals']]
  const cur = lists[tab]

  return (
    <>
      <section aria-label="Discover products">
        <SectionHead eyebrow="Products" title="Shop the marketplace" action={<Link to={cur.to} className="text-sm font-semibold link-pink">View all</Link>} />
        <div role="tablist" aria-label="Product lists" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          {TABS.map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cx('h-10 shrink-0 rounded-full border px-4 text-[13px] font-semibold transition-colors', tab === id ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink')}>{l}</button>)}
        </div>
        <p className="mb-5 mt-4 flex flex-wrap items-center gap-2 text-xs text-mute">{cur.note} <DemoBadge /></p>
        {cur.items.length ? <ProductRow items={cur.items.slice(0, 5)} /> : <p className="text-sm text-mute">No listings match this list right now.</p>}
      </section>

      <section aria-label="Shop by hair attributes">
        <SectionHead eyebrow="Find your match" title="Hair by texture, length and build" />
        <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 lg:mx-0 lg:justify-between lg:px-0">
          {TEXTURES.map((s) => (
            <Link key={s.t} to={`/shop?texture=${encodeURIComponent(s.t)}`} className="group w-28 shrink-0 text-center sm:w-36">
              <Img id={s.img} w={300} h={300} alt="" className="aspect-square rounded-full ring-2 ring-transparent transition group-hover:ring-pink" />
              <span className="mt-3 block text-sm font-semibold">{s.t}</span>
            </Link>
          ))}
        </div>
        <div className="mt-10 grid gap-8 border-t border-line pt-8 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-3 text-mute">Length</p>
            <div className="flex flex-wrap gap-2">{LENGTHS.map((l) => <Link key={l} to={`/shop?length=${l}`} className={chip}>{l}&quot;</Link>)}</div>
          </div>
          <div>
            <p className="eyebrow mb-3 text-mute">Lace and construction</p>
            <div className="flex flex-wrap gap-2">{BUILDS.map((b) => <Link key={b} to={`/shop?lace=${b}`} className={chip}>{b} lace</Link>)}</div>
          </div>
        </div>
      </section>
    </>
  )
}

export function WholesaleBand() {
  const { products, sellers } = useStore()
  const picks = useMemo(() => products.filter((p) => p.status === 'published' && p.wholesale).slice(0, 3), [products])
  const suppliers = sellers.filter((s) => s.status === 'active' && s.types.some((t) => t === 'wholesaler' || t === 'manufacturer'))
  return (
    <section aria-label="Wholesale and suppliers" className="on-dark overflow-hidden rounded-sm bg-ink p-6 text-white lg:p-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="eyebrow mb-4 text-pink">For hair businesses</p>
          <h2 className="text-4xl font-extrabold lg:text-5xl">Source stock from suppliers you can compare.</h2>
          <p className="mt-4 max-w-md text-white/70">Browse wholesalers and manufacturers, check minimum order quantities and tier pricing, then enquire or request a quote. Each supplier sets its own terms.</p>
          <ul className="mt-6 space-y-2 text-sm text-white/80">
            <li>{suppliers.length} supplier storefronts in this demo</li>
            <li>MOQs and price tiers shown on each listing</li>
            <li>Quote requests go to the supplier, not a middleman</li>
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/wholesale" className="inline-flex h-11 items-center rounded-full bg-pink px-6 text-sm font-semibold text-ink hover:bg-[#ffa9cb]">Explore wholesale</Link>
            {suppliers[0] && <Link to={`/store/${suppliers[0].handle}`} className="inline-flex h-11 items-center rounded-full border border-white/40 px-6 text-sm font-semibold hover:bg-white hover:text-ink">Visit a supplier</Link>}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {picks.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`} className="group rounded-sm bg-graphite p-3 transition-colors hover:bg-[#2c2c34]">
              <Img id={p.images[0]} w={400} h={400} alt={p.title} className="aspect-square rounded-sm" />
              <p className="mt-3 line-clamp-2 text-sm font-semibold">{p.title}</p>
              <p className="mt-1 text-xs text-white/60">MOQ {p.wholesale!.moq} · {p.wholesale!.leadTime}</p>
              <p className="mt-1 text-sm font-bold text-pink">from {money(Math.min(...p.wholesale!.tiers.map((t) => t.price)))}<span className="font-normal text-white/60"> / unit</span></p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
