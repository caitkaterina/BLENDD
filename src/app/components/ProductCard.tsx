import { useState } from 'react'
import { Link } from 'react-router'
import { Heart, Plus } from 'lucide-react'
import type { Product } from '../lib/types'
import { discountPct, stockState } from '../lib/pricing'
import { money } from '../lib/format'
import { useStore } from '../store/store'
import { Badge, Img, Stars, cx } from './ui'

export default function ProductCard({ p, layout = 'grid' }: { p: Product; layout?: 'grid' | 'list' }) {
  const { sellers, wishlist, toggleWishlist, addToCart } = useStore()
  const [hover, setHover] = useState(false)
  const seller = sellers.find((s) => s.id === p.sellerId)
  const wished = wishlist.includes(p.id)
  const st = stockState(p)
  const pct = discountPct(p)
  const hasOptions = p.options.length > 0 || !!p.wholesale
  const attrs = [p.texture, p.lace && `${p.lace} lace`, p.hairType && `${p.hairType} hair`, p.lengths.length > 1 ? `${p.lengths[0]}–${p.lengths[p.lengths.length - 1]}"` : null].filter(Boolean) as string[]

  const quickAdd = () => {
    if (hasOptions) return
    addToCart(p.id, {}, 1)
  }

  return (
    <article
      className={cx('group relative flex min-w-0', layout === 'list' ? 'flex-row gap-4 rounded-sm border border-line p-3' : 'flex-col')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link to={`/product/${p.id}`} className={cx('relative block shrink-0 overflow-hidden rounded-sm bg-fog', layout === 'list' ? 'w-32 sm:w-44' : 'w-full')} aria-label={p.title}>
        <div className="relative aspect-[4/5]">
          {p.images[1] && <Img id={p.images[1]} w={500} h={625} alt="" className="absolute inset-0" />}
          <Img id={p.images[0]} w={500} h={625} alt={p.title} className={cx('absolute inset-0 transition-opacity duration-500', hover && p.images[1] ? 'opacity-0' : 'opacity-100')} />
        </div>
        {p.demo && <span className="caps absolute bottom-2 left-2 rounded-sm bg-white/90 px-1.5 py-0.5 text-[8px] text-mute">Demo</span>}
        <div className="absolute left-2 top-2 flex max-w-[75%] flex-wrap gap-1">
          {pct > 0 && <Badge tone="pink">−{pct}%</Badge>}
          {p.wholesale && <Badge tone="dark">Bulk pricing</Badge>}
          {st === 'out' && <Badge tone="line" className="bg-white">Out of stock</Badge>}
          {st === 'low' && <Badge tone="warn">Only {p.stock} left</Badge>}
        </div>
      </Link>

      <button
        onClick={() => toggleWishlist(p.id)}
        aria-pressed={wished}
        aria-label={wished ? `Remove ${p.title} from wishlist` : `Save ${p.title} to wishlist`}
        className={cx('absolute grid size-9 place-items-center rounded-full bg-white/95 opacity-100 shadow-sm lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition transition-transform hover:scale-110', layout === 'list' ? 'right-4 top-4' : 'right-2 top-2')}
      >
        <Heart size={17} className={wished ? 'fill-pink text-ink' : 'text-ink'} />
      </button>

      <div className={cx('min-w-0 flex-1', layout === 'grid' && 'pt-3')}>
        <Link to={`/store/${seller?.handle}`} className="caps flex items-center gap-1.5 truncate text-[9px] text-mute hover:text-ink">
          <span className="truncate">{seller?.name}</span>
          {seller?.verified && <span className="size-1.5 shrink-0 rounded-full bg-pink ring-1 ring-ink" title="Verified seller (demo data)" />}
        </Link>
        <Link to={`/product/${p.id}`} className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug hover:underline">{p.title}</Link>
        <div className="mt-1 flex items-center gap-2"><Stars value={p.rating} count={p.reviewCount} showEmpty={false} />{p.rating == null && <span className="text-xs text-mute">New</span>}</div>
        {attrs.length > 0 && <p className="mt-1 truncate text-xs text-mute">{attrs.slice(0, 3).join(' · ')}</p>}
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="font-display text-lg font-extrabold leading-none tracking-tight">
              {p.wholesale && !p.wholesale.retailAlso && <span className="mr-1 text-[11px] font-semibold text-mute">from</span>}
              {money(p.price)}
            </p>
            {p.compareAt && p.compareAt > p.price && <p className="mt-1 text-xs text-mute line-through">{money(p.compareAt)}</p>}
            {p.wholesale && <p className="mt-1 text-xs text-mute">MOQ {p.wholesale.moq} · from {money(Math.min(...p.wholesale.tiers.map((t) => t.price)))}/unit</p>}
          </div>
          {layout === 'grid' && (
            hasOptions ? (
              <Link to={`/product/${p.id}`} aria-label={`Choose options for ${p.title}`} className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-pink hover:text-ink"><Plus size={18} /></Link>
            ) : (
              <button onClick={quickAdd} disabled={st === 'out'} aria-label={`Add ${p.title} to cart`} className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-pink hover:text-ink disabled:opacity-30"><Plus size={18} /></button>
            )
          )}
        </div>
        {layout === 'list' && <Link to={`/product/${p.id}`} className="mt-3 inline-block text-sm font-semibold link-pink">{hasOptions ? 'Choose options' : 'View'}</Link>}
      </div>
    </article>
  )
}
