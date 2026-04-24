'use client'

import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  mode: 'question' | 'answer'
  questionText?: string
  teamCode?: string
  questionId?: string
  onSubmitted?: () => void
}

export default function AnswerDrawer({
  isOpen, onClose, mode, questionText, teamCode, questionId, onSubmitted,
}: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      if (mode === 'question') {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_text: text, team_code: teamCode }),
        })
        if (!res.ok) {
          const d = await res.json()
          return setError(d.error || 'Something went wrong')
        }
      } else {
        const res = await fetch('/api/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_text: text, question_id: questionId }),
        })
        if (!res.ok) {
          const d = await res.json()
          return setError(d.error || 'Something went wrong')
        }
      }
      setText('')
      onSubmitted?.()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          className="bg-surface-raised rounded-t-2xl max-w-lg mx-auto px-4 pt-4"
          style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        >
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

          {mode === 'answer' && questionText && (
            <p className="text-cream-muted text-sm mb-4 leading-relaxed border-l-2 border-accent/40 pl-3">
              {questionText}
            </p>
          )}

          <h2 className="text-cream font-medium mb-3 text-sm">
            {mode === 'question' ? 'Ask the team something' : 'Your answer'}
          </h2>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === 'question'
                ? "What's on your mind? Be honest — it'll be anonymised."
                : 'Share your honest thoughts — your words will be anonymised before anyone sees them.'
            }
            rows={4}
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-cream placeholder:text-cream-muted/40 text-sm resize-none focus:outline-none focus:border-accent transition-colors"
          />

          <p className="text-cream-muted/50 text-xs mt-2 mb-4">
            Your writing style and tone will be rewritten before storing.
          </p>

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={text.trim().length === 0 || loading}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Anonymising…' : mode === 'question' ? 'Submit question' : 'Submit answer'}
          </button>
        </div>
      </div>
    </>
  )
}
