import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Pencil, Plus, Trash2, X } from 'lucide-react'
import { DeleteConfirmPopover } from './Common/ListDeleteConfirmPanel'
import {
  dropdownMenuShellClass,
  DROPDOWN_MENU_ITEM_CLASS,
  DROPDOWN_MENU_ITEM_MUTED_CLASS,
} from './Common/DropdownMenu'
import { useAnchoredPortal } from '../hooks/useAnchoredPortal'
import { stageColors } from './DocumentEditor/stageColors'

function createOptionId() {
  return `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

const DEFAULT_BUTTON_CLASS =
  'flex h-control min-h-control w-full items-center justify-between gap-2 rounded-ds-md border border-ds-border bg-[var(--ds-surface-raised)] px-3 text-ds-small font-semibold text-ds-ink transition-colors duration-hover hover:bg-[var(--ds-surface-muted)]'

function OptionLeading({ option, empty = false, isLightMenu = false }) {
  if (empty) {
    return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-500" />
  }
  if (option?.icon) {
    const Icon = option.icon
    return (
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center ${
          isLightMenu
            ? option.iconTone || 'text-[var(--muted)]'
            : option.iconTone || 'text-gray-300'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
    )
  }
  return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${option?.color || 'bg-gray-500'}`} />
}

function OptionColorPicker({ value, onChange }) {
  return (
    <div className="grid w-full grid-cols-10 gap-1 px-0.5">
      {stageColors.map((color) => {
        const isWhite = color === 'bg-white'
        const isBlack = color === 'bg-black'
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`h-2.5 w-2.5 justify-self-center rounded-full ${color} transition-all ${
              isWhite ? 'ring-1 ring-slate-400/70' : ''
            } ${isBlack ? 'ring-1 ring-zinc-600/50' : ''} ${
              value === color
                ? `scale-110 ring-2 ${isWhite ? 'ring-slate-500' : 'ring-[var(--ink)]'}`
                : 'opacity-55 hover:scale-110 hover:opacity-100'
            }`}
            aria-label={`Renk: ${color}`}
            title="Renk seç"
          />
        )
      })}
    </div>
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
  /** Kapalı halde her zaman bu başlık görünür (örn. filtre: Tipi). */
  triggerLabel = '',
  includePlaceholderOption = true,
  editable = true,
  disabled = false,
  showLeading = true,
  buttonClassName = DEFAULT_BUTTON_CLASS,
  labelClassName = '',
  menuVariant = 'dark',
  menuMatchWidth = true,
  menuInline = false,
  menuPlacement = 'below',
  searchable = false,
  searchPlaceholder = 'Ara...',
  menuMaxHeight = '',
  /** Başlık ile chevron bitişik (liste / filtre pill). */
  compact = false,
}) {
  const selected = options.find((option) => option.label === value)
  const hasSelection = Boolean(selected)
  const isOpen = activeMenu === openKey
  const canEdit = editable && typeof onOptionsChange === 'function'
  const isInteractive = !disabled
  const besideChevron = compact || /\b!?justify-start\b/.test(buttonClassName)
  const portalMatchWidth =
    menuMatchWidth === false
      ? false
      : menuMatchWidth === true
        ? besideChevron
          ? false
          : 'min'
        : menuMatchWidth

  const [editingIndex, setEditingIndex] = useState(null)
  const [draftName, setDraftName] = useState('')
  const [draftColor, setDraftColor] = useState(stageColors[0])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(stageColors[0])
  const [confirmIndex, setConfirmIndex] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setEditingIndex(null)
      setDraftName('')
      setDraftColor(stageColors[0])
      setAdding(false)
      setNewName('')
      setNewColor(stageColors[0])
      setConfirmIndex(null)
      setSearchTerm('')
    }
  }, [isOpen])

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
    setAdding(false)
    setEditingIndex(index)
    setDraftName(options[index].label)
    setDraftColor(options[index].color || stageColors[index % stageColors.length])
  }

  function commitEdit() {
    const name = draftName.trim()
    if (name && editingIndex != null) {
      const previous = options[editingIndex]
      const next = options.map((option, index) =>
        index === editingIndex ? { ...option, label: name, color: draftColor } : option,
      )
      onOptionsChange(next)
      if (previous.label === value) onChange(name)
    }
    setEditingIndex(null)
    setDraftName('')
    setDraftColor(stageColors[0])
  }

  function removeOption(index) {
    const removed = options[index]
    const next = options.filter((_, optionIndex) => optionIndex !== index)
    onOptionsChange(next)
    if (removed.label === value) onChange('')
    setConfirmIndex(null)
  }

  function startAdd() {
    setEditingIndex(null)
    setConfirmIndex(null)
    setAdding(true)
    setNewName('')
    setNewColor(stageColors[options.length % stageColors.length])
  }

  function commitAdd() {
    const name = newName.trim()
    if (name && !options.some((option) => option.label === name)) {
      onOptionsChange([...options, { id: createOptionId(), label: name, color: newColor }])
      onChange(name)
    }
    setAdding(false)
    setNewName('')
    setNewColor(stageColors[0])
  }

  const isLightMenu = menuVariant === 'light'
  const usePortal = !menuInline
  const portalPlacement = menuPlacement === 'above' ? 'above' : 'below'
  const {
    anchorRef,
    menuRef,
    style: portalStyle,
  } = useAnchoredPortal(isOpen && usePortal && isInteractive, {
    placement: portalPlacement,
    matchWidth: portalMatchWidth,
  })

  const selectedTextClass =
    labelClassName ||
    (isLightMenu
      ? hasSelection
        ? 'text-[var(--text-strong)]'
        : 'text-[var(--text-muted)]'
      : hasSelection
        ? 'text-[var(--ink)]'
        : 'text-[var(--muted)]')
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
  const colorEditorOpen = editingIndex != null || adding
  const menuShellClass = menuInline
    ? isLightMenu
      ? `relative mt-1 w-full ${lightMenuShell}`
      : dropdownMenuShellClass({ matchWidth: true, inline: true })
    : isLightMenu
      ? usePortal
        ? `app-dropdown-portal glass-inset ${lightMenuShell} min-w-[7.5rem] w-max ${colorEditorOpen ? 'max-w-[12rem]' : 'max-w-[11rem]'}${menuMatchWidth ? ' w-full max-w-none' : ''}`
        : `absolute left-0 ${menuPositionClass} ${lightMenuShell} min-w-[7.5rem] w-max ${colorEditorOpen ? 'max-w-[12rem]' : 'max-w-[11rem]'}${menuMatchWidth ? ' w-full max-w-none' : ''}`
      : `${dropdownMenuShellClass({
          matchWidth: portalMatchWidth,
          portaled: usePortal,
          positionClass: usePortal ? '' : `absolute left-0 ${menuPositionClass}`,
        })}${colorEditorOpen ? ' !max-w-[12rem]' : ''}`

  const optionButtonClass = isLightMenu
    ? 'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--surface-muted)]'
    : DROPDOWN_MENU_ITEM_CLASS
  const placeholderButtonClass = isLightMenu
    ? `${optionButtonClass} text-[var(--text-muted)]`
    : DROPDOWN_MENU_ITEM_MUTED_CLASS

  function renderMenu() {
    return (
      <div ref={usePortal ? menuRef : undefined} className={menuShellClass}>
        {searchable && (
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={searchPlaceholder}
            className={`inline-edit-input mb-1.5 w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none ${
              isLightMenu
                ? 'border-[var(--border)] bg-transparent text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-blue-400/60'
                : 'border-white/55 bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-white/75'
            }`}
            autoFocus
          />
        )}
        <div className={menuMaxHeight ? `${menuMaxHeight} overflow-y-auto pr-1` : ''}>
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
              <span className={isLightMenu ? undefined : 'text-gray-300'}>{placeholder}</span>
            </button>
          )}

          {visibleOptions.map(({ option, index }) =>
            confirmIndex === index ? (
              <DeleteConfirmPopover
                key={`confirm-${option.label}`}
                title={`"${option.label}" silinsin mi?`}
                description="Bu işlem geri alınamaz."
                confirmLabel="Evet, Sil"
                onConfirm={() => removeOption(index)}
                onCancel={() => setConfirmIndex(null)}
                className="w-full"
              />
            ) : editingIndex === index ? (
              <div
                key={`edit-${index}`}
                className="inline-edit-row flex flex-col gap-1.5 rounded-xl bg-transparent px-2 py-1.5"
              >
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
                        setDraftColor(stageColors[0])
                      }
                    }}
                    className="inline-edit-input min-w-0 flex-1 rounded-lg border border-white/55 bg-transparent px-2 py-1 text-xs font-bold text-[var(--ink)] focus:outline-none focus:border-white/75"
                  />
                  <button
                    type="button"
                    onClick={commitEdit}
                    className="rounded-lg bg-transparent p-1 text-emerald-300 transition-colors hover:text-emerald-200"
                    title="Kaydet"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(null)
                      setDraftName('')
                      setDraftColor(stageColors[0])
                    }}
                    className="rounded-lg bg-transparent p-1 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                    title="Vazgeç"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <OptionColorPicker value={draftColor} onChange={setDraftColor} />
              </div>
            ) : (
              <div
                key={option.label}
                className={`group flex items-center gap-1 rounded-xl ${
                  isLightMenu ? 'transition-colors hover:bg-[var(--surface-muted)]' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.label)
                    setActiveMenu(null)
                  }}
                  className={optionButtonClass}
                >
                  <OptionLeading option={option} isLightMenu={isLightMenu} />
                  <span className="whitespace-nowrap text-gray-300">{option.label}</span>
                  {option.label === value ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : null}
                </button>
                {canEdit && (
                  <span className="flex shrink-0 items-center gap-0.5 pr-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="rounded-lg p-1 text-gray-300 transition-colors hover:text-blue-400"
                      title="Düzenle"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIndex(null)
                        setConfirmIndex(index)
                      }}
                      className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-500/15 hover:text-red-500"
                      title="Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
            ),
          )}
          {visibleOptions.length === 0 && (
            <p className="px-3 py-2 text-xs font-bold text-[var(--muted)]">Sonuç bulunamadı.</p>
          )}
        </div>

        {canEdit && (
          <div className="mt-1 border-t border-white/50 pt-1">
            {adding ? (
              <div className="inline-edit-row flex flex-col gap-1.5 rounded-xl bg-transparent px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${newColor}`} />
                  <input
                    autoFocus
                    value={newName}
                    placeholder="Yeni seçenek..."
                    onChange={(event) => setNewName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitAdd()
                      if (event.key === 'Escape') {
                        setAdding(false)
                        setNewName('')
                        setNewColor(stageColors[0])
                      }
                    }}
                    className="inline-edit-input min-w-0 flex-1 rounded-lg border border-white/55 bg-transparent px-2 py-1 text-xs font-bold text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-white/75"
                  />
                  <button
                    type="button"
                    onClick={commitAdd}
                    className="rounded-lg bg-transparent p-1 text-emerald-300 transition-colors hover:text-emerald-200"
                    title="Ekle"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdding(false)
                      setNewName('')
                      setNewColor(stageColors[0])
                    }}
                    className="rounded-lg bg-transparent p-1 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                    title="Vazgeç"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <OptionColorPicker value={newColor} onChange={setNewColor} />
              </div>
            ) : (
              <button
                type="button"
                onClick={startAdd}
                className="flex w-full items-center gap-2 rounded-xl bg-transparent px-3 py-2 text-left text-xs font-black uppercase tracking-wide text-blue-600 transition-colors hover:text-blue-500"
              >
                <Plus className="h-4 w-4" /> Ekle
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={anchorRef}
      className={`relative min-w-0 ${besideChevron ? 'w-auto max-w-full' : 'w-full'}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isInteractive) return
          setActiveMenu(isOpen ? null : openKey)
        }}
        className={`${buttonClassName} ${disabled ? 'cursor-default opacity-90' : ''}`}
      >
        <span className={`flex min-w-0 items-center ${besideChevron ? 'gap-1' : 'gap-2'}`}>
          {showLeading && !triggerLabel ? (
            <OptionLeading option={selected} empty={!hasSelection} isLightMenu={isLightMenu} />
          ) : null}
          <span className={`truncate ${selectedTextClass}`}>
            {triggerLabel || selected?.label || placeholder}
          </span>
          {triggerLabel && hasSelection ? (
            <>
              {showLeading ? (
                <OptionLeading option={selected} empty={false} isLightMenu={isLightMenu} />
              ) : null}
              <span className={`truncate ${selectedTextClass}`}>{selected.label}</span>
            </>
          ) : null}
          {besideChevron && !disabled ? (
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} text-[var(--muted)]`}
            />
          ) : null}
        </span>
        {!besideChevron && !disabled ? (
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} text-[var(--muted)]`}
          />
        ) : null}
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
