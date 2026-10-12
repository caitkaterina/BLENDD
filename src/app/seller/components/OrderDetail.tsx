import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Download, Eye, EyeOff, MessageSquare, Printer } from 'lucide-react'
import { Button, ConfirmDialog, Field, Modal, StatusBadge, inputCls, textareaCls } from '../../components/ui'
import { fmtDate, money, selectionLabel, STATUS_LABEL } from '../../lib/format'
import { useSellerData, type SG } from '../lib/useSellerData'
import { Notice, Thumb } from './kit'

const REVEAL_OK = ['paid', 'processing', 'shipped']
const CARRIERS = ['Demo Courier', 'The Courier Guy', 'Aramex', 'Fastway', 'PostNet', 'Other']

export function summaryText(sg: SG, sellerName: string, reveal: boolean) {
  const { order: o, group: g } = sg
  const a = o.address
  return [
    `ORDER SUMMARY (demo) - ${sellerName}`,
    `Order: ${o.ref}`,
    `Placed: ${fmtDate(o.placedAt, true)}`,
    `Status: ${STATUS_LABEL[g.status]}`,
    '',
    `Deliver to: ${a.name}`,
    reveal ? `${a.street}, ${a.suburb}, ${a.city}, ${a.province}, ${a.postalCode}` : `${a.city} (full address shown only while fulfilling)`,
    '',
    'Items:',
    ...g.lines.map((l) => `  ${l.qty} x ${l.title}${selectionLabel(l.selection) ? ` [${selectionLabel(l.selection)}]` : ''} @ ${money(l.unit)} = ${money(l.qty * l.unit)}`),
    '',
    `Items total: ${money(sg.subtotal)}`,
    `Shipping (${g.methodLabel}): ${money(g.shipping)}`,
    `Group total: ${money(sg.total)}`,
    g.tracking ? `Tracking: ${g.tracking.carrier} ${g.tracking.number}` : '',
  ].filter((x, i, arr) => x !== '' || arr[i - 1] !== '').join('\n')
}

export default function OrderDetail({ sg, onClose }: { sg: SG | null; onClose: () => void }) {
  const { sellerId, seller, conversations, updateGroupStatus, startConversation, patchConversation, toast } = useSellerData()
  const nav = useNavigate()
  const [reveal, setReveal] = useState(false)
  const [shipOpen, setShipOpen] = useState(false)
  const [carrier, setCarrier] = useState(CARRIERS[0])
  const [number, setNumber] = useState('')
  const [shipErr, setShipErr] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonErr, setReasonErr] = useState('')
  const [declineOpen, setDeclineOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [declineNote, setDeclineNote] = useState('')
  const [declineErr, setDeclineErr] = useState('')

  if (!sg) return null
  const { order: o, group: g } = sg
  const canReveal = REVEAL_OK.includes(g.status)
  const setStatus = (s: Parameters<typeof updateGroupStatus>[2], note?: string, tracking?: { carrier: string; number: string }) => updateGroupStatus(o.id, sellerId, s, note, tracking)

  const doShip = () => {
    if (!number.trim()) return setShipErr('Tracking number is required.')
    if (!/^[A-Za-z0-9\- ]{4,30}$/.test(number.trim())) return setShipErr('Use 4-30 letters, numbers or dashes.')
    setStatus('shipped', `Shipped via ${carrier}`, { carrier, number: number.trim() })
    setShipOpen(false); setNumber(''); setShipErr('')
  }
  const doCancel = () => {
    if (reason.trim().length < 3) return setReasonErr('Give the buyer a reason.')
    setStatus('cancelled', `Cancelled by seller: ${reason.trim()}`)
    toast('Order cancelled. In production the buyer would be refunded by the payment provider.', 'info')
    setCancelOpen(false); setReason(''); setReasonErr('')
  }
  const doDecline = () => {
    if (declineNote.trim().length < 5) return setDeclineErr('Explain why the return is declined.')
    setStatus('delivered', `Return declined: ${declineNote.trim()}`)
    setDeclineOpen(false); setDeclineNote(''); setDeclineErr('')
  }
  const message = () => {
    const pid = g.lines[0]?.productId
    const ex = conversations.find((c) => c.sellerId === sellerId && c.productId === pid && c.buyerName === o.address.name)
    let id = ex?.id
    if (!id) {
      const text = `Hi ${o.address.name.split(' ')[0]}, this is ${seller?.name} about your order ${o.ref}.`
      // startConversation records the first message as the buyer's, so rewrite it as the seller's opening message.
      id = startConversation(sellerId, pid, text, o.address.name)
      patchConversation(id, { unread: 0, messages: [{ from: 'seller', text, at: new Date().toISOString() }] })
    }
    onClose()
    nav(`/seller/messages?c=${id}`)
  }
  const download = () => {
    const blob = new Blob([summaryText(sg, seller?.name ?? 'Seller', reveal && canReveal)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${o.ref}-summary.txt`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 500)
  }
  const print = () => {
    const w = window.open('', '_blank', 'width=720,height=900')
    if (!w) return toast('Pop-up blocked. Use Download instead.', 'error')
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
    w.document.write(`<title>${esc(o.ref)}</title><pre style="font:14px/1.6 ui-monospace,monospace;padding:24px;white-space:pre-wrap">${esc(summaryText(sg, seller?.name ?? 'Seller', reveal && canReveal))}</pre>`)
    w.document.close(); w.focus(); w.print()
  }

  return (
    <>
      <Modal open onClose={onClose} wide title={`Order ${o.ref}`}>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-mute">Placed {fmtDate(o.placedAt, true)}</p>
            <StatusBadge status={g.status} />
          </div>

          <section aria-label="Items" className="divide-y divide-line rounded-xl border border-line">
            {g.lines.map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Thumb src={l.image} alt="" size={52} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{l.title}</p>
                  {selectionLabel(l.selection) && <p className="text-xs text-mute">{selectionLabel(l.selection)}</p>}
                </div>
                <p className="text-right text-sm">{l.qty} x {money(l.unit)}<br /><span className="font-semibold">{money(l.qty * l.unit)}</span></p>
              </div>
            ))}
            <div className="space-y-1 bg-fog/60 p-3 text-sm">
              <div className="flex justify-between"><span className="text-mute">Items</span><span>{money(sg.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-mute">Shipping ({g.methodLabel})</span><span>{money(g.shipping)}</span></div>
              <div className="flex justify-between font-bold"><span>Total for your items</span><span>{money(sg.total)}</span></div>
            </div>
          </section>

          <section aria-label="Delivery" className="rounded-xl border border-line p-3 text-sm">
            <p className="font-semibold">{o.address.name}</p>
            <p className="text-mute">{o.address.city}</p>
            {canReveal ? (
              <>
                {reveal && <p className="mt-2">{o.address.street}, {o.address.suburb}, {o.address.city}, {o.address.province}, {o.address.postalCode}</p>}
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setReveal((r) => !r)}>{reveal ? <EyeOff size={14} /> : <Eye size={14} />} {reveal ? 'Hide delivery address' : 'Reveal delivery address'}</Button>
                <p className="mt-2 text-xs text-mute">The full address is shown for fulfilment only. Do not store or reuse it for anything else.</p>
              </>
            ) : <p className="mt-1 text-xs text-mute">Full address is only available while an order is being fulfilled (paid, processing or shipped).</p>}
            {g.tracking && <p className="mt-2 text-xs">Tracking: <strong>{g.tracking.carrier}</strong> {g.tracking.number}</p>}
          </section>

          <section aria-label="Actions" className="flex flex-wrap gap-2">
            {g.status === 'paid' && <Button onClick={() => setStatus('processing', 'Seller accepted the order')}>Accept & process</Button>}
            {(g.status === 'paid' || g.status === 'processing') && <Button variant="dark" onClick={() => setShipOpen(true)} disabled={g.status === 'paid'} title={g.status === 'paid' ? 'Accept the order first' : undefined}>Prepare shipment</Button>}
            {g.status === 'shipped' && <Button onClick={() => setStatus('delivered', 'Marked delivered by seller')}>Mark delivered</Button>}
            {['paid', 'processing'].includes(g.status) && <Button variant="outline" onClick={() => setCancelOpen(true)}>Cancel order</Button>}
            {g.status === 'return_requested' && (
              <>
                <Button variant="dark" onClick={() => setRefundOpen(true)}>Approve refund (demo)</Button>
                <Button variant="outline" onClick={() => setDeclineOpen(true)}>Decline return</Button>
              </>
            )}
            <Button variant="ghost" onClick={message}><MessageSquare size={15} /> Message buyer</Button>
            <Button variant="ghost" onClick={print}><Printer size={15} /> Print summary</Button>
            <Button variant="ghost" onClick={download}><Download size={15} /> Download</Button>
          </section>
          {g.status === 'paid' && <p className="-mt-2 text-xs text-mute">Shipment details can be added once you accept the order.</p>}
          {g.status === 'return_requested' && <Notice tone="warn">The buyer asked to return this order. Refunds here are demo-only: no money moves because no payment provider is connected.</Notice>}

          <section aria-label="Tracking history">
            <h3 className="mb-3 font-display text-sm font-bold">History</h3>
            <ol className="relative ml-2 space-y-4 border-l border-line pl-5">
              {[...g.history].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[26px] top-1 size-2.5 rounded-full ring-2 ring-white ${i === 0 ? 'bg-pink outline outline-1 outline-ink' : 'bg-line'}`} />
                  <p className="text-sm font-semibold">{STATUS_LABEL[h.status]}</p>
                  <p className="text-xs text-mute">{fmtDate(h.at, true)}{h.note ? ` · ${h.note}` : ''}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </Modal>

      <Modal open={shipOpen} onClose={() => setShipOpen(false)} title="Prepare shipment" footer={<><Button variant="ghost" onClick={() => setShipOpen(false)}>Cancel</Button><Button variant="dark" onClick={doShip}>Mark as shipped</Button></>}>
        <div className="space-y-4">
          <Field label="Carrier"><select value={carrier} onChange={(e) => setCarrier(e.target.value)} className={inputCls()}>{CARRIERS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Tracking number" error={shipErr}><input autoFocus value={number} onChange={(e) => { setNumber(e.target.value); setShipErr('') }} className={inputCls(!!shipErr)} /></Field>
          <p className="text-xs text-mute">The buyer is notified with these details. No real carrier booking happens in demo mode.</p>
        </div>
      </Modal>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this order?" footer={<><Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep order</Button><Button variant="danger" onClick={doCancel}>Cancel order</Button></>}>
        <Field label="Reason shared with the buyer" error={reasonErr}><textarea rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setReasonErr('') }} className={textareaCls(!!reasonErr)} placeholder="e.g. Item out of stock" /></Field>
      </Modal>

      <ConfirmDialog open={refundOpen} onClose={() => setRefundOpen(false)} danger title="Approve refund (demo)?" confirmLabel="Approve refund" body="The order will be marked as refunded. This is a demo-only status change: no real money is moved and no payment provider is contacted." onConfirm={() => setStatus('refunded', 'Return approved, refund issued (demo only)')} />

      <Modal open={declineOpen} onClose={() => setDeclineOpen(false)} title="Decline this return?" footer={<><Button variant="ghost" onClick={() => setDeclineOpen(false)}>Back</Button><Button variant="dark" onClick={doDecline}>Decline return</Button></>}>
        <Field label="Reason shared with the buyer" error={declineErr} hint="Refer to your returns policy."><textarea rows={3} value={declineNote} onChange={(e) => { setDeclineNote(e.target.value); setDeclineErr('') }} className={textareaCls(!!declineErr)} /></Field>
      </Modal>
    </>
  )
}
