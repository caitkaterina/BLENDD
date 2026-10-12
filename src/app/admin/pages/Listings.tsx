import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import { useExtra, useStore } from '../../store/store'
import { CATEGORIES } from '../../lib/config'
import { money } from '../../lib/format'
import type { Product } from '../../lib/types'
import { Badge, Button, ConfirmDialog, Empty, Img, StatusBadge } from '../../components/ui'
import { DataTable, FilterSelect, Note, PageHeader, ReasonDialog, SearchBox, TableSkeleton, Toolbar, type Column } from '../components/kit'
import { includesCI, useLoading } from '../lib/helpers'

const RANK: Record<string, number> = { pending_review: 0, published: 1, draft: 2, rejected: 3, archived: 4 }

export default function Listings() {
  const store = useStore()
  const { products, sellers, setProductStatus } = store
  const [reviewed, setReviewed] = useExtra<string[]>('claims-reviewed', [])
  const [reasons, setReasons] = useExtra<Record<string, string>>('listing-reasons', {})
  const loading = useLoading()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [cat, setCat] = useState('all')
  const [seller, setSeller] = useState('all')
  const [dlg, setDlg] = useState<{ p: Product; kind: 'reject' | 'takedown' } | null>(null)
  const sName = (id: string) => sellers.find((s) => s.id === id)?.name ?? id
  const hasClaims = (p: Product) => !!(p.origin || p.processing)

  const list = products
    .filter((p) => (status === 'all' || p.status === status) && (cat === 'all' || p.category === cat) && (seller === 'all' || p.sellerId === seller) && (!q || includesCI(`${p.title} ${p.sku}`, q)))
    .sort((a, b) => RANK[a.status] - RANK[b.status])

  const approve = (p: Product) => {
    setProductStatus(p.id, 'published')
    store.audit('Approved listing', p.title)
    store.toast('Listing published')
  }
  const markReviewed = (p: Product, v: boolean) => {
    setReviewed(v ? [...reviewed, p.id] : reviewed.filter((x) => x !== p.id))
    store.audit(v ? 'Marked listing claims reviewed' : 'Cleared listing claims review', p.title)
  }

  const cols: Column<Product>[] = [
    { key: 'p', header: 'Listing', primary: true, cell: (p) => (
      <div className="flex items-center gap-3">
        <Img id={p.images[0]} w={120} h={120} alt={p.title} className="size-12 shrink-0 rounded-lg" />
        <div className="min-w-0"><p className="line-clamp-2 font-semibold">{p.title}</p><p className="text-xs text-mute">{p.sku}</p></div>
      </div>
    ) },
    { key: 's', header: 'Seller', cell: (p) => sName(p.sellerId) },
    { key: 'c', header: 'Category', cell: (p) => CATEGORIES.find((c) => c.id === p.category)?.short },
    { key: 'pr', header: 'Price', cell: (p) => money(p.price) },
    { key: 'cl', header: 'Claims check', cell: (p) => !hasClaims(p) ? <span className="text-xs text-mute">No origin / processing claim</span> : (
      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" checked={reviewed.includes(p.id)} onChange={(e) => markReviewed(p, e.target.checked)} className="mt-0.5 size-4 accent-ink" />
        <span><span className="font-semibold">Claim reviewed</span><br /><span className="text-mute">{[p.origin && `Origin: ${p.origin}`, p.processing && `Processing: ${p.processing}`].filter(Boolean).join(' · ')}</span></span>
      </label>
    ) },
    { key: 'st', header: 'Status', cell: (p) => <div><StatusBadge status={p.status} />{reasons[p.id] && p.status === 'rejected' && <p className="mt-1 max-w-[180px] text-[11px] text-mute">“{reasons[p.id]}”</p>}</div> },
    { key: 'a', header: 'Actions', align: 'right', cell: (p) => {
      const blocked = hasClaims(p) && !reviewed.includes(p.id)
      return (
        <div className="flex flex-wrap justify-end gap-1.5">
          <Link to={`/product/${p.id}`} target="_blank" aria-label={`Preview ${p.title}`} className="grid size-9 place-items-center rounded-full hover:bg-fog"><ExternalLink size={15} /></Link>
          {p.status !== 'published' && <Button size="sm" disabled={blocked} title={blocked ? 'Confirm “Claim reviewed” first' : undefined} onClick={() => approve(p)}>Approve</Button>}
          {p.status !== 'rejected' && p.status !== 'archived' && <Button size="sm" variant="outline" onClick={() => setDlg({ p, kind: 'reject' })}>Reject</Button>}
          {p.status === 'published' && <Button size="sm" variant="outline" onClick={() => setDlg({ p, kind: 'takedown' })}>Take down</Button>}
        </div>
      )
    } },
  ]

  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Listing moderation" desc="Pending listings appear first. Approve to publish, reject with a reason, or take a live listing down." />
      <Note tone="warn" className="mb-5"><strong>Authenticity guidance.</strong> BLENDD does not guarantee authenticity of hair origin, hair type or processing in this demo. Listings that state an origin or processing method must have the claim checked against seller evidence (or be softened to “seller states…”) before approval. Tick “Claim reviewed” to record your check.</Note>
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Search title or SKU" />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, ...['pending_review', 'published', 'draft', 'rejected', 'archived'].map((s) => ({ value: s, label: s.replace('_', ' ') }))]} />
        <FilterSelect label="Category" value={cat} onChange={setCat} options={[{ value: 'all', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.label }))]} />
        <FilterSelect label="Seller" value={seller} onChange={setSeller} options={[{ value: 'all', label: 'All sellers' }, ...sellers.map((s) => ({ value: s.id, label: s.name }))]} />
        <Badge tone="line" className="ml-auto">{list.length} listings</Badge>
      </Toolbar>
      {loading ? <TableSkeleton /> : list.length === 0 ? <Empty title="No listings match" body="Adjust the filters to see more." action={<Button variant="outline" onClick={() => { setQ(''); setStatus('all'); setCat('all'); setSeller('all') }}>Clear filters</Button>} /> : <DataTable caption="Listings" columns={cols} rows={list} rowKey={(p) => p.id} />}

      <ReasonDialog open={dlg?.kind === 'reject'} onClose={() => setDlg(null)} danger title="Reject listing" confirmLabel="Reject listing" label="Reason (shown to the seller)" body={dlg?.p.title}
        onConfirm={(r) => { if (!dlg) return; setProductStatus(dlg.p.id, 'rejected'); setReasons({ ...reasons, [dlg.p.id]: r }); store.audit('Rejected listing', `${dlg.p.title} — ${r}`); store.notify({ audience: 'seller', kind: 'listing', title: 'Listing rejected', body: `${dlg.p.title}: ${r}`, href: '/seller/listings' }); store.toast('Listing rejected') }} />
      <ConfirmDialog open={dlg?.kind === 'takedown'} onClose={() => setDlg(null)} danger title="Take listing down?" confirmLabel="Take down" body={`“${dlg?.p.title}” will be archived and disappear from the shop.`}
        onConfirm={() => { if (!dlg) return; setProductStatus(dlg.p.id, 'archived'); store.audit('Took down listing', dlg.p.title); store.toast('Listing taken down') }} />
    </>
  )
}
