import { Plus, Trash2 } from 'lucide-react'
import { Button, Field, Toggle, inputCls } from '../../components/ui'
import type { WholesaleInfo } from '../../lib/types'

export interface WholesaleForm {
  moq: string
  tiers: { min: string; price: string }[]
  leadTime: string
  processing: string
  samples: boolean
  customisation: boolean
  acceptsEnquiries: boolean
  retailAlso: boolean
}

export const emptyWholesale = (): WholesaleForm => ({ moq: '10', tiers: [{ min: '10', price: '' }, { min: '25', price: '' }], leadTime: '3–5 business days', processing: '1–2 business days', samples: false, customisation: false, acceptsEnquiries: true, retailAlso: false })
export const wholesaleToForm = (w: WholesaleInfo): WholesaleForm => ({ ...w, moq: String(w.moq), tiers: w.tiers.map((t) => ({ min: String(t.min), price: String(t.price) })) })

export function validateWholesale(w: WholesaleForm): Record<string, string> {
  const e: Record<string, string> = {}
  const moq = Number(w.moq)
  if (!Number.isInteger(moq) || moq < 1) e.moq = 'Minimum order quantity must be a whole number, 1 or more.'
  if (!w.tiers.length) e.tiers = 'Add at least one price tier.'
  let prevMin = 0
  let prevPrice = Infinity
  w.tiers.forEach((t, i) => {
    const min = Number(t.min), price = Number(t.price)
    if (!Number.isInteger(min) || min < 1) return void (e[`tier${i}`] = 'Quantity must be a whole number, 1 or more.')
    if (!(price > 0)) return void (e[`tier${i}`] = 'Enter a unit price above 0.')
    if (min <= prevMin) e[`tier${i}`] = 'Minimum quantity must be higher than the previous tier.'
    else if (price >= prevPrice) e[`tier${i}`] = 'Unit price must be lower than the previous tier.'
    prevMin = min; prevPrice = price
  })
  if (!w.leadTime.trim()) e.leadTime = 'Add a lead time.'
  if (!w.processing.trim()) e.processing = 'Add a processing time.'
  return e
}

export default function WholesaleBlock({ value, onChange, errors, forced }: { value: WholesaleForm; onChange: (w: WholesaleForm) => void; errors: Record<string, string>; forced: boolean }) {
  const set = <K extends keyof WholesaleForm>(k: K, v: WholesaleForm[K]) => onChange({ ...value, [k]: v })
  const tog = (k: 'samples' | 'customisation' | 'acceptsEnquiries' | 'retailAlso', label: string, hint: string) => (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-line p-3">
      <div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-mute">{hint}</p></div>
      <Toggle checked={value[k]} onChange={(v) => set(k, v)} label={label} />
    </div>
  )
  return (
    <div className="space-y-4">
      {forced && <p className="rounded-lg bg-fog px-3 py-2 text-xs text-graphite">Listings in the Wholesale category always carry a wholesale block.</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Minimum order quantity (MOQ)" error={errors.moq}><input inputMode="numeric" value={value.moq} onChange={(e) => set('moq', e.target.value)} className={inputCls(!!errors.moq)} /></Field>
        <Field label="Lead time" error={errors.leadTime} hint="Time to deliver after dispatch is set by your shipping rates."><input value={value.leadTime} onChange={(e) => set('leadTime', e.target.value)} className={inputCls(!!errors.leadTime)} /></Field>
        <Field label="Processing time" error={errors.processing}><input value={value.processing} onChange={(e) => set('processing', e.target.value)} className={inputCls(!!errors.processing)} /></Field>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold">Volume price tiers (per unit)</p>
        <p className="mb-2 text-xs text-mute">Minimum quantity ascending, unit price descending. Tiers apply at or above the MOQ, so start the first tier at your MOQ.</p>
        <div className="space-y-2">
          {value.tiers.map((t, i) => (
            <div key={i}>
              <div className="flex items-center gap-2">
                <input aria-label={`Tier ${i + 1} minimum quantity`} inputMode="numeric" placeholder="Min qty" value={t.min} onChange={(e) => set('tiers', value.tiers.map((x, k) => (k === i ? { ...x, min: e.target.value } : x)))} className={inputCls(!!errors[`tier${i}`]) + ' max-w-28'} />
                <span className="text-sm text-mute">units at R</span>
                <input aria-label={`Tier ${i + 1} unit price`} inputMode="decimal" placeholder="Unit price" value={t.price} onChange={(e) => set('tiers', value.tiers.map((x, k) => (k === i ? { ...x, price: e.target.value } : x)))} className={inputCls(!!errors[`tier${i}`]) + ' max-w-36'} />
                <button type="button" disabled={value.tiers.length < 2} onClick={() => set('tiers', value.tiers.filter((_, k) => k !== i))} aria-label={`Remove tier ${i + 1}`} className="grid size-9 place-items-center rounded-full text-bad hover:bg-fog disabled:opacity-30"><Trash2 size={15} /></button>
              </div>
              {errors[`tier${i}`] && <p role="alert" className="mt-1 text-xs font-medium text-bad">{errors[`tier${i}`]}</p>}
            </div>
          ))}
        </div>
        {errors.tiers && <p role="alert" className="mt-1 text-xs font-medium text-bad">{errors.tiers}</p>}
        <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => { const l = value.tiers[value.tiers.length - 1]; set('tiers', [...value.tiers, { min: l ? String((Number(l.min) || 0) * 2 || '') : '', price: '' }]) }}><Plus size={14} /> Add tier</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {tog('samples', 'Samples available', 'Buyers can ask for a sample before ordering in bulk.')}
        {tog('customisation', 'Customisation available', 'Private label, custom colours or packaging.')}
        {tog('acceptsEnquiries', 'Accept quote enquiries', 'Show a "request a quote" option on this listing.')}
        {tog('retailAlso', 'Also sell single units at retail price', 'Buyers can order below the MOQ at your retail price.')}
      </div>
    </div>
  )
}
