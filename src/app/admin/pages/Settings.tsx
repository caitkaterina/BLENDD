import { useState } from 'react'
import { useExtra, useStore } from '../../store/store'
import { DELIVERY_METHODS, PAYMENT_METHODS, REGION, TAX } from '../../lib/config'
import { fmtDate, money, nowIso } from '../../lib/format'
import { Badge, Button, ConfirmDialog, Field, Toggle, inputCls } from '../../components/ui'
import { KV, Note, PageHeader, PageSkeleton, Panel } from '../components/kit'
import { useLoading } from '../lib/helpers'

const CURRENCIES = [{ code: 'ZAR', label: 'South African rand', live: true }, { code: 'USD', label: 'US dollar' }, { code: 'GBP', label: 'Pound sterling' }, { code: 'EUR', label: 'Euro' }]

function Row({ label, note, checked, onChange }: { label: string; note?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div><p className="text-sm font-semibold">{label}</p>{note && <p className="mt-0.5 max-w-md text-xs text-mute">{note}</p>}</div>
      <Toggle label={`${checked ? 'Disable' : 'Enable'} ${label}`} checked={checked} onChange={onChange} />
    </li>
  )
}

export default function Settings() {
  const store = useStore()
  const loading = useLoading()
  const [off, setOff] = useExtra<string[]>('methods-disabled', [])
  const [tax, setTax] = useExtra<{ label: string; rate: number }>('tax-config', { label: TAX.label, rate: TAX.rate * 100 })
  const [taxLabel, setTaxLabel] = useState(tax.label)
  const [taxRate, setTaxRate] = useState(String(tax.rate))
  const [reset, setReset] = useState(false)
  if (loading) return <PageSkeleton />

  const toggle = (id: string, label: string, kind: string, on: boolean) => {
    setOff(on ? off.filter((x) => x !== id) : [...off, id])
    store.audit(`${on ? 'Enabled' : 'Disabled'} ${kind}`, label)
    store.toast(`${label} ${on ? 'enabled' : 'disabled'} (demo)`)
  }
  const rate = Number(taxRate)
  const rateErr = taxRate.trim() !== '' && Number.isFinite(rate) && rate >= 0 && rate <= 30 ? '' : 'Enter a rate between 0 and 30.'
  const labelErr = taxLabel.trim() ? '' : 'A tax label is required.'
  const sampleNow = nowIso()

  return (
    <>
      <PageHeader eyebrow="Platform" title="Platform settings" desc="Region, delivery, payment and tax configuration." actions={<Badge tone="line">Demo configuration</Badge>} />
      <Note tone="warn" className="mb-6">Everything here is demo configuration. None of the rates are real tax, fee or exchange rates, and toggles change local demo state only.</Note>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Region & currency">
          <dl className="mb-3"><KV k="Country" v={`${REGION.country} (${REGION.code})`} /><KV k="Locale" v={REGION.locale} /><KV k="Active currency" v={`${REGION.currency} (R)`} /></dl>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {CURRENCIES.map((c) => (
              <li key={c.code} className="flex items-center justify-between px-3 py-2.5 text-sm"><label className="flex items-center gap-2"><input type="radio" name="currency" checked={!!c.live} disabled={!c.live} readOnly className="accent-ink" /> <span className={c.live ? 'font-semibold' : 'text-mute'}>{c.code} · {c.label}</span></label>{c.live ? <Badge tone="dark">Active</Badge> : <Badge tone="line">Planned</Badge>}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-mute">Multi-currency support is planned. It needs a trusted exchange-rate source and is not available in this demo.</p>
        </Panel>

        <Panel title="Time zone & date format">
          <dl><KV k="Time zone" v={REGION.timeZone} /><KV k="Date" v={fmtDate(sampleNow)} /><KV k="Date and time" v={fmtDate(sampleNow, true)} /><KV k="Money" v={money(12499.5)} /></dl>
          <p className="mt-2 text-xs text-mute">Preview uses the shared formatters, so the shop and admin always match.</p>
        </Panel>

        <Panel title="Delivery methods">
          <ul className="divide-y divide-line">{DELIVERY_METHODS.map((d) => <Row key={d.id} label={d.label} checked={!off.includes(`d:${d.id}`)} onChange={(v) => toggle(`d:${d.id}`, d.label, 'delivery method', v)} />)}</ul>
          <p className="mt-2 text-xs text-mute">Sellers still set their own rates and ETAs. Real couriers would need an API integration and credentials held server-side.</p>
        </Panel>

        <Panel title="Payment methods">
          <ul className="divide-y divide-line">{PAYMENT_METHODS.map((p) => <Row key={p.id} label={p.label} note={p.note} checked={!off.includes(`p:${p.id}`)} onChange={(v) => toggle(`p:${p.id}`, p.label, 'payment method', v)} />)}</ul>
          <Note className="mt-3">Real payment providers need a secure backend integration (hosted payment pages, webhooks, secret keys kept server-side). No provider is connected here and card data is never collected.</Note>
        </Panel>

        <Panel title="Tax">
          <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); if (rateErr || labelErr) return; setTax({ label: taxLabel.trim(), rate }); store.audit('Changed tax display', `${taxLabel.trim()} ${rate}% (demo)`); store.toast('Tax display saved') }}>
            <Field label="Tax label" error={labelErr}><input value={taxLabel} onChange={(e) => setTaxLabel(e.target.value)} className={inputCls(!!labelErr)} /></Field>
            <Field label="Rate (%)" error={rateErr}><input inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputCls(!!rateErr)} /></Field>
            <div className="col-span-2 flex items-center justify-between gap-3"><span className="text-xs text-mute">Config: {TAX.label} {TAX.rate * 100}%, {TAX.includedInPrices ? 'included in prices' : 'added at checkout'}. Saved display: {tax.label} {tax.rate}%.</span><Button type="submit" variant="dark" disabled={!!rateErr || !!labelErr || (taxLabel.trim() === tax.label && rate === tax.rate)}>Save</Button></div>
          </form>
          <p className="mt-3 text-xs text-mute">Example on {money(1150)}: {money(Math.round((1150 * tax.rate) / (100 + tax.rate) * 100) / 100)} {tax.label} included. Illustrative; confirm tax treatment with an accountant.</p>
        </Panel>

        <Panel title="Demo data">
          <p className="text-sm text-graphite">Restore all seeded orders, sellers, listings, reviews, settings, audit log and workspace data. You will remain signed in only if the seeded state allows it.</p>
          <Button className="mt-4" variant="danger" onClick={() => setReset(true)}>Reset demo data</Button>
        </Panel>
      </div>
      <ConfirmDialog open={reset} onClose={() => setReset(false)} danger title="Reset all demo data?" confirmLabel="Reset everything" body="This clears every local change in this browser, including carts, orders placed and admin edits. It cannot be undone." onConfirm={() => { store.audit('Reset demo data', 'All local demo data'); store.resetDemo() }} />
    </>
  )
}
