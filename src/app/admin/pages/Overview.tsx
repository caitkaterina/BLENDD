import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { useStore } from '../../store/store'
import { money, fmtDate } from '../../lib/format'
import { Badge, cx } from '../../components/ui'
import { PageHeader, PageSkeleton, Panel, Stat } from '../components/kit'
import { useLoading } from '../lib/helpers'
import { useAuditLog } from '../lib/useAuditLog'

function Spark({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data), min = Math.min(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 200},${46 - ((v - min) / (max - min || 1)) * 40}`).join(' ')
  return (
    <svg viewBox="0 0 200 50" role="img" aria-label={label} className="h-14 w-full">
      <polyline points={pts} fill="none" stroke="#0B0B0F" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="200" cy={pts.split(' ').pop()!.split(',')[1]} r="3.5" fill="#FFBFD9" stroke="#0B0B0F" strokeWidth="1.5" />
    </svg>
  )
}

export default function Overview() {
  const { orders, sellers, products, reviews, can, settings } = useStore()
  const audit = useAuditLog()
  const loading = useLoading()
  if (loading) return <PageSkeleton />

  const gmv = orders.reduce((a, o) => a + o.total, 0)
  const byStatus = (['published', 'pending_review', 'draft', 'rejected', 'archived'] as const).map((s) => ({ s, n: products.filter((p) => p.status === s).length }))
  const maxN = Math.max(1, ...byStatus.map((b) => b.n))
  const applications = sellers.filter((s) => s.status === 'applicant' || s.verificationStatus === 'pending').length
  const disputes = orders.flatMap((o) => o.groups).filter((g) => g.status === 'return_requested').length
  const reviewQueue = reviews.filter((r) => r.moderation === 'pending' || r.reported).length
  const pendingListings = products.filter((p) => p.status === 'pending_review').length
  const queues = [
    { label: 'Seller applications to review', n: applications, to: '/admin/sellers', perm: 'sellers' as const },
    { label: 'Listings awaiting moderation', n: pendingListings, to: '/admin/listings', perm: 'listings' as const },
    { label: 'Open returns & disputes', n: disputes, to: '/admin/disputes', perm: 'disputes' as const },
    { label: 'Reviews & reports to moderate', n: reviewQueue, to: '/admin/reviews', perm: 'reviews' as const },
  ]

  return (
    <>
      <PageHeader eyebrow="Control room" title="Marketplace overview" desc="Live figures computed from the local demo store. Totals are demo data, not real revenue." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orders" value={orders.length} demo />
        <Stat label="GMV (order totals)" value={money(gmv)} demo />
        <Stat label="Active sellers" value={sellers.filter((s) => s.status === 'active').length} sub={`${sellers.length} accounts in total`} />
        <Stat label="Published listings" value={products.filter((p) => p.status === 'published').length} sub={`${pendingListings} awaiting review`} />
        <Stat label="Pending seller applications" value={applications} />
        <Stat label="Open disputes / returns" value={disputes} sub="Order groups in return_requested" />
        <Stat label="Reviews & reports pending" value={reviewQueue} />
        <Stat label="Marketplace fee" value={`${settings.feePercent}%`} sub="Demo configuration" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Work queue">
            <ul className="divide-y divide-line">
              {queues.map((q) => {
                const ok = can(q.perm)
                return (
                  <li key={q.label} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className={cx('grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-bold', q.n ? 'bg-pink text-ink' : 'bg-fog text-mute')}>{q.n}</span>
                      <span className="text-sm font-medium">{q.label}</span>
                    </div>
                    {ok ? <Link to={q.to} className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">Open <ArrowRight size={14} aria-hidden /></Link> : <Badge tone="line">No permission</Badge>}
                  </li>
                )
              })}
            </ul>
          </Panel>

          <div className="grid gap-6 sm:grid-cols-2">
            <Panel title="Listings by status">
              <ul className="space-y-2.5">
                {byStatus.map((b) => (
                  <li key={b.s} className="text-xs">
                    <div className="mb-1 flex justify-between"><span className="capitalize">{b.s.replace('_', ' ')}</span><span className="font-semibold tabular-nums">{b.n}</span></div>
                    <div className="h-2 rounded-full bg-fog"><div className="h-2 rounded-full bg-ink" style={{ width: `${(b.n / maxN) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Order volume trend">
              <Spark data={[3, 4, 3, 6, 5, 8, 7, 9, 8, 11]} label="Illustrative order volume trend, rising" />
              <p className="mt-1 text-[11px] text-mute">Illustrative sparkline — not computed from real activity.</p>
              <Spark data={[9, 8, 8, 7, 6, 6, 5, 5, 4, 4]} label="Illustrative dispute rate trend, falling" />
              <p className="mt-1 text-[11px] text-mute">Illustrative dispute-rate shape — placeholder.</p>
            </Panel>
          </div>
        </div>

        <Panel title="Recent audit entries" action={can('audit') ? <Link to="/admin/audit" className="text-xs font-semibold underline">View all</Link> : undefined}>
          {audit.length === 0 ? <p className="text-sm text-mute">No entries yet.</p> : (
            <ol className="space-y-3">
              {audit.slice(0, 7).map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-semibold">{a.action}</p>
                  <p className="truncate text-mute">{a.target}</p>
                  <p className="text-[11px] text-mute">{a.actor} · {fmtDate(a.at, true)}</p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  )
}
