import { X } from 'lucide-react'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

const customers = []
const products = []

export default function NewOrderModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-800 border border-dark-500/50 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-dark-500/50 sticky top-0 bg-dark-800 z-10">
          <h2 className="text-lg font-bold text-white">Yeni Sipariş Oluştur</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-600 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Müşteri *</label>
              <select className="w-full bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-accent-blue/50">
                <option value="">Müşteri seçin...</option>
                {customers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Öncelik</label>
              <select className="w-full bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-accent-blue/50">
                <option>Normal</option>
                <option>Yüksek</option>
                <option>Düşük</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Teslim Tarihi *</label>
              <input type="date" className="w-full bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-accent-blue/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Ödeme Yöntemi</label>
              <select className="w-full bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-accent-blue/50">
                <option>Havale/EFT</option>
                <option>Kredi Kartı</option>
                <option>Vadeli (30 gün)</option>
                <option>Kapıda Ödeme</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Teslimat Adresi</label>
            <textarea
              rows={2}
              placeholder="Teslimat adresini girin..."
              className="w-full bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-blue/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">Ürünler *</label>
            <div className="bg-dark-700/50 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[12px] text-gray-500 uppercase">
                <div className="col-span-5">Ürün</div>
                <div className="col-span-3 text-right">Miktar</div>
                <div className="col-span-2 text-right">Birim Fiyat</div>
                <div className="col-span-2 text-right">Toplam</div>
              </div>
              <div className="grid grid-cols-12 gap-2 items-center">
                <select className="col-span-5 bg-dark-700 border border-dark-500/50 rounded-lg px-2 py-1.5 text-sm text-gray-300">
                  <option value="">Ürün seçin...</option>
                  {products.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <input type="number" placeholder="0" className="col-span-3 bg-dark-700 border border-dark-500/50 rounded-lg px-2 py-1.5 text-sm text-gray-300 text-right" />
                <input type="number" placeholder="0₺" className="col-span-2 bg-dark-700 border border-dark-500/50 rounded-lg px-2 py-1.5 text-sm text-gray-300 text-right" />
                <span className="col-span-2 text-sm text-gray-400 text-right">0₺</span>
              </div>
              <button type="button" className="text-xs text-accent-blue hover:text-blue-400 transition-colors">
                + Ürün Ekle
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Notlar</label>
            <textarea
              rows={2}
              placeholder="Sipariş notları..."
              className="w-full bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-blue/50 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-dark-500/50">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
              İptal
            </button>
            <button type="submit" className={`${BTN_SUCCESS} px-6 py-2 text-sm`}>
              Sipariş Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
