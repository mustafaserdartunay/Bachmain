import { useEffect, useState } from 'react'
import { openHeaderPopover } from '../hooks/useHeaderPopover'

export const HEADER_CALENDAR_INTENT_EVENT = 'bach:header-calendar-intent'

let pendingCreateMode = null
let activeCreateMode = null
const createModeListeners = new Set()

function notifyCreateMode() {
  createModeListeners.forEach((listener) => listener(activeCreateMode))
}

function emitCalendarIntent(mode) {
  pendingCreateMode = mode
  openHeaderPopover('calendar')
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HEADER_CALENDAR_INTENT_EVENT, { detail: mode }))
  }
}

export function requestNotebookOpen() {
  pendingCreateMode = null
  openHeaderPopover('notebook')
}

export function requestTaskCreateOpen() {
  emitCalendarIntent('task')
}

export function requestAppointmentCreateOpen() {
  emitCalendarIntent('appointment')
}

export function consumeCalendarCreateIntent() {
  const mode = pendingCreateMode
  pendingCreateMode = null
  return mode
}

export function publishCalendarCreateMode(mode) {
  activeCreateMode = mode || null
  notifyCreateMode()
}

export function useCalendarCreateMode() {
  const [mode, setMode] = useState(activeCreateMode)

  useEffect(() => {
    const listener = (next) => setMode(next)
    createModeListeners.add(listener)
    return () => createModeListeners.delete(listener)
  }, [])

  return mode
}
