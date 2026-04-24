'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { REVEAL_WORD_MS } from '@/lib/reveal'

type LastTeam = { code: string; name: string }

const PREVIEW_QUESTION = "What would make your work feel more meaningful, day to day?"
const PREVIEW_INSIGHT = "The team is searching for clearer connection between their daily work and something that matters beyond the sprint. Autonomy is broadly valued — but purpose and direction are what would make it feel complete."
const PREVIEW_TOKENS = PREVIEW_INSIGHT.split(/(\s+)/)
const PREVIEW_WORD_COUNT = PREVIEW_TOKENS.filter((t) => t.trim().length > 0).length

const PROMPTS = [
  "What's one thing you wish your manager understood about your work?",
  'Where do you feel most overlooked or undervalued right now?',
  "What would make your team's meetings actually worth attending?",
  "What's one change that would make work feel less draining?",
  "What are you holding back from saying in your next 1:1?",
]

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [memberCount, setMemberCount] = useState(3)
  const [teamName, setTeamName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastTeam, setLastTeam] = useState<LastTeam | null>(null)
  const [promptIdx, setPromptIdx] = useState(0)
  const [promptKey, setPromptKey] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('unsaid_last_team')
      if (stored) setLastTeam(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setPromptIdx((i) => (i + 1) % PROMPTS.length)
      setPromptKey((k) => k + 1)
    }, 3800)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setPreviewVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const decrement = () => setMemberCount((n) => Math.max(2, n - 1))
  const increment = () => setMemberCount((n) => n + 1)

  async function handleCreate() {
    if (!teamName.trim()) return setError('Please enter a team name')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName, member_count: memberCount }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Something went wrong')
      router.push(`/team/${data.code}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (joinCode.length !== 6) return setError('Please enter a 6-character code')
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/team?code=${joinCode.toUpperCase()}`)
      const data = await res.json()
      if (!res.ok) return setError('Team not found. Check the code and try again.')
      router.push(`/team/${data.code}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRejoin() {
    if (!lastTeam) return
    setLoading(true)
    try {
      const res = await fetch(`/api/team?code=${lastTeam.code}`)
      if (res.ok) {
        router.push(`/team/${lastTeam.code}`)
      } else {
        localStorage.removeItem('unsaid_last_team')
        setLastTeam(null)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 pb-28 overflow-hidden">

      {/* Ambient background orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="orb-a absolute top-[-80px] left-[-60px] w-[340px] h-[340px] rounded-full bg-accent/10 blur-[90px]" />
        <div className="orb-b absolute bottom-[-60px] right-[-80px] w-[300px] h-[300px] rounded-full bg-violet-600/8 blur-[80px]" />
        <div className="orb-c absolute top-[40%] left-[55%] w-[220px] h-[220px] rounded-full bg-indigo-800/10 blur-[70px]" />
      </div>

      <div className="relative w-full max-w-lg flex flex-col gap-9">

        {/* Wordmark + hero */}
        <div className={`flex flex-col gap-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div>
            <p className="text-xs text-accent font-semibold uppercase tracking-[0.2em] mb-3">Anonymous team insights</p>
            <h1 className="text-[2.6rem] font-semibold tracking-tight text-cream leading-[1.1]">
              What's really<br />on your team's mind?
            </h1>
          </div>
          <p className="text-cream-muted text-sm leading-relaxed">
            Unsaid gives your team a safe space to share honestly — every response anonymised by AI before anyone sees it.
          </p>
        </div>

        {/* Rotating prompt — primes users on what to ask */}
        <div
          className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
        >
          <div className="rounded-2xl bg-surface border border-white/5 p-4 overflow-hidden min-h-[80px] flex flex-col justify-center">
            <p className="text-xs text-accent/80 font-medium uppercase tracking-widest mb-2">Teams are asking…</p>
            <p
              key={promptKey}
              className="prompt-in text-cream text-sm leading-relaxed italic"
            >
              "{PROMPTS[promptIdx]}"
            </p>
          </div>
        </div>

        {/* Rejoin shortcut */}
        {lastTeam && (
          <button
            onClick={handleRejoin}
            disabled={loading}
            className="w-full flex items-center justify-between bg-surface border border-white/10 hover:border-accent/40 rounded-xl px-4 py-3.5 transition-colors group"
          >
            <div className="text-left">
              <p className="text-cream-muted text-xs mb-1">Continue as</p>
              <p className="text-cream text-base font-medium">{lastTeam.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cream-muted text-sm font-mono">{lastTeam.code}</span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-cream-muted/80 group-hover:text-accent transition-colors">
                <path d="M4 8H12M9 5L12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        )}

        {/* Create / Join form */}
        <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          {mode === 'create' ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-cream-muted uppercase tracking-widest">Team name</label>
                <input
                  type="text"
                  placeholder="e.g. Product Squad"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-cream placeholder:text-cream-muted/80 text-base focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-cream-muted uppercase tracking-widest">Team size</label>
                <div className="flex items-center bg-surface border border-white/10 rounded-xl overflow-hidden">
                  <button onClick={decrement} className="px-5 py-3 text-cream-muted hover:text-cream text-xl transition-colors min-h-[44px]">−</button>
                  <span className="flex-1 text-center text-cream text-base font-medium">{memberCount} people</span>
                  <button onClick={increment} className="px-5 py-3 text-cream-muted hover:text-cream text-xl transition-colors min-h-[44px]">+</button>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition-colors text-base min-h-[52px]"
              >
                {loading ? 'Creating…' : 'Create safe space'}
              </button>

              <button
                onClick={() => { setMode('join'); setError('') }}
                className="text-center text-cream-muted hover:text-cream text-sm transition-colors"
              >
                Already have a code? Join instead →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-cream-muted uppercase tracking-widest">Team code</label>
                <input
                  type="text"
                  placeholder="XXXXXX"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-cream placeholder:text-cream-muted/80 text-base tracking-widest uppercase focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition-colors text-base min-h-[52px]"
              >
                {loading ? 'Looking up…' : 'Join team'}
              </button>

              <button
                onClick={() => { setMode('create'); setError('') }}
                className="text-center text-cream-muted hover:text-cream text-sm transition-colors"
              >
                ← Create a new team instead
              </button>
            </div>
          )}
        </div>

        {/* Trust footer */}
        <div className={`flex items-center justify-center gap-4 transition-all duration-700 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <span className="flex items-center gap-1.5 text-cream-muted/80 text-xs">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1"/><path d="M3.5 5L4.5 6L6.5 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            No account needed
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1.5 text-cream-muted/80 text-xs">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="2" y="4.5" width="6" height="5" rx="0.8" stroke="currentColor" strokeWidth="1"/><path d="M3.5 4.5V3C3.5 1.9 4.17 1 5 1C5.83 1 6.5 1.9 6.5 3V4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
            Fully anonymous
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1.5 text-cream-muted/80 text-xs">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1L6.2 3.8L9 4.5L6.8 6.5L7.3 9L5 7.7L2.7 9L3.2 6.5L1 4.5L3.8 3.8L5 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
            AI-rewritten
          </span>
        </div>

        {/* ── See it in action preview ─────────────────── */}
        <div
          ref={previewRef}
          className={`flex flex-col gap-5 transition-all duration-700 delay-[400ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Section divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <p className="text-xs text-cream-muted uppercase tracking-[0.2em] whitespace-nowrap">See it in action</p>
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-xs text-cream-muted/80 bg-white/5 rounded-full px-2.5 py-0.5 whitespace-nowrap">Example</span>
          </div>

          {/* Question card — sealed state → all answered */}
          <div className="rounded-2xl bg-surface border border-white/5 p-5 flex flex-col gap-4">
            <div>
              <p className="text-xs text-cream-muted uppercase tracking-widest mb-3">Question</p>
              <p className="text-cream text-sm leading-relaxed italic">"{PREVIEW_QUESTION}"</p>
            </div>
            {/* Progress bar animates to full when visible */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-1000 ease-out"
                  style={{ width: previewVisible ? '100%' : '0%' }}
                />
              </div>
              <span className={`text-xs font-medium transition-colors duration-500 ${previewVisible ? 'text-accent' : 'text-cream-muted/80'}`}>
                3 of 3 answered
              </span>
            </div>
          </div>

          {/* Insight card — the reveal moment */}
          <div className="relative rounded-2xl bg-surface-raised border border-accent/20 p-5 overflow-hidden">
            {/* Breathing glow */}
            <div aria-hidden className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${previewVisible ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[140px] rounded-full bg-accent/20 blur-[70px] preview-bloom" />
            </div>

            <div className="relative">
              {/* Label */}
              <div className="flex items-center gap-2 mb-3">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-accent/80 shrink-0">
                  <path d="M6 1L7.4 4.5L11 5.2L8.4 7.6L9.1 11L6 9.4L2.9 11L3.6 7.6L1 5.2L4.6 4.5L6 1Z" fill="currentColor" />
                </svg>
                <p className="text-xs text-accent/80 uppercase tracking-widest">Team insight</p>
              </div>

              {/* Word-by-word reveal — split with /(\s+)/ so whitespace tokens render as siblings, not inside inline-block spans */}
              <p className="text-cream text-base font-medium leading-relaxed mb-5">
                {PREVIEW_TOKENS.map((token, i) => {
                  if (token.trim().length === 0) return <span key={i}>{token}</span>
                  const wordIdx = PREVIEW_TOKENS.slice(0, i).filter((t) => t.trim()).length
                  return previewVisible ? (
                    <span key={i} className="reveal-word" style={{ animationDelay: `${wordIdx * REVEAL_WORD_MS}ms` }}>
                      {token}
                    </span>
                  ) : (
                    <span key={i} style={{ opacity: 0 }}>{token}</span>
                  )
                })}
              </p>

              {/* Divider — appears after words finish */}
              <div
                className="flex items-center gap-3 transition-opacity duration-700"
                style={{
                  opacity: previewVisible ? 1 : 0,
                  transitionDelay: previewVisible ? `${PREVIEW_WORD_COUNT * REVEAL_WORD_MS + 200}ms` : '0ms',
                }}
              >
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-cream-muted/80 italic">Distilled from the team</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
