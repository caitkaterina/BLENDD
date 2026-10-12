import type { CategoryId, HairType, OptionDef, Product, WholesaleInfo } from '../../lib/types'
import { emptyWholesale, wholesaleToForm, type WholesaleForm } from '../components/WholesaleBlock'

export interface FormState {
  title: string
  category: CategoryId | ''
  description: string
  sku: string
  price: string
  compareAt: string
  stock: string
  lowStockAt: string
  hairType: HairType | ''
  texture: string
  construction: string
  lace: string
  density: string
  origin: string
  processing: string
  material: string
  pieces: string
  colors: string[]
  lengths: number[]
  deltas: Record<number, string>
  capSizes: string[]
  laceTypes: string[]
  custom: { label: string; values: { value: string; delta: string }[] }[]
  images: string[]
  wholesaleOn: boolean
  wh: WholesaleForm
}

export type FieldKey = 'hair' | 'texture' | 'lengths' | 'colors' | 'construction' | 'lace' | 'laceType' | 'density' | 'capSize' | 'origin' | 'processing' | 'pieces' | 'material'

/** Which attribute inputs each category shows (the "SEED_CATEGORY_ATTRS idea"). */
export const CATEGORY_FIELDS: Record<CategoryId, FieldKey[]> = {
  wigs: ['hair', 'texture', 'lengths', 'colors', 'construction', 'lace', 'laceType', 'density', 'capSize'],
  bundles: ['hair', 'texture', 'lengths', 'colors', 'origin', 'processing'],
  closures: ['hair', 'texture', 'lengths', 'colors', 'lace'],
  frontals: ['hair', 'texture', 'lengths', 'colors', 'lace'],
  ponytails: ['hair', 'texture', 'lengths', 'colors', 'pieces'],
  accessories: ['material', 'colors'],
  wholesale: ['hair', 'texture', 'lengths', 'colors', 'origin', 'processing'],
}
export const LACE_SIZES: Partial<Record<CategoryId, string[]>> = { closures: ['4x4', '5x5', '6x6'], frontals: ['13x4', '13x6'] }
export const LENGTH_CHOICES = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32]
export const CAP_SIZES = ['Small', 'Medium', 'Large']
export const LACE_KINDS = ['HD lace', 'Transparent lace', 'Swiss lace']
export const DENSITIES = ['130%', '150%', '180%', '200%', '250%']
const STD_KEYS = ['length', 'color', 'capSize', 'lace']

export const emptyForm = (): FormState => ({
  title: '', category: '', description: '', sku: '', price: '', compareAt: '', stock: '10', lowStockAt: '5', hairType: '', texture: '', construction: '', lace: '', density: '', origin: '', processing: '', material: '', pieces: '',
  colors: [], lengths: [], deltas: {}, capSizes: [], laceTypes: [], custom: [], images: [], wholesaleOn: false, wh: emptyWholesale(),
})

export function formFromProduct(p: Product): FormState {
  const lenOpt = p.options.find((o) => o.key === 'length')
  const deltas: Record<number, string> = {}
  lenOpt?.values.forEach((v) => { const n = parseInt(v.value, 10); if (!Number.isNaN(n) && v.priceDelta) deltas[n] = String(v.priceDelta) })
  const lengths = p.lengths.length ? p.lengths : (lenOpt?.values.map((v) => parseInt(v.value, 10)).filter((n) => !Number.isNaN(n)) ?? [])
  return {
    ...emptyForm(),
    title: p.title, category: p.category, description: p.description, sku: p.sku, price: String(p.wholesale && !p.wholesale.retailAlso ? '' : p.price), compareAt: p.compareAt ? String(p.compareAt) : '',
    stock: String(p.stock), lowStockAt: String(p.lowStockAt), hairType: p.hairType ?? '', texture: p.texture ?? '', construction: p.construction ?? '', lace: p.lace ?? '', density: p.density && p.density !== '—' ? p.density : '',
    origin: p.origin ?? '', processing: p.processing ?? '', material: p.specs.Material ?? '', pieces: p.specs.Pieces ?? '', colors: p.colors, lengths, deltas,
    capSizes: p.options.find((o) => o.key === 'capSize')?.values.map((v) => v.value) ?? [],
    laceTypes: p.options.find((o) => o.key === 'lace')?.values.map((v) => v.value) ?? [],
    custom: p.options.filter((o) => !STD_KEYS.includes(o.key)).map((o) => ({ label: o.label, values: o.values.map((v) => ({ value: v.value, delta: v.priceDelta ? String(v.priceDelta) : '' })) })),
    images: p.images, wholesaleOn: !!p.wholesale, wh: p.wholesale ? wholesaleToForm(p.wholesale) : emptyWholesale(),
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function buildOptions(f: FormState, fields: FieldKey[]): OptionDef[] {
  const out: OptionDef[] = []
  if (fields.includes('lengths') && f.lengths.length)
    out.push({ key: 'length', label: 'Length (inches)', values: f.lengths.map((l) => { const d = Number(f.deltas[l]); return d ? { value: `${l}"`, priceDelta: d } : { value: `${l}"` } }) })
  if (fields.includes('colors') && f.colors.length > 1) out.push({ key: 'color', label: 'Colour', values: f.colors.map((value) => ({ value })) })
  if (fields.includes('capSize') && f.capSizes.length) out.push({ key: 'capSize', label: 'Cap size', values: f.capSizes.map((value) => ({ value })) })
  if (fields.includes('laceType') && f.laceTypes.length > 1) out.push({ key: 'lace', label: 'Lace type', values: f.laceTypes.map((value) => ({ value })) })
  f.custom.forEach((c) => {
    const values = c.values.filter((v) => v.value.trim())
    if (c.label.trim() && values.length)
      out.push({ key: slug(c.label) || 'option', label: c.label.trim(), values: values.map((v) => (Number(v.delta) ? { value: v.value.trim(), priceDelta: Number(v.delta) } : { value: v.value.trim() })) })
  })
  return out
}

export function buildWholesale(w: FormState['wh']): WholesaleInfo {
  return { moq: Number(w.moq) || 1, tiers: w.tiers.map((t) => ({ min: Number(t.min) || 0, price: Number(t.price) || 0 })), leadTime: w.leadTime.trim(), processing: w.processing.trim(), samples: w.samples, customisation: w.customisation, acceptsEnquiries: w.acceptsEnquiries, retailAlso: w.retailAlso }
}

const HAIR_LABEL: Record<HairType, string> = { human: 'Human hair', synthetic: 'Synthetic', blended: 'Blended' }

/** Merge form state over a base product (existing or fresh). */
export function toProduct(f: FormState, base: Product, o: { sellerId: string; status: Product['status'] }): Product {
  const fields = f.category ? CATEGORY_FIELDS[f.category] : []
  const has = (k: FieldKey) => fields.includes(k)
  const wholesaleOn = f.category === 'wholesale' || f.wholesaleOn
  const wholesale = wholesaleOn ? buildWholesale(f.wh) : undefined
  const wholesaleOnly = !!wholesale && !wholesale.retailAlso
  const price = wholesaleOnly ? (wholesale!.tiers[0]?.price ?? 0) : Number(f.price) || 0
  const compareAt = !wholesaleOnly && Number(f.compareAt) > price ? Number(f.compareAt) : undefined
  const lengths = has('lengths') ? [...f.lengths].sort((a, b) => a - b) : []
  const specs: Record<string, string> = {}
  if (f.hairType) specs['Hair type'] = HAIR_LABEL[f.hairType]
  if (has('texture') && f.texture) specs.Texture = f.texture
  if (has('construction') && f.construction) specs.Construction = f.construction
  if (has('lace') && f.lace) specs.Lace = f.lace
  if (has('density') && f.density) specs.Density = f.density
  if (has('origin') && f.origin.trim()) specs.Origin = `${f.origin.trim()} (as stated by seller)`
  if (has('processing') && f.processing.trim()) specs.Processing = `${f.processing.trim()} (as stated by seller)`
  if (has('pieces') && f.pieces.trim()) specs.Pieces = f.pieces.trim()
  if (has('material') && f.material.trim()) specs.Material = f.material.trim()
  if (lengths.length) specs.Lengths = `${lengths[0]}–${lengths[lengths.length - 1]}"`
  return {
    ...base,
    sellerId: o.sellerId,
    title: f.title.trim(),
    category: (f.category || 'accessories') as CategoryId,
    description: f.description.trim(),
    sku: f.sku.trim(),
    price,
    compareAt,
    stock: Number(f.stock) || 0,
    lowStockAt: Number(f.lowStockAt) || 0,
    hairType: has('hair') && f.hairType ? f.hairType : undefined,
    texture: has('texture') && f.texture ? f.texture : undefined,
    construction: has('construction') && f.construction ? f.construction : undefined,
    lace: has('lace') && f.lace ? f.lace : undefined,
    density: has('density') && f.density ? f.density : undefined,
    origin: has('origin') && f.origin.trim() ? f.origin.trim() : undefined,
    processing: has('processing') && f.processing.trim() ? f.processing.trim() : undefined,
    colors: has('colors') ? f.colors : [],
    lengths,
    options: buildOptions(f, fields),
    images: f.images,
    specs,
    wholesale,
    status: o.status,
  }
}
