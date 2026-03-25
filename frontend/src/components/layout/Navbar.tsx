'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Eye, Settings, Search } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/watchlist', label: 'Watchlist', icon: Eye },
  { href: '/admin', label: 'Admin', icon: Settings },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setQuery('')
      inputRef.current?.blur()
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-alpha-border bg-alpha-card/95 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-alpha-green/20 border border-alpha-green/40 flex items-center justify-center">
            <span className="text-alpha-green text-xs font-bold">α</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">CardAlpha</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search cards…'
              className="w-full bg-alpha-bg border border-alpha-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-alpha-green/60 focus:outline-none transition-colors"
            />
          </div>
        </form>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-alpha-green/30 bg-alpha-green/10 shrink-0">
          <span className="w-2 h-2 rounded-full bg-alpha-green animate-pulse" />
          <span className="text-alpha-green text-xs font-medium">Live Data</span>
        </div>
      </div>
    </nav>
  )
}
