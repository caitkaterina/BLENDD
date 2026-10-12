import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Flag, MapPin, MessageCircle, Search, Truck } from 'lucide-react'
import { useStore } from '../store/store'
import { CATEGORIES } from '../lib/config'
import { SORTS, applyFilters, EMPTY_FILTERS, type SortId } from '../lib/filters'
import { searchProducts } from '../lib/search'
import { fmtDate, money } from '../lib/format'
import ProductCard from '../components/ProductCard'
import { Badge, Button, Empty, Field, Img, Modal, Stars, VerifiedBadge, inputCls, textareaCls, cx } from '../components/ui'
import NotFound from './NotFound'

const TYPE_LABEL = { reseller: 'Independent reseller', retailer: 'Retail vendor', wholesaler: 'Wholesale supplier', manufacturer: 'Manufacturer / brand' }

export default function StorePage() {
  const { handle } = useParams()
  const { sellers, products, reviews, followed, toggleFollow, user, startConversation, createEnquiry, toast, setExtra } = useStore()
  const nav = useNavigate()
  const s = sellers.find((x) => x.handle === handle)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState<SortId>('recommended')
  const [modal, setModal] = useState<null | 'msg' | 'quote' | 'report'>(null)
  const [text, setText] = useState('')
  const [qty, setQty] = useState(50)

  const list = useMemo(() => {
    if (!s) return []
    const own = products.filter((p) => p.sellerId === s.id && p.status === 'published')
    const found = q.trim() ? searchProducts(q, own, sellers) : own
    return applyFilters(found, sellers, { ...EMPTY_FILTERS, sort, categories: cat === 'all' ? [] : [cat as never] })
  }, [s, products, sellers, q, sort, cat])

  if (!s || s.status === 'applicant') return <NotFound title="Store not found" body="This storefront doesn't exist or isn't live yet." />
  const own = products.filter((p) => p.sellerId === s.id && p.status === 'published')
  const cats = CATEGORIES.filter((c) => own.some((p) => p.category === c.id))
  const rv = reviews.filter((r) => r.sellerId === s.id && r.moderation === 'published').slice(0, 3)
  const f = followed.includes(s.id)
  const needAuth = () => { nav('/signin', { state: { from: `/store/${s.handle}` } }) }

  return (
    <div>
      <div className="relative h-52 bg-ink sm:h-72"><Img id={s.cover} w={1800} h={600} alt="" eager className="absolute inset-0 opacity-70" /></div>
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-5 sm:-mt-16">
          <div className="flex items-end gap-4">
            <Img id={s.cover} w={240} h={240} alt="" className="size-24 rounded-2xl border-4 border-white sm:size-32" />
            <div className="pb-1">
              <h1 className="flex flex-wrap items-center gap-2 text-3xl font-extrabold">{s.name}<VerifiedBadge verified={s.verified} status={s.verificationStatus} /></h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-mute"><Stars value={s.rating} count={s.reviewCount} />{s.showLocation && <span className="inline-flex items-center gap-1"><MapPin size={13} />{s.city}, {s.province}</span>}<span>Joined {fmtDate(s.joined)}</span></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={f ? 'outline' : 'dark'} onClick={() => toggleFollow(s.id)} aria-pressed={f}>{f ? 'Following' : 'Follow'}</Button>
            <Button variant="outline" onClick={() => (user ? setModal('msg') : needAuth())}><MessageCircle size={15} /> Contact</Button>
            {s.acceptsEnquiries && <Button onClick={() => setModal('quote')}>Wholesale enquiry</Button>}
            <Button variant="ghost" aria-label="Report this seller" onClick={() => setModal('report')}><Flag size={15} /></Button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div><p className="max-w-2xl leading-relaxed text-graphite">{s.about}</p><div className="mt-3 flex flex-wrap gap-2">{s.types.map((t) => <Badge key={t} tone="line">{TYPE_LABEL[t]}</Badge>)}</div></div>
          <div className="rounded-xl bg-fog p-4 text-sm"><p className="flex items-center gap-2 font-bold"><Truck size={15} />{s.dispatch}</p><p className="mt-1 text-mute">Standard {money(s.shipping.standard.fee)} · {s.shipping.standard.days[0]}–{s.shipping.standard.days[1]} days{s.shipping.standard.freeOver ? ` · free over ${money(s.shipping.standard.freeOver)}` : ''}</p>
            <details className="mt-2"><summary className="cursor-pointer font-semibold">Returns policy</summary><p className="mt-1 text-mute">{s.returnsPolicy}</p></details></div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 border-y border-line py-4">
          <form role="search" onSubmit={(e) => e.preventDefault()} className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line px-4 focus-within:border-ink"><Search size={15} className="text-mute" /><input aria-label={`Search ${s.name}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this store" className="min-w-0 flex-1 text-sm outline-none" /></form>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">{[{ id: 'all', label: 'All' }, ...cats].map((c) => <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id} className={cx('shrink-0 rounded-full px-4 py-2 text-xs font-semibold', cat === c.id ? 'bg-ink text-white' : 'bg-fog hover:bg-pink')}>{c.label}</button>)}</div>
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortId)} className="h-10 rounded-full border border-line bg-white px-4 text-[13px] font-semibold">{SORTS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
        </div>

        <div className="py-8">
          {s.status === 'suspended' && <p className="mb-5 rounded-lg bg-warn/10 p-3 text-sm">This store is currently suspended.</p>}
          {list.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 xl:grid-cols-5">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <Empty title={own.length ? 'No products match' : 'No products listed yet'} body={own.length ? 'Try a different search or category.' : 'This seller has not published any listings.'} action={own.length ? <Button variant="dark" onClick={() => { setQ(''); setCat('all') }}>Clear</Button> : undefined} />}
        </div>

        {rv.length > 0 && <section className="pb-16"><h2 className="mb-4 text-2xl font-extrabold">Recent reviews</h2><div className="grid gap-4 md:grid-cols-3">{rv.map((r) => <article key={r.id} className="rounded-xl border border-line p-4"><Stars value={r.rating} /><p className="mt-2 font-bold">{r.title}</p><p className="mt-1 text-sm text-mute">{r.body}</p><p className="mt-2 text-xs text-mute">{r.author}{r.verifiedPurchase && ' · Verified purchase'}</p></article>)}</div></section>}
        <p className="pb-10 text-xs text-mute">Seller: <Link to={`/store/${s.handle}`} className="underline">{s.name}</Link>. Products are sold and shipped by the seller, not BLENDD.</p>
      </div>

      <Modal open={modal === 'msg'} onClose={() => setModal(null)} title={`Message ${s.name}`} footer={<Button variant="dark" full onClick={() => { if (!text.trim()) return; startConversation(s.id, undefined, text.trim(), user!.name); setText(''); setModal(null); toast('Message sent') }}>Send</Button>}>
        <textarea aria-label="Message" rows={5} className={textareaCls()} value={text} onChange={(e) => setText(e.target.value)} />
      </Modal>
      <Modal open={modal === 'quote'} onClose={() => setModal(null)} title="Wholesale enquiry" footer={<Button variant="dark" full onClick={() => { if (!text.trim() || qty < 1) return toast('Add a message and quantity', 'error'); createEnquiry({ sellerId: s.id, buyerName: user?.name ?? 'Guest buyer', email: user?.email ?? 'guest@example.com', qty, message: text.trim() }); setText(''); setModal(null); toast('Enquiry sent. The seller will reply with a quote.') }}>Send enquiry</Button>}>
        <div className="space-y-4"><Field label="Estimated quantity"><input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className={inputCls()} /></Field><Field label="What do you need?"><textarea rows={4} className={textareaCls()} value={text} onChange={(e) => setText(e.target.value)} /></Field></div>
      </Modal>
      <Modal open={modal === 'report'} onClose={() => setModal(null)} title="Report this seller" footer={<Button variant="dark" full onClick={() => { if (!text.trim()) return; setExtra(`report-${s.id}-${Date.now()}`, text); setText(''); setModal(null); toast('Report recorded for admin review (demo)') }}>Submit report</Button>}>
        <textarea aria-label="Reason" rows={4} className={textareaCls()} value={text} onChange={(e) => setText(e.target.value)} placeholder="What went wrong?" />
      </Modal>
    </div>
  )
}
