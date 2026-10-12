import { useState } from 'react'
import { BadgeCheck, Flag } from 'lucide-react'
import { useStore } from '../../store/store'
import { fmtDate } from '../../lib/format'
import type { Review } from '../../lib/types'
import { Badge, Button, Empty, Stars, StatusBadge, Tabs } from '../../components/ui'
import { Note, PageHeader, ReasonDialog, TableSkeleton, Toolbar } from '../components/kit'
import { useLoading } from '../lib/helpers'

export default function Reviews() {
  const store = useStore()
  const { reviews, products, sellers, patchReview } = store
  const loading = useLoading()
  const [tab, setTab] = useState<'queue' | 'all'>('queue')
  const [rm, setRm] = useState<Review | null>(null)
  const queue = reviews.filter((r) => r.moderation === 'pending' || r.reported)
  const shown = tab === 'queue' ? queue : reviews
  const target = (r: Review) => (r.productId ? products.find((p) => p.id === r.productId)?.title : undefined) ?? 'Seller'

  const approve = (r: Review) => { patchReview(r.id, { moderation: 'published', reported: false }); store.audit('Approved review', `${r.author} on ${target(r)}`); store.toast('Review published') }

  return (
    <>
      <PageHeader eyebrow="Trust & care" title="Reviews & reports" desc="Moderate pending reviews and reports. Product reviews describe an item; seller reviews describe service (communication, dispatch)." />
      <Note className="mb-5">The “Verified purchase” badge appears only on reviews linked to a real (demo) order. It is never added by moderators.</Note>
      <Toolbar><Tabs value={tab} onChange={setTab} items={[{ id: 'queue', label: 'Moderation queue', count: queue.length }, { id: 'all', label: 'All reviews', count: reviews.length }]} /></Toolbar>
      {loading ? <TableSkeleton rows={3} /> : shown.length === 0 ? <Empty title="Queue is clear" body="No reviews are waiting for moderation." /> : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="line">{r.productId ? 'Product review' : 'Seller review'}</Badge>
                <StatusBadge status={r.moderation === 'pending' ? 'pending' : r.moderation} />
                {r.reported && <Badge tone="bad"><Flag size={11} aria-hidden /> Reported</Badge>}
                {r.verifiedPurchase && <Badge tone="ok"><BadgeCheck size={12} aria-hidden /> Verified purchase</Badge>}
                <span className="ml-auto text-xs text-mute">{fmtDate(r.date)}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2"><Stars value={r.rating} /><p className="font-semibold">{r.title}</p></div>
              <p className="mt-1 text-sm text-graphite">{r.body}</p>
              <p className="mt-2 text-xs text-mute">By {r.author} · {target(r)} · {sellers.find((s) => s.id === r.sellerId)?.name}</p>
              {r.sellerResponse && <p className="mt-2 rounded-lg bg-fog p-2.5 text-xs"><strong>Seller response:</strong> {r.sellerResponse}</p>}
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" disabled={r.moderation === 'removed'} onClick={() => setRm(r)}>Remove</Button>
                <Button size="sm" disabled={r.moderation === 'published' && !r.reported} title={r.moderation === 'published' && !r.reported ? 'Already published' : undefined} onClick={() => approve(r)}>{r.reported ? 'Dismiss report & publish' : 'Approve'}</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ReasonDialog open={!!rm} onClose={() => setRm(null)} danger title="Remove review" confirmLabel="Remove review" label="Reason for removal" body={rm && `“${rm.title}” by ${rm.author} will no longer be public.`} onConfirm={(reason) => { if (!rm) return; patchReview(rm.id, { moderation: 'removed', reported: false }); store.audit('Removed review', `${rm.author} on ${target(rm)} — ${reason}`); store.toast('Review removed') }} />
    </>
  )
}
