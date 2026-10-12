import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { LinkButton } from '../components/ui'

const SECTIONS: { id: string; title: string; body: string[] }[] = [
  { id: 'delivery', title: 'Delivery', body: ['Every seller sets their own delivery methods, fees and estimated times. You see them on the product page, in your cart and at checkout.', 'If your cart has items from several sellers, they ship separately, so tracking and arrival dates can differ.'] },
  { id: 'returns', title: 'Returns & refunds', body: ['Returns follow the returns policy shown on each seller storefront and product page. Request a return from the order page once an item is delivered.', 'In this prototype no money moves, so refunds are illustrative.'] },
  { id: 'authenticity', title: 'Hair authenticity', body: ['Sellers describe their own hair type, origin and processing. BLENDD displays what the seller supplies and does not independently test hair.', 'Report any listing that seems inaccurate and an administrator will review it.'] },
  { id: 'sellers', title: 'Selling on BLENDD', body: ['Open a shop, complete verification, then publish listings. A verified badge appears only when an administrator has confirmed a seller\'s details.', 'Payouts, fees and verification are demo settings in this prototype.'] },
  { id: 'terms', title: 'Terms of use', body: ['This is a prototype. Terms of use would be published here before launch and reviewed by a legal adviser.'] },
  { id: 'privacy', title: 'Privacy', body: ['In demo mode, all data stays in your browser and is never sent to a server. You can reset it anytime from the footer or your account.', 'A live version would publish a privacy policy aligned with POPIA.'] },
  { id: 'reporting', title: 'Reporting a problem', body: ['Use the flag button on a seller storefront to report a seller, or message support below. Reports are recorded for admin review.'] },
]

const FAQ = [
  ['Is BLENDD selling this hair?', 'No. BLENDD is a marketplace. Every product is sold and shipped by the independent seller named on the listing.'],
  ['Are payments real?', 'No. This is a demo. Checkout never takes card details or real money.'],
  ['Can I buy from multiple sellers at once?', 'Yes. You check out once, and each seller fulfils their part separately.'],
  ['How do I get a wholesale price?', 'Wholesale tier prices apply once your quantity reaches the listing\'s minimum order quantity. For custom volumes, request a quote.'],
]

export default function Help() {
  const { hash } = useLocation()
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }) }, [hash])
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-[220px_1fr] lg:px-8">
      <nav aria-label="Help topics" className="lg:sticky lg:top-32 lg:h-fit"><p className="eyebrow mb-3 text-mute">Topics</p><ul className="flex flex-wrap gap-2 lg:block lg:space-y-1">{SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`} className="block rounded-full bg-fog px-3 py-1.5 text-sm font-semibold hover:bg-pink lg:rounded-md lg:bg-transparent lg:px-0 lg:py-1 lg:hover:bg-transparent lg:hover:underline">{s.title}</a></li>)}<li><a href="#faq" className="block rounded-full bg-fog px-3 py-1.5 text-sm font-semibold hover:bg-pink lg:rounded-md lg:bg-transparent lg:px-0 lg:py-1">FAQs</a></li></ul></nav>
      <div>
        <h1 className="text-5xl font-extrabold">Help centre</h1>
        <div className="mt-8 space-y-10">
          {SECTIONS.map((s) => <section key={s.id} id={s.id} className="scroll-mt-32"><h2 className="text-2xl font-extrabold">{s.title}</h2>{s.body.map((b) => <p key={b} className="mt-3 leading-relaxed text-graphite">{b}</p>)}</section>)}
          <section id="faq" className="scroll-mt-32"><h2 className="text-2xl font-extrabold">FAQs</h2><div className="mt-4 divide-y divide-line rounded-xl border border-line">{FAQ.map(([q, a]) => <details key={q} className="group p-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm text-mute">{a}</p></details>)}</div></section>
          <section className="rounded-xl bg-fog p-6"><h2 className="text-xl font-extrabold">Still stuck?</h2><p className="mt-1 text-sm text-mute">Message a seller about an order from your account. There is no live support channel in the prototype.</p><LinkButton to="/account/messages" variant="dark" className="mt-4">Go to messages</LinkButton></section>
        </div>
      </div>
    </div>
  )
}
