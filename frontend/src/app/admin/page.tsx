'use client'

import { useState } from 'react'
import { Settings, Users, Database, Sliders } from 'lucide-react'

const DEFAULT_WEIGHTS = {
  below_90d_avg: 25,
  below_ath: 20,
  volume_momentum: 15,
  rookie_status: 10,
  low_population: 10,
  serial_scarcity: 10,
  performance_momentum: 5,
  set_popularity: 5,
}

const WEIGHT_LABELS: Record<string, string> = {
  below_90d_avg: 'Below 90-Day Avg',
  below_ath: 'Below All-Time High',
  volume_momentum: 'Volume Momentum',
  rookie_status: 'Rookie Status',
  low_population: 'Low Population',
  serial_scarcity: 'Serial Scarcity',
  performance_momentum: 'Performance Momentum',
  set_popularity: 'Set Popularity',
}

export default function AdminPage() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const total = Object.values(weights).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Manage scoring weights, users, and platform settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Scoring Weights */}
        <div className="bg-alpha-card border border-alpha-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={16} className="text-alpha-green" />
            <h2 className="text-white font-semibold">Alpha Score Weights</h2>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded ${total === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              Total: {total}/100
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-gray-300">{WEIGHT_LABELS[key]}</label>
                  <span className="text-sm font-mono text-white">{value}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={value}
                  onChange={(e) =>
                    setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                  }
                  className="w-full accent-alpha-green"
                />
              </div>
            ))}
          </div>

          <button className="mt-4 w-full py-2 rounded-lg bg-alpha-green text-black font-semibold text-sm hover:bg-alpha-green/90 transition-colors">
            Save Weights
          </button>
        </div>

        {/* System Info */}
        <div className="space-y-4">
          <div className="bg-alpha-card border border-alpha-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database size={16} className="text-blue-400" />
              <h2 className="text-white font-semibold">Data Management</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Re-seed mock data', action: 'Seed Database', color: 'border-alpha-border text-gray-300' },
                { label: 'Recalculate all Alpha Scores', action: 'Recalculate', color: 'border-blue-500/30 text-blue-400' },
                { label: 'Clear cache', action: 'Clear Cache', color: 'border-alpha-border text-gray-300' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{item.label}</span>
                  <button className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors hover:bg-white/5 ${item.color}`}>
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-alpha-card border border-alpha-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-purple-400" />
              <h2 className="text-white font-semibold">User Management</h2>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Total Users</span>
                <span className="text-white">2</span>
              </div>
              <div className="flex justify-between">
                <span>Pro Subscribers</span>
                <span className="text-white">1</span>
              </div>
              <div className="flex justify-between">
                <span>Free Tier</span>
                <span className="text-white">1</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-alpha-border/20 rounded-lg text-xs text-gray-500">
              Admin: admin@cardalpha.com · Test: test@cardalpha.com
            </div>
          </div>

          <div className="bg-alpha-card border border-alpha-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Settings size={16} className="text-gray-400" />
              <h2 className="text-white font-semibold">Subscription Tiers</h2>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { tier: 'Free', features: 'Top 10 cards, basic filters', color: 'border-alpha-border' },
                { tier: 'Pro', features: 'Full database, advanced filters, portfolio tracker, alerts', color: 'border-alpha-green/40' },
              ].map((t) => (
                <div key={t.tier} className={`p-3 rounded-lg border ${t.color}`}>
                  <p className="text-white font-medium">{t.tier}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{t.features}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
