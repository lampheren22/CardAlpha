import type {
  CardListItem,
  CardDetail,
  DashboardSummary,
  WatchlistItem,
  PortfolioItem,
  PortfolioSummary,
  Filters,
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

// ── Auth ──────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const form = new URLSearchParams({ username: email, password })
  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json()
}

export async function register(email: string, username: string, password: string) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  })
}

export async function getMe(token: string) {
  return apiFetch('/auth/me', { headers: authHeaders(token) })
}

// ── Dashboard ─────────────────────────────────────────────────────────
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    return await apiFetch<DashboardSummary>('/dashboard/summary')
  } catch {
    return MOCK_SUMMARY
  }
}

export async function getTopUndervalued(sport?: string): Promise<CardListItem[]> {
  try {
    const qs = sport ? `?sport=${sport}` : ''
    return await apiFetch<CardListItem[]>(`/dashboard/top-undervalued${qs}`)
  } catch {
    return filterBySport(MOCK_CARDS, sport)
  }
}

export async function getHighMomentum(): Promise<CardListItem[]> {
  try {
    return await apiFetch<CardListItem[]>('/dashboard/high-momentum')
  } catch {
    return [...MOCK_CARDS].sort((a, b) => b.alpha_score - a.alpha_score).slice(0, 8)
  }
}

export async function getRookieOpportunities(): Promise<CardListItem[]> {
  try {
    return await apiFetch<CardListItem[]>('/dashboard/rookie-opportunities')
  } catch {
    return MOCK_CARDS.filter((c) => c.is_rookie)
  }
}

export async function getLowPopBreakouts(): Promise<CardListItem[]> {
  try {
    return await apiFetch<CardListItem[]>('/dashboard/low-pop-breakouts')
  } catch {
    return MOCK_CARDS.filter((c) => c.population && c.population < 50)
  }
}

export async function getPokemonMovers(): Promise<CardListItem[]> {
  try {
    return await apiFetch<CardListItem[]>('/dashboard/pokemon-movers')
  } catch {
    return MOCK_CARDS.filter((c) => c.sport === 'Pokemon')
  }
}

// ── Cards ─────────────────────────────────────────────────────────────
export async function getCards(filters?: Filters): Promise<CardListItem[]> {
  try {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
      })
    }
    return await apiFetch<CardListItem[]>(`/cards?${params}`)
  } catch {
    return MOCK_CARDS
  }
}

export async function getCardDetail(id: number): Promise<CardDetail> {
  try {
    return await apiFetch<CardDetail>(`/cards/${id}`)
  } catch {
    return getMockCardDetail(id)
  }
}

// ── Watchlist ─────────────────────────────────────────────────────────
export async function getWatchlist(token: string): Promise<WatchlistItem[]> {
  return apiFetch<WatchlistItem[]>('/watchlist', { headers: authHeaders(token) })
}

export async function addToWatchlist(token: string, cardId: number) {
  return apiFetch('/watchlist', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ card_id: cardId }),
  })
}

export async function removeFromWatchlist(token: string, itemId: number) {
  return apiFetch(`/watchlist/${itemId}`, { method: 'DELETE', headers: authHeaders(token) })
}

// ── Portfolio ─────────────────────────────────────────────────────────
export async function getPortfolio(token: string): Promise<PortfolioItem[]> {
  return apiFetch<PortfolioItem[]>('/portfolio', { headers: authHeaders(token) })
}

export async function getPortfolioSummary(token: string): Promise<PortfolioSummary> {
  return apiFetch<PortfolioSummary>('/portfolio/summary', { headers: authHeaders(token) })
}

export async function addToPortfolio(
  token: string,
  data: { card_id: number; purchase_price: number; quantity: number; notes?: string }
) {
  return apiFetch('/portfolio', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
}

export async function removeFromPortfolio(token: string, itemId: number) {
  return apiFetch(`/portfolio/${itemId}`, { method: 'DELETE', headers: authHeaders(token) })
}

// ── Mock Data ──────────────────────────────────────────────────────────
function filterBySport(cards: CardListItem[], sport?: string) {
  if (!sport) return cards
  return cards.filter((c) => c.sport === sport)
}

const MOCK_SUMMARY: DashboardSummary = {
  total_analyzed: 18,
  buy_signals: 10,
  avg_alpha_score: 72,
  avg_est_roi: 38.2,
  momentum_cards: 10,
  rookie_cards: 5,
  low_pop_cards: 6,
}

export const MOCK_CARDS: CardListItem[] = [
  {
    id: 1, sport: 'MLB', player_name: 'Paul Skenes', set_name: '2024 Topps Series 1',
    card_number: '330', parallel_type: 'Gold Refractor', is_graded: true,
    grade_company: 'PSA', grade: '10', population: 18, is_rookie: true,
    serial_number: 50, print_run: 50, current_price: 285, price_90d_avg: 420,
    price_vs_90d_pct: -32.1, alpha_score: 85, recommendation: 'Strong Buy',
    estimated_roi: 40.0, risk_rating: 'Low', sell_through_rate: 82,
  },
  {
    id: 2, sport: 'MLB', player_name: 'Jackson Holliday', set_name: '2024 Topps Chrome',
    card_number: 'RC-12', parallel_type: 'Orange Refractor', is_graded: false,
    population: undefined, is_rookie: true, serial_number: 25, print_run: 25,
    current_price: 88, price_90d_avg: 145, price_vs_90d_pct: -39.3,
    alpha_score: 83, recommendation: 'Strong Buy', estimated_roi: 56.5,
    risk_rating: 'Medium', sell_through_rate: 65,
  },
  {
    id: 6, sport: 'NFL', player_name: 'Marvin Harrison Jr.', set_name: '2024 Panini Contenders',
    card_number: 'PT-MH', parallel_type: 'Playoff Ticket', is_graded: true,
    grade_company: 'PSA', grade: '10', population: 29, is_rookie: true,
    serial_number: 99, print_run: 99, current_price: 175, price_90d_avg: 260,
    price_vs_90d_pct: -32.7, alpha_score: 83, recommendation: 'Strong Buy',
    estimated_roi: 41.1, risk_rating: 'Low', sell_through_rate: 80,
  },
  {
    id: 7, sport: 'NFL', player_name: 'Jayden Daniels', set_name: '2024 Panini Prizm',
    card_number: 'RC-JD', parallel_type: 'Green Ice', is_graded: true,
    grade_company: 'BGS', grade: '9.5', population: 41, is_rookie: true,
    current_price: 195, price_90d_avg: 290, price_vs_90d_pct: -32.8,
    alpha_score: 79, recommendation: 'Strong Buy', estimated_roi: 41.3,
    risk_rating: 'Low', sell_through_rate: 78,
  },
  {
    id: 8, sport: 'NFL', player_name: 'Caleb Williams', set_name: '2024 Panini Prizm',
    card_number: 'RC-CW', parallel_type: 'Silver Prizm', is_graded: true,
    grade_company: 'PSA', grade: '10', population: 120, is_rookie: true,
    current_price: 145, price_90d_avg: 210, price_vs_90d_pct: -31.0,
    alpha_score: 77, recommendation: 'Strong Buy', estimated_roi: 37.6,
    risk_rating: 'Low', sell_through_rate: 75,
  },
  {
    id: 3, sport: 'MLB', player_name: 'Gunnar Henderson', set_name: '2024 Topps Finest',
    card_number: 'TF-GH', parallel_type: 'Gold Refractor', is_graded: true,
    grade_company: 'PSA', grade: '10', population: 22, is_rookie: false,
    serial_number: 10, print_run: 10, current_price: 340, price_90d_avg: 450,
    price_vs_90d_pct: -24.4, alpha_score: 73, recommendation: 'Buy',
    estimated_roi: 25.7, risk_rating: 'Low', sell_through_rate: 72,
  },
  {
    id: 4, sport: 'MLB', player_name: 'Elly De La Cruz', set_name: '2024 Topps Chrome',
    card_number: 'RC-ELC', parallel_type: 'Aqua Refractor', is_graded: true,
    grade_company: 'PSA', grade: '10', population: 31, is_rookie: true,
    serial_number: 25, print_run: 25, current_price: 195, price_90d_avg: 280,
    price_vs_90d_pct: -30.4, alpha_score: 76, recommendation: 'Buy',
    estimated_roi: 34.0, risk_rating: 'Low', sell_through_rate: 78,
  },
  {
    id: 9, sport: 'NFL', player_name: 'Bo Nix', set_name: '2024 Panini Prizm',
    card_number: 'RC-BN', parallel_type: 'Blue Wave', is_graded: true,
    grade_company: 'PSA', grade: '10', population: 88, is_rookie: true,
    current_price: 95, price_90d_avg: 145, price_vs_90d_pct: -34.5,
    alpha_score: 68, recommendation: 'Buy', estimated_roi: 28.0,
    risk_rating: 'Medium', sell_through_rate: 68,
  },
  {
    id: 11, sport: 'Pokemon', player_name: 'Charizard ex', set_name: '2023 Obsidian Flames',
    card_number: '215', parallel_type: 'Full Art', is_graded: true,
    grade_company: 'PSA', grade: '10', population: 890, is_rookie: false,
    current_price: 185, price_90d_avg: 265, price_vs_90d_pct: -30.2,
    alpha_score: 75, recommendation: 'Buy', estimated_roi: 32.0,
    risk_rating: 'Low', sell_through_rate: 85,
  },
  {
    id: 12, sport: 'Pokemon', player_name: 'Umbreon VMAX', set_name: '2021 Evolving Skies',
    card_number: '215', parallel_type: 'Alternate Art', is_graded: true,
    grade_company: 'PSA', grade: '10', population: 410, is_rookie: false,
    current_price: 320, price_90d_avg: 480, price_vs_90d_pct: -33.3,
    alpha_score: 78, recommendation: 'Strong Buy', estimated_roi: 38.0,
    risk_rating: 'Low', sell_through_rate: 79,
  },
]

function generateMockHistory(days = 90, start = 380, peak = 650, end = 285, peakDay = 55) {
  const points = []
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayIdx = days - i
    let price: number
    if (dayIdx <= peakDay) {
      price = start + ((peak - start) * dayIdx) / peakDay
    } else {
      price = peak + ((end - peak) * (dayIdx - peakDay)) / (days - peakDay)
    }
    price = Math.max(1, price + price * (Math.random() * 0.08 - 0.04))
    points.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
      volume: Math.floor(Math.random() * 12),
    })
  }
  return points
}

function getMockCardDetail(id: number): CardDetail {
  const card = MOCK_CARDS.find((c) => c.id === id) || MOCK_CARDS[0]
  return {
    card,
    market_data: {
      current_price: card.current_price,
      price_7d_avg: card.current_price * 1.08,
      price_30d_avg: card.current_price * 1.19,
      price_90d_avg: card.price_90d_avg,
      price_ath: card.price_90d_avg * 1.55,
      price_atl: card.current_price * 0.63,
      sales_volume_7d: 8,
      sales_volume_14d: 13,
      sales_volume_30d: 25,
      sell_through_rate: card.sell_through_rate,
      avg_days_to_sell: 2.1,
      sales_per_week: 7.0,
      price_history: generateMockHistory(),
    },
    alpha_score: {
      total: card.alpha_score,
      recommendation: card.recommendation as 'Strong Buy' | 'Buy' | 'Watch' | 'Avoid',
      breakdown: {
        below_90d_avg: { score: 20.1, max: 25, value: Math.abs(card.price_vs_90d_pct) },
        below_ath: { score: 16.8, max: 20, value: 56.2 },
        volume_momentum: { score: 15, max: 15, value: 1.6 },
        rookie_status: { score: card.is_rookie ? 10 : 0, max: 10 },
        low_population: { score: card.population && card.population < 25 ? 8 : 5, max: 10, value: card.population },
        serial_scarcity: { score: card.serial_number && card.serial_number <= 50 ? 7 : 0, max: 10, value: card.serial_number },
        performance_momentum: { score: 4.3, max: 5 },
        set_popularity: { score: 4.5, max: 5 },
      },
    },
    projection: {
      fair_value_low: card.price_90d_avg * 0.9,
      fair_value_high: card.price_90d_avg * 1.1,
      conservative_exit: card.price_90d_avg,
      aggressive_exit: card.price_90d_avg * 1.55 * 0.75,
      estimated_roi: card.estimated_roi,
      risk_rating: card.risk_rating as 'Low' | 'Medium' | 'High',
    },
  }
}
