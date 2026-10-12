import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useStore } from '../store/store'
import { money } from '../lib/format'
import { Button, Field, Img, LinkButton, SectionHead, VerifiedBadge, inputCls, textareaCls } from '../components/ui'
import { IMG } from '../lib/data'

export default function Wholesale() {
  const { products, sellers, createEnquiry, user, toast } = useStore()
  const [sp] = useSearchParams()
  const items = useMemo(() => products.filter((p) => p.wholesale && p.status === 'published'), [products])
  const suppliers = sellers.filter((s) => s.status === 'active' && items.some((p) => p.sellerId === s.id))
  const pre = items.find((p) => p.id === sp.get('product'))
  const [f, setF] = useState({ sellerId: pre?.sellerId ?? suppliers[0]?.id ?? '', productId: pre?.id ?? '', name: user?.name ?? '', email: user?.email ?? '', qty: pre?.wholesale?.moq ?? 50, message: '' })
  const [e, setE] = useState<Record<string, string>>({})
  const [sent, setSent] = useState(false)
  const opts = items.filter((p) => p.sellerId === f.sellerId)

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <Img id={IMG.warehouse} w={1600} h={700} alt="" eager className="absolute inset-0 -z-10 opacity-40" />
        <div className="mx-auto max-w-[1440px] px-4 py-20 lg:px-8 lg:py-28">
          <p className="eyebrow mb-4 text-pink">Wholesale</p>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight lg:text-6xl">Bulk hair, priced by the unit.</h1>
          <p className="mt-5 max-w-xl text-white/75">Salons, stylists and resellers can buy at tiered prices from suppliers who set their own MOQs, lead times and sample policies.</p>
          <div className="mt-8 flex gap-3"><a href="#catalogue" className="inline-flex h-12 items-center rounded-full bg-pink px-7 text-sm font-semibold text-ink">See bulk listings</a><a href="#quote" className="inline-flex h-12 items-center rounded-full border border-white/40 px-7 text-sm font-semibold">Request a quote</a></div>
        </div>
      </section>
      <div className="mx-auto max-w-[1440px] space-y-20 px-4 py-16 lg:px-8">
        <section aria-label="How it works" className="grid gap-6 md:grid-cols-3">
          {[['Browse bulk listings', 'Each shows its MOQ and price per tier.'], ['Buy or request a quote', 'Order at listed tiers, or ask for custom volumes and samples.'], ['Supplier fulfils', 'Delivery, lead time and returns follow the supplier\'s terms.']].map(([t, b], i) => <div key={t} className="rounded-xl bg-fog p-6"><p className="text-4xl font-extrabold text-ink/20">0{i + 1}</p><p className="mt-2 font-bold">{t}</p><p className="mt-1 text-sm text-mute">{b}</p></div>)}
        </section>

        <section id="catalogue">
          <SectionHead eyebrow="Catalogue" title="Bulk listings" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => {
              const sl = sellers.find((s) => s.id === p.sellerId)!
              return (
                <Link key={p.id} to={`/product/${p.id}`} className="group flex gap-4 rounded-xl border border-line p-3 transition hover:border-ink">
                  <Img id={p.images[0]} w={240} h={300} alt={p.title} className="h-32 w-26 shrink-0 rounded-lg" />
                  <div className="min-w-0"><p className="line-clamp-2 font-semibold">{p.title}</p><p className="mt-0.5 flex items-center gap-1.5 text-xs text-mute">{sl.name}<VerifiedBadge verified={sl.verified} status={sl.verificationStatus} /></p>
                    <p className="mt-2 text-sm">MOQ <strong>{p.wholesale!.moq}</strong> · lead {p.wholesale!.leadTime}</p>
                    <ul className="mt-1 text-xs text-mute">{p.wholesale!.tiers.map((t) => <li key={t.min}>{t.min}+ units: {money(t.price)}</li>)}</ul></div>
                </Link>
              )
            })}
          </div>
          {items.length === 0 && <p className="text-sm text-mute">No bulk listings right now.</p>}
        </section>

        <section id="quote" className="grid gap-10 rounded-2xl bg-fog p-6 lg:grid-cols-[1fr_1.2fr] lg:p-12">
          <div><p className="eyebrow mb-3 text-mute">Quote</p><h2 className="text-4xl font-extrabold">Request a quote</h2><p className="mt-3 text-mute">Tell the supplier what you need. They reply from their dashboard; nothing is committed until you agree on terms.</p></div>
          {sent ? (
            <div className="rounded-xl bg-white p-8 text-center"><p className="text-xl font-extrabold">Enquiry sent</p><p className="mt-2 text-sm text-mute">The supplier will respond with a quote. This is demo data stored in your browser.</p><LinkButton to="/" variant="dark" className="mt-5">Back home</LinkButton></div>
          ) : (
            <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={(ev) => {
              ev.preventDefault()
              const er: Record<string, string> = {}
              if (f.name.trim().length < 2) er.name = 'Enter your name'
              if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email'
              const moq = products.find((p) => p.id === f.productId)?.wholesale?.moq ?? 1
              if (!(f.qty >= 1)) er.qty = 'Enter a quantity'
              else if (f.qty < moq) er.qty = `This product has a minimum order of ${moq} units`
              if (f.message.trim().length < 10) er.message = 'Tell us a bit more (10+ characters)'
              setE(er)
              if (Object.keys(er).length) return
              createEnquiry({ sellerId: f.sellerId, productId: f.productId || undefined, buyerName: f.name.trim(), email: f.email.trim(), qty: f.qty, message: f.message.trim() })
              setSent(true); toast('Enquiry sent')
            }}>
              <Field label="Supplier"><select value={f.sellerId} onChange={(x) => setF({ ...f, sellerId: x.target.value, productId: '' })} className={inputCls()}>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              <Field label="Product (optional)"><select value={f.productId} onChange={(x) => setF({ ...f, productId: x.target.value })} className={inputCls()}><option value="">General enquiry</option>{opts.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>
              <Field label="Your name" error={e.name}><input value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} className={inputCls(!!e.name)} /></Field>
              <Field label="Email" error={e.email}><input type="email" value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} className={inputCls(!!e.email)} /></Field>
              <Field label="Quantity" error={e.qty}><input type="number" min={1} value={f.qty} onChange={(x) => setF({ ...f, qty: Number(x.target.value) })} className={inputCls(!!e.qty)} /></Field>
              <div className="hidden sm:block" />
              <Field label="Details" error={e.message} className="sm:col-span-2"><textarea rows={4} value={f.message} onChange={(x) => setF({ ...f, message: x.target.value })} className={textareaCls(!!e.message)} placeholder="Lengths, textures, colours, timing…" /></Field>
              <Button type="submit" variant="dark" size="lg" className="sm:col-span-2">Send enquiry</Button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
