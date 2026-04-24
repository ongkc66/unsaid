'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [memberCount, setMemberCount] = useState(3)
  const [teamName, setTeamName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      router.push(`/team/${data.code}?new=1`)
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm flex flex-col gap-12">

        {/* Wordmark */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-cream">Unsaid</h1>
          <p className="text-cream-muted text-sm leading-relaxed">
            A space for the things your team<br />thinks, but never says out loud.
          </p>
        </div>

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
                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-cream placeholder:text-cream-muted/40 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-cream-muted uppercase tracking-widest">Team size</label>
              <div className="flex items-center bg-surface border border-white/10 rounded-xl overflow-hidden">
                <button onClick={decrement} className="px-5 py-3 text-cream-muted hover:text-cream text-lg transition-colors">−</button>
                <span className="flex-1 text-center text-cream text-sm font-medium">{memberCount} people</span>
                <button onClick={increment} className="px-5 py-3 text-cream-muted hover:text-cream text-lg transition-colors">+</button>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition-colors text-sm mt-1"
            >
              {loading ? 'Creating…' : 'Create team'}
            </button>

            <button
              onClick={() => { setMode('join'); setError('') }}
              className="text-center text-cream-muted/60 hover:text-cream-muted text-xs transition-colors"
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
                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-cream placeholder:text-cream-muted/40 text-sm tracking-widest uppercase focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Looking up…' : 'Join team'}
            </button>

            <button
              onClick={() => { setMode('create'); setError('') }}
              className="text-center text-cream-muted/60 hover:text-cream-muted text-xs transition-colors"
            >
              ← Create a new team instead
            </button>
          </div>
        )}

        <p className="text-center text-cream-muted/30 text-xs -mt-4">
          No account needed · Fully anonymous
        </p>
      </div>
    </main>
  )
}
