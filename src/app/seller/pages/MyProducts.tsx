import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Archive, Copy, Eye, Pencil, Percent, PackagePlus, Send, Undo2 } from 'lucide-react'
import { Badge, Button, ConfirmDialog, Empty, Field, LinkButton, Modal, StatusBadge, Tabs, inputCls } from '../../components/ui'
import { money } from '../../lib/format'
import { discountPct, stockState } from '../../lib/pricing'
import type { ListingStatus, Product } from '../../lib/types'
import { useLoading, useSellerData } from '../lib/useSellerData'
import { PageHeader, PageSkeleton, SearchBox, Thumb, td, th } from '../components/kit'

type Tab = 'all' | ListingStatus
const TAB_LABEL: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'pending_review', label: 'In review' },
  { id: 'draft', label: 'Drafts' },
  { id: 'archived', label: 'Archived' },
  { id: 'rejected', label: 'Rejected' },
]

export default function MyProducts() {
  const loading = useLoading()
  const { myProducts, verified, setProductStatus, duplicateProduct, upsertProduct, toast } = useSellerData()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string[]>([])
  const [archiveFor, setArchiveFor] = useState<Product | null>(null)
  const [bulk, setBulk] = useState<'price' | 'stock' | null>(null)
  const [val, setVal] = useState('')
  const [err, setErr] = useState('')

  const rows = useMemo(
    () => myProducts.filter((p) => (tab === 'all' || p.status === tab) && (!q.trim() || `${p.title} ${p.sku}`.toLowerCase().includes(q.trim().toLowerCase()))),
    [myProducts, tab, q],
  )
  const visibleSel = sel.filter((id) => rows.some((r) => r.id === id))
  const allOn = rows.length > 0 && visibleSel.length === rows.length
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  if (loading) return <PageSkeleton rows={6} />

  const publish = (p: Product) => {
    if (verified) { setProductStatus(p.id, 'published'); toast(`"${p.title}" is now live`) }
    else { setProductStatus(p.id, 'pending_review'); toast('Sent for review. Your store is not verified yet, so listings are reviewed before they go live.', 'info') }
  }
  const unpublish = (p: Product) => { setProductStatus(p.id, 'draft'); toast('Listing moved to drafts', 'info') }

  const applyBulk = () => {
    const n = Number(val)
    if (val.trim() === '' || Number.isNaN(n)) return setErr('Enter a number.')
    if (bulk === 'price') {
      if (n <= -90 || n > 500) return setErr('Use a change between -90% and 500%.')
      visibleSel.forEach((id) => {
        const p = myProducts.find((x) => x.id === id)
        if (!p) return
        const price = Math.max(1, Math.round(p.price * (1 + n / 100)))
        // Keep compare-at only if it is still a valid discount.
        upsertProduct({ ...p, price, compareAt: p.compareAt && p.compareAt > price ? p.compareAt : undefined })
      })
      toast(`Updated price on ${visibleSel.length} listing${visibleSel.length === 1 ? '' : 's'}`)
    } else {
      if (n < 0 || !Number.isInteger(n)) return setErr('Stock must be a whole number, 0 or more.')
      visibleSel.forEach((id) => { const p = myProducts.find((x) => x.id === id); if (p) upsertProduct({ ...p, stock: n }) })
      toast(`Stock set to ${n} on ${visibleSel.length} listing${visibleSel.length === 1 ? '' : 's'}`)
    }
    setBulk(null); setVal(''); setErr(''); setSel([])
  }

  const actions = (p: Product) => (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <IconBtn label={`Edit ${p.title}`} onClick={() => nav(`/seller/products/${p.id}/edit`)}><Pencil size={15} /></IconBtn>
      <IconBtn label={`Duplicate ${p.title}`} onClick={() => duplicateProduct(p.id)}><Copy size={15} /></IconBtn>
      <Link to={`/product/${p.id}`} aria-label={`Preview ${p.title}`} title="Preview" className="grid size-9 place-items-center rounded-full hover:bg-fog"><Eye size={15} /></Link>
      {(p.status === 'draft' || p.status === 'archived' || p.status === 'rejected') && <IconBtn label={`Publish ${p.title}`} onClick={() => publish(p)}><Send size={15} /></IconBtn>}
      {(p.status === 'published' || p.status === 'pending_review') && <IconBtn label={`Unpublish ${p.title}`} onClick={() => unpublish(p)}><Undo2 size={15} /></IconBtn>}
      {p.status !== 'archived' && <IconBtn label={`Archive ${p.title}`} onClick={() => setArchiveFor(p)}><Archive size={15} /></IconBtn>}
    </div>
  )

  return (
    <>
      <PageHeader title="My Products" sub={`${myProducts.length} listing${myProducts.length === 1 ? '' : 's'}. Edits to price and stock appear on the storefront immediately.`} actions={<LinkButton to="/seller/products/new" size="sm"><PackagePlus size={16} /> Add product</LinkButton>} />
      {!verified && <p className="mb-4 rounded-lg bg-fog px-3.5 py-2.5 text-[13px] text-graphite">Publishing sends a listing to review while your store is unverified.</p>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onChange={setTab} items={TAB_LABEL.map((t) => ({ ...t, count: t.id === 'all' ? myProducts.length : myProducts.filter((p) => p.status === t.id).length }))} />
        <SearchBox value={q} onChange={setQ} placeholder="Search title or SKU" />
      </div>

      {visibleSel.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm text-white" role="region" aria-label="Bulk actions">
          <span className="font-semibold">{visibleSel.length} selected</span>
          <Button size="sm" variant="primary" onClick={() => { setBulk('price'); setVal(''); setErr('') }}><Percent size={14} /> Change price %</Button>
          <Button size="sm" variant="onDark" onClick={() => { setBulk('stock'); setVal(''); setErr('') }}>Set stock</Button>
          <button type="button" onClick={() => setSel([])} className="ml-auto text-xs underline">Clear</button>
        </div>
      )}

      {rows.length === 0 ? (
        <Empty title={myProducts.length === 0 ? 'No listings yet' : 'No listings match'} body={myProducts.length === 0 ? 'Add your first product. You can save it as a draft and publish later.' : 'Try a different status tab or search.'} action={<LinkButton to="/seller/products/new" variant="dark">Add product</LinkButton>} />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-line bg-white lg:block">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-line bg-fog/60"><tr>
                <th className={th + ' w-10'}><input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? [] : rows.map((r) => r.id))} aria-label="Select all listings" className="size-4 accent-ink" /></th>
                <th className={th}>Product</th><th className={th}>SKU</th><th className={th}>Price</th><th className={th}>Stock</th><th className={th}>Status</th><th className={th + ' text-right'}>Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((p) => (
                  <tr key={p.id} className={sel.includes(p.id) ? 'bg-pink-soft/60' : 'hover:bg-fog/40'}>
                    <td className={td}><input type="checkbox" checked={sel.includes(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.title}`} className="size-4 accent-ink" /></td>
                    <td className={td}><div className="flex items-center gap-3"><Thumb src={p.images[0]} alt="" /><div className="min-w-0"><Link to={`/seller/products/${p.id}/edit`} className="line-clamp-1 font-semibold hover:underline">{p.title}</Link><p className="text-xs capitalize text-mute">{p.category}{p.wholesale ? ' · wholesale' : ''}</p></div></div></td>
                    <td className={td + ' font-mono text-xs'}>{p.sku}</td>
                    <td className={td}><span className="font-semibold">{money(p.price)}</span>{discountPct(p) > 0 && <span className="ml-1.5 text-xs text-mute line-through">{money(p.compareAt!)}</span>}</td>
                    <td className={td}><StockCell p={p} /></td>
                    <td className={td}><StatusBadge status={p.status} /></td>
                    <td className={td}>{actions(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 lg:hidden">
            {rows.map((p) => (
              <li key={p.id} className="rounded-xl border border-line bg-white p-3">
                <div className="flex gap-3">
                  <input type="checkbox" checked={sel.includes(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.title}`} className="mt-1 size-4 accent-ink" />
                  <Thumb src={p.images[0]} alt="" size={64} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/seller/products/${p.id}/edit`} className="line-clamp-2 text-sm font-semibold">{p.title}</Link>
                    <p className="mt-0.5 font-mono text-[11px] text-mute">{p.sku}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2"><span className="text-sm font-bold">{money(p.price)}</span><StockCell p={p} /><StatusBadge status={p.status} /></div>
                  </div>
                </div>
                <div className="mt-2 border-t border-line pt-2">{actions(p)}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog open={!!archiveFor} onClose={() => setArchiveFor(null)} danger title="Archive this listing?" confirmLabel="Archive" body={<>"{archiveFor?.title}" will be hidden from buyers. You can publish it again later.</>} onConfirm={() => { if (archiveFor) { setProductStatus(archiveFor.id, 'archived'); toast('Listing archived', 'info') } }} />

      <Modal open={!!bulk} onClose={() => setBulk(null)} title={bulk === 'price' ? 'Change price by percentage' : 'Set stock level'} footer={<><Button variant="ghost" onClick={() => setBulk(null)}>Cancel</Button><Button variant="dark" onClick={applyBulk}>Apply to {visibleSel.length}</Button></>}>
        <Field label={bulk === 'price' ? 'Percentage change (e.g. -10 for 10% off, 5 for +5%)' : 'New stock quantity'} error={err}>
          <input autoFocus inputMode="decimal" value={val} onChange={(e) => { setVal(e.target.value); setErr('') }} className={inputCls(!!err)} placeholder={bulk === 'price' ? '-10' : '25'} />
        </Field>
        {bulk === 'price' && <p className="mt-3 text-xs text-mute">Prices are rounded to the nearest rand. An existing compare-at price is kept only while it stays above the new price.</p>}
      </Modal>
    </>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label.split(' ')[0]} className="grid size-9 place-items-center rounded-full hover:bg-fog">{children}</button>
}

function StockCell({ p }: { p: Product }) {
  const s = stockState(p)
  return s === 'out' ? <Badge tone="bad">Out of stock</Badge> : s === 'low' ? <Badge tone="warn">{p.stock} · low</Badge> : <span className="text-sm">{p.stock}</span>
}
