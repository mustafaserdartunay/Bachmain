import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  LayoutDashboard,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react'
import InlineDeleteConfirm from '../Common/InlineDeleteConfirm'
import { buildFinanceMetricCards } from '../Dashboard/StatusAnalysisBoard'
import { stageColors } from '../DocumentEditor/stageColors'
import {
  DASHBOARD_FINANCE_CARDS_EVENT,
  DEFAULT_DASHBOARD_FINANCE_CARDS,
  loadDashboardFinanceCards,
  publishDashboardFinanceCards,
} from '../../utils/dashboardFinanceCards'
import {
  createCustomBlock,
  createQuickActionConfig,
  CUSTOM_BLOCK_TYPES,
  DASHBOARD_LAYOUT_EVENT,
  getDefaultDashboardLayout,
  loadDashboardLayout,
  publishDashboardLayout,
  QUICK_ACTION_ICON_OPTIONS,
  QUICK_ACTION_TONES,
} from '../../utils/dashboardLayoutStore'

const TONE_OPTIONS = Object.keys(QUICK_ACTION_TONES)

function createFinanceId() {
  return `dashboard-finance-card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function EditableRow({
  title,
  subtitle,
  visible = true,
  onToggleVisible,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onEdit,
  onRemove,
  pendingDelete,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  children,
}) {
  return (
    <article className={`rounded-2xl border p-3 transition-colors ${visible ? 'border-dark-500/50 bg-dark-800/60' : 'border-dashed border-dark-500/40 bg-dark-700/25 opacity-70'}`}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">{title}</p>
          {subtitle ? <p className="mt-0.5 text-xs font-semibold text-gray-500">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {onToggleVisible ? (
            <button type="button" onClick={onToggleVisible} className="rounded-lg border border-dark-500/50 p-1.5 text-gray-400 hover:text-white" title={visible ? 'Gizle' : 'Göster'}>
              {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          ) : null}
          {onMoveUp ? (
            <button type="button" onClick={onMoveUp} disabled={!canMoveUp} className="rounded-lg border border-dark-500/50 p-1.5 text-gray-400 hover:text-white disabled:opacity-30">
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {onMoveDown ? (
            <button type="button" onClick={onMoveDown} disabled={!canMoveDown} className="rounded-lg border border-dark-500/50 p-1.5 text-gray-400 hover:text-white disabled:opacity-30">
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {onEdit ? (
            <button type="button" onClick={onEdit} className="rounded-lg border border-dark-500/50 p-1.5 text-blue-300 hover:bg-blue-500/10">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {onRemove ? (
            pendingDelete ? (
              <InlineDeleteConfirm onConfirm={onConfirmDelete} onCancel={onCancelDelete} />
            ) : (
              <button type="button" onClick={onRequestDelete} className="rounded-lg border border-red-500/30 p-1.5 text-red-300 hover:bg-red-500/10">
                <X className="h-3.5 w-3.5" />
              </button>
            )
          ) : null}
        </div>
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </article>
  )
}

export default function DashboardLayoutSettingsPanel() {
  const [layout, setLayout] = useState(() => loadDashboardLayout())
  const [financeCards, setFinanceCards] = useState(() => loadDashboardFinanceCards())
  const [editingSectionId, setEditingSectionId] = useState(null)
  const [editingQuickActionId, setEditingQuickActionId] = useState(null)
  const [editingBlockId, setEditingBlockId] = useState(null)
  const [editingFinanceId, setEditingFinanceId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const financeMetricCards = useMemo(() => buildFinanceMetricCards({ includeHidden: true }), [financeCards])

  useEffect(() => {
    function refreshLayout() {
      setLayout(loadDashboardLayout())
    }
    function refreshFinance() {
      setFinanceCards(loadDashboardFinanceCards())
    }
    window.addEventListener(DASHBOARD_LAYOUT_EVENT, refreshLayout)
    window.addEventListener(DASHBOARD_FINANCE_CARDS_EVENT, refreshFinance)
    return () => {
      window.removeEventListener(DASHBOARD_LAYOUT_EVENT, refreshLayout)
      window.removeEventListener(DASHBOARD_FINANCE_CARDS_EVENT, refreshFinance)
    }
  }, [])

  function persistLayout(nextLayout) {
    setLayout(publishDashboardLayout(nextLayout))
  }

  function persistFinanceCards(nextCards) {
    setFinanceCards(publishDashboardFinanceCards(nextCards))
  }

  function moveItem(list, index, direction) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= list.length) return list
    const next = [...list]
    const [item] = next.splice(index, 1)
    next.splice(nextIndex, 0, item)
    return next
  }

  function resetDefaults() {
    persistLayout(getDefaultDashboardLayout())
    persistFinanceCards(DEFAULT_DASHBOARD_FINANCE_CARDS.map((card) => ({ ...card })))
    setEditingSectionId(null)
    setEditingQuickActionId(null)
    setEditingBlockId(null)
    setEditingFinanceId(null)
    setPendingDelete(null)
  }

  return (
    <div className="space-y-5">
      <section className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">Panel Bölümleri</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Ana sayfadaki bölümlerin görünürlüğünü, sırasını ve başlıklarını yönetin.</p>
          </div>
          <button type="button" onClick={resetDefaults} className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black text-gray-300 hover:text-white">
            <RotateCcw className="h-3.5 w-3.5" />
            Varsayılana Dön
          </button>
        </div>

        <div className="space-y-2">
          {layout.sections.map((section, index) => (
            <EditableRow
              key={section.id}
              title={section.label}
              subtitle={section.id}
              visible={section.visible !== false}
              onToggleVisible={() => persistLayout({
                ...layout,
                sections: layout.sections.map((item) => (
                  item.id === section.id ? { ...item, visible: item.visible === false } : item
                )),
              })}
              onMoveUp={() => persistLayout({ ...layout, sections: moveItem(layout.sections, index, -1) })}
              onMoveDown={() => persistLayout({ ...layout, sections: moveItem(layout.sections, index, 1) })}
              canMoveUp={index > 0}
              canMoveDown={index < layout.sections.length - 1}
              onEdit={() => setEditingSectionId((current) => (current === section.id ? null : section.id))}
            >
              {editingSectionId === section.id ? (
                <input
                  value={section.label}
                  onChange={(event) => persistLayout({
                    ...layout,
                    sections: layout.sections.map((item) => (
                      item.id === section.id ? { ...item, label: event.target.value } : item
                    )),
                  })}
                  className="form-input"
                />
              ) : null}
            </EditableRow>
          ))}
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">Finans Kartları</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Finans özeti şeridindeki kartları düzenleyin, gizleyin veya yeni kart ekleyin.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextCard = {
                id: createFinanceId(),
                label: 'Yeni Finans Kartı',
                color: stageColors[financeCards.length % stageColors.length],
                visible: true,
              }
              persistFinanceCards([...financeCards, nextCard])
              setEditingFinanceId(nextCard.id)
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-300 hover:bg-blue-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Kart Ekle
          </button>
        </div>

        <div className="space-y-2">
          {financeCards.map((card, index) => {
            const metric = financeMetricCards.find((item) => item.id === card.id)
            return (
              <EditableRow
                key={card.id}
                title={card.label}
                subtitle={metric ? `${metric.value} · ${metric.sub || 'Finans kartı'}` : 'Özel finans kartı'}
                visible={card.visible !== false}
                onToggleVisible={() => persistFinanceCards(financeCards.map((item) => (
                  item.id === card.id ? { ...item, visible: item.visible === false } : item
                )))}
                onMoveUp={() => persistFinanceCards(moveItem(financeCards, index, -1))}
                onMoveDown={() => persistFinanceCards(moveItem(financeCards, index, 1))}
                canMoveUp={index > 0}
                canMoveDown={index < financeCards.length - 1}
                onEdit={() => setEditingFinanceId((current) => (current === card.id ? null : card.id))}
                onRemove={() => persistFinanceCards(financeCards.filter((item) => item.id !== card.id))}
                pendingDelete={pendingDelete === `finance-${card.id}`}
                onRequestDelete={() => setPendingDelete(`finance-${card.id}`)}
                onCancelDelete={() => setPendingDelete(null)}
                onConfirmDelete={() => {
                  persistFinanceCards(financeCards.filter((item) => item.id !== card.id))
                  setPendingDelete(null)
                  if (editingFinanceId === card.id) setEditingFinanceId(null)
                }}
              >
                {editingFinanceId === card.id ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={card.label}
                      onChange={(event) => persistFinanceCards(financeCards.map((item) => (
                        item.id === card.id ? { ...item, label: event.target.value } : item
                      )))}
                      className="form-input"
                      placeholder="Kart başlığı"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {stageColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => persistFinanceCards(financeCards.map((item) => (
                            item.id === card.id ? { ...item, color } : item
                          )))}
                          className={`h-6 w-6 rounded-full border-2 ${color} ${card.color === color ? 'border-white' : 'border-transparent opacity-70'}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </EditableRow>
            )
          })}
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">Hızlı İşlem Kartları</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Hızlı erişim kartlarını düzenleyin, gizleyin veya özel kart ekleyin.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextAction = createQuickActionConfig({ label: 'Yeni Hızlı Kart' })
              persistLayout({ ...layout, quickActions: [...layout.quickActions, nextAction] })
              setEditingQuickActionId(nextAction.id)
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-300 hover:bg-blue-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Kart Ekle
          </button>
        </div>

        <div className="space-y-2">
          {layout.quickActions.map((action, index) => (
            <EditableRow
              key={action.id}
              title={action.label}
              subtitle={`${action.href}${action.isCustom ? ' · Özel' : ''}`}
              visible={action.visible !== false}
              onToggleVisible={() => persistLayout({
                ...layout,
                quickActions: layout.quickActions.map((item) => (
                  item.id === action.id ? { ...item, visible: item.visible === false } : item
                )),
              })}
              onMoveUp={() => persistLayout({ ...layout, quickActions: moveItem(layout.quickActions, index, -1) })}
              onMoveDown={() => persistLayout({ ...layout, quickActions: moveItem(layout.quickActions, index, 1) })}
              canMoveUp={index > 0}
              canMoveDown={index < layout.quickActions.length - 1}
              onEdit={() => setEditingQuickActionId((current) => (current === action.id ? null : action.id))}
              onRemove={action.isCustom ? () => persistLayout({
                ...layout,
                quickActions: layout.quickActions.filter((item) => item.id !== action.id),
              }) : null}
              pendingDelete={pendingDelete === `quick-${action.id}`}
              onRequestDelete={action.isCustom ? () => setPendingDelete(`quick-${action.id}`) : undefined}
              onCancelDelete={() => setPendingDelete(null)}
              onConfirmDelete={() => {
                persistLayout({
                  ...layout,
                  quickActions: layout.quickActions.filter((item) => item.id !== action.id),
                })
                setPendingDelete(null)
                if (editingQuickActionId === action.id) setEditingQuickActionId(null)
              }}
            >
              {editingQuickActionId === action.id ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={action.label}
                    onChange={(event) => persistLayout({
                      ...layout,
                      quickActions: layout.quickActions.map((item) => (
                        item.id === action.id ? { ...item, label: event.target.value } : item
                      )),
                    })}
                    className="form-input"
                    placeholder="Başlık"
                  />
                  <input
                    value={action.href}
                    onChange={(event) => persistLayout({
                      ...layout,
                      quickActions: layout.quickActions.map((item) => (
                        item.id === action.id ? { ...item, href: event.target.value } : item
                      )),
                    })}
                    className="form-input"
                    placeholder="Bağlantı"
                  />
                  <input
                    value={action.createHref}
                    onChange={(event) => persistLayout({
                      ...layout,
                      quickActions: layout.quickActions.map((item) => (
                        item.id === action.id ? { ...item, createHref: event.target.value } : item
                      )),
                    })}
                    className="form-input"
                    placeholder="Yeni oluştur bağlantısı"
                  />
                  <select
                    value={action.icon}
                    onChange={(event) => persistLayout({
                      ...layout,
                      quickActions: layout.quickActions.map((item) => (
                        item.id === action.id ? { ...item, icon: event.target.value } : item
                      )),
                    })}
                    className="form-input"
                  >
                    {QUICK_ACTION_ICON_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    value={action.tone}
                    onChange={(event) => persistLayout({
                      ...layout,
                      quickActions: layout.quickActions.map((item) => (
                        item.id === action.id ? { ...item, tone: event.target.value } : item
                      )),
                    })}
                    className="form-input"
                  >
                    {TONE_OPTIONS.map((tone) => (
                      <option key={tone} value={tone}>{tone}</option>
                    ))}
                  </select>
                </div>
              ) : null}
            </EditableRow>
          ))}
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">Dinamik Bloklar</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Ana sayfaya bağlantı kartı veya bilgi notu ekleyin.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CUSTOM_BLOCK_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  const nextBlock = createCustomBlock({
                    type: type.id,
                    title: type.id === 'note' ? 'Yeni Bilgi Notu' : 'Yeni Bağlantı',
                  })
                  persistLayout({ ...layout, customBlocks: [...layout.customBlocks, nextBlock] })
                  setEditingBlockId(nextBlock.id)
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-300 hover:bg-blue-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {layout.customBlocks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-dark-500/45 bg-dark-700/25 p-4 text-center text-xs font-semibold text-gray-500">
            Henüz dinamik blok eklenmedi.
          </p>
        ) : (
          <div className="space-y-2">
            {layout.customBlocks.map((block, index) => (
              <EditableRow
                key={block.id}
                title={block.title}
                subtitle={block.type === 'note' ? 'Bilgi notu' : block.href}
                visible={block.visible !== false}
                onToggleVisible={() => persistLayout({
                  ...layout,
                  customBlocks: layout.customBlocks.map((item) => (
                    item.id === block.id ? { ...item, visible: item.visible === false } : item
                  )),
                })}
                onMoveUp={() => persistLayout({ ...layout, customBlocks: moveItem(layout.customBlocks, index, -1) })}
                onMoveDown={() => persistLayout({ ...layout, customBlocks: moveItem(layout.customBlocks, index, 1) })}
                canMoveUp={index > 0}
                canMoveDown={index < layout.customBlocks.length - 1}
                onEdit={() => setEditingBlockId((current) => (current === block.id ? null : block.id))}
                onRemove={() => persistLayout({
                  ...layout,
                  customBlocks: layout.customBlocks.filter((item) => item.id !== block.id),
                })}
                pendingDelete={pendingDelete === `block-${block.id}`}
                onRequestDelete={() => setPendingDelete(`block-${block.id}`)}
                onCancelDelete={() => setPendingDelete(null)}
                onConfirmDelete={() => {
                  persistLayout({
                    ...layout,
                    customBlocks: layout.customBlocks.filter((item) => item.id !== block.id),
                  })
                  setPendingDelete(null)
                  if (editingBlockId === block.id) setEditingBlockId(null)
                }}
              >
                {editingBlockId === block.id ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={block.title}
                      onChange={(event) => persistLayout({
                        ...layout,
                        customBlocks: layout.customBlocks.map((item) => (
                          item.id === block.id ? { ...item, title: event.target.value } : item
                        )),
                      })}
                      className="form-input"
                      placeholder="Başlık"
                    />
                    <input
                      value={block.subtitle}
                      onChange={(event) => persistLayout({
                        ...layout,
                        customBlocks: layout.customBlocks.map((item) => (
                          item.id === block.id ? { ...item, subtitle: event.target.value } : item
                        )),
                      })}
                      className="form-input"
                      placeholder="Alt başlık"
                    />
                    {block.type === 'link' ? (
                      <input
                        value={block.href}
                        onChange={(event) => persistLayout({
                          ...layout,
                          customBlocks: layout.customBlocks.map((item) => (
                            item.id === block.id ? { ...item, href: event.target.value } : item
                          )),
                        })}
                        className="form-input sm:col-span-2"
                        placeholder="Bağlantı (/modul/yol)"
                      />
                    ) : (
                      <textarea
                        value={block.content}
                        onChange={(event) => persistLayout({
                          ...layout,
                          customBlocks: layout.customBlocks.map((item) => (
                            item.id === block.id ? { ...item, content: event.target.value } : item
                          )),
                        })}
                        className="form-input min-h-[88px] sm:col-span-2"
                        placeholder="Not içeriği"
                      />
                    )}
                  </div>
                ) : null}
              </EditableRow>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
