import {
  ShoppingCart,
  Sparkles,
  Factory,
  CreditCard,
  TrendingUp,
} from 'lucide-react'

const iconMap = {
  total: ShoppingCart,
  new: Sparkles,
  production: Factory,
  payment: CreditCard,
  revenue: TrendingUp,
}

const colorMap = {
  blue: { bg: 'bg-blue-500/20', icon: 'text-blue-400' },
  green: { bg: 'bg-emerald-500/20', icon: 'text-emerald-400' },
  orange: { bg: 'bg-orange-500/20', icon: 'text-orange-400' },
  purple: { bg: 'bg-purple-500/20', icon: 'text-purple-400' },
  yellow: { bg: 'bg-yellow-500/20', icon: 'text-yellow-400' },
}

export default function OrderStats({ stats }) {
  return (
    <div className="grid grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon]
        const colors = colorMap[stat.color]
        return (
          <div key={stat.title} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${colors.icon}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 truncate">{stat.title}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500">{stat.subtitle}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
