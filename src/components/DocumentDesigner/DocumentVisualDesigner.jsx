import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlignLeft,
  BadgeCheck,
  Barcode,
  Braces,
  Building2,
  Calculator,
  Calendar,
  Circle,
  Eye,
  EyeOff,
  Hash,
  Heading,
  Image,
  Layers,
  Magnet,
  Minus,
  PenLine,
  QrCode,
  Receipt,
  Redo2,
  Save,
  SeparatorHorizontal,
  Square,
  Stamp,
  Table,
  Type,
  Undo2,
  User,
  Users,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { ELEMENT_LIBRARY, getElementDef } from '../../data/docDesignerElements'
import { DOC_VARIABLE_GROUPS, variableToken } from '../../data/docVariableCatalog'
import {
  blocksToHtml,
  createBlock,
  getPagePreset,
  migrateTemplateToVisual,
} from '../../utils/docCanvasEngine'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

const HISTORY_MAX = 40
const SNAP_GRID = 8

const ICON_MAP = {
  Type,
  Heading,
  AlignLeft,
  Braces,
  Calendar,
  Hash,
  Image,
  BadgeCheck,
  PenLine,
  Stamp,
  Square,
  Circle,
  Minus,
  SeparatorHorizontal,
  Table,
  Building2,
  User,
  Calculator,
  Barcode,
  QrCode,
  Users,
  Receipt,
}

function cloneBlocks(blocks) {
  return structuredClone(blocks || [])
}

function snapValue(value, enabled) {
  if (!enabled) return value
  return Math.round(value / SNAP_GRID) * SNAP_GRID
}

function ElementIcon({ name, className = 'h-3.5 w-3.5' }) {
  const Icon = ICON_MAP[name] || Type
  return <Icon className={className} />
}

function ToolbarButton({ onClick, disabled, active, title, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-black uppercase tracking-wide transition-colors',
        active
          ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
          : 'border-dark-500/50 bg-dark-700/70 text-gray-300 hover:border-dark-400/60 hover:text-white',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function FieldLabel({ children }) {
  return <span className="text-[10px] font-black uppercase tracking-wide text-gray-500">{children}</span>
}

function BlockPreviewContent({ block }) {
  const p = block.props || {}
  switch (block.type) {
    case 'rect':
      return (
        <div
          className="h-full w-full"
          style={{
            background: p.fill || '#e5e7eb',
            border: `${p.strokeWidth || 1}px solid ${p.stroke || '#9ca3af'}`,
            borderRadius: p.borderRadius || 0,
          }}
        />
      )
    case 'circle':
      return (
        <div
          className="h-full w-full rounded-full"
          style={{
            background: p.fill || '#e5e7eb',
            border: `${p.strokeWidth || 1}px solid ${p.stroke || '#9ca3af'}`,
          }}
        />
      )
    case 'line':
    case 'divider':
      return (
        <div className="flex h-full w-full items-center">
          <div
            className="w-full"
            style={{ borderTop: `${p.strokeWidth || 1}px ${p.style || 'solid'} ${p.stroke || '#111'}` }}
          />
        </div>
      )
    case 'image':
    case 'logo':
      return p.src ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={p.src} alt={p.alt || ''} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center border border-dashed border-gray-300 bg-gray-50 text-[10px] text-gray-400">
          {p.alt || block.label}
        </div>
      )
    case 'barcode':
      return (
        <div className="flex h-full w-full flex-col items-center justify-center border border-dashed border-gray-400 bg-white text-[10px] text-gray-600">
          <span className="font-mono tracking-widest">||||| ||||</span>
          <span className="mt-0.5 truncate px-1">{p.value || ''}</span>
        </div>
      )
    case 'qr':
      return (
        <div className="flex h-full w-full items-center justify-center border border-gray-300 bg-white">
          <div
            className="h-3/4 w-3/4 border-2 border-gray-900"
            style={{
              background: 'repeating-conic-gradient(#111 0% 25%, #fff 0% 50%) 50% / 8px 8px',
            }}
          />
        </div>
      )
    case 'table': {
      const cols = p.columns || []
      return (
        <table className="h-full w-full border-collapse text-[9px] text-gray-700">
          <thead>
            <tr style={{ background: p.headerBg || '#f3f4f6' }}>
              {cols.map((col) => (
                <th key={col.key} className="border border-gray-200 px-1 py-0.5 text-left">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      )
    }
    case 'signature':
      return (
        <div className="flex h-full w-full flex-col justify-end text-[10px] text-gray-500">
          {p.line !== false ? <div className="mb-1 border-t border-gray-400" /> : null}
          {p.label || 'İmza'}
        </div>
      )
    case 'stamp':
      return (
        <div className="flex h-full w-full -rotate-12 items-center justify-center rounded-full border-2 border-gray-400 text-[10px] font-bold text-gray-400">
          {p.text || 'KAŞE'}
        </div>
      )
    case 'companyBlock':
      return (
        <div className="space-y-0.5 text-[10px] leading-snug text-gray-800">
          <div>{'{{sirket.unvan}}'}</div>
          <div>{'{{sirket.adres}}'}</div>
          <div>{'{{sirket.telefon}}'}</div>
        </div>
      )
    case 'customerBlock':
      return (
        <div className="space-y-0.5 text-[10px] leading-snug text-gray-800">
          <div className="font-bold">{p.title || 'Müşteri'}</div>
          <div>{'{{musteri.unvan}}'}</div>
          <div>{'{{musteri.adres}}'}</div>
        </div>
      )
    case 'totalsBlock':
      return (
        <div className="space-y-0.5 text-right text-[10px] leading-snug text-gray-800">
          <div>Ara: {'{{belge.araToplam}}'}</div>
          <div>KDV: {'{{belge.kdv}}'}</div>
          <div className="font-bold">Toplam: {'{{belge.toplam}}'}</div>
        </div>
      )
    default:
      return (
        <div
          className="h-full w-full whitespace-pre-wrap break-words"
          style={{
            fontSize: p.fontSize || 14,
            fontWeight: p.fontWeight || 400,
            color: p.color || '#111',
            textAlign: p.align || 'left',
            lineHeight: p.lineHeight || 1.35,
          }}
        >
          {p.text || block.label}
        </div>
      )
  }
}

/**
 * Visual document designer.
 * Props: { template, onChange(templatePatch), onSave }
 */
export default function DocumentVisualDesigner({ template, onChange, onSave }) {
  const migrated = useMemo(() => migrateTemplateToVisual(template || {}), [template?.id])
  const page = getPagePreset(template?.pageSize || migrated.pageSize || 'A4')

  const [blocks, setBlocks] = useState(() => cloneBlocks(migrated.blocks))
  const [selectedId, setSelectedId] = useState(null)
  const [zoom, setZoom] = useState(template?.zoom ?? migrated.zoom ?? 1)
  const [snap, setSnap] = useState(true)
  const [preview, setPreview] = useState(false)
  const [leftTab, setLeftTab] = useState('elements') // elements | variables | layers
  const [historyTick, setHistoryTick] = useState(0)

  const historyRef = useRef({ past: [], future: [] })
  const dragRef = useRef(null)
  const canvasRef = useRef(null)
  const skipNotify = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Sync when external template id changes
  useEffect(() => {
    const next = migrateTemplateToVisual(template || {})
    skipNotify.current = true
    setBlocks(cloneBlocks(next.blocks))
    setZoom(next.zoom ?? 1)
    setSelectedId(null)
    historyRef.current = { past: [], future: [] }
    setHistoryTick((t) => t + 1)
  }, [template?.id])

  const selected = useMemo(
    () => blocks.find((b) => b.id === selectedId) || null,
    [blocks, selectedId],
  )

  const previewHtml = useMemo(
    () => blocksToHtml(blocks, { pageSize: page.id, unit: 'px' }),
    [blocks, page.id],
  )

  const pushHistory = useCallback((prevBlocks) => {
    const hist = historyRef.current
    hist.past = [...hist.past, cloneBlocks(prevBlocks)].slice(-HISTORY_MAX)
    hist.future = []
    setHistoryTick((t) => t + 1)
  }, [])

  const commitBlocks = useCallback(
    (updater, { recordHistory = true } = {}) => {
      setBlocks((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        if (recordHistory) pushHistory(prev)
        return next
      })
    },
    [pushHistory],
  )

  // Notify parent of visual state changes (stable callback via ref)
  useEffect(() => {
    if (skipNotify.current) {
      skipNotify.current = false
      return
    }
    onChangeRef.current?.({
      blocks,
      zoom,
      designMode: 'visual',
    })
  }, [blocks, zoom])

  function handleUndo() {
    const hist = historyRef.current
    if (!hist.past.length) return
    const previous = hist.past[hist.past.length - 1]
    hist.past = hist.past.slice(0, -1)
    hist.future = [cloneBlocks(blocks), ...hist.future].slice(0, HISTORY_MAX)
    setHistoryTick((t) => t + 1)
    setBlocks(previous)
  }

  function handleRedo() {
    const hist = historyRef.current
    if (!hist.future.length) return
    const next = hist.future[0]
    hist.future = hist.future.slice(1)
    hist.past = [...hist.past, cloneBlocks(blocks)].slice(-HISTORY_MAX)
    setHistoryTick((t) => t + 1)
    setBlocks(next)
  }

  function addBlock(type, at = null) {
    const maxZ = blocks.reduce((m, b) => Math.max(m, b.zIndex || 0), 0)
    const drop = at || {
      x: snapValue(48 + (blocks.length % 5) * 12, snap),
      y: snapValue(48 + (blocks.length % 7) * 16, snap),
    }
    const block = createBlock(type, { ...drop, zIndex: maxZ + 1 })
    commitBlocks((prev) => [...prev, block])
    setSelectedId(block.id)
  }

  function insertVariable(path) {
    const token = variableToken(path)
    if (selected && ['text', 'title', 'paragraph', 'variable', 'date', 'pageNumber', 'barcode', 'qr'].includes(selected.type)) {
      commitBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== selected.id) return b
          const props = { ...b.props }
          if (['barcode', 'qr'].includes(b.type)) {
            props.value = token
            props.variablePath = path
          } else if (b.type === 'variable' || b.type === 'date') {
            props.text = token
            props.variablePath = path
          } else {
            props.text = `${props.text || ''}${token}`
            props.variablePath = path
          }
          return { ...b, props }
        }),
      )
      return
    }
    const maxZ = blocks.reduce((m, b) => Math.max(m, b.zIndex || 0), 0)
    const block = createBlock('variable', {
      x: snapValue(48 + (blocks.length % 5) * 12, snap),
      y: snapValue(48 + (blocks.length % 7) * 16, snap),
      zIndex: maxZ + 1,
      props: { text: token, variablePath: path },
    })
    commitBlocks((prev) => [...prev, block])
    setSelectedId(block.id)
  }

  function updateSelectedProps(patch) {
    if (!selected) return
    commitBlocks((prev) =>
      prev.map((b) => (b.id === selected.id ? { ...b, props: { ...b.props, ...patch } } : b)),
    )
  }

  function updateSelectedMeta(patch) {
    if (!selected) return
    commitBlocks((prev) =>
      prev.map((b) => (b.id === selected.id ? { ...b, ...patch } : b)),
    )
  }

  function deleteSelected() {
    if (!selectedId) return
    commitBlocks((prev) => prev.filter((b) => b.id !== selectedId))
    setSelectedId(null)
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e) {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        commitBlocks((prev) => prev.filter((b) => b.id !== selectedId))
        setSelectedId(null)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function onCanvasDragStart(e, block, mode = 'move') {
    if (block.locked || preview) return
    e.preventDefault()
    e.stopPropagation()
    setSelectedId(block.id)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    dragRef.current = {
      id: block.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: block.x,
      origY: block.y,
      origW: block.w,
      origH: block.h,
      recorded: false,
    }
  }

  useEffect(() => {
    function onMove(e) {
      const drag = dragRef.current
      if (!drag) return
      const dx = (e.clientX - drag.startX) / zoom
      const dy = (e.clientY - drag.startY) / zoom

      setBlocks((prev) => {
        if (!drag.recorded) {
          pushHistory(prev)
          drag.recorded = true
        }
        return prev.map((b) => {
          if (b.id !== drag.id) return b
          if (drag.mode === 'move') {
            return {
              ...b,
              x: snapValue(drag.origX + dx, snap),
              y: snapValue(drag.origY + dy, snap),
            }
          }
          // resize se
          return {
            ...b,
            w: Math.max(20, snapValue(drag.origW + dx, snap)),
            h: Math.max(16, snapValue(drag.origH + dy, snap)),
          }
        })
      })
    }

    function onUp() {
      dragRef.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [zoom, snap, pushHistory])

  function onDropElement(e) {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/x-bach-element') || e.dataTransfer.getData('text/plain')
    if (!type) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) {
      addBlock(type)
      return
    }
    const x = snapValue((e.clientX - rect.left) / zoom - 40, snap)
    const y = snapValue((e.clientY - rect.top) / zoom - 20, snap)
    addBlock(type, { x: Math.max(0, x), y: Math.max(0, y) })
  }

  // historyTick forces toolbar re-render when undo stack changes
  const canUndo = historyTick >= 0 && historyRef.current.past.length > 0
  const canRedo = historyTick >= 0 && historyRef.current.future.length > 0

  return (
    <div className="flex min-h-[720px] flex-col overflow-hidden rounded-2xl border border-dark-500/40 bg-dark-800/40">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-dark-500/40 bg-dark-900/50 px-3 py-2.5">
        <ToolbarButton title="Geri al" onClick={handleUndo} disabled={!canUndo}>
          <Undo2 className="h-3.5 w-3.5" /> Undo
        </ToolbarButton>
        <ToolbarButton title="Yinele" onClick={handleRedo} disabled={!canRedo}>
          <Redo2 className="h-3.5 w-3.5" /> Redo
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-dark-500/50" />
        <ToolbarButton title="Uzaklaştır" onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))}>
          <ZoomOut className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="min-w-[3rem] text-center text-[11px] font-black text-gray-400">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton title="Yakınlaştır" onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10))}>
          <ZoomIn className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-dark-500/50" />
        <ToolbarButton title="Snap" active={snap} onClick={() => setSnap((v) => !v)}>
          <Magnet className="h-3.5 w-3.5" /> Snap
        </ToolbarButton>
        <ToolbarButton title="Önizleme" active={preview} onClick={() => setPreview((v) => !v)}>
          {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} Preview
        </ToolbarButton>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onSave?.()}
          className={`${BTN_SUCCESS} gap-2 px-3 py-1.5 text-xs`}
        >
          <Save className="h-3.5 w-3.5" /> Kaydet
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_260px]">
        {/* Left panel */}
        <aside className="flex min-h-[280px] flex-col border-b border-dark-500/40 lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="flex border-b border-dark-500/40">
            {[
              { id: 'elements', label: 'Öğeler' },
              { id: 'variables', label: 'Değişken' },
              { id: 'layers', label: 'Katman' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLeftTab(tab.id)}
                className={[
                  'flex-1 px-2 py-2.5 text-[10px] font-black uppercase tracking-wide',
                  leftTab === tab.id
                    ? 'border-b-2 border-cyan-400 text-cyan-300'
                    : 'text-gray-500 hover:text-gray-300',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
            {leftTab === 'elements' ? (
              <div className="space-y-3">
                {ELEMENT_LIBRARY.map((group) => (
                  <div key={group.id}>
                    <p className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-wide text-gray-500">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <button
                          key={`${group.id}-${item.type}-${item.label}`}
                          type="button"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/x-bach-element', item.type)
                            e.dataTransfer.setData('text/plain', item.type)
                            e.dataTransfer.effectAllowed = 'copy'
                          }}
                          onClick={() => addBlock(item.type)}
                          className="flex w-full items-center gap-2 rounded-xl border border-dark-500/40 bg-dark-700/40 px-2.5 py-2 text-left text-xs font-bold text-gray-200 transition-colors hover:border-cyan-500/30 hover:bg-dark-700/70"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-dark-500/40 bg-dark-800/80 text-cyan-300/90">
                            <ElementIcon name={item.icon} />
                          </span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {leftTab === 'variables' ? (
              <div className="space-y-3">
                {DOC_VARIABLE_GROUPS.map((group) => (
                  <div key={group.id}>
                    <p className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-wide text-gray-500">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.variables.map((v) => (
                        <button
                          key={v.path}
                          type="button"
                          title={v.sample ? `Örnek: ${v.sample}` : v.path}
                          onClick={() => insertVariable(v.path)}
                          className="flex w-full flex-col rounded-xl border border-dark-500/40 bg-dark-700/40 px-2.5 py-2 text-left transition-colors hover:border-emerald-500/30 hover:bg-dark-700/70"
                        >
                          <span className="text-xs font-bold text-gray-200">{v.label}</span>
                          <span className="truncate font-mono text-[10px] text-emerald-400/80">{`{{${v.path}}}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {leftTab === 'layers' ? (
              <div className="space-y-1">
                {[...blocks].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => setSelectedId(block.id)}
                    className={[
                      'flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-bold transition-colors',
                      selectedId === block.id
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                        : 'border-dark-500/40 bg-dark-700/40 text-gray-300 hover:bg-dark-700/70',
                    ].join(' ')}
                  >
                    <Layers className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{block.label || getElementDef(block.type)?.label || block.type}</span>
                  </button>
                ))}
                {blocks.length === 0 ? (
                  <p className="px-2 py-4 text-center text-[11px] font-semibold text-gray-500">
                    Henüz öğe yok — soldan sürükleyin
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>

        {/* Canvas */}
        <div className="relative min-h-[480px] overflow-auto bg-dark-950/60 p-6">
          {preview ? (
            <iframe
              title="Önizleme"
              className="mx-auto min-h-[640px] w-full max-w-[820px] rounded-lg bg-white shadow-2xl"
              srcDoc={previewHtml}
            />
          ) : (
            <div
              className="mx-auto origin-top"
              style={{
                width: page.widthPx * zoom,
                height: page.heightPx * zoom,
              }}
            >
              <div
                ref={canvasRef}
                role="presentation"
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropElement}
                onClick={() => setSelectedId(null)}
                className="relative bg-white shadow-2xl shadow-black/40"
                style={{
                  width: page.widthPx,
                  height: page.heightPx,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  backgroundImage: snap
                    ? `linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)`
                    : 'none',
                  backgroundSize: snap ? `${SNAP_GRID}px ${SNAP_GRID}px` : undefined,
                }}
              >
                {blocks.map((block) => {
                  if (block.visible === false) return null
                  const isSelected = block.id === selectedId
                  return (
                    <div
                      key={block.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedId(block.id)
                      }}
                      onPointerDown={(e) => onCanvasDragStart(e, block, 'move')}
                      className={[
                        'absolute cursor-move select-none',
                        isSelected ? 'ring-2 ring-cyan-500 ring-offset-1' : 'hover:ring-1 hover:ring-cyan-400/50',
                      ].join(' ')}
                      style={{
                        left: block.x,
                        top: block.y,
                        width: block.w,
                        height: block.h,
                        zIndex: block.zIndex || 1,
                        opacity: block.locked ? 0.7 : 1,
                      }}
                    >
                      <BlockPreviewContent block={block} />
                      {isSelected ? (
                        <span
                          className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-se-resize rounded-sm border border-white bg-cyan-500"
                          onPointerDown={(e) => onCanvasDragStart(e, block, 'resize')}
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right inspector */}
        <aside className="border-t border-dark-500/40 lg:border-l lg:border-t-0">
          <div className="border-b border-dark-500/40 px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-gray-400">
            Özellikler
          </div>
          <div className="space-y-3 overflow-y-auto p-3">
            {!selected ? (
              <p className="text-[11px] font-semibold text-gray-500">
                Bir öğe seçin veya tuvale sürükleyin.
              </p>
            ) : (
              <>
                <div>
                  <FieldLabel>Tür</FieldLabel>
                  <p className="mt-1 text-xs font-bold text-gray-200">
                    {selected.label || getElementDef(selected.type)?.label || selected.type}
                  </p>
                </div>

                {['text', 'title', 'paragraph', 'variable', 'date', 'pageNumber', 'signature', 'stamp'].includes(selected.type) ? (
                  <label className="block space-y-1">
                    <FieldLabel>Metin</FieldLabel>
                    <textarea
                      className="form-input min-h-16 text-xs"
                      value={selected.props?.text ?? selected.props?.label ?? ''}
                      onChange={(e) => {
                        if (selected.type === 'signature') updateSelectedProps({ label: e.target.value })
                        else if (selected.type === 'stamp') updateSelectedProps({ text: e.target.value })
                        else updateSelectedProps({ text: e.target.value })
                      }}
                    />
                  </label>
                ) : null}

                {['text', 'title', 'paragraph', 'variable', 'date', 'pageNumber'].includes(selected.type) ? (
                  <>
                    <label className="block space-y-1">
                      <FieldLabel>Yazı boyutu</FieldLabel>
                      <input
                        type="number"
                        className="form-input text-xs"
                        value={selected.props?.fontSize ?? 14}
                        onChange={(e) => updateSelectedProps({ fontSize: Number(e.target.value) || 14 })}
                      />
                    </label>
                    <label className="block space-y-1">
                      <FieldLabel>Renk</FieldLabel>
                      <input
                        type="color"
                        className="form-input h-9 p-1"
                        value={selected.props?.color || '#111827'}
                        onChange={(e) => updateSelectedProps({ color: e.target.value })}
                      />
                    </label>
                    <label className="block space-y-1">
                      <FieldLabel>Hizalama</FieldLabel>
                      <select
                        className="form-input text-xs"
                        value={selected.props?.align || 'left'}
                        onChange={(e) => updateSelectedProps({ align: e.target.value })}
                      >
                        <option value="left">Sol</option>
                        <option value="center">Orta</option>
                        <option value="right">Sağ</option>
                      </select>
                    </label>
                  </>
                ) : null}

                {['rect', 'circle'].includes(selected.type) ? (
                  <label className="block space-y-1">
                    <FieldLabel>Dolgu</FieldLabel>
                    <input
                      type="color"
                      className="form-input h-9 p-1"
                      value={selected.props?.fill || '#e5e7eb'}
                      onChange={(e) => updateSelectedProps({ fill: e.target.value })}
                    />
                  </label>
                ) : null}

                {['variable', 'date', 'barcode', 'qr'].includes(selected.type) ? (
                  <label className="block space-y-1">
                    <FieldLabel>Değişken yolu</FieldLabel>
                    <input
                      className="form-input font-mono text-xs"
                      value={selected.props?.variablePath || ''}
                      onChange={(e) => {
                        const path = e.target.value
                        const patch = { variablePath: path }
                        if (['barcode', 'qr'].includes(selected.type)) patch.value = path ? variableToken(path) : selected.props?.value
                        else if (path) patch.text = variableToken(path)
                        updateSelectedProps(patch)
                      }}
                      placeholder="sirket.unvan"
                    />
                  </label>
                ) : null}

                {['barcode', 'qr'].includes(selected.type) ? (
                  <label className="block space-y-1">
                    <FieldLabel>Değer</FieldLabel>
                    <input
                      className="form-input font-mono text-xs"
                      value={selected.props?.value || ''}
                      onChange={(e) => updateSelectedProps({ value: e.target.value })}
                    />
                  </label>
                ) : null}

                {selected.type === 'table' ? (
                  <label className="block space-y-1">
                    <FieldLabel>Kolonlar (virgülle)</FieldLabel>
                    <input
                      className="form-input text-xs"
                      value={(selected.props?.columns || []).map((c) => c.label).join(', ')}
                      onChange={(e) => {
                        const labels = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        updateSelectedProps({
                          columns: labels.map((label, i) => ({
                            key: `col${i}`,
                            label,
                            width: `${Math.floor(100 / Math.max(labels.length, 1))}%`,
                          })),
                        })
                      }}
                    />
                  </label>
                ) : null}

                {['image', 'logo'].includes(selected.type) ? (
                  <label className="block space-y-1">
                    <FieldLabel>Görsel URL</FieldLabel>
                    <input
                      className="form-input text-xs"
                      value={selected.props?.src || ''}
                      onChange={(e) => updateSelectedProps({ src: e.target.value })}
                    />
                  </label>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <FieldLabel>X</FieldLabel>
                    <input
                      type="number"
                      className="form-input text-xs"
                      value={Math.round(selected.x)}
                      onChange={(e) => updateSelectedMeta({ x: Number(e.target.value) || 0 })}
                    />
                  </label>
                  <label className="block space-y-1">
                    <FieldLabel>Y</FieldLabel>
                    <input
                      type="number"
                      className="form-input text-xs"
                      value={Math.round(selected.y)}
                      onChange={(e) => updateSelectedMeta({ y: Number(e.target.value) || 0 })}
                    />
                  </label>
                  <label className="block space-y-1">
                    <FieldLabel>W</FieldLabel>
                    <input
                      type="number"
                      className="form-input text-xs"
                      value={Math.round(selected.w)}
                      onChange={(e) => updateSelectedMeta({ w: Math.max(16, Number(e.target.value) || 16) })}
                    />
                  </label>
                  <label className="block space-y-1">
                    <FieldLabel>H</FieldLabel>
                    <input
                      type="number"
                      className="form-input text-xs"
                      value={Math.round(selected.h)}
                      onChange={(e) => updateSelectedMeta({ h: Math.max(12, Number(e.target.value) || 12) })}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={deleteSelected}
                  className="w-full rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-red-300 hover:bg-red-500/20"
                >
                  Sil (Delete)
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
