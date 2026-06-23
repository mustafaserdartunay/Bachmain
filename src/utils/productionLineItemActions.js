import {
  createQuantityRow,
  createQuantityRowTimestamp,
  deriveJobSummary,
  deriveLineCurrentStageId,
  ensureLineItems,
  getLineQuantityRows,
  syncLineQuantitiesFromRows,
} from './productionLineItems'
import {
  formatQty,
  getLineQuantityMetrics,
  getQuantityRowOrdered,
  resolveDepoSendQuantity,
  resolveProductionClosedStatus,
  withDerivedQuantityRowFulfillmentStatus,
} from './productionQuantityMetrics'
import { removeDepoItemByProductionLine, removeDepoItemByProductionRow, removeDepoItemById, createDepoItemFromRow, addDepoItem, getDepoItemByProductionRow, syncDepoFromProduction, updateDepoItem } from './depoStore'
import { findCustomerProfileByReference } from '../data/customerProfiles'
import { buildProductionInvoiceDraft, saveProductionInvoiceDraft } from './productionInvoiceDraft'
import { getProductionJobById, updateProductionJob, updateProductionLineItem } from './productionStore'

function createActivityId() {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function assignProductionRowCodes(rows = [], jobId = '') {
  if (!jobId) return rows
  return rows.map((row, index) => ({
    ...row,
    productionCode: `${jobId}-${index + 1}`,
  }))
}

export function createProductionLineItemActions({
  job,
  productionStageOptions,
  refreshJobs,
  addJobActivity,
  setActiveMenu,
}) {
  function appendActivity(text, extraPatch = {}) {
    if (!job || typeof addJobActivity !== 'function') return
    addJobActivity(text, extraPatch)
  }

  function patchLineQuantityRows(lineItem, nextRows, { skipDeriveForRowId = null, lineItemPatch = {} } = {}) {
    if (!job) return
    const now = createQuantityRowTimestamp()
    const rows = nextRows.map((row) => (
      row.id === skipDeriveForRowId
        ? row
        : withDerivedQuantityRowFulfillmentStatus(row, lineItem, productionStageOptions, { timestamp: now })
    ))
    const synced = syncLineQuantitiesFromRows(rows)
    const currentStageId = deriveLineCurrentStageId(synced.quantityRows, productionStageOptions)
    const currentJob = getProductionJobById(job.id)
    const nextLineItems = ensureLineItems(currentJob, productionStageOptions).map((line) => (
      line.id === lineItem.id
        ? { ...line, ...synced, currentStageId, quantityRows: synced.quantityRows, ...lineItemPatch }
        : line
    ))
    const summary = deriveJobSummary({ ...currentJob, lineItems: nextLineItems }, productionStageOptions)
    updateProductionJob(job.id, {
      lineItems: nextLineItems,
      status: summary.status,
      currentStageId: summary.currentStageId,
      stage: summary.stage,
    })
    refreshJobs()
  }

  function handleQuantityRowStageChange(lineItem, rowId, stageId) {
    if (!job || lineItem.productionClosed) return
    const stage = productionStageOptions.find((item) => item.id === stageId)
    const rows = getLineQuantityRows(lineItem).map((row) => {
      if (row.id !== rowId) return row
      const now = createQuantityRowTimestamp()
      return {
        ...row,
        currentStageId: stageId || row.currentStageId,
        stageUpdatedAt: now,
      }
    })

    patchLineQuantityRows(lineItem, rows)
    appendActivity(`"${lineItem.product}" teslimat #${rows.findIndex((row) => row.id === rowId) + 1} "${stage?.label || ''}" aşamasına alındı.`)
  }

  function handleLineQuantityRowChange(lineItem, rowId, patch) {
    if (!job || lineItem.productionClosed) return

    if (patch.fulfillmentStatus === 'Tamamlandı') {
      const previewRows = getLineQuantityRows(lineItem).map((row) => (
        row.id === rowId ? { ...row, ...patch } : row
      ))
      const metrics = getLineQuantityMetrics({ ...lineItem, ...syncLineQuantitiesFromRows(previewRows) })
      if (!lineItem.productionClosed && metrics.produced < metrics.ordered) {
        window.alert('Üretimi kapatmadan tamamlanmış sayılamaz. Önce "Üretimi Kapat" ile üretim sürecini sonlandırın.')
        return
      }
    }

    const rows = getLineQuantityRows(lineItem).map((row) => {
      if (row.id !== rowId) return row
      const now = createQuantityRowTimestamp()
      const nextRow = { ...row, ...patch, createdAt: row.createdAt || now }
      if (patch.fulfillmentStatus !== undefined) nextRow.statusUpdatedAt = now
      if (patch.producedQuantity !== undefined) {
        nextRow.producedUpdatedAt = patch.producedQuantity > 0 ? now : ''
      }
      if (patch.deliveredQuantity !== undefined) {
        nextRow.deliveredUpdatedAt = patch.deliveredQuantity > 0 ? now : ''
      }
      if (patch.fulfillmentStatus === 'Tamamlandı') {
        nextRow.deliveredQuantity = Math.max(nextRow.deliveredQuantity, nextRow.producedQuantity)
        nextRow.deliveredUpdatedAt = now
        const lastStage = productionStageOptions[productionStageOptions.length - 1]
        if (lastStage?.id) {
          nextRow.currentStageId = lastStage.id
          nextRow.stageUpdatedAt = now
        }
      }
      return nextRow
    })

    const skipAutoStatusForRow =
      patch.fulfillmentStatus !== undefined
      || patch.producedQuantity !== undefined
      || patch.deliveredQuantity !== undefined

    patchLineQuantityRows(lineItem, rows, {
      skipDeriveForRowId: skipAutoStatusForRow ? rowId : null,
    })
    if (patch.fulfillmentStatus) {
      appendActivity(`"${lineItem.product}" satır durumu "${patch.fulfillmentStatus}" olarak güncellendi.`)
    }
    setActiveMenu?.(null)
  }

  function handleAddQuantityRow(lineItem, sourceRowId) {
    if (!job) return undefined
    const rows = getLineQuantityRows(lineItem)
    const sourceIndex = sourceRowId
      ? rows.findIndex((row) => row.id === sourceRowId)
      : rows.length - 1
    const resolvedIndex = sourceIndex >= 0 ? sourceIndex : rows.length - 1
    const sourceRow = rows[resolvedIndex]
    if (!sourceRow) return undefined

    const sourceOrdered = getQuantityRowOrdered(sourceRow, lineItem, resolvedIndex)
    const produced = Math.max(0, Number(sourceRow.producedQuantity) || 0)
    const delivered = Math.max(0, Number(sourceRow.deliveredQuantity) || 0)
    const sourceRemaining = Math.max(0, sourceOrdered - produced)
    const sourceUndelivered = Math.max(0, produced - delivered)

    let splitQty = sourceRemaining > 0 ? sourceRemaining : sourceUndelivered
    if (splitQty <= 0) {
      const lineMetrics = getLineQuantityMetrics(lineItem)
      splitQty = Math.max(0, lineMetrics.remaining)
    }
    if (splitQty <= 0) {
      splitQty = 1
    }

    const now = createQuantityRowTimestamp()
    const firstStage = productionStageOptions[0]
    const nextSource = {
      ...sourceRow,
      orderedQuantity: produced > 0 ? produced : Math.max(0, sourceOrdered - splitQty),
    }
    const newRow = createQuantityRow({
      orderedQuantity: splitQty,
      createdAt: now,
      currentStageId: firstStage?.id || lineItem.currentStageId || '',
      stageUpdatedAt: now,
    })
    const nextRows = assignProductionRowCodes([
      ...rows.slice(0, resolvedIndex),
      nextSource,
      newRow,
      ...rows.slice(resolvedIndex + 1),
    ], job.id)

    const reopenPatch = lineItem.productionClosed
      ? {
          productionClosed: false,
          productionClosedAt: '',
          pendingStageId: lineItem.pendingStageId || firstStage?.id || '',
          depoWarehouseKind: '',
        }
      : {}

    patchLineQuantityRows(lineItem, nextRows, { lineItemPatch: reopenPatch })
    appendActivity(`"${lineItem.product}" kalemine ${formatQty(splitQty)} adetlik yeni süreç satırı eklendi.`)
    return newRow.id
  }

  function handleRestartProcess(lineItem) {
    if (!job || lineItem.productionClosed) return
    const now = createQuantityRowTimestamp()
    const firstStage = productionStageOptions[0]
    const metrics = getLineQuantityMetrics(lineItem)
    const freshRow = createQuantityRow({
      orderedQuantity: Math.max(0, Number(lineItem.quantity) || 0),
      fulfillmentStatus: 'Devam Ediyor',
      producedQuantity: metrics.produced,
      deliveredQuantity: metrics.delivered,
      currentStageId: firstStage?.id || lineItem.currentStageId || '',
      stageUpdatedAt: now,
      statusUpdatedAt: now,
      createdAt: now,
    })
    patchLineQuantityRows(lineItem, [freshRow])
    appendActivity(`"${lineItem.product}" üretim süreci yeniden başlatıldı.`)
  }

  function handleRemoveQuantityRow(lineItem, rowId) {
    if (!job) return
    removeDepoItemByProductionRow(job.id, lineItem.id, rowId)
    const rows = getLineQuantityRows(lineItem).filter((row) => row.id !== rowId)
    if (rows.length === 0) return
    patchLineQuantityRows(lineItem, rows)
    appendActivity(`"${lineItem.product}" kaleminden bir üretim/teslimat satırı silindi.`)
  }

  function handleSendRowToDepo(lineItem, rowId, orderLineQuantity = null) {
    if (!job || lineItem.productionClosed) return null
    const rows = getLineQuantityRows(lineItem)
    const rowIndex = rows.findIndex((entry) => entry.id === rowId)
    const codedRows = assignProductionRowCodes(rows, job.id)
    const row = rowIndex >= 0 ? codedRows[rowIndex] : null
    if (!row) return null
    if (row.depoItemId) {
      const existing = getDepoItemByProductionRow(job.id, lineItem.id, rowId)
      if (existing && row.productionCode && existing.productionCode !== row.productionCode) {
        updateDepoItem(existing.id, { productionCode: row.productionCode })
      }
      patchLineQuantityRows(lineItem, codedRows)
      return { depoItemId: row.depoItemId }
    }

    const depoQuantity = resolveDepoSendQuantity(row, rowIndex, lineItem, orderLineQuantity)
    if (depoQuantity <= 0) {
      window.alert('Depoya göndermek için teslim adedi girin.')
      return null
    }

    const existing = getDepoItemByProductionRow(job.id, lineItem.id, rowId)
    if (existing) {
      const syncedRow = { ...row, depoItemId: existing.id, depoSentAt: existing.depoSentAt || existing.createdAt }
      if (row.productionCode && existing.productionCode !== row.productionCode) {
        updateDepoItem(existing.id, { productionCode: row.productionCode })
      }
      patchLineQuantityRows(lineItem, codedRows.map((entry) => (entry.id === rowId ? syncedRow : entry)))
      return { depoItemId: existing.id }
    }

    const depoItem = createDepoItemFromRow(job, lineItem, row, { quantity: depoQuantity })
    addDepoItem(depoItem)
    const now = createQuantityRowTimestamp()
    const nextRow = { ...row, depoItemId: depoItem.id, depoSentAt: now }
    patchLineQuantityRows(lineItem, codedRows.map((entry) => (entry.id === rowId ? nextRow : entry)))
    appendActivity(`"${lineItem.product}" · ${formatQty(depoQuantity)} adet depoya gönderildi.`)
    return { depoItemId: depoItem.id }
  }

  function handleUndoSendRowToDepo(lineItem, rowId) {
    if (!job) return false
    const rows = getLineQuantityRows(lineItem)
    const row = rows.find((entry) => entry.id === rowId)
    if (!row?.depoItemId) return false

    removeDepoItemByProductionRow(job.id, lineItem.id, rowId)
    removeDepoItemById(row.depoItemId)
    const nextRow = {
      ...row,
      depoItemId: '',
      depoSentAt: '',
      invoiceNo: '',
      invoiceAt: '',
    }
    patchLineQuantityRows(lineItem, rows.map((entry) => (entry.id === rowId ? nextRow : entry)))
    appendActivity(`"${lineItem.product}" depo gönderimi geri alındı; süreç yeniden düzenlenebilir.`)
    return true
  }

  function handleCloseProduction(lineItem, depoWarehouseKind) {
    if (!job) return
    const metrics = getLineQuantityMetrics(lineItem)
    if (metrics.produced <= 0) {
      window.alert('Üretimi kapatmak için önce üretilen adet girin.')
      return
    }
    if (depoWarehouseKind !== 'order') {
      window.alert('Depoya yönlendirme için Depo seçilmelidir.')
      return
    }
    const firstStage = productionStageOptions[0]
    const lastStage = productionStageOptions[productionStageOptions.length - 1]
    const closed = resolveProductionClosedStatus(lineItem, productionStageOptions)
    const closedRows = getLineQuantityRows(lineItem).map((row) => ({
      ...row,
      currentStageId: lastStage?.id || row.currentStageId,
      stageUpdatedAt: createQuantityRowTimestamp(),
    }))
    const synced = syncLineQuantitiesFromRows(closedRows)
    const parts = [`"${lineItem.product}" üretimi kapatıldı: ${formatQty(metrics.produced)} adet.`]
    if (metrics.remaining > 0) parts.push(`${formatQty(metrics.remaining)} adet bekliyor.`)
    if (metrics.excess > 0) parts.push(`${formatQty(metrics.excess)} adet fazla üretildi.`)

    const destinationLabel = 'Depo'
    updateProductionLineItem(job.id, lineItem.id, {
      productionClosed: true,
      productionClosedAt: createQuantityRowTimestamp(),
      pendingStageId: firstStage?.id || '',
      depoWarehouseKind,
      ...closed,
      ...synced,
      currentStageId: lastStage?.id || synced.currentStageId,
    })
    appendActivity(`${parts.join(' ')} Merkez depo → ${destinationLabel}.`)
    refreshJobs()
    syncDepoFromProduction()
    setActiveMenu?.(null)
  }

  function handleReopenProduction(lineItem) {
    if (!job) return
    const ok = window.confirm(`"${lineItem.product}" için üretim kapatma geri alınsın mı?`)
    if (!ok) return

    const metrics = getLineQuantityMetrics(lineItem)
    const firstStage = productionStageOptions[0]
    let fulfillmentStatus = lineItem.fulfillmentStatus
    if (metrics.delivered >= metrics.ordered) {
      fulfillmentStatus = 'Tamamlandı'
    } else if (metrics.delivered > 0) {
      fulfillmentStatus = 'Kısmi Teslimat'
    } else if (metrics.produced > 0) {
      fulfillmentStatus = 'Devam Ediyor'
    } else if (fulfillmentStatus === 'Tamamlandı' || fulfillmentStatus === 'Kısmi Üretim Bitti') {
      fulfillmentStatus = 'Devam Ediyor'
    }

    const currentStageId = metrics.remaining > 0 && lineItem.pendingStageId
      ? lineItem.pendingStageId
      : lineItem.currentStageId || firstStage?.id || ''

    updateProductionLineItem(job.id, lineItem.id, {
      productionClosed: false,
      productionClosedAt: '',
      pendingStageId: '',
      depoWarehouseKind: '',
      currentStageId,
      fulfillmentStatus,
    })
    removeDepoItemByProductionLine(job.id, lineItem.id)
    appendActivity(`"${lineItem.product}" üretim kapatması geri alındı.`)
    refreshJobs()
  }

  function handleStagePhotosChange(lineItem, photos) {
    if (!job) return
    updateProductionLineItem(job.id, lineItem.id, { stagePhotos: photos })
    refreshJobs()
  }

  function handleRemoveLineItem(lineItem) {
    if (!job) return
    const lines = ensureLineItems(job, productionStageOptions)
    if (lines.length <= 1) {
      window.alert('Üretim kaydında en az bir kalem kalmalı. Tüm kaydı silmek için üst satırdaki çöp kutusunu kullanın.')
      return
    }
    const nextLineItems = lines.filter((line) => line.id !== lineItem.id)
    updateProductionJob(job.id, { lineItems: nextLineItems })
    removeDepoItemByProductionLine(job.id, lineItem.id)
    appendActivity(`"${lineItem.product}" kalemi listeden kaldırıldı.`)
    refreshJobs()
    setActiveMenu?.(null)
  }

  function resolveInvoiceCustomer() {
    const profile = findCustomerProfileByReference(job?.customer)
    if (!profile?.id) {
      window.alert('Müşteri bulunamadı. Fatura kesmek için geçerli bir müşteri kaydı gerekir.')
      return null
    }
    return profile
  }

  function handleIssueRowInvoice(lineItem, rowId) {
    if (!job) return null
    const rows = getLineQuantityRows(lineItem)
    const row = rows.find((entry) => entry.id === rowId)
    if (!row) return null
    if (row.invoiceNo) return handleOpenRowInvoice(lineItem, rowId)

    if (!row.depoItemId) {
      window.alert('Fatura kesmek için önce depoya gönderin.')
      return null
    }

    const profile = resolveInvoiceCustomer()
    if (!profile) return null

    const now = createQuantityRowTimestamp()
    const invoiceNo = `SF-${Date.now().toString().slice(-8)}`
    const nextRow = { ...row, invoiceNo, invoiceAt: now }
    patchLineQuantityRows(lineItem, rows.map((entry) => (entry.id === rowId ? nextRow : entry)))
    saveProductionInvoiceDraft(buildProductionInvoiceDraft(job, lineItem, nextRow))
    appendActivity(`"${lineItem.product}" için ${invoiceNo} numaralı fatura kesildi.`)
    return {
      customerId: profile.id,
      invoiceNo,
      path: `/musteriler/${profile.id}/belge/satis-faturasi`,
    }
  }

  function handleOpenRowInvoice(lineItem, rowId) {
    if (!job) return null
    const row = getLineQuantityRows(lineItem).find((entry) => entry.id === rowId)
    if (!row?.invoiceNo) return null

    const profile = resolveInvoiceCustomer()
    if (!profile) return null

    saveProductionInvoiceDraft(buildProductionInvoiceDraft(job, lineItem, row))
    return {
      customerId: profile.id,
      invoiceNo: row.invoiceNo,
      path: `/musteriler/${profile.id}/belge/satis-faturasi`,
    }
  }

  return {
    handleQuantityRowStageChange,
    handleLineQuantityRowChange,
    handleAddQuantityRow,
    handleRestartProcess,
    handleRemoveQuantityRow,
    handleCloseProduction,
    handleReopenProduction,
    handleStagePhotosChange,
    handleRemoveLineItem,
    handleIssueRowInvoice,
    handleOpenRowInvoice,
    handleSendRowToDepo,
    handleUndoSendRowToDepo,
  }
}

export function appendProductionJobActivity(jobId, text, extraPatch = {}) {
  const current = getProductionJobById(jobId)
  if (!current) return null
  return {
    ...extraPatch,
    activities: [
      ...(current.activities || []),
      { id: createActivityId(), date: new Date().toLocaleString('tr-TR'), text },
    ],
  }
}
