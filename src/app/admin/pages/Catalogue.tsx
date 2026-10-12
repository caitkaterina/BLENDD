import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useExtra, useStore } from '../../store/store'
import { CATEGORIES, CONSTRUCTIONS, LACE_TYPES, TEXTURES } from '../../lib/config'
import { SEED_CATEGORY_ATTRS } from '../../lib/data'
import { Badge, Button, ConfirmDialog, Field, Modal, Toggle, cx, inputCls } from '../../components/ui'
import { Note, PageHeader, PageSkeleton, Panel } from '../components/kit'
import { useLoading } from '../lib/helpers'

type Item = { name: string; disabled?: boolean }
type Attrs = { textures: Item[]; lace: Item[]; construction: Item[] }
type Mode = 'off' | 'optional' | 'required'
type Matrix = Record<string, Record<string, Mode>>

const toItems = (a: readonly string[]): Item[] => a.map((name) => ({ name }))
const ALL_ATTRS = [...new Set(Object.values(SEED_CATEGORY_ATTRS).flat())]
const REQUIRED_DEFAULT: Record<string, string[]> = { wigs: ['Length', 'Construction'], bundles: ['Length'], closures: ['Length'], frontals: ['Length'], ponytails: ['Length'], wholesale: ['MOQ'] }

function seedMatrix(): Matrix {
  const m: Matrix = {}
  CATEGORIES.forEach((c) => {
    m[c.id] = {}
    ALL_ATTRS.forEach((a) => { m[c.id][a] = SEED_CATEGORY_ATTRS[c.id].includes(a) ? (REQUIRED_DEFAULT[c.id]?.includes(a) ? 'required' : 'optional') : 'off' })
  })
  return m
}

function ListEditor({ title, items, onChange, noun }: { title: string; items: Item[]; onChange: (v: Item[], action: string, target: string) => void; noun: string }) {
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [edit, setEdit] = useState<{ i: number; v: string } | null>(null)
  const [del, setDel] = useState<number | null>(null)
  const dup = (v: string, skip = -1) => items.some((x, i) => i !== skip && x.name.toLowerCase() === v.trim().toLowerCase())
  const add = () => {
    if (!name.trim()) return setErr(`Enter a ${noun} name.`)
    if (dup(name)) return setErr('That value already exists.')
    onChange([...items, { name: name.trim() }], `Added ${noun}`, name.trim())
    setName(''); setErr('')
  }
  return (
    <Panel title={title} action={<Badge tone="line">{items.filter((i) => !i.disabled).length} active</Badge>}>
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); add() }}>
        <div className="flex-1"><Field label={`Add ${noun}`} error={err}><input value={name} onChange={(e) => { setName(e.target.value); setErr('') }} className={inputCls(!!err)} /></Field></div>
        <Button type="submit" variant="dark" className="mt-[26px]" aria-label={`Add ${noun}`}><Plus size={16} /></Button>
      </form>
      <ul className="divide-y divide-line">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-2 py-2">
            <span className={cx('flex-1 text-sm', it.disabled && 'text-mute line-through')}>{it.name}</span>
            {it.disabled && <Badge tone="warn">Disabled</Badge>}
            <Toggle label={`${it.disabled ? 'Enable' : 'Disable'} ${it.name}`} checked={!it.disabled} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, disabled: !v } : x)), v ? `Enabled ${noun}` : `Disabled ${noun}`, it.name)} />
            <button aria-label={`Rename ${it.name}`} onClick={() => setEdit({ i, v: it.name })} className="grid size-8 place-items-center rounded-full hover:bg-fog"><Pencil size={14} /></button>
            <button aria-label={`Remove ${it.name}`} onClick={() => setDel(i)} className="grid size-8 place-items-center rounded-full hover:bg-fog"><Trash2 size={14} /></button>
          </li>
        ))}
        {items.length === 0 && <li className="py-4 text-sm text-mute">No values. Add one above.</li>}
      </ul>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={`Rename ${noun}`} footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button variant="dark" disabled={!edit || !edit.v.trim() || dup(edit.v, edit.i)} onClick={() => { if (!edit) return; onChange(items.map((x, j) => (j === edit.i ? { ...x, name: edit.v.trim() } : x)), `Renamed ${noun}`, `${items[edit.i].name} → ${edit.v.trim()}`); setEdit(null) }}>Save</Button></>}>
        <Field label="Name" error={edit && dup(edit.v, edit.i) ? 'That value already exists.' : undefined}><input autoFocus value={edit?.v ?? ''} onChange={(e) => setEdit(edit && { ...edit, v: e.target.value })} className={inputCls()} /></Field>
      </Modal>
      <ConfirmDialog open={del !== null} onClose={() => setDel(null)} danger title={`Remove ${noun}?`} confirmLabel="Remove" body={`“${del !== null ? items[del]?.name : ''}” will be removed from the list. Existing listings that use it keep their text; consider disabling instead.`} onConfirm={() => { if (del !== null) onChange(items.filter((_, j) => j !== del), `Removed ${noun}`, items[del].name) }} />
    </Panel>
  )
}

export default function Catalogue() {
  const store = useStore()
  const loading = useLoading()
  const [attrs, setAttrs] = useExtra<Attrs>('catalogue-attrs', { textures: toItems(TEXTURES), lace: toItems(LACE_TYPES), construction: toItems(CONSTRUCTIONS) })
  const [matrix, setMatrix] = useExtra<Matrix>('category-attr-matrix', seedMatrix())
  if (loading) return <PageSkeleton />

  const upd = (key: keyof Attrs) => (v: Item[], action: string, target: string) => {
    setAttrs({ ...attrs, [key]: v })
    store.audit(`${action} (catalogue)`, target)
    store.toast(`${action}: ${target}`)
  }
  const setMode = (cat: string, attr: string, mode: Mode) => {
    setMatrix({ ...matrix, [cat]: { ...matrix[cat], [attr]: mode } })
    store.audit('Changed category attribute rule', `${cat} / ${attr} → ${mode}`)
  }

  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Categories & attributes" desc="Control the vocabularies sellers choose from and which attributes each category asks for." />
      <Note className="mb-6"><strong>Attributes are not mandatory for every category.</strong> A hair-bundle needs origin and length; a wig-cap or glue does not. Mark an attribute “Required” only where a buyer cannot make a sound decision without it.</Note>

      <Panel title="Categories" className="mb-6">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <li key={c.id} className="rounded-xl border border-line p-3.5"><p className="font-semibold">{c.label}</p><p className="mt-0.5 text-xs text-mute">{c.blurb}</p><p className="mt-2 text-[11px] text-mute">id: {c.id} · {Object.values(matrix[c.id] ?? {}).filter((m) => m === 'required').length} required</p></li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-mute">Categories are fixed in the platform configuration in this demo; adding or renaming categories needs a code/config change.</p>
      </Panel>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <ListEditor title="Textures" noun="texture" items={attrs.textures} onChange={upd('textures')} />
        <ListEditor title="Lace types" noun="lace type" items={attrs.lace} onChange={upd('lace')} />
        <ListEditor title="Constructions" noun="construction" items={attrs.construction} onChange={upd('construction')} />
      </div>

      <Panel title="Attribute matrix by category" pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Which attributes each category uses and whether they are required</caption>
            <thead><tr className="border-b border-line bg-fog/60 text-[11px] uppercase tracking-wider text-mute"><th scope="col" className="px-4 py-3 text-left">Attribute</th>{CATEGORIES.map((c) => <th key={c.id} scope="col" className="px-2 py-3 text-center">{c.short}</th>)}</tr></thead>
            <tbody>
              {ALL_ATTRS.map((a) => (
                <tr key={a} className="border-b border-line/70 last:border-0">
                  <th scope="row" className="px-4 py-2 text-left font-medium">{a}</th>
                  {CATEGORIES.map((c) => {
                    const m = matrix[c.id]?.[a] ?? 'off'
                    return (
                      <td key={c.id} className="px-2 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <input type="checkbox" aria-label={`${a} used in ${c.label}`} title="Used" checked={m !== 'off'} onChange={(e) => setMode(c.id, a, e.target.checked ? 'optional' : 'off')} className="size-4 accent-ink" />
                          <input type="checkbox" aria-label={`${a} required in ${c.label}`} title="Required" disabled={m === 'off'} checked={m === 'required'} onChange={(e) => setMode(c.id, a, e.target.checked ? 'required' : 'optional')} className="size-4 accent-ink disabled:opacity-30" />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-4 py-3 text-xs text-mute">Each cell: first box = attribute is used, second box = required. Changes are stored locally and recorded in the audit log.</p>
      </Panel>
    </>
  )
}
