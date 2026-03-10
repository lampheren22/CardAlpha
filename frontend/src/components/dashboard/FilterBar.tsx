'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, RotateCcw, Check } from 'lucide-react'
import type { Filters } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  onApply: (filters: Filters) => void
}

export default function FilterBar({ onApply }: Props) {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({})

  const set = (key: keyof Filters, value: any) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  const reset = () => {
    setFilters({})
    onApply({})
  }

  const apply = () => {
    onApply(filters)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
          open
            ? 'border-alpha-green/50 bg-alpha-green/10 text-alpha-green'
            : 'border-alpha-border text-gray-400 hover:text-white hover:border-gray-500'
        )}
      >
        <span className="text-xs">≡≡</span> Advanced
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-80 bg-alpha-elevated border border-alpha-border rounded-xl p-4 shadow-2xl">
          <h3 className="text-sm font-semibold text-white mb-4">Advanced Filters</h3>

          <div className="space-y-3 text-sm">
            {/* Sport */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Sport</label>
              <div className="flex gap-2">
                {['MLB', 'NFL', 'Pokemon'].map((s) => (
                  <button
                    key={s}
                    onClick={() => set('sport', filters.sport === s ? undefined : s)}
                    className={clsx(
                      'flex-1 py-1 rounded text-xs font-medium border transition-colors',
                      filters.sport === s
                        ? 'border-alpha-green bg-alpha-green/20 text-alpha-green'
                        : 'border-alpha-border text-gray-400 hover:text-white'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Max Price ($)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={filters.max_price || ''}
                onChange={(e) => set('max_price', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-alpha-card border border-alpha-border rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-alpha-green/50"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'is_rookie', label: 'Rookie Only' },
                { key: 'serial_numbered', label: 'Serial Numbered' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => set(key as keyof Filters, !(filters as any)[key])}
                  className={clsx(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-colors',
                    (filters as any)[key]
                      ? 'border-alpha-green bg-alpha-green/20 text-alpha-green'
                      : 'border-alpha-border text-gray-400'
                  )}
                >
                  <div className={clsx('w-3 h-3 rounded border flex items-center justify-center',
                    (filters as any)[key] ? 'bg-alpha-green border-alpha-green' : 'border-gray-500'
                  )}>
                    {(filters as any)[key] && <Check size={8} className="text-black" />}
                  </div>
                  {label}
                </button>
              ))}
            </div>

            {/* Min Alpha Score */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Min Alpha Score: <span className="text-white">{filters.min_alpha_score || 0}</span>
              </label>
              <input
                type="range" min="0" max="100" step="5"
                value={filters.min_alpha_score || 0}
                onChange={(e) => set('min_alpha_score', Number(e.target.value))}
                className="w-full accent-alpha-green"
              />
            </div>

            {/* Min ROI */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Min ROI (%)</label>
              <input
                type="number"
                placeholder="e.g. 20"
                value={filters.min_roi || ''}
                onChange={(e) => set('min_roi', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-alpha-card border border-alpha-border rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-alpha-green/50"
              />
            </div>

            {/* Max Population */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Max Population</label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={filters.population_max || ''}
                onChange={(e) => set('population_max', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-alpha-card border border-alpha-border rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-alpha-green/50"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={reset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-alpha-border text-gray-400 hover:text-white text-xs transition-colors"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              onClick={apply}
              className="flex-1 py-1.5 rounded-lg bg-alpha-green text-black font-semibold text-xs hover:bg-alpha-green/90 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
