import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save } from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { getModuleById } from '@/data/modules'
import { customersApi, modulesApi } from '@/services/api'
import { EmptyState } from '@/components/ui/EmptyState'

interface ModuleFormPageProps {
  moduleId: string
  mode: 'create' | 'edit'
}

export function ModuleFormPage({ moduleId, mode }: ModuleFormPageProps) {
  const { id, itemId } = useParams()
  const recordId = id ?? itemId
  const navigate = useNavigate()
  const config = getModuleById(moduleId)
  const [saving, setSaving] = useState(false)

  if (!config) return <EmptyState title="Modül bulunamadı" />
  if (config.formFields.length === 0) {
    return <EmptyState title="Form desteklenmiyor" description="Bu modül için form oluşturma mevcut değil." />
  }

  const existing = mode === 'edit' && recordId ? config.rows.find((r) => r.id === recordId) : null
  const title = mode === 'create' ? `Yeni ${config.singularName}` : `${config.singularName} Düzenle`

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const body: Record<string, string> = {}
    formData.forEach((value, key) => { body[key] = String(value) })

    try {
      if (moduleId === 'customers') {
        if (mode === 'create') await customersApi.create(body)
        else if (recordId) await customersApi.update(recordId, body)
      } else if (moduleId === 'support') {
        const { supportApi } = await import('@/services/api')
        if (mode === 'create') await supportApi.create(body)
      } else {
        if (mode === 'create') await modulesApi.create(moduleId, body)
        else if (recordId) await modulesApi.update(moduleId, recordId, body)
      }
      navigate(config.path)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title={title}
        subtitle={mode === 'create' ? `Yeni ${config.singularName.toLowerCase()} kaydı oluşturun` : 'Kayıt bilgilerini güncelleyin'}
        breadcrumbs={[
          { label: config.title, href: config.path },
          { label: title },
        ]}
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate(config.path)}>
            <ArrowLeft className="h-4 w-4" /> İptal
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card padding="lg">
          <CardTitle className="mb-6 text-base">Bilgiler</CardTitle>
          <div className="grid gap-5 sm:grid-cols-2">
            {config.formFields.map((field) => (
              <div key={field.name} className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
                <label className="mb-1.5 block text-sm font-medium text-text">
                  {field.label}
                  {field.required && <span className="text-rose-500"> *</span>}
                </label>
                {field.type === 'textarea' ? (
                  <Textarea
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    defaultValue={existing ? String(existing[field.name] ?? '') : ''}
                  />
                ) : field.type === 'select' ? (
                  <Select
                    name={field.name}
                    required={field.required}
                    defaultValue={existing ? String(existing[field.name] ?? '') : ''}
                  >
                    <option value="">Seçin...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    required={field.required}
                    defaultValue={existing ? String(existing[field.name] ?? '') : ''}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate(config.path)}>
              İptal
            </Button>
            <Button type="submit" variant="gold" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </Card>
      </form>
    </motion.div>
  )
}
