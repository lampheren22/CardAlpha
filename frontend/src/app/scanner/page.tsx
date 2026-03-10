'use client'

import { ScanLine } from 'lucide-react'

export default function ScannerPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-white">Card Scanner</h1>
        <p className="text-gray-500 text-sm mt-1">Scan a card to instantly get its Alpha Score and market analysis.</p>
      </div>

      <div className="bg-alpha-card border border-alpha-border rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-alpha-green/20 border border-alpha-green/30 flex items-center justify-center">
          <ScanLine size={32} className="text-alpha-green" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Card Scanner</h2>
          <p className="text-gray-400 text-sm mt-1 max-w-sm">
            Upload a card image or enter card details to get instant market analysis and Alpha Score calculation.
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-amber-400 text-sm">
          Coming soon — eBay API integration in progress
        </div>
      </div>
    </div>
  )
}
