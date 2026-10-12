import { useState } from 'react'
import { useExtra, useStore } from '../../store/store'
import { fmtDate, money, nowIso } from '../../lib/format'
import { Button, ConfirmDialog, Empty, StatusBadge, Tabs } from '../../components/ui'
import { DataTable, Note, PageHeader, TableSkeleton, Toolbar, type Column } from '../components/kit'
import { groupGoods } from '../lib/disputes'
import { useLoading } from '../lib/helpers'

interface Row { key: string; orderId: string; sellerId: string; ref: string; buyer: string; seller: string; goods: number; shipping: number; at?: string; status: string }

export default function Refunds() {
  const store = useStore()
  const { orders, sellers, updateGroupStatus } = store
  const [log, setLog] = useExtra<Record<string, { at: string; by: string; amount: number }>>('refund-log', {})
  const loading = useLoading()
  const [tab, setTab] = useState<'pending' | 'refunded'>('pending')
  const [target, setTarget] = useState<Row | null>(null)
  const sName = (id: string) => sellers.find((s) => s.id === id)?.name ?? id

  const rows: Row[] = orders.flatMap((o) => o.groups.filter((g) => g.status === 'return_requested' || g.status === 'refunded').map((g) => ({
    key: `${o.id}:${g.sellerId}`, orderId: o.id, sellerId: g.sellerId, ref: o.ref, buyer: o.address.name, seller: sName(g.sellerId), goods: groupGoods(g), shipping: g.shipping,
    at: g.history.filter((h) => h.status === 'refunded').pop()?.at, status: g.status,
  })))
  const pending = rows.filter((r) => r.status === 'return_requested')
  const done = rows.filter((r) => r.status === 'refunded')
  const shown = tab === 'pending' ? pending : done

  const issue = (r: Row) => {
    updateGroupStatus(r.orderId, r.sellerId, 'refunded', 'Demo refund recorded by admin (no payment provider connected)')
    setLog({ ...log, [r.key]: { at: nowIso(), by: store.user?.name ?? 'Admin', amount: r.goods } })
    store.audit('Issued demo refund', `Order ${r.ref} / ${r.seller} — ${money(r.goods)}`)
    store.toast(`Demo refund of ${money(r.goods)} recorded`)
  }

  const cols: Column<Row>[] = [
    { key: 'r', header: 'Order', primary: true, cell: (r) => <span className="font-semibold">{r.ref}</span> },
    { key: 'b', header: 'Buyer', cell: (r) => r.buyer },
    { key: 's', header: 'Seller', cell: (r) => r.seller },
    { key: 'a', header: 'Goods value', cell: (r) => money(r.goods) },
    { key: 'st', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    { key: 'w', header: tab === 'pending' ? 'Action' : 'Recorded', align: 'right', cell: (r) => tab === 'pending'
      ? <Button size="sm" onClick={() => setTarget(r)}>Record refund</Button>
      : <span className="text-xs text-mute">{log[r.key] ? `${fmtDate(log[r.key].at, true)} by ${log[r.key].by}` : r.at ? fmtDate(r.at, true) : 'Seeded'}</span> },
  ]

  return (
    <>
      <PageHeader eyebrow="Commerce" title="Refund management" desc="Pending return requests and refunded order parts." />
      <Note tone="warn" className="mb-5"><strong>Demo action only.</strong> “Record refund” marks the order part as refunded and writes an audit entry. No payment provider is connected, so no money is returned to any card or bank account.</Note>
      <Toolbar><Tabs value={tab} onChange={setTab} items={[{ id: 'pending', label: 'Pending requests', count: pending.length }, { id: 'refunded', label: 'Refunded', count: done.length }]} /></Toolbar>
      {loading ? <TableSkeleton rows={3} /> : shown.length === 0 ? <Empty title={tab === 'pending' ? 'No pending refund requests' : 'No refunds recorded'} body="Return requests from buyers show up here." /> : <DataTable caption="Refunds" columns={cols} rows={shown} rowKey={(r) => r.key} />}
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} title="Record demo refund?" confirmLabel="Record refund" body={target && `Mark ${target.seller}'s part of ${target.ref} as refunded (${money(target.goods)} goods value; shipping of ${money(target.shipping)} follows the seller's returns policy). Nothing is sent to a payment provider.`} onConfirm={() => target && issue(target)} />
    </>
  )
}
