'use client'

import { useEffect, useState } from 'react'
import type { SuggestionGroup } from '@/app/api/team/suggestions/route'

interface Props {
  code: string
  groups: SuggestionGroup[]
}

function storageKey(code: string) {
  return `unsaid:tried:${code}`
}

function loadTried(code: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(storageKey(code))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveTried(code: string, tried: Set<string>) {
  localStorage.setItem(storageKey(code), JSON.stringify([...tried]))
}

function triedKey(questionId: string, index: number) {
  return `${questionId}:${index}`
}

export default function SuggestionTracker({ code, groups }: Props) {
  const [tried, setTried] = useState<Set<string>>(new Set())

  useEffect(() => {
    setTried(loadTried(code))
  }, [code])

  function toggle(questionId: string, index: number) {
    const key = triedKey(questionId, index)
    setTried((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      saveTried(code, next)
      return next
    })
  }

  const totalSuggestions = groups.reduce((sum, g) => sum + g.suggestions.length, 0)
  const triedCount = groups.reduce(
    (sum, g) => sum + g.suggestions.filter((_, i) => tried.has(triedKey(g.questionId, i))).length,
    0,
  )

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-cream-muted uppercase tracking-widest">What to try</p>
        {totalSuggestions > 0 && (
          <p className="text-xs text-cream-muted">
            {triedCount} of {totalSuggestions} tried
          </p>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="bg-surface border border-white/5 rounded-2xl p-6 text-center">
          <p className="text-cream text-base font-medium mb-1.5">
            Suggestions appear after insights land.
          </p>
          <p className="text-cream-muted text-sm leading-relaxed">
            Finish a few threads and you'll see concrete things to try here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.questionId} className="bg-surface border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              {/* Question context */}
              <p className="text-xs text-cream-muted line-clamp-1">{group.questionText}</p>

              <ul className="flex flex-col gap-1">
                {group.suggestions.map((suggestion, i) => {
                  const key = triedKey(group.questionId, i)
                  const done = tried.has(key)

                  return (
                    <li key={i}>
                      <button
                        onClick={() => toggle(group.questionId, i)}
                        className="w-full flex items-start gap-3 py-2.5 text-left group"
                        style={{ minHeight: '44px' }}
                      >
                        {/* Checkbox */}
                        <span
                          className={[
                            'w-5 h-5 mt-0.5 flex-shrink-0 rounded-full border flex items-center justify-center transition-all duration-150',
                            done
                              ? 'bg-accent/20 border-accent'
                              : 'bg-transparent border-white/20 group-hover:border-white/40',
                          ].join(' ')}
                        >
                          {done && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                              className="text-accent"
                              style={{ animation: 'checkIn 150ms ease-out both' }}
                            >
                              <path
                                d="M1.5 5L3.8 7.5L8.5 2.5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>

                        {/* Suggestion text */}
                        <span
                          className={[
                            'text-base leading-relaxed transition-colors duration-150',
                            done ? 'text-cream/40 line-through' : 'text-cream',
                          ].join(' ')}
                        >
                          {suggestion}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
