import { useState } from 'react'
import { useExtra, useStore } from '../../store/store'
import { money } from '../../lib/format'
import { Button, ConfirmDialog, Empty, StatusBadge } from '../../components/ui'
import { DataTable, Note, PageHeader, TableSkeleton, type Column } from '../components/kit'
import { effectivePercent, type Overrides } from '../lib/fees'
import { useLoading } from '../lib/helpers'

type PState = 'scheduled' | 'held' | 'failed'
interface Row { id: string; name: string; orders: number; gross: number; pct: number; fee: number; net: number; state: PState }

export default function Payouts() {
  const store = useStore()
  const { orders, sellers, settings } = store
  const [state, setState] = useExtra<Record<string, PState>>('payout-state', {})
  const [ov] = useExtra<Overrides>('fee-overrides', {})
  const loading = useLoading()
  const [act, setAct] = useState<{ r: Row; to: PState } | null>(null)

  const rows: Row[] = sellers.map((s) => {
    const gs = orders.flatMap((o) => o.groups).filter((g) => g.sellerId === s.id && (g.status === 'delivered' || g.status === 'completed'))
    const gross = gs.reduce((a, g) => a + g.lines.reduce((x, l) => x + l.qty * l.unit, 0), 0)
    const pct = effectivePercent(s, ov, settings.feePercent)
    const fee = Math.round(gross * pct) / 100
    return { id: s.id, name: s.name, orders: gs.length, gross, pct, fee, net: gross - fee, state: state[s.id] ?? 'scheduled' }
  }).filter((r) => r.orders > 0)

  const LABEL: Record<PState, { title: string; verb: string; action: string }> = {
    held: { title: 'Hold payout?', verb: 'Hold', action: 'Held payout' },
    scheduled: { title: 'Release payout?', verb: 'Release', action: 'Released payout' },
    failed: { title: 'Mark payout as failed?', verb: 'Mark failed', action: 'Marked payout failed' },
  }
  const apply = (r: Row, to: PState) => {
    setState({ ...state, [r.id]: to })
    store.audit(LABEL[to].action, `${r.name} — ${money(r.net)} (demo)`)
    store.toast(`${r.name}: payout ${to === 'scheduled' ? 'released to schedule' : to}`)
  }

  const cols: Column<Row>[] = [
    { key: 'n', header: 'Seller', primary: true, cell: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'o', header: 'Settled order parts', cell: (r) => r.orders },
    { key: 'g', header: 'Goods value', cell: (r) => money(r.gross) },
    { key: 'f', header: 'Fee', cell: (r) => `${money(r.fee)} (${r.pct}%)` },
    { key: 'p', header: 'Payout (demo)', cell: (r) => <strong>{money(r.net)}</strong> },
    { key: 's', header: 'Status', cell: (r) => <StatusBadge status={r.state === 'scheduled' ? 'processing' : r.state === 'held' ? 'pending' : 'failed'} /> },
    { key: 'a', header: 'Actions', align: 'right', cell: (r) => (
      <div className="flex justify-end gap-1.5">
        {r.state === 'scheduled' ? <Button size="sm" variant="outline" onClick={() => setAct({ r, to: 'held' })}>Hold</Button> : <Button size="sm" onClick={() => setAct({ r, to: 'scheduled' })}>{r.state === 'failed' ? 'Retry' : 'Release'}</Button>}
        <Button size="sm" variant="ghost" disabled={r.state === 'failed'} title={r.state === 'failed' ? 'Already marked failed' : 'Simulate a failed transfer'} onClick={() => setAct({ r, to: 'failed' })}>Fail</Button>
      </div>
    ) },
  ]

  return (
    <>
      <PageHeader eyebrow="Commerce" title="Payout monitoring" desc="Per-seller payouts derived from delivered and completed order parts, less the marketplace fee." />
      <Note tone="warn" className="mb-5"><strong>No payout provider is connected.</strong> Figures are demo data; “Scheduled / Held / Failed” are recorded states only and no bank transfer is made. Shipping charges are excluded from the calculation in this demo.</Note>
      {loading ? <TableSkeleton rows={3} /> : rows.length === 0 ? <Empty title="No payouts due" body="Payouts appear once order parts are delivered or completed." /> : <DataTable caption="Seller payouts" columns={cols} rows={rows} rowKey={(r) => r.id} />}
      <ConfirmDialog open={!!act} onClose={() => setAct(null)} danger={act?.to === 'failed'} title={act ? LABEL[act.to].title : ''} confirmLabel={act ? LABEL[act.to].verb : 'Confirm'} body={act && `${act.r.name}: ${money(act.r.net)} (demo). This only changes a recorded status.`} onConfirm={() => act && apply(act.r, act.to)} />
    </>
  )
}
