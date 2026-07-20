import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  BadgeCheck,
  Barcode,
  Braces,
  Building2,
  Calculator,
  Calendar,
  ChevronLeft,
  Circle,
  Eye,
  EyeOff,
  GripVertical,
  Hash,
  Heading,
  Image,
  Layers,
  Lock,
  Magnet,
  Minus,
  PenLine,
  Printer,
  QrCode,
  Receipt,
  Redo2,
  Save,
  SeparatorHorizontal,
  Square,
  Stamp,
  Star,
  Table,
  Type,
  Undo2,
  Unlock,
  User,
  Users,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  ELEMENT_LIBRARY,
  TABLE_COLUMN_CATALOG,
  getElementDef,
} from '../../data/docDesignerElements'
import {
  DOC_VARIABLE_GROUPS,
  buildSamplePreviewContext,
  variableToken,
} from '../../data/docVariableCatalog'
import {
  DOC_READY_TEMPLATES,
  DOC_TYPE_FILTERS,
  materializeReadyTemplate,
} from '../../data/docReadyTemplates'
import {
  PAGE_PRESET_LIST,
  blocksToHtml,
  createBlock,
  getPagePreset,
  migrateTemplateToVisual,
} from '../../utils/docCanvasEngine'
import { resolveTemplateString } from '../../utils/docVariableEngine'
import { downloadPdfFromHtml, openPrintWindow } from '../../utils/docPrint'
import {
  listFavoriteTemplateIds,
  listRecentTemplates,
  pushRecentTemplate,
  toggleFavoriteTemplate,
} from '../../utils/docDesignerPrefs'
import { DOCUMENT_CENTER_BASE } from '../../data/documentCenterMenu'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'

const HISTORY_MAX = 80
const SNAP_GRID = 8

const ICON_MAP = {
  Type,
  Heading,
  AlignLeft: Type,
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

function BlockPreviewContent({ block }) {
  const p = block.props || {}
  switch (block.type) {
    case 'spacer':
      return <div className="h-full w-full border border-dashed border-slate-200 bg-transparent" />
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
            style={{
              borderTop: `${p.strokeWidth || 1}px ${p.style || 'solid'} ${p.stroke || '#111'}`,
            }}
          />
        </div>
      )
    case 'image':
    case 'logo':
      return p.src ? (
        <img src={p.src} alt={p.alt || ''} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
          {p.alt || block.label}
        </div>
      )
    case 'barcode':
      return (
        <div className="flex h-full w-full flex-col items-center justify-center border border-dashed border-slate-400 bg-white text-[10px] text-slate-600">
          <span className="font-mono tracking-widest">||||| ||||</span>
          <span className="mt-0.5 truncate px-1">{p.value || ''}</span>
        </div>
      )
    case 'qr':
      return (
        <div className="flex h-full w-full items-center justify-center border border-slate-300 bg-white">
          <div
            className="h-3/4 w-3/4 border-2 border-slate-900"
            style={{
              background: 'repeating-conic-gradient(#111 0% 25%, #fff 0% 50%) 50% / 8px 8px',
            }}
          />
        </div>
      )
    case 'table': {
      const cols = p.columns || []
      return (
        <table className="h-full w-full border-collapse text-[9px] text-slate-700">
          <thead>
            <tr style={{ background: p.headerBg || '#f3f4f6' }}>
              {cols.map((col) => (
                <th key={col.key} className="border border-slate-200 px-1 py-0.5 text-left">
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
        <div className="flex h-full w-full flex-col justify-end text-[10px] text-slate-500">
          {p.line !== false ? <div className="mb-1 border-t border-slate-400" /> : null}
          {p.label || 'İmza'}
        </div>
      )
    case 'stamp':
      return (
        <div className="flex h-full w-full -rotate-12 items-center justify-center rounded-full border-2 border-slate-400 text-[10px] font-bold text-slate-400">
          {p.text || 'KAŞE'}
        </div>
      )
    case 'companyBlock':
      return (
        <div className="space-y-0.5 text-[10px] leading-snug text-slate-800">
          <div>{'{{sirket.unvan}}'}</div>
          <div>{'{{sirket.adres}}'}</div>
          <div>{'{{sirket.telefon}}'}</div>
        </div>
      )
    case 'customerBlock':
      return (
        <div className="space-y-0.5 text-[10px] leading-snug text-slate-800">
          <div className="font-bold">{p.title || 'Müşteri'}</div>
          <div>{'{{musteri.unvan}}'}</div>
          <div>{'{{musteri.adres}}'}</div>
        </div>
      )
    case 'totalsBlock':
      return (
        <div className="space-y-0.5 text-right text-[10px] leading-snug text-slate-800">
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
            fontStyle: p.italic ? 'italic' : 'normal',
            textDecoration: p.underline ? 'underline' : 'none',
          }}
        >
          {p.text || block.label}
        </div>
      )
  }
}

/**
 * Full-screen BachMain Document Designer
 */
export default function BachDocumentDesigner({
  template,
  onChange,
  onSave,
  onClose,
  autosaveHint = '',
}) {
  const migrated = useMemo(() => migrateTemplateToVisual(template || {}), [template?.id])
  const page = getPagePreset(
    template?.pageSize || migrated.pageSize || 'A4',
    template?.orientation || 'portrait',
  )

  const [blocks, setBlocks] = useState(() => cloneBlocks(migrated.blocks))
  const [selectedIds, setSelectedIds] = useState([])
  const [zoom, setZoom] = useState(template?.zoom ?? migrated.zoom ?? 0.85)
  const [snap, setSnap] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showRulers, setShowRulers] = useState(true)
  const [guides, setGuides] = useState({ x: null, y: null })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [rightTab, setRightTab] = useState('components')
  const [leftFilter, setLeftFilter] = useState('all')
  const [favorites, setFavorites] = useState(() => listFavoriteTemplateIds())
  const [recents, setRecents] = useState(() => listRecentTemplates())
  const [historyTick, setHistoryTick] = useState(0)
  const [compFilter, setCompFilter] = useState('')

  const historyRef = useRef({ past: [], future: [] })
  const dragRef = useRef(null)
  const canvasRef = useRef(null)
  const skipNotify = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const selectedId = selectedIds[0] || null
  const selected = useMemo(
    () => blocks.find((b) => b.id === selectedId) || null,
    [blocks, selectedId],
  )
  const margins = template?.margins || { top: 15, right: 15, bottom: 15, left: 15 }

  useEffect(() => {
    const next = migrateTemplateToVisual(template || {})
    skipNotify.current = true
    setBlocks(cloneBlocks(next.blocks))
    setZoom(next.zoom ?? 0.85)
    setSelectedIds([])
    historyRef.current = { past: [], future: [] }
    setHistoryTick((t) => t + 1)
  }, [template?.id])

  useEffect(() => {
    if (skipNotify.current) {
      skipNotify.current = false
      return
    }
    onChangeRef.current?.({ blocks, zoom, designMode: 'visual' })
  }, [blocks, zoom])

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

  function addBlock(type, at = null, label) {
    const maxZ = blocks.reduce((m, b) => Math.max(m, b.zIndex || 0), 0)
    const drop = at || {
      x: snapValue(48 + (blocks.length % 5) * 12, snap),
      y: snapValue(48 + (blocks.length % 7) * 16, snap),
    }
    const block = createBlock(type, { ...drop, zIndex: maxZ + 1, label })
    commitBlocks((prev) => [...prev, block])
    setSelectedIds([block.id])
    setRightTab('props')
  }

  function applyReady(ready) {
    const mat = materializeReadyTemplate(ready)
    if (!mat) return
    commitBlocks(mat.blocks)
    onChangeRef.current?.({
      ...mat,
      name: template?.name && template.name !== 'Yeni Şablon' ? template.name : mat.name,
      zoom,
    })
    setRecents(pushRecentTemplate({ id: ready.id, name: ready.name }))
  }

  function updateSelectedProps(patch) {
    if (!selected) return
    commitBlocks((prev) =>
      prev.map((b) => (b.id === selected.id ? { ...b, props: { ...b.props, ...patch } } : b)),
    )
  }

  function updateSelectedMeta(patch) {
    if (!selected) return
    commitBlocks((prev) => prev.map((b) => (b.id === selected.id ? { ...b, ...patch } : b)))
  }

  function alignSelection(mode) {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : []
    if (ids.length < 1) return
    const items = blocks.filter((b) => ids.includes(b.id))
    if (!items.length) return
    const minX = Math.min(...items.map((b) => b.x))
    const maxX = Math.max(...items.map((b) => b.x + b.w))
    const minY = Math.min(...items.map((b) => b.y))
    const maxY = Math.max(...items.map((b) => b.y + b.h))
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    commitBlocks((prev) =>
      prev.map((b) => {
        if (!ids.includes(b.id) || b.locked) return b
        if (mode === 'left') return { ...b, x: minX }
        if (mode === 'right') return { ...b, x: maxX - b.w }
        if (mode === 'centerX') return { ...b, x: cx - b.w / 2 }
        if (mode === 'top') return { ...b, y: minY }
        if (mode === 'bottom') return { ...b, y: maxY - b.h }
        if (mode === 'centerY') return { ...b, y: cy - b.h / 2 }
        if (mode === 'pageCenterX') return { ...b, x: (page.widthPx - b.w) / 2 }
        if (mode === 'distributeX' && items.length >= 3) {
          const sorted = [...items].sort((a, c) => a.x - c.x)
          const first = sorted[0]
          const last = sorted[sorted.length - 1]
          const gap = (last.x - first.x) / (sorted.length - 1)
          const idx = sorted.findIndex((s) => s.id === b.id)
          if (idx <= 0 || idx === sorted.length - 1) return b
          return { ...b, x: first.x + gap * idx }
        }
        return b
      }),
    )
  }

  function bringForward() {
    if (!selected) return
    updateSelectedMeta({ zIndex: (selected.zIndex || 1) + 1 })
  }

  function sendBackward() {
    if (!selected) return
    updateSelectedMeta({ zIndex: Math.max(1, (selected.zIndex || 1) - 1) })
  }

  function groupSelected() {
    if (selectedIds.length < 2) return
    const gid = `grp-${Date.now()}`
    commitBlocks((prev) =>
      prev.map((b) => (selectedIds.includes(b.id) ? { ...b, groupId: gid } : b)),
    )
  }

  function ungroupSelected() {
    if (!selected?.groupId) return
    const gid = selected.groupId
    commitBlocks((prev) => prev.map((b) => (b.groupId === gid ? { ...b, groupId: null } : b)))
  }

  function onCanvasDragStart(e, block, mode = 'move') {
    if (block.locked) return
    e.preventDefault()
    e.stopPropagation()
    setSelectedIds((ids) =>
      e.shiftKey ? (ids.includes(block.id) ? ids : [...ids, block.id]) : [block.id],
    )
    setRightTab('props')
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
        const moving = prev.find((b) => b.id === drag.id)
        let nextX = drag.mode === 'move' ? snapValue(drag.origX + dx, snap) : moving?.x
        let nextY = drag.mode === 'move' ? snapValue(drag.origY + dy, snap) : moving?.y
        let gx = null
        let gy = null
        if (drag.mode === 'move' && moving) {
          const midX = nextX + moving.w / 2
          const midY = nextY + moving.h / 2
          if (Math.abs(midX - page.widthPx / 2) < 6) {
            nextX = page.widthPx / 2 - moving.w / 2
            gx = page.widthPx / 2
          }
          if (Math.abs(midY - page.heightPx / 2) < 6) {
            nextY = page.heightPx / 2 - moving.h / 2
            gy = page.heightPx / 2
          }
          for (const other of prev) {
            if (other.id === drag.id) continue
            if (Math.abs(nextX - other.x) < 5) {
              nextX = other.x
              gx = other.x
            }
            if (Math.abs(nextY - other.y) < 5) {
              nextY = other.y
              gy = other.y
            }
          }
        }
        setGuides({ x: gx, y: gy })
        return prev.map((b) => {
          if (b.id !== drag.id) return b
          if (drag.mode === 'move') return { ...b, x: nextX, y: nextY }
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
      setGuides({ x: null, y: null })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [zoom, snap, pushHistory, page.widthPx, page.heightPx])

  function onDropElement(e) {
    e.preventDefault()
    const type =
      e.dataTransfer.getData('application/x-bach-element') || e.dataTransfer.getData('text/plain')
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

  useEffect(() => {
    function onKeyDown(e) {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable)
        return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length) {
        e.preventDefault()
        commitBlocks((prev) => prev.filter((b) => !selectedIds.includes(b.id)))
        setSelectedIds([])
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave?.()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const canUndo = historyTick >= 0 && historyRef.current.past.length > 0
  const canRedo = historyTick >= 0 && historyRef.current.future.length > 0

  const previewHtml = useMemo(() => {
    const raw = blocksToHtml(blocks, {
      pageSize: template?.pageSize || page.id,
      orientation: template?.orientation || 'portrait',
      unit: 'px',
    })
    const ctx = buildSamplePreviewContext()
    return resolveTemplateString(raw, ctx)
  }, [blocks, page.id, template?.pageSize, template?.orientation])

  async function handleTestPrint() {
    openPrintWindow(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Test</title></head><body>${previewHtml}</body></html>`,
    )
  }

  async function handlePdf() {
    await downloadPdfFromHtml(
      `<!DOCTYPE html><html><body>${previewHtml}</body></html>`,
      `${template?.name || 'belge'}.pdf`,
    )
  }

  const readyList = DOC_READY_TEMPLATES.filter(
    (t) => leftFilter === 'all' || t.docType === leftFilter,
  )
  const filteredLibrary = ELEMENT_LIBRARY.map((g) => ({
    ...g,
    items: g.items.filter(
      (i) =>
        !compFilter || i.label.toLocaleLowerCase('tr').includes(compFilter.toLocaleLowerCase('tr')),
    ),
  })).filter((g) => g.items.length)

  const ui = (
    <div className="bach-doc-designer" data-doc-designer="full">
      <header className="bach-doc-designer-topbar">
        <div className="bach-doc-designer-crumb">
          <button type="button" className="bach-doc-icon-btn" onClick={onClose} aria-label="Geri">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>Belge Merkezi</span>
          <span className="opacity-40">/</span>
          <span>Belge Tasarımcısı</span>
          {autosaveHint ? <span className="bach-doc-autosave">{autosaveHint}</span> : null}
        </div>
        <input
          className="bach-doc-name-input"
          value={template?.name || ''}
          onChange={(e) => onChange?.({ name: e.target.value })}
          placeholder="Şablon adı"
        />
        <div className="bach-doc-top-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Vazgeç
          </button>
          <button type="button" className="bach-doc-btn ghost" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-3.5 w-3.5" /> Önizle
          </button>
          <button type="button" className="bach-doc-btn ghost" onClick={handleTestPrint}>
            <Printer className="h-3.5 w-3.5" /> Test Yazdır
          </button>
          <button
            type="button"
            className={`${BTN_SUCCESS} !rounded-xl !px-4 !py-2 text-xs`}
            onClick={() => onSave?.()}
          >
            <Save className="h-3.5 w-3.5" /> Kaydet
          </button>
        </div>
      </header>

      <div className="bach-doc-designer-toolbar">
        <label className="bach-doc-field">
          <span>Kağıt</span>
          <select
            value={template?.pageSize || 'A4'}
            onChange={(e) => onChange?.({ pageSize: e.target.value })}
          >
            {PAGE_PRESET_LIST.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <div className="bach-doc-orient">
          <button
            type="button"
            className={(template?.orientation || 'portrait') === 'portrait' ? 'is-active' : ''}
            onClick={() => onChange?.({ orientation: 'portrait' })}
          >
            Dikey
          </button>
          <button
            type="button"
            className={template?.orientation === 'landscape' ? 'is-active' : ''}
            onClick={() => onChange?.({ orientation: 'landscape' })}
          >
            Yatay
          </button>
        </div>
        <label className="bach-doc-field compact">
          <span>Üst</span>
          <input
            type="number"
            value={margins.top}
            onChange={(e) =>
              onChange?.({ margins: { ...margins, top: Number(e.target.value) || 0 } })
            }
          />
        </label>
        <label className="bach-doc-field compact">
          <span>Alt</span>
          <input
            type="number"
            value={margins.bottom}
            onChange={(e) =>
              onChange?.({ margins: { ...margins, bottom: Number(e.target.value) || 0 } })
            }
          />
        </label>
        <label className="bach-doc-field compact">
          <span>Sol</span>
          <input
            type="number"
            value={margins.left}
            onChange={(e) =>
              onChange?.({ margins: { ...margins, left: Number(e.target.value) || 0 } })
            }
          />
        </label>
        <label className="bach-doc-field compact">
          <span>Sağ</span>
          <input
            type="number"
            value={margins.right}
            onChange={(e) =>
              onChange?.({ margins: { ...margins, right: Number(e.target.value) || 0 } })
            }
          />
        </label>
        <button
          type="button"
          className={`bach-doc-tool ${showGrid ? 'is-active' : ''}`}
          onClick={() => setShowGrid((v) => !v)}
          title="Izgara"
        >
          Izgara
        </button>
        <button
          type="button"
          className={`bach-doc-tool ${snap ? 'is-active' : ''}`}
          onClick={() => setSnap((v) => !v)}
          title="Snap"
        >
          <Magnet className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={`bach-doc-tool ${showRulers ? 'is-active' : ''}`}
          onClick={() => setShowRulers((v) => !v)}
        >
          Cetvel
        </button>
        <div className="bach-doc-sep" />
        <button type="button" className="bach-doc-tool" disabled={!canUndo} onClick={handleUndo}>
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="bach-doc-tool" disabled={!canRedo} onClick={handleRedo}>
          <Redo2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="bach-doc-tool"
          onClick={() => setZoom((z) => Math.max(0.35, Math.round((z - 0.1) * 10) / 10))}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="bach-doc-zoom">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="bach-doc-tool"
          onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10))}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <div className="bach-doc-sep" />
        <button
          type="button"
          className="bach-doc-tool"
          title="Sola"
          onClick={() => alignSelection('left')}
        >
          <AlignStartVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="bach-doc-tool"
          title="Ortala"
          onClick={() => alignSelection('centerX')}
        >
          <AlignCenterVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="bach-doc-tool"
          title="Sağa"
          onClick={() => alignSelection('right')}
        >
          <AlignEndVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="bach-doc-tool"
          title="Üste"
          onClick={() => alignSelection('top')}
        >
          <AlignStartHorizontal className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="bach-doc-tool"
          title="Alta"
          onClick={() => alignSelection('bottom')}
        >
          <AlignEndHorizontal className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="bach-doc-tool"
          title="Eşit dağıt"
          onClick={() => alignSelection('distributeX')}
        >
          <AlignCenterHorizontal className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="bach-doc-tool" onClick={groupSelected}>
          Grupla
        </button>
        <button type="button" className="bach-doc-tool" onClick={ungroupSelected}>
          Çöz
        </button>
      </div>

      <div className="bach-doc-designer-body">
        <aside className="bach-doc-left">
          <h3>Şablonlar</h3>
          <div className="bach-doc-chip-row">
            {DOC_TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={leftFilter === f.id ? 'is-active' : ''}
                onClick={() => setLeftFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="bach-doc-section-label">Hazır Şablonlar</p>
          <div className="bach-doc-ready-list">
            {readyList.map((t) => (
              <button
                key={t.id}
                type="button"
                className="bach-doc-ready-item"
                onClick={() => applyReady(t)}
              >
                <span>{t.name}</span>
                <button
                  type="button"
                  className="bach-doc-fav"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFavorites(toggleFavoriteTemplate(t.id))
                  }}
                  aria-label="Favori"
                >
                  <Star
                    className={`h-3.5 w-3.5 ${favorites.includes(t.id) ? 'fill-amber-400 text-amber-400' : ''}`}
                  />
                </button>
              </button>
            ))}
          </div>
          <p className="bach-doc-section-label">Favoriler</p>
          <div className="bach-doc-ready-list">
            {DOC_READY_TEMPLATES.filter((t) => favorites.includes(t.id)).map((t) => (
              <button
                key={`fav-${t.id}`}
                type="button"
                className="bach-doc-ready-item"
                onClick={() => applyReady(t)}
              >
                {t.name}
              </button>
            ))}
            {!favorites.length ? <p className="bach-doc-empty">Favori yok</p> : null}
          </div>
          <p className="bach-doc-section-label">Son Kullanılanlar</p>
          <div className="bach-doc-ready-list">
            {recents.map((r) => {
              const t = DOC_READY_TEMPLATES.find((x) => x.id === r.id)
              if (!t) return null
              return (
                <button
                  key={`r-${r.id}`}
                  type="button"
                  className="bach-doc-ready-item"
                  onClick={() => applyReady(t)}
                >
                  {r.name}
                </button>
              )
            })}
            {!recents.length ? <p className="bach-doc-empty">Henüz yok</p> : null}
          </div>
        </aside>

        <main className="bach-doc-canvas-wrap">
          <div className={`bach-doc-canvas-stage ${showRulers ? 'with-rulers' : ''}`}>
            {showRulers ? <div className="bach-doc-ruler-h" /> : null}
            {showRulers ? <div className="bach-doc-ruler-v" /> : null}
            <div className="bach-doc-canvas-scroll">
              <div
                style={{
                  width: page.widthPx * zoom + 48,
                  height: page.heightPx * zoom + 48,
                  padding: 24,
                }}
              >
                <div style={{ width: page.widthPx * zoom, height: page.heightPx * zoom }}>
                  <div
                    ref={canvasRef}
                    role="presentation"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDropElement}
                    onClick={() => setSelectedIds([])}
                    className="bach-doc-page"
                    style={{
                      width: page.widthPx,
                      height: page.heightPx,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      backgroundImage: showGrid
                        ? `linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)`
                        : 'none',
                      backgroundSize: showGrid ? `${SNAP_GRID}px ${SNAP_GRID}px` : undefined,
                    }}
                  >
                    <div
                      className="bach-doc-margin-guide"
                      style={{
                        inset: `${(margins.top / page.heightMm) * page.heightPx}px ${(margins.right / page.widthMm) * page.widthPx}px ${(margins.bottom / page.heightMm) * page.heightPx}px ${(margins.left / page.widthMm) * page.widthPx}px`,
                      }}
                    />
                    {guides.x != null ? (
                      <div className="bach-doc-smart-guide-v" style={{ left: guides.x }} />
                    ) : null}
                    {guides.y != null ? (
                      <div className="bach-doc-smart-guide-h" style={{ top: guides.y }} />
                    ) : null}
                    {blocks.map((block) => {
                      if (block.visible === false) return null
                      const isSelected = selectedIds.includes(block.id)
                      return (
                        <div
                          key={block.id}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedIds((ids) =>
                              e.shiftKey
                                ? ids.includes(block.id)
                                  ? ids
                                  : [...ids, block.id]
                                : [block.id],
                            )
                            setRightTab('props')
                          }}
                          onPointerDown={(e) => onCanvasDragStart(e, block, 'move')}
                          className={`bach-doc-block ${isSelected ? 'is-selected' : ''} ${block.locked ? 'is-locked' : ''}`}
                          style={{
                            left: block.x,
                            top: block.y,
                            width: block.w,
                            height: block.h,
                            zIndex: block.zIndex || 1,
                            opacity: block.opacity ?? 1,
                            transform: block.rotation ? `rotate(${block.rotation}deg)` : undefined,
                          }}
                        >
                          <BlockPreviewContent block={block} />
                          {isSelected ? (
                            <span
                              className="bach-doc-resize"
                              onPointerDown={(e) => onCanvasDragStart(e, block, 'resize')}
                            />
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <aside className="bach-doc-right">
          <div className="bach-doc-right-tabs">
            {[
              { id: 'components', label: 'Bileşenler' },
              { id: 'props', label: 'Özellikler' },
              { id: 'layers', label: 'Katmanlar' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={rightTab === tab.id ? 'is-active' : ''}
                onClick={() => setRightTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bach-doc-right-body">
            {rightTab === 'components' ? (
              <>
                <input
                  className="bach-doc-search"
                  placeholder="Bileşen ara…"
                  value={compFilter}
                  onChange={(e) => setCompFilter(e.target.value)}
                />
                {filteredLibrary.map((group) => (
                  <div key={group.id} className="bach-doc-comp-group">
                    <p>{group.label}</p>
                    <div className="bach-doc-comp-grid">
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
                          onClick={() => addBlock(item.type, null, item.label)}
                          className="bach-doc-comp-btn"
                        >
                          <ElementIcon name={item.icon} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="bach-doc-hint">Bileşeni eklemek için sürükleyip bırakın</p>
                <p className="bach-doc-section-label">Değişkenler</p>
                <div className="bach-doc-var-list">
                  {DOC_VARIABLE_GROUPS.slice(0, 4).flatMap((g) =>
                    g.variables.slice(0, 4).map((v) => (
                      <button
                        key={v.path}
                        type="button"
                        className="bach-doc-var-btn"
                        onClick={() => {
                          if (
                            selected &&
                            ['text', 'title', 'paragraph', 'variable', 'date'].includes(
                              selected.type,
                            )
                          ) {
                            updateSelectedProps({
                              text: `${selected.props?.text || ''}${variableToken(v.path)}`,
                              variablePath: v.path,
                            })
                            return
                          }
                          const maxZ = blocks.reduce((m, b) => Math.max(m, b.zIndex || 0), 0)
                          const block = createBlock('variable', {
                            x: snapValue(48 + (blocks.length % 5) * 12, snap),
                            y: snapValue(48 + (blocks.length % 7) * 16, snap),
                            zIndex: maxZ + 1,
                            label: v.label,
                            props: { text: variableToken(v.path), variablePath: v.path },
                          })
                          commitBlocks((prev) => [...prev, block])
                          setSelectedIds([block.id])
                          setRightTab('props')
                        }}
                      >
                        <span>{v.label}</span>
                        <code>{`{{${v.path}}}`}</code>
                      </button>
                    )),
                  )}
                </div>
              </>
            ) : null}

            {rightTab === 'props' ? (
              !selected ? (
                <p className="bach-doc-empty">Bir nesne seçin</p>
              ) : (
                <div className="bach-doc-props">
                  <div className="bach-doc-props-title">
                    {selected.label || getElementDef(selected.type)?.label}
                  </div>
                  <div className="bach-doc-props-2">
                    {['x', 'y', 'w', 'h'].map((key) => (
                      <label key={key}>
                        <span>{key.toUpperCase()}</span>
                        <input
                          type="number"
                          value={Math.round(selected[key])}
                          onChange={(e) =>
                            updateSelectedMeta({
                              [key]: Math.max(
                                key === 'w' || key === 'h' ? 8 : 0,
                                Number(e.target.value) || 0,
                              ),
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div className="bach-doc-props-2">
                    <label>
                      <span>Opacity</span>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={selected.opacity ?? 1}
                        onChange={(e) => updateSelectedMeta({ opacity: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      <span>Rotate</span>
                      <input
                        type="number"
                        value={selected.rotation || 0}
                        onChange={(e) =>
                          updateSelectedMeta({ rotation: Number(e.target.value) || 0 })
                        }
                      />
                    </label>
                  </div>
                  {[
                    'text',
                    'title',
                    'paragraph',
                    'variable',
                    'date',
                    'pageNumber',
                    'stamp',
                  ].includes(selected.type) ? (
                    <label>
                      <span>Metin</span>
                      <textarea
                        value={selected.props?.text || ''}
                        onChange={(e) => updateSelectedProps({ text: e.target.value })}
                      />
                    </label>
                  ) : null}
                  {['text', 'title', 'paragraph', 'variable', 'date'].includes(selected.type) ? (
                    <>
                      <div className="bach-doc-props-2">
                        <label>
                          <span>Font</span>
                          <input
                            type="number"
                            value={selected.props?.fontSize || 14}
                            onChange={(e) =>
                              updateSelectedProps({ fontSize: Number(e.target.value) || 14 })
                            }
                          />
                        </label>
                        <label>
                          <span>Renk</span>
                          <input
                            type="color"
                            value={selected.props?.color || '#111827'}
                            onChange={(e) => updateSelectedProps({ color: e.target.value })}
                          />
                        </label>
                      </div>
                      <div className="bach-doc-font-tools">
                        <button
                          type="button"
                          className={selected.props?.fontWeight >= 700 ? 'is-active' : ''}
                          onClick={() =>
                            updateSelectedProps({
                              fontWeight: selected.props?.fontWeight >= 700 ? 400 : 700,
                            })
                          }
                        >
                          B
                        </button>
                        <button
                          type="button"
                          className={selected.props?.italic ? 'is-active' : ''}
                          onClick={() => updateSelectedProps({ italic: !selected.props?.italic })}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          className={selected.props?.underline ? 'is-active' : ''}
                          onClick={() =>
                            updateSelectedProps({ underline: !selected.props?.underline })
                          }
                        >
                          U
                        </button>
                        <select
                          value={selected.props?.align || 'left'}
                          onChange={(e) => updateSelectedProps({ align: e.target.value })}
                        >
                          <option value="left">Sol</option>
                          <option value="center">Orta</option>
                          <option value="right">Sağ</option>
                        </select>
                      </div>
                      <label>
                        <span>Dinamik alan</span>
                        <input
                          value={selected.props?.variablePath || ''}
                          onChange={(e) => {
                            const path = e.target.value
                            updateSelectedProps({
                              variablePath: path,
                              text: path ? variableToken(path) : selected.props?.text,
                            })
                          }}
                          placeholder="firma_unvani"
                        />
                      </label>
                      <label className="bach-doc-check">
                        <input
                          type="checkbox"
                          checked={Boolean(selected.props?.conditional)}
                          onChange={(e) => updateSelectedProps({ conditional: e.target.checked })}
                        />
                        Koşullu görünüm
                      </label>
                    </>
                  ) : null}
                  {selected.type === 'table' ? (
                    <div className="bach-doc-table-cols">
                      <span className="bach-doc-section-label">Tablo kolonları</span>
                      {(selected.props?.columns || []).map((col, idx) => (
                        <div key={col.key} className="bach-doc-table-col-row">
                          <GripVertical className="h-3.5 w-3.5 opacity-40" />
                          <input
                            value={col.label}
                            onChange={(e) => {
                              const columns = [...(selected.props.columns || [])]
                              columns[idx] = { ...columns[idx], label: e.target.value }
                              updateSelectedProps({ columns })
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const columns = (selected.props.columns || []).filter(
                                (_, i) => i !== idx,
                              )
                              updateSelectedProps({ columns })
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const found = TABLE_COLUMN_CATALOG.find((c) => c.key === e.target.value)
                          if (!found) return
                          const columns = [
                            ...(selected.props?.columns || []),
                            { ...found, width: '12%' },
                          ]
                          updateSelectedProps({ columns })
                          e.target.value = ''
                        }}
                      >
                        <option value="">+ Kolon ekle</option>
                        {TABLE_COLUMN_CATALOG.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  {['rect', 'circle'].includes(selected.type) ? (
                    <label>
                      <span>Arkaplan</span>
                      <input
                        type="color"
                        value={selected.props?.fill || '#e5e7eb'}
                        onChange={(e) => updateSelectedProps({ fill: e.target.value })}
                      />
                    </label>
                  ) : null}
                  <div className="bach-doc-props-actions">
                    <button
                      type="button"
                      onClick={() => updateSelectedMeta({ locked: !selected.locked })}
                    >
                      {selected.locked ? (
                        <Unlock className="h-3.5 w-3.5" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}{' '}
                      {selected.locked ? 'Kilidi Aç' : 'Kilitle'}
                    </button>
                    <button type="button" onClick={() => updateSelectedMeta({ visible: false })}>
                      <EyeOff className="h-3.5 w-3.5" /> Gizle
                    </button>
                    <button type="button" onClick={bringForward}>
                      Öne Al
                    </button>
                    <button type="button" onClick={sendBackward}>
                      Arkaya
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        commitBlocks((prev) => prev.filter((b) => b.id !== selected.id))
                        setSelectedIds([])
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              )
            ) : null}

            {rightTab === 'layers' ? (
              <div className="bach-doc-layers">
                {[...blocks]
                  .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
                  .map((block) => (
                    <button
                      key={block.id}
                      type="button"
                      className={`bach-doc-layer-item ${selectedIds.includes(block.id) ? 'is-active' : ''}`}
                      onClick={() => {
                        setSelectedIds([block.id])
                        setRightTab('props')
                      }}
                    >
                      <Layers className="h-3.5 w-3.5 opacity-50" />
                      <span>{block.label || getElementDef(block.type)?.label || block.type}</span>
                      <span className="ml-auto flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            commitBlocks((prev) =>
                              prev.map((b) =>
                                b.id === block.id ? { ...b, visible: b.visible === false } : b,
                              ),
                            )
                          }}
                        >
                          {block.visible === false ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            commitBlocks((prev) =>
                              prev.map((b) =>
                                b.id === block.id ? { ...b, locked: !b.locked } : b,
                              ),
                            )
                          }}
                        >
                          {block.locked ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Unlock className="h-3 w-3" />
                          )}
                        </button>
                      </span>
                    </button>
                  ))}
                {!blocks.length ? <p className="bach-doc-empty">Katman yok</p> : null}
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {previewOpen ? (
        <div className="bach-doc-preview-modal" role="dialog">
          <div className="bach-doc-preview-panel">
            <div className="bach-doc-preview-bar">
              <strong>Önizleme · örnek veri</strong>
              <div className="flex gap-2">
                <button type="button" className="bach-doc-btn ghost" onClick={handlePdf}>
                  PDF
                </button>
                <button type="button" className="bach-doc-btn ghost" onClick={handleTestPrint}>
                  Yazdır
                </button>
                <button
                  type="button"
                  className={`${BTN_PRIMARY} !rounded-xl !px-3 !py-2 text-xs`}
                  onClick={() => setPreviewOpen(false)}
                >
                  Kapat
                </button>
              </div>
            </div>
            <iframe
              title="Önizleme"
              className="bach-doc-preview-frame"
              srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;background:#e2e8f0;padding:24px">${previewHtml}</body></html>`}
            />
          </div>
        </div>
      ) : null}
    </div>
  )

  return createPortal(ui, document.body)
}

export { DOCUMENT_CENTER_BASE }
