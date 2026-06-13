import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PlaceholderPage({ title, description, breadcrumb }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Link to="/" className="hover:text-gray-300 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/stok/urunler" className="hover:text-gray-300 transition-colors">Stok Yönetimi</Link>
          {breadcrumb && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-300">{breadcrumb}</span>
            </>
          )}
        </div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>

      <div className="card flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4">
          <span className="text-2xl">📦</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Bu sayfa yakında düzenlenecek. Stok yönetimi modülü içeriği burada yer alacak.
        </p>
      </div>
    </div>
  )
}
