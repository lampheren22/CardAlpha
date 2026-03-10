'use client'

import type { AlphaScoreBreakdown as AlphaScore } from '@/lib/types'

const LABELS: Record<string, string> = {
  below_90d_avg: 'Below 90-Day Avg',
  below_ath: 'Below All-Time High',
  volume_momentum: 'Volume Momentum',
  rookie_status: 'Rookie Status',
  low_population: 'Low Population',
  serial_scarcity: 'Serial Scarcity',
  performance_momentum: 'Performance Momentum',
  set_popularity: 'Set Popularity',
}

interface Props {
  data: AlphaScore
}

export default function AlphaScoreBreakdown({ data }: Props) {
  const entries = Object.entries(data.breakdown) as [
    keyof typeof data.breakdown,
    { score: number; max: number; value?: number }
  ][]

  return (
    <div className="space-y-3">
      {entries.map(([key, factor]) => {
        const pct = (factor.score / factor.max) * 100
        return (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">{LABELS[key] || key}</span>
              <span className="text-xs text-white tabular-nums">
                {factor.score}/{factor.max}
              </span>
            </div>
            <div className="h-1.5 bg-alpha-border rounded-full overflow-hidden">
              <div
                className="h-full bg-alpha-green rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
