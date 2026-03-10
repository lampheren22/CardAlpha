'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from '@/lib/api'
import type { CardListItem, Filters } from '@/lib/types'
import StatCards from '@/components/dashboard/StatCards'
import DashboardTabs from '@/components/dashboard/DashboardTabs'
import FilterBar from '@/components/dashboard/FilterBar'
import CardDetailModal from '@/components/cards/CardDetailModal'
import clsx from 'clsx'

const SPORT_FILTERS = ['All', 'MLB', 'NFL', 'Pokemon']
const SIGNAL_FILTERS = ['All', 'Strong Buy', 'Buy', 'Watch']

export default function DashboardPage() {
  const [selectedCard, setSelectedCard] = useState<CardListItem | null>(null)
  const [sportFilter, setSportFilter] = useState('All')
  const [signalFilter, setSignalFilter] = useState('All')
  const [advancedFilters, setAdvancedFilters] = useState<Filters>({})

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  })

  const activeSport = sportFilter === 'All' ? undefined : sportFilter

  const mockSummary = {
    total_analyzed: 18,
    buy_signals: 10,
    avg_alpha_score: 72,
    avg_est_roi: 38.2,
    momentum_cards: 10,
    rookie_cards: 5,
    low_pop_cards: 6,
  }

  const displaySummary = summary || mockSummary

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {displaySummary.total_analyzed} cards analyzed · {displaySummary.buy_signals} buy signals
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg border border-alpha-border text-gray-300 hover:text-white hover:border-gray-500 text-sm transition-colors">
          Watchlist
        </button>
      </div>

      {/* Stat cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-alpha-card border border-alpha-border rounded-xl p-4 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <StatCards summary={displaySummary} />
      )}

      {/* Sport + Signal filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sport tabs */}
          <div className="flex items-center gap-1 bg-alpha-card border border-alpha-border rounded-xl p-1">
            {SPORT_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setSportFilter(s)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  sportFilter === s
                    ? 'bg-alpha-green text-black'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Signal filters */}
          <div className="flex items-center gap-1">
            {SIGNAL_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setSignalFilter(f)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  signalFilter === f
                    ? 'border-alpha-green/50 bg-alpha-green/10 text-alpha-green'
                    : 'border-alpha-border text-gray-400 hover:text-white hover:border-gray-500'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <FilterBar onApply={(f) => setAdvancedFilters(f)} />
      </div>

      {/* Main table tabs */}
      <DashboardTabs
        onSelectCard={setSelectedCard}
        sportFilter={activeSport}
        filters={advancedFilters}
      />

      {/* Card detail modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  )
}
