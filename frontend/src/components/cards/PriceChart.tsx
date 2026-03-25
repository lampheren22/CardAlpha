'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import type { PricePoint } from '@/lib/types'

interface Props {
  data: PricePoint[]
}

const RANGES = ['7D', '30D', '90D', '1Y', 'ALL'] as const
type Range = typeof RANGES[number]

const RANGE_DAYS: Record<Range, number> = {
  '7D': 7,
  '30D': 30,
  '90D': 90,
  '1Y': 365,
  'ALL': 9999,
}

function formatDate(dateStr: string, range: Range): string {
  const d = new Date(dateStr)
  if (range === '7D') {
    return d.toLocaleDateString('en-US', { weekday: 'short' })
  }
  if (range === '1Y' || range === 'ALL') {
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-alpha-elevated border border-alpha-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">${payload[0].value?.toFixed(2)}</p>
      {payload[1] && (
        <p className="text-amber-400 text-xs">7D avg: ${payload[1].value?.toFixed(2)}</p>
      )}
    </div>
  )
}

export default function PriceChart({ data }: Props) {
  const [range, setRange] = useState<Range>('90D')

  const filtered = useMemo(() => {
    if (!data?.length) return []
    const cutoffMs = Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000
    const sliced = data
      .filter((p) => new Date(p.date).getTime() >= cutoffMs)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return sliced.length > 0 ? sliced : data.slice().sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [data, range])

  // 7-day rolling average
  const withMovingAvg = useMemo(() => {
    return filtered.map((point, i) => {
      const window = filtered.slice(Math.max(0, i - 6), i + 1)
      const avg = window.reduce((sum, p) => sum + p.price, 0) / window.length
      return {
        ...point,
        movingAvg: +avg.toFixed(2),
        label: formatDate(point.date, range),
      }
    })
  }, [filtered, range])

  // Identify price spikes and dips for reference lines
  const avgPrice = useMemo(() => {
    if (!withMovingAvg.length) return 0
    return withMovingAvg.reduce((s, p) => s + p.price, 0) / withMovingAvg.length
  }, [withMovingAvg])

  if (!data?.length) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
        No price history available
      </div>
    )
  }

  return (
    <div>
      {/* Range selector */}
      <div className="flex gap-1 mb-3">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              range === r
                ? 'bg-alpha-green text-black'
                : 'bg-alpha-card text-gray-400 hover:text-white border border-alpha-border'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={withMovingAvg} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#8892a4' }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.floor(withMovingAvg.length / 5) - 1)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#8892a4' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Average reference line */}
          {avgPrice > 0 && (
            <ReferenceLine
              y={avgPrice}
              stroke="#374151"
              strokeDasharray="4 2"
              label={{ value: 'avg', position: 'insideTopRight', fill: '#6b7280', fontSize: 9 }}
            />
          )}
          {/* Price line */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#00d4aa"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#00d4aa' }}
          />
          {/* 7D moving average */}
          <Line
            type="monotone"
            dataKey="movingAvg"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-alpha-green rounded" />
          <span className="text-gray-500 text-[10px]">Price</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-amber-400 rounded" style={{ borderTop: '1px dashed' }} />
          <span className="text-gray-500 text-[10px]">7D Moving Avg</span>
        </div>
      </div>
    </div>
  )
}
