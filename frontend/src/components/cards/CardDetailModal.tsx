'use client'

import { useEffect, useState } from 'react'
import { X, Eye } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getCardDetail } from '@/lib/api'
import type { CardListItem } from '@/lib/types'
import AlphaScoreGauge from './AlphaScoreGauge'
import AlphaScoreBreakdown from './AlphaScoreBreakdown'
import PriceChart from './PriceChart'
import VolumeChart from './VolumeChart'
import clsx from 'clsx'

interface Props {
  card: CardListItem
  onClose: () => void
  onWatchlist?: (cardId: number) => void
}

const REC_STYLES: Record<string, string> = {
  'Strong Buy': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  Buy: 'bg-green-500/20 text-green-400 border border-green-500/30',
  Watch: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  Avoid: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

export default function CardDetailModal({ card, onClose, onWatchlist }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['card-detail', card.id],
    queryFn: () => getCardDetail(card.id),
  })

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const detail = data
  const pctVs90d = card.price_vs_90d_pct
  const pctNeg = pctVs90d < 0

  const pctVsAth =
    detail?.market_data && detail.market_data.price_ath > 0
      ? (((detail.market_data.current_price - detail.market_data.price_ath) /
          detail.market_data.price_ath) *
          100)
      : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-alpha-elevated border border-alpha-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-alpha-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded text-xs font-bold',
                    card.sport === 'MLB' && 'bg-blue-600 text-white',
                    card.sport === 'NFL' && 'bg-red-600 text-white',
                    card.sport === 'Pokemon' && 'bg-yellow-500 text-black'
                  )}
                >
                  {card.sport}
                </span>
                {card.is_rookie && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-alpha-green/20 text-alpha-green border border-alpha-green/30">
                    ROOKIE
                  </span>
                )}
                {card.serial_number && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    /{card.serial_number}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{card.player_name}</h2>
              <p className="text-gray-400 text-sm mt-0.5">
                {card.set_name}
                {card.card_number ? ` #${card.card_number}` : ''}
                {card.parallel_type ? ` · ${card.parallel_type}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onWatchlist && (
                <button
                  onClick={() => onWatchlist(card.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-alpha-border text-gray-300 hover:text-white hover:border-alpha-green/50 transition-colors text-sm"
                >
                  <Eye size={14} />
                  Watchlist
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left panel */}
          <div className="space-y-4">
            {/* Price + Alpha Score */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Current Price</p>
                <p className="text-3xl font-bold text-white tabular-nums">
                  ${card.current_price.toFixed(2)}
                </p>
                <p className={clsx('text-sm mt-1', pctNeg ? 'text-alpha-red' : 'text-alpha-green')}>
                  {pctNeg ? '▼' : '▲'} {Math.abs(pctVs90d).toFixed(1)}% vs 90D avg
                </p>
                {pctVsAth !== null && (
                  <p className="text-xs text-gray-500">
                    {pctVsAth < 0 ? '-' : '+'}{Math.abs(pctVsAth).toFixed(1)}% vs ATH $
                    {detail?.market_data.price_ath.toFixed(0)}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <AlphaScoreGauge score={card.alpha_score} size="lg" />
                <span className="text-xs text-gray-400">Alpha Score</span>
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded text-xs font-semibold',
                    REC_STYLES[card.recommendation] || 'bg-gray-500/20 text-gray-400'
                  )}
                >
                  {card.recommendation}
                </span>
              </div>
            </div>

            {/* Price Chart */}
            {isLoading ? (
              <div className="h-40 flex items-center justify-center text-gray-500 text-sm">Loading chart…</div>
            ) : detail?.market_data.price_history.length ? (
              <div>
                <p className="text-xs text-gray-400 mb-2">90-Day Price History</p>
                <PriceChart data={detail.market_data.price_history} />
              </div>
            ) : null}

            {/* Volume Chart */}
            {detail?.market_data.price_history.length ? (
              <div>
                <p className="text-xs text-gray-400 mb-2">Sales Volume</p>
                <VolumeChart data={detail.market_data.price_history} />
              </div>
            ) : null}
          </div>

          {/* Right panel */}
          <div className="space-y-5">
            {/* Upside Projection */}
            {detail?.projection && (
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">
                  Upside Projection
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Conservative</p>
                    <p className="text-xl font-bold text-white">
                      ${detail.projection.conservative_exit.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Aggressive</p>
                    <p className="text-xl font-bold text-alpha-green">
                      ${detail.projection.aggressive_exit.toFixed(0)}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. ROI</span>
                    <span className="text-alpha-green font-semibold">
                      +{detail.projection.estimated_roi.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fair Value</span>
                    <span className="text-white">
                      ${detail.projection.fair_value_low.toFixed(0)} – $
                      {detail.projection.fair_value_high.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-alpha-border" />

            {/* Alpha Score Breakdown */}
            {detail?.alpha_score && (
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">
                  Alpha Score Breakdown
                </p>
                <AlphaScoreBreakdown data={detail.alpha_score} />
              </div>
            )}

            <div className="border-t border-alpha-border" />

            {/* Card Details */}
            <div>
              <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">
                Card Details
              </p>
              <div className="space-y-1.5 text-sm">
                {card.is_graded && card.grade && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Grade</span>
                    <span className="text-white font-medium">
                      {card.grade_company} {card.grade}
                    </span>
                  </div>
                )}
                {card.population != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Population</span>
                    <span className="text-white">{card.population}</span>
                  </div>
                )}
                {card.serial_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Print Run</span>
                    <span className="text-amber-400 font-medium">/{card.serial_number}</span>
                  </div>
                )}
                {detail?.market_data && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">7D Avg</span>
                      <span className="text-white">${detail.market_data.price_7d_avg?.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">30D Avg</span>
                      <span className="text-white">${detail.market_data.price_30d_avg?.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">All-Time High</span>
                      <span className="text-white">${detail.market_data.price_ath?.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sell-Through</span>
                      <span className="text-white">{detail.market_data.sell_through_rate}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
