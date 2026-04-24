'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import AnswerDrawer from '@/components/AnswerDrawer'
import type { Question, Synthesis } from '@/lib/supabase'

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="text-accent flex-shrink-0">
      <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="currentColor" />
    </svg>
  )
}

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
  const [question, setQuestion] = useState<Question | null>(null)
  const [synthesis, setSynthesis] = useState<Synthesis | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const [qRes, teamRes] = await Promise.all([
      fetch(`/api/questions/${id}`),
      fetch(`/api/team?code=${code}`),
    ])
    if (qRes.ok) {
      const q: Question = await qRes.json()
      setQuestion(q)
      if (q.status === 'closed') {
        const sRes = await fetch(`/api/synthesize?question_id=${id}`)
        if (sRes.ok) setSynthesis(await sRes.json())
      }
    }
    if (teamRes.ok) {
      const t = await teamRes.json()
      setMemberCount(t.member_count)
    }
    setHasAnswered(getAnswered().includes(id))
    setLoading(false)
  }

  useEffect(() => { load() }, [id, code])

  function onAnswerSubmitted() {
    markAnswered(id)
    setHasAnswered(true)
    setDrawerOpen(false)
    load()
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-cream-muted text-sm">Loading…</p>
      </main>
    )
  }

  if (!question) {
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
    <main className="min-h-screen flex flex-col max-w-lg mx-auto px-4 pb-16">

      {/* Back nav */}
      <div className="pt-12 pb-6">
        <Link
          href={`/team/${code}`}
          className="text-cream-muted text-sm flex items-center gap-1.5 hover:text-cream transition-colors w-fit"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
      </div>

      {/* Question card */}
      <div className="bg-surface rounded-2xl p-5 border border-white/5 mb-6">
        <p className="text-xs text-cream-muted uppercase tracking-widest mb-3">The question</p>
        <p className="text-cream text-base leading-relaxed">{question.anonymized_text}</p>
      </div>

      {isClosed ? (
        /* ── Synthesis revealed ── */
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <SparkleIcon />
            <p className="text-xs text-cream-muted uppercase tracking-widest">Team insight</p>
          </div>

          <div
            className="rounded-2xl p-px"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818cf8 50%, #4338ca 100%)' }}
          >
            <div className="bg-[#0f1123] rounded-2xl p-6">
              <p className="text-cream text-base leading-7">
                {synthesis?.insight_text ?? 'Generating insight…'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-1">
            <div className="h-px flex-1 bg-white/5" />
            <p className="text-cream-muted/40 text-xs whitespace-nowrap">
              Synthesised from {question.answer_count} anonymous answers
            </p>
            <div className="h-px flex-1 bg-white/5" />
          </div>
        </div>
      ) : (
        /* ── Pending state ── */
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-cream-muted">
              <span>{question.answer_count} of {memberCount} answered</span>
              <span className="text-cream-muted/50">Unlocks when everyone answers</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5">
              <div
                className="bg-accent h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min((question.answer_count / memberCount) * 100, 100)}%` }}
              />
            </div>
          </div>

          {hasAnswered ? (
            <div className="bg-surface rounded-2xl p-5 border border-white/5 text-center">
              <p className="text-cream-muted text-sm">
                You've answered. Waiting for the rest of the team.
              </p>
            </div>
          ) : (
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-4 rounded-2xl transition-colors text-sm"
              style={{ boxShadow: '0 4px 24px rgba(99,102,241,0.35)' }}
            >
              Answer this question
            </button>
          )}

          <p className="text-cream-muted/30 text-xs text-center leading-relaxed">
            Your answer is rewritten before it's stored.<br />No one sees your original words.
          </p>
        </div>
      )}

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
