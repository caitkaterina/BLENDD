import { Link } from 'react-router'
import { AlertTriangle, ArrowRight, Landmark } from 'lucide-react'
import { Badge, Empty, LinkButton, Stars, StatusBadge } from '../../components/ui'
import { fmtDate, money } from '../../lib/format'
import { stockState } from '../../lib/pricing'
import { ACTION_STATUSES, hash, useLoading, useSellerData } from '../lib/useSellerData'
import { BarChart, Card, Kpi, PageHeader, PageSkeleton, Thumb } from '../components/kit'

export default function Overview() {
  const loading = useLoading()
  const { seller, myProducts, myGroups, myReviews } = useSellerData()
  if (loading || !seller) return <PageSkeleton cards={4} rows={4} />

  const live = myGroups.filter((g) => !['cancelled', 'pending_payment'].includes(g.group.status))
  const gross = live.reduce((a, g) => a + g.subtotal, 0)
  const actions = myGroups.filter((g) => ACTION_STATUSES.includes(g.group.status))
  const low = myProducts.filter((p) => p.status !== 'archived' && stockState(p) !== 'in')
  const views = myProducts.reduce((a, p) => a + p.popularity * 41 + (hash(p.id) % 120), 0)
  const conv = views ? Math.min(9, (live.length / Math.max(1, views / 400)) * 100) : 0
  const top = [...myProducts].filter((p) => p.status === 'published').sort((a, b) => b.popularity - a.popularity).slice(0, 5)
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const iso = d.toISOString().slice(0, 10)
    return { label: d.toLocaleDateString('en-ZA', { weekday: 'short' }), value: live.filter((g) => g.order.placedAt.slice(0, 10) === iso).reduce((a, g) => a + g.subtotal, 0) }
  })

  return (
    <>
      <PageHeader title={`Welcome back, ${seller.name}`} sub="Here is what needs your attention today." actions={<LinkButton to="/seller/products/new" size="sm">Add product</LinkButton>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Gross sales" value={money(gross)} sub={`${live.length} order${live.length === 1 ? '' : 's'}, excl. cancelled`} />
        <Kpi label="Orders needing action" value={String(actions.length)} sub="Paid, processing or return requested" />
        <Kpi label="Product views (30 days)" value={views.toLocaleString('en-ZA')} demo />
        <Kpi label="Conversion rate" value={`${conv.toFixed(1)}%`} demo />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card title="Orders needing action" action={<Link to="/seller/orders" className="text-xs font-semibold underline">All orders</Link>}>
            {actions.length === 0 ? (
              <p className="py-6 text-center text-sm text-mute">Nothing waiting. New paid orders will appear here.</p>
            ) : (
              <ul className="divide-y divide-line">
                {actions.map((g) => (
                  <li key={g.key} className="flex items-center gap-3 py-3">
                    <Thumb src={g.group.lines[0]?.image} alt="" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{g.order.ref}</p>
                        <p className="truncate text-xs text-mute">{g.order.address.name} · {g.group.lines.reduce((a, l) => a + l.qty, 0)} items · {fmtDate(g.order.placedAt)}</p>
                      </div>
                      <span className="self-start sm:self-auto"><StatusBadge status={g.group.status} /></span>
                    </div>
                    <Link to={`/seller/orders?open=${g.key}`} className="grid size-9 place-items-center rounded-full hover:bg-fog" aria-label={`Open order ${g.order.ref}`}><ArrowRight size={16} /></Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Sales, last 7 days" action={<span className="text-xs text-mute">From placed orders</span>}>
            {gross === 0 ? <p className="py-6 text-center text-sm text-mute">No sales yet.</p> : <BarChart data={byDay} format={money} />}
          </Card>

          <Card title="Recent orders" flush>
            {myGroups.length === 0 ? (
              <div className="p-4"><Empty title="No orders yet" body="Orders from buyers will show here once your listings are live." /></div>
            ) : (
              <ul className="divide-y divide-line">
                {myGroups.slice(0, 5).map((g) => (
                  <li key={g.key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-4 py-3 text-sm">
                    <span className="min-w-0"><span className="block truncate font-semibold sm:inline">{g.order.ref}</span><span className="block text-xs text-mute sm:ml-2 sm:inline sm:text-sm">{fmtDate(g.order.placedAt)}</span></span>
                    <span className="flex shrink-0 items-center gap-3"><span className="font-semibold">{money(g.total)}</span><StatusBadge status={g.group.status} /></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Payout status">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fog"><Landmark size={18} /></span>
              <div>
                <p className="text-sm font-bold">Payouts not connected in demo mode</p>
                <p className="mt-1 text-xs text-mute">A payment provider and bank link are needed before real payouts. Figures on the Earnings page are illustrative.</p>
                <Link to="/seller/earnings" className="mt-2 inline-block text-xs font-semibold underline">View earnings (demo)</Link>
              </div>
            </div>
          </Card>

          <Card title="Low-stock alerts" action={<Link to="/seller/inventory" className="text-xs font-semibold underline">Inventory</Link>}>
            {low.length === 0 ? <p className="py-4 text-center text-sm text-mute">All listings are comfortably stocked.</p> : (
              <ul className="space-y-2.5">
                {low.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <Thumb src={p.images[0]} alt="" size={36} />
                    <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
                    {stockState(p) === 'out' ? <Badge tone="bad">Out</Badge> : <Badge tone="warn"><AlertTriangle size={11} aria-hidden /> {p.stock} left</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Best performers" action={<span className="text-[11px] text-mute">By popularity score</span>}>
            {top.length === 0 ? <p className="py-4 text-center text-sm text-mute">Publish a listing to see performance.</p> : (
              <ol className="space-y-2.5">
                {top.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-bold text-mute">{i + 1}</span>
                    <Thumb src={p.images[0]} alt="" size={36} />
                    <Link to={`/seller/products/${p.id}/edit`} className="min-w-0 flex-1 truncate text-sm hover:underline">{p.title}</Link>
                    <span className="text-xs font-semibold">{p.popularity}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card title="Recent reviews" action={<Link to="/seller/reviews" className="text-xs font-semibold underline">All reviews</Link>}>
            {myReviews.length === 0 ? <p className="py-4 text-center text-sm text-mute">No reviews yet.</p> : (
              <ul className="space-y-3">
                {myReviews.slice(0, 3).map((r) => (
                  <li key={r.id} className="text-sm">
                    <div className="flex items-center justify-between"><span className="font-semibold">{r.author}</span><Stars value={r.rating} /></div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-mute">{r.title}. {r.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
