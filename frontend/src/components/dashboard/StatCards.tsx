'use client'

import { Target, Zap, TrendingUp, Activity, DollarSign, ArrowDown } from 'lucide-react'
import type { DashboardSummary } from '@/lib/types'

interface Props {
  summary: DashboardSummary
}

export default function StatCards({ summary }: Props) {
  const stats = [
    {
      label: 'Strong Buys',
      value: summary.buy_signals,
      sub: 'Opportunities',
      icon: Target,
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      ringColor: 'border-emerald-500/20',
    },
    {
      label: 'Avg Alpha Score',
      value: summary.avg_alpha_score,
      sub: 'All cards',
      icon: Zap,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      ringColor: 'border-blue-500/20',
    },
    {
      label: 'Avg Est. ROI',
      value: `${summary.avg_est_roi}%`,
      sub: 'Conservative',
      icon: TrendingUp,
      iconBg: 'bg-alpha-green/20',
      iconColor: 'text-alpha-green',
      ringColor: 'border-alpha-green/20',
    },
    {
      label: 'Momentum Cards',
      value: summary.momentum_cards,
      sub: '↑ Vol 7-day',
      icon: Activity,
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      ringColor: 'border-orange-500/20',
    },
    {
      label: 'Rookie Cards',
      value: summary.rookie_cards,
      sub: 'In database',
      icon: DollarSign,
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      ringColor: 'border-purple-500/20',
    },
    {
      label: 'Low Pop',
      value: summary.low_pop_cards,
      sub: 'Under 50 pop',
      icon: ArrowDown,
      iconBg: 'bg-alpha-red/20',
      iconColor: 'text-alpha-red',
      ringColor: 'border-red-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-alpha-card border border-alpha-border rounded-xl p-4 flex flex-col gap-3"
        >
          <div className={`w-8 h-8 rounded-lg ${s.iconBg} ${s.ringColor} border flex items-center justify-center`}>
            <s.icon size={16} className={s.iconColor} />
          </div>
          <div>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-white tabular-nums">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
