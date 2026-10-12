import { useState } from 'react'
import { ArrowRight, Check, ChevronDown, ClipboardCheck, MessagesSquare, PackageOpen, Store } from 'lucide-react'
import { Img, LinkButton, cx } from '../components/ui'
import { IMG } from '../lib/data'
import { useStore } from '../store/store'
import { SELLER_TYPE_LABEL } from './pages/Settings'

const STEPS = [
  { icon: Store, t: 'Open a shop', d: 'Apply with your business details. Drafting is free and quick.' },
  { icon: PackageOpen, t: 'List your products', d: 'Add wigs, bundles, closures, tools or wholesale ranges with accurate specs and real photos.' },
  { icon: MessagesSquare, t: 'Reach customers', d: 'Buyers browse by texture, length, lace and price, and can message you before they buy.' },
  { icon: ClipboardCheck, t: 'Manage sales', d: 'Fulfil orders, track stock, answer reviews and see earnings from one workspace.' },
]
const TYPES: [keyof typeof SELLER_TYPE_LABEL, string][] = [
  ['reseller', 'Sell what you source, in retail quantities.'],
  ['retailer', 'A shop front with a steady catalogue.'],
  ['wholesaler', 'Volume pricing, MOQs and quotes for salons and resellers.'],
  ['manufacturer', 'Your own brand, private label or made-to-order ranges.'],
]
const FAQ = [
  ['Does it cost anything to apply?', 'Applying and drafting listings costs nothing in this demo. A marketplace fee applies to sales; the figure shown below is a demo setting, not a real rate.'],
  ['How long does verification take?', 'Your application is reviewed by the BLENDD team. Nothing is verified until an admin confirms it, and this demo does not promise a turnaround time.'],
  ['Can I list before I am verified?', 'You can create drafts straight away. Listings you publish are reviewed before they go live while your store is unverified.'],
  ['When can I receive payouts?', 'Payouts need a payment provider or bank link confirmed by the backend. That is separate from drafting listings, and it is not connected in demo mode.'],
  ['Can I sell hair claims like virgin or raw?', 'Only if you can support the claim. Origin and processing fields are optional so you never have to guess.'],
]

export default function SellLanding() {
  const { settings } = useStore()
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div>
      <section className="on-dark relative overflow-hidden bg-ink text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="eyebrow text-pink">Sell on BLENDD</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">Your hair business, <span className="text-pink">one shop</span> away.</h1>
            <p className="mt-6 max-w-xl text-base text-white/75 sm:text-lg">BLENDD is a hair marketplace for South Africa. Open a store for wigs, bundles, closures, tools or wholesale supply, and run it from a workspace built for sellers.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton to="/sell/apply" size="lg">Start your application <ArrowRight size={18} /></LinkButton>
              <a href="#how" className="inline-flex h-13 items-center rounded-full border border-white/40 px-8 text-[15px] font-semibold hover:bg-white hover:text-ink">See how it works</a>
            </div>
            <p className="mt-4 text-xs text-white/50">Demo marketplace. Nothing is submitted to a real server.</p>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            <Img id={IMG.extWall} w={600} h={760} alt="Hair extensions on a shop display wall" className="aspect-[3/4] rounded-2xl" eager />
            <Img id={IMG.salonHead} w={600} h={760} alt="Wig on a mannequin head" className="mt-10 aspect-[3/4] rounded-2xl" eager />
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <p className="eyebrow text-mute">How it works</p>
        <h2 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">From application to first order in four steps</h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="rounded-2xl border border-line p-6">
              <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-full bg-ink text-pink"><s.icon size={20} /></span><span className="font-display text-4xl font-extrabold text-line">{i + 1}</span></div>
              <h3 className="mt-5 text-xl font-bold tracking-tight">{s.t}</h3>
              <p className="mt-2 text-sm text-mute">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-fog">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-mute">Before you start</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight">What you need, and when</h2>
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl bg-white p-6"><h3 className="text-lg font-bold">Before publishing listings</h3><ul className="mt-3 space-y-2 text-sm text-graphite">{['A submitted application with business details', 'Accurate product details and photos of what you actually sell', 'Review by the BLENDD team while your store is unverified'].map((x) => <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0" />{x}</li>)}</ul></div>
              <div className="rounded-2xl bg-white p-6"><h3 className="text-lg font-bold">Before receiving payouts</h3><ul className="mt-3 space-y-2 text-sm text-graphite">{['Verification confirmed by an admin', 'A payment provider or bank account linked and confirmed by the backend', 'Not required for drafting listings'].map((x) => <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0" />{x}</li>)}</ul></div>
            </div>
          </div>
          <div>
            <p className="eyebrow text-mute">Seller types</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight">Whatever your model</h2>
            <ul className="mt-8 divide-y divide-line rounded-2xl bg-white">{TYPES.map(([k, d]) => <li key={k} className="p-5"><p className="font-bold">{SELLER_TYPE_LABEL[k]}</p><p className="text-sm text-mute">{d}</p></li>)}</ul>
            <div className="mt-4 rounded-2xl bg-ink p-6 text-white"><p className="eyebrow text-pink">Fees</p><p className="mt-2 font-display text-4xl font-extrabold">{settings.feePercent}%</p><p className="mt-1 text-sm text-white/70">Marketplace fee on sales, a <strong>demo fee setting</strong>. It is not a real rate and may change before launch.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <h2 className="text-4xl font-extrabold tracking-tight">Questions</h2>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {FAQ.map(([q, a], i) => (
            <li key={q}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left font-semibold">{q}<ChevronDown size={18} className={cx('shrink-0 transition-transform', open === i && 'rotate-180')} aria-hidden /></button>
              {open === i && <p className="pb-4 text-sm text-graphite">{a}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="on-dark bg-ink px-5 py-16 text-center text-white sm:px-8">
        <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">Ready to open your <span className="text-pink">BLENDD</span> shop?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/70">Eight short steps. Your progress is saved as you go.</p>
        <div className="mt-6 flex justify-center"><LinkButton to="/sell/apply" size="lg">Apply to sell</LinkButton></div>
      </section>
    </div>
  )
}
