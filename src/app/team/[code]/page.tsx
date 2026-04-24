'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import AnswerDrawer from '@/components/AnswerDrawer'
import { supabase } from '@/lib/supabase'
import type { Team, Question } from '@/lib/supabase'

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-accent flex-shrink-0">
      <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="currentColor" />
    </svg>
  )
}

function SectionLabel({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-white/8" />
      <span className={`text-xs uppercase tracking-[0.18em] whitespace-nowrap ${accent ? 'text-accent/80' : 'text-cream-muted/80'}`}>
        {text}
      </span>
      <div className="h-px flex-1 bg-white/8" />
    </div>
  )
}

const LABEL_COLORS: Record<string, string> = {
  Culture:       'bg-violet-500/15 text-violet-300 border-violet-500/20',
  Leadership:    'bg-blue-500/15 text-blue-300 border-blue-500/20',
  Process:       'bg-amber-500/15 text-amber-300 border-amber-500/20',
  Wellbeing:     'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  Growth:        'bg-sky-500/15 text-sky-300 border-sky-500/20',
  Recognition:   'bg-pink-500/15 text-pink-300 border-pink-500/20',
  Communication: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
}

export default function TeamFeed({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [team, setTeam] = useState<Team | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [teamRes, qRes] = await Promise.all([
        fetch(`/api/team?code=${code}`),
        fetch(`/api/questions?code=${code}`),
      ])
      if (teamRes.ok) {
        const t = await teamRes.json()
        setTeam(t)
        localStorage.setItem('unsaid_last_team', JSON.stringify({ code: t.code, name: t.name }))
      }
      if (qRes.ok) setQuestions(await qRes.json())
      setLoading(false)
    }
    load()
  }, [code])

  // Realtime: any change to this team's questions (new, answer_count, closed) → refetch
  useEffect(() => {
    if (!team) return
    const channel = supabase
      .channel(`team-${team.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'questions', filter: `team_id=eq.${team.id}` },
        () => {
          fetch(`/api/questions?code=${code}`)
            .then((r) => r.json())
            .then(setQuestions)
            .catch(() => {})
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [team, code])

  function onQuestionSubmitted() {
    setDrawerOpen(false)
    fetch(`/api/questions?code=${code}`)
      .then((r) => r.json())
      .then(setQuestions)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col max-w-2xl lg:max-w-5xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <div className="h-2.5 w-10 bg-white/8 rounded-full animate-pulse" />
          <div className="h-2.5 w-24 bg-white/8 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-white/8 rounded-full animate-pulse" />
        </div>

        <div className="flex flex-col gap-3 px-4 mt-4">
          {/* Insight-style skeleton — hints at the closed card */}
          <div className="rounded-2xl border border-accent/15 bg-surface p-5 animate-pulse">
            <div className="h-2.5 w-24 bg-white/8 rounded-full mb-3" />
            <div className="h-4 w-full bg-white/8 rounded-full mb-2" />
            <div className="h-4 w-4/5 bg-white/8 rounded-full mb-4" />
            <div className="h-2.5 w-28 bg-white/8 rounded-full" />
          </div>

          {/* Open-style skeleton */}
          <div className="rounded-2xl border border-white/5 bg-surface p-5 animate-pulse [animation-delay:150ms]">
            <div className="flex items-center justify-between mb-3">
              <div className="h-2.5 w-28 bg-white/8 rounded-full" />
              <div className="h-4 w-14 bg-white/8 rounded-full" />
            </div>
            <div className="h-4 w-full bg-white/8 rounded-full mb-2" />
            <div className="h-4 w-3/5 bg-white/8 rounded-full mb-4" />
            <div className="h-1.5 w-full bg-white/10 rounded-full" />
          </div>

          {/* Open-style skeleton 2 */}
          <div className="rounded-2xl border border-white/5 bg-surface p-5 animate-pulse [animation-delay:300ms]">
            <div className="flex items-center justify-between mb-3">
              <div className="h-2.5 w-20 bg-white/8 rounded-full" />
              <div className="h-4 w-14 bg-white/8 rounded-full" />
            </div>
            <div className="h-4 w-full bg-white/8 rounded-full mb-2" />
            <div className="h-4 w-2/3 bg-white/8 rounded-full mb-4" />
            <div className="h-1.5 w-2/3 bg-white/10 rounded-full" />
          </div>
        </div>
      </main>
    )
  }

  if (!team) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-cream text-sm mb-2">Team not found</p>
          <Link href="/" className="text-accent text-xs">← Go home</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col max-w-2xl lg:max-w-5xl mx-auto">

      <AppHeader teamName={team.name} code={code} />

      {/* Label filter bar — only shown when ≥2 distinct labels exist */}
      {(() => {
        const labels = [...new Set(questions.map((q) => q.label).filter(Boolean))] as string[]
        if (labels.length < 2) return null
        return (
          <div className="px-4 mt-4 overflow-x-auto">
            <div className="flex gap-2 pb-1 w-max">
              <button
                onClick={() => setActiveLabel(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${activeLabel === null ? 'bg-accent/20 text-accent border-accent/30' : 'bg-transparent text-cream-muted/80 border-white/10 hover:border-white/20'}`}
              >All</button>
              {labels.map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLabel(activeLabel === l ? null : l)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${activeLabel === l ? (LABEL_COLORS[l] ?? 'bg-accent/20 text-accent border-accent/30') : 'bg-transparent text-cream-muted/80 border-white/10 hover:border-white/20'}`}
                >{l}</button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Team progress summary — appears once the first insight is ready */}
      {questions.length > 0 && (() => {
        const closedCount = questions.filter((q) => q.status === 'closed').length
        const openCount = questions.length - closedCount
        if (closedCount === 0) return null
        const pct = Math.round((closedCount / questions.length) * 100)
        return (
          <div className="px-4 mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-accent font-medium">
                {closedCount} {closedCount === 1 ? 'insight' : 'insights'} ready
              </span>
              {openCount > 0 && (
                <span className="text-xs text-cream-muted/80">{openCount} collecting</span>
              )}
              {openCount === 0 && (
                <span className="text-xs text-accent/80">All done</span>
              )}
            </div>
            <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent/80 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })()}

      {/* Question feed */}
      <div className="flex-1 flex flex-col px-4 pb-28 mt-4">
        {(() => {
          const visible = activeLabel
            ? questions.filter((q) => q.label === activeLabel)
            : questions

          if (visible.length === 0 && activeLabel) {
            return (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 py-16 text-center">
                <p className="text-cream-muted text-sm">No {activeLabel} questions yet.</p>
                <button onClick={() => setActiveLabel(null)} className="text-accent text-xs hover:underline">Clear filter</button>
              </div>
            )
          }

          if (visible.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center flex-1 gap-4 py-24 text-center">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Ask the team something"
                  className="w-14 h-14 rounded-full bg-surface border border-accent/40 flex items-center justify-center text-accent transition-all active:scale-95 hover:border-accent hover:bg-accent/10 shadow-[0_0_0_4px_rgba(99,102,241,0.08)]"
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 4.5V17.5M4.5 11H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <div>
                  <p className="text-cream text-base font-medium mb-1.5">No questions yet</p>
                  <p className="text-cream-muted text-sm leading-relaxed max-w-xs">
                    Be the first to ask something.<br />It'll be anonymised before anyone sees it.
                  </p>
                </div>
              </div>
            )
          }

          const closed = visible.filter((q) => q.status === 'closed')
          const open = visible.filter((q) => q.status === 'open')
          const mixed = closed.length > 0 && open.length > 0

          const closedCard = (q: Question) => (
            <Link key={q.id} href={`/team/${code}/question/${q.id}`}>
              <div
                className="rounded-2xl p-px"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4338ca 100%)' }}
              >
                <div className="bg-[#13152A] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <SparkleIcon />
                      <span className="text-sm text-accent font-medium">Insight ready</span>
                    </div>
                    {q.label && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${LABEL_COLORS[q.label] ?? 'bg-accent/10 text-accent border-accent/20'}`}>{q.label}</span>
                    )}
                  </div>
                  <p className="text-cream text-base leading-relaxed mb-4">{q.anonymized_text}</p>
                  <div className="flex items-center gap-1 text-accent text-sm font-medium">
                    View team insight
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          )

          const openCard = (q: Question) => (
            <Link key={q.id} href={`/team/${code}/question/${q.id}`}>
              <div className="bg-surface rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-cream-muted">
                    {q.answer_count} of {team.member_count} answered
                  </span>
                  <div className="flex items-center gap-2">
                    {q.label && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${LABEL_COLORS[q.label] ?? 'bg-accent/10 text-accent border-accent/20'}`}>{q.label}</span>
                    )}
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="text-cream-muted/80">
                      <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M4 5V3.5C4 2.12 5.12 1 6.5 1C7.88 1 9 2.12 9 3.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                {q.is_ai_generated && (
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <SparkleIcon />
                    <span className="text-xs uppercase tracking-widest text-accent font-medium">
                      From Unsaid
                    </span>
                  </div>
                )}
                <p className="text-cream text-base leading-relaxed mb-4">{q.anonymized_text}</p>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-accent/50 h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min((q.answer_count / team.member_count) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </Link>
          )

          return (
            <>
              {closed.length > 0 && (
                <div className="flex flex-col gap-3">
                  {mixed && (
                    <SectionLabel
                      accent
                      text={`${closed.length} insight${closed.length !== 1 ? 's' : ''} ready`}
                    />
                  )}
                  {closed.map(closedCard)}
                </div>
              )}
              {open.length > 0 && (
                <div className={`flex flex-col gap-3 ${mixed ? 'mt-5' : ''}`}>
                  {mixed && (
                    <SectionLabel
                      text={`${open.length} collecting`}
                    />
                  )}
                  {open.map(openCard)}
                </div>
              )}
            </>
          )
        })()}
      </div>

      {/* Floating action button — primary "ask" affordance, persistent across the feed. */}
      {questions.length > 0 && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Ask the team a question"
          className="fixed z-30 right-5 w-14 h-14 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center shadow-[0_8px_28px_rgba(99,102,241,0.45)] transition-transform active:scale-95 hover:scale-[1.03]"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 4.5V17.5M4.5 11H17.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <AnswerDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode="question"
        teamCode={code}
        onSubmitted={onQuestionSubmitted}
      />
    </main>
  )
}
