import { useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Badge, Button, Empty, Field, LinkButton, Modal, inputCls } from '../../components/ui'
import { fmtDate } from '../../lib/format'
import { stockState } from '../../lib/pricing'
import type { Product } from '../../lib/types'
import { useLoading, useSellerData } from '../lib/useSellerData'
import { Card, Notice, PageHeader, PageSkeleton, SearchBox, Thumb, selectCls, td, th } from '../components/kit'

const REASONS = ['Restock received', 'Stock count correction', 'Damaged or lost', 'Customer return restocked', 'Sold offline', 'Other']
type Dlg = { p: Product; mode: 'delta' | 'set'; value: string }

export default function Inventory() {
  const loading = useLoading()
  const { myProducts, myStockLog, adjustStock, setStock, toast } = useSellerData()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [dlg, setDlg] = useState<Dlg | null>(null)
  const [reason, setReason] = useState(REASONS[0])
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  const rows = useMemo(
    () => myProducts.filter((p) => p.status !== 'archived' && (filter === 'all' || (filter === 'out' ? stockState(p) === 'out' : stockState(p) !== 'in')) && (!q.trim() || `${p.title} ${p.sku}`.toLowerCase().includes(q.trim().toLowerCase()))),
    [myProducts, q, filter],
  )
  if (loading) return <PageSkeleton rows={6} />

  const open = (p: Product, mode: Dlg['mode'], value: string) => { setDlg({ p, mode, value }); setReason(REASONS[0]); setNote(''); setErr('') }
  const apply = () => {
    if (!dlg) return
    const n = Number(dlg.value)
    if (dlg.value.trim() === '' || !Number.isInteger(n)) return setErr('Enter a whole number.')
    const why = note.trim() ? `${reason}: ${note.trim()}` : reason
    if (dlg.mode === 'set') {
      if (n < 0) return setErr('Stock cannot be negative.')
      setStock(dlg.p.id, n, why)
    } else {
      if (n === 0) return setErr('Enter a change other than 0.')
      if (dlg.p.stock + n < 0) return setErr(`Only ${dlg.p.stock} in stock, so you cannot remove ${-n}.`)
      adjustStock(dlg.p.id, n, why)
    }
    toast('Stock updated. The storefront reflects it immediately.')
    setDlg(null)
  }
  const title = (id: string) => myProducts.find((p) => p.id === id)?.title ?? 'Removed listing'

  return (
    <>
      <PageHeader title="Inventory" sub="Stock changes are written to the shared store, so buyers see the new availability immediately." actions={<LinkButton to="/seller/products/new" size="sm" variant="outline">Add product</LinkButton>} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1" role="group" aria-label="Stock filter">
          {(['all', 'low', 'out'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === f ? 'bg-ink text-white' : 'text-graphite hover:bg-fog'}`}>{f === 'all' ? 'All' : f === 'low' ? 'Low or out' : 'Out of stock'}</button>
          ))}
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Search title or SKU" />
      </div>

      {rows.length === 0 ? <Empty title="No listings in this view" body="Adjust the filter or add a product." /> : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-line bg-white md:block">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-line bg-fog/60"><tr><th className={th}>Product</th><th className={th}>SKU</th><th className={th}>Low at</th><th className={th}>Status</th><th className={th + ' text-right'}>Stock</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className={td}><div className="flex items-center gap-3"><Thumb src={p.images[0]} alt="" size={40} /><span className="line-clamp-1 font-semibold">{p.title}</span></div></td>
                    <td className={td + ' font-mono text-xs'}>{p.sku}</td>
                    <td className={td}>{p.lowStockAt}</td>
                    <td className={td}><StockBadge p={p} /></td>
                    <td className={td}><Stepper p={p} open={open} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {rows.map((p) => (
              <li key={p.id} className="rounded-xl border border-line bg-white p-3">
                <div className="flex items-center gap-3"><Thumb src={p.images[0]} alt="" size={48} /><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold">{p.title}</p><p className="font-mono text-[11px] text-mute">{p.sku} · low at {p.lowStockAt}</p></div><StockBadge p={p} /></div>
                <div className="mt-3 flex justify-end"><Stepper p={p} open={open} /></div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Card title="Stock adjustment history" className="mt-6" flush>
        {myStockLog.length === 0 ? <p className="p-6 text-center text-sm text-mute">No adjustments yet. Sales and manual changes will be logged here.</p> : (
          <div className="max-h-96 overflow-auto">
            <table className="w-full min-w-[560px]">
              <thead className="sticky top-0 border-b border-line bg-fog"><tr><th className={th}>When</th><th className={th}>Product</th><th className={th}>Change</th><th className={th}>Reason</th><th className={th}>By</th></tr></thead>
              <tbody className="divide-y divide-line">
                {myStockLog.map((l) => (
                  <tr key={l.id}><td className={td + ' whitespace-nowrap text-xs'}>{fmtDate(l.at, true)}</td><td className={td + ' max-w-56 truncate'}>{title(l.productId)}</td><td className={td + ' font-bold ' + (l.delta < 0 ? 'text-bad' : 'text-ok')}>{l.delta > 0 ? '+' : ''}{l.delta}</td><td className={td}>{l.reason}</td><td className={td + ' text-mute'}>{l.by}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!dlg} onClose={() => setDlg(null)} title={dlg?.mode === 'set' ? 'Set stock level' : 'Adjust stock'} footer={<><Button variant="ghost" onClick={() => setDlg(null)}>Cancel</Button><Button variant="dark" onClick={apply}>Save adjustment</Button></>}>
        {dlg && (
          <div className="space-y-4">
            <p className="text-sm font-semibold">{dlg.p.title} <span className="font-normal text-mute">(now {dlg.p.stock})</span></p>
            <Field label={dlg.mode === 'set' ? 'New stock level' : 'Change (negative to remove)'} error={err}><input autoFocus inputMode="numeric" value={dlg.value} onChange={(e) => { setDlg({ ...dlg, value: e.target.value }); setErr('') }} className={inputCls(!!err)} /></Field>
            <Field label="Reason"><select value={reason} onChange={(e) => setReason(e.target.value)} className={selectCls()}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
            <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls()} /></Field>
          </div>
        )}
      </Modal>
      <div className="mt-4"><Notice>Variant-level stock is not tracked in this demo: stock is held per listing.</Notice></div>
    </>
  )
}

function StockBadge({ p }: { p: Product }) {
  const s = stockState(p)
  return s === 'out' ? <Badge tone="bad">Out of stock</Badge> : s === 'low' ? <Badge tone="warn">Low stock</Badge> : <Badge tone="ok">In stock</Badge>
}

function Stepper({ p, open }: { p: Product; open: (p: Product, m: Dlg['mode'], v: string) => void }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <button type="button" disabled={p.stock <= 0} onClick={() => open(p, 'delta', '-1')} aria-label={`Remove stock from ${p.title}`} className="grid size-9 place-items-center rounded-full border border-line hover:border-ink disabled:opacity-30"><Minus size={14} /></button>
      <span className="w-12 text-center text-sm font-bold" aria-live="polite">{p.stock}</span>
      <button type="button" onClick={() => open(p, 'delta', '1')} aria-label={`Add stock to ${p.title}`} className="grid size-9 place-items-center rounded-full border border-line hover:border-ink"><Plus size={14} /></button>
      <Button size="sm" variant="ghost" onClick={() => open(p, 'set', String(p.stock))}>Set</Button>
    </div>
  )
}
