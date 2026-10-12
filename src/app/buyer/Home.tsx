import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, BarChart3, Boxes, CircleDollarSign, FileSearch, Flag, Lock, MessageSquare, Package, Search, ShieldCheck, Sparkles, Store, Tag, Truck } from 'lucide-react'
import { IMG } from '../lib/data'
import { Badge, Img, LinkButton, SectionHead } from '../components/ui'
import StoreDiscovery from './home/StoreDiscovery'
import ProductDiscovery, { WholesaleBand } from './home/ProductDiscovery'

function Arc({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      <path d="M400 0 C 250 40 90 170 20 400 L 400 400 Z" fill="#FFBFD9" />
      <path d="M400 130 C 300 150 210 230 180 400 L 400 400 Z" fill="#0B0B0F" />
    </svg>
  )
}

const AUDIENCES = [
  ['For shoppers', 'Find stores you can follow, not just products.', '#stores'],
  ['For sellers', 'Open a storefront, reach new buyers, manage it all in one place.', '/sell'],
  ['For retailers', 'Compare suppliers, MOQs and tier pricing.', '/wholesale'],
  ['For suppliers', 'List bulk stock and receive quote requests.', '/sell/apply'],
] as const

const SELLER_BENEFITS = [
  [Store, 'A storefront of your own', 'Shareable link, policies, collections and followers.'],
  [Search, 'Be found', 'Listed in search, categories and discovery lists that give new stores room.'],
  [Package, 'One workspace', 'Products, stock, orders and messages together.'],
  [BarChart3, 'Know what works', 'Product and order analytics in your dashboard.'],
  [Tag, 'Promotions', 'Discount codes and collections you control.'],
  [Boxes, 'Wholesale network', 'Find suppliers and be found by retailers.'],
] as const

const SAFEGUARDS = [
  [ShieldCheck, 'Verification you can inspect', 'A badge appears only after an admin marks checks as complete. Each store page explains what was checked.'],
  [Lock, 'Checkout protection (simulated)', 'Payment, holding and payout flows are prototyped. No money moves until a licensed payment provider is connected.'],
  [Truck, 'Delivery and returns up front', 'Fees, dispatch times and return terms are shown per seller before you buy.'],
  [FileSearch, 'Disputes with evidence', 'Buyers and sellers can submit evidence, and an admin reviews it.'],
  [Flag, 'Reporting and moderation', 'Report a listing or store and it joins an admin review queue.'],
  [CircleDollarSign, 'Transparent fees', 'Seller fees are shown in the open once decided. None are final yet.'],
] as const

const GUIDES = [
  ['Guide', 'Choosing a lace size: 4x4, 5x5, 13x4 and 13x6', IMG.bundleOmbre, '/help#authenticity'],
  ['Guide', 'How to read a hair listing: what is claimed and what is checked', IMG.careShelf, '/help#authenticity'],
  ['Guide', 'Buying wholesale for the first time: MOQs, tiers and samples', IMG.marketStock, '/wholesale'],
] as const

function HairFinderEntry() {
  const nav = useNavigate()
  const [texture, setTexture] = useState('')
  const [length, setLength] = useState('')
  const [budget, setBudget] = useState('')
  const go = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (texture) p.set('texture', texture)
    if (length) p.set('length', length)
    if (budget) p.set('under', budget)
    nav(`/shop?${p.toString()}`)
  }
  const sel = 'h-12 w-full rounded-full border border-white/25 bg-graphite px-4 text-sm text-white outline-none focus:border-pink'
  return (
    <section aria-label="BLENDD Hair Finder" className="on-dark relative isolate overflow-hidden rounded-sm bg-ink p-6 text-white lg:p-12">
      <Arc className="pointer-events-none absolute -right-20 -top-20 -z-10 w-72 rotate-180 opacity-90" />
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <p className="eyebrow mb-4 flex items-center gap-2 text-pink"><Sparkles size={14} /> BLENDD Hair Finder <Badge tone="line" className="!border-white/40 !text-white">Prototype</Badge></p>
          <h2 className="text-4xl font-extrabold lg:text-5xl">Tell us the look. We&apos;ll narrow the shelf.</h2>
          <p className="mt-4 max-w-md text-white/70">This prototype matches your answers against real listings using filters. It is not a live AI service, and results are only as accurate as what sellers have listed.</p>
        </div>
        <form onSubmit={go} className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-white/70">Texture<select value={texture} onChange={(e) => setTexture(e.target.value)} className={sel + ' mt-1.5'}><option value="">Any</option>{['Straight', 'Body wave', 'Loose wave', 'Deep wave', 'Curly', 'Kinky curly', 'Coily'].map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="text-xs text-white/70">Length<select value={length} onChange={(e) => setLength(e.target.value)} className={sel + ' mt-1.5'}><option value="">Any</option>{[12, 16, 20, 24, 28].map((l) => <option key={l} value={l}>{l} inches</option>)}</select></label>
          <label className="text-xs text-white/70">Budget<select value={budget} onChange={(e) => setBudget(e.target.value)} className={sel + ' mt-1.5'}><option value="">Any</option>{[1000, 2500, 5000].map((b) => <option key={b} value={b}>Under R{b.toLocaleString('en-ZA')}</option>)}</select></label>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-pink text-sm font-semibold text-ink hover:bg-[#ffa9cb] sm:col-span-3">Show matching listings <ArrowRight size={16} /></button>
        </form>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div>
      <section className="on-dark relative isolate overflow-hidden bg-ink text-white">
        <Img id={IMG.neonWigs} w={1400} h={1100} alt="Wigs on mannequin heads in a shop window" eager className="absolute inset-y-0 right-0 -z-10 w-full opacity-60 lg:w-[58%] lg:opacity-100" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/10 lg:via-ink/40 lg:to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/80 via-transparent to-transparent lg:hidden" />
        <Arc className="pointer-events-none absolute -bottom-24 -right-24 -z-10 hidden w-[520px] lg:block" />
        <div className="mx-auto flex min-h-[580px] max-w-[1440px] flex-col justify-end px-4 pb-14 pt-24 lg:min-h-[680px] lg:px-8 lg:pb-24">
          <p className="caps mb-6 text-[10px] text-pink sm:text-[11px]">The hair industry marketplace<br />South Africa</p>
          <h1 className="max-w-3xl font-display text-[44px] font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-[84px]">Find the hair. Follow the business.</h1>
          <span className="rule-pink mt-8" aria-hidden />
          <p className="mt-6 max-w-lg text-base text-white/75 sm:text-lg">BLENDD brings independent wig stores, makers, wholesalers and manufacturers together, so you can discover who to buy from, and who to build with.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#stores" className="inline-flex h-13 items-center gap-2 rounded-full bg-pink px-6 text-[15px] font-semibold text-ink hover:bg-[#ffa9cb] sm:px-8">Discover stores <ArrowRight size={17} /></a>
            <LinkButton to="/shop" variant="onDark" size="lg">Shop products</LinkButton>
            <LinkButton to="/wholesale" variant="onDark" size="lg">Explore wholesale</LinkButton>
          </div>
        </div>
      </section>

      <section aria-label="Who BLENDD is for" className="on-dark border-t border-white/10 bg-ink text-white">
        <ul className="mx-auto grid max-w-[1440px] sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {AUDIENCES.map(([t, b, to], i) => (
            <li key={t} className={'border-white/15 ' + (i > 0 ? 'border-t sm:border-t-0 ' : '') + (i % 2 ? 'sm:border-l ' : '') + (i > 1 ? 'sm:border-t lg:border-t-0 ' : '') + (i > 0 ? 'lg:border-l' : '')}>
              {to.startsWith('#') ? <a href={to} className="group block px-5 py-6 hover:bg-white/5"><AudienceInner t={t} b={b} /></a> : <Link to={to} className="group block px-5 py-6 hover:bg-white/5"><AudienceInner t={t} b={b} /></Link>}
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto max-w-[1440px] space-y-20 px-4 py-14 lg:space-y-28 lg:px-8 lg:py-20">
        <StoreDiscovery />
        <HairFinderEntry />
        <ProductDiscovery />
        <WholesaleBand />

        <section aria-label="Sell on BLENDD" className="grid gap-10 rounded-sm bg-pink p-6 lg:grid-cols-[1fr_1.3fr] lg:p-14">
          <div>
            <p className="eyebrow mb-4">For sellers and suppliers</p>
            <h2 className="text-4xl font-extrabold lg:text-5xl">Reach buyers beyond your followers.</h2>
            <p className="mt-4 max-w-md">Retailers, wig makers, wholesalers, distributors and manufacturers can open a store free in this demo. Fees are not final and will be published before launch.</p>
            <div className="mt-7 flex flex-wrap gap-3"><LinkButton to="/sell/apply" variant="dark" size="lg">Open your store</LinkButton><LinkButton to="/sell" variant="outline" size="lg">See how it works</LinkButton></div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SELLER_BENEFITS.map(([Icon, t, b]) => <li key={t} className="rounded-sm bg-white/60 p-5"><Icon size={22} /><p className="mt-3 font-bold">{t}</p><p className="mt-1 text-sm text-ink/70">{b}</p></li>)}
          </ul>
        </section>

        <section aria-label="Guides">
          <SectionHead eyebrow="Learn" title="Guides for buyers and sellers" />
          <p className="-mt-3 mb-6 max-w-2xl text-sm text-mute">General educational advice, not verified platform data. Full guides are coming. Links open the closest existing page.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {GUIDES.map(([k, t, img, to]) => (
              <Link key={t} to={to} className="group block">
                <Img id={img} w={640} h={440} alt="" className="aspect-[4/3] rounded-sm" />
                <p className="eyebrow mt-4 text-mute">{k}</p>
                <h3 className="mt-2 text-xl font-bold leading-snug">{t}</h3>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold link-pink">Read more <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-label="Trust and protection" className="rounded-sm bg-fog p-6 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="eyebrow mb-4 text-mute">Trust</p>
              <h2 className="text-4xl font-extrabold">What protects you here, and what is still a prototype.</h2>
              <p className="mt-4 text-sm text-mute">BLENDD does not test hair or guarantee outcomes. We show what sellers claim, what an admin has checked, and how to raise a problem.</p>
              <Link to="/help" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold link-pink"><MessageSquare size={14} /> Visit the help centre</Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {SAFEGUARDS.map(([Icon, t, b]) => <li key={t} className="rounded-sm bg-white p-5"><Icon size={20} strokeWidth={1.5} /><p className="mt-3 font-bold">{t}</p><p className="mt-1 text-sm text-mute">{b}</p></li>)}
            </ul>
          </div>
        </section>

        <div className="text-center text-xs text-mute"><Badge tone="line">Prototype</Badge> <span className="ml-2">All stores, products, ratings and reviews are demonstration data. Photography is stock imagery. No real payments are taken.</span></div>
      </div>
    </div>
  )
}

function AudienceInner({ t, b }: { t: string; b: string }) {
  return (
    <>
      <span className="caps flex items-center justify-between text-[10px] text-pink">{t}<ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
      <span className="mt-2 block text-sm text-white/70">{b}</span>
    </>
  )
}
