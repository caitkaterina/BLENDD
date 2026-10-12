import { useEffect, useState } from 'react'
import { useStore } from '../../store/store'
import { SEED_AUDIT } from '../../lib/data'
import type { AuditEntry } from '../../lib/types'

/**
 * `store.audit` is the action function (it shadows the state array in the
 * store's returned object), so the entries are read back from the persisted
 * store snapshot. Re-reads after every store change.
 */
export function useAuditLog(): AuditEntry[] {
  const store = useStore()
  const read = (): AuditEntry[] => {
    try {
      const raw = localStorage.getItem('blendd-demo-v2')
      const parsed = raw ? (JSON.parse(raw).audit as AuditEntry[] | undefined) : undefined
      return parsed ?? SEED_AUDIT
    } catch {
      return SEED_AUDIT
    }
  }
  const [log, setLog] = useState<AuditEntry[]>(read)
  useEffect(() => {
    // Provider persists in a parent effect, which runs after this one.
    const t = setTimeout(() => setLog(read()), 30)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store])
  return log
}
