import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useExtra, useStore } from '../../store/store'
import { fmtDate, nowIso, uid } from '../../lib/format'
import { Button, ConfirmDialog, Field, Modal, Tabs, inputCls, textareaCls } from '../../components/ui'
import { Note, PageHeader, PageSkeleton, Panel } from '../components/kit'
import { useLoading } from '../lib/helpers'

interface Stamp { by: string; at: string }
interface Faq { id: string; q: string; a: string }
interface Cms { announcementStamp?: Stamp; faq: Faq[]; faqStamp?: Stamp; policies: Record<string, { text: string } & Partial<Stamp>> }

const POLICY_TITLES: Record<string, string> = { returns: 'Returns', shipping: 'Shipping', terms: 'Terms of use', privacy: 'Privacy', authenticity: 'Authenticity guidance' }
const DEFAULT: Cms = {
  faq: [
    { id: 'f1', q: 'Who sells on BLENDD?', a: 'Independent sellers: resellers, retailers, wholesalers and manufacturers. Each sets its own shipping and returns policy.' },
    { id: 'f2', q: 'What does “Verified seller” mean?', a: 'A BLENDD admin reviewed the seller’s business documents. It is not a guarantee of any individual product.' },
    { id: 'f3', q: 'Is this a real shop?', a: 'No. This is a demo with sample data; no payments are taken.' },
  ],
  policies: {
    returns: { text: 'Returns are governed by each seller’s returns policy shown on their store page. Unworn, uncut and unaltered items are generally eligible within the period the seller states.' },
    shipping: { text: 'Sellers set their own shipping fees and dispatch times. Estimated delivery times are estimates, not guarantees.' },
    terms: { text: 'Draft terms of use — placeholder for the demo.' },
    privacy: { text: 'Draft privacy notice — placeholder for the demo. Describes what personal information is collected and why, in line with POPIA.' },
    authenticity: { text: 'BLENDD does not guarantee the origin, hair type or processing of listed products. Origin and processing claims are made by sellers; look for “seller states” wording and ask the seller for evidence before buying.' },
  },
}

export default function Content() {
  const store = useStore()
  const { settings, updateSettings, user } = store
  const [cms, setCms] = useExtra<Cms>('cms', DEFAULT)
  const loading = useLoading()
  const [tab, setTab] = useState<'announcement' | 'faq' | 'policies'>('announcement')
  const [ann, setAnn] = useState(settings.announcement)
  const [pol, setPol] = useState('returns')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [faq, setFaq] = useState<Faq | null>(null)
  const [faqErr, setFaqErr] = useState('')
  const [del, setDel] = useState<Faq | null>(null)
  if (loading) return <PageSkeleton />
  const stamp = (): Stamp => ({ by: user?.name ?? 'Admin', at: nowIso() })
  const stampText = (s?: Partial<Stamp>) => (s?.at ? `Last edited by ${s.by} · ${fmtDate(s.at, true)}` : 'Last edited: seeded demo content')

  const annErr = !ann.trim() ? 'Announcement cannot be empty.' : ann.length > 200 ? 'Keep it under 200 characters.' : ''
  const polText = drafts[pol] ?? cms.policies[pol]?.text ?? ''
  const polErr = polText.trim().length < 20 ? 'Policy text should be at least 20 characters.' : ''

  return (
    <>
      <PageHeader eyebrow="Platform" title="Content" desc="Announcement, FAQ and policy pages." />
      <Note tone="warn" className="mb-5">Policy and legal text here is draft copy. Terms, privacy and returns wording must be reviewed by a qualified lawyer (including POPIA and Consumer Protection Act considerations) before launch.</Note>
      <Tabs className="mb-5" value={tab} onChange={setTab} items={[{ id: 'announcement', label: 'Announcement' }, { id: 'faq', label: 'FAQ', count: cms.faq.length }, { id: 'policies', label: 'Policy pages' }]} />

      {tab === 'announcement' && (
        <Panel title="Announcement bar">
          <Field label="Text" error={annErr} hint={`${ann.length}/200 · Same text as the homepage announcement bar in Merchandising.`}><textarea rows={3} value={ann} onChange={(e) => setAnn(e.target.value)} className={textareaCls(!!annErr)} /></Field>
          <div className="mt-3 rounded-lg bg-ink px-4 py-2 text-center text-xs text-white">{ann || 'Empty'}</div>
          <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-mute">{stampText(cms.announcementStamp)}</span><Button variant="dark" disabled={!!annErr || ann === settings.announcement} onClick={() => { updateSettings({ announcement: ann.trim() }); setCms({ ...cms, announcementStamp: stamp() }); store.audit('Edited announcement', ann.trim().slice(0, 80)); store.toast('Announcement published') }}>Publish</Button></div>
        </Panel>
      )}

      {tab === 'faq' && (
        <Panel title="FAQ entries" action={<Button size="sm" variant="dark" onClick={() => { setFaqErr(''); setFaq({ id: uid('f'), q: '', a: '' }) }}><Plus size={14} /> Add entry</Button>}>
          {cms.faq.length === 0 ? <p className="text-sm text-mute">No FAQ entries yet.</p> : (
            <ul className="divide-y divide-line">{cms.faq.map((f) => (
              <li key={f.id} className="flex items-start gap-3 py-3"><div className="min-w-0 flex-1"><p className="font-semibold">{f.q}</p><p className="mt-0.5 text-sm text-mute">{f.a}</p></div>
                <button aria-label={`Edit ${f.q}`} onClick={() => { setFaqErr(''); setFaq(f) }} className="grid size-9 place-items-center rounded-full hover:bg-fog"><Pencil size={15} /></button>
                <button aria-label={`Remove ${f.q}`} onClick={() => setDel(f)} className="grid size-9 place-items-center rounded-full hover:bg-fog"><Trash2 size={15} /></button></li>
            ))}</ul>
          )}
          <p className="mt-3 text-xs text-mute">{stampText(cms.faqStamp)}</p>
        </Panel>
      )}

      {tab === 'policies' && (
        <Panel title="Policy pages">
          <Tabs className="mb-4" value={pol} onChange={setPol} items={Object.entries(POLICY_TITLES).map(([id, label]) => ({ id, label }))} />
          <Field label={POLICY_TITLES[pol]} error={polErr}><textarea rows={10} value={polText} onChange={(e) => setDrafts({ ...drafts, [pol]: e.target.value })} className={textareaCls(!!polErr)} /></Field>
          <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-mute">{stampText(cms.policies[pol])}</span>
            <Button variant="dark" disabled={!!polErr || drafts[pol] === undefined || drafts[pol] === cms.policies[pol]?.text} onClick={() => { setCms({ ...cms, policies: { ...cms.policies, [pol]: { text: polText.trim(), ...stamp() } } }); setDrafts(({ [pol]: _drop, ...rest }) => rest); store.audit('Edited policy page', POLICY_TITLES[pol]); store.toast(`${POLICY_TITLES[pol]} saved`) }}>Save draft</Button></div>
        </Panel>
      )}

      <Modal open={!!faq} onClose={() => setFaq(null)} title={faq && cms.faq.some((f) => f.id === faq.id) ? 'Edit FAQ entry' : 'New FAQ entry'} footer={<><Button variant="ghost" onClick={() => setFaq(null)}>Cancel</Button><Button variant="dark" onClick={() => { if (!faq) return; if (faq.q.trim().length < 5 || faq.a.trim().length < 5) return setFaqErr('Question and answer are both required (5+ characters).'); const ex = cms.faq.some((f) => f.id === faq.id); setCms({ ...cms, faqStamp: stamp(), faq: ex ? cms.faq.map((f) => (f.id === faq.id ? faq : f)) : [...cms.faq, faq] }); store.audit(ex ? 'Edited FAQ entry' : 'Added FAQ entry', faq.q); store.toast('FAQ saved'); setFaq(null) }}>Save</Button></>}>
        {faq && <div className="space-y-4"><Field label="Question"><input value={faq.q} onChange={(e) => { setFaq({ ...faq, q: e.target.value }); setFaqErr('') }} className={inputCls(!!faqErr)} /></Field><Field label="Answer" error={faqErr}><textarea rows={4} value={faq.a} onChange={(e) => { setFaq({ ...faq, a: e.target.value }); setFaqErr('') }} className={textareaCls(!!faqErr)} /></Field></div>}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger title="Remove FAQ entry?" confirmLabel="Remove" body={`“${del?.q}” will be deleted.`} onConfirm={() => { if (!del) return; setCms({ ...cms, faqStamp: stamp(), faq: cms.faq.filter((f) => f.id !== del.id) }); store.audit('Removed FAQ entry', del.q); store.toast('FAQ entry removed') }} />
    </>
  )
}
