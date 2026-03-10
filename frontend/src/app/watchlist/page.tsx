'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWatchlist, removeFromWatchlist, getPortfolio, getPortfolioSummary, removeFromPortfolio } from '@/lib/api'
import type { CardListItem } from '@/lib/types'
import WatchlistTable from '@/components/watchlist/WatchlistTable'
import CardDetailModal from '@/components/cards/CardDetailModal'
import clsx from 'clsx'
import { Trash2 } from 'lucide-react'

const DEMO_TOKEN = '' // Replace with actual auth token

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'portfolio'>('watchlist')
  const [selectedCard, setSelectedCard] = useState<CardListItem | null>(null)
  const qc = useQueryClient()

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => getWatchlist(DEMO_TOKEN),
    enabled: false, // enable when auth is set up
  })

  const { data: portfolio = [] } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => getPortfolio(DEMO_TOKEN),
    enabled: false,
  })

  const { data: summary } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: () => getPortfolioSummary(DEMO_TOKEN),
    enabled: false,
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-white">Watchlist & Portfolio</h1>
        <p className="text-gray-500 text-sm mt-1">Track cards you're watching and positions you own.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-alpha-card border border-alpha-border rounded-xl p-1 w-fit">
        {(['watchlist', 'portfolio'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={clsx(
              'px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              activeTab === t ? 'bg-alpha-green text-black' : 'text-gray-400 hover:text-white'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'watchlist' ? (
        <div className="bg-alpha-card border border-alpha-border rounded-xl p-4">
          <h2 className="text-white font-semibold mb-4">Watchlist</h2>

          {/* Demo notice */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4 text-sm text-blue-300">
            Sign in to view and manage your watchlist. Cards you watch will appear here with live price updates.
          </div>

          <WatchlistTable
            items={watchlist}
            onRemove={(id) => {
              /* removeFromWatchlist(DEMO_TOKEN, id) */
            }}
            onSelectCard={setSelectedCard}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Portfolio summary */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Invested', value: `$${summary.total_invested.toFixed(2)}`, color: 'text-white' },
                { label: 'Current Value', value: `$${summary.current_value.toFixed(2)}`, color: 'text-white' },
                { label: 'Total Gain', value: `${summary.total_gain >= 0 ? '+' : ''}$${summary.total_gain.toFixed(2)}`, color: summary.total_gain >= 0 ? 'text-alpha-green' : 'text-alpha-red' },
                { label: 'ROI', value: `${summary.total_gain_pct >= 0 ? '+' : ''}${summary.total_gain_pct.toFixed(1)}%`, color: summary.total_gain_pct >= 0 ? 'text-alpha-green' : 'text-alpha-red' },
              ].map((s) => (
                <div key={s.label} className="bg-alpha-card border border-alpha-border rounded-xl p-4">
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className={clsx('text-2xl font-bold mt-1 tabular-nums', s.color)}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-alpha-card border border-alpha-border rounded-xl p-4">
            <h2 className="text-white font-semibold mb-4">Portfolio Positions</h2>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
              Sign in to view your portfolio and track unrealized gains/losses.
            </div>
          </div>
        </div>
      )}

      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  )
}
