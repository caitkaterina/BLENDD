import { useState } from 'react'
import { Check, Circle, Clock } from 'lucide-react'
import { Badge, Button, ConfirmDialog, Field, Toggle, VerifiedBadge, inputCls } from '../../components/ui'
import { REGION } from '../../lib/config'
import type { SellerType } from '../../lib/types'
import { useExtra } from '../../store/store'
import { useLoading, useSellerData } from '../lib/useSellerData'
import { Card, Chip, Notice, PageHeader, PageSkeleton, selectCls } from '../components/kit'

export const SELLER_TYPE_LABEL: Record<SellerType, string> = { reseller: 'Independent reseller', retailer: 'Retail vendor', wholesaler: 'Wholesale supplier / distributor', manufacturer: 'Manufacturer / brand' }
const PREFS = [['orders', 'New orders', 'Shown in the bell and Orders badge.'], ['messages', 'Buyer messages', 'Shown in the bell and Messages badge.'], ['stock', 'Low-stock alerts', 'Shown in the bell and on Overview.'], ['reviews', 'New reviews', 'Shown in the bell.'], ['digest', 'Weekly summary', 'A demo preference with no effect.']] as const

export default function Settings() {
  const loading = useLoading()
  const { seller, myProducts, updateSeller, setProductStatus, toast } = useSellerData()
  const [prefs, setPrefs] = useExtra<Record<string, boolean>>('seller-notif-prefs', { orders: true, messages: true, stock: true, reviews: true, digest: false })
  const [closed, setClosed] = useExtra<Record<string, boolean>>('seller-deactivated', {})
  const [city, setCity] = useState(seller?.city ?? '')
  const [province, setProvince] = useState(seller?.province ?? '')
  const [types, setTypes] = useState<SellerType[]>(seller?.types ?? [])
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [dlg, setDlg] = useState(false)
  if (loading || !seller) return <PageSkeleton rows={5} />
  const isClosed = !!closed[seller.id]

  const save = () => {
    const e: Record<string, string> = {}
    if (city.trim().length < 2) e.city = 'Enter your city.'
    if (!REGION.provinces.includes(province)) e.province = 'Select a province.'
    if (!types.length) e.types = 'Choose at least one seller type.'
    setErrs(e)
    if (Object.keys(e).length) return toast('Please fix the highlighted fields.', 'error')
    updateSeller(seller.id, { city: city.trim(), province, types })
    toast('Business profile saved')
  }
  const deactivate = () => {
    myProducts.filter((p) => p.status === 'published' || p.status === 'pending_review').forEach((p) => setProductStatus(p.id, 'draft'))
    setClosed({ ...closed, [seller.id]: true })
    toast('Store deactivated. Listings moved to drafts.', 'info')
  }
  const v = seller.verificationStatus
  const check: [string, 'done' | 'wait' | 'todo', string][] = [
    ['Business details submitted', v === 'not_submitted' ? 'todo' : 'done', 'Name, type, location and contact on your application.'],
    ['Documents reviewed by the BLENDD team', v === 'verified' ? 'done' : v === 'pending' ? 'wait' : 'todo', v === 'verified' ? 'Confirmed by an admin (demo record).' : v === 'pending' ? 'Waiting for an admin. Nothing is verified until they confirm.' : v === 'rejected' ? 'Rejected. Contact support for the reason.' : 'Not submitted yet.'],
    ['Payout account connected', 'todo', 'Needs a payment provider or bank link. Not connected in demo mode.'],
  ]

  return (
    <>
      <PageHeader title="Settings" sub="Your business profile, notifications and account status." />
      <div className="max-w-4xl space-y-5">
        <Card title="Business profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name" hint="Contact support to change your store name."><input disabled value={seller.name} className="h-11 w-full rounded-lg border border-line bg-fog px-3.5 text-sm text-mute" /></Field>
            <Field label="Store handle"><input disabled value={seller.handle} className="h-11 w-full rounded-lg border border-line bg-fog px-3.5 text-sm text-mute" /></Field>
            <Field label="City" error={errs.city}><input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls(!!errs.city)} /></Field>
            <Field label="Province" error={errs.province}><select value={province} onChange={(e) => setProvince(e.target.value)} className={selectCls(!!errs.province)}><option value="">Select</option>{REGION.provinces.map((p) => <option key={p}>{p}</option>)}</select></Field>
          </div>
          <div className="mt-4">
            <p className="mb-1.5 text-sm font-semibold">Seller types</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Seller types">{(Object.keys(SELLER_TYPE_LABEL) as SellerType[]).map((t) => <Chip key={t} active={types.includes(t)} onClick={() => { setTypes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t])); setErrs({ ...errs, types: '' }) }}>{SELLER_TYPE_LABEL[t]}</Chip>)}</div>
            {errs.types && <p role="alert" className="mt-1 text-xs font-medium text-bad">{errs.types}</p>}
            <p className="mt-1 text-xs text-mute">Seller types are shown on your storefront only. They do not change fees or permissions.</p>
          </div>
          <Button className="mt-4" onClick={save}>Save profile</Button>
        </Card>

        <Card title="Notification preferences">
          <Notice>Email and push notifications are not connected. These switches control in-app alerts only (the bell and badges).</Notice>
          <ul className="mt-3 divide-y divide-line">
            {PREFS.map(([k, l, h]) => <li key={k} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold">{l}</p><p className="text-xs text-mute">{h}</p></div><Toggle checked={!!prefs[k]} onChange={(on) => setPrefs({ ...prefs, [k]: on })} label={l} /></li>)}
          </ul>
        </Card>

        <Card title="Verification & payouts" action={<VerifiedBadge verified={seller.verified} status={seller.verificationStatus} />}>
          <ul className="space-y-3">
            {check.map(([l, s, h]) => (
              <li key={l} className="flex items-start gap-3">
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${s === 'done' ? 'bg-ink text-white' : s === 'wait' ? 'bg-pink text-ink' : 'border border-line text-mute'}`}>{s === 'done' ? <Check size={12} /> : s === 'wait' ? <Clock size={12} /> : <Circle size={8} />}</span>
                <div><p className="text-sm font-semibold">{l}</p><p className="text-xs text-mute">{h}</p></div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2 text-sm"><span className="text-mute">Payout account:</span><Badge tone="warn">Not connected</Badge></div>
        </Card>

        <Card title="Danger zone" className="border-bad/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-semibold">{isClosed ? 'Store is deactivated' : 'Deactivate store'}</p><p className="max-w-lg text-xs text-mute">{isClosed ? 'Your listings were moved to drafts. Publish them again from My Products when you are ready.' : 'All published listings move to drafts and buyers can no longer purchase from you. Open orders still need fulfilling.'}</p></div>
            {isClosed ? <Button variant="outline" onClick={() => { setClosed({ ...closed, [seller.id]: false }); toast('Store reactivated. Republish your listings.', 'info') }}>Reactivate</Button> : <Button variant="danger" onClick={() => setDlg(true)}>Deactivate store</Button>}
          </div>
        </Card>
      </div>
      <ConfirmDialog open={dlg} onClose={() => setDlg(false)} danger title="Deactivate your store?" confirmLabel="Deactivate" body="Published and in-review listings will become drafts. You can republish them later." onConfirm={deactivate} />
    </>
  )
}
