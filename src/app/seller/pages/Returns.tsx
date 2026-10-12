import { useState } from 'react'
import { Link } from 'react-router'
import { Empty, StatusBadge } from '../../components/ui'
import { fmtDate, money } from '../../lib/format'
import { useLoading, useSellerData } from '../lib/useSellerData'
import OrderDetail from '../components/OrderDetail'
import { Card, Notice, PageHeader, PageSkeleton, Thumb } from '../components/kit'

export default function Returns() {
  const loading = useLoading()
  const { myGroups, seller } = useSellerData()
  const [openKey, setOpenKey] = useState<string | null>(null)
  if (loading || !seller) return <PageSkeleton rows={4} />
  const rows = myGroups.filter((g) => ['return_requested', 'refunded'].includes(g.group.status))
  const open = rows.find((g) => g.key === openKey) ?? myGroups.find((g) => g.key === openKey) ?? null
  const pending = rows.filter((g) => g.group.status === 'return_requested').length

  return (
    <>
      <PageHeader title="Returns & Refunds" sub={pending ? `${pending} return${pending === 1 ? '' : 's'} waiting for your decision.` : 'No returns waiting for a decision.'} />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div>
          {rows.length === 0 ? <Empty title="No returns or refunds" body="Return requests from buyers appear here with the reason they gave." /> : (
            <ul className="space-y-3">
              {rows.map((g) => {
                const reqNote = [...g.group.history].reverse().find((h) => h.status === 'return_requested')?.note
                return (
                  <li key={g.key} className="rounded-xl border border-line bg-white p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Thumb src={g.group.lines[0]?.image} alt="" size={48} />
                      <div className="min-w-0 flex-1"><p className="text-sm font-bold">{g.order.ref}</p><p className="text-xs text-mute">{g.order.address.name} · ordered {fmtDate(g.order.placedAt)} · {money(g.subtotal)}</p></div>
                      <StatusBadge status={g.group.status} />
                    </div>
                    {reqNote && <p className="mt-3 rounded-lg bg-fog p-3 text-sm"><span className="text-xs font-semibold text-mute">Buyer's reason</span><br />{reqNote}</p>}
                    <button type="button" onClick={() => setOpenKey(g.key)} className="mt-3 inline-flex h-9 items-center rounded-full border border-ink px-4 text-[13px] font-semibold hover:bg-ink hover:text-white">{g.group.status === 'return_requested' ? 'Review: approve or decline' : 'View details'}</button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <aside className="space-y-4">
          <Card title="Your returns policy"><p className="text-sm text-graphite">{seller.returnsPolicy}</p><Link to="/seller/storefront" className="mt-2 inline-block text-xs font-semibold underline">Edit in Storefront</Link></Card>
          <Notice>Refunds here are demo-only. Approving marks the order as refunded; no money moves because no payment provider is connected. Declining returns the order to Delivered with your note.</Notice>
        </aside>
      </div>
      <OrderDetail key={openKey ?? 'none'} sg={open} onClose={() => setOpenKey(null)} />
    </>
  )
}
