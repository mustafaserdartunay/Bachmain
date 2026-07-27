import { getCatalogProducts, getTotalStock } from './productCatalog'

const STORAGE_KEY = 'erlenbox-stock'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nowIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function nowStamp() {
  return new Date().toLocaleString('tr-TR')
}

function formatTrDate(iso) {
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('tr-TR')
}

function defaultWarehouse() {
  return {
    id: 'WH-001',
    name: 'Merkez Depo',
    code: 'MRK-01',
    type: 'Ana Depo',
    status: 'Aktif',
    city: 'İstanbul',
    district: 'Kağıthane',
    address: '',
    manager: '',
    phone: '',
    email: '',
    capacityM3: 1200,
    usedM3: 0,
    shelfCount: 24,
    activeShelves: 24,
    criticalProducts: 0,
    totalSku: 0,
    totalStock: 0,
    estimatedValue: 0,
    inboundToday: 0,
    outboundToday: 0,
    transferPending: 0,
    temperature: '',
    humidity: '',
    lastCountDate: '',
    notes: '',
    zones: [],
    stock: [],
  }
}

function defaultPriceList() {
  return {
    id: 'PL-001',
    name: 'Perakende Fiyat Listesi',
    currency: 'TRY',
    isDefault: true,
    notes: 'Varsayılan satış fiyatları',
    items: [],
    updatedAt: nowStamp(),
  }
}

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        warehouses: [defaultWarehouse()],
        transfers: [],
        outgoingWaybills: [],
        incomingWaybills: [],
        priceLists: [defaultPriceList()],
        history: [],
      }
    }
    const parsed = JSON.parse(raw)
    return {
      warehouses:
        Array.isArray(parsed.warehouses) && parsed.warehouses.length
          ? parsed.warehouses
          : [defaultWarehouse()],
      transfers: Array.isArray(parsed.transfers) ? parsed.transfers : [],
      outgoingWaybills: Array.isArray(parsed.outgoingWaybills) ? parsed.outgoingWaybills : [],
      incomingWaybills: Array.isArray(parsed.incomingWaybills) ? parsed.incomingWaybills : [],
      priceLists:
        Array.isArray(parsed.priceLists) && parsed.priceLists.length
          ? parsed.priceLists
          : [defaultPriceList()],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
  } catch {
    return {
      warehouses: [defaultWarehouse()],
      transfers: [],
      outgoingWaybills: [],
      incomingWaybills: [],
      priceLists: [defaultPriceList()],
      history: [],
    }
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent('erlenbox:stock-updated'))
}

function syncWarehouseTotals(warehouse) {
  const stock = Array.isArray(warehouse.stock) ? warehouse.stock : []
  const totalStock = stock.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)
  const totalSku = stock.filter((row) => (Number(row.quantity) || 0) > 0).length
  const criticalProducts = stock.filter((row) => {
    const qty = Number(row.quantity) || 0
    const critical = Number(row.criticalStock) || 0
    return critical > 0 && qty <= critical
  }).length
  const estimatedValue = stock.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.unitValue) || 0),
    0,
  )

  return {
    ...warehouse,
    stock,
    totalStock,
    totalSku,
    criticalProducts,
    estimatedValue,
  }
}

function findStockRow(warehouse, productId, productName, sku) {
  return (warehouse.stock || []).find((row) => {
    if (productId && row.productId === productId) return true
    if (sku && row.sku === sku) return true
    return productName && row.productName === productName
  })
}

function upsertStockRow(warehouse, row) {
  const stock = [...(warehouse.stock || [])]
  const index = stock.findIndex((item) => {
    if (row.productId && item.productId === row.productId) return true
    if (row.sku && item.sku === row.sku) return true
    return row.productName && item.productName === row.productName
  })

  if (index >= 0) {
    stock[index] = { ...stock[index], ...row, quantity: Math.max(0, Number(row.quantity) || 0) }
  } else {
    stock.push({
      productId: row.productId || '',
      productName: row.productName || 'Ürün',
      sku: row.sku || '',
      quantity: Math.max(0, Number(row.quantity) || 0),
      unit: row.unit || 'adet',
      criticalStock: Number(row.criticalStock) || 0,
      unitValue: Number(row.unitValue) || 0,
    })
  }

  return syncWarehouseTotals({ ...warehouse, stock })
}

function adjustWarehouseStock(warehouses, warehouseId, row, delta) {
  const index = warehouses.findIndex((item) => item.id === warehouseId)
  if (index < 0) return warehouses

  const warehouse = warehouses[index]
  const existing = findStockRow(warehouse, row.productId, row.productName, row.sku)
  const nextQty = Math.max(0, (Number(existing?.quantity) || 0) + delta)
  const nextWarehouse = upsertStockRow(warehouse, {
    ...row,
    quantity: nextQty,
    criticalStock: row.criticalStock ?? existing?.criticalStock ?? 0,
    unitValue: row.unitValue ?? existing?.unitValue ?? 0,
  })

  return warehouses.map((item, i) => (i === index ? nextWarehouse : item))
}

function appendHistory(state, entry) {
  return {
    ...state,
    history: [
      {
        id: createId('hist'),
        createdAt: nowStamp(),
        date: entry.date || nowIsoDate(),
        ...entry,
      },
      ...state.history,
    ],
  }
}

export function getWarehouses() {
  return readState().warehouses.map(syncWarehouseTotals)
}

export function saveWarehouses(warehouses) {
  const state = readState()
  writeState({ ...state, warehouses: warehouses.map(syncWarehouseTotals) })
}

export function getTransfers() {
  return readState().transfers
}

export function getOutgoingWaybills() {
  return readState().outgoingWaybills
}

export function getIncomingWaybills() {
  return readState().incomingWaybills
}

export function getPriceLists() {
  return readState().priceLists
}

export function getStockHistory() {
  return readState().history
}

export function createTransfer(payload) {
  const state = readState()
  const quantity = Number(payload.quantity) || 0
  if (!payload.fromWarehouseId || !payload.toWarehouseId || quantity <= 0) {
    throw new Error('Transfer bilgileri eksik.')
  }
  if (payload.fromWarehouseId === payload.toWarehouseId) {
    throw new Error('Kaynak ve hedef depo farklı olmalı.')
  }

  const fromWarehouse = state.warehouses.find((item) => item.id === payload.fromWarehouseId)
  const toWarehouse = state.warehouses.find((item) => item.id === payload.toWarehouseId)
  if (!fromWarehouse || !toWarehouse) throw new Error('Depo bulunamadı.')

  const existing = findStockRow(fromWarehouse, payload.productId, payload.productName, payload.sku)
  if ((Number(existing?.quantity) || 0) < quantity) {
    throw new Error('Kaynak depoda yeterli stok yok.')
  }

  const row = {
    productId: payload.productId || existing?.productId || '',
    productName: payload.productName || existing?.productName || 'Ürün',
    sku: payload.sku || existing?.sku || '',
    unit: payload.unit || existing?.unit || 'adet',
    criticalStock: payload.criticalStock ?? existing?.criticalStock ?? 0,
    unitValue: payload.unitValue ?? existing?.unitValue ?? 0,
  }

  let warehouses = adjustWarehouseStock(state.warehouses, payload.fromWarehouseId, row, -quantity)
  warehouses = adjustWarehouseStock(warehouses, payload.toWarehouseId, row, quantity)

  const transfer = {
    id: createId('trf'),
    documentNo: payload.documentNo || `TRF-${String(state.transfers.length + 1).padStart(4, '0')}`,
    fromWarehouseId: payload.fromWarehouseId,
    toWarehouseId: payload.toWarehouseId,
    fromWarehouseName: fromWarehouse.name,
    toWarehouseName: toWarehouse.name,
    productId: row.productId,
    productName: row.productName,
    sku: row.sku,
    quantity,
    unit: row.unit,
    status: 'Tamamlandı',
    notes: payload.notes || '',
    date: payload.date || nowIsoDate(),
    createdAt: nowStamp(),
  }

  let nextState = { ...state, warehouses, transfers: [transfer, ...state.transfers] }
  nextState = appendHistory(nextState, {
    type: 'Depolar Arası Transfer',
    direction: 'transfer',
    warehouseId: payload.fromWarehouseId,
    warehouseName: fromWarehouse.name,
    relatedWarehouseName: toWarehouse.name,
    productName: row.productName,
    sku: row.sku,
    quantity,
    unit: row.unit,
    documentNo: transfer.documentNo,
    notes: transfer.notes,
    date: transfer.date,
  })

  writeState(nextState)
  return transfer
}

export function createOutgoingWaybill(payload) {
  const state = readState()
  const items = Array.isArray(payload.items)
    ? payload.items.filter((item) => (Number(item.quantity) || 0) > 0)
    : []
  if (!payload.warehouseId || items.length === 0) throw new Error('İrsaliye bilgileri eksik.')

  const warehouse = state.warehouses.find((item) => item.id === payload.warehouseId)
  if (!warehouse) throw new Error('Depo bulunamadı.')

  let warehouses = [...state.warehouses]
  items.forEach((item) => {
    const existing = findStockRow(warehouse, item.productId, item.productName, item.sku)
    const qty = Number(item.quantity) || 0
    if ((Number(existing?.quantity) || 0) < qty && payload.enforceStock !== false) {
      throw new Error(`${item.productName || 'Ürün'} için yeterli stok yok.`)
    }
    warehouses = adjustWarehouseStock(warehouses, payload.warehouseId, item, -qty)
  })

  const waybill = {
    id: createId('g-irs'),
    waybillNo:
      payload.waybillNo || `GIR-${String(state.outgoingWaybills.length + 1).padStart(4, '0')}`,
    warehouseId: payload.warehouseId,
    warehouseName: warehouse.name,
    customerName: payload.customerName || '',
    status: payload.status || 'Sevk Edildi',
    date: payload.date || nowIsoDate(),
    items,
    notes: payload.notes || '',
    createdAt: nowStamp(),
  }

  let nextState = { ...state, warehouses, outgoingWaybills: [waybill, ...state.outgoingWaybills] }
  items.forEach((item) => {
    nextState = appendHistory(nextState, {
      type: 'Giden İrsaliye',
      direction: 'out',
      warehouseId: payload.warehouseId,
      warehouseName: warehouse.name,
      productName: item.productName,
      sku: item.sku,
      quantity: Number(item.quantity) || 0,
      unit: item.unit || 'adet',
      documentNo: waybill.waybillNo,
      partyName: waybill.customerName,
      notes: waybill.notes,
      date: waybill.date,
    })
  })

  writeState(nextState)
  return waybill
}

export function createIncomingWaybill(payload) {
  const state = readState()
  const items = Array.isArray(payload.items)
    ? payload.items.filter((item) => (Number(item.quantity) || 0) > 0)
    : []
  if (!payload.warehouseId || items.length === 0) throw new Error('İrsaliye bilgileri eksik.')

  const warehouse = state.warehouses.find((item) => item.id === payload.warehouseId)
  if (!warehouse) throw new Error('Depo bulunamadı.')

  let warehouses = [...state.warehouses]
  items.forEach((item) => {
    warehouses = adjustWarehouseStock(
      warehouses,
      payload.warehouseId,
      item,
      Number(item.quantity) || 0,
    )
  })

  const waybill = {
    id: createId('a-irs'),
    waybillNo:
      payload.waybillNo || `AIR-${String(state.incomingWaybills.length + 1).padStart(4, '0')}`,
    warehouseId: payload.warehouseId,
    warehouseName: warehouse.name,
    supplierName: payload.supplierName || '',
    status: payload.status || 'Teslim Alındı',
    date: payload.date || nowIsoDate(),
    items,
    notes: payload.notes || '',
    createdAt: nowStamp(),
  }

  let nextState = { ...state, warehouses, incomingWaybills: [waybill, ...state.incomingWaybills] }
  items.forEach((item) => {
    nextState = appendHistory(nextState, {
      type: 'Gelen İrsaliye',
      direction: 'in',
      warehouseId: payload.warehouseId,
      warehouseName: warehouse.name,
      productName: item.productName,
      sku: item.sku,
      quantity: Number(item.quantity) || 0,
      unit: item.unit || 'adet',
      documentNo: waybill.waybillNo,
      partyName: waybill.supplierName,
      notes: waybill.notes,
      date: waybill.date,
    })
  })

  writeState(nextState)
  return waybill
}

export function savePriceList(list) {
  const state = readState()
  const normalized = {
    ...list,
    id: list.id || createId('pl'),
    items: Array.isArray(list.items) ? list.items : [],
    updatedAt: nowStamp(),
  }

  const exists = state.priceLists.some((item) => item.id === normalized.id)
  const priceLists = exists
    ? state.priceLists.map((item) => (item.id === normalized.id ? normalized : item))
    : [normalized, ...state.priceLists]

  writeState({ ...state, priceLists })
  return normalized
}

export function deletePriceList(listId) {
  const state = readState()
  writeState({ ...state, priceLists: state.priceLists.filter((item) => item.id !== listId) })
}

export function syncPriceListFromProducts(listId) {
  const products = getCatalogProducts()
  const state = readState()
  const list = state.priceLists.find((item) => item.id === listId)
  if (!list) throw new Error('Fiyat listesi bulunamadı.')

  const items = products.map((product) => ({
    productId: product.id,
    productName: product.name,
    sku: product.stockCode || product.productCode || '',
    price: Number(product.salesPriceExcl) || 0,
    vatRate: Number(product.vatRate) || 0,
  }))

  return savePriceList({ ...list, items })
}

export function getStockProductsReport() {
  const warehouses = getWarehouses()
  const products = getCatalogProducts()
  const history = getStockHistory()

  const rows = products.map((product) => {
    const warehouseStock = (product.warehouses || []).map((entry) => ({
      warehouseName: entry.name || '—',
      quantity: Number(entry.stock) || 0,
    }))
    const catalogTotal = getTotalStock(product)
    const storeTotal = warehouses.reduce((sum, warehouse) => {
      const row = findStockRow(warehouse, product.id, product.name, product.stockCode)
      return sum + (Number(row?.quantity) || 0)
    }, 0)
    const totalStock = Math.max(catalogTotal, storeTotal)
    const criticalStock = Number(product.criticalStock) || 0
    const unitCost = Number(product.costPrice) || Number(product.purchasePriceExcl) || 0
    const vatRate = Math.max(0, Number(product.vatRate) || 0)
    const valueExVat = totalStock * unitCost
    const valueIncVat = valueExVat * (1 + vatRate / 100)

    return {
      id: product.id,
      name: product.name,
      sku: product.stockCode || product.productCode || '—',
      category: product.category || '—',
      totalStock,
      criticalStock,
      isCritical: criticalStock > 0 && totalStock <= criticalStock,
      isEmpty: totalStock <= 0,
      warehouseStock,
      value: valueExVat,
      valueExVat,
      valueIncVat,
      vatRate,
      salesPrice: Number(product.salesPriceExcl) || 0,
    }
  })

  const totalUnits = rows.reduce((sum, row) => sum + row.totalStock, 0)
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0)
  const totalValueExVat = rows.reduce((sum, row) => sum + row.valueExVat, 0)
  const totalValueIncVat = rows.reduce((sum, row) => sum + row.valueIncVat, 0)
  const criticalCount = rows.filter((row) => row.isCritical).length
  const emptyCount = rows.filter((row) => row.isEmpty).length

  return {
    rows: rows.sort((a, b) => b.totalStock - a.totalStock),
    totalUnits,
    totalValue,
    totalValueExVat,
    totalValueIncVat,
    criticalCount,
    emptyCount,
    warehouseCount: warehouses.length,
    movementCount: history.length,
  }
}

export function formatStockDate(value) {
  if (!value) return '—'
  if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) return formatTrDate(String(value).slice(0, 10))
  return value
}

export function getWarehouseName(warehouseId, warehouses = getWarehouses()) {
  return warehouses.find((item) => item.id === warehouseId)?.name || '—'
}
