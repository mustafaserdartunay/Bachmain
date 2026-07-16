import { Search } from 'lucide-react'

const FIELD_CLASS =
  'h-9 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-[12px] font-semibold text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]'

export default function ProcessFilterBar({
  filters,
  onChange,
  stages = [],
  assignees = [],
  showSearch = true,
  className = '',
}) {
  function patch(key, value) {
    onChange?.({ ...filters, [key]: value })
  }

  return (
    <div className={`process-filter-bar ${className}`.trim()}>
      {showSearch ? (
        <label className="process-filter-bar__search">
          <Search size={14} className="opacity-50" aria-hidden />
          <input
            type="search"
            value={filters.search || ''}
            onChange={(e) => patch('search', e.target.value)}
            placeholder="Ara…"
            className={FIELD_CLASS}
          />
        </label>
      ) : null}

      <select
        value={filters.status || ''}
        onChange={(e) => patch('status', e.target.value)}
        className={FIELD_CLASS}
        aria-label="Durum"
      >
        <option value="">Durum</option>
        {stages.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={filters.assignee || ''}
        onChange={(e) => patch('assignee', e.target.value)}
        className={FIELD_CLASS}
        aria-label="Sorumlu"
      >
        <option value="">Sorumlu</option>
        {assignees.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <select
        value={filters.priority || ''}
        onChange={(e) => patch('priority', e.target.value)}
        className={FIELD_CLASS}
        aria-label="Öncelik"
      >
        <option value="">Öncelik</option>
        <option value="Yüksek">Yüksek</option>
        <option value="Orta">Orta</option>
        <option value="Düşük">Düşük</option>
      </select>

      <input
        type="date"
        value={filters.dateFrom || ''}
        onChange={(e) => patch('dateFrom', e.target.value)}
        className={FIELD_CLASS}
        aria-label="Başlangıç tarihi"
      />
      <input
        type="date"
        value={filters.dateTo || ''}
        onChange={(e) => patch('dateTo', e.target.value)}
        className={FIELD_CLASS}
        aria-label="Bitiş tarihi"
      />

      <input
        type="text"
        value={filters.customer || ''}
        onChange={(e) => patch('customer', e.target.value)}
        placeholder="Müşteri"
        className={FIELD_CLASS}
      />
      <input
        type="text"
        value={filters.firm || ''}
        onChange={(e) => patch('firm', e.target.value)}
        placeholder="Firma"
        className={FIELD_CLASS}
      />
      <input
        type="text"
        value={filters.tag || ''}
        onChange={(e) => patch('tag', e.target.value)}
        placeholder="Etiket"
        className={FIELD_CLASS}
      />
    </div>
  )
}
