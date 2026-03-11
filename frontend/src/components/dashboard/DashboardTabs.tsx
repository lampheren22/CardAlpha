'use client'

import { useState } from 'react'
import { Star, TrendingUp, User, AlertTriangle, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  getTopUndervalued,
  getHighMomentum,
  getRookieOpportunities,
  getLowPopBreakouts,
  getPokemonMovers,
} from '@/lib/api'
import type { CardListItem, Filters } from '@/lib/types'
import CardTable from './CardTable'
import clsx from 'clsx'

interface Props {
  onSelectCard: (card: CardListItem) => void
  sportFilter?: string
  filters?: Filters
}

const tabs = [
  { id: 'undervalued', label: 'Top Undervalued', icon: Star, activeClass: 'text-amber-400 border-amber-400' },
  { id: 'momentum', label: 'High Momentum', icon: TrendingUp, activeClass: 'text-blue-400 border-blue-400' },
  { id: 'rookies', label: 'Rookie Opportunities', icon: User, activeClass: 'text-alpha-green border-alpha-green' },
  { id: 'lowpop', label: 'Low Pop Breakouts', icon: AlertTriangle, activeClass: 'text-orange-400 border-orange-400' },
  { id: 'pokemon', label: 'Pokemon Movers', icon: Sparkles, activeClass: 'text-yellow-400 border-yellow-400' },
]

export default function DashboardTabs({ onSelectCard, sportFilter, filters }: Props) {
  const [activeTab, setActiveTab] = useState('undervalued')

  const { data: undervalued = [], isLoading: l1 } = useQuery({
    queryKey: ['top-undervalued', sportFilter],
    queryFn: () => getTopUndervalued(sportFilter),
  })
  const { data: momentum = [], isLoading: l2 } = useQuery({
    queryKey: ['high-momentum'],
    queryFn: getHighMomentum,
  })
  const { data: rookies = [], isLoading: l3 } = useQuery({
    queryKey: ['rookies'],
    queryFn: getRookieOpportunities,
  })
  const { data: lowpop = [], isLoading: l4 } = useQuery({
    queryKey: ['low-pop'],
    queryFn: getLowPopBreakouts,
  })
  const { data: pokemon = [], isLoading: l5 } = useQuery({
    queryKey: ['pokemon'],
    queryFn: getPokemonMovers,
  })

  const dataMap: Record<string, CardListItem[]> = {
    undervalued, momentum, rookies, lowpop, pokemon,
  }
  const loadingMap: Record<string, boolean> = {
    undervalued: l1, momentum: l2, rookies: l3, lowpop: l4, pokemon: l5,
  }

  const TABLE_LABELS: Record<string, string> = {
    undervalued: 'Top 10 Undervalued Cards Today',
    momentum: 'High Momentum Cards',
    rookies: 'Rookie Opportunities',
    lowpop: 'Low Pop Breakouts',
    pokemon: 'Pokémon Movers',
  }

  const currentData = dataMap[activeTab] || []
  const isLoading = loadingMap[activeTab]

  return (
    <div className="bg-alpha-card border border-alpha-border rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center overflow-x-auto border-b border-alpha-border px-4 pt-3 gap-1">
        {tabs.map(({ id, label, icon: Icon, activeClass }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                isActive
                  ? activeClass
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="p-4">
        <h3 className="text-white font-semibold mb-4">{TABLE_LABELS[activeTab]}</h3>
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Loading…</div>
        ) : currentData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
            <p className="text-gray-400 font-medium">No cards yet</p>
            <p className="text-gray-600 text-sm">
              Add cards via the{' '}
              <a href="/admin" className="text-alpha-green hover:underline">Admin panel</a>{' '}
              to populate this view.
            </p>
          </div>
        ) : (
          <CardTable cards={currentData} onSelectCard={onSelectCard} />
        )}
      </div>
    </div>
  )
}
