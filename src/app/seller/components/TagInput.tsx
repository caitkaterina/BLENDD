import { useState } from 'react'
import { X } from 'lucide-react'

export default function TagInput({ tags, onChange, placeholder, label }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string; label: string }) {
  const [v, setV] = useState('')
  const add = () => {
    const t = v.trim()
    if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...tags, t])
    setV('')
  }
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-white px-2 py-1.5 focus-within:border-ink">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-fog py-1 pl-3 pr-1 text-[13px] font-semibold">
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="grid size-5 place-items-center rounded-full hover:bg-line"><X size={12} /></button>
        </span>
      ))}
      <input
        aria-label={label}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } else if (e.key === 'Backspace' && !v && tags.length) onChange(tags.slice(0, -1)) }}
        onBlur={add}
        placeholder={tags.length ? '' : placeholder}
        className="h-8 min-w-24 flex-1 bg-transparent px-1.5 text-sm outline-none"
      />
    </div>
  )
}
