import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { runOmniSearch } from '../../utils/omniSearch'
import { HEADER_SEARCH_INPUT_CLASS } from '../../utils/themeMode'
import { YF_TEXT_CLASS } from '../../utils/dashboardDesign'
import { DROPDOWN_Z_INDEX } from '../../hooks/useAnchoredPortal'

const RESULTS_SHELL_CLASS =
  'app-dropdown-portal glass-inset az max-h-[min(70vh,28rem)] w-[min(100vw-1.5rem,26rem)] overflow-y-auto rounded-[16px] p-2 shadow-[0_16px_40px_-18px_rgba(30,35,60,0.35)]'

const TYPE_TONE = {
  Müşteri: 'text-blue-700',
  Ürün: 'text-violet-700',
  Sipariş: 'text-amber-700',
  Teklif: 'text-orange-700',
  Hareket: 'text-emerald-700',
  Hesap: 'text-sky-700',
  Modül: 'text-[var(--muted)]',
}

export default function HeaderOmniSearch() {
  const navigate = useNavigate()
  const listId = useId()
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const menuRef = useRef(null)
  const debounceRef = useRef(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, 120)
    return () => window.clearTimeout(debounceRef.current)
  }, [query])

  const hits = useMemo(
    () => runOmniSearch(debouncedQuery, { minLength: 1, limit: 24 }),
    [debouncedQuery],
  )

  const showMenu = open && debouncedQuery.trim().length >= 1

  useEffect(() => {
    setActiveIndex(0)
  }, [debouncedQuery, hits.length])

  useEffect(() => {
    if (!showMenu || !rootRef.current) return undefined
    function place() {
      const rect = rootRef.current.getBoundingClientRect()
      const width = Math.min(Math.max(rect.width, 280), 416)
      let left = rect.left
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - width - 8)
      }
      setMenuPos({
        top: rect.bottom + 6,
        left,
        width,
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [showMenu, hits.length])

  useEffect(() => {
    if (!showMenu) return undefined
    function onDoc(event) {
      if (rootRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function onKey(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [showMenu])

  function goToHit(hit) {
    if (!hit?.to) return
    setOpen(false)
    setQuery('')
    setDebouncedQuery('')
    navigate(hit.to)
  }

  function onKeyDown(event) {
    if (!showMenu || hits.length === 0) {
      if (event.key === 'Escape') setOpen(false)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % hits.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + hits.length) % hits.length)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      goToHit(hits[activeIndex] || hits[0])
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 sm:max-w-[18rem] lg:max-w-[22rem]">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        placeholder="Ara..."
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={showMenu}
        aria-controls={listId}
        aria-autocomplete="list"
        className={HEADER_SEARCH_INPUT_CLASS}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
      />

      {showMenu && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              className={RESULTS_SHELL_CLASS}
              style={{
                position: 'fixed',
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
                zIndex: DROPDOWN_Z_INDEX + 20,
              }}
            >
              {hits.length === 0 ? (
                <p className={`${YF_TEXT_CLASS} px-3 py-4 text-center`}>Sonuç bulunamadı.</p>
              ) : (
                <ul className="space-y-0.5">
                  {hits.map((hit, index) => {
                    const active = index === activeIndex
                    return (
                      <li key={hit.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={`flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition-colors ${
                            active ? 'bg-white/55' : 'hover:bg-white/40'
                          }`}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => goToHit(hit)}
                        >
                          <span
                            className={`mt-0.5 shrink-0 text-[11px] font-bold uppercase leading-tight tracking-wide ${
                              TYPE_TONE[hit.type] || 'text-[var(--muted)]'
                            }`}
                          >
                            {hit.type}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-bold leading-tight tracking-normal text-[var(--ink)]">
                              {hit.label}
                            </span>
                            {hit.meta ? (
                              <span className={`${YF_TEXT_CLASS} mt-0.5 block truncate`}>
                                {hit.meta}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
