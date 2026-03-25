'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { CardListItem } from '@/lib/types'
import AlphaScoreGauge from '@/components/cards/AlphaScoreGauge'
import clsx from 'clsx'

interface Props {
  cards: CardListItem[]
  onSelectCard: (card: CardListItem) => void
}

type SortKey = 'player_name' | 'current_price' | 'alpha_score' | 'estimated_roi' | 'sell_through_rate' | 'liquidity_numeric'

const REC_STYLES: Record<string, string> = {
  'Strong Buy': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Buy: 'bg-green-500/20 text-green-400 border-green-500/30',
  Watch: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Avoid: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const RISK_STYLES: Record<string, string> = {
  Low: 'text-emerald-400',
  Medium: 'text-yellow-400',
  High: 'text-alpha-red',
}

const LIQUIDITY_STYLES: Record<string, string> = {
  High: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/30',
  Medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/30',
  Low: 'text-red-400 bg-red-900/30 border-red-700/30',
}

export default function CardTable({ cards, onSelectCard }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('alpha_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...cards].sort((a, b) => {
    const av = a[sortKey] as any
    const bv = b[sortKey] as any
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === 'asc' ? <ChevronUp size={12} className="text-alpha-green" /> : <ChevronDown size={12} className="text-alpha-green" />
    ) : (
      <ChevronDown size={12} className="text-gray-600" />
    )

  const ColHeader = ({ k, label, className = '' }: { k: SortKey; label: string; className?: string }) => (
    <th
      className={`px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-300 transition-colors select-none ${className}`}
      onClick={() => toggleSort(k)}
    >
      <span className="flex items-center gap-1">
        {label} <SortIcon k={k} />
      </span>
    </th>
  )

  if (!cards.length) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No cards match the current filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-alpha-border">
            <ColHeader k="player_name" label="Card" className="min-w-[200px]" />
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-16">Sport</th>
            <ColHeader k="current_price" label="Price" className="min-w-[120px]" />
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">vs 90D Avg</th>
            <ColHeader k="alpha_score" label="Alpha Score" className="min-w-[160px]" />
            <ColHeader k="estimated_roi" label="Est. ROI" />
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Risk</th>
            <ColHeader k="sell_through_rate" label="Sell-Through" className="min-w-[120px]" />
            <ColHeader k="liquidity_numeric" label="Liquidity" className="min-w-[100px]" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((card) => {
            const pctNeg = card.price_vs_90d_pct < 0
            return (
              <tr
                key={card.id}
                onClick={() => onSelectCard(card)}
                className="border-b border-alpha-border/50 hover:bg-white/[0.03] cursor-pointer transition-colors"
              >
                {/* Card name + badges */}
                <td className="px-3 py-3">
                  <p className="text-white font-medium text-sm leading-tight">{card.player_name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {card.set_name}
                    {card.parallel_type ? ` · ${card.parallel_type}` : ''}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {card.is_rookie && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-alpha-green/20 text-alpha-green border border-alpha-green/30">
                        RC
                      </span>
                    )}
                    {card.serial_number && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        /{card.serial_number}
                      </span>
                    )}
                    {card.is_graded && card.grade && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] text-gray-400 border border-alpha-border">
                        {card.grade_company} {card.grade}
                      </span>
                    )}
                  </div>
                </td>

                {/* Sport */}
                <td className="px-3 py-3">
                  <span
                    className={clsx(
                      'px-2 py-0.5 rounded text-[10px] font-bold',
                      card.sport === 'MLB' && 'bg-blue-600 text-white',
                      card.sport === 'NFL' && 'bg-red-600 text-white',
                      card.sport === 'Pokemon' && 'bg-yellow-500 text-black'
                    )}
                  >
                    {card.sport}
                  </span>
                </td>

                {/* Price */}
                <td className="px-3 py-3">
                  <p className="text-white font-semibold tabular-nums text-sm">
                    ${card.current_price.toFixed(2)}
                  </p>
                  <p className={clsx('text-xs tabular-nums', pctNeg ? 'text-alpha-red' : 'text-alpha-green')}>
                    {pctNeg ? '▼' : '▲'} {Math.abs(card.price_vs_90d_pct).toFixed(1)}% vs 90D
                  </p>
                </td>

                {/* vs 90D Avg */}
                <td className="px-3 py-3 text-gray-400 text-sm tabular-nums">
                  ${card.price_90d_avg?.toFixed(0)}
                </td>

                {/* Alpha Score */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <AlphaScoreGauge score={card.alpha_score} size="sm" />
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium border',
                        REC_STYLES[card.recommendation] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      )}
                    >
                      {card.recommendation}
                    </span>
                  </div>
                </td>

                {/* Est ROI */}
                <td className="px-3 py-3">
                  <span className="text-alpha-green font-semibold text-sm tabular-nums">
                    +{card.estimated_roi.toFixed(1)}%
                  </span>
                </td>

                {/* Risk */}
                <td className="px-3 py-3">
                  <span className={clsx('text-sm font-medium', RISK_STYLES[card.risk_rating] || 'text-gray-400')}>
                    {card.risk_rating}
                  </span>
                </td>

                {/* Sell-Through */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-alpha-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-alpha-green rounded-full"
                        style={{ width: `${card.sell_through_rate}%` }}
                      />
                    </div>
                    <span className="text-gray-300 text-xs tabular-nums">
                      {card.sell_through_rate?.toFixed(0)}%
                    </span>
                  </div>
                </td>

                {/* Liquidity */}
                <td className="px-3 py-3">
                  {card.liquidity_score ? (
                    <div className="flex flex-col gap-1">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-semibold border w-fit',
                          LIQUIDITY_STYLES[card.liquidity_score] || 'text-gray-400 bg-gray-900/30 border-gray-700/30'
                        )}
                      >
                        {card.liquidity_score}
                      </span>
                      {card.reasoning && (
                        <span className="text-gray-500 text-[10px] leading-tight max-w-[140px] truncate" title={card.reasoning}>
                          {card.reasoning}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-600 text-xs">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
