import { useState } from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { Badge, Button, ConfirmDialog, Empty, Field, Modal, inputCls } from '../../components/ui'
import { PROMO_CODES } from '../../lib/config'
import { money, uid } from '../../lib/format'
import { discountPct } from '../../lib/pricing'
import type { Product } from '../../lib/types'
import { useExtra } from '../../store/store'
import { useLoading, useSellerData } from '../lib/useSellerData'
import { Card, Notice, PageHeader, PageSkeleton, Thumb, selectCls, td, th } from '../components/kit'

interface Promo { id: string; sellerId: string; code: string; kind: 'percent' | 'flat'; value: number; minSpend: number }

export default function Promotions() {
  const loading = useLoading()
  const { myProducts, sellerId, upsertProduct, toast } = useSellerData()
  const [promos, setPromos] = useExtra<Promo[]>('seller-promos', [])
  const mine = promos.filter((p) => p.sellerId === sellerId)

  const [sale, setSale] = useState<Product | null>(null)
  const [salePrice, setSalePrice] = useState('')
  const [orig, setOrig] = useState('')
  const [saleErr, setSaleErr] = useState('')
  const [endFor, setEndFor] = useState<Product | null>(null)

  const [codeOpen, setCodeOpen] = useState(false)
  const [code, setCode] = useState('')
  const [kind, setKind] = useState<Promo['kind']>('percent')
  const [value, setValue] = useState('')
  const [minSpend, setMinSpend] = useState('')
  const [codeErr, setCodeErr] = useState<Record<string, string>>({})
  const [delFor, setDelFor] = useState<Promo | null>(null)

  if (loading) return <PageSkeleton rows={5} />
  const eligible = myProducts.filter((p) => p.status !== 'archived')
  const isWholesaleOnly = (p: Product) => !!p.wholesale && !p.wholesale.retailAlso

  const openSale = (p: Product) => { setSale(p); setSalePrice(p.compareAt && p.compareAt > p.price ? String(p.price) : ''); setOrig(String(p.compareAt && p.compareAt > p.price ? p.compareAt : p.price)); setSaleErr('') }
  const saveSale = () => {
    if (!sale) return
    const s = Number(salePrice), o = Number(orig)
    if (!(o > 0)) return setSaleErr('Enter the original price.')
    if (!(s > 0)) return setSaleErr('Enter a sale price above R0.')
    if (s >= o) return setSaleErr('The sale price must be lower than the original price, or no discount can be shown.')
    upsertProduct({ ...sale, price: s, compareAt: o })
    toast(`Sale set: ${Math.round((1 - s / o) * 100)}% off`)
    setSale(null)
  }
  const endSale = (p: Product) => { upsertProduct({ ...p, price: p.compareAt ?? p.price, compareAt: undefined }); toast('Sale ended. Price restored.', 'info') }

  const saveCode = () => {
    const e: Record<string, string> = {}
    const c = code.trim().toUpperCase()
    if (!/^[A-Z0-9]{4,16}$/.test(c)) e.code = 'Use 4-16 letters or numbers, no spaces.'
    else if (PROMO_CODES[c] || promos.some((p) => p.code === c && p.sellerId === sellerId)) e.code = 'That code already exists.'
    const v = Number(value)
    if (!(v > 0)) e.value = 'Enter a value above 0.'
    else if (kind === 'percent' && v > 90) e.value = 'Percentage discounts are limited to 90%.'
    const m = minSpend.trim() === '' ? 0 : Number(minSpend)
    if (Number.isNaN(m) || m < 0) e.minSpend = 'Enter 0 or more.'
    setCodeErr(e)
    if (Object.keys(e).length) return
    setPromos((p) => [{ id: uid('pr'), sellerId, code: c, kind, value: v, minSpend: m }, ...p])
    toast('Promo code draft saved'); setCodeOpen(false); setCode(''); setValue(''); setMinSpend('')
  }

  return (
    <>
      <PageHeader title="Promotions" sub="Run sale prices on your listings and keep promo code drafts." />
      <Card title="Sale prices" className="mb-6" flush>
        {eligible.length === 0 ? <div className="p-4"><Empty title="No listings yet" body="Add a product to set a sale price." /></div> : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px]">
                <thead className="border-b border-line bg-fog/60"><tr><th className={th}>Product</th><th className={th}>Price</th><th className={th}>Was</th><th className={th}>Discount</th><th className={th + ' text-right'}>Action</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {eligible.map((p) => (
                    <tr key={p.id}>
                      <td className={td}><div className="flex items-center gap-3"><Thumb src={p.images[0]} alt="" size={36} /><span className="line-clamp-1 font-semibold">{p.title}</span></div></td>
                      <td className={td + ' font-semibold'}>{money(p.price)}</td>
                      <td className={td + ' text-mute'}>{discountPct(p) ? <s>{money(p.compareAt!)}</s> : '–'}</td>
                      <td className={td}>{discountPct(p) ? <Badge tone="pink">−{discountPct(p)}%</Badge> : <span className="text-mute">None</span>}</td>
                      <td className={td + ' text-right'}>{rowAction(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line md:hidden">
              {eligible.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  <Thumb src={p.images[0]} alt="" size={44} />
                  <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-semibold">{p.title}</p><p className="text-xs">{money(p.price)} {discountPct(p) > 0 && <><s className="text-mute">{money(p.compareAt!)}</s> · −{discountPct(p)}%</>}</p></div>
                  {rowAction(p)}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card title="Promo codes (drafts)" action={<Button size="sm" variant="dark" onClick={() => { setCodeOpen(true); setCodeErr({}) }}><Plus size={14} /> New code</Button>}>
        <div className="mb-4"><Notice>Storefront-wide codes are configured by the platform in this demo (<span className="font-mono">{Object.keys(PROMO_CODES).join(', ')}</span>). Codes you create here are saved drafts for planning: they are not applied at checkout.</Notice></div>
        {mine.length === 0 ? <p className="py-6 text-center text-sm text-mute">No drafts yet.</p> : (
          <ul className="divide-y divide-line">
            {mine.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <span className="grid size-9 place-items-center rounded-full bg-fog"><Tag size={15} /></span>
                <div className="min-w-0 flex-1"><p className="font-mono text-sm font-bold">{p.code}</p><p className="text-xs text-mute">{p.kind === 'percent' ? `${p.value}% off` : `${money(p.value)} off`}{p.minSpend ? ` over ${money(p.minSpend)}` : ''}</p></div>
                <Badge tone="line">Draft</Badge>
                <button type="button" onClick={() => setDelFor(p)} aria-label={`Delete code ${p.code}`} className="grid size-9 place-items-center rounded-full text-bad hover:bg-fog"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={!!sale} onClose={() => setSale(null)} title="Set sale price" footer={<><Button variant="ghost" onClick={() => setSale(null)}>Cancel</Button><Button variant="dark" onClick={saveSale}>Save sale</Button></>}>
        <p className="mb-4 text-sm font-semibold">{sale?.title}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Original price (ZAR)"><input value={orig} onChange={(e) => { setOrig(e.target.value); setSaleErr('') }} inputMode="decimal" className={inputCls()} /></Field>
          <Field label="Sale price (ZAR)" error={saleErr}><input autoFocus value={salePrice} onChange={(e) => { setSalePrice(e.target.value); setSaleErr('') }} inputMode="decimal" className={inputCls(!!saleErr)} /></Field>
        </div>
        <p className="mt-3 text-xs text-mute">The sale price becomes the listing price and the original shows crossed out. Length options keep their price changes.</p>
      </Modal>

      <Modal open={codeOpen} onClose={() => setCodeOpen(false)} title="New promo code draft" footer={<><Button variant="ghost" onClick={() => setCodeOpen(false)}>Cancel</Button><Button variant="dark" onClick={saveCode}>Save draft</Button></>}>
        <div className="space-y-4">
          <Field label="Code" error={codeErr.code}><input autoFocus value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputCls(!!codeErr.code) + ' font-mono'} placeholder="SPRING15" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type"><select value={kind} onChange={(e) => setKind(e.target.value as Promo['kind'])} className={selectCls()}><option value="percent">Percentage off</option><option value="flat">Rand amount off</option></select></Field>
            <Field label={kind === 'percent' ? 'Percent' : 'Amount (ZAR)'} error={codeErr.value}><input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" className={inputCls(!!codeErr.value)} /></Field>
          </div>
          <Field label="Minimum spend (ZAR, optional)" error={codeErr.minSpend}><input value={minSpend} onChange={(e) => setMinSpend(e.target.value)} inputMode="decimal" className={inputCls(!!codeErr.minSpend)} /></Field>
        </div>
      </Modal>

      <ConfirmDialog open={!!endFor} onClose={() => setEndFor(null)} title="End this sale?" confirmLabel="End sale" body="The listing returns to its original price." onConfirm={() => endFor && endSale(endFor)} />
      <ConfirmDialog open={!!delFor} onClose={() => setDelFor(null)} danger title="Delete this draft code?" confirmLabel="Delete" body={`Delete ${delFor?.code}?`} onConfirm={() => { if (delFor) { setPromos((p) => p.filter((x) => x.id !== delFor.id)); toast('Draft deleted', 'info') } }} />
    </>
  )

  function rowAction(p: Product) {
    if (isWholesaleOnly(p)) return <span className="text-xs text-mute" title="Wholesale-only prices come from your volume tiers">Set via tiers</span>
    return discountPct(p) > 0
      ? <Button size="sm" variant="outline" onClick={() => setEndFor(p)}>End sale</Button>
      : <Button size="sm" variant="dark" onClick={() => openSale(p)}>Set sale</Button>
  }
}
