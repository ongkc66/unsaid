'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import { supabase } from '@/lib/supabase'
import type { Team } from '@/lib/supabase'
import type { InsightEntry } from '@/app/api/team/insights/route'

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function InsightsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [team, setTeam] = useState<Team | null>(null)
  const [insights, setInsights] = useState<InsightEntry[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [teamRes, insightsRes] = await Promise.all([
      fetch(`/api/team?code=${code}`),
      fetch(`/api/team/insights?code=${code}`),
    ])
    if (teamRes.ok) setTeam(await teamRes.json())
    if (insightsRes.ok) {
      const { insights: data } = await insightsRes.json()
      setInsights(data as InsightEntry[])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [code])

  // Refresh when a new synthesis lands
  useEffect(() => {
    if (!team) return
    const channel = supabase
      .channel(`insights-${team.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'synthesis' },
        () => load(),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [team])

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col max-w-2xl lg:max-w-5xl mx-auto pb-28">
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <div className="h-2.5 w-10 bg-white/8 rounded-full animate-pulse" />
          <div className="h-2.5 w-24 bg-white/8 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-white/8 rounded-full animate-pulse" />
        </div>
        <div className="px-4 flex flex-col gap-6">
          {/* Title */}
          <div className="animate-pulse">
            <div className="h-2.5 w-16 bg-white/8 rounded-full mb-2" />
            <div className="h-6 w-56 bg-white/8 rounded-full" />
          </div>
          {/* Insight cards — left-bar style */}
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className="bg-surface border border-white/5 rounded-2xl overflow-hidden animate-pulse"
              style={{ animationDelay: `${delay}ms` }}
            >
              <div className="flex">
                <div className="w-0.5 flex-shrink-0 bg-white/10" />
                <div className="flex-1 p-5 flex flex-col gap-3">
                  <div className="h-3 w-full bg-white/8 rounded-full" />
                  <div className="h-4 w-full bg-white/8 rounded-full" />
                  <div className="h-4 w-3/4 bg-white/8 rounded-full" />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="h-5 w-14 bg-white/8 rounded-full" />
                      <div className="h-5 w-16 bg-white/8 rounded-full" />
                    </div>
                    <div className="h-2.5 w-12 bg-white/8 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  if (!team) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-cream text-base mb-2">Team not found</p>
          <Link href="/" className="text-accent text-sm">← Go home</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col max-w-2xl lg:max-w-5xl mx-auto pb-28">
      <AppHeader teamName={team.name} code={code} />

      <div className="px-4 flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-cream-muted uppercase tracking-widest mb-2">Insights</p>
            <h2 className="text-cream text-xl font-medium leading-snug">
              What the team has surfaced.
            </h2>
          </div>
          {insights.length > 0 && (
            <p className="text-cream-muted text-sm pb-0.5">
              {insights.length} {insights.length === 1 ? 'insight' : 'insights'}
            </p>
          )}
        </div>

        {insights.length === 0 ? (
          <div className="bg-surface border border-white/5 rounded-2xl p-8 text-center mt-2">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <svg width="18" height="18" viewBox="0 0 12 12" fill="none" className="text-accent">
                <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="currentColor" />
              </svg>
            </div>
            <p className="text-cream text-base font-medium mb-1.5">No insights yet</p>
            <p className="text-cream-muted text-sm leading-relaxed max-w-xs mx-auto">
              Insights appear once a question gets enough answers. Ask one and invite your team.
            </p>
            <Link
              href={`/team/${code}`}
              className="inline-flex items-center gap-1.5 mt-4 text-accent text-sm font-medium"
            >
              Go to feed
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {insights.map((entry) => (
              <Link
                key={entry.questionId}
                href={`/team/${code}/question/${entry.questionId}`}
                className="group block"
              >
                <article className="bg-surface border border-white/5 group-hover:border-white/10 rounded-2xl overflow-hidden transition-colors">
                  {/* Accent left bar */}
                  <div className="flex">
                    <div className="w-0.5 flex-shrink-0 bg-gradient-to-b from-accent/60 via-accent/30 to-transparent" />

                    <div className="flex-1 p-5 flex flex-col gap-3">
                      {/* Question context */}
                      <p className="text-xs text-cream-muted line-clamp-2 leading-relaxed">
                        {entry.questionText}
                      </p>

                      {/* Insight text — the main event */}
                      <p className="text-cream text-base leading-relaxed">
                        {entry.insightText}
                      </p>

                      {/* Themes + timestamp row */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex flex-wrap gap-1.5">
                          {entry.themes.map((t) => (
                            <span
                              key={t}
                              className="text-xs text-accent bg-accent/10 border border-accent/20 rounded-full px-2.5 py-0.5"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-cream-muted/80 whitespace-nowrap flex-shrink-0">
                          {formatRelative(entry.createdAt)}
                        </span>
                      </div>

                      {/* Suggestions teaser */}
                      {entry.suggestions.length > 0 && (
                        <p className="text-xs text-cream-muted/80 flex items-center gap-1.5">
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" className="text-accent flex-shrink-0">
                            <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {entry.suggestions.length} thing{entry.suggestions.length === 1 ? '' : 's'} to try
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
