import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AlertTriangle, Minus, Plus, ShoppingBag, Store } from 'lucide-react'
import { useExtra, useStore } from '../store/store'
import { applyPromo, groupCart, methodsFor, shippingFee, vatIncluded, type MethodId } from '../lib/pricing'
import { money, selectionLabel } from '../lib/format'
import { Button, Empty, Img, LinkButton, VerifiedBadge } from '../components/ui'

export function useCheckoutState() {
  const { cart, products, sellers } = useStore()
  const [promoCode, setPromoCode] = useExtra<string>('promo', '')
  const [methods, setMethods] = useExtra<Record<string, MethodId>>('methods', {})
  const groups = useMemo(() => groupCart(cart.filter((l) => !l.saved), products, sellers), [cart, products, sellers])
  const rows = groups.map((g) => {
    const method = (methodsFor(g.seller).some((m) => m.id === methods[g.seller.id]) ? methods[g.seller.id] : 'standard') as MethodId
    const fee = shippingFee(g.seller, method, g.subtotal)
    const m = methodsFor(g.seller).find((x) => x.id === method)!
    return { ...g, method, fee, m }
  })
  const subtotal = rows.reduce((a, g) => a + g.subtotal, 0)
  const shipping = rows.reduce((a, g) => a + g.fee, 0)
  const promo = promoCode ? applyPromo(promoCode, subtotal) : null
  const discount = promo?.ok ? promo.amount : 0
  const total = Math.max(0, subtotal - discount + shipping)
  const blocked = rows.some((g) => g.lines.some((l) => l.problem))
  return { rows, subtotal, shipping, discount, total, vat: vatIncluded(total), promo, promoCode, setPromoCode, methods, setMethods, blocked }
}

export function Summary({ s, children }: { s: ReturnType<typeof useCheckoutState>; children?: React.ReactNode }) {
  return (
    <aside className="h-fit rounded-xl bg-fog p-6 lg:sticky lg:top-32">
      <h2 className="text-lg font-extrabold">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><dt>Items</dt><dd>{money(s.subtotal)}</dd></div>
        <div className="flex justify-between"><dt>Delivery ({s.rows.length} seller{s.rows.length !== 1 && 's'})</dt><dd>{s.shipping === 0 ? 'Free' : money(s.shipping)}</dd></div>
        {s.discount > 0 && <div className="flex justify-between text-ok"><dt>Discount ({s.promoCode.toUpperCase()})</dt><dd>−{money(s.discount)}</dd></div>}
        <div className="flex justify-between border-t border-line pt-3 text-lg font-extrabold"><dt>Total</dt><dd>{money(s.total)}</dd></div>
        <p className="text-xs text-mute">Includes VAT of {money(s.vat)} (demo configuration).</p>
      </dl>
      {children}
    </aside>
  )
}

export function PromoBox({ s }: { s: ReturnType<typeof useCheckoutState> }) {
  const [v, setV] = useState(s.promoCode)
  return (
    <div className="mt-5">
      <form onSubmit={(e) => { e.preventDefault(); s.setPromoCode(v.trim()) }} className="flex gap-2">
        <input aria-label="Promo code" value={v} onChange={(e) => setV(e.target.value)} placeholder="Promo code" className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-sm uppercase outline-none focus:border-ink" />
        <Button type="submit" variant="dark" size="md">Apply</Button>
      </form>
      {s.promoCode && s.promo && (s.promo.ok ? <p className="mt-2 text-xs font-semibold text-ok">{s.promo.label} applied · <button className="underline" onClick={() => { s.setPromoCode(''); setV('') }}>remove</button></p> : <p role="alert" className="mt-2 text-xs font-semibold text-bad">{s.promo.error}</p>)}
      <p className="mt-2 text-xs text-mute">Try WELCOME10 or BLENDD100 (demo codes).</p>
    </div>
  )
}

export default function Cart() {
  const { cart, products, sellers, setQty, removeLine, saveForLater, moveToCart } = useStore()
  const s = useCheckoutState()
  const nav = useNavigate()
  const saved = cart.filter((l) => l.saved).map((l) => ({ l, p: products.find((p) => p.id === l.productId) })).filter((x) => x.p)

  if (s.rows.length === 0 && saved.length === 0)
    return <div className="mx-auto max-w-[1440px] px-4 py-10 sm:py-16"><h1 className="sr-only">Cart</h1><Empty icon={<ShoppingBag size={22} />} title="Your cart is empty" body="Find something you love. Items from different sellers can share one checkout." action={<LinkButton to="/shop" variant="dark">Start shopping</LinkButton>} /></div>

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
      <h1 className="text-4xl font-extrabold">Your cart</h1>
      {s.rows.length > 1 && <p className="mt-3 max-w-2xl rounded-lg bg-pink/40 p-3 text-sm">Your cart has items from {s.rows.length} sellers. Each seller ships separately, so delivery cost, dispatch time, returns and tracking can differ per seller.</p>}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {s.rows.map((g) => (
            <section key={g.seller.id} aria-label={`Items from ${g.seller.name}`} className="rounded-xl border border-line">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-fog px-4 py-3">
                <Link to={`/store/${g.seller.handle}`} className="flex items-center gap-2 font-bold hover:underline"><Store size={16} />{g.seller.name}<VerifiedBadge verified={g.seller.verified} status={g.seller.verificationStatus} /></Link>
                <span className="text-xs text-mute">{g.seller.dispatch}</span>
              </header>
              <ul className="divide-y divide-line">
                {g.lines.map((l) => (
                  <li key={l.key} className="flex gap-4 p-4">
                    <Link to={`/product/${l.product.id}`} className="shrink-0"><Img id={l.product.images[0]} w={200} h={250} alt={l.product.title} className="h-28 w-22 rounded-lg" /></Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/product/${l.product.id}`} className="line-clamp-2 font-semibold hover:underline">{l.product.title}</Link>
                      {Object.keys(l.selection).length > 0 && <p className="mt-0.5 text-xs text-mute">{selectionLabel(l.selection)}</p>}
                      {l.problem && <p role="alert" className="mt-1 flex items-center gap-1 text-xs font-semibold text-bad"><AlertTriangle size={13} />{l.problem}</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <div className="flex items-center rounded-full border border-line" role="group" aria-label="Quantity">
                          <button aria-label="Decrease" onClick={() => setQty(l.key, l.qty - 1)} disabled={l.qty <= 1} className="grid size-9 place-items-center disabled:opacity-30"><Minus size={14} /></button>
                          <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{l.qty}</span>
                          <button aria-label="Increase" onClick={() => setQty(l.key, l.qty + 1)} className="grid size-9 place-items-center"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => saveForLater(l.key)} className="text-xs font-semibold underline">Save for later</button>
                        <button onClick={() => removeLine(l.key)} className="text-xs font-semibold text-bad underline">Remove</button>
                      </div>
                    </div>
                    <div className="text-right"><p className="font-bold">{money(l.total)}</p>{l.qty > 1 && <p className="text-xs text-mute">{money(l.unit)} each</p>}</div>
                  </li>
                ))}
              </ul>
              <footer className="space-y-2 border-t border-line p-4 text-sm">
                <label className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">Delivery</span>
                  <select value={g.method} onChange={(e) => s.setMethods({ ...s.methods, [g.seller.id]: e.target.value as MethodId })} className="h-10 rounded-lg border border-line bg-white px-3">
                    {methodsFor(g.seller).map((m) => <option key={m.id} value={m.id}>{m.label} · {shippingFee(g.seller, m.id, g.subtotal) === 0 ? 'Free' : money(shippingFee(g.seller, m.id, g.subtotal))}</option>)}
                  </select></label>
                <p className="text-xs text-mute">Estimated {g.m.days[0]}–{g.m.days[1]} business days after dispatch. {g.m.freeOver && g.method === 'standard' && g.fee > 0 && `Spend ${money(g.m.freeOver - g.subtotal)} more from this seller for free standard delivery.`}</p>
                <p className="flex justify-between font-bold"><span>Seller subtotal</span><span>{money(g.subtotal)}</span></p>
              </footer>
            </section>
          ))}

          {saved.length > 0 && (
            <section aria-label="Saved for later">
              <h2 className="mb-3 text-lg font-extrabold">Saved for later</h2>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {saved.map(({ l, p }) => (
                  <li key={l.key} className="flex items-center gap-4 p-4"><Img id={p!.images[0]} w={120} h={150} alt="" className="h-16 w-12 rounded" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p!.title}</p><p className="text-xs text-mute">{sellers.find((x) => x.id === p!.sellerId)?.name}</p></div>
                    <Button size="sm" variant="outline" onClick={() => moveToCart(l.key)}>Move to cart</Button><button onClick={() => removeLine(l.key)} className="text-xs underline">Remove</button></li>
                ))}
              </ul>
            </section>
          )}
          <LinkButton to="/shop" variant="ghost">← Continue shopping</LinkButton>
        </div>

        {s.rows.length > 0 && (
          <Summary s={s}>
            <PromoBox s={s} />
            {s.blocked && <p role="alert" className="mt-4 text-sm font-semibold text-bad">Fix the highlighted items to continue.</p>}
            <Button size="lg" full className="mt-5" disabled={s.blocked} onClick={() => nav('/checkout')}>Proceed to checkout</Button>
          </Summary>
        )}
      </div>
    </div>
  )
}
