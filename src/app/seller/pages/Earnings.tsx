import { Landmark } from 'lucide-react'
import { Badge, Button } from '../../components/ui'
import { fmtDate, money } from '../../lib/format'
import { computeFinance, useLoading, useSellerData } from '../lib/useSellerData'
import { Card, DlRow, Kpi, Notice, PageHeader, PageSkeleton, td, th } from '../components/kit'

export default function Earnings() {
  const loading = useLoading()
  const { myGroups, settings } = useSellerData()
  if (loading) return <PageSkeleton cards={4} rows={3} />
  const f = computeFinance(myGroups, settings.feePercent)
  const history = [
    { id: 'DEMO-PO-0003', date: '2026-09-30', amount: 4210, status: 'Illustrative' },
    { id: 'DEMO-PO-0002', date: '2026-09-15', amount: 2985, status: 'Illustrative' },
    { id: 'DEMO-PO-0001', date: '2026-08-31', amount: 1640, status: 'Illustrative' },
  ]
  return (
    <>
      <PageHeader title="Earnings & Payouts" sub="How your sales translate into earnings, using the demo fee setting." />
      <div className="mb-5"><Notice tone="dark" strong>ALL FINANCIAL VALUES AND PAYOUT STATES ARE DEMO ONLY. No money has been, or can be, paid out from this screen.</Notice></div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Gross sales" value={money(f.gross)} sub="Non-cancelled orders, items only" />
        <Kpi label={`Marketplace fees (${settings.feePercent}%)`} value={`-${money(Math.round(f.fees))}`} sub="Demo fee setting" />
        <Kpi label="Refunds" value={`-${money(f.refunds)}`} sub="Refunded orders" />
        <Kpi label="Net earnings" value={money(Math.round(f.net))} sub="After fees and refunds" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="Balance (demo)" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            {[['Pending', f.pending, 'Paid, processing or shipped'], ['Available', f.available, 'Delivered or completed'], ['On hold', f.onHold, 'Return requested']].map(([l, v, h]) => (
              <div key={l as string} className="rounded-lg bg-fog p-3"><p className="text-xs font-semibold text-mute">{l as string}</p><p className="mt-1 font-display text-xl font-extrabold">{money(Math.round(v as number))}</p><p className="text-[11px] text-mute">{h as string}</p></div>
            ))}
          </div>
          <dl className="mt-4 divide-y divide-line border-t border-line pt-2">
            <DlRow k="Gross sales" v={money(f.gross)} />
            <DlRow k={`Fees at ${settings.feePercent}% (demo)`} v={`-${money(Math.round(f.fees))}`} />
            <DlRow k="Refunds" v={`-${money(f.refunds)}`} />
            <DlRow k="Net" v={money(Math.round(f.net))} />
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button disabled aria-describedby="payout-why">Request payout</Button>
            <p id="payout-why" className="text-xs text-mute">Disabled: no payment provider or bank account is connected, so no real withdrawal exists in demo mode.</p>
          </div>
        </Card>
        <Card title="Payout account">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-fog"><Landmark size={18} /></span><div><Badge tone="warn">Not connected</Badge><p className="mt-2 text-sm text-mute">Payouts need a payment provider or bank link, confirmed by the backend. You can draft listings without it.</p></div></div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1"><Button variant="outline" size="sm" disabled>Connect account</Button><span className="text-xs text-mute">Unavailable in demo mode</span></div>
        </Card>
      </div>

      <Card title="Payout history (illustrative)" className="mt-5" flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="border-b border-line bg-fog/60"><tr><th className={th}>Reference</th><th className={th}>Date</th><th className={th}>Amount</th><th className={th}>Status</th></tr></thead>
            <tbody className="divide-y divide-line">{history.map((h) => <tr key={h.id}><td className={td + ' font-mono text-xs'}>{h.id}</td><td className={td}>{fmtDate(h.date)}</td><td className={td + ' font-semibold'}>{money(h.amount)}</td><td className={td}><Badge tone="line">{h.status} · not paid</Badge></td></tr>)}</tbody>
          </table>
        </div>
        <p className="border-t border-line px-4 py-3 text-xs text-mute">Sample rows to show the layout. They are not linked to your orders and no funds were transferred.</p>
      </Card>
    </>
  )
}
