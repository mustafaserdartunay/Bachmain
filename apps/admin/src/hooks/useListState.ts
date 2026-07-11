import { useMemo, useState } from 'react'

type SortDir = 'asc' | 'desc'

interface UseListStateOptions<T> {
  data: T[]
  searchKeys: (keyof T)[]
  defaultSortKey?: keyof T
}

export function useListState<T extends Record<string, unknown>>({
  data,
  searchKeys,
  defaultSortKey,
}: UseListStateOptions<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSortKey ?? null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filtered = useMemo(() => {
    let result = [...data]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((row) =>
        searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)),
      )
    }

    if (sortKey) {
      result.sort((a, b) => {
        const av = String(a[sortKey] ?? '')
        const bv = String(b[sortKey] ?? '')
        const cmp = av.localeCompare(bv, 'tr')
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [data, search, searchKeys, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginated.map((r) => String(r.id))))
    }
  }

  const clearSelection = () => setSelected(new Set())

  return {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    selected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    page,
    setPage,
    totalPages,
    filtered,
    paginated,
    totalCount: filtered.length,
  }
}
