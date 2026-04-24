import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Unsaid — What your team thinks, but never says',
  description: 'Anonymous peer-to-peer team insight tool for small teams.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-midnight text-cream font-sans antialiased">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
