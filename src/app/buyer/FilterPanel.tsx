import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { CATEGORIES, LACE_TYPES, REGION, TEXTURES } from '../lib/config'
import type { Filters } from '../lib/filters'
import { EMPTY_FILTERS } from '../lib/filters'
import { cx } from '../components/ui'

function Section({ title, children, open: o = true }: { title: string; children: ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(o)
  return (
    <div className="border-b border-line py-4">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between text-left text-sm font-bold">{title}<ChevronDown size={16} className={cx('transition-transform', open && 'rotate-180')} /></button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

function toggle<T>(arr: T[], v: T) { return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] }

function Checks<T extends string | number>({ options, value, onChange, fmt = (v: T) => String(v) }: { options: T[]; value: T[]; onChange: (v: T[]) => void; fmt?: (v: T) => string }) {
  return (
    <ul className="space-y-1.5">
      {options.map((o) => (
        <li key={String(o)}>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" checked={value.includes(o)} onChange={() => onChange(toggle(value, o))} className="size-4 accent-ink" />
            {fmt(o)}
          </label>
        </li>
      ))}
    </ul>
  )
}

function Chips<T extends string | number>({ options, value, onChange, fmt = (v: T) => String(v) }: { options: T[]; value: T[]; onChange: (v: T[]) => void; fmt?: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={String(o)} aria-pressed={value.includes(o)} onClick={() => onChange(toggle(value, o))} className={cx('rounded-full border px-3 py-1 text-xs font-semibold transition-colors', value.includes(o) ? 'border-pink bg-pink text-ink' : 'border-line hover:border-ink')}>{fmt(o)}</button>
      ))}
    </div>
  )
}

export default function FilterPanel({ f, set, lockCategory }: { f: Filters; set: (f: Filters) => void; lockCategory?: boolean }) {
  const p = <K extends keyof Filters>(k: K, v: Filters[K]) => set({ ...f, [k]: v })
  const num = (s: string) => (s === '' ? null : Math.max(0, Number(s)))
  return (
    <div>
      {!lockCategory && (
        <Section title="Product type">
          <Checks options={CATEGORIES.map((c) => c.id)} value={f.categories} onChange={(v) => p('categories', v)} fmt={(id) => CATEGORIES.find((c) => c.id === id)!.label} />
        </Section>
      )}
      <Section title="Price (ZAR)">
        <div className="flex items-center gap-2">
          <input aria-label="Minimum price" inputMode="numeric" placeholder="Min" value={f.priceMin ?? ''} onChange={(e) => p('priceMin', num(e.target.value))} className="h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-ink" />
          <span className="text-mute">–</span>
          <input aria-label="Maximum price" inputMode="numeric" placeholder="Max" value={f.priceMax ?? ''} onChange={(e) => p('priceMax', num(e.target.value))} className="h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-ink" />
        </div>
        <div className="mt-2.5"><Chips options={[500, 1000, 2500, 5000]} value={f.priceMax != null && [500, 1000, 2500, 5000].includes(f.priceMax) ? [f.priceMax] : []} onChange={(v) => set({ ...f, priceMin: null, priceMax: v.length ? v[v.length - 1] : null })} fmt={(n) => `Under R${n.toLocaleString('en-US')}`} /></div>
      </Section>
      <Section title="Texture"><Checks options={TEXTURES} value={f.textures} onChange={(v) => p('textures', v)} /></Section>
      <Section title="Length" open={false}><Chips options={[10, 12, 14, 16, 18, 20, 22, 24, 26, 28]} value={f.lengths} onChange={(v) => p('lengths', v)} fmt={(n) => `${n}"`} /></Section>
      <Section title="Hair type" open={false}><Checks options={['human', 'synthetic', 'blended'] as const} value={f.hairTypes} onChange={(v) => p('hairTypes', v as Filters['hairTypes'])} fmt={(s) => `${s[0].toUpperCase()}${s.slice(1)} hair`} /></Section>
      <Section title="Colour" open={false}><Chips options={['Natural black', 'Dark brown', '1B', '#2 darkest brown', 'Black', 'Pink']} value={f.colors} onChange={(v) => p('colors', v)} /></Section>
      <Section title="Lace type & size" open={false}><Chips options={LACE_TYPES} value={f.lace} onChange={(v) => p('lace', v)} /></Section>
      <Section title="Seller rating" open={false}>
        <select aria-label="Minimum seller rating" value={f.minSellerRating} onChange={(e) => p('minSellerRating', Number(e.target.value))} className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm">
          <option value={0}>Any rating</option><option value={4}>4.0 and up</option><option value={4.5}>4.5 and up</option><option value={4.7}>4.7 and up</option>
        </select>
      </Section>
      <Section title="Seller type" open={false}>
        <Checks options={['reseller', 'retailer', 'wholesaler', 'manufacturer'] as const} value={f.sellerTypes} onChange={(v) => p('sellerTypes', v as Filters['sellerTypes'])} fmt={(s) => ({ reseller: 'Independent reseller', retailer: 'Retail vendor', wholesaler: 'Wholesale supplier', manufacturer: 'Manufacturer / brand' })[s]} />
      </Section>
      <Section title="Retail or wholesale">
        <div className="space-y-1.5">
          {([['all', 'All listings'], ['retail', 'Retail'], ['wholesale', 'Wholesale / bulk']] as const).map(([v, l]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2.5 text-sm"><input type="radio" name="chan" checked={f.channel === v} onChange={() => p('channel', v)} className="size-4 accent-ink" />{l}</label>
          ))}
        </div>
        <label className="mt-3 block text-xs font-semibold text-mute">Minimum order quantity (up to)
          <select value={f.maxMoq ?? ''} onChange={(e) => p('maxMoq', e.target.value ? Number(e.target.value) : null)} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal text-ink">
            <option value="">Any</option><option value={1}>1 unit</option><option value={5}>5 units</option><option value={10}>10 units</option><option value={25}>25 units</option>
          </select>
        </label>
      </Section>
      <Section title="Availability"><label className="flex cursor-pointer items-center gap-2.5 text-sm"><input type="checkbox" checked={f.inStockOnly} onChange={(e) => p('inStockOnly', e.target.checked)} className="size-4 accent-ink" />In stock only</label></Section>
      <Section title="Dispatch location" open={false}><Checks options={REGION.provinces.filter((x) => ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Free State'].includes(x))} value={f.provinces} onChange={(v) => p('provinces', v)} /></Section>
      <Section title="Delivery options" open={false}><Checks options={['express', 'collect', 'free']} value={f.delivery} onChange={(v) => p('delivery', v)} fmt={(s) => ({ express: 'Express courier offered', collect: 'Collect from seller', free: 'Free standard delivery over a threshold' })[s] ?? s} /></Section>
      <button onClick={() => set({ ...EMPTY_FILTERS, sort: f.sort, categories: lockCategory ? f.categories : [] })} className="mt-4 w-full rounded-full border border-ink py-2.5 text-sm font-semibold hover:bg-ink hover:text-white">Clear all filters</button>
    </div>
  )
}
