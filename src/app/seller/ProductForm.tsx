import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Empty, ErrorState, Field, LinkButton, Toggle, inputCls, textareaCls, cx } from '../components/ui'
import ProductCard from '../components/ProductCard'
import { CATEGORIES, CONSTRUCTIONS, LACE_TYPES, TEXTURES } from '../lib/config'
import { money, nowIso, uid } from '../lib/format'
import { discountPct } from '../lib/pricing'
import type { CategoryId, HairType, Product } from '../lib/types'
import { useLoading, useSellerData } from './lib/useSellerData'
import { CAP_SIZES, CATEGORY_FIELDS, DENSITIES, LACE_KINDS, LACE_SIZES, LENGTH_CHOICES, emptyForm, formFromProduct, toProduct, type FieldKey, type FormState } from './lib/productModel'
import { Card, Chip, PageHeader, PageSkeleton, selectCls } from './components/kit'
import ImageUploader from './components/ImageUploader'
import TagInput from './components/TagInput'
import WholesaleBlock, { validateWholesale } from './components/WholesaleBlock'

const HELP_CLAIM = 'Only state this if you can support the claim.'
const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export default function ProductForm() {
  const { id } = useParams()
  const loading = useLoading(300)
  const { myProducts, products, sellerId, verified, upsertProduct, toast } = useSellerData()
  const existing = id ? myProducts.find((p) => p.id === id) : undefined
  if (loading) return <PageSkeleton rows={6} />
  if (id && !existing)
    return <Empty title="Listing not found" body="This listing does not exist or belongs to another store." action={<LinkButton to="/seller/products" variant="dark">Back to products</LinkButton>} />
  if (!sellerId) return <ErrorState title="No store linked" />
  return <FormBody key={id ?? 'new'} existing={existing} sellerId={sellerId} verified={verified} all={products} onSave={upsertProduct} toast={toast} />
}

function FormBody({ existing, sellerId, verified, all, onSave, toast }: { existing?: Product; sellerId: string; verified: boolean; all: Product[]; onSave: (p: Product) => void; toast: (t: string, k?: 'ok' | 'error' | 'info') => void }) {
  const nav = useNavigate()
  const [f, setF] = useState<FormState>(() => (existing ? formFromProduct(existing) : emptyForm()))
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => { setF((s) => ({ ...s, [k]: v })); setErrs((e) => (e[k as string] ? { ...e, [k]: '' } : e)) }
  const fields: FieldKey[] = f.category ? CATEGORY_FIELDS[f.category] : []
  const has = (k: FieldKey) => fields.includes(k)
  const wholesaleOn = f.category === 'wholesale' || f.wholesaleOn
  const wholesaleOnly = wholesaleOn && !f.wh.retailAlso
  const laceSizes = (f.category && LACE_SIZES[f.category]) || LACE_TYPES

  const base: Product = existing ?? { id: uid('p'), sellerId, title: '', category: 'accessories', images: [], price: 0, sku: '', stock: 0, lowStockAt: 5, colors: [], lengths: [], options: [], description: '', specs: {}, status: 'draft', createdAt: nowIso().slice(0, 10), popularity: 50, reviewCount: 0, demo: false }
  const preview = useMemo(() => {
    const p = toProduct(f, base, { sellerId, status: 'published' })
    return { ...p, title: p.title || 'Your product title', images: p.images }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f])

  const validate = (publish: boolean) => {
    const e: Record<string, string> = {}
    if (f.title.trim().length < 5) e.title = 'Give the listing a clear title (at least 5 characters).'
    if (!f.category) e.category = 'Choose a category.'
    if (f.description.trim().length < 20) e.description = 'Describe the product in at least 20 characters. Be accurate about what the buyer receives.'
    if (!f.sku.trim()) e.sku = 'SKU is required.'
    else if (all.some((p) => p.sku.toLowerCase() === f.sku.trim().toLowerCase() && p.id !== base.id && p.sellerId === sellerId)) e.sku = 'You already use this SKU on another listing.'
    if (!wholesaleOnly) {
      const price = Number(f.price)
      if (!f.price.trim() || !(price > 0)) e.price = 'Enter a price above R0.'
      if (f.compareAt.trim()) {
        if (!(Number(f.compareAt) > price)) e.compareAt = 'Compare-at price must be higher than the price, otherwise no discount is shown.'
      }
    }
    const stock = Number(f.stock)
    if (f.stock.trim() === '' || !Number.isInteger(stock) || stock < 0) e.stock = 'Stock must be a whole number, 0 or more.'
    const low = Number(f.lowStockAt)
    if (f.lowStockAt.trim() === '' || !Number.isInteger(low) || low < 0) e.lowStockAt = 'Use a whole number, 0 or more.'
    if (has('hair') && !f.hairType) e.hairType = 'Select the hair type.'
    if (has('texture') && !f.texture && f.category !== 'wholesale') e.texture = 'Select a texture.'
    if (has('construction') && !f.construction) e.construction = 'Select the construction.'
    if (has('lace') && !f.lace && (f.category === 'closures' || f.category === 'frontals' || f.category === 'wigs')) e.lace = 'Select the lace size.'
    if (has('lengths') && f.category !== 'wholesale' && !f.lengths.length) e.lengths = 'Select at least one length.'
    if (has('material') && !f.material.trim()) e.material = 'State the material.'
    f.lengths.forEach((l) => { const d = f.deltas[l]; if (d && Number.isNaN(Number(d))) e[`delta${l}`] = 'Enter a number.' })
    f.custom.forEach((c, i) => {
      if (!c.label.trim() && c.values.some((v) => v.value.trim())) e[`custom${i}`] = 'Name this option.'
      else if (c.label.trim() && !c.values.some((v) => v.value.trim())) e[`custom${i}`] = 'Add at least one value.'
      else if (c.values.some((v) => v.delta && Number.isNaN(Number(v.delta)))) e[`custom${i}`] = 'Price changes must be numbers.'
    })
    if (publish && f.images.length === 0) e.images = 'Add at least one photo before publishing. You can save as a draft without photos.'
    if (wholesaleOn) Object.assign(e, validateWholesale(f.wh))
    return e
  }

  const save = (intent: 'draft' | 'publish' | 'keep') => {
    const publish = intent === 'publish' || (intent === 'keep' && (existing?.status === 'published' || existing?.status === 'pending_review'))
    const e = validate(publish)
    setErrs(e)
    if (Object.keys(e).length) {
      toast('Please fix the highlighted fields.', 'error')
      setTimeout(() => document.querySelector('[role=alert]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50)
      return
    }
    let status: Product['status'] = existing?.status ?? 'draft'
    if (intent === 'draft') status = 'draft'
    if (intent === 'publish') status = verified ? 'published' : 'pending_review'
    setSaving(true)
    onSave(toProduct(f, base, { sellerId, status }))
    if (intent === 'publish' && !verified) toast('Saved and sent for review. Your store is not verified yet, so listings are reviewed before going live.', 'info')
    else toast(status === 'published' ? 'Listing saved and live' : existing ? 'Changes saved' : 'Draft saved')
    nav('/seller/products')
  }

  const price = Number(f.price)
  const dp = !wholesaleOnly ? discountPct({ price, compareAt: Number(f.compareAt) || undefined } as Product) : 0

  return (
    <>
      <PageHeader title={existing ? 'Edit product' : 'Add product'} sub="The form adapts to the category you choose. Save a draft any time; publishing may need review." actions={<LinkButton to="/seller/products" variant="ghost" size="sm">Cancel</LinkButton>} />
      <form noValidate onSubmit={(e) => { e.preventDefault(); save(existing ? 'keep' : 'draft') }} className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" error={errs.title} className="sm:col-span-2"><input value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={120} className={inputCls(!!errs.title)} placeholder="e.g. 13x4 lace front body wave wig, 180% density" /></Field>
              <Field label="Category" error={errs.category}>
                <select value={f.category} onChange={(e) => set('category', e.target.value as CategoryId)} className={selectCls(!!errs.category)}>
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="SKU" error={errs.sku}><input value={f.sku} onChange={(e) => set('sku', e.target.value)} className={inputCls(!!errs.sku)} placeholder="LUMI-WG-001" /></Field>
              <Field label="Description" error={errs.description} className="sm:col-span-2" hint="Say exactly what is included and what is not. Photos should show the real item.">
                <textarea rows={5} value={f.description} onChange={(e) => set('description', e.target.value)} className={textareaCls(!!errs.description)} />
              </Field>
            </div>
          </Card>

          <Card title={f.category ? `${CATEGORIES.find((c) => c.id === f.category)?.label} details` : 'Product details'}>
            {!f.category ? <p className="text-sm text-mute">Choose a category above to see the relevant attributes.</p> : (
              <div className="grid gap-4 sm:grid-cols-2">
                {has('hair') && (
                  <Field label="Hair type" error={errs.hairType}>
                    <select value={f.hairType} onChange={(e) => set('hairType', e.target.value as HairType)} className={selectCls(!!errs.hairType)}>
                      <option value="">Select</option><option value="human">Human hair</option><option value="synthetic">Synthetic</option><option value="blended">Blended</option>
                    </select>
                  </Field>
                )}
                {has('texture') && (
                  <Field label="Texture" error={errs.texture}>
                    <select value={f.texture} onChange={(e) => set('texture', e.target.value)} className={selectCls(!!errs.texture)}><option value="">Select</option>{TEXTURES.map((t) => <option key={t}>{t}</option>)}</select>
                  </Field>
                )}
                {has('construction') && (
                  <Field label="Construction" error={errs.construction}>
                    <select value={f.construction} onChange={(e) => set('construction', e.target.value)} className={selectCls(!!errs.construction)}><option value="">Select</option>{CONSTRUCTIONS.map((t) => <option key={t}>{t}</option>)}</select>
                  </Field>
                )}
                {has('lace') && (
                  <Field label="Lace size" error={errs.lace}>
                    <select value={f.lace} onChange={(e) => set('lace', e.target.value)} className={selectCls(!!errs.lace)}><option value="">Select</option>{laceSizes.map((t) => <option key={t}>{t}</option>)}</select>
                  </Field>
                )}
                {has('density') && <Field label="Density"><select value={f.density} onChange={(e) => set('density', e.target.value)} className={selectCls()}><option value="">Select</option>{DENSITIES.map((t) => <option key={t}>{t}</option>)}</select></Field>}
                {has('material') && <Field label="Material" error={errs.material}><input value={f.material} onChange={(e) => set('material', e.target.value)} className={inputCls(!!errs.material)} placeholder="e.g. Satin, ABS plastic" /></Field>}
                {has('pieces') && <Field label="Pieces in set" hint="Optional."><input value={f.pieces} onChange={(e) => set('pieces', e.target.value)} className={inputCls()} placeholder="7" /></Field>}
                {has('origin') && <Field label="Origin (optional)" hint={HELP_CLAIM}><input value={f.origin} onChange={(e) => set('origin', e.target.value)} className={inputCls()} placeholder="e.g. Brazilian" /></Field>}
                {has('processing') && <Field label="Processing (optional)" hint={HELP_CLAIM + ' Terms like virgin or raw need to be accurate.'}><input value={f.processing} onChange={(e) => set('processing', e.target.value)} className={inputCls()} placeholder="e.g. Steam processed" /></Field>}
                {has('lengths') && (
                  <div className="sm:col-span-2">
                    <p className="mb-1.5 text-sm font-semibold">Available lengths (inches)</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Available lengths">
                      {LENGTH_CHOICES.map((l) => <Chip key={l} active={f.lengths.includes(l)} onClick={() => set('lengths', toggleIn(f.lengths, l).sort((a, b) => a - b))}>{l}"</Chip>)}
                    </div>
                    {errs.lengths && <p role="alert" className="mt-1 text-xs font-medium text-bad">{errs.lengths}</p>}
                  </div>
                )}
                {has('colors') && (
                  <div className="sm:col-span-2">
                    <p className="mb-1.5 text-sm font-semibold">Colours</p>
                    <TagInput label="Add colour" tags={f.colors} onChange={(t) => set('colors', t)} placeholder="Type a colour and press Enter, e.g. Natural black" />
                    <p className="mt-1 text-xs text-mute">More than one colour creates a colour choice for buyers.</p>
                  </div>
                )}
                {has('capSize') && (
                  <div className="sm:col-span-2">
                    <p className="mb-1.5 text-sm font-semibold">Cap sizes</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Cap sizes">{CAP_SIZES.map((c) => <Chip key={c} active={f.capSizes.includes(c)} onClick={() => set('capSizes', toggleIn(f.capSizes, c))}>{c}</Chip>)}</div>
                  </div>
                )}
                {has('laceType') && (
                  <div className="sm:col-span-2">
                    <p className="mb-1.5 text-sm font-semibold">Lace types offered</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Lace types">{LACE_KINDS.map((c) => <Chip key={c} active={f.laceTypes.includes(c)} onClick={() => set('laceTypes', toggleIn(f.laceTypes, c))}>{c}</Chip>)}</div>
                    <p className="mt-1 text-xs text-mute">Choose two or more to let buyers pick.</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="Pricing & stock">
            <div className="grid gap-4 sm:grid-cols-2">
              {wholesaleOnly ? (
                <p className="rounded-lg bg-fog px-3 py-2.5 text-sm text-graphite sm:col-span-2">Wholesale-only listing: the price shown to buyers starts at your first tier price ({money(Number(f.wh.tiers[0]?.price) || 0)}). Turn on "Also sell single units at retail price" in the wholesale block to set a retail price.</p>
              ) : (
                <>
                  <Field label="Price (ZAR)" error={errs.price}><input inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} className={inputCls(!!errs.price)} placeholder="749" /></Field>
                  <Field label="Compare-at price (optional)" error={errs.compareAt} hint={dp > 0 ? `Buyers will see ${dp}% off.` : 'The original price. A discount is only shown when this is higher than the price.'}>
                    <input inputMode="decimal" value={f.compareAt} onChange={(e) => set('compareAt', e.target.value)} className={inputCls(!!errs.compareAt)} placeholder="899" />
                  </Field>
                </>
              )}
              <Field label="Stock on hand" error={errs.stock}><input inputMode="numeric" value={f.stock} onChange={(e) => set('stock', e.target.value)} className={inputCls(!!errs.stock)} /></Field>
              <Field label="Low-stock threshold" error={errs.lowStockAt} hint="You are alerted at or below this level."><input inputMode="numeric" value={f.lowStockAt} onChange={(e) => set('lowStockAt', e.target.value)} className={inputCls(!!errs.lowStockAt)} /></Field>
            </div>
          </Card>

          <Card title="Option builder" action={<span className="text-xs text-mute">Generates the choices buyers see</span>}>
            {has('lengths') && f.lengths.length > 0 && (
              <div className="mb-5">
                <p className="mb-1 text-sm font-semibold">Length price changes</p>
                <p className="mb-2 text-xs text-mute">Added to the base price for each length. Use 0 for no change, or a negative number for a discount.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {f.lengths.map((l) => (
                    <label key={l} className="block text-xs">
                      <span className="mb-1 block font-semibold">{l}" (R)</span>
                      <input inputMode="decimal" aria-label={`Price change for ${l} inches`} value={f.deltas[l] ?? ''} placeholder="0" onChange={(e) => { set('deltas', { ...f.deltas, [l]: e.target.value }) }} className={cx(inputCls(!!errs[`delta${l}`]), '!h-9')} />
                      {errs[`delta${l}`] && <span role="alert" className="text-bad">{errs[`delta${l}`]}</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <p className="mb-2 text-sm font-semibold">Custom options</p>
            {f.custom.length === 0 && <p className="mb-2 text-xs text-mute">Add options such as "Parting" or "Pack size".</p>}
            <div className="space-y-3">
              {f.custom.map((c, i) => (
                <div key={i} className="rounded-lg border border-line p-3">
                  <div className="flex items-center gap-2">
                    <input aria-label="Option name" placeholder="Option name, e.g. Parting" value={c.label} onChange={(e) => set('custom', f.custom.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} className={inputCls(!!errs[`custom${i}`])} />
                    <button type="button" onClick={() => set('custom', f.custom.filter((_, k) => k !== i))} aria-label="Remove option" className="grid size-10 shrink-0 place-items-center rounded-full text-bad hover:bg-fog"><Trash2 size={16} /></button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {c.values.map((v, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <input aria-label="Option value" placeholder="Value" value={v.value} onChange={(e) => set('custom', f.custom.map((x, k) => (k === i ? { ...x, values: x.values.map((y, m) => (m === j ? { ...y, value: e.target.value } : y)) } : x)))} className={cx(inputCls(), '!h-9')} />
                        <input aria-label="Price change in rand" placeholder="+R" inputMode="decimal" value={v.delta} onChange={(e) => set('custom', f.custom.map((x, k) => (k === i ? { ...x, values: x.values.map((y, m) => (m === j ? { ...y, delta: e.target.value } : y)) } : x)))} className={cx(inputCls(), '!h-9 max-w-24')} />
                        <button type="button" disabled={c.values.length < 2} onClick={() => set('custom', f.custom.map((x, k) => (k === i ? { ...x, values: x.values.filter((_, m) => m !== j) } : x)))} aria-label="Remove value" className="grid size-8 place-items-center rounded-full hover:bg-fog disabled:opacity-30"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                  {errs[`custom${i}`] && <p role="alert" className="mt-1 text-xs font-medium text-bad">{errs[`custom${i}`]}</p>}
                  <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => set('custom', f.custom.map((x, k) => (k === i ? { ...x, values: [...x.values, { value: '', delta: '' }] } : x)))}><Plus size={14} /> Add value</Button>
                </div>
              ))}
            </div>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => set('custom', [...f.custom, { label: '', values: [{ value: '', delta: '' }] }])}><Plus size={14} /> Add option</Button>
          </Card>

          <Card title="Photos"><ImageUploader images={f.images} onChange={(v) => set('images', v)} error={errs.images} /></Card>

          <Card title="Retail & wholesale">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Offer wholesale pricing</p>
                <p className="text-xs text-mute">{f.category === 'wholesale' ? 'Always on for the Wholesale category.' : 'Add volume tiers and a minimum order quantity. Off means this is a retail-only listing.'}</p>
              </div>
              <Toggle checked={wholesaleOn} onChange={(v) => set('wholesaleOn', v)} label="Offer wholesale pricing" />
            </div>
            {wholesaleOn && <div className="mt-4 border-t border-line pt-4"><WholesaleBlock value={f.wh} onChange={(w) => set('wh', w)} errors={errs} forced={f.category === 'wholesale'} /></div>}
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
          <Card title="Live preview">
            <div className="mx-auto max-w-[260px]" inert aria-hidden="true"><ProductCard p={preview} /></div>
            <p className="mt-3 text-center text-xs text-mute">How the card looks to buyers. Preview only.</p>
          </Card>
          <Card title={existing ? 'Save' : 'Publish'}>
            <p className="mb-3 text-xs text-mute">
              {verified ? 'Publishing makes the listing visible to buyers straight away.' : 'Your store is not verified yet, so published listings go to review first.'}
            </p>
            <div className="flex flex-col gap-2">
              {existing ? (
                <>
                  <Button type="button" variant="primary" full loading={saving} onClick={() => save('keep')}>Save changes</Button>
                  {(existing.status === 'draft' || existing.status === 'archived' || existing.status === 'rejected') && <Button type="button" variant="outline" full disabled={saving} onClick={() => save('publish')}>{verified ? 'Save & publish' : 'Save & submit for review'}</Button>}
                </>
              ) : (
                <>
                  <Button type="button" variant="primary" full loading={saving} onClick={() => save('publish')}>{verified ? 'Publish listing' : 'Submit for review'}</Button>
                  <Button type="button" variant="outline" full disabled={saving} onClick={() => save('draft')}>Save as draft</Button>
                </>
              )}
              <Link to="/seller/products" className="mt-1 text-center text-sm font-semibold underline">Cancel</Link>
            </div>
          </Card>
        </aside>
      </form>
    </>
  )
}
