'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { searchCards } from '@/lib/api'
import type { CardListItem } from '@/lib/types'
import CardTable from '@/components/dashboard/CardTable'
import CardDetailModal from '@/components/cards/CardDetailModal'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQ = searchParams.get('q') ?? ''
  const [input, setInput] = useState(initialQ)
  const [query, setQuery] = useState(initialQ)
  const [selectedCard, setSelectedCard] = useState<CardListItem | null>(null)

  // Sync URL param → query state when navigating from navbar
  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    setInput(q)
    setQuery(q)
  }, [searchParams])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchCards(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = input.trim()
    if (q.length >= 2) {
      setQuery(q)
      router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false })
    }
  }

  const noResults = data && data.length === 0 && !isLoading

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      {/* Search header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Card Search</h1>
        <p className="text-gray-400 text-sm">
          Search by player name, set, or parallel — e.g. "Mahomes Prizm" or "Charizard PSA 10"
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="relative mb-8">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Search cards — e.g. "Mahomes Prizm PSA 10"'
          autoFocus
          className="w-full bg-alpha-card border border-alpha-border rounded-xl pl-12 pr-4 py-3.5 text-white text-base placeholder-gray-600 focus:border-alpha-green/60 focus:outline-none transition-colors"
        />
        {(isLoading || isFetching) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-alpha-green/30 border-t-alpha-green rounded-full animate-spin" />
          </div>
        )}
      </form>

      {/* Results */}
      {query.trim().length < 2 && (
        <div className="text-center py-20">
          <Search size={40} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500 text-sm">Type at least 2 characters to search</p>
        </div>
      )}

      {noResults && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-base font-medium mb-2">No cards found for "{query}"</p>
          <p className="text-gray-600 text-sm">
            Try a player name, set name, or parallel type.
            <br />
            New cards can be added via the <span className="text-alpha-green">Admin</span> panel.
          </p>
        </div>
      )}

      {data && data.length > 0 && (
        <div>
          <p className="text-gray-400 text-sm mb-4">
            {data.length} result{data.length !== 1 ? 's' : ''} for{' '}
            <span className="text-white font-medium">"{query}"</span>
          </p>
          <div className="bg-alpha-card border border-alpha-border rounded-xl overflow-hidden">
            <CardTable cards={data} onSelectCard={setSelectedCard} />
          </div>
        </div>
      )}

      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-alpha-card rounded w-48" />
          <div className="h-12 bg-alpha-card rounded-xl" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
