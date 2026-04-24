'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type TabKey = 'home' | 'feed' | 'insights' | 'pulse'

interface IconProps {
  active: boolean
}

function HomeIcon({ active }: IconProps) {
  return active ? (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M4 11L13 3.5L22 11V21.5C22 22.05 21.55 22.5 21 22.5H16V15.5H10V22.5H5C4.45 22.5 4 22.05 4 21.5V11Z" fill="currentColor" />
    </svg>
  ) : (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M4.5 11.2L13 4L21.5 11.2V21.25C21.5 21.66 21.16 22 20.75 22H15.5V15H10.5V22H5.25C4.84 22 4.5 21.66 4.5 21.25V11.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function FeedIcon({ active }: IconProps) {
  return active ? (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M5 5H21C21.55 5 22 5.45 22 6V17C22 17.55 21.55 18 21 18H10L6.5 21.5C6.19 21.81 5.71 21.93 5.3 21.79C4.89 21.65 4.62 21.26 4.62 20.83V6C4.62 5.45 5.07 5 5 5Z" fill="currentColor" />
    </svg>
  ) : (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M5.5 5.8H20.5C21.05 5.8 21.5 6.25 21.5 6.8V16.7C21.5 17.25 21.05 17.7 20.5 17.7H10.5L6.9 21.1C6.59 21.4 6.08 21.19 6.08 20.76V6.8C6.08 6.25 6.53 5.8 5.5 5.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function InsightsIcon({ active }: IconProps) {
  return active ? (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 2L15.2 8.8L22 11L15.2 13.2L13 20L10.8 13.2L4 11L10.8 8.8L13 2Z" fill="currentColor" />
      <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="7" cy="20" r="1.3" fill="currentColor" opacity="0.35" />
    </svg>
  ) : (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 2L15.2 8.8L22 11L15.2 13.2L13 20L10.8 13.2L4 11L10.8 8.8L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="2" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <circle cx="7" cy="20" r="1.3" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
    </svg>
  )
}

function PulseIcon({ active }: IconProps) {
  // A compact 3×3 dot grid — reads as "rhythm over time" without being literal.
  const dot = (cx: number, cy: number, intensity: number) =>
    active ? (
      <rect x={cx - 2.2} y={cy - 2.2} width="4.4" height="4.4" rx="1" fill="currentColor" opacity={intensity} />
    ) : (
      <rect x={cx - 2.2} y={cy - 2.2} width="4.4" height="4.4" rx="1" stroke="currentColor" strokeWidth="1.3" opacity={intensity} />
    )
  const levels = [0.35, 0.6, 1, 0.6, 1, 0.35, 0.6, 1, 0.6]
  const positions: [number, number][] = [
    [7, 7], [13, 7], [19, 7],
    [7, 13], [13, 13], [19, 13],
    [7, 19], [13, 19], [19, 19],
  ]
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      {positions.map(([cx, cy], i) => (
        <g key={i}>{dot(cx, cy, levels[i])}</g>
      ))}
    </svg>
  )
}

const ICONS: Record<TabKey, React.FC<IconProps>> = {
  home: HomeIcon,
  feed: FeedIcon,
  insights: InsightsIcon,
  pulse: PulseIcon,
}

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [storedCode, setStoredCode] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('unsaid_last_team')
      if (stored) setStoredCode(JSON.parse(stored).code ?? null)
      else setStoredCode(null)
    } catch {
      setStoredCode(null)
    }
  }, [pathname])

  const onTeamRoute = pathname?.startsWith('/team/')
  const onPulseRoute = pathname?.endsWith('/pulse')
  const onInsightsRoute = pathname?.endsWith('/insights')

  // Prefer the code from the URL (authoritative) when on a team route;
  // fall back to localStorage for navigation from the home page.
  const urlCode = onTeamRoute ? pathname!.split('/')[2] ?? null : null
  const teamCode = urlCode ?? storedCode
  const active: TabKey =
    pathname === '/' ? 'home'
    : onPulseRoute ? 'pulse'
    : onInsightsRoute ? 'insights'
    : onTeamRoute ? 'feed'
    : 'home'

  function go(tab: TabKey) {
    if (tab === 'home') {
      router.push('/')
      return
    }

    if (!teamCode) {
      router.push('/')
      return
    }

    if (tab === 'feed') {
      router.push(`/team/${teamCode}`)
      return
    }

    if (tab === 'insights') {
      router.push(`/team/${teamCode}/insights`)
      return
    }

    if (tab === 'pulse') {
      router.push(`/team/${teamCode}/pulse`)
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'feed', label: 'Feed' },
    { key: 'insights', label: 'Insights' },
    { key: 'pulse', label: 'Pulse' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0D0F1A]/95 backdrop-blur border-t border-white/5"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="max-w-2xl lg:max-w-5xl mx-auto flex items-stretch">
        {tabs.map(({ key, label }) => {
          const isActive = active === key
          const Icon = ICONS[key]
          return (
            <button
              key={key}
              onClick={() => go(key)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex-1 flex flex-col items-center justify-center py-2 gap-1 min-h-[56px] transition-transform active:scale-95"
            >
              {/* Facebook-style top indicator bar */}
              <span
                className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-b-full transition-all duration-200 ${
                  isActive ? 'w-10 bg-accent opacity-100' : 'w-0 opacity-0'
                }`}
              />
              <span className={`transition-colors ${isActive ? 'text-accent' : 'text-cream-muted'}`}>
                <Icon active={isActive} />
              </span>
              <span className={`text-xs font-medium tracking-wide transition-colors leading-none ${isActive ? 'text-accent' : 'text-cream-muted/80'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
