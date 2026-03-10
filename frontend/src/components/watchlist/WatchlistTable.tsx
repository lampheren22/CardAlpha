'use client'

import { Trash2 } from 'lucide-react'
import type { WatchlistItem } from '@/lib/types'
import AlphaScoreGauge from '@/components/cards/AlphaScoreGauge'
import clsx from 'clsx'

interface Props {
  items: WatchlistItem[]
  onRemove: (id: number) => void
  onSelectCard: (card: any) => void
}

export default function WatchlistTable({ items, onRemove, onSelectCard }: Props) {
  if (!items.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg mb-1">No cards in watchlist</p>
        <p className="text-sm">Click "Watchlist" on any card to add it here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-alpha-border">
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Card</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Sport</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Price</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Alpha Score</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Est. ROI</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Added</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const card = item.card
            return (
              <tr
                key={item.id}
                className="border-b border-alpha-border/50 hover:bg-white/[0.03] cursor-pointer transition-colors"
                onClick={() => onSelectCard(card)}
              >
                <td className="px-3 py-3">
                  <p className="text-white font-medium text-sm">{card?.player_name}</p>
                  <p className="text-gray-500 text-xs">{card?.set_name} · {card?.parallel_type}</p>
                </td>
                <td className="px-3 py-3">
                  <span className={clsx(
                    'px-2 py-0.5 rounded text-[10px] font-bold',
                    card?.sport === 'MLB' && 'bg-blue-600 text-white',
                    card?.sport === 'NFL' && 'bg-red-600 text-white',
                    card?.sport === 'Pokemon' && 'bg-yellow-500 text-black',
                  )}>{card?.sport}</span>
                </td>
                <td className="px-3 py-3 text-white text-sm tabular-nums">
                  ${card?.current_price?.toFixed(2)}
                </td>
                <td className="px-3 py-3">
                  {card?.alpha_score && <AlphaScoreGauge score={card.alpha_score} size="sm" />}
                </td>
                <td className="px-3 py-3 text-alpha-green text-sm tabular-nums">
                  +{card?.estimated_roi?.toFixed(1)}%
                </td>
                <td className="px-3 py-3 text-gray-500 text-xs">
                  {new Date(item.added_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
                    className="p-1.5 rounded hover:bg-alpha-red/20 text-gray-500 hover:text-alpha-red transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
