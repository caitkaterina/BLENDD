import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { AlertCircle, BadgeCheck, CheckCircle2, Info, Loader2, Star, X } from 'lucide-react'
import { imgUrl } from '../lib/data'
import { useStore } from '../store/store'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

/** Image with a tonal placeholder and a broken-image fallback. */
export function Img({ id, w = 600, h, alt, className = '', eager }: { id?: string; w?: number; h?: number; alt: string; className?: string; eager?: boolean }) {
  const [bad, setBad] = useState(false)
  const [loaded, setLoaded] = useState(false)
  // Reset load/error state when the source changes (thumbnail switch, client-side product nav).
  const [prevId, setPrevId] = useState(id)
  if (prevId !== id) { setPrevId(id); setBad(false); setLoaded(false) }
  // Don't fight a caller-supplied position utility; two of them collapse the box.
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className)
  return (
    <div className={cx(!positioned && 'relative', 'overflow-hidden bg-fog', className)}>
      {!id || bad ? (
        <div role="img" aria-label={alt} className="absolute inset-0 grid place-items-center bg-fog p-1 text-center text-[10px] uppercase leading-tight tracking-widest text-mute">Image unavailable</div>
      ) : (
        <img
          src={imgUrl(id, w, h)}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setBad(true)}
          onLoad={() => setLoaded(true)}
          className={cx('absolute inset-0 h-full w-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </div>
  )
}

export function Stars({ value, count, size = 13, showEmpty = true }: { value?: number; count?: number; size?: number; showEmpty?: boolean }) {
  if (value == null) return showEmpty ? <span className="text-xs text-mute">No reviews yet</span> : null
  return (
    <span className="inline-flex items-center gap-1 text-xs" title="Sample rating (demo data)" aria-label={`Sample rating ${value} out of 5${count != null ? ` from ${count} sample reviews` : ''}, demo data`}>
      <Star size={size} className="fill-ink text-ink" aria-hidden />
      <span className="font-semibold">{value.toFixed(1)}</span>
      {count != null && <span className="text-mute">({count})</span>}
    </span>
  )
}

const TONES = {
  neutral: 'bg-fog text-ink',
  pink: 'bg-pink text-ink',
  dark: 'bg-ink text-white',
  ok: 'bg-[#e3f4ec] text-[#13613f]',
  warn: 'bg-[#fbefd6] text-[#7a4d0b]',
  bad: 'bg-[#fbe4e0] text-[#8c2417]',
  line: 'border border-line text-ink',
}
export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: keyof typeof TONES; className?: string }) {
  return <span className={cx('inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5', TONES[tone], className)}>{children}</span>
}

export function VerifiedBadge({ verified, status }: { verified: boolean; status?: string }) {
  if (verified) return <Badge tone="pink"><BadgeCheck size={12} aria-hidden /> Verified seller (demo)</Badge>
  if (status === 'pending') return <Badge tone="warn">Verification pending</Badge>
  return <Badge tone="line">Not verified</Badge>
}

export function DemoBadge({ className = '' }: { className?: string }) {
  return <span className={cx('rounded border border-dashed border-mute/50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-mute', className)}>Demo data</span>
}

const BTN = {
  primary: 'bg-pink text-ink hover:bg-[#ffa9cb] active:bg-[#ff95be]',
  dark: 'bg-ink text-white hover:bg-graphite',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-white',
  ghost: 'text-ink hover:bg-fog',
  danger: 'bg-[#c0392b] text-white hover:bg-[#a52f23]',
  onDark: 'border border-white/40 text-white hover:bg-white hover:text-ink',
}
const SIZE = { sm: 'h-10 px-4 text-[13px] sm:h-9', md: 'h-11 px-5 text-sm sm:px-6', lg: 'h-13 px-5 text-[15px] sm:px-8' }
type BtnProps = { variant?: keyof typeof BTN; size?: keyof typeof SIZE; loading?: boolean; full?: boolean }
const btnCls = ({ variant = 'primary', size = 'md', full }: BtnProps) =>
  cx('inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-45', BTN[variant], SIZE[size], full && 'w-full')

export function Button({ variant, size, loading, full, className, children, disabled, ...rest }: BtnProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} disabled={disabled || loading} className={cx(btnCls({ variant, size, full }), className)}>
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
export function LinkButton({ variant, size, full, className, ...rest }: BtnProps & LinkProps) {
  return <Link {...rest} className={cx(btnCls({ variant, size, full }), className)} />
}

export function Field({ label, error, hint, children, className = '' }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block text-sm', className)}>
      <span className="mb-1.5 block font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-mute">{hint}</span>}
      {error && <span role="alert" className="mt-1 flex items-center gap-1 text-xs font-medium text-bad"><AlertCircle size={12} aria-hidden /> {error}</span>}
    </label>
  )
}
export const inputCls = (err?: boolean) =>
  cx('h-11 w-full rounded-lg border bg-white px-3.5 text-sm outline-none transition-colors placeholder:text-mute/70 focus:border-ink', err ? 'border-bad' : 'border-line')
export const textareaCls = (err?: boolean) => cx('w-full rounded-lg border bg-white p-3.5 text-sm outline-none focus:border-ink', err ? 'border-bad' : 'border-line')

export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; prev?.focus() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] grid place-items-end bg-ink/60 backdrop-blur-[2px] sm:place-items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={cx('rise flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-md')}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="grid size-9 place-items-center rounded-full hover:bg-fog"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, body, confirmLabel = 'Confirm', danger, onConfirm, onClose }: { open: boolean; title: string; body: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'dark'} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button></>}>
      <div className="text-sm text-graphite">{body}</div>
    </Modal>
  )
}

export function Empty({ title, body, action, icon }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <div>
        {icon && <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-fog">{icon}</div>}
        <h3 className="text-xl font-bold">{title}</h3>
        {body && <p className="mx-auto mt-2 max-w-sm text-sm text-mute">{body}</p>}
        {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
      </div>
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', body, onRetry }: { title?: string; body?: string; onRetry?: () => void }) {
  return <Empty title={title} body={body} icon={<AlertCircle size={22} />} action={onRetry && <Button variant="dark" onClick={onRetry}>Try again</Button>} />
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={cx('skeleton rounded-lg', className)} />
}

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav)+env(safe-area-inset-bottom)+0.75rem)] z-[200] flex flex-col items-center gap-2 px-3 lg:bottom-6" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="rise pointer-events-auto flex w-fit max-w-full items-center gap-2.5 rounded-2xl bg-ink py-2 pl-4 pr-1.5 text-sm text-white shadow-xl sm:max-w-md">
          {t.kind === 'error' ? <AlertCircle size={16} className="text-pink" /> : t.kind === 'info' ? <Info size={16} className="text-pink" /> : <CheckCircle2 size={16} className="text-pink" />}
          <span className="min-w-0">{t.text}</span>
          <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="grid size-8 shrink-0 place-items-center rounded-full text-white/60 hover:text-white"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, items, className = '' }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[]; className?: string }) {
  return (
    <div role="tablist" className={cx('no-scrollbar flex gap-1 overflow-x-auto', className)}>
      {items.map((i) => (
        <button key={i.id} role="tab" aria-selected={value === i.id} onClick={() => onChange(i.id)} className={cx('shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors', value === i.id ? 'bg-ink text-white' : 'text-graphite hover:bg-fog')}>
          {i.label}{i.count != null && <span className={cx('ml-1.5 text-xs', value === i.id ? 'text-pink' : 'text-mute')}>{i.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-ink' : 'bg-line')}>
      <span className={cx('absolute top-0.5 size-5 rounded-full transition-all', checked ? 'left-[22px] bg-pink' : 'left-0.5 bg-white')} />
    </button>
  )
}

export function SectionHead({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-3 text-mute">{eyebrow}</p>}
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
        <span className="rule-pink mt-4" aria-hidden />
      </div>
      {action && <div className="shrink-0 whitespace-nowrap">{action}</div>}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const tone: keyof typeof TONES =
    ['delivered', 'completed', 'paid', 'published', 'verified', 'active', 'quoted'].includes(status) ? 'ok'
    : ['cancelled', 'rejected', 'suspended', 'failed', 'declined', 'removed'].includes(status) ? 'bad'
    : ['pending_payment', 'return_requested', 'pending', 'pending_review', 'draft', 'new'].includes(status) ? 'warn'
    : ['shipped', 'processing'].includes(status) ? 'pink' : 'neutral'
  return <Badge tone={tone}>{status.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())}</Badge>
}
