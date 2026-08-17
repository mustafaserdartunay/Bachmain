import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronRight, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { DeleteConfirmPopover } from './Common/ListDeleteConfirmPanel'
import { dropdownMenuShellClass } from './Common/DropdownMenu'
import StageColorSwatches from './DocumentEditor/StageColorSwatches'
import { stageColors } from './DocumentEditor/stageColors'
import { useAnchoredPortal } from '../hooks/useAnchoredPortal'
import {
  COP_KUTUSU_BUTTON_CLASS,
  COP_KUTUSU_ICON_CLASS,
  KALEM_BUTTON_CLASS,
  KALEM_ICON_CLASS,
} from '../utils/buttonStyles'
import { PAGE_FILTER_MENU_CLASS } from '../utils/dashboardDesign'
import { OPTION_COLOR_PALETTE } from '../utils/customerMeta'

const DEFAULT_BUTTON_CLASS =
  'flex h-control min-h-control w-full items-center justify-between gap-2 rounded-ds-md border border-ds-border bg-[var(--ds-surface-raised)] px-3 text-ds-small font-semibold text-ds-ink transition-colors duration-hover hover:bg-[var(--ds-surface-muted)]'

const COLOR_PALETTE = OPTION_COLOR_PALETTE?.length ? OPTION_COLOR_PALETTE : stageColors

/**
 * Seçenek/seçili değer başındaki yuvarlak renk noktası veya ikon kutusu.
 * `dropdown-option-dot` / `dropdown-option-icon` kancaları zorunlu: pill içindeki
 * `span { background: transparent !important }` kuralları aksi halde noktayı siler.
 */
function OptionLeading({ option, empty = false, isLightMenu = false }) {
  if (empty) {
    return <span className="dropdown-option-dot h-2.5 w-2.5 shrink-0 rounded-full bg-gray-500" />
  }
  if (option?.icon) {
    const Icon = option.icon
    const shellClass = isLightMenu ? 'bg-[var(--surface-muted)]' : 'bg-white/40'
    return (
      <span
        className={`dropdown-option-icon flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${shellClass} ${option.iconTone || 'text-[var(--muted)]'}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
    )
  }
  return (
    <span
      className={`dropdown-option-dot h-2.5 w-2.5 shrink-0 rounded-full ${option?.color || 'bg-gray-500'}`}
    />
  )
}

export default function EditableDropdownPill({
  value,
  onChange,
  options,
  onOptionsChange,
  openKey,
  activeMenu,
  setActiveMenu,
  placeholder = 'Seçiniz',
  includePlaceholderOption = true,
  editable = true,
  disabled = false,
  buttonClassName = DEFAULT_BUTTON_CLASS,
  wrapperClassName = 'relative min-w-0 w-full',
  menuClassName = PAGE_FILTER_MENU_CLASS,
  menuVariant = 'dark',
  menuMatchWidth = true,
  menuInline = false,
  menuPlacement = 'below',
  searchable = false,
  searchPlaceholder = 'Ara...',
  menuMaxHeight = '',
}) {
  const selected = options.find((option) => option.label === value)
  const hasSelection = Boolean(selected)
  const isOpen = activeMenu === openKey
  const canEdit = editable && typeof onOptionsChange === 'function'
  const isInteractive = !disabled

  const [editingIndex, setEditingIndex] = useState(null)
  const [draftName, setDraftName] = useState('')
  const [draftColor, setDraftColor] = useState(COLOR_PALETTE[0])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(() => COLOR_PALETTE[0] || 'bg-blue-500')
  const [confirmIndex, setConfirmIndex] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const draggedIndexRef = useRef(null)
  const canReorder = canEdit && !searchTerm.trim()

  useEffect(() => {
    if (!isOpen) {
      setEditingIndex(null)
      setDraftName('')
      setDraftColor(COLOR_PALETTE[0])
      setAdding(false)
      setNewName('')
      setNewColor(COLOR_PALETTE[options.length % COLOR_PALETTE.length])
      setConfirmIndex(null)
      setSearchTerm('')
      draggedIndexRef.current = null
      setDraggedIndex(null)
      setDragOverIndex(null)
    }
  }, [isOpen, options.length])

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('tr-TR')
  const visibleOptions = options
    .map((option, index) => ({ option, index }))
    .filter(
      ({ option }) =>
        !normalizedSearch ||
        String(option.label || '')
          .toLocaleLowerCase('tr-TR')
          .includes(normalizedSearch),
    )

  function startEdit(index) {
    if (options[index]?.locked) return
    setAdding(false)
    setEditingIndex(index)
    setDraftName(options[index].label)
    setDraftColor(options[index].color || COLOR_PALETTE[index % COLOR_PALETTE.length])
  }

  function commitEdit() {
    const name = draftName.trim()
    if (name && editingIndex != null && !options[editingIndex]?.locked) {
      const previous = options[editingIndex]
      const next = options.map((option, index) =>
        index === editingIndex
          ? { ...option, label: name, color: draftColor || option.color }
          : option,
      )
      onOptionsChange(next.filter((option) => !option.locked))
      if (previous.label === value) onChange(name)
    }
    setEditingIndex(null)
    setDraftName('')
    setDraftColor(COLOR_PALETTE[0])
  }

  function removeOption(index) {
    if (options[index]?.locked) return
    const removed = options[index]
    const next = options.filter((_, optionIndex) => optionIndex !== index)
    onOptionsChange(next.filter((option) => !option.locked))
    if (removed.label === value) onChange('')
    setConfirmIndex(null)
  }

  function reorderOptions(fromIndex, toIndex) {
    if (fromIndex == null || toIndex == null || fromIndex === toIndex) return
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= options.length || toIndex >= options.length) return
    const next = [...options]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    onOptionsChange(next.filter((option) => !option.locked))
  }

  function beginDrag(index, event) {
    if (!canReorder || options[index]?.locked || editingIndex != null) return
    draggedIndexRef.current = index
    setDraggedIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
    if (event.dataTransfer.setDragImage && event.currentTarget instanceof HTMLElement) {
      const row = event.currentTarget.closest('[data-option-row]')
      if (row) event.dataTransfer.setDragImage(row, 16, 16)
    }
  }

  function handleDrop(targetIndex, event) {
    event.preventDefault()
    event.stopPropagation()
    if (!canReorder) return
    const transferRaw = event.dataTransfer?.getData('text/plain')
    const fromIndex = transferRaw !== '' && transferRaw != null
      ? Number(transferRaw)
      : draggedIndexRef.current
    reorderOptions(fromIndex, targetIndex)
    draggedIndexRef.current = null
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  function endDrag() {
    window.setTimeout(() => {
      draggedIndexRef.current = null
      setDraggedIndex(null)
      setDragOverIndex(null)
    }, 0)
  }

  function commitAdd() {
    const name = newName.trim()
    if (name && !options.some((option) => option.label === name)) {
      const color = newColor || COLOR_PALETTE[options.length % COLOR_PALETTE.length]
      const unlocked = options.filter((option) => !option.locked)
      onOptionsChange([...unlocked, { label: name, color }])
      onChange(name)
    }
    setAdding(false)
    setNewName('')
    setNewColor(COLOR_PALETTE[(options.length + 1) % COLOR_PALETTE.length])
  }

  const isLightMenu = menuVariant === 'light'
  const usePortal = !menuInline
  const portalPlacement = menuPlacement === 'above' ? 'above' : 'below'
  const editorExpanded = adding || editingIndex != null
  const {
    anchorRef,
    menuRef,
    style: portalStyle,
    updatePosition,
  } = useAnchoredPortal(isOpen && usePortal && isInteractive, {
    placement: portalPlacement,
    matchWidth: editorExpanded ? false : menuMatchWidth,
    width: undefined,
  })

  useEffect(() => {
    if (!isOpen || !usePortal) return undefined
    const raf = window.requestAnimationFrame(() => updatePosition?.())
    return () => window.cancelAnimationFrame(raf)
  }, [editorExpanded, isOpen, updatePosition, usePortal])

  const selectedTextClass = isLightMenu
    ? hasSelection
      ? 'text-[var(--text-strong)]'
      : 'text-[var(--text-muted)]'
    : 'text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]'
  const lightMenuShell =
    'z-30 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 shadow-[var(--shadow)]'
  const menuPositionClass =
    menuPlacement === 'above'
      ? 'bottom-[calc(100%+4px)]'
      : menuInline
        ? ''
        : menuVariant === 'light'
          ? 'top-[calc(100%+4px)]'
          : 'top-11'
  const menuShellClass = menuInline
    ? isLightMenu
      ? `relative mt-1 w-full ${lightMenuShell}`
      : dropdownMenuShellClass({ matchWidth: true, inline: true })
    : isLightMenu
      ? usePortal
        ? `app-dropdown-portal glass-inset ${lightMenuShell} min-w-[210px] w-max max-w-[260px]${menuMatchWidth ? ' w-full max-w-none' : ''}`
        : `absolute left-0 ${menuPositionClass} ${lightMenuShell} min-w-[210px] w-max max-w-[260px]${menuMatchWidth ? ' w-full max-w-none' : ''}`
      : dropdownMenuShellClass({
          matchWidth: menuMatchWidth,
          portaled: usePortal,
          positionClass: usePortal ? '' : `absolute left-0 ${menuPositionClass}`,
        })

  const optionButtonClass = isLightMenu
    ? 'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-semibold text-[var(--text-strong)]'
    : 'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]'
  const placeholderButtonClass = isLightMenu
    ? `${optionButtonClass} origin-left text-[var(--text-muted)] transition-[transform,font-weight] hover:scale-[1.03] hover:font-bold hover:bg-transparent`
    : `${optionButtonClass} origin-left transition-[transform,font-weight] hover:scale-[1.03] hover:font-bold hover:bg-transparent`

  function renderMenu() {
    const expandedEditor = adding || editingIndex != null
    const railColor = adding ? newColor : draftColor
    const onRailColorChange = adding ? setNewColor : setDraftColor
    return (
      <div
        ref={usePortal ? menuRef : undefined}
        className={`${menuShellClass} ${menuClassName} ${
          expandedEditor
            ? '!flex !h-auto !w-max !min-w-[210px] !max-w-none items-stretch overflow-visible'
            : ''
        }`.trim()}
      >
        <div className={expandedEditor ? 'min-w-[13.125rem] flex-1' : undefined}>
        {searchable && (
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={searchPlaceholder}
            className={`mb-1.5 w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none ${
              isLightMenu
                ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-blue-400/60'
                : 'border-white/55 bg-white/42 text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-white/75 focus:bg-white/52'
            }`}
            autoFocus
          />
        )}
        <div
          className={
            menuMaxHeight
              ? `${menuMaxHeight} overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`
              : ''
          }
        >
          {includePlaceholderOption && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setActiveMenu(null)
              }}
              className={placeholderButtonClass}
            >
              <OptionLeading empty isLightMenu={isLightMenu} />
              {placeholder}
            </button>
          )}

          {visibleOptions.map(({ option, index }) =>
            editingIndex === index ? (
              <div key={`edit-${index}`} className="space-y-1.5 rounded-xl bg-white/35 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${draftColor}`} />
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitEdit()
                      if (event.key === 'Escape') {
                        setEditingIndex(null)
                        setDraftName('')
                        setDraftColor(COLOR_PALETTE[0])
                      }
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-white/55 bg-white/42 px-2 py-1 text-xs font-bold text-[var(--ink)] focus:outline-none focus:border-white/75 focus:bg-white/52"
                  />
                  <button
                    type="button"
                    onClick={commitEdit}
                    className="rounded-lg p-1 text-emerald-700 transition-colors hover:bg-emerald-500/15"
                    title="Kaydet"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(null)
                      setDraftName('')
                      setDraftColor(COLOR_PALETTE[0])
                    }}
                    className="rounded-lg bg-red-500/15 p-1 text-red-500 transition-colors hover:bg-red-500/25 hover:text-red-600"
                    title="Vazgeç"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={option.label}
                data-option-row
                onDragOver={(event) => {
                  if (!canReorder || option.locked) return
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setDragOverIndex(index)
                }}
                onDrop={(event) => handleDrop(index, event)}
                className={`group relative flex items-center gap-0.5 rounded-xl ${
                  draggedIndex === index ? 'opacity-45' : ''
                } ${
                  dragOverIndex === index && draggedIndex !== index
                    ? 'bg-blue-500/10 ring-1 ring-blue-400/40'
                    : ''
                }`}
              >
                {canReorder && !option.locked && (
                  <div
                    draggable
                    onDragStart={(event) => beginDrag(index, event)}
                    onDragEnd={endDrag}
                    className="cursor-grab px-1 py-2 text-gray-400 opacity-70 transition-opacity hover:text-gray-600 hover:opacity-100 active:cursor-grabbing"
                    title="Sürükleyerek sırala"
                    aria-label={`${option.label} sürükle`}
                  >
                    <GripVertical className="h-3.5 w-3.5 pointer-events-none" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.label)
                    setActiveMenu(null)
                  }}
                  className={`${optionButtonClass} origin-left transition-[transform,font-weight,background-color] hover:scale-[1.03] hover:font-bold hover:bg-transparent`}
                >
                  <OptionLeading option={option} isLightMenu={isLightMenu} />
                  <span className="truncate">{option.label}</span>
                </button>
                {canEdit && !option.locked && (
                  <span className="flex shrink-0 items-center gap-0.5 pr-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className={KALEM_BUTTON_CLASS}
                      title="Düzenle"
                    >
                      <Pencil className={KALEM_ICON_CLASS} strokeWidth={2.25} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIndex(null)
                        setConfirmIndex(index)
                      }}
                      className={COP_KUTUSU_BUTTON_CLASS}
                      title="Sil"
                    >
                      <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} />
                    </button>
                  </span>
                )}
                {confirmIndex === index && !option.locked ? (
                  <DeleteConfirmPopover
                    inline={false}
                    title={`"${option.label}" silinsin mi?`}
                    description="Bu işlem geri alınamaz."
                    confirmLabel="Evet, Sil"
                    onConfirm={() => removeOption(index)}
                    onCancel={() => setConfirmIndex(null)}
                  />
                ) : null}
              </div>
            ),
          )}
          {visibleOptions.length === 0 && (
            <p className="px-3 py-2 text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]">
              Sonuç bulunamadı.
            </p>
          )}
        </div>

        {canEdit && (
          <div className="mt-1 border-t border-white/50 pt-1">
            {adding ? (
              <div className="space-y-2 rounded-xl border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.05)] px-2.5 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                  Yeni seçenek
                </p>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${newColor}`} />
                  <input
                    autoFocus
                    value={newName}
                    placeholder="Seçenek adı yazın…"
                    onChange={(event) => setNewName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitAdd()
                      if (event.key === 'Escape') {
                        setAdding(false)
                        setNewName('')
                      }
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-white/55 bg-white/55 px-2.5 py-1.5 text-xs font-bold text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[rgba(37,99,235,0.35)] focus:bg-white/70"
                  />
                </div>
                <div className="flex items-center justify-end gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAdding(false)
                      setNewName('')
                    }}
                    className="inline-flex h-7 items-center rounded-lg px-2.5 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-500/10"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={commitAdd}
                    className="inline-flex h-7 items-center rounded-lg bg-[rgba(37,99,235,0.12)] px-2.5 text-[11px] font-bold text-blue-700 transition-colors hover:bg-[rgba(37,99,235,0.2)]"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(null)
                  setNewColor(COLOR_PALETTE[options.length % COLOR_PALETTE.length])
                  setAdding(true)
                }}
                className="dropdown-add-action flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] font-semibold leading-tight tracking-normal"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Ekle</span>
              </button>
            )}
          </div>
        )}
        </div>
        {expandedEditor ? (
          <div className="dropdown-color-rail customer-filter-color-swatches flex w-8 shrink-0 flex-col items-center gap-2 self-stretch border-l border-dark-500/35 pl-2.5">
            <span className="dropdown-color-rail-label shrink-0">Renk</span>
            <StageColorSwatches
              value={railColor}
              onChange={onRailColorChange}
              size="sm"
              direction="vertical"
              fill
            />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div ref={anchorRef} className={wrapperClassName} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isInteractive) return
          setActiveMenu(isOpen ? null : openKey)
        }}
        className={`${buttonClassName} ${disabled ? 'cursor-default opacity-90' : ''}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <OptionLeading option={selected} empty={!hasSelection} isLightMenu={isLightMenu} />
          <span className={`truncate ${selectedTextClass}`}>{selected?.label || placeholder}</span>
        </span>
        {!disabled && (
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''} text-[var(--muted)]`}
          />
        )}
      </button>
      {isOpen && isInteractive && !usePortal && renderMenu()}
      {isOpen &&
        isInteractive &&
        usePortal &&
        portalStyle &&
        createPortal(
          <div style={portalStyle} onClick={(event) => event.stopPropagation()}>
            {renderMenu()}
          </div>,
          document.body,
        )}
    </div>
  )
}
