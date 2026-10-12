import { useState } from 'react'
import { Tabs } from '../../components/ui'
import { money } from '../../lib/format'
import { hash, useLoading, useSellerData } from '../lib/useSellerData'
import { BarChart, Card, Kpi, LineChart, Notice, PageHeader, PageSkeleton, Thumb, td, th } from '../components/kit'

type Range = '7' | '30' | '90'

export default function Analytics() {
  const loading = useLoading()
  const { myProducts, sellerId, myGroups } = useSellerData()
  const [range, setRange] = useState<Range>('30')
  if (loading) return <PageSkeleton cards={3} rows={3} />

  const n = Number(range)
  const seedBase = 400 + (hash(sellerId) % 300)
  const views = Array.from({ length: n }, (_, i) => Math.round(seedBase + 120 * Math.sin(i / 3) + (hash(`${sellerId}${i}`) % 140)))
  const total = views.reduce((a, b) => a + b, 0)
  const orders = myGroups.filter((g) => !['cancelled', 'pending_payment'].includes(g.group.status)).length
  const conv = Math.min(8, 1.2 + (orders % 5) * 0.6)
  const step = Math.ceil(n / 7)
  const pts = views.filter((_, i) => i % step === 0)
  const labels = pts.map((_, i) => `D${i * step + 1}`)
  const top = myProducts.filter((p) => p.status === 'published').map((p) => ({ p, v: p.popularity * 23 + (hash(p.id) % 90) })).sort((a, b) => b.v - a.v).slice(0, 5)
  const sources = [['Search on BLENDD', 46], ['Category browsing', 27], ['Direct / shared link', 15], ['Social media', 12]] as const

  return (
    <>
      <PageHeader title="Analytics" sub="Traffic and conversion trends." actions={<Tabs value={range} onChange={setRange} items={[{ id: '7', label: '7 days' }, { id: '30', label: '30 days' }, { id: '90', label: '90 days' }]} />} />
      <div className="mb-5"><Notice tone="dark" strong>Illustrative demo analytics. No real visitor tracking is connected, so these numbers are generated and are not a forecast of your performance.</Notice></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Product views" value={total.toLocaleString('en-ZA')} demo />
        <Kpi label="Conversion rate" value={`${conv.toFixed(1)}%`} demo />
        <Kpi label="Avg. order value" value={myGroups.length ? money(Math.round(myGroups.reduce((a, g) => a + g.subtotal, 0) / myGroups.length)) : '–'} sub="From your orders" />
        <Kpi label="Add-to-cart rate" value={`${(conv * 3.1).toFixed(1)}%`} demo />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="Views over time" className="lg:col-span-2"><LineChart points={pts} labels={labels} format={(v) => v.toLocaleString('en-ZA')} /></Card>
        <Card title="Traffic by source"><BarChart data={sources.map(([label, value]) => ({ label: label.split(' ')[0], value }))} format={(v) => `${v}%`} /><ul className="mt-3 space-y-1 text-xs text-mute">{sources.map(([l, v]) => <li key={l} className="flex justify-between"><span>{l}</span><span className="font-semibold text-ink">{v}%</span></li>)}</ul></Card>
      </div>
      <Card title="Top products by views" className="mt-5" flush>
        {top.length === 0 ? <p className="p-6 text-center text-sm text-mute">Publish a listing to see product analytics.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[420px]"><thead className="border-b border-line bg-fog/60"><tr><th className={th}>Product</th><th className={th + ' text-right'}>Views (demo)</th></tr></thead><tbody className="divide-y divide-line">{top.map(({ p, v }) => <tr key={p.id}><td className={td}><div className="flex items-center gap-3"><Thumb src={p.images[0]} alt="" size={36} /><span className="line-clamp-1 font-semibold">{p.title}</span></div></td><td className={td + ' text-right font-semibold'}>{v.toLocaleString('en-ZA')}</td></tr>)}</tbody></table></div>
        )}
      </Card>
    </>
  )
}
