import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Check, CheckCircle2, ShoppingBag } from 'lucide-react'
import { useStore } from '../store/store'
import { PAYMENT_METHODS, REGION } from '../lib/config'
import { methodsFor, shippingFee } from '../lib/pricing'
import { fmtDate, money, nowIso, selectionLabel, uid } from '../lib/format'
import type { Address, Order } from '../lib/types'
import { Button, DemoBadge, Empty, Field, Img, LinkButton, inputCls, cx } from '../components/ui'
import { PromoBox, Summary, useCheckoutState } from './Cart'
import NotFound from './NotFound'

const STEPS = ['Account', 'Address', 'Delivery', 'Pay & review']
const blank = (name = '', phone = ''): Address => ({ id: '', label: 'Home', name, phone, street: '', suburb: '', city: '', province: 'Gauteng', postalCode: '', country: REGION.country })

function validate(a: Address) {
  const e: Partial<Record<keyof Address, string>> = {}
  if (a.name.trim().length < 2) e.name = 'Enter the recipient name'
  if (!/^(0|\+27)\d{9}$/.test(a.phone.replace(/[\s-]/g, ''))) e.phone = 'Use a South African number, e.g. 082 123 4567'
  if (a.street.trim().length < 3) e.street = 'Enter the street address'
  if (!a.suburb.trim()) e.suburb = 'Enter the suburb'
  if (!a.city.trim()) e.city = 'Enter the city'
  if (!/^\d{4}$/.test(a.postalCode)) e.postalCode = 'Postal codes have 4 digits'
  return e
}

export function AddressForm({ value, onChange, errors }: { value: Address; onChange: (a: Address) => void; errors: ReturnType<typeof validate> }) {
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value })
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" error={errors.name}><input value={value.name} onChange={set('name')} autoComplete="name" className={inputCls(!!errors.name)} /></Field>
      <Field label="Phone" error={errors.phone}><input value={value.phone} onChange={set('phone')} autoComplete="tel" placeholder={REGION.phoneHint} className={inputCls(!!errors.phone)} /></Field>
      <Field label="Street address" error={errors.street} className="sm:col-span-2"><input value={value.street} onChange={set('street')} autoComplete="address-line1" className={inputCls(!!errors.street)} /></Field>
      <Field label="Suburb" error={errors.suburb}><input value={value.suburb} onChange={set('suburb')} className={inputCls(!!errors.suburb)} /></Field>
      <Field label="City" error={errors.city}><input value={value.city} onChange={set('city')} className={inputCls(!!errors.city)} /></Field>
      <Field label="Province"><select value={value.province} onChange={set('province')} className={inputCls()}>{REGION.provinces.map((p) => <option key={p}>{p}</option>)}</select></Field>
      <Field label="Postal code" error={errors.postalCode}><input value={value.postalCode} onChange={set('postalCode')} inputMode="numeric" maxLength={4} placeholder={REGION.postalHint} className={inputCls(!!errors.postalCode)} /></Field>
      <Field label="Label" hint="e.g. Home, Work"><input value={value.label} onChange={set('label')} className={inputCls()} /></Field>
    </div>
  )
}
export { validate as validateAddress, blank as blankAddress }

export default function Checkout() {
  const { user, addresses, saveAddress, placeOrder, products, toast } = useStore()
  const s = useCheckoutState()
  const nav = useNavigate()
  const [guest, setGuest] = useState(false)
  const [step, setStep] = useState(0)
  const [addrId, setAddrId] = useState<string>('')
  const [form, setForm] = useState<Address>(blank(user?.name, user?.phone))
  const [errs, setErrs] = useState<ReturnType<typeof validate>>({})
  const [saveIt, setSaveIt] = useState(true)
  const [pay, setPay] = useState<(typeof PAYMENT_METHODS)[number]['id']>('card')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [simFail, setSimFail] = useState(false)
  const [address, setAddress] = useState<Address | null>(null)

  const mine = addresses
  useEffect(() => { if (user || guest) setStep((x) => Math.max(x, 1)) }, [user, guest])
  // On phones the summary sits below the form; start each step at the top.
  useEffect(() => { window.scrollTo({ top: 0 }) }, [step])
  useEffect(() => { if (user && mine.length && !addrId) setAddrId(mine[0].id) }, [user, mine, addrId])

  if (s.rows.length === 0) return <div className="mx-auto max-w-3xl px-4 py-16"><Empty icon={<ShoppingBag size={22} />} title="Nothing to check out" body="Your cart is empty." action={<LinkButton to="/shop" variant="dark">Shop hair</LinkButton>} /></div>
  if (s.blocked) return <Navigate to="/cart" replace />

  const useForm = !user || mine.length === 0 || addrId === 'new'
  const goAddress = () => {
    if (useForm) {
      const e = validate(form); setErrs(e)
      if (Object.keys(e).length) {
        // Move focus to the first field with an error once it has rendered.
        requestAnimationFrame(() => (document.querySelector('#main [role=alert]')?.parentElement?.querySelector('input,select,textarea') as HTMLElement | null)?.focus())
        return
      }
      const a = { ...form, id: form.id || uid('a') }
      if (user && saveIt) saveAddress(a)
      setAddress(a)
    } else setAddress(mine.find((a) => a.id === addrId)!)
    setStep(2)
  }

  const confirm = async () => {
    if (!address) return
    setBusy(true); setFailed(false)
    await new Promise((r) => setTimeout(r, 1400))
    // re-validate stock at confirm time
    const bad = s.rows.some((g) => g.lines.some((l) => { const p = products.find((x) => x.id === l.productId); return !p || p.stock < l.qty }))
    if (bad) { setBusy(false); toast('Stock changed. Please review your cart.', 'error'); nav('/cart'); return }
    if (simFail) { setBusy(false); setFailed(true); return }
    const id = uid('o')
    const order: Order = {
      id, ref: `BL-${nowIso().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`, userId: user?.id ?? 'guest', placedAt: nowIso(), address,
      subtotal: s.subtotal, shipping: s.shipping, discount: s.discount, vatIncluded: s.vat, total: s.total, promo: s.discount ? s.promoCode.toUpperCase() : undefined,
      payment: { method: PAYMENT_METHODS.find((m) => m.id === pay)!.label, mode: 'demo', status: 'paid_demo' }, demo: true,
      groups: s.rows.map((g) => ({
        sellerId: g.seller.id, methodLabel: g.m.label, shipping: g.fee, etaLabel: `${g.m.days[0]}–${g.m.days[1]} business days after dispatch`, status: 'paid' as const,
        history: [{ status: 'paid' as const, at: nowIso(), note: 'Demo payment recorded' }],
        lines: g.lines.map((l) => ({ productId: l.productId, title: l.product.title, image: l.product.images[0], qty: l.qty, unit: l.unit, selection: l.selection })),
      })),
    }
    placeOrder(order)
    s.setPromoCode('')
    setBusy(false)
    nav(`/order/confirmation/${id}`, { replace: true })
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8">
      <div className="flex items-center gap-3"><h1 className="text-4xl font-extrabold">Checkout</h1><DemoBadge /></div>
      <ol className="mt-6 flex gap-2 overflow-x-auto" aria-label="Checkout progress">
        {STEPS.map((l, i) => (
          <li key={l} className="flex-1"><button disabled={i > step} onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined} className={cx('w-full border-t-4 pt-2 text-left text-xs font-bold uppercase tracking-wider', i < step ? 'border-ink' : i === step ? 'border-pink' : 'border-line text-mute')}>{i < step && <Check size={12} className="mr-1 inline" />}{i + 1}. {l}</button></li>
        ))}
      </ol>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {step === 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-extrabold">Sign in or continue as guest</h2>
              <p className="text-sm text-mute">Demo mode: sign in with a sample account, or create one.</p>
              <div className="flex flex-wrap gap-3"><LinkButton to="/signin" state={{ from: '/checkout' }} variant="dark">Sign in / create account</LinkButton><Button variant="outline" onClick={() => setGuest(true)}>Continue as guest</Button></div>
              <p className="text-xs text-mute">Guests can place demo orders but won't see them in an account.</p>
            </section>
          )}

          {step === 1 && (
            <section>
              <h2 className="mb-4 text-xl font-extrabold">Delivery address</h2>
              {user && mine.length > 0 && (
                <div className="mb-5 space-y-2">
                  {mine.map((a) => (
                    <label key={a.id} className={cx('flex cursor-pointer gap-3 rounded-xl border p-4 text-sm', addrId === a.id ? 'border-ink' : 'border-line')}>
                      <input type="radio" name="addr" checked={addrId === a.id} onChange={() => setAddrId(a.id)} className="mt-1 accent-ink" />
                      <span><strong>{a.label}</strong> · {a.name}<br />{a.street}, {a.suburb}, {a.city}, {a.province} {a.postalCode}<br />{a.phone}</span>
                    </label>
                  ))}
                  <label className={cx('flex cursor-pointer gap-3 rounded-xl border p-4 text-sm font-semibold', addrId === 'new' ? 'border-ink' : 'border-line')}><input type="radio" name="addr" checked={addrId === 'new'} onChange={() => setAddrId('new')} className="accent-ink" />Use a new address</label>
                </div>
              )}
              {useForm && <>
                <AddressForm value={form} onChange={setForm} errors={errs} />
                {user && <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={saveIt} onChange={(e) => setSaveIt(e.target.checked)} className="accent-ink" />Save this address to my account</label>}
              </>}
              <Button size="lg" className="mt-6" onClick={goAddress}>Continue to delivery</Button>
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 className="mb-1 text-xl font-extrabold">Delivery by seller</h2>
              <p className="mb-5 text-sm text-mute">Each seller ships separately. Choose a method for each.</p>
              <div className="space-y-5">
                {s.rows.map((g) => (
                  <fieldset key={g.seller.id} className="rounded-xl border border-line p-4">
                    <legend className="px-2 text-sm font-bold">{g.seller.name}</legend>
                    <p className="mb-3 text-xs text-mute">{g.seller.dispatch} · {g.lines.length} item{g.lines.length > 1 && 's'}</p>
                    <div className="space-y-2">
                      {methodsFor(g.seller).map((m) => {
                        const fee = shippingFee(g.seller, m.id, g.subtotal)
                        return (
                          <label key={m.id} className={cx('flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm', g.method === m.id ? 'border-ink bg-fog' : 'border-line')}>
                            <span className="flex items-center gap-3"><input type="radio" name={`m-${g.seller.id}`} checked={g.method === m.id} onChange={() => s.setMethods({ ...s.methods, [g.seller.id]: m.id })} className="accent-ink" /><span><strong>{m.label}</strong><br /><span className="text-xs text-mute">{m.days[0]}–{m.days[1]} business days after dispatch</span></span></span>
                            <strong>{fee === 0 ? 'Free' : money(fee)}</strong>
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
              <Button size="lg" className="mt-6" onClick={() => setStep(3)}>Continue to payment</Button>
            </section>
          )}

          {step === 3 && address && (
            <section className="space-y-8">
              <div>
                <h2 className="mb-3 text-xl font-extrabold">Payment method</h2>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m.id} className={cx('flex cursor-pointer gap-3 rounded-xl border p-4 text-sm', pay === m.id ? 'border-ink' : 'border-line')}>
                      <input type="radio" name="pay" checked={pay === m.id} onChange={() => setPay(m.id)} className="mt-1 accent-ink" />
                      <span><strong>{m.label}</strong><br /><span className="text-xs text-mute">{m.note}</span></span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-mute">BLENDD never asks for card numbers in this prototype. A live version would hand payment to a hosted provider.</p>
              </div>
              <div>
                <h2 className="mb-3 text-xl font-extrabold">Review</h2>
                <p className="mb-3 text-sm"><strong>Deliver to:</strong> {address.name}, {address.street}, {address.suburb}, {address.city}, {address.province} {address.postalCode} <button onClick={() => setStep(1)} className="ml-1 underline">Change</button></p>
                {s.rows.map((g) => (
                  <div key={g.seller.id} className="mb-3 rounded-xl border border-line p-4">
                    <p className="text-sm font-bold">{g.seller.name} <span className="font-normal text-mute">· {g.m.label}, {g.m.days[0]}–{g.m.days[1]} days</span></p>
                    <ul className="mt-3 space-y-3">{g.lines.map((l) => <li key={l.key} className="flex items-center gap-3 text-sm"><Img id={l.product.images[0]} w={100} h={125} alt="" className="h-14 w-11 rounded" /><span className="min-w-0 flex-1 truncate">{l.qty} × {l.product.title}{Object.keys(l.selection).length > 0 && <span className="block text-xs text-mute">{selectionLabel(l.selection)}</span>}</span><span className="font-semibold">{money(l.total)}</span></li>)}</ul>
                  </div>
                ))}
              </div>
              {failed && <div role="alert" className="rounded-xl border border-bad bg-bad/5 p-4 text-sm"><p className="font-bold text-bad">Payment failed (simulated)</p><p className="mt-1">No money was taken and your cart is unchanged. Try again or choose another method.</p></div>}
              <label className="flex items-center gap-2 text-xs text-mute"><input type="checkbox" checked={simFail} onChange={(e) => setSimFail(e.target.checked)} className="accent-ink" />Demo: simulate a payment failure</label>
              <Button size="lg" full loading={busy} onClick={confirm}>{busy ? 'Processing demo payment…' : `Confirm order · ${money(s.total)}`}</Button>
            </section>
          )}
        </div>
        <Summary s={s}>{step < 3 && <PromoBox s={s} />}<Link to="/cart" className="mt-4 block text-center text-xs underline">Edit cart</Link></Summary>
      </div>
    </div>
  )
}

export function OrderConfirmation() {
  const { id } = useParams()
  const { orders, sellers, user } = useStore()
  const o = orders.find((x) => x.id === id)
  if (!o) return <NotFound title="Order not found" />
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-pink"><CheckCircle2 size={32} /></span>
        <h1 className="mt-5 text-4xl font-extrabold">Thank you, order placed</h1>
        <p className="mt-2 text-mute">Reference <strong className="text-ink">{o.ref}</strong> · {fmtDate(o.placedAt, true)}</p>
        <p className="mx-auto mt-3 max-w-md rounded-lg bg-fog p-3 text-xs text-mute">This is a demo order. No payment was taken and no goods will be shipped.</p>
      </div>
      <h2 className="mt-10 text-lg font-extrabold">What happens next</h2>
      <ol className="mt-3 space-y-2 text-sm text-graphite">
        <li>1. Each seller is notified and prepares their part of your order.</li>
        <li>2. You get separate tracking per seller once they dispatch.</li>
        <li>3. Returns follow each seller's policy.</li>
      </ol>
      <div className="mt-8 space-y-3">
        {o.groups.map((g) => {
          const sl = sellers.find((x) => x.id === g.sellerId)
          return <div key={g.sellerId} className="rounded-xl border border-line p-4 text-sm"><p className="font-bold">{sl?.name}</p><p className="text-mute">{g.methodLabel} · {g.etaLabel}</p><p className="mt-1">{g.lines.map((l) => `${l.qty} × ${l.title}`).join(', ')}</p></div>
        })}
      </div>
      <p className="mt-6 flex justify-between border-t border-line pt-4 text-lg font-extrabold"><span>Order total (demo, not charged)</span><span>{money(o.total)}</span></p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {user && user.id === o.userId ? <LinkButton to={`/account/orders/${o.id}`} variant="dark">View order</LinkButton> : null}
        <LinkButton to="/shop" variant="outline">Continue shopping</LinkButton>
      </div>
    </div>
  )
}
