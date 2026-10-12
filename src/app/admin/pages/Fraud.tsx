import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useExtra, useStore } from '../../store/store'
import { fmtDate } from '../../lib/format'
import { Badge, Button, ConfirmDialog, Empty, Tabs } from '../../components/ui'
import { Note, PageHeader, ReasonDialog, TableSkeleton, Toolbar } from '../components/kit'
import { useLoading } from '../lib/helpers'

interface Flag { id: string; kind: string; severity: 'high' | 'medium' | 'low'; subject: string; detail: string; at: string; sellerId?: string; status: 'open' | 'escalated' | 'dismissed' }
const SEED: Flag[] = [
  { id: 'fl-1', kind: 'Multiple failed payments', severity: 'high', subject: 'Buyer: Sibusiso Radebe', detail: '6 failed card attempts in 14 minutes from 2 devices (demo signal).', at: '2026-10-10T07:42:00', status: 'open' },
  { id: 'fl-2', kind: 'Mismatched addresses', severity: 'medium', subject: 'Order BL-261010-2288', detail: 'Delivery suburb does not match the postal code provided.', at: '2026-10-10T08:20:00', status: 'open' },
  { id: 'fl-3', kind: 'Duplicate listings', severity: 'medium', subject: 'Seller: Kasi Crown Wigs', detail: 'Three listings with identical photos and near-identical titles.', at: '2026-10-09T15:10:00', sellerId: 's-kasi', status: 'open' },
  { id: 'fl-4', kind: 'Review spam', severity: 'low', subject: 'Seller: Nene\'s Curl Closet', detail: 'Five 5-star reviews posted within an hour from new accounts.', at: '2026-10-08T19:30:00', sellerId: 's-nene', status: 'open' },
]
const TONE = { high: 'bad', medium: 'warn', low: 'neutral' } as const

export default function Fraud() {
  const store = useStore()
  const { sellers, updateSeller } = store
  const [flags, setFlags] = useExtra<Flag[]>('fraud-flags', SEED)
  const loading = useLoading()
  const [tab, setTab] = useState<'open' | 'escalated' | 'dismissed'>('open')
  const [dismiss, setDismiss] = useState<Flag | null>(null)
  const [suspend, setSuspend] = useState<Flag | null>(null)
  const set = (id: string, status: Flag['status']) => setFlags(flags.map((f) => (f.id === id ? { ...f, status } : f)))
  const shown = flags.filter((f) => f.status === tab)
  const count = (s: Flag['status']) => flags.filter((f) => f.status === s).length

  return (
    <>
      <PageHeader eyebrow="Trust & care" title="Suspicious activity" desc="Seeded demo signals. Real fraud screening would come from payment and device-risk providers." />
      <Note className="mb-5">Flags are signals for human review, not proof of wrongdoing. Document the outcome before acting on an account.</Note>
      <Toolbar><Tabs value={tab} onChange={setTab} items={[{ id: 'open', label: 'Open', count: count('open') }, { id: 'escalated', label: 'Escalated', count: count('escalated') }, { id: 'dismissed', label: 'Dismissed', count: count('dismissed') }]} /></Toolbar>
      {loading ? <TableSkeleton rows={3} /> : shown.length === 0 ? <Empty title="Nothing here" body="No flags in this state." /> : (
        <ul className="space-y-3">
          {shown.map((f) => {
            const sel = sellers.find((s) => s.id === f.sellerId)
            return (
              <li key={f.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center gap-2"><AlertTriangle size={16} aria-hidden /><h3 className="font-display text-base font-bold">{f.kind}</h3><Badge tone={TONE[f.severity]} className="capitalize">{f.severity}</Badge><span className="ml-auto text-xs text-mute">{fmtDate(f.at, true)}</span></div>
                <p className="mt-1 text-sm font-medium">{f.subject}</p>
                <p className="mt-1 text-sm text-graphite">{f.detail}</p>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {sel && <Button size="sm" variant="danger" disabled={sel.status === 'suspended'} title={sel.status === 'suspended' ? 'Seller already suspended' : undefined} onClick={() => setSuspend(f)}>{sel.status === 'suspended' ? 'Seller suspended' : 'Suspend seller'}</Button>}
                  {f.status === 'open' && <Button size="sm" variant="outline" onClick={() => { set(f.id, 'escalated'); store.audit('Escalated fraud flag', `${f.kind} — ${f.subject}`); store.toast('Flag escalated') }}>Escalate</Button>}
                  {f.status !== 'dismissed' ? <Button size="sm" variant="ghost" onClick={() => setDismiss(f)}>Dismiss</Button> : <Button size="sm" variant="outline" onClick={() => { set(f.id, 'open'); store.audit('Reopened fraud flag', f.subject); store.toast('Flag reopened') }}>Reopen</Button>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <ReasonDialog open={!!dismiss} onClose={() => setDismiss(null)} title="Dismiss flag" confirmLabel="Dismiss" label="Why is this not a concern?" onConfirm={(r) => { if (!dismiss) return; set(dismiss.id, 'dismissed'); store.audit('Dismissed fraud flag', `${dismiss.kind} — ${dismiss.subject}: ${r}`); store.toast('Flag dismissed') }} />
      <ConfirmDialog open={!!suspend} onClose={() => setSuspend(null)} danger title="Suspend seller?" confirmLabel="Suspend seller" body="The seller account is suspended in the demo data and the flag is marked escalated." onConfirm={() => { if (!suspend?.sellerId) return; updateSeller(suspend.sellerId, { status: 'suspended' }); set(suspend.id, 'escalated'); store.audit('Suspended seller (fraud flag)', `${suspend.subject} — ${suspend.kind}`); store.toast('Seller suspended') }} />
    </>
  )
}
