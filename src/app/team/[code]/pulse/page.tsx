'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import PulseHeatmap, { type PulseDay } from '@/components/PulseHeatmap'
import SuggestionTracker from '@/components/SuggestionTracker'
import ThemeFrequency from '@/components/ThemeFrequency'
import CompletionRing from '@/components/CompletionRing'
import { supabase } from '@/lib/supabase'
import type { Team } from '@/lib/supabase'
import type { SuggestionGroup } from '@/app/api/team/suggestions/route'
import type { InsightEntry } from '@/app/api/team/insights/route'

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PulsePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [team, setTeam] = useState<Team | null>(null)
  const [days, setDays] = useState<PulseDay[]>([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [closedQuestions, setClosedQuestions] = useState(0)
  const [aiQuestions, setAiQuestions] = useState(0)
  const [suggestionGroups, setSuggestionGroups] = useState<SuggestionGroup[]>([])
  const [insights, setInsights] = useState<InsightEntry[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [teamRes, pulseRes, suggestionsRes, insightsRes] = await Promise.all([
      fetch(`/api/team?code=${code}`),
      fetch(`/api/team/pulse?code=${code}`),
      fetch(`/api/team/suggestions?code=${code}`),
      fetch(`/api/team/insights?code=${code}`),
    ])
    if (teamRes.ok) setTeam(await teamRes.json())
    if (pulseRes.ok) {
      const { days: d, totalQuestions: tq, closedQuestions: cq, aiQuestions: aq } = await pulseRes.json()
      setDays(d as PulseDay[])
      setTotalQuestions(tq as number)
      setClosedQuestions(cq as number)
      setAiQuestions(aq as number)
    }
    if (suggestionsRes.ok) {
      const { groups } = await suggestionsRes.json()
      setSuggestionGroups(groups as SuggestionGroup[])
    }
    if (insightsRes.ok) {
      const { insights: data } = await insightsRes.json()
      setInsights(data as InsightEntry[])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  // Live updates: heatmap and (when a new synthesis lands) the team summary
  useEffect(() => {
    if (!team) return
    const channel = supabase
      .channel(`pulse-${team.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'questions', filter: `team_id=eq.${team.id}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers' },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'teams', filter: `id=eq.${team.id}` },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team])

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col max-w-2xl lg:max-w-5xl mx-auto pb-28">
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <div className="h-2.5 w-10 bg-white/8 rounded-full animate-pulse" />
          <div className="h-2.5 w-24 bg-white/8 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-white/8 rounded-full animate-pulse" />
        </div>
        <div className="px-4 flex flex-col gap-8">
          {/* Title */}
          <div className="animate-pulse">
            <div className="h-2.5 w-10 bg-white/8 rounded-full mb-2" />
            <div className="h-6 w-64 bg-white/8 rounded-full mb-3" />
            <div className="h-4 w-full bg-white/8 rounded-full" />
          </div>
          {/* Team summary card */}
          <div className="rounded-2xl border border-accent/15 bg-surface p-6 flex flex-col gap-3 animate-pulse [animation-delay:100ms]">
            <div className="h-2.5 w-24 bg-white/8 rounded-full" />
            <div className="h-4 w-full bg-white/8 rounded-full" />
            <div className="h-4 w-full bg-white/8 rounded-full" />
            <div className="h-4 w-3/4 bg-white/8 rounded-full" />
            <div className="flex gap-2 pt-1">
              <div className="h-6 w-16 bg-white/8 rounded-full" />
              <div className="h-6 w-20 bg-white/8 rounded-full" />
              <div className="h-6 w-14 bg-white/8 rounded-full" />
            </div>
          </div>
          <div className="h-px bg-white/5" />
          {/* Theme frequency */}
          <div className="flex flex-col gap-3 animate-pulse [animation-delay:200ms]">
            <div className="h-2.5 w-28 bg-white/8 rounded-full" />
            <div className="flex flex-wrap gap-2">
              {[80, 64, 72, 56, 68, 48].map((w, i) => (
                <div key={i} className="h-7 bg-white/8 rounded-full" style={{ width: `${w}px` }} />
              ))}
            </div>
          </div>
          <div className="h-px bg-white/5" />
          {/* Completion ring */}
          <div className="flex items-center gap-6 animate-pulse [animation-delay:300ms]">
            <div className="w-20 h-20 rounded-full bg-white/8 flex-shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="h-2.5 w-28 bg-white/8 rounded-full" />
              <div className="h-5 w-16 bg-white/8 rounded-full" />
            </div>
          </div>
          <div className="h-px bg-white/5" />
          {/* Heatmap */}
          <div className="flex flex-col gap-3 animate-pulse [animation-delay:400ms]">
            <div className="h-2.5 w-16 bg-white/8 rounded-full" />
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="h-8 bg-white/8 rounded-md" />
              ))}
            </div>
          </div>
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

  const totalEvents = days.reduce((sum, d) => sum + d.questions + d.answers, 0)

  const themeFrequency = (() => {
    const counts = new Map<string, number>()
    insights.forEach((entry) =>
      entry.themes.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1))
    )
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  })()
  const activeDays = days.length
  const hasSummary = Boolean(team.summary_text && team.summary_text.trim().length > 0)

  return (
    <main className="min-h-screen flex flex-col max-w-2xl lg:max-w-5xl mx-auto pb-28">
      <AppHeader teamName={team.name} code={code} />

      <div className="px-4 flex flex-col gap-8">
        <div>
          <p className="text-xs text-cream-muted uppercase tracking-widest mb-2">Pulse</p>
          <h2 className="text-cream text-xl font-medium leading-snug">
            Your team's rhythm and character.
          </h2>
          <p className="text-cream-muted text-base mt-2 leading-relaxed">
            A portrait of what the team keeps circling — distilled from every insight so far. No names, no attribution.
          </p>
        </div>

        {/* Team summary — the product's reflective payoff. */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-cream-muted uppercase tracking-widest">Team summary</p>
            {hasSummary && team.summary_source_count > 0 && (
              <p className="text-xs text-cream-muted">
                {team.summary_source_count} insight{team.summary_source_count === 1 ? '' : 's'}
                {team.summary_generated_at ? ` · updated ${formatRelative(team.summary_generated_at)}` : ''}
              </p>
            )}
          </div>

          {hasSummary ? (
            <div
              className="relative rounded-2xl p-px"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818cf8 50%, #4338ca 100%)' }}
            >
              <div className="bg-[#0f1123] rounded-2xl p-6 flex flex-col gap-4">
                <p className="text-cream text-lg leading-8">{team.summary_text}</p>
                {team.summary_themes.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {team.summary_themes.map((t) => (
                      <span
                        key={t}
                        className="text-sm text-accent bg-accent/10 border border-accent/25 rounded-full px-3 py-1"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-white/5 rounded-2xl p-6 text-center">
              <p className="text-cream text-base font-medium mb-1.5">
                Your team's portrait appears once a few insights land.
              </p>
              <p className="text-cream-muted text-sm leading-relaxed">
                Ask a few questions and finish the threads. The picture sharpens with each insight.
              </p>
            </div>
          )}
        </section>

        <div className="h-px bg-white/5" />

        <ThemeFrequency themes={themeFrequency} totalInsights={insights.length} />

        <div className="h-px bg-white/5" />

        <CompletionRing closed={closedQuestions} total={totalQuestions} />

        <div className="h-px bg-white/5" />

        {/* Question origin — how much of the team's thinking came from themselves vs. AI nudges */}
        <section className="flex flex-col gap-4">
          <p className="text-xs text-cream-muted uppercase tracking-widest">Question origin</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-cream-muted flex-shrink-0">
                  <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M1.5 12.5C1.5 10.015 4.015 8 7 8C9.985 8 12.5 10.015 12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span className="text-xs text-cream-muted">By your team</span>
              </div>
              <p className="text-cream text-3xl font-semibold tabular-nums leading-none">
                {totalQuestions - aiQuestions}
              </p>
            </div>
            <div className="bg-surface border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-accent flex-shrink-0">
                  <path d="M7 0L8.5 4.5L13 7L8.5 9.5L7 14L5.5 9.5L1 7L5.5 4.5L7 0Z" fill="currentColor" />
                </svg>
                <span className="text-xs text-cream-muted">From Unsaid</span>
              </div>
              <p className="text-accent text-3xl font-semibold tabular-nums leading-none">
                {aiQuestions}
              </p>
            </div>
          </div>
        </section>

        <div className="h-px bg-white/5" />

        <SuggestionTracker code={code} groups={suggestionGroups} />

        <div className="h-px bg-white/5" />

        {/* Rhythm — heatmap + totals. */}
        <section className="flex flex-col gap-4">
          <p className="text-xs text-cream-muted uppercase tracking-widest">Activity</p>

          {totalEvents === 0 ? (
            <div className="bg-surface border border-white/5 rounded-2xl p-6 text-center">
              <p className="text-cream text-base font-medium mb-1.5">
                No activity yet.
              </p>
              <p className="text-cream-muted text-sm leading-relaxed">
                Ask a question or answer one to light up today.
              </p>
            </div>
          ) : (
            <>
              <PulseHeatmap days={days} />

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface border border-white/5 rounded-xl p-4">
                  <p className="text-cream-muted text-xs uppercase tracking-widest">Events</p>
                  <p className="text-cream text-2xl font-medium mt-1">{totalEvents}</p>
                </div>
                <div className="bg-surface border border-white/5 rounded-xl p-4">
                  <p className="text-cream-muted text-xs uppercase tracking-widest">Active days</p>
                  <p className="text-cream text-2xl font-medium mt-1">{activeDays}</p>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
