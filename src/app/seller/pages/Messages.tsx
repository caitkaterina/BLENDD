import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowLeft, Ban, Flag, Paperclip, Send } from 'lucide-react'
import { Badge, Button, ConfirmDialog, Empty, cx } from '../../components/ui'
import { fmtDate } from '../../lib/format'
import { useLoading, useSellerData } from '../lib/useSellerData'
import { PageSkeleton } from '../components/kit'

export default function Messages() {
  const loading = useLoading()
  const { myConvos, products, sendMessage, readConversation, patchConversation, toast } = useSellerData()
  const [sp, setSp] = useSearchParams()
  const [text, setText] = useState('')
  const [dlg, setDlg] = useState<'report' | 'block' | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const selId = sp.get('c')

  const sorted = useMemo(() => [...myConvos].sort((a, b) => (b.messages.at(-1)?.at ?? '').localeCompare(a.messages.at(-1)?.at ?? '')), [myConvos])
  const active = sorted.find((c) => c.id === selId) ?? sorted[0]
  const product = active?.productId ? products.find((p) => p.id === active.productId) : undefined

  useEffect(() => {
    if (active && active.unread > 0 && (selId || window.matchMedia('(min-width: 1024px)').matches)) readConversation(active.id)
  }, [active, selId, readConversation])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [active?.messages.length, active?.id])

  if (loading) return <PageSkeleton rows={5} />
  if (sorted.length === 0)
    return <><h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">Messages</h1><Empty title="No conversations yet" body="When a buyer asks about a product or an order, the conversation appears here." /></>

  const send = () => {
    const t = text.trim()
    if (!t || !active) return
    if (t.length > 1000) return toast('Messages are limited to 1,000 characters.', 'error')
    sendMessage(active.id, 'seller', t)
    setText('')
  }
  const unreadTotal = sorted.reduce((a, c) => a + c.unread, 0)

  return (
    <>
      <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">Messages</h1>
      <p className="mb-5 text-sm text-mute">{unreadTotal ? `${unreadTotal} unread` : 'All caught up'}. Keep conversations on BLENDD. Never share payment details or ask buyers to pay outside the platform.</p>
      <div className="grid h-[calc(100vh-17rem)] min-h-[480px] overflow-hidden rounded-xl border border-line bg-white lg:grid-cols-[320px_1fr]">
        <div className={cx('min-h-0 overflow-y-auto border-r border-line', selId ? 'hidden lg:block' : 'block')}>
          <ul className="divide-y divide-line" aria-label="Conversations">
            {sorted.map((c) => {
              const last = c.messages.at(-1)
              const p = products.find((x) => x.id === c.productId)
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => setSp({ c: c.id })} aria-current={active?.id === c.id} className={cx('flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-fog', active?.id === c.id && 'bg-pink-soft/60')}>
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: c.unread ? '#FFBFD9' : 'transparent', boxShadow: c.unread ? '0 0 0 1px #0B0B0F' : 'none' }} aria-label={c.unread ? `${c.unread} unread` : undefined} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2"><span className={cx('truncate text-sm', c.unread ? 'font-bold' : 'font-semibold')}>{c.buyerName}</span><span className="shrink-0 text-[11px] text-mute">{last && fmtDate(last.at)}</span></span>
                      {p && <span className="block truncate text-[11px] text-mute">Re: {p.title}</span>}
                      <span className="block truncate text-xs text-graphite">{last?.from === 'seller' && 'You: '}{last?.text}</span>
                      {(c.blocked || c.reported) && <span className="mt-1 inline-flex gap-1">{c.blocked && <Badge tone="bad">Blocked</Badge>}{c.reported && <Badge tone="warn">Reported</Badge>}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className={cx('min-h-0 flex-col', selId ? 'flex' : 'hidden lg:flex')}>
          {active && (
            <>
              <div className="flex items-center gap-2 border-b border-line px-3 py-3 sm:px-4">
                <button type="button" onClick={() => setSp({})} aria-label="Back to conversations" className="grid size-9 place-items-center rounded-full hover:bg-fog lg:hidden"><ArrowLeft size={18} /></button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{active.buyerName}</p>
                  {product ? <Link to={`/product/${product.id}`} className="block truncate text-xs text-mute underline hover:text-ink">About: {product.title}</Link> : <p className="text-xs text-mute">General enquiry</p>}
                </div>
                <Button size="sm" variant="ghost" disabled={active.reported} onClick={() => setDlg('report')}><Flag size={14} /> <span className="hidden sm:inline">{active.reported ? 'Reported' : 'Report'}</span></Button>
                {active.blocked
                  ? <Button size="sm" variant="outline" onClick={() => { patchConversation(active.id, { blocked: false }); toast('Buyer unblocked', 'info') }}>Unblock</Button>
                  : <Button size="sm" variant="ghost" onClick={() => setDlg('block')}><Ban size={14} /> <span className="hidden sm:inline">Block</span></Button>}
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-fog/50 p-4" role="log" aria-live="polite" aria-label={`Conversation with ${active.buyerName}`}>
                {active.messages.map((m, i) => (
                  <div key={i} className={cx('flex', m.from === 'seller' && 'justify-end')}>
                    <div className={cx('max-w-[80%] rounded-2xl px-3.5 py-2 text-sm', m.from === 'seller' ? 'rounded-br-sm bg-ink text-white' : 'rounded-bl-sm border border-line bg-white')}>
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className={cx('mt-1 text-[10px]', m.from === 'seller' ? 'text-white/60' : 'text-mute')}>{fmtDate(m.at, true)}</p>
                    </div>
                  </div>
                ))}
                <div ref={end} />
              </div>
              {active.blocked ? (
                <p className="border-t border-line bg-white p-4 text-center text-sm text-mute">You blocked this buyer. Unblock to reply.</p>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex items-end gap-2 border-t border-line bg-white p-3">
                  <button type="button" disabled title="Attachments need file storage — not connected" aria-label="Attach file (unavailable: attachments need file storage, not connected)" className="grid size-10 shrink-0 place-items-center rounded-full text-mute opacity-50"><Paperclip size={18} /></button>
                  <textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} aria-label="Write a message" placeholder="Write a reply" className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-line px-3.5 py-2 text-sm outline-none focus:border-ink" />
                  <Button type="submit" size="sm" variant="primary" disabled={!text.trim()} aria-label="Send message" className="!size-10 !px-0"><Send size={16} /></Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog open={dlg === 'report'} onClose={() => setDlg(null)} title="Report this conversation?" confirmLabel="Report" danger body="The BLENDD team can review reported conversations for abuse, spam or off-platform payment requests. In this demo the report is flagged on the conversation only." onConfirm={() => { if (active) { patchConversation(active.id, { reported: true }); toast('Conversation reported', 'info') } }} />
      <ConfirmDialog open={dlg === 'block'} onClose={() => setDlg(null)} title={`Block ${active?.buyerName}?`} confirmLabel="Block buyer" danger body="You will not be able to reply to this buyer until you unblock them. They can still place orders." onConfirm={() => { if (active) { patchConversation(active.id, { blocked: true }); toast('Buyer blocked', 'info') } }} />
    </>
  )
}
