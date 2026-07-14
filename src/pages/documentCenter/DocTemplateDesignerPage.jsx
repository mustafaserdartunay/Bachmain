import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BachDocumentDesigner from '../../components/DocumentDesigner/BachDocumentDesigner'
import { DOCUMENT_CENTER_BASE } from '../../data/documentCenterMenu'
import {
  emptyDocTemplate,
  getDocTemplateById,
  saveDocTemplate,
} from '../../utils/docTemplatesStore'
import { migrateTemplateToVisual } from '../../utils/docCanvasEngine'
import { flushWorkspaceNow } from '../../utils/workspaceStorage'
import { pushRecentTemplate } from '../../utils/docDesignerPrefs'

export default function DocTemplateDesignerPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState(() => {
    const id = params.get('id')
    const found = (id && getDocTemplateById(id)) || emptyDocTemplate({
      docType: 'invoice',
      name: 'Fatura Şablonu - A4',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
    })
    return migrateTemplateToVisual({
      ...found,
      designMode: 'visual',
      margins: found.margins || { top: 15, right: 15, bottom: 15, left: 15 },
    })
  })
  const [autosaveHint, setAutosaveHint] = useState('')
  const draftRef = useRef(draft)
  draftRef.current = draft

  useEffect(() => {
    const id = params.get('id')
    if (id) {
      const found = getDocTemplateById(id)
      if (found) {
        setDraft(migrateTemplateToVisual({
          ...found,
          designMode: 'visual',
          margins: found.margins || { top: 15, right: 15, bottom: 15, left: 15 },
        }))
      }
    }
  }, [params])

  const patchDraft = useCallback((patch) => {
    setDraft((current) => ({ ...current, ...patch }))
  }, [])

  const handleSave = useCallback(async ({ silent = false } = {}) => {
    const current = draftRef.current
    if (!current.name?.trim()) {
      if (!silent) window.alert('Şablon adı gerekli.')
      return null
    }
    const savedTpl = saveDocTemplate({
      ...current,
      designMode: 'visual',
    })
    setDraft(migrateTemplateToVisual({
      ...savedTpl,
      margins: savedTpl.margins || current.margins,
    }))
    pushRecentTemplate({ id: savedTpl.id, name: savedTpl.name })
    await flushWorkspaceNow()
    if (!silent) {
      setAutosaveHint('Kaydedildi')
      window.setTimeout(() => setAutosaveHint(''), 1600)
    }
    if (!params.get('id')) {
      navigate(`${DOCUMENT_CENTER_BASE}/tasarimci?id=${savedTpl.id}`, { replace: true })
    }
    return savedTpl
  }, [navigate, params])

  // Autosave every 30s
  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = draftRef.current
      if (!current?.name?.trim()) return
      const savedTpl = saveDocTemplate({ ...current, designMode: 'visual' })
      draftRef.current = migrateTemplateToVisual({ ...savedTpl, margins: savedTpl.margins || current.margins })
      setAutosaveHint(`Otomatik kaydedildi · ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`)
      flushWorkspaceNow()
    }, 30000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <BachDocumentDesigner
      template={draft}
      onChange={patchDraft}
      onSave={() => handleSave({ silent: false })}
      onClose={() => navigate(`${DOCUMENT_CENTER_BASE}/sablonlar`)}
      autosaveHint={autosaveHint}
    />
  )
}
