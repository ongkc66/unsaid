'use client'

import { useMemo } from 'react'
import { REVEAL_WORD_MS } from '@/lib/reveal'

interface Props {
  text: string
  themes?: string[]
  suggestions?: string[]
}

// Staggered reveal: sparkle + label → word-by-word insight → themes → "what to try" card.
// Each successive element fades up so the insight itself still owns the emotional peak.
export default function InsightReveal({ text, themes = [], suggestions = [] }: Props) {
  const words = useMemo(() => text.split(/(\s+)/), [text])
  const perWordMs = REVEAL_WORD_MS
  const insightDurationMs = words.filter((w) => w.trim().length > 0).length * perWordMs + 450

  const themesDelayMs = insightDurationMs + 400
  const suggestionsDelayMs = insightDurationMs + 800
  const footerDelayMs = suggestionsDelayMs + (suggestions.length ? suggestions.length * 120 + 300 : 300)

  return (
    <div className="flex flex-col gap-6">
      <div className="fade-up flex items-center gap-2" style={{ animationDelay: '120ms' }}>
        <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="text-accent flex-shrink-0">
          <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="currentColor" />
        </svg>
        <p className="text-xs text-cream-muted uppercase tracking-widest">Team insight</p>
      </div>

      <div className="relative">
        {/* Radial bloom behind the card */}
        <div
          aria-hidden
          className="insight-bloom absolute -inset-10 pointer-events-none blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, rgba(99,102,241,0.45), rgba(99,102,241,0) 70%)',
          }}
        />

        <div
          className="relative rounded-2xl p-px"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818cf8 50%, #4338ca 100%)' }}
        >
          <div className="bg-[#0f1123] rounded-2xl p-6">
            <p className="text-cream text-lg leading-8">
              {words.map((token, i) => {
                if (token.trim().length === 0) return <span key={i}>{token}</span>
                const delay = 300 + i * perWordMs
                return (
                  <span
                    key={i}
                    className="reveal-word"
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    {token}
                  </span>
                )
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Theme pills — quick visual scan of what the conversation touched. */}
      {themes.length > 0 && (
        <div
          className="fade-up flex flex-wrap items-center gap-2"
          style={{ animationDelay: `${themesDelayMs}ms` }}
        >
          <span className="text-xs text-cream-muted uppercase tracking-widest mr-1">Themes</span>
          {themes.map((t) => (
            <span
              key={t}
              className="text-sm text-accent bg-accent/10 border border-accent/25 rounded-full px-3 py-1"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* What to try — the product's commitment to action, not just observation. */}
      {suggestions.length > 0 && (
        <div
          className="fade-up bg-surface border border-white/5 rounded-2xl p-5"
          style={{ animationDelay: `${suggestionsDelayMs}ms` }}
        >
          <div className="flex items-center gap-2 mb-4">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-accent flex-shrink-0">
              <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-cream-muted uppercase tracking-widest">What to try this week</p>
          </div>
          <ul className="flex flex-col gap-3">
            {suggestions.map((s, i) => (
              <li
                key={s}
                className="fade-up flex items-start gap-3 text-cream text-base leading-relaxed"
                style={{ animationDelay: `${suggestionsDelayMs + (i + 1) * 120}ms` }}
              >
                <span
                  aria-hidden
                  className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0"
                />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="fade-up flex items-center justify-center gap-3 mt-1"
        style={{ animationDelay: `${footerDelayMs}ms` }}
      >
        <div className="h-px flex-1 bg-white/5" />
        <p className="text-cream-muted/80 text-xs whitespace-nowrap">
          Distilled from the team
        </p>
        <div className="h-px flex-1 bg-white/5" />
      </div>
    </div>
  )
}
