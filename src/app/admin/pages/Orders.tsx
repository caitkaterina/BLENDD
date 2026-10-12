import { useState } from 'react'
import { useStore } from '../../store/store'
import { STATUS_LABEL, fmtDate, money, orderStatus } from '../../lib/format'
import type { GroupStatus, Order, OrderGroup } from '../../lib/types'
import { Button, Empty, StatusBadge } from '../../components/ui'
import { DataTable, Drawer, FilterSelect, KV, PageHeader, ReasonDialog, SearchBox, TableSkeleton, Toolbar, type Column } from '../components/kit'
import { includesCI, useLoading } from '../lib/helpers'

const CANCELLABLE: GroupStatus[] = ['pending_payment', 'paid', 'processing', 'shipped', 'return_requested']

export default function Orders() {
  const store = useStore()
  const { orders, sellers, updateGroupStatus } = store
  const loading = useLoading()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [seller, setSeller] = useState('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [cancel, setCancel] = useState<{ o: Order; g: OrderGroup } | null>(null)
  const sName = (id: string) => sellers.find((s) => s.id === id)?.name ?? id
  const open = orders.find((o) => o.id === openId) ?? null

  const list = orders.filter((o) => (status === 'all' || orderStatus(o) === status) && (seller === 'all' || o.groups.some((g) => g.sellerId === seller)) && (!q || includesCI(`${o.ref} ${o.address.name}`, q)))

  const cols: Column<Order>[] = [
    { key: 'r', header: 'Order', primary: true, cell: (o) => <span className="font-semibold">{o.ref}</span> },
    { key: 'b', header: 'Buyer', cell: (o) => <div><p>{o.address.name}</p><p className="text-xs text-mute">{o.address.city}</p></div> },
    { key: 's', header: 'Sellers', cell: (o) => o.groups.map((g) => sName(g.sellerId)).join(', ') },
    { key: 't', header: 'Total', cell: (o) => money(o.total) },
    { key: 'st', header: 'Status', cell: (o) => <StatusBadge status={orderStatus(o)} /> },
    { key: 'd', header: 'Placed', cell: (o) => fmtDate(o.placedAt) },
  ]

  return (
    <>
      <PageHeader eyebrow="Commerce" title="Orders" desc="All orders across sellers. Totals and payments are demo data." />
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Search ref or buyer" />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, ...Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))]} />
        <FilterSelect label="Seller" value={seller} onChange={setSeller} options={[{ value: 'all', label: 'All sellers' }, ...sellers.map((s) => ({ value: s.id, label: s.name }))]} />
        <span className="ml-auto text-xs text-mute">{list.length} orders</span>
      </Toolbar>
      {loading ? <TableSkeleton /> : list.length === 0 ? <Empty title="No orders match" body="Change the filters to widen the search." action={<Button variant="outline" onClick={() => { setQ(''); setStatus('all'); setSeller('all') }}>Clear filters</Button>} /> : <DataTable caption="Orders" columns={cols} rows={list} rowKey={(o) => o.id} onRowClick={(o) => setOpenId(o.id)} rowLabel={(o) => o.ref} />}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.ref ?? 'Order'}>
        {open && (
          <div className="space-y-6">
            <dl>
              <KV k="Buyer" v={open.address.name} />
              <KV k="Deliver to" v={`${open.address.suburb}, ${open.address.city}, ${open.address.province}`} />
              <KV k="Placed" v={fmtDate(open.placedAt, true)} />
              <KV k="Payment" v={`${open.payment.method} (demo, ${open.payment.status.replace('_', ' ')})`} />
              <KV k="Subtotal" v={money(open.subtotal)} />
              <KV k="Shipping" v={money(open.shipping)} />
              {open.discount > 0 && <KV k={`Discount${open.promo ? ` (${open.promo})` : ''}`} v={`-${money(open.discount)}`} />}
              <KV k="Total" v={<strong>{money(open.total)}</strong>} />
            </dl>
            {open.groups.map((g) => (
              <section key={g.sellerId} className="rounded-xl border border-line p-4">
                <div className="mb-2 flex items-center justify-between gap-2"><h3 className="font-display text-base font-bold">{sName(g.sellerId)}</h3><StatusBadge status={g.status} /></div>
                <ul className="mb-3 space-y-1 text-sm">{g.lines.map((l, i) => <li key={i} className="flex justify-between gap-3"><span className="min-w-0 truncate">{l.qty} × {l.title}</span><span>{money(l.qty * l.unit)}</span></li>)}</ul>
                <p className="text-xs text-mute">{g.methodLabel} · {g.etaLabel}{g.tracking ? ` · ${g.tracking.carrier} ${g.tracking.number}` : ''}</p>
                <ol className="mt-3 space-y-1.5 border-l border-line pl-4">
                  {g.history.map((h, i) => (
                    <li key={i} className="relative text-xs"><span className="absolute -left-[21px] top-1 size-2 rounded-full bg-ink" /><span className="font-semibold">{STATUS_LABEL[h.status]}</span> · {fmtDate(h.at, true)}{h.note && <span className="text-mute"> — {h.note}</span>}</li>
                  ))}
                </ol>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" variant="outline" disabled={!CANCELLABLE.includes(g.status)} title={!CANCELLABLE.includes(g.status) ? 'Only open parts of an order can be cancelled' : undefined} onClick={() => setCancel({ o: open, g })}>Cancel this part</Button>
                </div>
              </section>
            ))}
          </div>
        )}
      </Drawer>
      <ReasonDialog open={!!cancel} onClose={() => setCancel(null)} danger title="Cancel part of order" confirmLabel="Cancel part" label="Reason (visible to buyer and seller)" body={cancel && `${cancel.o.ref} — ${sName(cancel.g.sellerId)}. No payment provider is connected, so no money moves.`}
        onConfirm={(r) => { if (!cancel) return; updateGroupStatus(cancel.o.id, cancel.g.sellerId, 'cancelled', `Cancelled by admin: ${r}`); store.audit('Cancelled order group', `${cancel.o.ref} / ${sName(cancel.g.sellerId)} — ${r}`) }} />
    </>
  )
}
