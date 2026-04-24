'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import InsightReveal from '@/components/InsightReveal'
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const [teamRes, insightsRes] = await Promise.all([
      fetch(`/api/team?code=${code}`),
      fetch(`/api/team/insights?code=${code}`),
    ])
    if (teamRes.ok) setTeam(await teamRes.json())
    if (insightsRes.ok) {
      const { insights: data } = await insightsRes.json()
      const list = data as InsightEntry[]
      setInsights(list)
      if (list.length > 0) setSelectedId((prev) => prev ?? list[0].questionId)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [code])

  useEffect(() => {
    if (!team) return
    const channel = supabase
      .channel(`insights-${team.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'synthesis' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [team])

  const selected = insights.find((e) => e.questionId === selectedId) ?? null

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col max-w-2xl lg:max-w-5xl mx-auto pb-28">
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <div className="h-2.5 w-10 bg-white/8 rounded-full animate-pulse" />
          <div className="h-2.5 w-24 bg-white/8 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-white/8 rounded-full animate-pulse" />
        </div>
        <div className="px-4 flex flex-col gap-6">
          <div className="animate-pulse">
            <div className="h-2.5 w-16 bg-white/8 rounded-full mb-2" />
            <div className="h-6 w-56 bg-white/8 rounded-full" />
          </div>
          {[0, 150, 300].map((delay) => (
            <div key={delay} className="bg-surface border border-white/5 rounded-2xl overflow-hidden animate-pulse" style={{ animationDelay: `${delay}ms` }}>
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

      {/* ── Desktop: master-detail ── */}
      <div className="hidden lg:flex lg:flex-row lg:gap-0 lg:border lg:border-white/5 lg:rounded-2xl lg:overflow-hidden lg:mx-4 lg:min-h-[640px]">

        {/* Left: list panel */}
        <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-white/5">
          {/* Panel header */}
          <div className="px-5 pt-5 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-cream text-base font-semibold">Insights</h2>
              {insights.length > 0 && (
                <span className="text-xs text-cream-muted">{insights.length}</span>
              )}
            </div>
            <p className="text-cream-muted text-xs">What the team has surfaced</p>
          </div>

          {/* List */}
          {insights.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="text-accent">
                    <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="currentColor" />
                  </svg>
                </div>
                <p className="text-cream text-sm font-medium mb-1">No insights yet</p>
                <p className="text-cream-muted text-xs leading-relaxed">Ask a question and invite your team.</p>
                <Link href={`/team/${code}`} className="inline-flex items-center gap-1 mt-3 text-accent text-xs font-medium">
                  Go to feed
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {insights.map((entry) => (
                <button
                  key={entry.questionId}
                  onClick={() => setSelectedId(entry.questionId)}
                  className={`w-full text-left px-5 py-4 border-b border-white/5 transition-colors relative ${
                    selectedId === entry.questionId
                      ? 'bg-accent/8'
                      : 'hover:bg-white/2'
                  }`}
                >
                  {selectedId === entry.questionId && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />
                  )}
                  <p className="text-xs text-cream-muted line-clamp-1 mb-1.5 leading-relaxed">
                    {entry.questionText}
                  </p>
                  <p className="text-sm text-cream line-clamp-2 leading-relaxed mb-2">
                    {entry.insightText}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.themes.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] text-accent bg-accent/10 border border-accent/20 rounded-full px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                    {entry.themes.length > 2 && (
                      <span className="text-[10px] text-cream-muted">+{entry.themes.length - 2}</span>
                    )}
                    <span className="text-[10px] text-cream-muted/70 ml-auto">{formatRelative(entry.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-cream-muted text-sm">
              Select an insight to read
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="px-7 pt-6 pb-5 border-b border-white/5">
                <p className="text-xs text-cream-muted uppercase tracking-widest mb-2">The question</p>
                <h2 className="text-cream text-lg font-semibold leading-snug">{selected.questionText}</h2>
                <div className="flex items-center gap-3 mt-3">
                  {selected.themes.map((t) => (
                    <span key={t} className="text-xs text-accent bg-accent/10 border border-accent/20 rounded-full px-2.5 py-0.5">
                      {t}
                    </span>
                  ))}
                  <span className="text-xs text-cream-muted/70 ml-auto">{formatRelative(selected.createdAt)}</span>
                </div>
              </div>

              {/* Detail body */}
              <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-6">
                <InsightReveal
                  key={selected.questionId}
                  text={selected.insightText}
                  themes={[]}
                  suggestions={selected.suggestions}
                />

                <div className="mt-2">
                  <Link
                    href={`/team/${code}/question/${selected.questionId}`}
                    className="inline-flex items-center gap-1.5 text-accent text-sm font-medium hover:opacity-80 transition-opacity"
                  >
                    View full detail
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile: single column ── */}
      <div className="lg:hidden px-4 flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-cream-muted uppercase tracking-widest mb-2">Insights</p>
            <h2 className="text-cream text-xl font-medium leading-snug">What the team has surfaced.</h2>
          </div>
          {insights.length > 0 && (
            <p className="text-cream-muted text-sm pb-0.5">{insights.length} {insights.length === 1 ? 'insight' : 'insights'}</p>
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
            <Link href={`/team/${code}`} className="inline-flex items-center gap-1.5 mt-4 text-accent text-sm font-medium">
              Go to feed
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {insights.map((entry) => (
              <Link key={entry.questionId} href={`/team/${code}/question/${entry.questionId}`} className="group block">
                <article className="bg-surface border border-white/5 group-hover:border-white/10 rounded-2xl overflow-hidden transition-colors">
                  <div className="flex">
                    <div className="w-0.5 flex-shrink-0 bg-gradient-to-b from-accent/60 via-accent/30 to-transparent" />
                    <div className="flex-1 p-5 flex flex-col gap-3">
                      <p className="text-xs text-cream-muted line-clamp-2 leading-relaxed">{entry.questionText}</p>
                      <p className="text-cream text-base leading-relaxed">{entry.insightText}</p>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex flex-wrap gap-1.5">
                          {entry.themes.map((t) => (
                            <span key={t} className="text-xs text-accent bg-accent/10 border border-accent/20 rounded-full px-2.5 py-0.5">{t}</span>
                          ))}
                        </div>
                        <span className="text-xs text-cream-muted/80 whitespace-nowrap flex-shrink-0">{formatRelative(entry.createdAt)}</span>
                      </div>
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
