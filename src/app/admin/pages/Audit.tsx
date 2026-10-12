import { useState } from 'react'
import { Download } from 'lucide-react'
import { useStore } from '../../store/store'
import { fmtDate } from '../../lib/format'
import type { AuditEntry } from '../../lib/types'
import { Button, Empty } from '../../components/ui'
import { DataTable, Note, PageHeader, SearchBox, TableSkeleton, Toolbar, type Column } from '../components/kit'
import { downloadCsv, includesCI, useLoading } from '../lib/helpers'
import { useAuditLog } from '../lib/useAuditLog'

export default function Audit() {
  const { toast } = useStore()
  const log = useAuditLog()
  const loading = useLoading()
  const [actor, setActor] = useState('')
  const [text, setText] = useState('')
  const list = [...log].sort((a, b) => b.at.localeCompare(a.at)).filter((a) => (!actor || includesCI(a.actor, actor)) && (!text || includesCI(`${a.action} ${a.target}`, text)))
  const cols: Column<AuditEntry>[] = [
    { key: 'at', header: 'When', cell: (a) => <span className="whitespace-nowrap">{fmtDate(a.at, true)}</span> },
    { key: 'actor', header: 'Actor', cell: (a) => a.actor },
    { key: 'action', header: 'Action', primary: true, cell: (a) => <span className="font-semibold">{a.action}</span> },
    { key: 'target', header: 'Target', cell: (a) => <span className="break-words">{a.target}</span> },
  ]
  return (
    <>
      <PageHeader eyebrow="Platform" title="Audit log" desc="Read-only record of admin actions, newest first." actions={<Button variant="outline" disabled={!list.length} onClick={() => { downloadCsv(`blendd-audit-${new Date().toISOString().slice(0, 10)}.csv`, [['At', 'Actor', 'Action', 'Target'], ...list.map((a) => [a.at, a.actor, a.action, a.target])]); toast(`Exported ${list.length} entries`) }}><Download size={15} aria-hidden /> Export CSV</Button>} />
      <Note className="mb-5">Entries are stored in this browser only and are reset with the demo data. A production audit trail must be append-only on the server.</Note>
      <Toolbar><SearchBox value={actor} onChange={setActor} placeholder="Filter by actor" /><SearchBox value={text} onChange={setText} placeholder="Filter by action or target" /><span className="ml-auto text-xs text-mute">{list.length} of {log.length}</span></Toolbar>
      {loading ? <TableSkeleton /> : list.length === 0 ? <Empty title="No entries match" body="Clear the filters or perform an admin action." /> : <DataTable caption="Audit log" columns={cols} rows={list} rowKey={(a) => a.id} />}
    </>
  )
}
