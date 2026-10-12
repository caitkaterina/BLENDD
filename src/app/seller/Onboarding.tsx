import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Check, CircleCheck, FileText } from 'lucide-react'
import { Badge, Button, Field, LinkButton, cx, inputCls, textareaCls } from '../components/ui'
import { CATEGORIES, REGION } from '../lib/config'
import { IMG } from '../lib/data'
import { nowIso, uid } from '../lib/format'
import type { CategoryId, Seller, SellerType } from '../lib/types'
import { useExtra, useStore } from '../store/store'
import { Chip, Notice, selectCls } from './components/kit'
import { SELLER_TYPE_LABEL } from './pages/Settings'
import { hash } from './lib/useSellerData'

interface Draft {
  step: number
  types: SellerType[]
  bizStatus: '' | 'individual' | 'registered'
  regNumber: string
  storeName: string
  handle: string
  handleTouched: boolean
  phone: string
  email: string
  description: string
  province: string
  city: string
  categories: CategoryId[]
  dispatch: string
  couriers: string[]
  collection: boolean
  fee: string
  minDays: string
  maxDays: string
  docId: boolean
  docAddress: boolean
  docBusiness: boolean
  docNames: string[]
  agree: boolean
}
const INITIAL: Draft = { step: 0, types: [], bizStatus: '', regNumber: '', storeName: '', handle: '', handleTouched: false, phone: '', email: '', description: '', province: '', city: '', categories: [], dispatch: '1–2 business days', couriers: [], collection: false, fee: '', minDays: '2', maxDays: '5', docId: false, docAddress: false, docBusiness: false, docNames: [], agree: false }

const TYPE_DESC: Record<SellerType, string> = { reseller: 'You source hair and sell in retail quantities.', retailer: 'You run a retail shop or brand with a steady catalogue.', wholesaler: 'You supply salons and resellers in volume.', manufacturer: 'You make or brand your own products.' }
const STEPS = ['Seller type', 'Business & store', 'Contact & location', 'Categories', 'Fulfilment', 'Verification', 'Payout setup', 'Review & submit']
const COURIERS = ['The Courier Guy', 'Aramex', 'Fastway', 'PostNet', 'Pargo', 'Own delivery']
const COVERS = [IMG.neonWigs, IMG.wigShelves, IMG.warehouse, IMG.bwWindow, IMG.spinHall, IMG.extWall]
const PHONE = /^(0[6-8]\d ?\d{3} ?\d{4}|\+27 ?[6-8]\d ?\d{3} ?\d{4})$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
const tog = <T,>(l: T[], v: T) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v])

export default function Onboarding() {
  const { user, sellers, addSeller, updateUser, notify, toast } = useStore()
  const [stored, setDraft] = useExtra<Draft>('seller-onboarding', INITIAL)
  const d: Draft = { ...INITIAL, ...stored }
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [done, setDone] = useState<{ name: string } | null>(null)
  useEffect(() => { window.scrollTo(0, 0) }, [d.step, done])

  const patch = (p: Partial<Draft>) => { setDraft({ ...d, ...p }); setErrs((e) => { const n = { ...e }; Object.keys(p).forEach((k) => delete n[k]); return n }) }
  const taken = d.handle.length > 0 && sellers.some((s) => s.handle === d.handle)

  const Shell = ({ children }: { children: React.ReactNode }) => <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">{children}</div>

  if (!user)
    return <Shell><div className="rounded-2xl border border-line p-8 text-center"><h1 className="text-3xl font-extrabold">Sign in to apply</h1><p className="mx-auto mt-3 max-w-sm text-sm text-mute">You need a BLENDD account to open a shop. Your application progress is saved in this browser.</p><div className="mt-6 flex justify-center gap-2"><LinkButton to="/signin" state={{ from: '/sell/apply' }} variant="dark">Sign in</LinkButton><LinkButton to="/sell" variant="ghost">Back</LinkButton></div></div></Shell>

  if (done)
    return (
      <Shell>
        <div className="rounded-2xl bg-ink p-8 text-white sm:p-12">
          <CircleCheck className="text-pink" size={40} />
          <h1 className="mt-5 text-4xl font-extrabold">Application received</h1>
          <p className="mt-2 font-semibold text-pink">{done.name}: under review, not yet verified.</p>
          <ul className="mt-6 space-y-3 text-sm text-white/80">
            <li className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0" />The BLENDD team will review your details and documents. Nothing is verified until an admin confirms it.</li>
            <li className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0" />You can open your seller workspace now and draft listings. Published listings are reviewed first.</li>
            <li className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0" />Payouts stay disabled until a payout account is connected and confirmed by the backend.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3"><LinkButton to="/seller" size="lg">Go to seller workspace</LinkButton><LinkButton to="/" variant="onDark" size="lg">Back to shop</LinkButton></div>
        </div>
      </Shell>
    )

  if (user.sellerId && sellers.some((s) => s.id === user.sellerId))
    return <Shell><div className="rounded-2xl border border-line p-8 text-center"><h1 className="text-3xl font-extrabold">You already have a store</h1><p className="mx-auto mt-3 max-w-sm text-sm text-mute">Your account is linked to {sellers.find((s) => s.id === user.sellerId)?.name}. Manage it from the seller workspace.</p><div className="mt-6 flex justify-center"><LinkButton to="/seller" variant="dark">Open seller workspace</LinkButton></div></div></Shell>

  const validate = (step: number) => {
    const e: Record<string, string> = {}
    if (step === 0 && !d.types.length) e.types = 'Choose at least one seller type.'
    if (step === 1) {
      if (!d.bizStatus) e.bizStatus = 'Select how you trade.'
      if (d.bizStatus === 'registered' && d.regNumber.trim().length < 5) e.regNumber = 'Enter your company registration number.'
      if (d.storeName.trim().length < 3) e.storeName = 'Store name must be at least 3 characters.'
      if (!d.handle) e.handle = 'Choose a store handle.'
      else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.handle) || d.handle.length < 3) e.handle = 'Use at least 3 lowercase letters, numbers or single dashes.'
      else if (taken) e.handle = 'That handle is already taken. Try another.'
    }
    if (step === 2) {
      if (!PHONE.test(d.phone.trim())) e.phone = `Enter a valid South African mobile number, e.g. ${REGION.phoneHint}.`
      if (!EMAIL.test(d.email.trim())) e.email = 'Enter a valid email address.'
      if (d.description.trim().length < 30) e.description = 'Describe your business in at least 30 characters.'
      if (!d.province) e.province = 'Select a province.'
      if (d.city.trim().length < 2) e.city = 'Enter your city or town.'
    }
    if (step === 3 && !d.categories.length) e.categories = 'Choose at least one category.'
    if (step === 4) {
      if (!d.dispatch.trim()) e.dispatch = 'Tell buyers how fast you dispatch.'
      if (!d.couriers.length && !d.collection) e.couriers = 'Choose at least one courier or enable collection.'
      const fee = Number(d.fee), mn = Number(d.minDays), mx = Number(d.maxDays)
      if (d.fee.trim() === '' || Number.isNaN(fee) || fee < 0) e.fee = 'Enter a standard delivery fee (R0 or more).'
      if (!Number.isInteger(mn) || mn < 0) e.minDays = 'Whole days.'
      if (!Number.isInteger(mx) || mx < mn) e.maxDays = 'Must be at least the minimum.'
    }
    if (step === 5 && !d.docId) e.docId = 'Confirm you can provide proof of identity for the review.'
    if (step === 7 && !d.agree) e.agree = 'Please confirm to submit.'
    setErrs(e)
    return Object.keys(e).length === 0
  }
  const next = () => { if (validate(d.step)) { patch({ step: d.step + 1 }); toast('Progress saved', 'info') } }
  const back = () => { setErrs({}); patch({ step: Math.max(0, d.step - 1) }) }
  const jump = (s: number) => { setErrs({}); patch({ step: s }) }

  const submit = () => {
    for (let s = 0; s < 7; s++) if (!validate(s)) { jump(s); return toast('Please complete this step first.', 'error') }
    if (!validate(7)) return
    const id = uid('s')
    const seller: Seller = {
      id, handle: d.handle, name: d.storeName.trim(), types: d.types, verified: false, verificationStatus: 'pending', reviewCount: 0, city: d.city.trim(), province: d.province, showLocation: true,
      dispatch: `Dispatches in ${d.dispatch.trim()}`, cover: COVERS[hash(id) % COVERS.length], about: d.description.trim(), joined: nowIso().slice(0, 10),
      returnsPolicy: 'Not set yet. Add your returns policy in Storefront before publishing.', shippingPolicy: d.couriers.length ? `Ships with ${d.couriers.join(', ')}.` : 'Collection only.', acceptsEnquiries: true,
      shipping: { standard: { fee: Number(d.fee), days: [Number(d.minDays), Number(d.maxDays)] }, collect: d.collection }, status: 'applicant',
    }
    addSeller(seller)
    updateUser({ roles: [...new Set([...user.roles, 'seller' as const])], sellerId: id })
    notify({ audience: 'admin', kind: 'seller', title: 'New seller application', body: `${seller.name} applied to sell and is waiting for review.`, href: '/admin/sellers' })
    notify({ audience: 'seller', kind: 'info', title: 'Application received', body: 'Your store is under review and not yet verified. You can draft listings now.', href: '/seller' })
    setDraft(INITIAL)
    setDone({ name: seller.name })
  }

  const pct = ((d.step + 1) / STEPS.length) * 100
  return (
    <Shell>
      <p className="eyebrow text-mute">Seller application</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{STEPS[d.step]}</h1>
      <div className="mt-5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={d.step + 1} aria-label={`Step ${d.step + 1} of ${STEPS.length}`}>
        <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-xs text-mute">Step {d.step + 1} of {STEPS.length}. Progress is saved in this browser so you can resume later.</p>
      </div>

      <div className="mt-8 space-y-5">
        {d.step === 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Seller types">
              {(Object.keys(SELLER_TYPE_LABEL) as SellerType[]).map((t) => {
                const on = d.types.includes(t)
                return <button key={t} type="button" aria-pressed={on} onClick={() => patch({ types: tog(d.types, t) })} className={cx('rounded-2xl border-2 p-5 text-left transition-colors', on ? 'border-ink bg-pink-soft' : 'border-line hover:border-ink')}><span className="flex items-center justify-between font-bold">{SELLER_TYPE_LABEL[t]}{on && <Check size={16} />}</span><span className="mt-1 block text-sm text-mute">{TYPE_DESC[t]}</span></button>
              })}
            </div>
            {errs.types && <p role="alert" className="text-xs font-medium text-bad">{errs.types}</p>}
            <p className="text-xs text-mute">Choose all that apply. Seller types are shown on your storefront only.</p>
          </>
        )}

        {d.step === 1 && (
          <>
            <div>
              <p className="mb-1.5 text-sm font-semibold">How do you trade?</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Business status">
                {([['individual', 'Individual / sole trader'], ['registered', 'Registered business']] as const).map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={d.bizStatus === k} onClick={() => patch({ bizStatus: k })} className={cx('rounded-full border px-4 py-2 text-sm font-semibold', d.bizStatus === k ? 'border-ink bg-pink' : 'border-line hover:border-ink')}>{l}</button>)}
              </div>
              {errs.bizStatus && <p role="alert" className="mt-1 text-xs font-medium text-bad">{errs.bizStatus}</p>}
            </div>
            {d.bizStatus === 'registered' && <Field label="Company registration number" error={errs.regNumber} hint="Reviewed by the BLENDD team. Nothing is verified until an admin confirms it."><input value={d.regNumber} onChange={(e) => patch({ regNumber: e.target.value })} className={inputCls(!!errs.regNumber)} placeholder="2019/123456/07" /></Field>}
            <Field label="Store name" error={errs.storeName}><input value={d.storeName} onChange={(e) => patch({ storeName: e.target.value, ...(d.handleTouched ? {} : { handle: slugify(e.target.value) }) })} className={inputCls(!!errs.storeName)} /></Field>
            <Field label="Store handle" error={errs.handle} hint={`Your store link: /store/${d.handle || 'your-handle'}`}>
              <input value={d.handle} onChange={(e) => patch({ handle: slugify(e.target.value), handleTouched: true })} className={inputCls(!!errs.handle)} />
              {d.handle.length >= 3 && !errs.handle && <span className={cx('mt-1 block text-xs font-semibold', taken ? 'text-bad' : 'text-ok')} role="status">{taken ? 'Already taken' : 'Available'}</span>}
            </Field>
          </>
        )}

        {d.step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile number" error={errs.phone}><input type="tel" value={d.phone} onChange={(e) => patch({ phone: e.target.value })} className={inputCls(!!errs.phone)} placeholder={REGION.phoneHint} /></Field>
            <Field label="Email" error={errs.email}><input type="email" value={d.email} onChange={(e) => patch({ email: e.target.value })} className={inputCls(!!errs.email)} /></Field>
            <Field label="About your business" error={errs.description} className="sm:col-span-2" hint="Shown on your storefront. Only state what you can support."><textarea rows={4} value={d.description} onChange={(e) => patch({ description: e.target.value })} className={textareaCls(!!errs.description)} /></Field>
            <Field label="Province" error={errs.province}><select value={d.province} onChange={(e) => patch({ province: e.target.value })} className={selectCls(!!errs.province)}><option value="">Select</option>{REGION.provinces.map((p) => <option key={p}>{p}</option>)}</select></Field>
            <Field label="City or town" error={errs.city}><input value={d.city} onChange={(e) => patch({ city: e.target.value })} className={inputCls(!!errs.city)} /></Field>
          </div>
        )}

        {d.step === 3 && (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">{CATEGORIES.map((c) => <Chip key={c.id} active={d.categories.includes(c.id)} onClick={() => patch({ categories: tog(d.categories, c.id) })}>{c.label}</Chip>)}</div>
            {errs.categories && <p role="alert" className="text-xs font-medium text-bad">{errs.categories}</p>}
            <p className="text-xs text-mute">This helps us set up your product forms. You can sell in other categories later.</p>
          </>
        )}

        {d.step === 4 && (
          <div className="space-y-4">
            <Field label="Dispatch time" error={errs.dispatch} hint='Shown as "Dispatches in ..." on your store.'><input value={d.dispatch} onChange={(e) => patch({ dispatch: e.target.value })} className={inputCls(!!errs.dispatch)} /></Field>
            <div>
              <p className="mb-1.5 text-sm font-semibold">Couriers you use</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Couriers">{COURIERS.map((c) => <Chip key={c} active={d.couriers.includes(c)} onClick={() => patch({ couriers: tog(d.couriers, c) })}>{c}</Chip>)}</div>
              {errs.couriers && <p role="alert" className="mt-1 text-xs font-medium text-bad">{errs.couriers}</p>}
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={d.collection} onChange={(e) => patch({ collection: e.target.checked })} className="size-4 accent-ink" /> Buyers can collect from me</label>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Standard delivery fee (ZAR)" error={errs.fee}><input inputMode="decimal" value={d.fee} onChange={(e) => patch({ fee: e.target.value })} className={inputCls(!!errs.fee)} /></Field>
              <Field label="Min. delivery days" error={errs.minDays}><input inputMode="numeric" value={d.minDays} onChange={(e) => patch({ minDays: e.target.value })} className={inputCls(!!errs.minDays)} /></Field>
              <Field label="Max. delivery days" error={errs.maxDays}><input inputMode="numeric" value={d.maxDays} onChange={(e) => patch({ maxDays: e.target.value })} className={inputCls(!!errs.maxDays)} /></Field>
            </div>
            <p className="text-xs text-mute">Rates are yours to set, and you can refine them later under Shipping.</p>
          </div>
        )}

        {d.step === 5 && (
          <div className="space-y-4">
            <Notice>Documents are reviewed by the BLENDD team. Nothing is verified until an admin confirms it. Do not type ID numbers here: we only record which documents you can provide.</Notice>
            {([['docId', 'I can provide proof of identity (ID or passport)', true], ['docAddress', 'I can provide proof of business or trading address', false], ['docBusiness', 'I can provide business registration documents', false]] as const).map(([k, l, req]) => (
              <label key={k} className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm font-semibold"><input type="checkbox" checked={d[k]} onChange={(e) => patch({ [k]: e.target.checked })} className="mt-0.5 size-4 accent-ink" />{l}{req ? '' : ' (optional)'}</label>
            ))}
            {errs.docId && <p role="alert" className="text-xs font-medium text-bad">{errs.docId}</p>}
            <div>
              <p className="mb-1.5 text-sm font-semibold">Attach documents (optional)</p>
              <input type="file" multiple accept="image/*,application/pdf" onChange={(e) => patch({ docNames: [...d.docNames, ...[...(e.target.files ?? [])].map((f) => f.name)].slice(0, 6) })} className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
              <p className="mt-1 text-xs text-mute">Only the file names are kept in this demo. Files are not uploaded because no file storage is connected.</p>
              {d.docNames.length > 0 && <ul className="mt-2 space-y-1">{d.docNames.map((n, i) => <li key={n + i} className="flex items-center gap-2 text-sm"><FileText size={14} />{n}<button type="button" onClick={() => patch({ docNames: d.docNames.filter((_, k) => k !== i) })} className="ml-auto text-xs underline">Remove</button></li>)}</ul>}
            </div>
          </div>
        )}

        {d.step === 6 && (
          <div className="rounded-2xl border border-line p-6">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Payout account</h2><Badge tone="warn">Not connected</Badge></div>
            <p className="mt-3 text-sm text-graphite">To receive payouts you will link a payment provider or bank account. That link must be confirmed by the backend before any money can move.</p>
            <ul className="mt-4 space-y-2 text-sm text-graphite"><li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0" />Required before payouts.</li><li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0" />Not required for drafting listings.</li></ul>
            <Button variant="outline" size="sm" className="mt-5" disabled>Connect payout account (unavailable in demo)</Button>
          </div>
        )}

        {d.step === 7 && (
          <div className="space-y-4">
            {([[0, 'Seller type', d.types.map((t) => SELLER_TYPE_LABEL[t]).join(', ')], [1, 'Store', `${d.storeName} (/store/${d.handle}) · ${d.bizStatus === 'registered' ? 'Registered business' : 'Individual'}`], [2, 'Contact', `${d.email} · ${d.phone} · ${d.city}, ${d.province}`], [3, 'Categories', d.categories.map((c) => CATEGORIES.find((x) => x.id === c)?.label).join(', ')], [4, 'Fulfilment', `${d.dispatch} · ${[...d.couriers, d.collection ? 'Collection' : ''].filter(Boolean).join(', ')} · R${d.fee} / ${d.minDays}-${d.maxDays} days`], [5, 'Documents', [d.docId && 'ID', d.docAddress && 'Address', d.docBusiness && 'Business', d.docNames.length && `${d.docNames.length} file name(s)`].filter(Boolean).join(', ') || 'None'], [6, 'Payout', 'Not connected (needed before payouts)']] as [number, string, string][]).map(([s, l, v]) => (
              <div key={l} className="flex items-start justify-between gap-4 border-b border-line pb-3 text-sm"><div className="min-w-0"><p className="text-xs font-semibold text-mute">{l}</p><p className="break-words font-semibold">{v}</p></div><button type="button" onClick={() => jump(s)} className="shrink-0 text-xs font-semibold underline">Edit</button></div>
            ))}
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={d.agree} onChange={(e) => patch({ agree: e.target.checked })} className="mt-0.5 size-4 accent-ink" /><span>I confirm these details are accurate, and I will only make claims about my products (such as origin or processing) that I can support.</span></label>
            {errs.agree && <p role="alert" className="text-xs font-medium text-bad">{errs.agree}</p>}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
        <div className="flex items-center gap-2">{d.step > 0 ? <Button variant="ghost" onClick={back}>Back</Button> : <Link to="/sell" className="text-sm font-semibold underline">Cancel</Link>}</div>
        {d.step < STEPS.length - 1 ? <Button variant="dark" onClick={next}>Save and continue</Button> : <Button onClick={submit}>Submit application</Button>}
      </div>
    </Shell>
  )
}
