import { useState } from 'react'
import { useExtra, useStore } from '../../store/store'
import { fmtDate, nowIso } from '../../lib/format'
import { Badge, Button, Empty, Field, StatusBadge, Tabs, inputCls, textareaCls } from '../../components/ui'
import { DataTable, Drawer, FilterSelect, Note, PageHeader, TableSkeleton, Toolbar, type Column } from '../components/kit'
import { ASSIGNEES } from '../lib/disputes'
import { useLoading } from '../lib/helpers'

interface Msg { from: 'customer' | 'agent'; name: string; text: string; at: string }
interface Ticket { id: string; subject: string; customer: string; priority: 'low' | 'normal' | 'high'; status: 'open' | 'closed'; assignee?: string; messages: Msg[] }
const SEED: Ticket[] = [
  { id: 'TKT-2031', subject: 'Where is my parcel?', customer: 'Thandi Mokoena', priority: 'normal', status: 'open', messages: [{ from: 'customer', name: 'Thandi Mokoena', text: 'My order BL-261004-1907 shows shipped but I have no tracking updates since Tuesday.', at: '2026-10-09T09:15:00' }] },
  { id: 'TKT-2032', subject: 'Cannot verify my phone number', customer: 'Lerato Pillay', priority: 'low', status: 'open', assignee: 'Support Agent', messages: [{ from: 'customer', name: 'Lerato Pillay', text: 'I never receive the verification code.', at: '2026-10-08T14:00:00' }, { from: 'agent', name: 'Support Agent', text: 'Could you confirm the number ends in 0188? Phone verification is a demo feature at the moment.', at: '2026-10-08T15:30:00' }] },
  { id: 'TKT-2033', subject: 'Seller applying — documents rejected', customer: 'Kasi Crown Wigs', priority: 'high', status: 'open', messages: [{ from: 'customer', name: 'Kasi Crown Wigs', text: 'Our bank letter was marked missing. What format do you need?', at: '2026-10-10T08:05:00' }] },
  { id: 'TKT-2029', subject: 'Change delivery address', customer: 'Megan van Wyk', priority: 'normal', status: 'closed', messages: [{ from: 'customer', name: 'Megan van Wyk', text: 'Please change my address to my office.', at: '2026-10-05T10:00:00' }, { from: 'agent', name: 'Platform Admin', text: 'Done, the seller has been notified.', at: '2026-10-05T11:20:00' }] },
]
const PTONE = { high: 'bad', normal: 'neutral', low: 'line' } as const

export default function Support() {
  const store = useStore()
  const [tickets, setTickets] = useExtra<Ticket[]>('support-tickets', SEED)
  const loading = useLoading()
  const [tab, setTab] = useState<'open' | 'closed'>('open')
  const [prio, setPrio] = useState('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [err, setErr] = useState('')
  const open = tickets.find((t) => t.id === openId) ?? null
  const patch = (id: string, p: Partial<Ticket>) => setTickets(tickets.map((t) => (t.id === id ? { ...t, ...p } : t)))
  const shown = tickets.filter((t) => t.status === tab && (prio === 'all' || t.priority === prio))

  const send = () => {
    if (!open) return
    if (reply.trim().length < 2) return setErr('Write a reply first.')
    patch(open.id, { messages: [...open.messages, { from: 'agent', name: store.user?.name ?? 'Admin', text: reply.trim(), at: nowIso() }] })
    store.audit('Replied to ticket', `${open.id} — ${open.subject}`)
    store.toast('Reply recorded (no email is sent in demo)')
    setReply(''); setErr('')
  }

  const cols: Column<Ticket>[] = [
    { key: 'i', header: 'Ticket', primary: true, cell: (t) => <div><p className="font-semibold">{t.subject}</p><p className="text-xs text-mute">{t.id} · {t.customer}</p></div> },
    { key: 'p', header: 'Priority', cell: (t) => <Badge tone={PTONE[t.priority]} className="capitalize">{t.priority}</Badge> },
    { key: 'a', header: 'Assignee', cell: (t) => t.assignee ?? <span className="text-mute">Unassigned</span> },
    { key: 'm', header: 'Last message', cell: (t) => fmtDate(t.messages[t.messages.length - 1].at, true) },
    { key: 's', header: 'Status', cell: (t) => <StatusBadge status={t.status === 'open' ? 'pending' : 'completed'} /> },
  ]

  return (
    <>
      <PageHeader eyebrow="Trust & care" title="Support tickets" desc="Seeded demo tickets. Replies are saved locally; no email or chat is sent." />
      <Toolbar>
        <Tabs value={tab} onChange={setTab} items={[{ id: 'open', label: 'Open', count: tickets.filter((t) => t.status === 'open').length }, { id: 'closed', label: 'Closed', count: tickets.filter((t) => t.status === 'closed').length }]} />
        <FilterSelect label="Priority" value={prio} onChange={setPrio} options={[{ value: 'all', label: 'Any priority' }, { value: 'high', label: 'High' }, { value: 'normal', label: 'Normal' }, { value: 'low', label: 'Low' }]} />
      </Toolbar>
      {loading ? <TableSkeleton rows={4} /> : shown.length === 0 ? <Empty title="No tickets" body="Nothing in this view." /> : <DataTable caption="Support tickets" columns={cols} rows={shown} rowKey={(t) => t.id} onRowClick={(t) => setOpenId(t.id)} rowLabel={(t) => t.id} />}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `${open.id} · ${open.subject}` : ''}
        footer={open && <Button variant={open.status === 'open' ? 'outline' : 'dark'} onClick={() => { const to = open.status === 'open' ? 'closed' : 'open'; patch(open.id, { status: to }); store.audit(to === 'closed' ? 'Closed ticket' : 'Reopened ticket', open.id); store.toast(`Ticket ${to === 'closed' ? 'closed' : 'reopened'}`) }}>{open.status === 'open' ? 'Close ticket' : 'Reopen ticket'}</Button>}>
        {open && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority"><select value={open.priority} onChange={(e) => { patch(open.id, { priority: e.target.value as Ticket['priority'] }); store.audit('Changed ticket priority', `${open.id} → ${e.target.value}`) }} className={inputCls()}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></Field>
              <Field label="Assignee"><select value={open.assignee ?? ''} onChange={(e) => { patch(open.id, { assignee: e.target.value || undefined }); store.audit('Assigned ticket', `${open.id} → ${e.target.value || 'unassigned'}`) }} className={inputCls()}><option value="">Unassigned</option>{ASSIGNEES.map((a) => <option key={a}>{a}</option>)}</select></Field>
            </div>
            <ol className="space-y-3">
              {open.messages.map((m, i) => (
                <li key={i} className={m.from === 'agent' ? 'ml-8 rounded-xl bg-ink p-3 text-sm text-white' : 'mr-8 rounded-xl bg-fog p-3 text-sm'}>
                  <p>{m.text}</p><p className={m.from === 'agent' ? 'mt-1 text-[11px] text-white/60' : 'mt-1 text-[11px] text-mute'}>{m.name} · {fmtDate(m.at, true)}</p>
                </li>
              ))}
            </ol>
            {open.status === 'open' ? (
              <div><Field label="Reply" error={err}><textarea rows={3} value={reply} onChange={(e) => { setReply(e.target.value); setErr('') }} className={textareaCls(!!err)} /></Field><Button className="mt-2" size="sm" onClick={send}>Send reply</Button></div>
            ) : <Note>This ticket is closed. Reopen it to reply.</Note>}
          </div>
        )}
      </Drawer>
    </>
  )
}
