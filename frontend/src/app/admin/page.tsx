'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Sliders, Users, BarChart2, X, Check, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Auth helpers ───────────────────────────────────────────────────────

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('ca_token') || ''
}

async function adminFetch(path: string, options?: RequestInit) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  sport: 'MLB',
  player_name: '',
  set_name: '',
  card_number: '',
  parallel_type: '',
  is_graded: false,
  grade_company: '',
  grade: '',
  population: '',
  is_rookie: false,
  serial_number: '',
  print_run: '',
  image_url: '',
  current_price: '',
  price_7d_avg: '',
  price_30d_avg: '',
  price_90d_avg: '',
  price_ath: '',
  price_atl: '',
  sales_volume_7d: '',
  sales_volume_14d: '',
  sales_volume_30d: '',
  sell_through_rate: '',
  avg_days_to_sell: '',
  sales_per_week: '',
}

type FormState = typeof EMPTY_FORM

function toPayload(f: FormState) {
  const num = (v: string) => (v === '' ? null : Number(v))
  return {
    sport: f.sport,
    player_name: f.player_name,
    set_name: f.set_name,
    card_number: f.card_number || null,
    parallel_type: f.parallel_type || null,
    is_graded: f.is_graded,
    grade_company: f.grade_company || null,
    grade: f.grade || null,
    population: num(f.population),
    is_rookie: f.is_rookie,
    serial_number: num(f.serial_number),
    print_run: num(f.print_run),
    image_url: f.image_url || null,
    current_price: Number(f.current_price),
    price_7d_avg: num(f.price_7d_avg),
    price_30d_avg: num(f.price_30d_avg),
    price_90d_avg: num(f.price_90d_avg),
    price_ath: num(f.price_ath),
    price_atl: num(f.price_atl),
    sales_volume_7d: num(f.sales_volume_7d) ?? 0,
    sales_volume_14d: num(f.sales_volume_14d) ?? 0,
    sales_volume_30d: num(f.sales_volume_30d) ?? 0,
    sell_through_rate: num(f.sell_through_rate) ?? 0,
    avg_days_to_sell: num(f.avg_days_to_sell),
    sales_per_week: num(f.sales_per_week),
  }
}

function fromCard(card: any): FormState {
  const str = (v: any) => (v == null ? '' : String(v))
  return {
    sport: card.sport ?? 'MLB',
    player_name: card.player_name ?? '',
    set_name: card.set_name ?? '',
    card_number: str(card.card_number),
    parallel_type: str(card.parallel_type),
    is_graded: card.is_graded ?? false,
    grade_company: str(card.grade_company),
    grade: str(card.grade),
    population: str(card.population),
    is_rookie: card.is_rookie ?? false,
    serial_number: str(card.serial_number),
    print_run: str(card.print_run),
    image_url: str(card.image_url),
    current_price: str(card.current_price),
    price_7d_avg: str(card.price_7d_avg),
    price_30d_avg: str(card.price_30d_avg),
    price_90d_avg: str(card.price_90d_avg),
    price_ath: str(card.price_ath),
    price_atl: str(card.price_atl),
    sales_volume_7d: str(card.sales_volume_7d),
    sales_volume_14d: str(card.sales_volume_14d),
    sales_volume_30d: str(card.sales_volume_30d),
    sell_through_rate: str(card.sell_through_rate),
    avg_days_to_sell: str(card.avg_days_to_sell),
    sales_per_week: str(card.sales_per_week),
  }
}

// ── Login gate ─────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('admin@cardalpha.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const form = new URLSearchParams({ username: email, password })
      const res = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      })
      if (!res.ok) throw new Error('Invalid credentials')
      const data = await res.json()
      if (!data.user?.is_admin) throw new Error('Admin access required')
      localStorage.setItem('ca_token', data.access_token)
      onLogin()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-alpha-card border border-alpha-border rounded-2xl p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-white mb-6">Admin Login</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-alpha-elevated border border-alpha-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-alpha-green/50" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-alpha-elevated border border-alpha-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-alpha-green/50" />
          </div>
          {error && <p className="text-alpha-red text-xs flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2 rounded-lg bg-alpha-green text-black font-semibold text-sm hover:bg-alpha-green/90 disabled:opacity-50 transition-colors">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Card Form Modal ────────────────────────────────────────────────────

function CardFormModal({
  initial,
  cardId,
  onClose,
  onSave,
}: {
  initial: FormState
  cardId?: number
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState<FormState>(initial)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k: keyof FormState, v: any) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.player_name || !form.set_name || !form.current_price) {
      setError('Player name, set name, and current price are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = toPayload(form)
      if (cardId) {
        await adminFetch(`/admin/cards/${cardId}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await adminFetch('/admin/cards', { method: 'POST', body: JSON.stringify(payload) })
      }
      onSave()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, name, type = 'text', placeholder = '' }: { label: string; name: keyof FormState; type?: string; placeholder?: string }) => (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[name] as string}
        onChange={e => set(name, e.target.value)}
        className="w-full bg-alpha-bg border border-alpha-border rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-alpha-green/50"
      />
    </div>
  )

  const Toggle = ({ label, name }: { label: string; name: 'is_graded' | 'is_rookie' }) => (
    <button type="button" onClick={() => set(name, !form[name])}
      className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
        form[name] ? 'border-alpha-green bg-alpha-green/20 text-alpha-green' : 'border-alpha-border text-gray-400'
      )}>
      <div className={clsx('w-3.5 h-3.5 rounded border flex items-center justify-center',
        form[name] ? 'bg-alpha-green border-alpha-green' : 'border-gray-500'
      )}>
        {form[name] && <Check size={9} className="text-black" />}
      </div>
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-alpha-elevated border border-alpha-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-alpha-elevated border-b border-alpha-border px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{cardId ? 'Edit Card' : 'Add New Card'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-6">
          {/* Card Info */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">Card Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Sport *</label>
                <select value={form.sport} onChange={e => set('sport', e.target.value)}
                  className="w-full bg-alpha-bg border border-alpha-border rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-alpha-green/50">
                  <option>MLB</option>
                  <option>NFL</option>
                  <option>Pokemon</option>
                </select>
              </div>
              <Field label="Player / Character Name *" name="player_name" placeholder="e.g. Paul Skenes" />
              <Field label="Set Name *" name="set_name" placeholder="e.g. 2024 Topps Series 1" />
              <Field label="Card Number" name="card_number" placeholder="e.g. 330" />
              <Field label="Parallel / Variation" name="parallel_type" placeholder="e.g. Gold Refractor" />
              <Field label="Image URL" name="image_url" placeholder="https://..." />
            </div>
            <div className="flex gap-3 mt-3 flex-wrap">
              <Toggle label="Rookie Card" name="is_rookie" />
              <Toggle label="Graded" name="is_graded" />
            </div>
            {form.is_graded && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Grading Company</label>
                  <select value={form.grade_company} onChange={e => set('grade_company', e.target.value)}
                    className="w-full bg-alpha-bg border border-alpha-border rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-alpha-green/50">
                    <option value="">—</option>
                    <option>PSA</option>
                    <option>BGS</option>
                    <option>SGC</option>
                    <option>CGC</option>
                  </select>
                </div>
                <Field label="Grade" name="grade" placeholder="e.g. 10" />
                <Field label="Population" name="population" type="number" placeholder="e.g. 18" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Serial Number (e.g. 50 for /50)" name="serial_number" type="number" placeholder="Leave blank if not numbered" />
              <Field label="Print Run" name="print_run" type="number" placeholder="Leave blank if unknown" />
            </div>
          </div>

          {/* Market Data */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">Market Data</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Current Price ($) *" name="current_price" type="number" placeholder="e.g. 285.00" />
              <Field label="7-Day Avg ($)" name="price_7d_avg" type="number" placeholder="e.g. 310.00" />
              <Field label="30-Day Avg ($)" name="price_30d_avg" type="number" placeholder="e.g. 340.00" />
              <Field label="90-Day Avg ($)" name="price_90d_avg" type="number" placeholder="e.g. 420.00" />
              <Field label="All-Time High ($)" name="price_ath" type="number" placeholder="e.g. 650.00" />
              <Field label="All-Time Low ($)" name="price_atl" type="number" placeholder="e.g. 180.00" />
            </div>
          </div>

          {/* Volume & Liquidity */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">Volume & Liquidity</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sales Volume (7-day)" name="sales_volume_7d" type="number" placeholder="e.g. 8" />
              <Field label="Sales Volume (14-day)" name="sales_volume_14d" type="number" placeholder="e.g. 13" />
              <Field label="Sales Volume (30-day)" name="sales_volume_30d" type="number" placeholder="e.g. 25" />
              <Field label="Sell-Through Rate (%)" name="sell_through_rate" type="number" placeholder="e.g. 82" />
              <Field label="Avg Days to Sell" name="avg_days_to_sell" type="number" placeholder="e.g. 2.1" />
              <Field label="Sales Per Week" name="sales_per_week" type="number" placeholder="e.g. 7.0" />
            </div>
          </div>

          {error && (
            <p className="text-alpha-red text-xs flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle size={13} /> {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-alpha-border text-gray-400 hover:text-white text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg bg-alpha-green text-black font-semibold text-sm hover:bg-alpha-green/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : cardId ? 'Save Changes' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Admin Page ────────────────────────────────────────────────────

const DEFAULT_WEIGHTS = {
  below_90d_avg: 25, below_ath: 20, volume_momentum: 15, rookie_status: 10,
  low_population: 10, serial_scarcity: 10, performance_momentum: 5, set_popularity: 5,
}
const WEIGHT_LABELS: Record<string, string> = {
  below_90d_avg: 'Below 90-Day Avg', below_ath: 'Below All-Time High',
  volume_momentum: 'Volume Momentum', rookie_status: 'Rookie Status',
  low_population: 'Low Population', serial_scarcity: 'Serial Scarcity',
  performance_momentum: 'Performance Momentum', set_popularity: 'Set Popularity',
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => !!getToken())
  const [activeTab, setActiveTab] = useState<'cards' | 'weights' | 'users'>('cards')
  const [showForm, setShowForm] = useState(false)
  const [editCard, setEditCard] = useState<any>(null)
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const qc = useQueryClient()

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['admin-cards'],
    queryFn: () => adminFetch('/admin/cards'),
    enabled: authed,
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminFetch('/admin/stats'),
    enabled: authed,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminFetch('/admin/users'),
    enabled: authed && activeTab === 'users',
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`/admin/cards/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-cards'] }); setDeleteConfirm(null) },
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-cards'] })
    qc.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Manage cards, market data, and platform settings.</p>
        </div>
        <button onClick={() => { localStorage.removeItem('ca_token'); setAuthed(false) }}
          className="px-3 py-1.5 rounded-lg border border-alpha-border text-gray-400 hover:text-white text-sm transition-colors">
          Sign Out
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {[
            { label: 'Total Cards', value: stats.total_cards },
            { label: 'MLB', value: stats.mlb_cards },
            { label: 'NFL', value: stats.nfl_cards },
            { label: 'Pokémon', value: stats.pokemon_cards },
            { label: 'Users', value: stats.total_users },
            { label: 'Pro', value: stats.pro_users },
            { label: 'Watchlists', value: stats.watchlist_items },
          ].map(s => (
            <div key={s.label} className="bg-alpha-card border border-alpha-border rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-alpha-card border border-alpha-border rounded-xl p-1 w-fit">
        {(['cards', 'weights', 'users'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              activeTab === t ? 'bg-alpha-green text-black' : 'text-gray-400 hover:text-white'
            )}>
            {t === 'cards' ? `Cards (${cards.length})` : t === 'weights' ? 'Scoring' : 'Users'}
          </button>
        ))}
      </div>

      {/* Cards tab */}
      {activeTab === 'cards' && (
        <div className="bg-alpha-card border border-alpha-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-alpha-border">
            <h2 className="text-white font-semibold">Card Database</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const r = await adminFetch('/admin/seed-defaults', { method: 'POST' })
                    refresh()
                    alert(`Loaded ${r.added} cards (${r.skipped} already existed)`)
                  } catch (e: any) { alert(e.message) }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-alpha-green/40 text-alpha-green text-sm hover:bg-alpha-green/10 transition-colors"
              >
                Load Default Cards
              </button>
              <button onClick={() => { setEditCard(null); setShowForm(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-alpha-green text-black font-semibold text-sm hover:bg-alpha-green/90 transition-colors">
                <Plus size={14} /> Add Card
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Loading…</div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
              <p className="text-gray-400 font-medium">No cards in the database yet.</p>
              <p className="text-gray-600 text-sm">Click "Add Card" to start building your database.</p>
              <button onClick={() => { setEditCard(null); setShowForm(true) }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-alpha-green text-black font-semibold text-sm mt-1">
                <Plus size={14} /> Add Your First Card
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-alpha-border">
                    {['Card', 'Sport', 'Price', 'Alpha', 'ROI', 'Risk', 'Sell-Thru', ''].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card: any) => (
                    <tr key={card.id} className="border-b border-alpha-border/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-3">
                        <p className="text-white font-medium text-sm">{card.player_name}</p>
                        <p className="text-gray-500 text-xs">{card.set_name}{card.parallel_type ? ` · ${card.parallel_type}` : ''}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {card.is_rookie && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-alpha-green/20 text-alpha-green border border-alpha-green/30">RC</span>}
                          {card.serial_number && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">/{card.serial_number}</span>}
                          {card.grade && <span className="px-1.5 py-0.5 rounded text-[10px] text-gray-400 border border-alpha-border">{card.grade_company} {card.grade}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold',
                          card.sport === 'MLB' ? 'bg-blue-600 text-white' :
                          card.sport === 'NFL' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-black'
                        )}>{card.sport}</span>
                      </td>
                      <td className="px-3 py-3 text-white text-sm tabular-nums">${card.current_price?.toFixed(2)}</td>
                      <td className="px-3 py-3">
                        <span className={clsx('text-sm font-bold tabular-nums',
                          card.alpha_score >= 80 ? 'text-emerald-400' :
                          card.alpha_score >= 65 ? 'text-green-400' :
                          card.alpha_score >= 50 ? 'text-yellow-400' : 'text-red-400'
                        )}>{card.alpha_score}</span>
                      </td>
                      <td className="px-3 py-3 text-alpha-green text-sm tabular-nums">+{card.estimated_roi?.toFixed(1)}%</td>
                      <td className="px-3 py-3">
                        <span className={clsx('text-sm font-medium',
                          card.risk_rating === 'Low' ? 'text-emerald-400' :
                          card.risk_rating === 'Medium' ? 'text-yellow-400' : 'text-alpha-red'
                        )}>{card.risk_rating}</span>
                      </td>
                      <td className="px-3 py-3 text-gray-300 text-sm tabular-nums">{card.sell_through_rate?.toFixed(0)}%</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditCard(card); setShowForm(true) }}
                            className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                            <Pencil size={14} />
                          </button>
                          {deleteConfirm === card.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => deleteMutation.mutate(card.id)}
                                className="px-2 py-1 rounded text-[10px] bg-alpha-red text-white">Confirm</button>
                              <button onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 rounded text-[10px] border border-alpha-border text-gray-400">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(card.id)}
                              className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-alpha-red transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Weights tab */}
      {activeTab === 'weights' && (
        <div className="bg-alpha-card border border-alpha-border rounded-xl p-5 max-w-lg">
          <div className="flex items-center gap-2 mb-5">
            <Sliders size={16} className="text-alpha-green" />
            <h2 className="text-white font-semibold">Alpha Score Weights</h2>
            <span className={clsx('ml-auto text-xs px-2 py-0.5 rounded',
              Object.values(weights).reduce((a, b) => a + b, 0) === 100
                ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            )}>
              Total: {Object.values(weights).reduce((a, b) => a + b, 0)}/100
            </span>
          </div>
          <div className="space-y-4">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-gray-300">{WEIGHT_LABELS[key]}</label>
                  <span className="text-sm font-mono text-white">{value}</span>
                </div>
                <input type="range" min="0" max="40" value={value}
                  onChange={e => setWeights(p => ({ ...p, [key]: Number(e.target.value) }))}
                  className="w-full accent-alpha-green" />
              </div>
            ))}
          </div>
          <button onClick={() => adminFetch('/admin/scoring-weights', { method: 'PUT', body: JSON.stringify(weights) })}
            className="mt-5 w-full py-2 rounded-lg bg-alpha-green text-black font-semibold text-sm hover:bg-alpha-green/90 transition-colors">
            Save Weights
          </button>
        </div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="bg-alpha-card border border-alpha-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-alpha-border">
            <h2 className="text-white font-semibold">Users ({users.length})</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-alpha-border">
                {['User', 'Tier', 'Admin', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-alpha-border/50">
                  <td className="px-3 py-3">
                    <p className="text-white text-sm font-medium">{u.username}</p>
                    <p className="text-gray-500 text-xs">{u.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={clsx('px-2 py-0.5 rounded text-xs font-medium',
                      u.tier === 'pro' ? 'bg-alpha-green/20 text-alpha-green' : 'bg-gray-500/20 text-gray-400'
                    )}>{u.tier}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-400 text-sm">{u.is_admin ? '✓' : '—'}</td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => adminFetch(`/admin/users/${u.id}/tier`, {
                      method: 'PUT',
                      body: JSON.stringify({ tier: u.tier === 'pro' ? 'free' : 'pro' })
                    }).then(() => qc.invalidateQueries({ queryKey: ['admin-users'] }))}
                      className="px-2 py-1 rounded text-[10px] border border-alpha-border text-gray-400 hover:text-white transition-colors">
                      Toggle Pro
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card form modal */}
      {showForm && (
        <CardFormModal
          initial={editCard ? fromCard(editCard) : { ...EMPTY_FORM }}
          cardId={editCard?.id}
          onClose={() => { setShowForm(false); setEditCard(null) }}
          onSave={refresh}
        />
      )}
    </div>
  )
}
