import { useState } from 'react'
import { ChevronDown, LifeBuoy, Mail } from 'lucide-react'
import { cx } from '../../components/ui'
import { Card, Notice, PageHeader } from '../components/kit'

const FAQ = [
  ['How do I publish my first listing?', 'Go to Add Product, fill in the details for your category, add photos and choose Publish. Until your store is verified, published listings are sent for review before buyers can see them. You can always save a draft.'],
  ['Why is my store marked verification pending?', 'The BLENDD team reviews your business information and documents. Nothing is verified until an admin confirms it. You can draft listings while you wait.'],
  ['When do I get paid?', 'Payouts are not connected in this demo. In a live marketplace you would link a payment provider or bank account, and funds for delivered orders would become available after any hold period. Earnings figures in this workspace are illustrative.'],
  ['What fees does BLENDD charge?', 'The Earnings page shows a demo fee setting. It is not a real rate. Final fees would be confirmed in your seller agreement.'],
  ['How do I ship an order?', 'Open the order, choose Accept & process, then Prepare shipment with the courier and tracking number. The buyer is notified. Mark it delivered once confirmed.'],
  ['A buyer wants to return an item. What now?', 'Return requests appear under Returns & Refunds. Compare the request to your returns policy, then approve the refund or decline with a clear reason.'],
  ['Can I contact buyers outside BLENDD?', 'Please keep conversations in Messages. Customer contact details are not shown to you, and the delivery address is only revealed while you are fulfilling an order.'],
  ['What if a review is unfair?', 'You can reply publicly or report it. Moderators decide whether it stays. Sellers cannot delete reviews.'],
] as const

const RULES = [
  'Only state origin (for example Brazilian), "virgin" or "raw" if you can support the claim with your supplier records.',
  'Use photos of the actual item, or label stock imagery clearly.',
  'Describe lace size, density, length and colour accurately. Colour can differ on screen: say so.',
  'Dispatch within the time shown on your store and share a real tracking number.',
  'Keep communication and payment on the platform.',
]

export default function Help() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <>
      <PageHeader title="Help Centre" sub="Answers for sellers and our listing standards." />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card title="Frequently asked questions" flush>
          <ul className="divide-y divide-line">
            {FAQ.map(([q, a], i) => (
              <li key={q}>
                <button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-semibold hover:bg-fog/60">
                  {q}<ChevronDown size={16} className={cx('shrink-0 transition-transform', open === i && 'rotate-180')} aria-hidden />
                </button>
                {open === i && <p id={`faq-${i}`} className="px-4 pb-4 text-sm text-graphite">{a}</p>}
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-5">
          <Card title="Contact support">
            <p className="text-sm text-mute">Placeholder address for the demo. Replies are not monitored.</p>
            <a href="mailto:sellers@blendd.example?subject=Seller%20support" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline"><Mail size={15} /> sellers@blendd.example</a>
            <p className="mt-2 flex items-center gap-2 text-xs text-mute"><LifeBuoy size={14} /> Live chat is not connected.</p>
          </Card>
          <Card title="Seller guidelines: authenticity & claims">
            <ul className="list-disc space-y-2 pl-5 text-sm text-graphite">{RULES.map((r) => <li key={r}>{r}</li>)}</ul>
          </Card>
          <Notice>Listings that make claims that cannot be supported may be rejected or removed by moderators.</Notice>
        </div>
      </div>
    </>
  )
}
