'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  teamName: string
  code: string
}

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="11" cy="2.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="11.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="3" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.7 6.1L9.3 3.4M4.7 7.9L9.3 10.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function AppHeader({ teamName, code }: Props) {
  const [status, setStatus] = useState<'idle' | 'shared' | 'copied'>('idle')

  async function share() {
    const url = `${window.location.origin}/team/${code.toUpperCase()}`
    const shareData = {
      title: `Join ${teamName} on Unsaid`,
      text: 'Your team is using Unsaid to share honestly and anonymously. Join here:',
      url,
    }

    // Mobile: try native share sheet first
    if (typeof navigator.share === 'function' && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        setStatus('shared')
        setTimeout(() => setStatus('idle'), 2000)
        return
      } catch (e) {
        // AbortError = user dismissed — no feedback needed
        if (e instanceof Error && e.name === 'AbortError') return
        // Other error — fall through to clipboard
      }
    }

    // Desktop fallback: copy the join URL
    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      // Clipboard blocked — last resort: copy just the code
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  const label =
    status === 'shared' ? 'Shared!' :
    status === 'copied' ? 'Link copied!' :
    code.toUpperCase()

  return (
    <header className="flex items-center justify-between px-4 pt-12 pb-4 w-full">
      {/* Wordmark — taps to home */}
      <Link
        href="/"
        className="text-cream-muted text-xs font-medium uppercase tracking-widest hover:text-cream transition-colors"
      >
        Unsaid
      </Link>

      {/* Team name — centred */}
      <span className="text-cream text-base font-medium truncate max-w-[160px] text-center">
        {teamName}
      </span>

      {/* Share pill — native share on mobile, copy link on desktop */}
      <button
        onClick={share}
        className="flex items-center gap-1.5 bg-surface border border-white/5 hover:border-white/15 px-3 py-2 rounded-full transition-colors min-h-[36px]"
      >
        {status === 'idle' && <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
        <span className={`text-sm font-mono transition-colors ${status !== 'idle' ? 'text-accent' : 'text-cream'}`}>
          {label}
        </span>
        {status === 'idle'
          ? <ShareIcon />
          : <CheckIcon />
        }
      </button>
    </header>
  )
}
