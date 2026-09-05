import { useMemo, useState } from 'react'
import { getHtmlPack } from './htmlPacks'
import './html-pack.css'

export default function HtmlPackSite({ templateId, editable = false }) {
  const pack = getHtmlPack(templateId)
  const [page, setPage] = useState(pack?.pages?.[0]?.file || 'index.html')
  const src = useMemo(() => {
    if (!pack) return ''
    return `/${pack.folder}/${page}`
  }, [pack, page])

  if (!pack) return null

  return (
    <div className="ready-site html-pack" data-sf-block="site" data-sf-label="HTML tema">
      <div className="html-pack-pages" role="tablist">
        {pack.pages.map((item) => (
          <button
            key={item.file}
            type="button"
            className={page === item.file ? 'is-on' : ''}
            onClick={() => setPage(item.file)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <iframe
        title={pack.name}
        src={src}
        className="html-pack-frame"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
      {editable ? (
        <p className="html-pack-note">
          Bu tema orijinal HTML5 dosyası. Metinleri temanın kendi sayfalarında düzenlenir.
        </p>
      ) : null}
    </div>
  )
}
