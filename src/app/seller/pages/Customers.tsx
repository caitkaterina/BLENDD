import { useMemo, useState } from 'react'
import { Empty } from '../../components/ui'
import { fmtDate, money } from '../../lib/format'
import { useLoading, useSellerData } from '../lib/useSellerData'
import { Notice, PageHeader, PageSkeleton, SearchBox, td, th } from '../components/kit'

export default function Customers() {
  const loading = useLoading()
  const { myGroups } = useSellerData()
  const [q, setQ] = useState('')
  const rows = useMemo(() => {
    const m = new Map<string, { name: string; city: string; orders: number; spent: number; last: string }>()
    for (const g of myGroups) {
      if (['cancelled', 'pending_payment', 'refunded'].includes(g.group.status)) continue
      const k = g.order.userId
      const c = m.get(k) ?? { name: g.order.address.name, city: g.order.address.city, orders: 0, spent: 0, last: g.order.placedAt }
      c.orders += 1; c.spent += g.total
      if (g.order.placedAt > c.last) { c.last = g.order.placedAt; c.city = g.order.address.city }
      m.set(k, c)
    }
    return [...m.values()].filter((c) => !q.trim() || `${c.name} ${c.city}`.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => b.spent - a.spent)
  }, [myGroups, q])
  if (loading) return <PageSkeleton rows={5} />
  return (
    <>
      <PageHeader title="Customers" sub="Buyers who have ordered from your store, built from your orders. Cancelled and refunded orders are excluded." actions={<SearchBox value={q} onChange={setQ} placeholder="Search name or city" />} />
      <div className="mb-4"><Notice>Contact details such as email and phone are not shown. To reach a buyer, use Messages so the conversation stays on the platform.</Notice></div>
      {rows.length === 0 ? <Empty title={q ? 'No customers match' : 'No customers yet'} body={q ? 'Try a different search.' : 'Customers appear here after their first order.'} /> : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-line bg-white md:block">
            <table className="w-full">
              <thead className="border-b border-line bg-fog/60"><tr><th className={th}>Customer</th><th className={th}>City</th><th className={th}>Orders</th><th className={th}>Total spent</th><th className={th}>Last order</th></tr></thead>
              <tbody className="divide-y divide-line">{rows.map((c) => <tr key={c.name + c.city}><td className={td + ' font-semibold'}>{c.name}</td><td className={td}>{c.city}</td><td className={td}>{c.orders}</td><td className={td + ' font-semibold'}>{money(c.spent)}</td><td className={td + ' text-mute'}>{fmtDate(c.last)}</td></tr>)}</tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">{rows.map((c) => <li key={c.name + c.city} className="rounded-xl border border-line bg-white p-3 text-sm"><div className="flex justify-between"><span className="font-semibold">{c.name}</span><span className="font-bold">{money(c.spent)}</span></div><p className="text-xs text-mute">{c.city} · {c.orders} order{c.orders === 1 ? '' : 's'} · last {fmtDate(c.last)}</p></li>)}</ul>
        </>
      )}
    </>
  )
}
