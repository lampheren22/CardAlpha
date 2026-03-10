'use client'

interface Props {
  score: number
  size?: 'sm' | 'lg'
}

const RECOMMENDATION_COLOR: Record<string, string> = {
  'Strong Buy': '#00d4aa',
  Buy: '#22c55e',
  Watch: '#f59e0b',
  Avoid: '#ff4757',
}

export default function AlphaScoreGauge({ score, size = 'sm' }: Props) {
  const isLg = size === 'lg'
  const dim = isLg ? 100 : 44
  const strokeWidth = isLg ? 8 : 5
  const r = (dim - strokeWidth) / 2
  const cx = dim / 2
  const cy = dim / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, score)) / 100
  const dashOffset = circumference * (1 - pct)

  // Pick colour based on score
  let color = '#ff4757'
  if (score >= 80) color = '#00d4aa'
  else if (score >= 65) color = '#22c55e'
  else if (score >= 50) color = '#f59e0b'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#1e2d3d"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className="absolute font-bold tabular-nums"
        style={{
          fontSize: isLg ? 24 : 12,
          color: color,
          lineHeight: 1,
        }}
      >
        {score}
      </span>
    </div>
  )
}
