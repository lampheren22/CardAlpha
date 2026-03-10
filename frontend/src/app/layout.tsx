import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'CardAlpha — Trading Card Investment Analytics',
  description: 'Identify undervalued trading cards with AI-powered Alpha Score analytics',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-alpha-bg min-h-screen">
        <Providers>
          <Navbar />
          <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
