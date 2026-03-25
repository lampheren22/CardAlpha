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

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || `Request failed (${res.status})`)
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
  return apiFetch<DashboardSummary>('/dashboard/summary')
}

export async function getTopUndervalued(sport?: string): Promise<CardListItem[]> {
  const qs = sport ? `?sport=${sport}` : ''
  return apiFetch<CardListItem[]>(`/dashboard/top-undervalued${qs}`)
}

export async function getHighMomentum(): Promise<CardListItem[]> {
  return apiFetch<CardListItem[]>('/dashboard/high-momentum')
}

export async function getRookieOpportunities(): Promise<CardListItem[]> {
  return apiFetch<CardListItem[]>('/dashboard/rookie-opportunities')
}

export async function getLowPopBreakouts(): Promise<CardListItem[]> {
  return apiFetch<CardListItem[]>('/dashboard/low-pop-breakouts')
}

export async function getPokemonMovers(): Promise<CardListItem[]> {
  return apiFetch<CardListItem[]>('/dashboard/pokemon-movers')
}

// ── Cards ─────────────────────────────────────────────────────────────

export async function searchCards(query: string): Promise<CardListItem[]> {
  if (!query || query.trim().length < 2) return []
  const params = new URLSearchParams({ search: query.trim(), limit: '50' })
  return apiFetch<CardListItem[]>(`/cards?${params}`)
}

export async function getCards(filters?: Filters): Promise<CardListItem[]> {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
    })
  }
  return apiFetch<CardListItem[]>(`/cards?${params}`)
}

export async function getCardDetail(id: number): Promise<CardDetail> {
  return apiFetch<CardDetail>(`/cards/${id}`)
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
