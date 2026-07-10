import { useRef } from 'react'
import { Download, FileText, Upload, X, FileImage, FileCode } from 'lucide-react'

const fileTypes = [
  { key: 'dxf', label: 'DXF', accept: '.dxf', icon: FileCode, color: 'text-blue-400' },
  { key: 'pdf', label: 'PDF', accept: '.pdf', icon: FileText, color: 'text-red-400' },
  { key: 'ai', label: 'AI', accept: '.ai', icon: FileCode, color: 'text-orange-400' },
  { key: 'png', label: 'PNG', accept: '.png', icon: FileImage, color: 'text-emerald-400' },
  { key: 'jpg', label: 'JPG', accept: '.jpg,.jpeg', icon: FileImage, color: 'text-purple-400' },
]

const RESTORE_WINDOW_MS = 365 * 24 * 60 * 60 * 1000

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function downloadFile(file) {
  if (!file?.url) return
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.name || `urun-dosyasi.${file.type || 'file'}`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function confirmFileDelete(file) {
  const fileName = file?.name || 'Bu dosya'
  return window.confirm(`"${fileName}" dosyasını silmek istediğinize emin misiniz?`)
    && window.confirm(`Son kontrol: "${fileName}" dosyası listeden kaldırılacak ve 1 yıl içinde geri getirilebilecek. Silme işlemini onaylıyor musunuz?`)
}

export default function ProductFilesUpload({
  files = [],
  onChange,
  fileLocationNote = '',
  onFileLocationNoteChange = () => {},
}) {
  const refs = useRef({})
  const activeFiles = files.filter((file) => !file.deletedAt)
  const recentlyDeletedFiles = files.filter((file) => file.deletedAt && Date.now() - file.deletedAt <= RESTORE_WINDOW_MS)

  function getFilesByType(type) {
    return activeFiles.filter((f) => f.type === type)
  }

  async function handleUpload(type, e) {
    const uploaded = Array.from(e.target.files || [])
    if (!uploaded.length) return

    const newFiles = await Promise.all(uploaded.map(async (file) => ({
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      type,
      size: file.size,
      url: await fileToDataUrl(file),
    })))

    onChange([...files, ...newFiles])
    e.target.value = ''
  }

  function removeFile(file) {
    if (!confirmFileDelete(file)) return
    onChange(files.map((item) => (item.id === file.id ? { ...item, deletedAt: Date.now() } : item)))
  }

  function restoreFile(file) {
    onChange(files.map((item) => {
      if (item.id !== file.id) return item
      const { deletedAt, ...restored } = item
      return restored
    }))
  }

  return (
    <div className="card">
      <h3 className="section-title">
        <Upload className="w-4 h-4 text-accent-blue" /> Ürün Dosyaları
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Teknik çizim, baskı dosyası ve görselleri yükleyin (DXF, PDF, AI, PNG, JPG)
      </p>

      <div className="mb-4">
        <label className="form-label">Dosya Yeri Açıklaması</label>
        <input
          value={fileLocationNote}
          onChange={(e) => onFileLocationNoteChange(e.target.value)}
          placeholder="Bilgisayarda dosyanın bulunduğu klasör / not..."
          className="form-input"
        />
      </div>

      <div className="grid grid-cols-5 gap-3">
        {fileTypes.map(({ key, label, accept, icon: Icon, color }) => {
          const typeFiles = getFilesByType(key)
          return (
            <div key={key} className="space-y-2">
              <input
                ref={(el) => { refs.current[key] = el }}
                type="file"
                accept={accept}
                multiple
                onChange={(e) => handleUpload(key, e)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => refs.current[key]?.click()}
                className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-dark-500/50 hover:border-accent-blue/40 bg-dark-700/40 hover:bg-dark-700/70 transition-colors flex flex-col items-center justify-center gap-1.5 group"
              >
                <Icon className={`w-6 h-6 ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <span className="text-xs font-medium text-gray-400 group-hover:text-gray-300">{label}</span>
                <span className="text-[12px] text-gray-600">Yükle</span>
              </button>

              {typeFiles.length > 0 && (
                <div className="space-y-1">
                  {typeFiles.map((file) => (
                    <div
                      key={file.id}
                      className="relative flex items-center gap-1.5 bg-dark-700/60 rounded-lg px-2 py-1.5 group/file"
                    >
                      <Icon className={`w-3 h-3 shrink-0 ${color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-gray-300 truncate" title={file.name}>{file.name}</p>
                        <p className="text-[11px] text-gray-600">{formatSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadFile(file)}
                        className="p-0.5 rounded text-gray-600 hover:text-emerald-400 opacity-0 group-hover/file:opacity-100 transition-opacity"
                        title="Dosyayı indir"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="p-0.5 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover/file:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {['png', 'jpg'].includes(file.type) && file.url && (
                        <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden w-56 rounded-xl border border-dark-500/70 bg-dark-900 p-2 shadow-2xl group-hover/file:block">
                          <img src={file.url} alt={file.name} className="max-h-56 w-full rounded-lg object-contain" />
                          <p className="mt-1 truncate text-[12px] text-gray-500">{file.name}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {recentlyDeletedFiles.length > 0 && (
        <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-orange-200">Son 1 yılda silinen dosyalar</p>
            <span className="text-[12px] text-orange-200/70">Geri getirilebilir</span>
          </div>
          <div className="space-y-1">
            {recentlyDeletedFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-2 rounded-lg bg-dark-800/60 px-2 py-1.5">
                <FileText className="h-3 w-3 shrink-0 text-orange-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-gray-300" title={file.name}>{file.name}</p>
                  <p className="text-[11px] text-gray-600">{formatSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => restoreFile(file)}
                  className="rounded-lg border border-orange-400/30 px-2 py-1 text-[12px] font-semibold text-orange-200 hover:bg-orange-500/10"
                >
                  Geri Getir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeFiles.length > 0 && (
        <p className="text-[12px] text-gray-600 mt-3 pt-3 border-t border-dark-500/30">
          Toplam {activeFiles.length} dosya yüklendi
        </p>
      )}
    </div>
  )
}
