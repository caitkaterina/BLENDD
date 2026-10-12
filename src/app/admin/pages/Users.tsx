import { useMemo, useState } from 'react'
import { CheckCircle2, MinusCircle } from 'lucide-react'
import { useExtra, useStore } from '../../store/store'
import { USERS } from '../../lib/data'
import { fmtDate, money } from '../../lib/format'
import { Badge, Button, ConfirmDialog, Empty, StatusBadge } from '../../components/ui'
import { DataTable, Drawer, FilterSelect, KV, Note, PageHeader, SearchBox, TableSkeleton, Toolbar, type Column } from '../components/kit'
import { includesCI, useLoading } from '../lib/helpers'

interface Row { id: string; name: string; email: string; phone: string; roles: string[]; emailVerified: boolean; phoneVerified: boolean; sellerId?: string; city?: string }

export default function Users() {
  const store = useStore()
  const { orders, sellers } = store
  const [susp, setSusp] = useExtra<string[]>('suspended-users', [])
  const loading = useLoading()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [open, setOpen] = useState<Row | null>(null)
  const [confirm, setConfirm] = useState<Row | null>(null)

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>()
    const add = (r: Row) => { if (!map.has(r.id)) map.set(r.id, r) }
    Object.values(USERS).filter((u) => !u.roles.includes('admin')).forEach((u) => add({ id: u.id, name: u.name, email: u.email, phone: u.phone, roles: u.roles, emailVerified: u.emailVerified, phoneVerified: u.phoneVerified, sellerId: u.sellerId }))
    orders.forEach((o) => add({ id: o.userId, name: o.address.name, email: `${o.address.name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.co.za`, phone: o.address.phone, roles: ['buyer'], emailVerified: true, phoneVerified: false, city: o.address.city }))
    sellers.forEach((s) => add({ id: `seller-${s.id}`, name: `${s.name} (owner)`, email: `${s.handle}@example.co.za`, phone: '—', roles: ['buyer', 'seller'], emailVerified: s.verificationStatus !== 'not_submitted', phoneVerified: s.verified, sellerId: s.id, city: s.city }))
    return [...map.values()]
  }, [orders, sellers])

  const list = rows.filter((r) => (role === 'all' || r.roles.includes(role)) && (!q || includesCI(`${r.name} ${r.email}`, q)))
  const isSusp = (r: Row) => susp.includes(r.id)
  const toggle = (r: Row) => {
    const on = isSusp(r)
    setSusp(on ? susp.filter((x) => x !== r.id) : [...susp, r.id])
    store.audit(on ? 'Reinstated user' : 'Suspended user', `${r.name} (${r.email})`)
    store.toast(on ? `${r.name} reinstated` : `${r.name} suspended (demo)`)
  }
  const ver = (ok: boolean, label: string) => <span className="inline-flex items-center gap-1 text-xs">{ok ? <CheckCircle2 size={13} className="text-ok" aria-hidden /> : <MinusCircle size={13} className="text-mute" aria-hidden />}{label} {ok ? 'verified' : 'unverified'}</span>

  const cols: Column<Row>[] = [
    { key: 'n', header: 'User', primary: true, cell: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-mute">{r.email}</p></div> },
    { key: 'r', header: 'Role', cell: (r) => <div className="flex flex-wrap gap-1">{r.roles.map((x) => <Badge key={x} tone={x === 'seller' ? 'pink' : 'neutral'} className="capitalize">{x}</Badge>)}</div> },
    { key: 'v', header: 'Verification', cell: (r) => <div className="space-y-0.5">{ver(r.emailVerified, 'Email')}<br />{ver(r.phoneVerified, 'Phone')}</div> },
    { key: 'o', header: 'Orders', cell: (r) => orders.filter((o) => o.userId === r.id || (!r.id.startsWith('seller-') && o.address.name === r.name)).length },
    { key: 's', header: 'Status', cell: (r) => <StatusBadge status={isSusp(r) ? 'suspended' : 'active'} /> },
    { key: 'a', header: 'Actions', align: 'right', cell: (r) => (
      <div className="flex justify-end gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => setOpen(r)}>Activity</Button>
        <Button size="sm" variant={isSusp(r) ? 'dark' : 'outline'} onClick={() => setConfirm(r)}>{isSusp(r) ? 'Reinstate' : 'Suspend'}</Button>
      </div>
    ) },
  ]

  const userOrders = open ? orders.filter((o) => o.userId === open.id || o.address.name === open.name) : []

  return (
    <>
      <PageHeader eyebrow="People" title="Users" desc="Seeded demo accounts, order contacts and seller owners. Contact details are fictional. Payment data is never shown here." />
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Search name or email" />
        <FilterSelect label="Filter by role" value={role} onChange={setRole} options={[{ value: 'all', label: 'All roles' }, { value: 'buyer', label: 'Buyers' }, { value: 'seller', label: 'Sellers' }]} />
        <span className="ml-auto text-xs text-mute">{list.length} of {rows.length}</span>
      </Toolbar>
      {loading ? <TableSkeleton /> : list.length === 0 ? <Empty title="No users match" body="Try a different search or role filter." action={<Button variant="outline" onClick={() => { setQ(''); setRole('all') }}>Clear filters</Button>} /> : <DataTable caption="Users" columns={cols} rows={list} rowKey={(r) => r.id} />}

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name ?? 'User'}>
        {open && (
          <div className="space-y-5">
            <dl>
              <KV k="Email" v={open.email} />
              <KV k="Phone" v={open.phone || '—'} />
              <KV k="Roles" v={open.roles.join(', ')} />
              <KV k="Location" v={open.city ?? '—'} />
              <KV k="Account status" v={<StatusBadge status={isSusp(open) ? 'suspended' : 'active'} />} />
              <KV k="Orders" v={userOrders.length} />
            </dl>
            <Note>Payment details are never displayed in the admin workspace; only the payment method label and demo status are kept on orders.</Note>
            <div>
              <h3 className="mb-2 font-display text-base font-bold">Order activity</h3>
              {userOrders.length === 0 ? <p className="text-sm text-mute">No orders for this user.</p> : (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {userOrders.map((o) => <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><div><p className="font-semibold">{o.ref}</p><p className="text-xs text-mute">{fmtDate(o.placedAt)} · {o.payment.method}</p></div><span className="font-semibold">{money(o.total)}</span></li>)}
                </ul>
              )}
            </div>
          </div>
        )}
      </Drawer>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} danger={!!confirm && !isSusp(confirm)} title={confirm && isSusp(confirm) ? 'Reinstate user?' : 'Suspend user?'} confirmLabel={confirm && isSusp(confirm) ? 'Reinstate' : 'Suspend'} body={confirm && (isSusp(confirm) ? `${confirm.name} will regain access (demo state only).` : `${confirm.name} will be marked suspended in the demo data. This action is recorded in the audit log.`)} onConfirm={() => confirm && toggle(confirm)} />
    </>
  )
}
