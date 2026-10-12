import { useMemo, useState } from 'react'
import { BadgeCheck, Flag } from 'lucide-react'
import { Badge, Button, ConfirmDialog, Empty, Field, Modal, Stars, Tabs, textareaCls } from '../../components/ui'
import { fmtDate } from '../../lib/format'
import type { Review } from '../../lib/types'
import { useLoading, useSellerData } from '../lib/useSellerData'
import { Card, Notice, PageHeader, PageSkeleton } from '../components/kit'

type Tab = 'product' | 'seller'

export default function Reviews() {
  const loading = useLoading()
  const { myReviews, myProducts, patchReview, toast } = useSellerData()
  const [tab, setTab] = useState<Tab>('product')
  const [replyTo, setReplyTo] = useState<Review | null>(null)
  const [reply, setReply] = useState('')
  const [err, setErr] = useState('')
  const [reportFor, setReportFor] = useState<Review | null>(null)

  const prod = useMemo(() => myReviews.filter((r) => r.productId), [myReviews])
  const store = useMemo(() => myReviews.filter((r) => !r.productId), [myReviews])
  const list = tab === 'product' ? prod : store
  const avg = myReviews.filter((r) => r.moderation === 'published')
  if (loading) return <PageSkeleton rows={4} />

  const openReply = (r: Review) => { setReplyTo(r); setReply(r.sellerResponse ?? ''); setErr('') }
  const submit = () => {
    if (!replyTo) return
    const t = reply.trim()
    if (t.length < 3) return setErr('Write a short, polite reply.')
    if (t.length > 600) return setErr('Keep replies under 600 characters.')
    patchReview(replyTo.id, { sellerResponse: t })
    toast('Reply published'); setReplyTo(null)
  }

  return (
    <>
      <PageHeader title="Reviews" sub="Respond publicly to buyers. You cannot edit or remove a review: if one breaks the rules, report it for moderation." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card><p className="text-xs font-semibold text-mute">Average (published)</p><p className="mt-1 font-display text-2xl font-extrabold">{avg.length ? (avg.reduce((a, r) => a + r.rating, 0) / avg.length).toFixed(1) : '–'}</p></Card>
        <Card><p className="text-xs font-semibold text-mute">Reviews</p><p className="mt-1 font-display text-2xl font-extrabold">{myReviews.length}</p></Card>
        <Card><p className="text-xs font-semibold text-mute">Awaiting your reply</p><p className="mt-1 font-display text-2xl font-extrabold">{myReviews.filter((r) => !r.sellerResponse && r.moderation === 'published').length}</p></Card>
      </div>
      <Tabs value={tab} onChange={setTab} className="mb-4" items={[{ id: 'product', label: 'Product reviews', count: prod.length }, { id: 'seller', label: 'Store reviews', count: store.length }]} />
      {list.length === 0 ? <Empty title="No reviews here yet" body="Reviews from verified buyers will appear after their orders are delivered." /> : (
        <ul className="space-y-3">
          {list.map((r) => {
            const p = myProducts.find((x) => x.id === r.productId)
            return (
              <li key={r.id} className="rounded-xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-sm font-semibold">{r.author}</span>
                  {r.verifiedPurchase && <Badge tone="ok"><BadgeCheck size={12} aria-hidden /> Verified purchase</Badge>}
                  <Badge tone={r.moderation === 'published' ? 'ok' : r.moderation === 'pending' ? 'warn' : 'bad'}>{r.moderation === 'pending' ? 'Pending moderation' : r.moderation === 'removed' ? 'Removed' : 'Published'}</Badge>
                  {r.reported && <Badge tone="warn">Reported by you</Badge>}
                  <span className="ml-auto text-xs text-mute">{fmtDate(r.date)}</span>
                </div>
                {p && <p className="mt-1 text-xs text-mute">on {p.title}</p>}
                <p className="mt-2 text-sm font-semibold">{r.title}</p>
                <p className="text-sm text-graphite">{r.body}</p>
                {r.sellerResponse && <div className="mt-3 rounded-lg bg-fog p-3 text-sm"><p className="text-xs font-semibold text-mute">Your reply</p>{r.sellerResponse}</div>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={r.moderation === 'removed'} onClick={() => openReply(r)}>{r.sellerResponse ? 'Edit reply' : 'Reply'}</Button>
                  <Button size="sm" variant="ghost" disabled={r.reported || r.moderation === 'removed'} onClick={() => setReportFor(r)}><Flag size={13} /> {r.reported ? 'Reported' : 'Report review'}</Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <div className="mt-5"><Notice>Reporting does not hide a review. A BLENDD moderator decides whether it stays up, so the review remains visible until then.</Notice></div>

      <Modal open={!!replyTo} onClose={() => setReplyTo(null)} title={`Reply to ${replyTo?.author}`} footer={<><Button variant="ghost" onClick={() => setReplyTo(null)}>Cancel</Button><Button variant="dark" onClick={submit}>Publish reply</Button></>}>
        <Field label="Your public reply" error={err} hint="Be factual and courteous. Do not share personal details."><textarea autoFocus rows={4} value={reply} onChange={(e) => { setReply(e.target.value); setErr('') }} className={textareaCls(!!err)} /></Field>
      </Modal>
      <ConfirmDialog open={!!reportFor} onClose={() => setReportFor(null)} danger title="Report this review?" confirmLabel="Report review" body="Report reviews that are abusive, off-topic or fake. Moderation stays with the BLENDD team and the review remains visible until they decide." onConfirm={() => { if (reportFor) { patchReview(reportFor.id, { reported: true }); toast('Review reported for moderation', 'info') } }} />
    </>
  )
}
