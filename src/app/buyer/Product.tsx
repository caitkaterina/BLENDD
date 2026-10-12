import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronRight, Heart, MessageCircle, Minus, Plus, Truck, ZoomIn } from 'lucide-react'
import { useStore } from '../store/store'
import { QUESTIONS } from '../lib/data'
import { discountPct, methodsFor, minQty, selectionDelta, stockState, tierFor, unitPrice } from '../lib/pricing'
import { fmtDate, money } from '../lib/format'
import ProductCard from '../components/ProductCard'
import { Badge, Button, DemoBadge, Field, Img, LinkButton, Modal, SectionHead, Stars, Tabs, VerifiedBadge, inputCls, textareaCls, cx } from '../components/ui'
import NotFound from './NotFound'

export default function ProductPage() {
  const { id } = useParams()
  const { products, sellers, reviews, wishlist, toggleWishlist, addToCart, pushRecent, recent, user, startConversation, addReview, toast } = useStore()
  const nav = useNavigate()
  const p = products.find((x) => x.id === id)
  const seller = sellers.find((s) => s.id === p?.sellerId)
  const [sel, setSel] = useState<Record<string, string>>({})
  const [qty, setQty] = useState(1)
  const [img, setImg] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [tab, setTab] = useState<'reviews' | 'qa'>('reviews')
  const [ask, setAsk] = useState(false)
  const [msg, setMsg] = useState('')
  const [rev, setRev] = useState({ rating: 5, title: '', body: '' })
  const [err, setErr] = useState('')
  // Mobile sticky buy bar: shown only while the main purchase buttons are off-screen.
  const [ctaEl, setCtaEl] = useState<HTMLDivElement | null>(null)
  const [ctaHidden, setCtaHidden] = useState(false)
  useEffect(() => {
    if (!ctaEl) return
    // Top margin accounts for the sticky header covering the buttons.
    const io = new IntersectionObserver(([e]) => setCtaHidden(!e.isIntersecting && e.boundingClientRect.top < 80), { rootMargin: '-64px 0px 0px 0px' })
    io.observe(ctaEl)
    return () => io.disconnect()
  }, [ctaEl])

  useEffect(() => {
    if (!p) return
    setSel(Object.fromEntries(p.options.map((o) => [o.key, o.values[0].value])))
    setQty(minQty(p)); setImg(0); setErr('')
    pushRecent(p.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id])

  const pReviews = useMemo(() => reviews.filter((r) => r.productId === id && r.moderation === 'published'), [reviews, id])
  if (!p || !seller || (p.status !== 'published' && user?.sellerId !== p.sellerId && !user?.roles.includes('admin'))) return <NotFound title="Product not found" body="This listing may have been removed or unpublished." />

  const st = stockState(p)
  const unit = unitPrice(p, sel, qty)
  const base = p.price + selectionDelta(p, sel)
  const tier = p.wholesale ? tierFor(p, qty) : undefined
  const pct = discountPct(p)
  const wished = wishlist.includes(p.id)
  const mOpts = methodsFor(seller)
  const related = products.filter((x) => x.id !== p.id && x.status === 'published' && x.category === p.category).slice(0, 4)
  const more = products.filter((x) => x.id !== p.id && x.status === 'published' && x.sellerId === p.sellerId).slice(0, 4)
  const recents = recent.filter((r) => r !== p.id).map((r) => products.find((x) => x.id === r)).filter((x) => x && x.status === 'published').slice(0, 4) as typeof products
  const qa = QUESTIONS.filter((q) => q.productId === p.id)
  const mine = user?.id && p.id ? true : false

  const add = (buy?: boolean) => {
    const r = addToCart(p.id, sel, qty)
    if (!r.ok) { setErr(r.message ?? 'Could not add this item.'); return }
    setErr('')
    if (buy) nav('/checkout')
  }

  const specs = Object.entries(p.specs)

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-mute">
        <Link to="/" className="hover:text-ink">Home</Link><ChevronRight size={12} />
        <Link to={`/shop/${p.category}`} className="hover:text-ink">{p.category}</Link><ChevronRight size={12} />
        <span className="max-w-[50vw] truncate font-semibold text-ink">{p.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 [&>*]:min-w-0">
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <div className="no-scrollbar flex gap-2 overflow-x-auto sm:max-h-[640px] sm:flex-col sm:overflow-y-auto">
            {p.images.map((im, i) => (
              <button key={im + i} onClick={() => setImg(i)} aria-label={`Show image ${i + 1}`} aria-current={img === i} className={cx('size-16 shrink-0 overflow-hidden rounded-lg ring-2 sm:size-20', img === i ? 'ring-ink' : 'ring-transparent')}>
                <Img id={im} w={160} h={200} alt="" className="size-full" />
              </button>
            ))}
          </div>
          <button onClick={() => setZoom(true)} aria-label="Zoom image" className="group relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden rounded-xl">
            <Img id={p.images[img]} w={1000} h={1250} alt={p.title} eager className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-white shadow"><ZoomIn size={17} /></span>
            {pct > 0 && <span className="absolute left-3 top-3"><Badge tone="pink">−{pct}%</Badge></span>}
          </button>
        </div>

        <div>
          <Link to={`/store/${seller.handle}`} className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold hover:underline">Sold by {seller.name}<VerifiedBadge verified={seller.verified} status={seller.verificationStatus} /></Link>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">{p.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Stars value={p.rating} count={p.reviewCount} size={15} />
            {p.rating == null && <span className="text-sm text-mute">No reviews yet</span>}
            {p.demo && <DemoBadge />}
          </div>

          <div className="mt-5 flex items-end gap-3">
            <p className="text-4xl font-extrabold">{money(unit)}</p>
            {p.compareAt && p.compareAt > p.price && <p className="pb-1 text-mute line-through">{money(p.compareAt)}</p>}
            {p.wholesale && <p className="pb-1 text-sm text-mute">per unit{tier ? ' at this quantity' : ''}</p>}
          </div>
          <p className="mt-1 text-xs text-mute">Price includes VAT (demo configuration). Delivery is calculated per seller at checkout.</p>

          {p.wholesale && (
            <div className="mt-6 rounded-xl border border-line p-4">
              <p className="text-sm font-bold">Bulk pricing · MOQ {p.wholesale.moq}</p>
              <table className="mt-3 w-full text-sm">
                <thead><tr className="text-left text-xs text-mute"><th className="pb-1 font-medium">Quantity</th><th className="pb-1 font-medium">Price / unit</th></tr></thead>
                <tbody>
                  {p.wholesale.tiers.map((t, i, a) => {
                    const on = tier?.min === t.min && qty >= p.wholesale!.moq
                    return <tr key={t.min} className={cx('border-t border-line', on && 'bg-pink/40 font-bold')}><td className="py-1.5 pl-2">{t.min}{a[i + 1] ? `–${a[i + 1].min - 1}` : '+'}</td><td>{money(t.price)}</td></tr>
                  })}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-mute">Lead time: {p.wholesale.leadTime} · Processing: {p.wholesale.processing}{p.wholesale.samples && ' · Samples available'}{p.wholesale.customisation && ' · Customisation on request'}</p>
              {p.wholesale.retailAlso && <p className="mt-1 text-xs text-mute">Below the MOQ the retail price of {money(base)} applies.</p>}
            </div>
          )}

          {p.options.map((o) => (
            <fieldset key={o.key} className="mt-6">
              <legend className="mb-2 text-sm font-bold">{o.label}: <span className="font-normal text-mute">{sel[o.key]}</span></legend>
              <div className="flex flex-wrap gap-2">
                {o.values.map((v) => (
                  <button key={v.value} onClick={() => setSel({ ...sel, [o.key]: v.value })} aria-pressed={sel[o.key] === v.value} className={cx('rounded-full border px-4 py-2 text-sm font-semibold transition-colors', sel[o.key] === v.value ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink')}>
                    {v.value}{v.priceDelta ? <span className="ml-1 text-xs opacity-70">{v.priceDelta > 0 ? '+' : '−'}{money(Math.abs(v.priceDelta))}</span> : null}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-line" role="group" aria-label="Quantity">
              <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(minQty(p), qty - 1))} className="grid size-11 place-items-center"><Minus size={16} /></button>
              <input aria-label="Quantity" inputMode="numeric" value={qty} onChange={(e) => setQty(Math.max(1, Math.min(p.stock || 1, Number(e.target.value.replace(/\D/g, '')) || 1)))} className="w-12 bg-transparent text-center font-semibold outline-none" />
              <button aria-label="Increase quantity" onClick={() => setQty(Math.min(p.stock, qty + 1))} className="grid size-11 place-items-center"><Plus size={16} /></button>
            </div>
            <p className={cx('text-sm font-semibold', st === 'out' ? 'text-bad' : st === 'low' ? 'text-warn' : 'text-ok')}>{st === 'out' ? 'Out of stock' : st === 'low' ? `Only ${p.stock} left` : `In stock (${p.stock})`}</p>
          </div>
          {p.wholesale && <p className="mt-3 text-sm">Total for {qty}: <strong>{money(unit * qty)}</strong>{qty < minQty(p) && <span className="ml-2 text-bad">Minimum order is {minQty(p)}</span>}</p>}
          {err && <p role="alert" className="mt-3 text-sm font-semibold text-bad">{err}</p>}

          <div ref={setCtaEl} className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 sm:gap-3">
            <Button size="lg" variant="dark" disabled={st === 'out'} onClick={() => add()} className="min-w-0">Add to cart</Button>
            <Button size="lg" disabled={st === 'out'} onClick={() => add(true)} className="min-w-0">Buy now</Button>
            <button onClick={() => toggleWishlist(p.id)} aria-pressed={wished} aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'} className="grid size-[3.25rem] shrink-0 place-items-center rounded-full border border-line hover:border-ink"><Heart size={19} className={wished ? 'fill-pink' : ''} /></button>
          </div>
          {p.wholesale?.acceptsEnquiries && <LinkButton to={`/wholesale?product=${p.id}`} variant="outline" full className="mt-3">Request a quote</LinkButton>}

          <div className="mt-8 divide-y divide-line rounded-xl border border-line text-sm">
            <div className="flex gap-3 p-4"><Truck size={18} className="mt-0.5 shrink-0" /><div><p className="font-bold">{seller.dispatch}</p>
              <ul className="mt-1 text-mute">{mOpts.map((m) => <li key={m.id}>{m.label}: {m.fee === 0 ? 'Free' : money(m.fee)}, {m.days[0]}–{m.days[1]} business days{m.freeOver ? ` (free over ${money(m.freeOver)})` : ''}</li>)}</ul></div></div>
            <details className="p-4"><summary className="cursor-pointer font-bold">Returns policy</summary><p className="mt-2 text-mute">{seller.returnsPolicy}</p></details>
            <details className="p-4"><summary className="cursor-pointer font-bold">Seller shipping policy</summary><p className="mt-2 text-mute">{seller.shippingPolicy}</p></details>
            <div className="flex items-center justify-between gap-3 p-4"><p className="text-mute">This item is sold and fulfilled by {seller.name}, not by BLENDD.</p>
              <Button variant="outline" size="sm" onClick={() => setAsk(true)}><MessageCircle size={14} /> Message</Button></div>
          </div>
        </div>
      </div>

      <div aria-hidden={!ctaHidden} className={cx('on-dark fixed inset-x-0 bottom-[calc(var(--bottom-nav)+env(safe-area-inset-bottom))] z-30 border-t border-white/10 bg-ink/95 px-4 py-2.5 text-white backdrop-blur transition-transform duration-200 lg:hidden', ctaHidden ? 'translate-y-0' : 'pointer-events-none translate-y-[calc(100%+var(--bottom-nav)+env(safe-area-inset-bottom))]')}>
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1"><p className="truncate text-xs text-white/60">{p.title}</p><p className="font-display text-lg font-extrabold leading-tight">{money(unit)}{qty > 1 && <span className="ml-1 text-xs font-medium text-white/60">× {qty}</span>}</p></div>
          <Button size="md" disabled={st === 'out'} tabIndex={ctaHidden ? 0 : -1} onClick={() => add()} className="shrink-0">{st === 'out' ? 'Out of stock' : 'Add to cart'}</Button>
        </div>
      </div>

      <section className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <h2 className="text-2xl font-extrabold">Description</h2>
          <p className="mt-3 leading-relaxed text-graphite">{p.description}</p>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold">Specifications</h2>
          <dl className="mt-3 divide-y divide-line text-sm">
            {[...(p.hairType ? [['Hair type', p.hairType]] : []), ...(p.texture ? [['Texture', p.texture]] : []), ...(p.construction ? [['Construction', p.construction]] : []), ...(p.lace ? [['Lace', p.lace]] : []), ...(p.density ? [['Density', p.density]] : []), ...(p.origin ? [['Origin (as stated by seller)', p.origin]] : []), ...(p.processing ? [['Processing', p.processing]] : []), ...specs, ['SKU', p.sku]].filter(([k], i, all) => all.findIndex(([x]) => String(x).toLowerCase() === String(k).toLowerCase()) === i).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-mute">{k}</dt><dd className="text-right font-semibold capitalize">{v}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-16">
        <Tabs value={tab} onChange={setTab} items={[{ id: 'reviews', label: 'Reviews', count: pReviews.length }, { id: 'qa', label: 'Questions & answers', count: qa.length }]} />
        {tab === 'reviews' ? (
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              {pReviews.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-sm text-mute">No reviews for this product yet.</p>}
              {pReviews.map((r) => (
                <article key={r.id} className="border-b border-line pb-6">
                  <div className="flex items-center gap-3"><Stars value={r.rating} /><span className="text-sm font-bold">{r.title}</span></div>
                  <p className="mt-2 text-sm text-graphite">{r.body}</p>
                  {r.images && <div className="mt-3 flex gap-2">{r.images.map((im) => <Img key={im} id={im} w={160} h={160} alt="Buyer photo" className="size-20 rounded-lg" />)}</div>}
                  <p className="mt-2 text-xs text-mute">{r.author} · {fmtDate(r.date)}{r.verifiedPurchase && ' · Verified purchase'}</p>
                  {r.sellerResponse && <div className="mt-3 rounded-lg bg-fog p-3 text-sm"><p className="text-xs font-bold">Response from {seller.name}</p>{r.sellerResponse}</div>}
                </article>
              ))}
            </div>
            <form className="h-fit space-y-3 rounded-xl border border-line p-5" onSubmit={(e) => {
              e.preventDefault()
              if (!user) { nav('/signin', { state: { from: `/product/${p.id}` } }); return }
              if (!rev.title.trim() || rev.body.trim().length < 10) { toast('Add a title and at least 10 characters', 'error'); return }
              const bought = mine
              addReview({ productId: p.id, sellerId: p.sellerId, author: user.name, rating: rev.rating, title: rev.title, body: rev.body, verifiedPurchase: bought && false })
              setRev({ rating: 5, title: '', body: '' })
            }}>
              <h3 className="font-bold">Write a review</h3>
              <Field label="Rating"><select value={rev.rating} onChange={(e) => setRev({ ...rev, rating: Number(e.target.value) })} className={inputCls()}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 && 's'}</option>)}</select></Field>
              <Field label="Title"><input value={rev.title} onChange={(e) => setRev({ ...rev, title: e.target.value })} className={inputCls()} /></Field>
              <Field label="Your review"><textarea rows={4} value={rev.body} onChange={(e) => setRev({ ...rev, body: e.target.value })} className={textareaCls()} /></Field>
              <Button type="submit" variant="dark" full>{user ? 'Submit for moderation' : 'Sign in to review'}</Button>
              <p className="text-xs text-mute">Reviews are moderated before they appear.</p>
            </form>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {qa.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-sm text-mute">No questions yet. Message the seller to ask one.</p>}
            {qa.map((q) => <div key={q.q} className="rounded-xl bg-fog p-4"><p className="font-bold">Q: {q.q}</p><p className="mt-1 text-sm">A: {q.a} <span className="text-mute">— {q.by}</span></p></div>)}
            <Button variant="outline" onClick={() => setAsk(true)}>Ask the seller a question</Button>
          </div>
        )}
      </section>

      {more.length > 0 && <section className="mt-20"><SectionHead title={`More from ${seller.name}`} action={<Link to={`/store/${seller.handle}`} className="text-sm font-semibold link-pink">Visit store</Link>} /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{more.map((x) => <ProductCard key={x.id} p={x} />)}</div></section>}
      {related.length > 0 && <section className="mt-20"><SectionHead title="You may also like" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{related.map((x) => <ProductCard key={x.id} p={x} />)}</div></section>}
      {recents.length > 0 && <section className="mt-20"><SectionHead title="Recently viewed" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{recents.map((x) => <ProductCard key={x.id} p={x} />)}</div></section>}

      <Modal open={zoom} onClose={() => setZoom(false)} title={p.title} wide>
        <Img id={p.images[img]} w={1600} alt={p.title} className="aspect-[4/5] w-full rounded-lg" />
      </Modal>
      <Modal open={ask} onClose={() => setAsk(false)} title={`Message ${seller.name}`} footer={<Button variant="dark" full onClick={() => {
        if (!user) { nav('/signin', { state: { from: `/product/${p.id}` } }); return }
        if (!msg.trim()) return
        startConversation(seller.id, p.id, msg.trim(), user.name); setMsg(''); setAsk(false); toast('Message sent. Find it under Account → Messages.')
      }}>{user ? 'Send message' : 'Sign in to send'}</Button>}>
        <p className="mb-3 text-sm text-mute">About: {p.title}</p>
        <textarea aria-label="Message" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} className={textareaCls()} placeholder="Ask about length, colour, delivery…" />
      </Modal>
    </div>
  )
}
