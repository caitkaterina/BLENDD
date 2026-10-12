import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Heart, MapPin } from 'lucide-react'
import { useStore } from '../../store/store'
import type { Product, Seller } from '../../lib/types'
import { Badge, DemoBadge, Img, LinkButton, SectionHead, Stars, VerifiedBadge, cx } from '../../components/ui'

export const TYPE_LABEL: Record<string, string> = { reseller: 'Reseller', retailer: 'Retailer', wholesaler: 'Wholesaler', manufacturer: 'Manufacturer' }

type TabId = 'top' | 'new' | 'rising' | 'loved' | 'verified' | 'trending' | 'foryou' | 'recent'

export function StoreCard({ s, count }: { s: Seller; count: number }) {
  const { followed, toggleFollow } = useStore()
  const on = followed.includes(s.id)
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-sm border border-line bg-white transition-shadow hover:shadow-lg">
      <Link to={`/store/${s.handle}`} className="relative block aspect-[4/3] bg-ink">
        <Img id={s.cover} w={640} h={480} alt="" className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <span className="caps absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-[9px] text-white">{count} {count === 1 ? 'listing' : 'listings'}</span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/store/${s.handle}`} className="min-w-0"><h3 className="truncate font-display text-lg font-bold leading-tight tracking-tight">{s.name}</h3></Link>
          <button onClick={() => toggleFollow(s.id)} aria-pressed={on} aria-label={on ? `Unfollow ${s.name}` : `Follow ${s.name}`} className="grid size-10 shrink-0 place-items-center rounded-full border border-line hover:border-ink"><Heart size={16} className={on ? 'fill-pink' : ''} /></button>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-mute"><MapPin size={12} aria-hidden /> {s.showLocation ? `${s.city}, ${s.province}` : 'Location private'}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.types.map((t) => <Badge key={t} tone="neutral">{TYPE_LABEL[t]}</Badge>)}
          <VerifiedBadge verified={s.verified} status={s.verificationStatus} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-mute">
          <span className="min-w-0 truncate">{s.dispatch}</span>
          <Stars value={s.rating} count={s.reviewCount} showEmpty={false} />
        </div>
      </div>
    </article>
  )
}

export default function StoreDiscovery() {
  const { sellers, products, recent, followed, wishlist } = useStore()
  const [tab, setTab] = useState<TabId>('top')

  const data = useMemo(() => {
    const live = products.filter((p) => p.status === 'published')
    const by = new Map<string, Product[]>()
    live.forEach((p) => by.set(p.sellerId, [...(by.get(p.sellerId) ?? []), p]))
    const active = sellers.filter((s) => s.status === 'active' && by.has(s.id))
    const pop = (s: Seller) => (by.get(s.id) ?? []).reduce((n, p) => n + p.popularity, 0)
    const newestListing = (s: Seller) => (by.get(s.id) ?? []).map((p) => p.createdAt).sort().pop() ?? ''
    const sellerOf = (id: string) => live.find((p) => p.id === id)?.sellerId
    const seen = [...new Set(recent.map(sellerOf).filter(Boolean) as string[])]
    const interestSellers = new Set([...followed, ...wishlist.map(sellerOf).filter(Boolean) as string[]])
    const foryou = [...active].sort((a, b) => Number(interestSellers.has(b.id)) - Number(interestSellers.has(a.id)) || pop(b) - pop(a))
    const lists: Record<TabId, { items: Seller[]; note: string }> = {
      top: { items: active.filter((s) => s.verified).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)), note: 'Verified stores, ordered by sample rating.' },
      new: { items: [...active].sort((a, b) => b.joined.localeCompare(a.joined)), note: 'Newest stores first, whatever their size.' },
      rising: { items: active.filter((s) => s.joined >= '2026-01-01').sort((a, b) => newestListing(b).localeCompare(newestListing(a))), note: 'Stores opened in 2026, ordered by most recent listing.' },
      loved: { items: active.filter((s) => s.reviewCount > 0).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount), note: 'Stores with sample reviews, ordered by sample rating.' },
      verified: { items: active.filter((s) => s.verified), note: 'Stores an admin has marked verified in this demo.' },
      trending: { items: [...active].sort((a, b) => pop(b) - pop(a)), note: 'Ordered by the demo popularity score of their listings.' },
      foryou: { items: foryou, note: interestSellers.size ? 'Starts with stores you follow or have saved from.' : 'Follow stores and save products to personalise this.' },
      recent: { items: seen.map((id) => active.find((s) => s.id === id)).filter(Boolean) as Seller[], note: 'Stores behind products you opened recently.' },
    }
    return { lists, by }
  }, [sellers, products, recent, followed, wishlist])

  const TABS: { id: TabId; label: string }[] = [
    { id: 'top', label: 'Top stores' }, { id: 'new', label: 'New on BLENDD' }, { id: 'rising', label: 'Rising stars' }, { id: 'loved', label: 'Most loved' },
    { id: 'verified', label: 'Verified' }, { id: 'trending', label: 'Trending' }, { id: 'foryou', label: 'For you' }, { id: 'recent', label: 'Recently viewed' },
  ]
  const cur = data.lists[tab]

  return (
    <section id="stores" aria-label="Discover stores" className="scroll-mt-32">
      <SectionHead eyebrow="Businesses, not just products" title="Discover stores" action={<LinkButton to="/wholesale" variant="outline" size="sm">Supplier directory</LinkButton>} />
      <div role="tablist" aria-label="Store lists" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cx('h-10 shrink-0 rounded-full border px-4 text-[13px] font-semibold transition-colors', tab === t.id ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink')}>{t.label}</button>
        ))}
      </div>
      <p className="mb-5 mt-4 flex flex-wrap items-center gap-2 text-xs text-mute">{cur.note} <DemoBadge /></p>
      {cur.items.length ? (
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4">
          {cur.items.slice(0, 8).map((s) => <div key={s.id} className="w-[72vw] shrink-0 snap-start sm:w-72 lg:w-auto"><StoreCard s={s} count={data.by.get(s.id)?.length ?? 0} /></div>)}
        </div>
      ) : (
        <div className="rounded-sm border border-dashed border-line p-8 text-center">
          <p className="font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-mute">Open a few products and stores to fill this list.</p>
        </div>
      )}
    </section>
  )
}
