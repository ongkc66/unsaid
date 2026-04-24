'use client'

import { useEffect, useState } from 'react'

interface Props {
  closed: number
  total: number
}

const RADIUS = 44
const STROKE = 10
const SIZE = 120
const CENTER = SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function CompletionRing({ closed, total }: Props) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const pct = total === 0 ? 0 : closed / total
  const filled = pct * CIRCUMFERENCE
  const label = total === 0 ? '—' : `${Math.round(pct * 100)}%`

  return (
    <section className="flex flex-col gap-4">
      <p className="text-xs text-cream-muted uppercase tracking-widest">Thread completion</p>

      <div className="bg-surface border border-white/5 rounded-2xl p-6 flex items-center gap-8">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {/* Track */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={STROKE}
            />
            {/* Fill */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="#6366F1"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${animated ? filled : 0} ${CIRCUMFERENCE}`}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </svg>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-cream text-xl font-semibold tabular-nums leading-none">{label}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-1">
            <span className="text-cream text-2xl font-semibold tabular-nums leading-none">{closed}</span>
            <span className="text-cream-muted text-sm leading-snug">
              {closed === 1 ? 'thread' : 'threads'} resolved
            </span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex flex-col gap-1">
            <span className="text-cream-muted/80 text-2xl font-semibold tabular-nums leading-none">{total - closed}</span>
            <span className="text-cream-muted text-sm leading-snug">
              {total - closed === 1 ? 'thread' : 'threads'} in progress
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
