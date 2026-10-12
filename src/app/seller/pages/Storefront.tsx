import { useState } from 'react'
import { ExternalLink, Lock } from 'lucide-react'
import { Link } from 'react-router'
import { Button, Field, Img, Toggle, cx, textareaCls } from '../../components/ui'
import { IMG } from '../../lib/data'
import { useLoading, useSellerData } from '../lib/useSellerData'
import { Card, Notice, PageHeader, PageSkeleton } from '../components/kit'

const COVERS: [string, string][] = [['dark2', 'Studio dark'], ['blk', 'Soft black'], ['wigsBlack', 'Wig display'], ['mannequin', 'Mannequin'], ['wigs3', 'Pastel wigs'], ['longbw', 'Long waves']]

export default function Storefront() {
  const loading = useLoading()
  const { seller, updateSeller, toast } = useSellerData()
  const [f, setF] = useState(() => seller && ({ about: seller.about, dispatch: seller.dispatch, returnsPolicy: seller.returnsPolicy, shippingPolicy: seller.shippingPolicy, showLocation: seller.showLocation, acceptsEnquiries: seller.acceptsEnquiries, cover: seller.cover }))
  const [errs, setErrs] = useState<Record<string, string>>({})
  if (loading || !seller || !f) return <PageSkeleton rows={5} />
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF({ ...f, [k]: v }); setErrs({ ...errs, [k]: '' }) }
  const dirty = JSON.stringify(f) !== JSON.stringify({ about: seller.about, dispatch: seller.dispatch, returnsPolicy: seller.returnsPolicy, shippingPolicy: seller.shippingPolicy, showLocation: seller.showLocation, acceptsEnquiries: seller.acceptsEnquiries, cover: seller.cover })

  const save = () => {
    const e: Record<string, string> = {}
    if (f.about.trim().length < 20) e.about = 'Tell buyers about your store in at least 20 characters.'
    if (f.about.length > 600) e.about = 'Keep it under 600 characters.'
    if (!f.dispatch.trim()) e.dispatch = 'Add your dispatch time.'
    if (f.returnsPolicy.trim().length < 15) e.returnsPolicy = 'State your returns policy clearly.'
    if (f.shippingPolicy.trim().length < 10) e.shippingPolicy = 'Add a short shipping policy.'
    setErrs(e)
    if (Object.keys(e).length) return toast('Please fix the highlighted fields.', 'error')
    updateSeller(seller.id, { ...f, about: f.about.trim(), dispatch: f.dispatch.trim(), returnsPolicy: f.returnsPolicy.trim(), shippingPolicy: f.shippingPolicy.trim() })
    toast('Storefront updated')
  }

  return (
    <>
      <PageHeader title="Storefront" sub="Edit what buyers see on your public store page." actions={<Link to={`/store/${seller.handle}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink px-4 text-[13px] font-semibold hover:bg-ink hover:text-white">View live storefront <ExternalLink size={13} /></Link>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="Store information">
            <div className="space-y-4">
              <Field label="About your store" error={errs.about} hint={`${f.about.length}/600`}><textarea rows={4} value={f.about} onChange={(e) => set('about', e.target.value)} className={textareaCls(!!errs.about)} /></Field>
              <Field label="Dispatch time" error={errs.dispatch} hint="Shown on your store and listings. Only promise what you can meet."><input value={f.dispatch} onChange={(e) => set('dispatch', e.target.value)} className={'h-11 w-full rounded-lg border px-3.5 text-sm outline-none focus:border-ink ' + (errs.dispatch ? 'border-bad' : 'border-line')} /></Field>
              <Field label="Returns policy" error={errs.returnsPolicy}><textarea rows={3} value={f.returnsPolicy} onChange={(e) => set('returnsPolicy', e.target.value)} className={textareaCls(!!errs.returnsPolicy)} /></Field>
              <Field label="Shipping policy" error={errs.shippingPolicy}><textarea rows={3} value={f.shippingPolicy} onChange={(e) => set('shippingPolicy', e.target.value)} className={textareaCls(!!errs.shippingPolicy)} /></Field>
            </div>
          </Card>
          <Card title="Visibility">
            <div className="space-y-3">
              {([['showLocation', 'Show my city and province', `Currently: ${seller.city}, ${seller.province}.`], ['acceptsEnquiries', 'Accept enquiries', 'Let buyers message you from your store and listings.']] as const).map(([k, l, h]) => (
                <div key={k} className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{l}</p><p className="text-xs text-mute">{h}</p></div><Toggle checked={f[k]} onChange={(v) => set(k, v)} label={l} /></div>
              ))}
            </div>
          </Card>
          <Card title="Cover image">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Cover image">
              {COVERS.map(([k, label]) => {
                const id = IMG[k as keyof typeof IMG]
                const on = f.cover === id
                return (
                  <button key={k} type="button" role="radio" aria-checked={on} onClick={() => set('cover', id)} className={cx('overflow-hidden rounded-lg border-2 text-left', on ? 'border-ink ring-2 ring-pink' : 'border-transparent hover:border-line')}>
                    <Img id={id} w={400} h={220} alt="" className="aspect-[16/9]" />
                    <span className="block px-2 py-1.5 text-xs font-semibold">{label}</span>
                  </button>
                )
              })}
            </div>
          </Card>
          <Card title="Brand">
            <div className="flex items-start gap-3"><Lock size={16} className="mt-0.5 shrink-0" aria-hidden /><div className="text-sm"><p className="font-semibold">Logo and brand colours are locked</p><p className="mt-1 text-mute">BLENDD keeps store branding consistent so buyers can recognise verified, on-brand stores. Contact support if your business name or logo has changed.</p></div></div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2"><Field label="Store name"><input disabled value={seller.name} className="h-11 w-full rounded-lg border border-line bg-fog px-3.5 text-sm text-mute" /></Field><Field label="Store handle"><input disabled value={`/store/${seller.handle}`} className="h-11 w-full rounded-lg border border-line bg-fog px-3.5 text-sm text-mute" /></Field></div>
          </Card>
        </div>
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card title="Preview">
            <div className="overflow-hidden rounded-lg border border-line">
              <Img id={f.cover} w={600} h={300} alt="" className="aspect-[2/1]" />
              <div className="p-3"><p className="font-display text-lg font-extrabold">{seller.name}</p><p className="text-xs text-mute">{f.showLocation ? `${seller.city}, ${seller.province}` : 'Location hidden'} · {f.dispatch || 'No dispatch time'}</p><p className="mt-2 line-clamp-4 text-xs text-graphite">{f.about}</p></div>
            </div>
            <p className="mt-2 text-xs text-mute">Quick sketch of your header. Open the live storefront for the real page.</p>
          </Card>
          <Button full onClick={save} disabled={!dirty}>{dirty ? 'Save storefront' : 'No changes to save'}</Button>
          <Notice>Changes go live immediately on the storefront in this demo. In production, edits to policies may be reviewed.</Notice>
        </aside>
      </div>
    </>
  )
}
