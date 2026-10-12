import { useState, type ReactNode } from 'react'
import { Info, Search } from 'lucide-react'
import { Skeleton, cx } from '../../components/ui'
import { imgUrl } from '../../lib/data'

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-sm text-mute">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ title, action, children, className = '', flush }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cx('rounded-xl border border-line bg-white', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          {title && <h2 className="font-display text-[15px] font-bold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      <div className={flush ? '' : 'p-4'}>{children}</div>
    </section>
  )
}

export function Notice({ children, tone = 'info', strong }: { children: ReactNode; tone?: 'info' | 'warn' | 'dark'; strong?: boolean }) {
  return (
    <div
      role={tone === 'warn' ? 'alert' : 'note'}
      className={cx(
        'flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-[13px] leading-relaxed',
        tone === 'warn' ? 'border border-[#ecd29c] bg-[#fbefd6] text-[#5e3b08]' : tone === 'dark' ? 'bg-ink text-white' : 'border border-dashed border-mute/40 bg-white text-graphite',
        strong && 'font-semibold',
      )}
    >
      <Info size={16} className={cx('mt-0.5 shrink-0', tone === 'dark' && 'text-pink')} aria-hidden />
      <div>{children}</div>
    </div>
  )
}

export function Kpi({ label, value, sub, demo }: { label: string; value: string; sub?: string; demo?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-xs font-semibold text-mute">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-mute">{demo ? <span className="font-semibold uppercase tracking-wider">Illustrative demo · </span> : null}{sub}</p>
    </div>
  )
}

export function Thumb({ src, alt, size = 44 }: { src?: string; alt: string; size?: number }) {
  const [bad, setBad] = useState<string | undefined>()
  return src && bad !== src ? (
    <img src={imgUrl(src, size * 2, size * 2)} alt={alt} loading="lazy" onError={() => setBad(src)} style={{ width: size, height: size }} className="shrink-0 rounded-md bg-fog object-cover" />
  ) : (
    <div style={{ width: size, height: size }} className="shrink-0 rounded-md bg-fog" role="img" aria-label={alt} />
  )
}

export const selectCls = (err?: boolean) =>
  cx('h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-ink', err ? 'border-bad' : 'border-line')

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-10 w-full rounded-full border border-line bg-white pl-9 pr-4 text-sm outline-none focus:border-ink sm:w-72" />
    </div>
  )
}

export function Chip({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" aria-pressed={active} disabled={disabled} onClick={onClick} className={cx('rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-40', active ? 'border-ink bg-pink text-ink' : 'border-line bg-white text-graphite hover:border-ink')}>
      {children}
    </button>
  )
}

export function PageSkeleton({ rows = 5, cards = 0 }: { rows?: number; cards?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-4">
      <Skeleton className="h-9 w-64" />
      {cards > 0 && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: cards }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>}
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-14" />)}
    </div>
  )
}

/** Simple div-based vertical bar chart. */
export function BarChart({ data, format = (n) => String(n), height = 150 }: { data: { label: string; value: number }[]; format?: (n: number) => string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div role="img" aria-label={`Bar chart: ${data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}`}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={d.label} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {hover === i && <span className="absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-white">{format(d.value)}</span>}
            <div className={cx('w-full rounded-t transition-colors', hover === i ? 'bg-pink' : 'bg-ink')} style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">{data.map((d) => <span key={d.label} className="flex-1 truncate text-center text-[10px] text-mute">{d.label}</span>)}</div>
    </div>
  )
}

/** Simple SVG line/area chart. */
export function LineChart({ points, labels, height = 160, format = (n) => String(n) }: { points: number[]; labels: string[]; height?: number; format?: (n: number) => string }) {
  const W = 600
  const max = Math.max(1, ...points)
  const step = W / Math.max(1, points.length - 1)
  const y = (v: number) => height - 8 - (v / max) * (height - 24)
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={`Line chart, peak ${format(max)}`} preserveAspectRatio="none" style={{ height }}>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={W} y1={y(max * f)} y2={y(max * f)} stroke="#e4e4e8" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
        <path d={`${d} L${W},${height} L0,${height} Z`} fill="#FFBFD9" opacity="0.35" />
        <path d={d} fill="none" stroke="#0B0B0F" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-mute">{labels.map((l, i) => <span key={i}>{l}</span>)}</div>
    </div>
  )
}

export function DlRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <dt className="text-mute">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  )
}

export const th = 'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-mute'
export const td = 'px-4 py-3 align-middle text-sm'
