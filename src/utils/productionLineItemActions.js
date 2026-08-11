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
  getLineCascadingRemainingAfterRows,
  getLineQuantityMetrics,
  getQuantityRowOrdered,
  resolveDepoSendQuantity,
  resolveProductionClosedStatus,
  withDerivedQuantityRowFulfillmentStatus,
} from './productionQuantityMetrics'
import { removeDepoItemByProductionLine, removeDepoItemByProductionRow, removeDepoItemById, createDepoItemFromRow, addDepoItem, getDepoItemByProductionRow, syncDepoFromProduction, updateDepoItem, createDepoWaybill } from './depoStore'
import { findCustomerProfileByReference } from '../data/customerProfiles'
import { getCustomerDisplay } from './customerDisplay'
import { buildGoogleMapsNavigationUrl, formatCustomerAddress, getCustomerCoordinates } from './customerGeo'
import { buildProductionInvoiceDraft, saveProductionInvoiceDraft } from './productionInvoiceDraft'
import { getProductionJobById, updateProductionJob, updateProductionLineItem } from './productionStore'
import {
  createEmptyGood,
  createEmptyStop,
  createTripDraft,
  getSevkiyatTrackingUrl,
  getTrip,
  shareTrackingLink,
  upsertTrip,
} from './sevkiyatStore'
import { createOutgoingWaybill, getWarehouses } from './stockStore'

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
  workflowStages,
  refreshJobs,
  addJobActivity,
  setActiveMenu,
}) {
  // Full workflow when available; otherwise the already-partitioned production list.
  const stagesForNormalize = Array.isArray(workflowStages) && workflowStages.length
    ? workflowStages
    : productionStageOptions

  function appendActivity(text, extraPatch = {}) {
    if (!job || typeof addJobActivity !== 'function') return
    addJobActivity(text, extraPatch)
  }

  function patchLineQuantityRows(lineItem, nextRows, { skipDeriveForRowId = null, lineItemPatch = {} } = {}) {
    if (!job) return
    const now = createQuantityRowTimestamp()
    const derived = nextRows.map((row) => (
      row.id === skipDeriveForRowId || row?.fulfillmentStatusManual
        ? row
        : withDerivedQuantityRowFulfillmentStatus(row, lineItem, productionStageOptions, { timestamp: now })
    ))
    // Keep sipariş numarası sequential: 20000-1, 20000-2, …
    const rows = assignProductionRowCodes(derived, job.id)
    const synced = syncLineQuantitiesFromRows(rows)
    const currentStageId = deriveLineCurrentStageId(synced.quantityRows, stagesForNormalize)
    const currentJob = getProductionJobById(job.id)
    const nextLineItems = ensureLineItems(currentJob, stagesForNormalize).map((line) => (
      line.id === lineItem.id
        ? { ...line, ...synced, currentStageId, quantityRows: synced.quantityRows, ...lineItemPatch }
        : line
    ))
    const summary = deriveJobSummary({ ...currentJob, lineItems: nextLineItems }, stagesForNormalize)
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

    const rows = getLineQuantityRows(lineItem).map((row) => {
      if (row.id !== rowId) return row
      const now = createQuantityRowTimestamp()
      const nextRow = { ...row, ...patch, createdAt: row.createdAt || now }
      if (patch.fulfillmentStatus !== undefined) {
        nextRow.statusUpdatedAt = now
        nextRow.fulfillmentStatusManual = true
      }
      if (patch.producedQuantity !== undefined) {
        nextRow.producedUpdatedAt = patch.producedQuantity > 0 ? now : ''
      }
      if (patch.deliveredQuantity !== undefined) {
        nextRow.deliveredUpdatedAt = patch.deliveredQuantity > 0 ? now : ''
      }
      if (patch.fulfillmentStatus === 'Tamamlandı') {
        nextRow.deliveredQuantity = Math.max(
          Number(nextRow.deliveredQuantity) || 0,
          Number(nextRow.producedQuantity) || 0,
        )
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

    const forceJobComplete = patch.fulfillmentStatus === 'Tamamlandı'
    const synced = syncLineQuantitiesFromRows(
      skipAutoStatusForRow
        ? rows
        : rows.map((row) =>
            row.id === rowId
              ? row
              : withDerivedQuantityRowFulfillmentStatus(row, lineItem, productionStageOptions),
          ),
    )
    const currentStageId = deriveLineCurrentStageId(synced.quantityRows, stagesForNormalize)
    const currentJob = getProductionJobById(job.id)
    const nextLineItems = ensureLineItems(currentJob, stagesForNormalize).map((line) => (
      line.id === lineItem.id
        ? {
            ...line,
            ...synced,
            currentStageId,
            quantityRows: synced.quantityRows,
            ...(forceJobComplete ? { fulfillmentStatus: 'Tamamlandı' } : {}),
          }
        : line
    ))
    const summary = deriveJobSummary({ ...currentJob, lineItems: nextLineItems }, stagesForNormalize)
    updateProductionJob(job.id, {
      lineItems: nextLineItems,
      status: forceJobComplete ? 'Tamamlandı' : summary.status,
      currentStageId: summary.currentStageId,
      stage: summary.stage,
    })
    refreshJobs()
    if (patch.fulfillmentStatus) {
      appendActivity(`"${lineItem.product}" satır durumu "${patch.fulfillmentStatus}" olarak güncellendi.`)
    }
    setActiveMenu?.(null)
  }

  function handleAddQuantityRow(lineItem, sourceRowId) {
    if (!job) return undefined
    // Explicit + only — never auto-create. Codes reassigned in patchLineQuantityRows.
    const rows = getLineQuantityRows(lineItem)
    if (!rows.length) return undefined

    const orderQty = Math.max(0, Number(lineItem.quantity) || 0)
    let splitQty = getLineCascadingRemainingAfterRows(rows, orderQty)
    if (splitQty <= 0) splitQty = 1

    const now = createQuantityRowTimestamp()
    const firstStage = productionStageOptions[0]
    const newRow = createQuantityRow({
      orderedQuantity: splitQty,
      createdAt: now,
      currentStageId: firstStage?.id || lineItem.currentStageId || '',
      stageUpdatedAt: now,
      explicitPartial: true,
    })
    const nextRows = [...rows, newRow]

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
      window.alert('Depoya göndermek için depoya gönderilen adedi girin.')
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
      fulfillmentStatus = 'Kısmi Üretim'
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
    const lines = ensureLineItems(job, stagesForNormalize)
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
      window.alert('Fatura kesmek için önce depoya gönderin / teslim edin.')
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

  function handleIssueRowWaybill(lineItem, rowId) {
    if (!job) return null
    const rows = getLineQuantityRows(lineItem)
    const row = rows.find((entry) => entry.id === rowId)
    if (!row) return null
    if (row.waybillNo) {
      return { waybillNo: row.waybillNo, path: '/stok/giden-irsaliye' }
    }

    const now = createQuantityRowTimestamp()
    const waybillNo = `IRS-${Date.now().toString().slice(-8)}`
    const qty = Math.max(
      0,
      Number(row.deliveredQuantity) || Number(row.producedQuantity) || getQuantityRowOrdered(row, lineItem) || 0,
    )
    const warehouses = getWarehouses()
    try {
      createOutgoingWaybill({
        waybillNo,
        warehouseId: warehouses[0]?.id || '',
        customerName: job.customer || '',
        date: new Date().toISOString().slice(0, 10),
        notes: `${row.productionCode || job.id} · ${lineItem.product || 'Ürün'} · kısmi teslimat`,
        enforceStock: false,
        items: [{
          productId: '',
          productName: lineItem.product || 'Ürün',
          sku: row.productionCode || '',
          unit: 'adet',
          quantity: qty || 1,
        }],
      })
    } catch {
      // Keep row waybill even if stock write fails.
    }

    if (row.depoItemId) {
      try {
        createDepoWaybill(row.depoItemId)
      } catch {
        /* ignore */
      }
    }

    const nextRow = { ...row, waybillNo, waybillAt: now }
    patchLineQuantityRows(lineItem, rows.map((entry) => (entry.id === rowId ? nextRow : entry)))
    appendActivity(`"${lineItem.product}" için ${waybillNo} sevk fişi / irsaliye oluşturuldu.`)
    return { waybillNo, path: '/stok/giden-irsaliye' }
  }

  function handleCreateRowSevkiyatLink(lineItem, rowId) {
    if (!job) return null
    const rows = getLineQuantityRows(lineItem)
    const row = rows.find((entry) => entry.id === rowId)
    if (!row) return null

    if (row.trackingToken) {
      const existing = row.sevkiyatTripId ? getTrip(row.sevkiyatTripId) : null
      if (existing) shareTrackingLink(existing.id, true)
      return {
        tripId: row.sevkiyatTripId || '',
        trackingToken: row.trackingToken,
        url: getSevkiyatTrackingUrl(row.trackingToken),
      }
    }

    const profile = findCustomerProfileByReference(job.customer)
    const qty = Math.max(
      0,
      Number(row.deliveredQuantity) || Number(row.producedQuantity) || getQuantityRowOrdered(row, lineItem) || 1,
    )
    const stop = {
      ...createEmptyStop(1),
      customerId: profile?.id || '',
      customerLabel:
        (profile ? getCustomerDisplay(profile).brandShortName : '') ||
        profile?.company ||
        job.customer ||
        '',
      address: profile ? formatCustomerAddress(profile) : '',
      city: profile?.city || '',
      ...(profile ? getCustomerCoordinates(profile) : {}),
      goods: [{
        ...createEmptyGood(),
        label: lineItem.product || 'Ürün',
        qty,
        unit: 'adet',
        note: row.productionCode || job.id || '',
      }],
    }

    const trip = upsertTrip(
      createTripDraft({
        status: 'planned',
        sharedWithCustomer: true,
        stops: [stop],
        plate: '',
        driverName: '',
        notes: `Üretim ${job.id} · ${row.productionCode || row.id}`,
      }),
    )
    if (!trip) return null
    shareTrackingLink(trip.id, true)

    const nextRow = {
      ...row,
      sevkiyatTripId: trip.id,
      trackingToken: trip.trackingToken,
    }
    patchLineQuantityRows(lineItem, rows.map((entry) => (entry.id === rowId ? nextRow : entry)))
    appendActivity(`"${lineItem.product}" için sevk takip linki oluşturuldu (${trip.code}).`)

    return {
      tripId: trip.id,
      trackingToken: trip.trackingToken,
      url: getSevkiyatTrackingUrl(trip.trackingToken),
      mapsUrl: profile ? buildGoogleMapsNavigationUrl(profile) : '',
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
    handleIssueRowWaybill,
    handleCreateRowSevkiyatLink,
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

export function softDeleteProductionActivities(jobId, activityIds = []) {
  const current = getProductionJobById(jobId)
  if (!current) return null
  const idSet = new Set(activityIds.filter(Boolean))
  if (!idSet.size) return null
  const kept = []
  const trash = [...(current.activityTrash || [])]
  const now = new Date().toISOString()
  ;(current.activities || []).forEach((item) => {
    if (idSet.has(item.id)) {
      trash.push({ ...item, deletedAt: now })
    } else {
      kept.push(item)
    }
  })
  return updateProductionJob(jobId, { activities: kept, activityTrash: trash })
}

export function restoreProductionActivities(jobId, activityIds = []) {
  const current = getProductionJobById(jobId)
  if (!current) return null
  const idSet = new Set(activityIds.filter(Boolean))
  if (!idSet.size) return null
  const restored = []
  const trash = []
  ;(current.activityTrash || []).forEach((item) => {
    if (idSet.has(item.id)) {
      const { deletedAt: _deletedAt, ...rest } = item
      restored.push(rest)
    } else {
      trash.push(item)
    }
  })
  return updateProductionJob(jobId, {
    activities: [...(current.activities || []), ...restored],
    activityTrash: trash,
  })
}

export function purgeProductionActivityTrash(jobId, activityIds = null) {
  const current = getProductionJobById(jobId)
  if (!current) return null
  if (!activityIds) {
    return updateProductionJob(jobId, { activityTrash: [] })
  }
  const idSet = new Set(activityIds.filter(Boolean))
  return updateProductionJob(jobId, {
    activityTrash: (current.activityTrash || []).filter((item) => !idSet.has(item.id)),
  })
}
