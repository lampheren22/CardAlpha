'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import type { PricePoint } from '@/lib/types'

interface Props {
  data: PricePoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-alpha-elevated border border-alpha-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0].value} sales</p>
    </div>
  )
}

export default function VolumeChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
        <YAxis tick={{ fontSize: 10, fill: '#8892a4' }} tickLine={false} axisLine={false} width={24} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="#1d4ed8" opacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
