import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from 'lucide-react'
import { IMG, imgUrl } from '../../lib/data'
import { Badge, Button, cx } from '../../components/ui'

const MAX = 8

/** Downscale to keep localStorage usage sane, return a JPEG data URL. */
function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onerror = () => reject(new Error('read'))
    fr.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode'))
      img.onload = () => {
        const scale = Math.min(1, 1100 / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        const ctx = c.getContext('2d')
        if (!ctx) return resolve(fr.result as string)
        ctx.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.8))
      }
      img.src = fr.result as string
    }
    fr.readAsDataURL(file)
  })
}

const PRESETS = [IMG.wigsBlack, IMG.bundleOrange, IMG.bundleOmbre, IMG.blackTop, IMG.extWall, IMG.brush]

export default function ImageUploader({ images, onChange, error }: { images: string[]; onChange: (v: string[]) => void; error?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const add = async (files: FileList | null) => {
    if (!files?.length) return
    setMsg('')
    const room = MAX - images.length
    const list = [...files].slice(0, room)
    const bad = list.filter((f) => !f.type.startsWith('image/') || f.size > 10 * 1024 * 1024)
    const ok = list.filter((f) => !bad.includes(f))
    setBusy(true)
    try {
      const urls = await Promise.all(ok.map(toDataUrl))
      onChange([...images, ...urls])
      const notes = [bad.length && `${bad.length} file(s) skipped (images under 10MB only)`, files.length > room && `Maximum ${MAX} photos`].filter(Boolean)
      if (notes.length) setMsg(notes.join('. '))
    } catch {
      setMsg('One of the images could not be read. Try a JPG or PNG.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  const move = (i: number, d: -1 | 1) => {
    const n = [...images]; const j = i + d
    if (j < 0 || j >= n.length) return
    ;[n[i], n[j]] = [n[j], n[i]]
    onChange(n)
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((src, i) => (
          <div key={src.slice(-40) + i} className={cx('rounded-lg border p-1.5', i === 0 ? 'border-ink' : 'border-line')}>
            <div className="relative aspect-square overflow-hidden rounded-md bg-fog">
              <img src={imgUrl(src, 300, 300)} alt={`Product photo ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && <Badge tone="dark" className="absolute left-1.5 top-1.5">Main</Badge>}
            </div>
            <div className="mt-1.5 flex justify-between">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move photo ${i + 1} earlier`} className="grid size-8 place-items-center rounded-full hover:bg-fog disabled:opacity-30"><ArrowUp size={14} /></button>
              <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label={`Move photo ${i + 1} later`} className="grid size-8 place-items-center rounded-full hover:bg-fog disabled:opacity-30"><ArrowDown size={14} /></button>
              <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} aria-label={`Remove photo ${i + 1}`} className="grid size-8 place-items-center rounded-full text-bad hover:bg-fog"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {images.length < MAX && (
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="grid aspect-square place-items-center rounded-lg border border-dashed border-mute/50 text-sm font-semibold text-graphite hover:border-ink hover:bg-fog">
            <span className="text-center"><ImagePlus className="mx-auto mb-1" size={22} />{busy ? 'Processing...' : 'Upload photos'}</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" multiple accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => add(e.target.files)} />
      {(error || msg) && <p role="alert" className="mt-2 text-xs font-medium text-bad">{error || msg}</p>}
      <p className="mt-2 text-xs text-mute">The first photo is the main image. Photos are resized and stored in this browser in demo mode. Use photos of the actual item you sell.</p>
      {images.length < MAX && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold">Or add a demo stock photo</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((id) => (
              <Button key={id} type="button" size="sm" variant="ghost" className="!h-auto !p-1" aria-label="Add this stock photo" onClick={() => !images.includes(id) && onChange([...images, id])}>
                <img src={imgUrl(id, 120, 120)} alt="" className="size-14 rounded-md object-cover" />
              </Button>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
