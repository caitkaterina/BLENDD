import { useState } from 'react'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { useExtra, useStore } from '../../store/store'
import { fmtDate } from '../../lib/format'
import type { Seller } from '../../lib/types'
import { Badge, Button, ConfirmDialog, Empty, Modal, StatusBadge, Tabs, VerifiedBadge } from '../../components/ui'
import { DataTable, KV, Note, PageHeader, ReasonDialog, SearchBox, TableSkeleton, Toolbar, type Column } from '../components/kit'
import { SELLER_TYPE_LABEL, includesCI, useLoading } from '../lib/helpers'

type Tab = 'apps' | 'active' | 'suspended'
const DOCS = ['Business registration (CIPC)', 'Owner ID document', 'Proof of business address', 'Bank account confirmation letter']

export default function Sellers() {
  const store = useStore()
  const { sellers, products, updateSeller } = store
  const [notes, setNotes] = useExtra<Record<string, string>>('seller-info-requests', {})
  const loading = useLoading()
  const [tab, setTab] = useState<Tab>('apps')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Seller | null>(null)
  const [dlg, setDlg] = useState<null | 'info' | 'reject' | 'suspend' | 'reinstate' | 'approve'>(null)

  const isApp = (s: Seller) => s.status === 'applicant' || s.verificationStatus === 'pending'
  const groups: Record<Tab, Seller[]> = {
    apps: sellers.filter(isApp),
    active: sellers.filter((s) => s.status === 'active' && !isApp(s)),
    suspended: sellers.filter((s) => s.status === 'suspended'),
  }
  const list = groups[tab].filter((s) => !q || includesCI(`${s.name} ${s.city}`, q))
  const live = sel ? sellers.find((s) => s.id === sel.id) ?? sel : null

  const docState = (s: Seller, i: number) => (s.verificationStatus === 'verified' ? 'Verified' : s.verificationStatus === 'pending' ? (i === 3 && s.id === 's-kasi' ? 'Missing' : 'Submitted') : s.verificationStatus === 'rejected' ? 'Rejected' : 'Not submitted')

  const act = (s: Seller, patch: Partial<Seller>, action: string, msg: string, detail = '') => {
    updateSeller(s.id, patch)
    store.audit(action, `${s.name}${detail ? ` — ${detail}` : ''}`)
    store.toast(msg)
    store.notify({ audience: 'seller', kind: 'seller', title: action, body: detail || msg, href: '/seller' })
  }

  const cols: Column<Seller>[] = [
    { key: 'n', header: 'Seller', primary: true, cell: (s) => <div><p className="font-semibold">{s.name}</p><p className="text-xs text-mute">{s.city}, {s.province}</p></div> },
    { key: 't', header: 'Types', cell: (s) => <div className="flex flex-wrap gap-1">{s.types.map((t) => <Badge key={t} tone="line">{SELLER_TYPE_LABEL[t]}</Badge>)}</div> },
    { key: 'v', header: 'Verification', cell: (s) => (s.verificationStatus === 'rejected' ? <StatusBadge status="rejected" /> : <VerifiedBadge verified={s.verified} status={s.verificationStatus} />) },
    { key: 'l', header: 'Listings', cell: (s) => products.filter((p) => p.sellerId === s.id).length },
    { key: 'j', header: 'Joined', cell: (s) => fmtDate(s.joined) },
    { key: 'a', header: '', align: 'right', cell: (s) => <Button size="sm" variant={tab === 'apps' ? 'primary' : 'outline'} onClick={() => setSel(s)}>{tab === 'apps' ? 'Review' : 'Manage'}</Button> },
  ]

  return (
    <>
      <PageHeader eyebrow="People" title="Sellers" desc="Review applications and verification. Manage active and suspended seller accounts." />
      <Note className="mb-5">“Verified” is only ever set here, by an admin action, and is shown publicly only when a seller’s record has <code>verified: true</code>. Documents below are a status checklist; no files are stored in this demo.</Note>
      <Toolbar>
        <Tabs value={tab} onChange={setTab} items={[{ id: 'apps', label: 'Applications', count: groups.apps.length }, { id: 'active', label: 'Active', count: groups.active.length }, { id: 'suspended', label: 'Suspended', count: groups.suspended.length }]} />
        <div className="ml-auto flex w-full sm:w-auto"><SearchBox value={q} onChange={setQ} placeholder="Search sellers" /></div>
      </Toolbar>
      {loading ? <TableSkeleton rows={4} /> : list.length === 0 ? <Empty title={tab === 'apps' ? 'No applications waiting' : 'No sellers here'} body="Nothing matches this view right now." /> : <DataTable caption="Sellers" columns={cols} rows={list} rowKey={(s) => s.id} />}

      <Modal wide open={!!live} onClose={() => setSel(null)} title={live ? `${live.name}` : ''}
        footer={live && (
          <>
            {live.status === 'suspended' ? <Button variant="dark" onClick={() => setDlg('reinstate')}>Reinstate</Button> : <Button variant="outline" onClick={() => setDlg('suspend')}>Suspend</Button>}
            <Button variant="outline" onClick={() => setDlg('info')}>Request more info</Button>
            <Button variant="danger" onClick={() => setDlg('reject')} disabled={live.verificationStatus === 'rejected'}>Reject</Button>
            <Button onClick={() => setDlg('approve')} disabled={live.verified && live.status === 'active'}>Approve & verify</Button>
          </>
        )}>
        {live && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-display text-base font-bold">Business info</h3>
              <dl>
                <KV k="Trading name" v={live.name} />
                <KV k="Handle" v={`@${live.handle}`} />
                <KV k="Seller types" v={live.types.map((t) => SELLER_TYPE_LABEL[t]).join(', ')} />
                <KV k="Location" v={`${live.city}, ${live.province}`} />
                <KV k="Account status" v={<StatusBadge status={live.status === 'applicant' ? 'pending' : live.status} />} />
                <KV k="Verification" v={<VerifiedBadge verified={live.verified} status={live.verificationStatus} />} />
                <KV k="Public listings" v={products.filter((p) => p.sellerId === live.id && p.status === 'published').length} />
              </dl>
              <p className="mt-3 text-sm text-graphite">{live.about}</p>
              {notes[live.id] && <Note tone="warn" className="mt-3">Info requested: {notes[live.id]}</Note>}
            </div>
            <div>
              <h3 className="mb-2 font-display text-base font-bold">Documents checklist</h3>
              <ul className="space-y-2">
                {DOCS.map((d, i) => {
                  const st = docState(live, i)
                  const Icon = st === 'Verified' || st === 'Submitted' ? CheckCircle2 : st === 'Missing' ? Clock : Circle
                  return <li key={d} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm"><span className="flex items-center gap-2"><Icon size={15} className={st === 'Verified' ? 'text-ok' : 'text-mute'} aria-hidden />{d}</span><Badge tone={st === 'Verified' ? 'ok' : st === 'Submitted' ? 'neutral' : st === 'Missing' || st === 'Rejected' ? 'warn' : 'line'}>{st}</Badge></li>
                })}
              </ul>
              <p className="mt-2 text-xs text-mute">Status only. Document contents are never shown or stored in the demo.</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={dlg === 'approve'} onClose={() => setDlg(null)} title="Approve and verify seller?" confirmLabel="Approve & verify" body={`${live?.name} will become an active, publicly “Verified seller”. Only approve after reviewing documents.`}
        onConfirm={() => live && act(live, { status: 'active', verified: true, verificationStatus: 'verified' }, 'Verified seller', `${live.name} approved and verified`)} />
      <ConfirmDialog open={dlg === 'reinstate'} onClose={() => setDlg(null)} title="Reinstate seller?" confirmLabel="Reinstate" body="The seller account becomes active again." onConfirm={() => live && act(live, { status: 'active' }, 'Reinstated seller', `${live.name} reinstated`)} />
      <ReasonDialog open={dlg === 'suspend'} onClose={() => setDlg(null)} danger title="Suspend seller" confirmLabel="Suspend" body="Suspended sellers cannot trade. Their reason is recorded in the audit log." onConfirm={(r) => live && act(live, { status: 'suspended' }, 'Suspended seller', `${live.name} suspended`, r)} />
      <ReasonDialog open={dlg === 'reject'} onClose={() => setDlg(null)} danger title="Reject verification" confirmLabel="Reject" label="Reason (shared with the seller)" onConfirm={(r) => live && act(live, { verificationStatus: 'rejected', verified: false }, 'Rejected seller verification', `${live.name} rejected`, r)} />
      <ReasonDialog open={dlg === 'info'} onClose={() => setDlg(null)} title="Request more information" confirmLabel="Send request (demo)" label="What do you need from the seller?" body="A notification is added to the seller workspace; no email is sent."
        onConfirm={(r) => { if (!live) return; setNotes({ ...notes, [live.id]: r }); store.audit('Requested seller info', `${live.name} — ${r}`); store.notify({ audience: 'seller', kind: 'seller', title: 'More information needed', body: r, href: '/seller' }); store.toast('Request recorded') }} />
    </>
  )
}
