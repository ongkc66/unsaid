'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  teamName: string
  code: string
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 10V3C2 2.45 2.45 2 3 2H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export default function AppHeader({ teamName, code }: Props) {
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="flex items-center justify-between px-4 pt-12 pb-4 max-w-lg mx-auto w-full">
      {/* Wordmark — taps to home */}
      <Link
        href="/"
        className="text-cream-muted/50 text-xs font-medium uppercase tracking-widest hover:text-cream-muted transition-colors"
      >
        Unsaid
      </Link>

      {/* Team name — centred */}
      <span className="text-cream text-sm font-medium truncate max-w-[140px] text-center">
        {teamName}
      </span>

      {/* Code pill + copy */}
      <button
        onClick={copyCode}
        className="flex items-center gap-1.5 bg-surface border border-white/5 hover:border-white/15 px-3 py-1.5 rounded-full transition-colors"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
        <span className="text-cream-muted text-xs font-mono">
          {copied ? 'Copied!' : code.toUpperCase()}
        </span>
        {!copied && <CopyIcon />}
      </button>
    </header>
  )
}
