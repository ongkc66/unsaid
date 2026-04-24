'use client'

import { use, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import AnswerDrawer from '@/components/AnswerDrawer'
import InsightReveal from '@/components/InsightReveal'
import { supabase } from '@/lib/supabase'
import type { Question, Synthesis, Team } from '@/lib/supabase'

const ANSWERED_KEY = 'unsaid_answered'

function getAnswered(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(ANSWERED_KEY) || '[]') } catch { return [] }
}

function markAnswered(id: string) {
  const answered = getAnswered()
  localStorage.setItem(ANSWERED_KEY, JSON.stringify([...answered, id]))
}

export default function QuestionDetail({
  params,
}: {
  params: Promise<{ code: string; id: string }>
}) {
  const { code, id } = use(params)
  const [team, setTeam] = useState<Team | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [synthesis, setSynthesis] = useState<Synthesis | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [loading, setLoading] = useState(true)
  const prevStatusRef = useRef<'open' | 'closed' | null>(null)
  const [countPulse, setCountPulse] = useState(0)

  async function load() {
    const [qRes, teamRes] = await Promise.all([
      fetch(`/api/questions/${id}`),
      fetch(`/api/team?code=${code}`),
    ])
    if (qRes.ok) {
      const q: Question = await qRes.json()
      setQuestion((prev) => {
        if (prev && prev.answer_count !== q.answer_count) setCountPulse((n) => n + 1)
        return q
      })
      if (q.status === 'closed') {
        const sRes = await fetch(`/api/synthesize?question_id=${id}`)
        if (sRes.ok) setSynthesis(await sRes.json())
      }
    }
    if (teamRes.ok) setTeam(await teamRes.json())
    setHasAnswered(getAnswered().includes(id))
    setLoading(false)
  }

  useEffect(() => { load() }, [id, code])

  // Realtime: watch this question + its synthesis
  useEffect(() => {
    const channel = supabase
      .channel(`question-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'questions', filter: `id=eq.${id}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'synthesis', filter: `question_id=eq.${id}` },
        (payload) => setSynthesis(payload.new as Synthesis),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  // Track status transitions for the reveal moment
  useEffect(() => {
    if (question) prevStatusRef.current = question.status
  }, [question])

  function onAnswerSubmitted() {
    markAnswered(id)
    setHasAnswered(true)
    setDrawerOpen(false)
    load()
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col max-w-2xl lg:max-w-5xl mx-auto pb-28">
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <div className="h-2.5 w-10 bg-white/8 rounded-full animate-pulse" />
          <div className="h-2.5 w-24 bg-white/8 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-white/8 rounded-full animate-pulse" />
        </div>
        <div className="px-4 pb-4">
          <div className="h-3 w-20 bg-white/8 rounded-full animate-pulse" />
        </div>
        <div className="px-4 flex flex-col gap-6">
          {/* Question card */}
          <div className="bg-surface rounded-2xl p-5 border border-white/5 animate-pulse">
            <div className="h-2.5 w-20 bg-white/8 rounded-full mb-3" />
            <div className="h-5 w-full bg-white/8 rounded-full mb-2" />
            <div className="h-5 w-4/5 bg-white/8 rounded-full" />
          </div>
          {/* Progress */}
          <div className="flex flex-col gap-2 animate-pulse [animation-delay:150ms]">
            <div className="flex justify-between">
              <div className="h-2.5 w-24 bg-white/8 rounded-full" />
              <div className="h-2.5 w-36 bg-white/8 rounded-full" />
            </div>
            <div className="h-1.5 w-full bg-white/8 rounded-full" />
          </div>
          {/* CTA */}
          <div className="h-14 w-full bg-white/8 rounded-2xl animate-pulse [animation-delay:300ms]" />
        </div>
      </main>
    )
  }

  if (!question || !team) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-cream text-sm mb-2">Question not found</p>
          <Link href={`/team/${code}`} className="text-accent text-xs">← Back to feed</Link>
        </div>
      </main>
    )
  }

  const isClosed = question.status === 'closed'

  return (
    <main className="min-h-screen flex flex-col max-w-2xl lg:max-w-5xl mx-auto pb-28">

      <AppHeader teamName={team.name} code={code} />

      {/* Back to feed */}
      <div className="px-4 pb-4">
        <Link
          href={`/team/${code}`}
          className="text-cream-muted text-sm flex items-center gap-1.5 hover:text-cream transition-colors w-fit"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to feed
        </Link>
      </div>

      <div className="px-4">
        {/* Pending state shows the question card so the answerer has context.
            Closed state lets the InsightReveal own the page — no redundant question card. */}
        {!isClosed && (
          <div className="bg-surface rounded-2xl p-5 border border-white/5 mb-6">
            <p className="text-xs text-cream-muted uppercase tracking-widest mb-3">The question</p>
            <p className="text-cream text-lg leading-relaxed">{question.anonymized_text}</p>
          </div>
        )}

        {isClosed ? (
          synthesis ? (
            <InsightReveal
              key={synthesis.id}
              text={synthesis.insight_text}
              themes={synthesis.themes}
              suggestions={synthesis.suggestions}
            />
          ) : (
            <div className="flex items-center justify-center gap-2 text-cream-muted text-sm py-12">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Generating insight…
            </div>
          )
        ) : (
          /* ── Pending state ── */
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm text-cream-muted">
                <span>
                  <span key={countPulse} className="count-flash font-medium">
                    {question.answer_count}
                  </span>{' '}
                  of {team.member_count} answered
                </span>
                <span className="text-cream-muted/80">Unlocks when everyone answers</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-accent h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min((question.answer_count / team.member_count) * 100, 100)}%` }}
                />
              </div>
            </div>

            {hasAnswered ? (
              <div className="bg-surface rounded-2xl p-5 border border-white/5 text-center">
                <p className="text-cream-muted text-base">
                  You've answered. Waiting for the rest of the team.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-4 rounded-2xl transition-colors text-base"
                style={{ boxShadow: '0 4px 24px rgba(99,102,241,0.35)' }}
              >
                Answer this question
              </button>
            )}

            <p className="text-cream-muted/80 text-sm text-center leading-relaxed">
              Your answer is rewritten before it's stored.<br />No one sees your original words.
            </p>
          </div>
        )}
      </div>

      <AnswerDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode="answer"
        questionText={question.anonymized_text}
        questionId={id}
        onSubmitted={onAnswerSubmitted}
      />
    </main>
  )
}
