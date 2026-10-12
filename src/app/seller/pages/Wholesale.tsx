import { useState } from 'react'
import { Link } from 'react-router'
import { Badge, Button, Empty, Field, LinkButton, Modal, StatusBadge, ConfirmDialog, inputCls, textareaCls } from '../../components/ui'
import { fmtDate, money } from '../../lib/format'
import type { Enquiry } from '../../lib/types'
import { useLoading, useSellerData } from '../lib/useSellerData'
import { Card, Notice, PageHeader, PageSkeleton, Thumb, td, th } from '../components/kit'

export default function Wholesale() {
  const loading = useLoading()
  const { myEnquiries, myProducts, seller, patchEnquiry, notify, toast } = useSellerData()
  const [quote, setQuote] = useState<Enquiry | null>(null)
  const [price, setPrice] = useState('')
  const [msg, setMsg] = useState('')
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [decline, setDecline] = useState<Enquiry | null>(null)
  if (loading) return <PageSkeleton rows={4} />

  const listings = myProducts.filter((p) => p.wholesale)
  const nameOf = (id?: string) => myProducts.find((p) => p.id === id)?.title
  const open = (e: Enquiry) => { setQuote(e); setPrice(e.quotedPrice ? String(e.quotedPrice) : ''); setMsg(e.response ?? ''); setErrs({}) }
  const send = () => {
    if (!quote) return
    const e: Record<string, string> = {}
    const n = Number(price)
    if (!(n > 0)) e.price = 'Enter a price per unit above R0.'
    if (msg.trim().length < 10) e.msg = 'Add a short message with delivery and payment terms.'
    setErrs(e)
    if (Object.keys(e).length) return
    patchEnquiry(quote.id, { status: 'quoted', quotedPrice: n, response: msg.trim() })
    notify({ audience: 'buyer', kind: 'enquiry', title: 'Quote received', body: `${seller?.name} sent you a quote of ${money(n)} per unit.` })
    toast('Quote sent'); setQuote(null)
  }

  return (
    <>
      <PageHeader title="Wholesale" sub="Respond to bulk enquiries and manage listings with volume pricing." actions={<LinkButton to="/seller/products/new" size="sm" variant="outline">New wholesale listing</LinkButton>} />
      <Card title="Enquiries" className="mb-6" flush>
        {myEnquiries.length === 0 ? <div className="p-4"><Empty title="No enquiries yet" body="Buyers can request quotes from your wholesale listings." /></div> : (
          <ul className="divide-y divide-line">
            {myEnquiries.map((e) => (
              <li key={e.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{e.buyerName}</p><StatusBadge status={e.status} /><span className="ml-auto text-xs text-mute">{fmtDate(e.at, true)}</span></div>
                <p className="mt-0.5 text-xs text-mute">{e.qty} units{nameOf(e.productId) ? ` of ${nameOf(e.productId)}` : ''}</p>
                <p className="mt-2 text-sm">{e.message}</p>
                {e.response && <div className="mt-2 rounded-lg bg-fog p-3 text-sm"><p className="text-xs font-semibold text-mute">Your response{e.quotedPrice ? ` · ${money(e.quotedPrice)}/unit` : ''}</p>{e.response}</div>}
                <div className="mt-3 flex gap-2">
                  {e.status !== 'declined' && <Button size="sm" variant={e.status === 'new' ? 'primary' : 'outline'} onClick={() => open(e)}>{e.status === 'quoted' ? 'Revise quote' : 'Respond with quote'}</Button>}
                  {e.status === 'new' && <Button size="sm" variant="ghost" onClick={() => setDecline(e)}>Decline</Button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Wholesale-enabled listings" flush>
        {listings.length === 0 ? <div className="p-4"><Empty title="No wholesale listings" body="Enable wholesale pricing on a product to accept bulk orders and quote requests." action={<Link to="/seller/products" className="text-sm font-semibold underline">Choose a product to edit</Link>} /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-line bg-fog/60"><tr><th className={th}>Product</th><th className={th}>MOQ</th><th className={th}>Tiers</th><th className={th}>Lead time</th><th className={th}>Status</th><th className={th} /></tr></thead>
              <tbody className="divide-y divide-line">
                {listings.map((p) => (
                  <tr key={p.id}>
                    <td className={td}><div className="flex items-center gap-3"><Thumb src={p.images[0]} alt="" size={36} /><span className="line-clamp-1 font-semibold">{p.title}</span></div></td>
                    <td className={td}>{p.wholesale!.moq}</td>
                    <td className={td + ' text-xs'}>{p.wholesale!.tiers.map((t) => `${t.min}+ @ ${money(t.price)}`).join(' · ')}</td>
                    <td className={td + ' text-xs'}>{p.wholesale!.leadTime}{p.wholesale!.retailAlso && <Badge tone="line" className="ml-1">Retail too</Badge>}</td>
                    <td className={td}><StatusBadge status={p.status} /></td>
                    <td className={td + ' text-right'}><Link to={`/seller/products/${p.id}/edit`} className="text-xs font-semibold underline">Edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {myProducts.some((p) => !p.wholesale) && (
          <div className="border-t border-line p-4">
            <p className="mb-2 text-sm font-semibold">Enable wholesale on another product</p>
            <div className="flex flex-wrap gap-2">
              {myProducts.filter((p) => !p.wholesale && p.status !== 'archived').slice(0, 6).map((p) => <Link key={p.id} to={`/seller/products/${p.id}/edit`} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-ink">{p.title.length > 34 ? p.title.slice(0, 34) + '…' : p.title}</Link>)}
            </div>
            <p className="mt-2 text-xs text-mute">Opens the product editor. Turn on "Offer wholesale pricing" under Retail & wholesale.</p>
          </div>
        )}
      </Card>
      <div className="mt-4"><Notice>Quotes are non-binding messages in the demo. Payment for bulk orders would go through the platform checkout once a payment provider is connected.</Notice></div>

      <Modal open={!!quote} onClose={() => setQuote(null)} title={`Quote for ${quote?.buyerName}`} footer={<><Button variant="ghost" onClick={() => setQuote(null)}>Cancel</Button><Button variant="dark" onClick={send}>Send quote</Button></>}>
        <div className="space-y-4">
          <p className="text-sm text-mute">{quote?.qty} units requested.</p>
          <Field label="Price per unit (ZAR)" error={errs.price}><input autoFocus inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls(!!errs.price)} /></Field>
          {Number(price) > 0 && quote && <p className="text-xs text-mute">Total: <strong>{money(Number(price) * quote.qty)}</strong> excl. delivery</p>}
          <Field label="Message" error={errs.msg}><textarea rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} className={textareaCls(!!errs.msg)} placeholder="Lead time, delivery, validity of the quote" /></Field>
        </div>
      </Modal>
      <ConfirmDialog open={!!decline} onClose={() => setDecline(null)} danger title="Decline this enquiry?" confirmLabel="Decline" body={`${decline?.buyerName} will be told you cannot supply this request.`} onConfirm={() => { if (decline) { patchEnquiry(decline.id, { status: 'declined', response: 'Declined by seller' }); toast('Enquiry declined', 'info') } }} />
    </>
  )
}
