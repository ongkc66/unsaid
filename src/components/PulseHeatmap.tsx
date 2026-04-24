'use client'

import { useMemo, useState } from 'react'

export interface PulseDay {
  date: string       // 'YYYY-MM-DD'
  questions: number
  answers: number
}

interface Props {
  days: PulseDay[]
}

const CELL = 12        // 10px cell + 2px gap
const CELL_SIZE = 10
const WEEKS = 53
const DAYS = 7
const MONTH_LABEL_H = 16
const DAY_LABEL_W = 24

// Intensity buckets for total events per day
function level(total: number): 0 | 1 | 2 | 3 | 4 {
  if (total <= 0) return 0
  if (total === 1) return 1
  if (total <= 3) return 2
  if (total <= 6) return 3
  return 4
}

const LEVEL_FILLS = [
  'rgba(255,255,255,0.04)',     // 0 — no activity, barely visible
  'rgba(99,102,241,0.25)',      // 1
  'rgba(99,102,241,0.45)',      // 2
  'rgba(99,102,241,0.7)',       // 3
  'rgba(129,140,248,1)',        // 4+ — brightest
]

function startOfWeek(d: Date) {
  const copy = new Date(d)
  copy.setUTCHours(0, 0, 0, 0)
  copy.setUTCDate(copy.getUTCDate() - copy.getUTCDay()) // back to Sunday
  return copy
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PulseHeatmap({ days }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const { grid, monthLabels } = useMemo(() => {
    const byDate = new Map(days.map((d) => [d.date, d]))

    // End on today; start at Sunday of week-52-ago
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const endWeekStart = startOfWeek(today)
    const gridStart = new Date(endWeekStart)
    gridStart.setUTCDate(gridStart.getUTCDate() - (WEEKS - 1) * 7)

    type Cell = { date: string; total: number; q: number; a: number; inFuture: boolean }
    const grid: (Cell | null)[][] = []
    const monthLabels: { weekIndex: number; label: string }[] = []
    let lastMonth = -1

    for (let w = 0; w < WEEKS; w++) {
      const col: (Cell | null)[] = []
      for (let d = 0; d < DAYS; d++) {
        const dt = new Date(gridStart)
        dt.setUTCDate(gridStart.getUTCDate() + w * 7 + d)
        const inFuture = dt.getTime() > today.getTime()
        const iso = dt.toISOString().slice(0, 10)
        const rec = byDate.get(iso)
        col.push({
          date: iso,
          total: (rec?.questions ?? 0) + (rec?.answers ?? 0),
          q: rec?.questions ?? 0,
          a: rec?.answers ?? 0,
          inFuture,
        })
        // capture first-of-month on any row — then render label at top of that column
        if (d === 0) {
          const m = dt.getUTCMonth()
          if (m !== lastMonth) {
            monthLabels.push({
              weekIndex: w,
              label: dt.toLocaleDateString(undefined, { month: 'short' }),
            })
            lastMonth = m
          }
        }
      }
      grid.push(col)
    }
    return { grid, monthLabels }
  }, [days])

  const width = DAY_LABEL_W + WEEKS * CELL
  const height = MONTH_LABEL_H + DAYS * CELL

  const hoveredCell = hovered
    ? grid.flat().find((c) => c && c.date === hovered) ?? null
    : null

  return (
    <div className="flex flex-col gap-3">
      <div
        className="overflow-x-auto pb-2
          [scrollbar-width:thin]
          [scrollbar-color:rgba(99,102,241,0.35)_transparent]
          [&::-webkit-scrollbar]:h-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-white/10
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb:hover]:bg-accent/50"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <svg
          width={width}
          height={height}
          className="block"
          role="img"
          aria-label="Team pulse heatmap, past 53 weeks"
        >
          {/* Month labels */}
          {monthLabels.map(({ weekIndex, label }) => (
            <text
              key={`${weekIndex}-${label}`}
              x={DAY_LABEL_W + weekIndex * CELL}
              y={12}
              fontSize={11}
              fill="rgba(240,238,230,0.7)"
              fontFamily="inherit"
            >
              {label}
            </text>
          ))}

          {/* Day labels (Mon/Wed/Fri) */}
          {[
            { row: 1, label: 'Mon' },
            { row: 3, label: 'Wed' },
            { row: 5, label: 'Fri' },
          ].map(({ row, label }) => (
            <text
              key={label}
              x={0}
              y={MONTH_LABEL_H + row * CELL + 8}
              fontSize={11}
              fill="rgba(240,238,230,0.7)"
              fontFamily="inherit"
            >
              {label}
            </text>
          ))}

          {/* Cells */}
          {grid.map((col, wIdx) =>
            col.map((cell, dIdx) => {
              if (!cell) return null
              const x = DAY_LABEL_W + wIdx * CELL
              const y = MONTH_LABEL_H + dIdx * CELL
              const lv = level(cell.total)
              const fill = cell.inFuture ? 'transparent' : LEVEL_FILLS[lv]
              const stroke = cell.inFuture ? 'transparent' : 'rgba(255,255,255,0.03)'
              return (
                <rect
                  key={cell.date}
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  ry={2}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1}
                  onMouseEnter={() => !cell.inFuture && setHovered(cell.date)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => !cell.inFuture && setHovered((prev) => (prev === cell.date ? null : cell.date))}
                  style={{ cursor: cell.inFuture ? 'default' : 'pointer' }}
                />
              )
            }),
          )}
        </svg>
      </div>

      {/* Footer: tooltip-area + legend */}
      <div className="flex items-center justify-between text-sm text-cream-muted min-h-[24px] px-1">
        <span className="leading-tight">
          {hoveredCell ? (
            <>
              <span className="text-cream font-medium">{hoveredCell.total}</span>
              {' '}
              {hoveredCell.total === 1 ? 'event' : 'events'} on {formatDate(hoveredCell.date)}
              {hoveredCell.total > 0 && (
                <span className="text-cream-muted/80">
                  {' '}· {hoveredCell.q} question{hoveredCell.q === 1 ? '' : 's'}, {hoveredCell.a} answer{hoveredCell.a === 1 ? '' : 's'}
                </span>
              )}
            </>
          ) : (
            <span className="text-cream-muted/80">Tap or hover a day to see its pulse.</span>
          )}
        </span>
        <span className="hidden sm:flex items-center gap-1.5 flex-shrink-0 text-xs">
          <span>Less</span>
          {LEVEL_FILLS.map((c, i) => (
            <span
              key={i}
              className="inline-block rounded-[2px]"
              style={{ width: 12, height: 12, background: c, border: '1px solid rgba(255,255,255,0.05)' }}
            />
          ))}
          <span>More</span>
        </span>
      </div>
    </div>
  )
}
