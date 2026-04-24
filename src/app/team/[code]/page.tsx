'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AnswerDrawer from '@/components/AnswerDrawer'
import type { Team, Question } from '@/lib/supabase'

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-accent flex-shrink-0">
      <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="currentColor" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 10V3C2 2.45 2.45 2 3 2H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export default function TeamFeed({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === '1'

  const [team, setTeam] = useState<Team | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [teamRes, qRes] = await Promise.all([
        fetch(`/api/team?code=${code}`),
        fetch(`/api/questions?code=${code}`),
      ])
      if (teamRes.ok) setTeam(await teamRes.json())
      if (qRes.ok) setQuestions(await qRes.json())
      setLoading(false)
    }
    load()
  }, [code])

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function onQuestionSubmitted() {
    setDrawerOpen(false)
    fetch(`/api/questions?code=${code}`)
      .then((r) => r.json())
      .then(setQuestions)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-cream-muted text-sm">Loading…</p>
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
    <main className="min-h-screen flex flex-col max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div>
          <p className="text-cream-muted text-xs uppercase tracking-widest mb-1">Team</p>
          <h1 className="text-cream text-xl font-semibold">{team.name}</h1>
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-white/5 hover:border-white/15 transition-colors"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-cream-muted text-xs font-mono">{code.toUpperCase()}</span>
          <CopyIcon />
        </button>
      </div>

      {/* New team share nudge */}
      {isNew && (
        <div className="mx-4 mb-4 bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-cream-muted text-xs leading-relaxed">
            Share code <span className="text-cream font-mono font-medium">{code}</span> with your team
          </p>
          <button
            onClick={copyCode}
            className="text-accent text-xs font-medium whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Question feed */}
      <div className="flex-1 flex flex-col gap-3 px-4 pb-36">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-surface border border-white/5 flex items-center justify-center">
              <SparkleIcon />
            </div>
            <div>
              <p className="text-cream text-sm font-medium mb-1">No questions yet</p>
              <p className="text-cream-muted/60 text-xs leading-relaxed max-w-xs">
                Be the first to ask something.<br />It'll be anonymised before anyone sees it.
              </p>
            </div>
          </div>
        ) : (
          questions.map((q) => (
            <Link key={q.id} href={`/team/${code}/question/${q.id}`}>
              {q.status === 'closed' ? (
                <div
                  className="rounded-2xl p-px"
                  style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4338ca 100%)' }}
                >
                  <div className="bg-[#13152A] rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <SparkleIcon />
                      <span className="text-xs text-accent font-medium">Insight ready</span>
                    </div>
                    <p className="text-cream text-sm leading-relaxed mb-3">{q.anonymized_text}</p>
                    <div className="flex items-center gap-1 text-accent text-xs font-medium">
                      View team insight
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-surface rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-cream-muted/70">
                      {q.answer_count} of {team.member_count} answered
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-cream-muted/30">
                      <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M4 5V3.5C4 2.12 5.12 1 6.5 1C7.88 1 9 2.12 9 3.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-cream/70 text-sm leading-relaxed mb-4">{q.anonymized_text}</p>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className="bg-accent/50 h-1.5 rounded-full"
                      style={{ width: `${Math.min((q.answer_count / team.member_count) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pt-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-4 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
          style={{ boxShadow: '0 4px 32px rgba(99,102,241,0.4)' }}
        >
          <PlusIcon />
          Ask the team something
        </button>
      </div>

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
