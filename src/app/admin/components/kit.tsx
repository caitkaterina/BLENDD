import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Info, Search, X } from 'lucide-react'
import { Button, Field, Modal, Skeleton, cx, inputCls, textareaCls } from '../../components/ui'

export function PageHeader({ eyebrow, title, desc, actions }: { eyebrow?: string; title: string; desc?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2 text-mute">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {desc && <p className="mt-2 max-w-2xl text-sm text-mute">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Panel({ title, action, children, className = '', pad = true }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cx('rounded-2xl border border-line bg-white', className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-base font-bold tracking-tight">{title}</h2>
          {action}
        </div>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

export function Note({ children, tone = 'info', className = '' }: { children: ReactNode; tone?: 'info' | 'warn'; className?: string }) {
  return (
    <div role="note" className={cx('flex gap-3 rounded-xl border px-4 py-3 text-sm', tone === 'warn' ? 'border-[#e8c98a] bg-[#fbefd6] text-[#5f3c08]' : 'border-line bg-fog text-graphite', className)}>
      <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder = 'Search', label }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) {
  return (
    <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
      <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" aria-hidden />
      <input type="search" aria-label={label ?? placeholder} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cx(inputCls(), 'h-10 pl-9')} />
    </div>
  )
}

export function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: { value: string; label: string }[] }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-ink">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
}

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
  /** Shown as the card title on small screens (no label). */
  primary?: boolean
  align?: 'right'
}

/** Dense table on lg+, stacked cards below. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, rowLabel, caption }: { columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; onRowClick?: (r: T) => void; rowLabel?: (r: T) => string; caption: string }) {
  const primary = columns.find((c) => c.primary) ?? columns[0]
  const rest = columns.filter((c) => c !== primary)
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line bg-fog/60 text-[11px] uppercase tracking-wider text-mute">
              {columns.map((c) => <th key={c.key} scope="col" className={cx('px-4 py-3 font-semibold', c.align === 'right' && 'text-right', c.className)}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} className={cx('border-b border-line/70 last:border-0 hover:bg-fog/40', onRowClick && 'cursor-pointer')} onClick={onRowClick && (() => onRowClick(r))}>
                {columns.map((c, i) => (
                  <td key={c.key} className={cx('px-4 py-3 align-middle', c.align === 'right' && 'text-right', c.className)}>
                    {onRowClick && i === 0 ? (
                      <button type="button" aria-label={rowLabel ? `Open ${rowLabel(r)}` : 'Open details'} onClick={(e) => { e.stopPropagation(); onRowClick(r) }} className="text-left">{c.cell(r)}</button>
                    ) : c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 lg:hidden" aria-label={caption}>
        {rows.map((r) => (
          <li key={rowKey(r)} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 font-semibold">{primary.cell(r)}</div>
              {onRowClick && <Button size="sm" variant="outline" onClick={() => onRowClick(r)}>Open</Button>}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
              {rest.map((c) => (
                // Right-aligned (action) columns get a full-width, wrapping row on cards.
                <div key={c.key} className={cx('min-w-0', c.align === 'right' && 'col-span-2')}>
                  <dt className="text-[11px] uppercase tracking-wider text-mute">{c.header}</dt>
                  <dd className={cx('mt-0.5 min-w-0', c.align === 'right' && '[&>div]:flex-wrap [&>div]:justify-start')}>{c.cell(r)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}

export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
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
    <div className="fixed inset-0 z-[90] bg-ink/50" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl outline-none">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close panel" className="grid size-9 place-items-center rounded-full hover:bg-fog"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
      </aside>
    </div>
  )
}

/** Dialog that requires a written reason before confirming. */
export function ReasonDialog({ open, title, body, confirmLabel, danger, required = true, label = 'Reason', onConfirm, onClose }: { open: boolean; title: string; body?: ReactNode; confirmLabel: string; danger?: boolean; required?: boolean; label?: string; onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { if (open) { setReason(''); setErr('') } }, [open])
  const submit = () => {
    if (required && reason.trim().length < 5) { setErr('Please enter a reason (at least 5 characters).'); return }
    onConfirm(reason.trim())
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'dark'} onClick={submit}>{confirmLabel}</Button></>}>
      {body && <div className="mb-4 text-sm text-graphite">{body}</div>}
      <Field label={label} error={err}>
        <textarea rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setErr('') }} className={textareaCls(!!err)} />
      </Field>
    </Modal>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="mb-8 h-10 w-72" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      <TableSkeleton />
    </div>
  )
}

export function Stat({ label, value, sub, href, demo }: { label: string; value: ReactNode; sub?: ReactNode; href?: string; demo?: boolean }) {
  void href
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">{label}{demo && <span className="ml-1.5 normal-case tracking-normal">(demo data)</span>}</p>
      <p className="mt-1.5 font-display text-3xl font-extrabold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-mute">{sub}</p>}
    </div>
  )
}

export const KV = ({ k, v }: { k: string; v: ReactNode }) => (
  <div className="flex justify-between gap-4 border-b border-line/70 py-2 text-sm last:border-0"><dt className="text-mute">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
)
