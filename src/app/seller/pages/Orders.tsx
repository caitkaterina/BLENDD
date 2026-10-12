import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Empty, StatusBadge, Tabs } from '../../components/ui'
import { fmtDate, money, STATUS_LABEL } from '../../lib/format'
import type { GroupStatus } from '../../lib/types'
import { useLoading, useSellerData } from '../lib/useSellerData'
import OrderDetail from '../components/OrderDetail'
import { PageHeader, PageSkeleton, SearchBox, Thumb } from '../components/kit'

type Tab = 'all' | GroupStatus
const TABS: Tab[] = ['all', 'paid', 'processing', 'shipped', 'delivered', 'return_requested', 'cancelled', 'refunded']

export default function Orders() {
  const loading = useLoading()
  const { myGroups } = useSellerData()
  const [sp, setSp] = useSearchParams()
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const openKey = sp.get('open')
  const open = myGroups.find((g) => g.key === openKey) ?? null

  const rows = useMemo(() => myGroups.filter((g) => (tab === 'all' || g.group.status === tab) && (!q.trim() || `${g.order.ref} ${g.order.address.name}`.toLowerCase().includes(q.trim().toLowerCase()))), [myGroups, tab, q])
  if (loading) return <PageSkeleton rows={5} />

  return (
    <>
      <PageHeader title="Orders" sub="Orders are split by seller. You only see and fulfil the items sold by your store." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onChange={setTab} items={TABS.map((t) => ({ id: t, label: t === 'all' ? 'All' : STATUS_LABEL[t], count: t === 'all' ? myGroups.length : myGroups.filter((g) => g.group.status === t).length }))} />
        <SearchBox value={q} onChange={setQ} placeholder="Search order or buyer" />
      </div>
      {rows.length === 0 ? (
        <Empty title={myGroups.length ? 'No orders in this view' : 'No orders yet'} body={myGroups.length ? 'Try another status tab.' : 'When a buyer pays for your items, the order appears here.'} />
      ) : (
        <ul className="space-y-3">
          {rows.map((g) => (
            <li key={g.key}>
              <button type="button" onClick={() => setSp({ open: g.key })} className="flex w-full flex-col gap-3 rounded-xl border border-line bg-white p-4 text-left transition-colors hover:border-ink sm:flex-row sm:items-center">
                <div className="flex -space-x-2">
                  {g.group.lines.slice(0, 3).map((l, i) => <span key={i} className="rounded-md ring-2 ring-white"><Thumb src={l.image} alt="" size={48} /></span>)}
                  {g.group.lines.length > 3 && <span className="grid size-12 place-items-center rounded-md bg-fog text-xs font-semibold ring-2 ring-white">+{g.group.lines.length - 3}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{g.order.ref} <span className="font-normal text-mute">· {fmtDate(g.order.placedAt)}</span></p>
                  <p className="truncate text-sm">{g.order.address.name} · {g.order.address.city}</p>
                  <p className="truncate text-xs text-mute">{g.group.lines.map((l) => `${l.qty}x ${l.title}`).join(', ')}</p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="font-bold">{money(g.total)}</span>
                  <StatusBadge status={g.group.status} />
                  <ChevronRight size={16} className="hidden text-mute sm:block" aria-hidden />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <OrderDetail key={openKey ?? 'none'} sg={open} onClose={() => setSp({})} />
    </>
  )
}
