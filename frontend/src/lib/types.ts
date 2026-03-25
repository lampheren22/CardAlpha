export interface Card {
  id: number
  sport: 'MLB' | 'NFL' | 'Pokemon'
  player_name: string
  set_name: string
  card_number?: string
  parallel_type?: string
  is_graded: boolean
  grade_company?: string
  grade?: string
  population?: number
  is_rookie: boolean
  serial_number?: number
  print_run?: number
  image_url?: string
  created_at?: string
}

export interface MarketData {
  current_price: number
  price_7d_avg: number
  price_30d_avg: number
  price_90d_avg: number
  price_ath: number
  price_atl: number
  sales_volume_7d: number
  sales_volume_14d: number
  sales_volume_30d: number
  sell_through_rate: number
  avg_days_to_sell: number
  sales_per_week: number
  price_history: PricePoint[]
  last_updated?: string
}

export interface PricePoint {
  date: string
  price: number
  volume: number
}

export interface AlphaScoreFactor {
  score: number
  max: number
  value?: number
}

export interface AlphaScoreBreakdown {
  total: number
  recommendation: 'Strong Buy' | 'Buy' | 'Watch' | 'Avoid'
  breakdown: {
    below_90d_avg: AlphaScoreFactor
    below_ath: AlphaScoreFactor
    volume_momentum: AlphaScoreFactor
    rookie_status: AlphaScoreFactor
    low_population: AlphaScoreFactor
    serial_scarcity: AlphaScoreFactor
    performance_momentum: AlphaScoreFactor
    set_popularity: AlphaScoreFactor
  }
}

export interface Projection {
  fair_value_low: number
  fair_value_high: number
  conservative_exit: number
  aggressive_exit: number
  estimated_roi: number
  risk_rating: 'Low' | 'Medium' | 'High'
}

export interface CardDetail {
  card: CardListItem
  market_data: MarketData
  alpha_score: AlphaScoreBreakdown
  projection: Projection
  liquidity?: LiquidityDetail
}

export interface CardListItem extends Card {
  current_price: number
  price_vs_90d_pct: number
  price_90d_avg: number
  alpha_score: number
  recommendation: string
  estimated_roi: number
  risk_rating: string
  sell_through_rate: number
  liquidity_score?: string
  liquidity_numeric?: number
  reasoning?: string
}

export interface LiquidityDetail {
  liquidity_score: string
  liquidity_numeric: number
  avg_days_to_sell?: number
  sales_per_week?: number
  sales_30d: number
  buy_box: boolean
}

export interface DashboardSummary {
  total_analyzed: number
  buy_signals: number
  avg_alpha_score: number
  avg_est_roi: number
  momentum_cards: number
  rookie_cards: number
  low_pop_cards: number
}

export interface WatchlistItem {
  id: number
  card_id: number
  card: CardListItem
  added_at: string
}

export interface PortfolioItem {
  id: number
  card_id: number
  card: CardListItem
  purchase_price: number
  purchase_date: string
  quantity: number
  notes?: string
  current_value: number
  unrealized_gain: number
  unrealized_gain_pct: number
  added_at: string
}

export interface PortfolioSummary {
  total_invested: number
  current_value: number
  total_gain: number
  total_gain_pct: number
  num_positions: number
}

export interface Filters {
  sport?: string
  max_price?: number
  is_rookie?: boolean
  grade?: string
  population_max?: number
  serial_numbered?: boolean
  min_roi?: number
  min_alpha_score?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
