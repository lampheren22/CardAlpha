'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ScanLine, Eye, Settings } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scanner', label: 'Card Scanner', icon: ScanLine },
  { href: '/watchlist', label: 'Watchlist', icon: Eye },
  { href: '/admin', label: 'Admin', icon: Settings },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-alpha-border bg-alpha-card/95 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
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

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-alpha-green/30 bg-alpha-green/10">
          <span className="w-2 h-2 rounded-full bg-alpha-green animate-pulse" />
          <span className="text-alpha-green text-xs font-medium">Live Data</span>
        </div>
      </div>
    </nav>
  )
}
