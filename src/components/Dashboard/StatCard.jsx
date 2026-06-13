import { ShoppingCart, Cog, FileText, AlertTriangle } from 'lucide-react'

const iconMap = {
  cart: ShoppingCart,
  gear: Cog,
  document: FileText,
  warning: AlertTriangle,
}

const colorMap = {
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: 'text-blue-400' },
  green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-400' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: 'text-orange-400' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: 'text-purple-400' },
}

export default function StatCard({ title, value, trend, icon, color }) {
  const Icon = iconMap[icon]
  const colors = colorMap[color]

  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${colors.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className={`text-xs ${colors.text} mt-0.5`}>{trend}</p>
      </div>
    </div>
  )
}
