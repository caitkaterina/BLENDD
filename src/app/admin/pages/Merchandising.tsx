import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useExtra, useStore } from '../../store/store'
import { uid } from '../../lib/format'
import type { Product } from '../../lib/types'
import { Badge, Button, ConfirmDialog, Field, Img, Modal, Toggle, inputCls, textareaCls } from '../../components/ui'
import { Note, PageHeader, PageSkeleton, Panel, SearchBox } from '../components/kit'
import { includesCI, useLoading } from '../lib/helpers'

interface Collection { id: string; title: string; productIds: string[]; enabled: boolean }
const SEED: Collection[] = [
  { id: 'col-1', title: 'New in: wigs', productIds: ['wg13', 'gl20', 'bob12'], enabled: true },
  { id: 'col-2', title: 'Salon essentials', productIds: ['ac1', 'ac2', 'ac3'], enabled: false },
]

function Picker({ products, value, onChange }: { products: Product[]; value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState('')
  const list = products.filter((p) => !q || includesCI(p.title, q))
  return (
    <div>
      <SearchBox value={q} onChange={setQ} placeholder="Search published products" />
      <ul className="mt-2 max-h-56 divide-y divide-line overflow-y-auto rounded-xl border border-line">
        {list.length === 0 && <li className="p-4 text-sm text-mute">No products match.</li>}
        {list.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-fog">
              <input type="checkbox" className="size-4 accent-ink" checked={value.includes(p.id)} onChange={(e) => onChange(e.target.checked ? [...value, p.id] : value.filter((x) => x !== p.id))} />
              <Img id={p.images[0]} w={80} h={80} alt="" className="size-9 shrink-0 rounded" />
              <span className="min-w-0 flex-1 truncate">{p.title}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Merchandising() {
  const store = useStore()
  const { products, settings, updateSettings } = store
  const loading = useLoading()
  const published = products.filter((p) => p.status === 'published')
  const [featured, setFeatured] = useState<string[]>(settings.featuredIds)
  const [text, setText] = useState(settings.announcement)
  const [cols, setCols] = useExtra<Collection[]>('collections', SEED)
  const [edit, setEdit] = useState<Collection | null>(null)
  const [editErr, setEditErr] = useState('')
  const [del, setDel] = useState<Collection | null>(null)
  if (loading) return <PageSkeleton />

  const textErr = !text.trim() ? 'Announcement cannot be empty.' : text.length > 200 ? 'Keep it under 200 characters.' : ''
  const dirty = text !== settings.announcement || featured.join() !== settings.featuredIds.join()
  const title = (id: string) => products.find((p) => p.id === id)?.title ?? id
  const move = (i: number, d: number) => { const n = [...featured]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setFeatured(n) }
  const save = () => {
    if (textErr) return
    if (featured.length === 0) return store.toast('Pick at least one featured product', 'error')
    updateSettings({ featuredIds: featured, announcement: text.trim() })
    store.audit('Updated homepage merchandising', `${featured.length} featured products; announcement edited`)
    store.toast('Homepage merchandising saved')
  }
  const saveCol = () => {
    if (!edit) return
    if (edit.title.trim().length < 3) return setEditErr('Give the collection a title (3+ characters).')
    const exists = cols.some((c) => c.id === edit.id)
    setCols(exists ? cols.map((c) => (c.id === edit.id ? { ...edit, title: edit.title.trim() } : c)) : [...cols, { ...edit, title: edit.title.trim() }])
    store.audit(exists ? 'Edited collection' : 'Created collection', edit.title.trim())
    store.toast('Collection saved'); setEdit(null)
  }

  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Merchandising" desc="Homepage featured products, announcement bar and curated collections." actions={<Button disabled={!dirty || !!textErr} onClick={save}>{dirty ? 'Save homepage changes' : 'No changes'}</Button>} />
      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Announcement bar">
          <Field label="Text" error={textErr} hint={`${text.length}/200`}><textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} className={textareaCls(!!textErr)} /></Field>
          <p className="eyebrow mb-2 mt-4 text-mute">Live preview</p>
          <div className="rounded-lg bg-ink px-4 py-2 text-center text-xs text-white">{text || <span className="text-white/50">Empty</span>}</div>
        </Panel>
        <Panel title={`Featured on homepage (${featured.length})`}>
          {featured.length === 0 ? <p className="mb-3 text-sm text-mute">Nothing featured. Tick products below.</p> : (
            <ol className="mb-4 space-y-1.5">
              {featured.map((id, i) => (
                <li key={id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm">
                  <span className="w-5 text-xs font-bold text-mute">{i + 1}</span><span className="min-w-0 flex-1 truncate">{title(id)}</span>
                  <button aria-label={`Move ${title(id)} up`} disabled={i === 0} onClick={() => move(i, -1)} className="grid size-7 place-items-center rounded-full hover:bg-fog disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button aria-label={`Move ${title(id)} down`} disabled={i === featured.length - 1} onClick={() => move(i, 1)} className="grid size-7 place-items-center rounded-full hover:bg-fog disabled:opacity-30"><ArrowDown size={14} /></button>
                </li>
              ))}
            </ol>
          )}
          <Picker products={published} value={featured} onChange={setFeatured} />
        </Panel>
      </div>

      <Panel className="mt-6" title="Collections" action={<Button size="sm" variant="dark" onClick={() => { setEditErr(''); setEdit({ id: uid('col'), title: '', productIds: [], enabled: true }) }}><Plus size={14} /> New collection</Button>}>
        {cols.length === 0 ? <p className="text-sm text-mute">No collections yet.</p> : (
          <ul className="divide-y divide-line">
            {cols.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1"><p className="font-semibold">{c.title}</p><p className="text-xs text-mute">{c.productIds.length} products</p></div>
                {!c.enabled && <Badge tone="line">Hidden</Badge>}
                <Toggle label={`${c.enabled ? 'Disable' : 'Enable'} ${c.title}`} checked={c.enabled} onChange={(v) => { setCols(cols.map((x) => (x.id === c.id ? { ...x, enabled: v } : x))); store.audit(v ? 'Enabled collection' : 'Disabled collection', c.title) }} />
                <button aria-label={`Edit ${c.title}`} onClick={() => { setEditErr(''); setEdit(c) }} className="grid size-9 place-items-center rounded-full hover:bg-fog"><Pencil size={15} /></button>
                <button aria-label={`Delete ${c.title}`} onClick={() => setDel(c)} className="grid size-9 place-items-center rounded-full hover:bg-fog"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
        <Note className="mt-4">Collections are saved to the demo workspace. Whether the storefront renders them depends on the storefront build.</Note>
      </Panel>

      <Modal wide open={!!edit} onClose={() => setEdit(null)} title={edit && cols.some((c) => c.id === edit.id) ? 'Edit collection' : 'New collection'} footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button variant="dark" onClick={saveCol}>Save collection</Button></>}>
        {edit && (
          <div className="space-y-4">
            <Field label="Title" error={editErr}><input value={edit.title} onChange={(e) => { setEdit({ ...edit, title: e.target.value }); setEditErr('') }} className={inputCls(!!editErr)} /></Field>
            <label className="flex items-center gap-3 text-sm font-semibold"><Toggle label="Enabled" checked={edit.enabled} onChange={(v) => setEdit({ ...edit, enabled: v })} /> Enabled</label>
            <div><p className="mb-1.5 text-sm font-semibold">Products ({edit.productIds.length})</p><Picker products={published} value={edit.productIds} onChange={(v) => setEdit({ ...edit, productIds: v })} /></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger title="Delete collection?" confirmLabel="Delete" body={`“${del?.title}” will be removed. Products are not affected.`} onConfirm={() => { if (!del) return; setCols(cols.filter((c) => c.id !== del.id)); store.audit('Deleted collection', del.title); store.toast('Collection deleted') }} />
    </>
  )
}
