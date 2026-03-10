'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { PricePoint } from '@/lib/types'

interface Props {
  data: PricePoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-alpha-elevated border border-alpha-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">${payload[0].value.toFixed(2)}</p>
    </div>
  )
}

export default function PriceChart({ data }: Props) {
  const filtered = data.filter((_, i) => i % 3 === 0) // thin out labels

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#8892a4' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const d = new Date(v)
            return `${d.getMonth() + 1}/${d.getDate()}`
          }}
          interval={Math.floor(data.length / 5)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#8892a4' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
