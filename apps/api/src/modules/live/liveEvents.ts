import type { Server } from 'socket.io'

export const LIVE_EVENTS = {
  LOCATION_UPDATED: 'location.updated',
  VEHICLE_UPDATED: 'vehicle.updated',
  DRIVER_UPDATED: 'driver.updated',
  EMPLOYEE_UPDATED: 'employee.updated',
  ROUTE_UPDATED: 'route.updated',
  DELIVERY_UPDATED: 'delivery.updated',
  GEOFENCE_ENTERED: 'geofence.entered',
  GEOFENCE_EXITED: 'geofence.exited',
  DRIVER_OFFLINE: 'driver.offline',
  DRIVER_ONLINE: 'driver.online',
} as const

export function emitCompanyLive(
  io: Server | { to: (room: string) => { emit: (event: string, payload: unknown) => void } } | null,
  companyId: string,
  event: string,
  payload: { id?: string; meta?: Record<string, unknown> } = {},
) {
  const cid = String(companyId || '').trim()
  if (!io || !cid || !event) return false
  io.to(`company:${cid}`).emit(event, {
    v: 1,
    companyId: cid,
    id: payload.id || null,
    meta: payload.meta || {},
    at: new Date().toISOString(),
  })
  return true
}
