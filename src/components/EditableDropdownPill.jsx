import { useEffect, useState } from 'react'
import { Check, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react'
import { DeleteConfirmPopover } from './Common/ListDeleteConfirmPanel'
import { OPTION_COLOR_PALETTE } from '../utils/customerMeta'

const DEFAULT_BUTTON_CLASS =
  'flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 text-xs font-bold transition-colors hover:bg-dark-700/80'

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
  menuVariant = 'dark',
  menuMatchWidth = true,
  menuInline = false,
  menuPlacement = 'below',
}) {
  const selected = options.find((option) => option.label === value)
  const hasSelection = Boolean(selected)
  const isOpen = activeMenu === openKey
  const canEdit = editable && typeof onOptionsChange === 'function'
  const isInteractive = !disabled

  const [editingIndex, setEditingIndex] = useState(null)
  const [draftName, setDraftName] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmIndex, setConfirmIndex] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setEditingIndex(null)
      setDraftName('')
      setAdding(false)
      setNewName('')
      setConfirmIndex(null)
    }
  }, [isOpen])

  function startEdit(index) {
    setAdding(false)
    setEditingIndex(index)
    setDraftName(options[index].label)
  }

  function commitEdit() {
    const name = draftName.trim()
    if (name && editingIndex != null) {
      const previous = options[editingIndex]
      const next = options.map((option, index) => (index === editingIndex ? { ...option, label: name } : option))
      onOptionsChange(next)
      if (previous.label === value) onChange(name)
    }
    setEditingIndex(null)
    setDraftName('')
  }

  function removeOption(index) {
    const removed = options[index]
    const next = options.filter((_, optionIndex) => optionIndex !== index)
    onOptionsChange(next)
    if (removed.label === value) onChange('')
    setConfirmIndex(null)
  }

  function commitAdd() {
    const name = newName.trim()
    if (name && !options.some((option) => option.label === name)) {
      const color = OPTION_COLOR_PALETTE[options.length % OPTION_COLOR_PALETTE.length]
      onOptionsChange([...options, { label: name, color }])
      onChange(name)
    }
    setAdding(false)
    setNewName('')
  }

  const isLightMenu = menuVariant === 'light'
  const selectedTextClass = isLightMenu
    ? (hasSelection ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]')
    : (hasSelection ? 'text-gray-200' : 'text-gray-500')
  const lightMenuShell =
    'z-30 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 shadow-[var(--shadow)]'
  const menuPositionClass = menuPlacement === 'above'
    ? 'bottom-[calc(100%+4px)]'
    : menuInline
      ? ''
      : menuVariant === 'light'
        ? 'top-[calc(100%+4px)]'
        : 'top-11'
  const menuShellClass = menuInline
    ? isLightMenu
      ? `relative mt-1 w-full ${lightMenuShell}`
      : 'relative z-30 mt-1 w-full rounded-2xl border border-dark-500 bg-dark-800 p-2 shadow-2xl shadow-black/40'
    : isLightMenu
      ? `absolute left-0 ${menuPositionClass} ${lightMenuShell} min-w-[210px] w-max max-w-[260px]${menuMatchWidth ? ' w-full max-w-none' : ''}`
      : `absolute left-0 ${menuPositionClass} z-50 min-w-[210px] rounded-2xl border border-dark-500 bg-dark-800 p-2 shadow-2xl shadow-black/40${menuMatchWidth ? ' w-full' : ' w-max max-w-[260px]'}`
  const optionButtonClass = isLightMenu
    ? 'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--surface-muted)]'
    : 'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-200 transition-colors hover:text-white'
  const placeholderButtonClass = isLightMenu
    ? `${optionButtonClass} text-[var(--text-muted)]`
    : `${optionButtonClass} text-gray-400 hover:bg-blue-500/15`

  return (
    <div className={`relative min-w-0 w-full ${isOpen ? 'z-50' : ''}`} onClick={(event) => event.stopPropagation()}>
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
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${hasSelection ? selected.color : 'bg-gray-500'}`} />
          <span className={`truncate ${selectedTextClass}`}>
            {selected?.label || placeholder}
          </span>
        </span>
        {!disabled && (
          <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''} ${isLightMenu ? 'text-[var(--text-soft)]' : 'text-gray-500'}`} />
        )}
      </button>
      {isOpen && isInteractive && (
        <div className={menuShellClass}>
          {includePlaceholderOption && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setActiveMenu(null)
              }}
              className={placeholderButtonClass}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-gray-500" />
              {placeholder}
            </button>
          )}

          {options.map((option, index) =>
            confirmIndex === index ? (
              <DeleteConfirmPopover
                title={`"${option.label}" silinsin mi?`}
                description="Bu işlem geri alınamaz."
                confirmLabel="Evet, Sil"
                onConfirm={() => removeOption(index)}
                onCancel={() => setConfirmIndex(null)}
                className="w-full"
              />
            ) : editingIndex === index ? (
              <div key={`edit-${index}`} className="flex items-center gap-1.5 rounded-xl bg-dark-700/60 px-2 py-1.5">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${option.color}`} />
                <input
                  autoFocus
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitEdit()
                    if (event.key === 'Escape') {
                      setEditingIndex(null)
                      setDraftName('')
                    }
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-dark-500/60 bg-dark-900 px-2 py-1 text-xs font-bold text-gray-100 focus:outline-none focus:border-blue-500/60"
                />
                <button type="button" onClick={commitEdit} className="rounded-lg p-1 text-emerald-300 transition-colors hover:bg-emerald-500/15" title="Kaydet">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null)
                    setDraftName('')
                  }}
                  className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-dark-600"
                  title="Vazgeç"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div key={option.label} className={`group flex items-center gap-1 rounded-xl transition-colors ${isLightMenu ? 'hover:bg-[var(--surface-muted)]' : 'hover:bg-blue-500/10'}`}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.label)
                    setActiveMenu(null)
                  }}
                  className={isLightMenu ? optionButtonClass : `${optionButtonClass} hover:bg-blue-500/10`}
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${option.color}`} />
                  <span className="truncate">{option.label}</span>
                </button>
                {canEdit && (
                  <span className="flex shrink-0 items-center gap-0.5 pr-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={() => startEdit(index)} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-dark-600 hover:text-blue-300" title="Düzenle">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => { setEditingIndex(null); setConfirmIndex(index) }} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-500/15 hover:text-red-300" title="Sil">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
            ),
          )}

          {canEdit && (
            <div className="mt-1 border-t border-dark-500/40 pt-1">
              {adding ? (
                <div className="flex items-center gap-1.5 rounded-xl bg-dark-700/60 px-2 py-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
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
                      }
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-dark-500/60 bg-dark-900 px-2 py-1 text-xs font-bold text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/60"
                  />
                  <button type="button" onClick={commitAdd} className="rounded-lg p-1 text-emerald-300 transition-colors hover:bg-emerald-500/15" title="Ekle">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdding(false)
                      setNewName('')
                    }}
                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-dark-600"
                    title="Vazgeç"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null)
                    setAdding(true)
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black uppercase tracking-wide text-blue-300 transition-colors hover:bg-blue-500/15 hover:text-white"
                >
                  <Plus className="h-4 w-4" /> Ekle
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
