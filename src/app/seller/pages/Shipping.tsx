import { useState } from 'react'
import { Button, Field, Toggle, inputCls } from '../../components/ui'
import { money } from '../../lib/format'
import { useLoading, useSellerData } from '../lib/useSellerData'
import { Card, Notice, PageHeader, PageSkeleton } from '../components/kit'

interface Rate { fee: string; min: string; max: string; freeOver: string }
const toRate = (r?: { fee: number; days: [number, number]; freeOver?: number }): Rate => ({ fee: r ? String(r.fee) : '', min: r ? String(r.days[0]) : '', max: r ? String(r.days[1]) : '', freeOver: r?.freeOver ? String(r.freeOver) : '' })

export default function Shipping() {
  const loading = useLoading()
  const { seller, updateSeller, toast } = useSellerData()
  const [std, setStd] = useState<Rate>(() => toRate(seller?.shipping.standard))
  const [exp, setExp] = useState<Rate>(() => toRate(seller?.shipping.express))
  const [expOn, setExpOn] = useState(!!seller?.shipping.express)
  const [collect, setCollect] = useState(!!seller?.shipping.collect)
  const [errs, setErrs] = useState<Record<string, string>>({})
  if (loading || !seller) return <PageSkeleton rows={4} />

  const check = (r: Rate, p: string, e: Record<string, string>, allowFree: boolean) => {
    const fee = Number(r.fee), min = Number(r.min), max = Number(r.max)
    if (r.fee.trim() === '' || Number.isNaN(fee) || fee < 0) e[`${p}fee`] = 'Enter a fee of R0 or more.'
    if (r.min.trim() === '' || !Number.isInteger(min) || min < 0) e[`${p}min`] = 'Whole days, 0 or more.'
    if (r.max.trim() === '' || !Number.isInteger(max) || max < 0) e[`${p}max`] = 'Whole days, 0 or more.'
    else if (!e[`${p}min`] && min > max) e[`${p}max`] = 'Maximum days must be at least the minimum.'
    if (allowFree && r.freeOver.trim() !== '' && (Number.isNaN(Number(r.freeOver)) || Number(r.freeOver) < 0)) e[`${p}free`] = 'Enter an amount of R0 or more, or leave blank.'
  }
  const save = () => {
    const e: Record<string, string> = {}
    check(std, 's', e, true)
    if (expOn) check(exp, 'x', e, false)
    setErrs(e)
    if (Object.keys(e).length) return toast('Please fix the highlighted fields.', 'error')
    updateSeller(seller.id, {
      shipping: {
        standard: { fee: Number(std.fee), days: [Number(std.min), Number(std.max)], ...(std.freeOver.trim() && Number(std.freeOver) > 0 ? { freeOver: Number(std.freeOver) } : {}) },
        ...(expOn ? { express: { fee: Number(exp.fee), days: [Number(exp.min), Number(exp.max)] as [number, number] } } : {}),
        collect,
      },
    })
    toast('Shipping settings saved. Buyers see the new rates at checkout.')
  }

  const rate = (r: Rate, set: (r: Rate) => void, p: string, free: boolean) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Fee (ZAR)" error={errs[`${p}fee`]}><input inputMode="decimal" value={r.fee} onChange={(e) => set({ ...r, fee: e.target.value })} className={inputCls(!!errs[`${p}fee`])} /></Field>
      <Field label="Min. days" error={errs[`${p}min`]}><input inputMode="numeric" value={r.min} onChange={(e) => set({ ...r, min: e.target.value })} className={inputCls(!!errs[`${p}min`])} /></Field>
      <Field label="Max. days" error={errs[`${p}max`]}><input inputMode="numeric" value={r.max} onChange={(e) => set({ ...r, max: e.target.value })} className={inputCls(!!errs[`${p}max`])} /></Field>
      {free && <Field label="Free over (ZAR, optional)" error={errs[`${p}free`]}><input inputMode="decimal" value={r.freeOver} onChange={(e) => set({ ...r, freeOver: e.target.value })} className={inputCls(!!errs[`${p}free`])} placeholder="No free shipping" /></Field>}
    </div>
  )

  return (
    <>
      <PageHeader title="Shipping" sub="Set the delivery options buyers can choose from your store." />
      <div className="mb-5"><Notice>Rates are configured by you, the seller. BLENDD does not hard-code courier prices or delivery times. Delivery days are business days after dispatch.</Notice></div>
      <div className="max-w-4xl space-y-5">
        <Card title="Standard courier">{rate(std, setStd, 's', true)}</Card>
        <Card title="Express courier" action={<Toggle checked={expOn} onChange={setExpOn} label="Offer express courier" />}>
          {expOn ? rate(exp, setExp, 'x', false) : <p className="text-sm text-mute">Not offered. Turn on to add a faster, higher-priced option.</p>}
        </Card>
        <Card title="Collection from you" action={<Toggle checked={collect} onChange={setCollect} label="Allow collection" />}>
          <p className="text-sm text-mute">{collect ? `Buyers can collect from ${seller.city}. Your exact address is only shared after an order is paid.` : 'Collection is off.'}</p>
        </Card>
        <Card title="Preview at checkout">
          <ul className="space-y-1.5 text-sm">
            <li className="flex justify-between"><span>Standard courier · {std.min || '?'}–{std.max || '?'} days</span><strong>{money(Number(std.fee) || 0)}</strong></li>
            {Number(std.freeOver) > 0 && <li className="text-xs text-mute">Free standard shipping on orders over {money(Number(std.freeOver))}</li>}
            {expOn && <li className="flex justify-between"><span>Express courier · {exp.min || '?'}–{exp.max || '?'} days</span><strong>{money(Number(exp.fee) || 0)}</strong></li>}
            {collect && <li className="flex justify-between"><span>Collect from seller</span><strong>Free</strong></li>}
          </ul>
        </Card>
        <Button onClick={save}>Save shipping settings</Button>
      </div>
    </>
  )
}
