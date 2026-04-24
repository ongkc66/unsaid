'use client'

import { useEffect, useState } from 'react'

interface ThemeCount {
  name: string
  count: number
}

interface Props {
  themes: ThemeCount[]
  totalInsights: number
}

export default function ThemeFrequency({ themes, totalInsights }: Props) {
  const [animated, setAnimated] = useState(false)

  // Trigger bar-fill animation after first paint
  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const max = themes[0]?.count ?? 1

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-cream-muted uppercase tracking-widest mb-2">Recurring themes</p>
          <p className="text-cream text-base font-medium leading-snug">What your team keeps circling.</p>
        </div>
        {totalInsights > 0 && (
          <p className="text-xs text-cream-muted pb-0.5">
            {totalInsights} {totalInsights === 1 ? 'insight' : 'insights'}
          </p>
        )}
      </div>

      {themes.length === 0 ? (
        <div className="bg-surface border border-white/5 rounded-2xl p-6 text-center">
          <p className="text-cream text-base font-medium mb-1.5">Themes appear as insights accumulate.</p>
          <p className="text-cream-muted text-sm leading-relaxed">
            Finish a few threads and the patterns will surface here.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
          {themes.map((theme, i) => {
            const pct = (theme.count / max) * 100
            // Bars fade slightly from top to bottom — visual hierarchy
            const opacity = i === 0 ? 1 : Math.max(0.45, 1 - i * 0.1)
            return (
              <div key={theme.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-cream text-sm capitalize">{theme.name}</span>
                  <span className="text-cream-muted text-xs tabular-nums">
                    {theme.count}×
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                    style={{
                      width: animated ? `${pct}%` : '0%',
                      opacity,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
