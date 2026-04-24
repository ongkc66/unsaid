import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Daily activity counts (questions + answers) for the last 53 weeks.
 * Grouped in JS after a single query per table — small scale, simple code.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase()
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const { data: team } = await supabaseAdmin
    .from('teams').select('id').eq('code', code).single()
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)
  since.setUTCDate(since.getUTCDate() - 371) // 53 weeks

  const [{ data: questions }, { data: answers }, { count: totalQuestions }, { count: closedQuestions }, { count: aiQuestions }] = await Promise.all([
    supabaseAdmin
      .from('questions')
      .select('created_at')
      .eq('team_id', team.id)
      .gte('created_at', since.toISOString()),
    supabaseAdmin
      .from('answers')
      .select('created_at, question_id, questions!inner(team_id)')
      .eq('questions.team_id', team.id)
      .gte('created_at', since.toISOString()),
    supabaseAdmin
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id),
    supabaseAdmin
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .eq('status', 'closed'),
    supabaseAdmin
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .eq('is_ai_generated', true),
  ])

  const counts = new Map<string, { questions: number; answers: number }>()
  const bump = (iso: string, key: 'questions' | 'answers') => {
    const day = iso.slice(0, 10)
    const cur = counts.get(day) ?? { questions: 0, answers: 0 }
    cur[key] += 1
    counts.set(day, cur)
  }
  ;(questions ?? []).forEach((q) => bump(q.created_at, 'questions'))
  ;(answers ?? []).forEach((a) => bump(a.created_at, 'answers'))

  const days = Array.from(counts.entries())
    .map(([date, c]) => ({ date, questions: c.questions, answers: c.answers }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  return NextResponse.json({
    days,
    totalQuestions: totalQuestions ?? 0,
    closedQuestions: closedQuestions ?? 0,
    aiQuestions: aiQuestions ?? 0,
  })
}
