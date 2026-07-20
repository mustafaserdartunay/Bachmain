import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  SelectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowLeft,
  Copy,
  ClipboardPaste,
  Play,
  Redo2,
  Save,
  Undo2,
  Upload,
  History,
} from 'lucide-react'
import {
  NODE_CATALOG,
  NODE_CATEGORIES,
  WORKFLOW_TEMPLATES,
  categoryColor,
  catalogById,
} from '../workflow/catalog'
import {
  createLocalWorkflow,
  getLocalGraph,
  getLocalWorkflow,
  listLocalRuns,
  publishLocalWorkflow,
  rollbackLocalWorkflow,
  saveLocalVersion,
  saveLocalWorkflow,
  simulateLocalWorkflow,
} from '../workflow/localStore'

function BachNode({ data, selected }) {
  const color = categoryColor(data.category)
  return (
    <div
      className={`min-w-[160px] max-w-[220px] rounded-xl border-2 bg-dark-800/95 px-3 py-2 shadow-lg ${
        selected ? 'ring-2 ring-white/40' : ''
      }`}
      style={{ borderColor: color }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !bg-gray-400 !border-dark-700"
      />
      <div className="text-[10px] font-black uppercase tracking-wider" style={{ color }}>
        {data.category}
      </div>
      <div className="mt-0.5 text-sm font-bold text-white leading-snug">{data.label}</div>
      <div className="mt-1 truncate text-[10px] text-gray-500">{data.catalogId}</div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !bg-gray-400 !border-dark-700"
      />
    </div>
  )
}

const nodeTypes = { bach: memo(BachNode) }

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function DesignerCanvas({ initialNodes, initialEdges, onGraphChange, historyRef }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { fitView, getNodes, getEdges } = useReactFlow()
  const clipboard = useRef(null)
  const skipPush = useRef(false)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
    skipPush.current = true
    requestAnimationFrame(() => fitView({ padding: 0.2 }))
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView])

  const pushHistory = useCallback(() => {
    if (skipPush.current) {
      skipPush.current = false
      return
    }
    const h = historyRef.current
    h.past.push({ nodes: structuredClone(getNodes()), edges: structuredClone(getEdges()) })
    if (h.past.length > 50) h.past.shift()
    h.future = []
  }, [getNodes, getEdges, historyRef])

  useEffect(() => {
    onGraphChange?.({ nodes, edges })
  }, [nodes, edges, onGraphChange])

  const onConnect = useCallback(
    (connection) => {
      pushHistory()
      setEdges((eds) => addEdge({ ...connection, id: uid('e'), animated: false }, eds))
    },
    [setEdges, pushHistory],
  )

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData('application/bach-node')
      if (!raw) return
      const item = JSON.parse(raw)
      const bounds = e.currentTarget.getBoundingClientRect()
      const position = {
        x: e.clientX - bounds.left - 80,
        y: e.clientY - bounds.top - 24,
      }
      pushHistory()
      setNodes((nds) => [
        ...nds,
        {
          id: uid('n'),
          type: 'bach',
          position,
          data: {
            catalogId: item.id,
            category: item.category,
            label: item.label,
          },
        },
      ])
    },
    [setNodes, pushHistory],
  )

  useEffect(() => {
    function onKey(e) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        const h = historyRef.current
        if (!h.past.length) return
        h.future.push({ nodes: structuredClone(getNodes()), edges: structuredClone(getEdges()) })
        const prev = h.past.pop()
        skipPush.current = true
        setNodes(prev.nodes)
        setEdges(prev.edges)
      }
      if (meta && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        const h = historyRef.current
        if (!h.future.length) return
        h.past.push({ nodes: structuredClone(getNodes()), edges: structuredClone(getEdges()) })
        const next = h.future.pop()
        skipPush.current = true
        setNodes(next.nodes)
        setEdges(next.edges)
      }
      if (meta && e.key.toLowerCase() === 'c') {
        const selected = getNodes().filter((n) => n.selected)
        if (!selected.length) return
        const ids = new Set(selected.map((n) => n.id))
        clipboard.current = {
          nodes: selected,
          edges: getEdges().filter((ed) => ids.has(ed.source) && ids.has(ed.target)),
        }
      }
      if (meta && e.key.toLowerCase() === 'v' && clipboard.current?.nodes?.length) {
        e.preventDefault()
        pushHistory()
        const map = new Map()
        const pastedNodes = clipboard.current.nodes.map((n) => {
          const id = uid('n')
          map.set(n.id, id)
          return {
            ...n,
            id,
            position: { x: n.position.x + 40, y: n.position.y + 40 },
            selected: true,
          }
        })
        const pastedEdges = clipboard.current.edges.map((ed) => ({
          ...ed,
          id: uid('e'),
          source: map.get(ed.source),
          target: map.get(ed.target),
        }))
        setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...pastedNodes])
        setEdges((eds) => [...eds, ...pastedEdges])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [getNodes, getEdges, setNodes, setEdges, pushHistory, historyRef])

  // expose undo/redo buttons via custom events
  useEffect(() => {
    function undo() {
      const h = historyRef.current
      if (!h.past.length) return
      h.future.push({ nodes: structuredClone(getNodes()), edges: structuredClone(getEdges()) })
      const prev = h.past.pop()
      skipPush.current = true
      setNodes(prev.nodes)
      setEdges(prev.edges)
    }
    function redo() {
      const h = historyRef.current
      if (!h.future.length) return
      h.past.push({ nodes: structuredClone(getNodes()), edges: structuredClone(getEdges()) })
      const next = h.future.pop()
      skipPush.current = true
      setNodes(next.nodes)
      setEdges(next.edges)
    }
    window.addEventListener('bach:wf-undo', undo)
    window.addEventListener('bach:wf-redo', redo)
    return () => {
      window.removeEventListener('bach:wf-undo', undo)
      window.removeEventListener('bach:wf-redo', redo)
    }
  }, [getNodes, getEdges, setNodes, setEdges, historyRef])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={(c) => {
        const meaningful = c.some(
          (x) => x.type === 'remove' || (x.type === 'position' && x.dragging === false),
        )
        if (meaningful) pushHistory()
        onNodesChange(c)
      }}
      onEdgesChange={(c) => {
        if (c.some((x) => x.type === 'remove')) pushHistory()
        onEdgesChange(c)
      }}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      nodeTypes={nodeTypes}
      fitView
      snapToGrid
      snapGrid={[16, 16]}
      selectionMode={SelectionMode.Partial}
      multiSelectionKeyCode="Shift"
      panOnScroll
      selectionOnDrag
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      className="bg-[#0b1220]"
    >
      <Background gap={16} size={1} color="#1e293b" />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) => categoryColor(n.data?.category)}
        maskColor="rgba(2,6,23,0.7)"
        className="!bg-dark-900/90 !border-dark-500/50"
      />
    </ReactFlow>
  )
}

function WorkflowDesignerInner() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const templateId = search.get('template')
  const [workflow, setWorkflow] = useState(null)
  const [name, setName] = useState('Yeni Workflow')
  const [activeCategory, setActiveCategory] = useState('trigger')
  const [graph, setGraph] = useState({ nodes: [], edges: [] })
  const [bootKey, setBootKey] = useState(0)
  const [runs, setRuns] = useState([])
  const [message, setMessage] = useState('')
  const [showVersions, setShowVersions] = useState(false)
  const historyRef = useRef({ past: [], future: [] })
  const graphRef = useRef(graph)

  useEffect(() => {
    graphRef.current = graph
  }, [graph])

  useEffect(() => {
    let row = id ? getLocalWorkflow(id) : null
    if (!row && templateId) {
      const tpl = WORKFLOW_TEMPLATES.find((t) => t.id === templateId)
      if (tpl) {
        row = createLocalWorkflow({
          name: tpl.name,
          description: tpl.description,
          graph: structuredClone(tpl.graph),
          templateId: tpl.id,
        })
        navigate(`/otomasyon/designer/${row.id}`, { replace: true })
        return
      }
    }
    if (!row && !id) {
      row = createLocalWorkflow({ name: 'Yeni Workflow' })
      navigate(`/otomasyon/designer/${row.id}`, { replace: true })
      return
    }
    if (!row) return
    setWorkflow(row)
    setName(row.name)
    const g = getLocalGraph(row.id, row.currentVersion)
    const enriched = {
      nodes: (g.nodes || []).map((n) => {
        const cat = catalogById(n.data?.catalogId)
        return {
          ...n,
          type: 'bach',
          data: {
            ...n.data,
            label: n.data?.label || cat?.label || n.data?.catalogId,
            category: n.data?.category || cat?.category || 'system',
          },
        }
      }),
      edges: g.edges || [],
    }
    setGraph(enriched)
    setBootKey((k) => k + 1)
    setRuns(listLocalRuns(row.id))
  }, [id, templateId, navigate])

  const palette = useMemo(
    () => NODE_CATALOG.filter((n) => n.category === activeCategory),
    [activeCategory],
  )

  const onGraphChange = useCallback((g) => {
    setGraph(g)
  }, [])

  function flash(text) {
    setMessage(text)
    setTimeout(() => setMessage(''), 2200)
  }

  function handleSave() {
    if (!workflow) return
    const updated = saveLocalVersion(workflow.id, graphRef.current, 'Designer save')
    const withName = saveLocalWorkflow({ ...updated, name })
    setWorkflow(withName)
    flash(`Kaydedildi · v${withName.currentVersion}`)
  }

  function handlePublish() {
    if (!workflow) return
    const saved = saveLocalVersion(workflow.id, graphRef.current, 'Publish')
    const pub = publishLocalWorkflow(saved.id, saved.currentVersion)
    setWorkflow(pub)
    flash(`Yayınlandı · v${pub.publishedVersion}`)
  }

  function handleSimulate() {
    if (!workflow) return
    saveLocalVersion(workflow.id, graphRef.current, 'Pre-simulate')
    const run = simulateLocalWorkflow(workflow.id, {
      payload: { test: true, at: new Date().toISOString() },
    })
    setRuns(listLocalRuns(workflow.id))
    flash(`Simülasyon tamam · ${run?.steps?.length || 0} node`)
  }

  function handleRollback(version) {
    if (!workflow) return
    const row = rollbackLocalWorkflow(workflow.id, version)
    setWorkflow(row)
    const g = getLocalGraph(row.id, version)
    setGraph(g)
    setBootKey((k) => k + 1)
    flash(`Rollback → v${version}`)
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#070b14] text-white">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-dark-500/50 bg-dark-900/95 px-3">
        <Link
          to="/otomasyon"
          className="inline-flex items-center gap-1.5 rounded-lg border border-dark-500/50 px-2.5 py-1.5 text-xs font-bold text-gray-300 hover:bg-dark-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Hub
        </Link>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-dark-500/40 bg-dark-800 px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-blue-400/50"
        />
        <span className="hidden text-[11px] font-semibold text-gray-500 sm:inline">
          {workflow ? `v${workflow.currentVersion || 1}` : ''}
          {workflow?.publishedVersion ? ` · yayında v${workflow.publishedVersion}` : ' · taslak'}
        </span>
        <button
          type="button"
          title="Undo"
          onClick={() => window.dispatchEvent(new Event('bach:wf-undo'))}
          className="rounded-lg border border-dark-500/50 p-2 text-gray-300 hover:bg-dark-700"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Redo"
          onClick={() => window.dispatchEvent(new Event('bach:wf-redo'))}
          className="rounded-lg border border-dark-500/50 p-2 text-gray-300 hover:bg-dark-700"
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowVersions((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dark-500/50 px-2.5 py-1.5 text-xs font-bold text-gray-300 hover:bg-dark-700"
        >
          <History className="h-3.5 w-3.5" />
          Sürümler
        </button>
        <button
          type="button"
          onClick={handleSimulate}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
        >
          <Play className="h-3.5 w-3.5" />
          Test
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dark-500/50 px-2.5 py-1.5 text-xs font-bold text-gray-200 hover:bg-dark-700"
        >
          <Save className="h-3.5 w-3.5" />
          Kaydet
        </button>
        <button
          type="button"
          onClick={handlePublish}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
        >
          <Upload className="h-3.5 w-3.5" />
          Yayınla
        </button>
      </header>

      {message ? (
        <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full border border-dark-500/50 bg-dark-800 px-4 py-1.5 text-xs font-bold text-blue-200 shadow-lg">
          {message}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col border-r border-dark-500/50 bg-dark-900/80">
          <div className="border-b border-dark-500/40 p-2">
            <div className="flex flex-wrap gap-1">
              {NODE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                    activeCategory === c.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                  style={
                    activeCategory === c.id
                      ? { backgroundColor: `${c.color}33`, color: c.color }
                      : undefined
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold text-gray-500">
              <Copy className="h-3 w-3" />
              Sürükle · ⌘C/⌘V · Shift çoklu seçim
            </p>
            {palette.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/bach-node', JSON.stringify(item))
                  e.dataTransfer.effectAllowed = 'move'
                }}
                className="cursor-grab rounded-lg border border-dark-500/40 bg-dark-800/80 px-2.5 py-2 active:cursor-grabbing"
                style={{ borderLeftWidth: 3, borderLeftColor: categoryColor(item.category) }}
              >
                <div className="text-xs font-bold text-gray-100">{item.label}</div>
                <div className="truncate text-[10px] text-gray-500">{item.id}</div>
              </div>
            ))}
          </div>
        </aside>

        <div className="relative min-w-0 flex-1">
          <DesignerCanvas
            key={bootKey}
            initialNodes={graph.nodes}
            initialEdges={graph.edges}
            onGraphChange={onGraphChange}
            historyRef={historyRef}
          />
        </div>

        <aside className="flex w-72 shrink-0 flex-col border-l border-dark-500/50 bg-dark-900/80">
          <div className="border-b border-dark-500/40 px-3 py-2 text-xs font-black uppercase tracking-wide text-gray-400">
            Execution Log
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-2">
            {runs.length === 0 ? (
              <p className="px-1 text-xs text-gray-500">
                Henüz çalıştırma yok. Test ile simüle edin.
              </p>
            ) : (
              runs.slice(0, 20).map((run) => (
                <div
                  key={run.id}
                  className="rounded-lg border border-dark-500/40 bg-dark-800/70 p-2"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-emerald-300">{run.status}</span>
                    <span className="text-gray-500">{run.mode}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-gray-400">
                    v{run.version} · {run.durationMs}ms · {run.steps?.length || 0} node
                  </div>
                  <ul className="mt-1 max-h-24 space-y-0.5 overflow-y-auto">
                    {(run.steps || []).map((s) => (
                      <li key={s.nodeId} className="truncate text-[10px] text-gray-500">
                        {s.status} · {s.catalogId || s.nodeId}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-dark-500/40 p-2 text-[10px] text-gray-500">
            <ClipboardPaste className="mr-1 inline h-3 w-3" />
            Grid · Snap · MiniMap · Zoom aktif
          </div>
        </aside>
      </div>

      {showVersions && workflow ? (
        <div className="absolute right-4 top-16 z-20 w-64 rounded-xl border border-dark-500/50 bg-dark-900 p-3 shadow-2xl">
          <div className="mb-2 text-xs font-black uppercase text-gray-400">Sürümler</div>
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {[...(workflow.versions || [])].reverse().map((v) => (
              <li
                key={v.version}
                className="flex items-center justify-between gap-2 rounded-lg bg-dark-800/80 px-2 py-1.5"
              >
                <div>
                  <div className="text-xs font-bold text-white">v{v.version}</div>
                  <div className="text-[10px] text-gray-500">{v.changelog}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRollback(v.version)}
                  className="text-[10px] font-bold text-blue-300 hover:underline"
                >
                  Rollback
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export default function WorkflowDesignerPage() {
  return (
    <ReactFlowProvider>
      <WorkflowDesignerInner />
    </ReactFlowProvider>
  )
}
