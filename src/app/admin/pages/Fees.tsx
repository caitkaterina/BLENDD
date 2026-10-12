import { useState } from 'react'
import { useExtra, useStore } from '../../store/store'
import { fmtDate, money } from '../../lib/format'
import type { SellerType } from '../../lib/types'
import { Badge, Button, Field, inputCls } from '../../components/ui'
import { KV, Note, PageHeader, PageSkeleton, Panel } from '../components/kit'
import type { Overrides } from '../lib/fees'
import { SELLER_TYPE_LABEL, useLoading } from '../lib/helpers'
import { useAuditLog } from '../lib/useAuditLog'

const TYPES: SellerType[] = ['reseller', 'retailer', 'wholesaler', 'manufacturer']
const parse = (v: string) => (v.trim() === '' ? NaN : Number(v))
const valid = (n: number) => Number.isFinite(n) && n >= 0 && n <= 30

export default function Fees() {
  const store = useStore()
  const { settings, updateSettings } = store
  const log = useAuditLog()
  const loading = useLoading()
  const [pct, setPct] = useState(String(settings.feePercent))
  const [ov, setOv] = useExtra<Overrides>('fee-overrides', {})
  const [ovDraft, setOvDraft] = useState<Record<string, string>>(() => Object.fromEntries(TYPES.map((t) => [t, ov[t] != null ? String(ov[t]) : ''])))
  const [amount, setAmount] = useState('2500')
  const [calcType, setCalcType] = useState<SellerType | 'none'>('none')
  if (loading) return <PageSkeleton />

  const n = parse(pct)
  const err = valid(n) ? '' : 'Enter a percentage between 0 and 30.'
  const save = () => {
    if (err) return
    updateSettings({ feePercent: n })
    store.audit('Changed marketplace fee', `${settings.feePercent}% → ${n}% (demo configuration)`)
    store.toast(`Marketplace fee set to ${n}%`)
  }
  const ovErr = (t: string) => (ovDraft[t] === '' ? '' : valid(parse(ovDraft[t])) ? '' : '0–30 only')
  const saveOv = () => {
    if (TYPES.some((t) => ovErr(t))) return store.toast('Fix the highlighted override values', 'error')
    const next: Overrides = {}
    TYPES.forEach((t) => { if (ovDraft[t] !== '') next[t] = parse(ovDraft[t]) })
    setOv(next)
    store.audit('Changed fee overrides', TYPES.map((t) => `${t}: ${next[t] ?? 'default'}`).join(', '))
    store.toast('Overrides saved')
  }

  const amt = Number(amount)
  const amtErr = Number.isFinite(amt) && amt > 0 ? '' : 'Enter an order value above 0.'
  const rate = calcType !== 'none' && ov[calcType] != null ? (ov[calcType] as number) : settings.feePercent
  const fee = amtErr ? 0 : Math.round(amt * rate) / 100
  const history = log.filter((a) => /fee/i.test(a.action)).slice(0, 8)

  return (
    <>
      <PageHeader eyebrow="Commerce" title="Marketplace fee" desc="Commission BLENDD would take on goods value." actions={<Badge tone="line">Demo configuration</Badge>} />
      <Note className="mb-5">These percentages are placeholders for demonstration, not real commercial terms. Fee terms must be agreed with sellers and reviewed before launch.</Note>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Default marketplace fee">
          <Field label="Fee percent (0–30)" error={err}><div className="flex gap-2"><input inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} className={inputCls(!!err)} /><span className="grid h-11 place-items-center text-sm font-semibold">%</span></div></Field>
          <Button className="mt-4" variant="dark" disabled={!!err || n === settings.feePercent} onClick={save}>Save fee</Button>
          <p className="mt-2 text-xs text-mute">Current: {settings.feePercent}%</p>
        </Panel>
        <Panel title="Overrides by seller type">
          <div className="grid grid-cols-2 gap-3">
            {TYPES.map((t) => (
              <Field key={t} label={SELLER_TYPE_LABEL[t]} error={ovErr(t)} hint="Blank = use default"><input inputMode="decimal" placeholder={String(settings.feePercent)} value={ovDraft[t]} onChange={(e) => setOvDraft({ ...ovDraft, [t]: e.target.value })} className={inputCls(!!ovErr(t))} /></Field>
            ))}
          </div>
          <Button className="mt-4" variant="dark" onClick={saveOv}>Save overrides</Button>
          <p className="mt-2 text-xs text-mute">Sellers with several types get the lowest matching override.</p>
        </Panel>
        <Panel title="Fee calculator">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Example order value (goods, R)" error={amtErr}><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls(!!amtErr)} /></Field>
            <Field label="Seller type"><select value={calcType} onChange={(e) => setCalcType(e.target.value as SellerType | 'none')} className={inputCls()}><option value="none">Default</option>{TYPES.map((t) => <option key={t} value={t}>{SELLER_TYPE_LABEL[t]}</option>)}</select></Field>
          </div>
          <dl className="mt-4">
            <KV k="Rate applied" v={`${rate}%`} />
            <KV k="Marketplace fee" v={money(fee)} />
            <KV k="Seller receives (before payout costs)" v={<strong>{money(Math.max(0, (amtErr ? 0 : amt) - fee))}</strong>} />
          </dl>
        </Panel>
        <Panel title="Change history">
          {history.length === 0 ? <p className="text-sm text-mute">No fee changes recorded yet. Changes appear here and in the audit log.</p> : (
            <ul className="space-y-3">{history.map((h) => <li key={h.id} className="text-sm"><p className="font-semibold">{h.action}</p><p className="text-mute">{h.target}</p><p className="text-[11px] text-mute">{h.actor} · {fmtDate(h.at, true)}</p></li>)}</ul>
          )}
        </Panel>
      </div>
    </>
  )
}
