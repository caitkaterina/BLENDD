import { useState } from 'react'
import { useExtra, useStore } from '../../store/store'
import { fmtDate, money, nowIso } from '../../lib/format'
import { Badge, Button, Empty, Field, StatusBadge, Tabs, inputCls, textareaCls } from '../../components/ui'
import { DataTable, Drawer, KV, Note, PageHeader, ReasonDialog, TableSkeleton, Toolbar, type Column } from '../components/kit'
import { ASSIGNEES, SEED_CASES, groupTotal, returnCases, type CaseState } from '../lib/disputes'
import { useLoading } from '../lib/helpers'

interface Case { id: string; orderRef: string; buyer: string; seller: string; reason: string; orderId?: string; sellerId?: string; amount?: number; linked: boolean }

export default function Disputes() {
  const store = useStore()
  const { orders, sellers, updateGroupStatus, user } = store
  const [state, setState] = useExtra<Record<string, CaseState>>('dispute-state', {})
  const loading = useLoading()
  const [tab, setTab] = useState<'active' | 'resolved'>('active')
  const [openId, setOpenId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [noteErr, setNoteErr] = useState('')
  const [res, setRes] = useState<'buyer' | 'seller' | null>(null)
  const sName = (id: string) => sellers.find((s) => s.id === id)?.name ?? id

  const cases: Case[] = [
    ...returnCases(orders).map((d) => ({ id: d.id, orderRef: d.order.ref, buyer: d.order.address.name, seller: sName(d.group.sellerId), reason: d.group.history.filter((h) => h.status === 'return_requested').pop()?.note ?? 'Return requested', orderId: d.order.id, sellerId: d.group.sellerId, amount: groupTotal(d.group), linked: true })),
    ...SEED_CASES.map((c) => ({ ...c, linked: false })),
  ]
  const st = (id: string): CaseState => state[id] ?? { status: 'open', notes: [] }
  const live = (c: Case) => (c.linked ? orders.find((o) => o.id === c.orderId)?.groups.find((g) => g.sellerId === c.sellerId)?.status !== 'return_requested' : st(c.id).status === 'resolved')
  const shown = cases.filter((c) => (tab === 'resolved') === live(c))
  const open = cases.find((c) => c.id === openId) ?? null
  const patch = (id: string, p: Partial<CaseState>) => setState({ ...state, [id]: { ...st(id), ...p } })
  const me = user?.name ?? 'Admin'

  const addNote = () => {
    if (!open) return
    if (note.trim().length < 3) return setNoteErr('Write a note first.')
    patch(open.id, { notes: [...st(open.id).notes, { by: me, at: nowIso(), text: note.trim() }], status: st(open.id).status === 'open' ? 'investigating' : st(open.id).status })
    store.audit('Added dispute note', `${open.id} — ${note.trim().slice(0, 60)}`)
    store.toast('Note added'); setNote(''); setNoteErr('')
  }
  const assign = (who: string) => {
    if (!open) return
    patch(open.id, { assignee: who || undefined, status: who && st(open.id).status === 'open' ? 'investigating' : st(open.id).status })
    store.audit('Assigned dispute', `${open.id} → ${who || 'unassigned'}`)
    store.toast(who ? `Assigned to ${who}` : 'Unassigned')
  }
  const resolve = (side: 'buyer' | 'seller', reason: string) => {
    if (!open) return
    const outcome = `Resolved in favour of ${side}: ${reason}`
    patch(open.id, { status: 'resolved', outcome, notes: [...st(open.id).notes, { by: me, at: nowIso(), text: outcome }] })
    if (open.linked && open.orderId && open.sellerId) updateGroupStatus(open.orderId, open.sellerId, side === 'buyer' ? 'refunded' : 'delivered', outcome)
    store.audit(`Resolved dispute for ${side}`, `${open.id} (${open.orderRef}) — ${reason}`)
    store.toast(`Case ${open.id} resolved for the ${side}`)
  }

  const cols: Column<Case>[] = [
    { key: 'i', header: 'Case', primary: true, cell: (c) => <div><p className="font-semibold">{c.id}</p><p className="text-xs text-mute">{c.linked ? 'Return request' : 'Demo dispute'}</p></div> },
    { key: 'o', header: 'Order', cell: (c) => c.orderRef },
    { key: 'p', header: 'Parties', cell: (c) => <div className="text-xs"><p>Buyer: {c.buyer}</p><p>Seller: {c.seller}</p></div> },
    { key: 'r', header: 'Reason', className: 'max-w-[260px]', cell: (c) => <span className="line-clamp-2 text-xs">{c.reason}</span> },
    { key: 's', header: 'Status', cell: (c) => <div className="flex flex-col items-start gap-1"><Badge tone={st(c.id).status === 'resolved' ? 'ok' : st(c.id).status === 'investigating' ? 'pink' : 'warn'} className="capitalize">{st(c.id).status}</Badge>{st(c.id).assignee && <span className="text-[11px] text-mute">{st(c.id).assignee}</span>}</div> },
  ]

  return (
    <>
      <PageHeader eyebrow="Commerce" title="Disputes & returns" desc="Return requests from order groups plus seeded demo disputes." />
      <Note tone="warn" className="mb-5"><strong>No escrow or buyer-protection guarantee.</strong> In this demo BLENDD does not hold funds or guarantee outcomes. Dispute handling is a manual process whose terms are still to be defined; resolutions here only change local demo data.</Note>
      <Toolbar><Tabs value={tab} onChange={setTab} items={[{ id: 'active', label: 'Open', count: cases.filter((c) => !live(c)).length }, { id: 'resolved', label: 'Resolved', count: cases.filter(live).length }]} /></Toolbar>
      {loading ? <TableSkeleton rows={4} /> : shown.length === 0 ? <Empty title={tab === 'active' ? 'No open cases' : 'No resolved cases yet'} body="Return requests from buyers will appear here." /> : <DataTable caption="Disputes and returns" columns={cols} rows={shown} rowKey={(c) => c.id} onRowClick={(c) => setOpenId(c.id)} rowLabel={(c) => c.id} />}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `Case ${open.id}` : ''}
        footer={open && st(open.id).status !== 'resolved' && <><Button variant="outline" onClick={() => setRes('seller')}>Resolve for seller{open.linked ? ' (→ delivered)' : ''}</Button><Button onClick={() => setRes('buyer')}>Resolve for buyer{open.linked ? ' (→ refunded)' : ''}</Button></>}>
        {open && (
          <div className="space-y-5">
            <dl>
              <KV k="Order" v={open.orderRef} /><KV k="Buyer" v={open.buyer} /><KV k="Seller" v={open.seller} />
              {open.amount != null && <KV k="Group value (demo)" v={money(open.amount)} />}
              <KV k="Status" v={<StatusBadge status={st(open.id).status === 'resolved' ? 'completed' : st(open.id).status === 'investigating' ? 'processing' : 'pending'} />} />
              <KV k="Source" v={open.linked ? 'Linked to a live demo order' : 'Seeded demo case (not linked to an order)'} />
            </dl>
            <p className="rounded-xl bg-fog p-3 text-sm"><span className="font-semibold">Reason: </span>{open.reason}</p>
            {st(open.id).outcome && <Note>{st(open.id).outcome}</Note>}
            <Field label="Assigned to"><select value={st(open.id).assignee ?? ''} onChange={(e) => assign(e.target.value)} disabled={st(open.id).status === 'resolved'} className={inputCls()}><option value="">Unassigned</option>{ASSIGNEES.map((a) => <option key={a}>{a}</option>)}</select></Field>
            <div>
              <h3 className="mb-2 font-display text-base font-bold">Case notes</h3>
              {st(open.id).notes.length === 0 ? <p className="text-sm text-mute">No notes yet.</p> : <ul className="mb-3 space-y-2">{st(open.id).notes.map((n, i) => <li key={i} className="rounded-lg border border-line p-3 text-sm"><p>{n.text}</p><p className="mt-1 text-[11px] text-mute">{n.by} · {fmtDate(n.at, true)}</p></li>)}</ul>}
              <Field label="Add a note" error={noteErr}><textarea rows={3} value={note} onChange={(e) => { setNote(e.target.value); setNoteErr('') }} className={textareaCls(!!noteErr)} /></Field>
              <Button className="mt-2" size="sm" variant="dark" onClick={addNote}>Add note</Button>
            </div>
          </div>
        )}
      </Drawer>
      <ReasonDialog open={!!res} onClose={() => setRes(null)} title={`Resolve in favour of ${res ?? ''}`} confirmLabel="Resolve case" label="Resolution summary" body={res === 'buyer' ? 'The order part is marked refunded (a demo record; no money moves).' : 'The order part is marked delivered and the return is closed.'} onConfirm={(r) => res && resolve(res, r)} />
    </>
  )
}
