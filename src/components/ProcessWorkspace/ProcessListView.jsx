import { useMemo, useState } from 'react'
import { DataTable } from '@bachmain/ui'

export default function ProcessListView({
  items = [],
  onOpenItem,
  onExportCsv,
}) {
  const [hidden, setHidden] = useState({})

  const columns = useMemo(() => {
    const cols = [
      { id: 'title', header: 'Başlık', accessorKey: 'title', sortable: true },
      { id: 'status', header: 'Durum', accessorKey: 'status', sortable: true },
      { id: 'company', header: 'Firma', accessorKey: 'company' },
      { id: 'customer', header: 'Müşteri', accessorKey: 'customer' },
      { id: 'assignee', header: 'Sorumlu', accessorKey: 'assignee', sortable: true },
      { id: 'priority', header: 'Öncelik', accessorKey: 'priority', sortable: true },
      { id: 'dueDate', header: 'Son Tarih', accessorKey: 'dueDate', sortable: true },
      {
        id: 'progress',
        header: 'İlerleme',
        accessorKey: 'progress',
        cell: (row) => (typeof row.progress === 'number' ? `%${row.progress}` : '—'),
      },
      {
        id: 'tags',
        header: 'Etiket',
        cell: (row) => (row.tags || []).join(', ') || '—',
      },
    ]
    return cols.filter((c) => !hidden[c.id])
  }, [hidden])

  function toggleCol(key) {
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function exportCsv() {
    if (onExportCsv) {
      onExportCsv(items)
      return
    }
    const headers = ['Başlık', 'Durum', 'Firma', 'Müşteri', 'Sorumlu', 'Öncelik', 'Son Tarih', 'İlerleme']
    const lines = [
      headers.join(';'),
      ...items.map((r) =>
        [r.title, r.status, r.company, r.customer, r.assignee, r.priority, r.dueDate, r.progress]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(';'),
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'process-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function printList() {
    window.print()
  }

  const allKeys = [
    ['title', 'Başlık'],
    ['status', 'Durum'],
    ['company', 'Firma'],
    ['customer', 'Müşteri'],
    ['assignee', 'Sorumlu'],
    ['priority', 'Öncelik'],
    ['dueDate', 'Son Tarih'],
    ['progress', 'İlerleme'],
    ['tags', 'Etiket'],
  ]

  return (
    <div className="process-list-view">
      <div className="process-list-view__toolbar">
        <div className="process-list-view__cols">
          {allKeys.map(([key, label]) => (
            <label key={key} className="process-list-view__col-toggle">
              <input type="checkbox" checked={!hidden[key]} onChange={() => toggleCol(key)} />
              {label}
            </label>
          ))}
        </div>
        <div className="process-list-view__actions">
          <button type="button" className="process-btn" onClick={exportCsv}>
            Excel
          </button>
          <button type="button" className="process-btn" onClick={printList}>
            Yazdır
          </button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        onRowClick={onOpenItem}
        emptyTitle="Kayıt yok"
      />
      {items.length ? (
        <div className="process-list-view__total">
          Toplam: <strong>{items.length}</strong> kayıt
        </div>
      ) : null}
    </div>
  )
}
