import { useEffect, useState } from 'react'

/** Simulates a first-mount fetch so skeletons are shown (~400ms). */
export function useLoading(ms = 400) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, [ms])
  return loading
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const includesCI = (hay: string, needle: string) => hay.toLowerCase().includes(needle.trim().toLowerCase())

export const SELLER_TYPE_LABEL: Record<string, string> = {
  reseller: 'Reseller',
  retailer: 'Retailer',
  wholesaler: 'Wholesaler',
  manufacturer: 'Manufacturer',
}
