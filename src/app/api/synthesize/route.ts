import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { synthesize, generateInsightExtras } from '@/lib/claude'
import { insertSeedQuestion } from '@/lib/seed'
import { refreshTeamSummary } from '@/lib/team-summary'

export async function GET(req: NextRequest) {
  const question_id = req.nextUrl.searchParams.get('question_id')
  if (!question_id) return NextResponse.json({ error: 'Missing question_id' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('synthesis')
    .select('id, question_id, insight_text, themes, suggestions, created_at')
    .eq('question_id', question_id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { question_id } = await req.json()
  if (!question_id) return NextResponse.json({ error: 'Missing question_id' }, { status: 400 })

  // Fetch all anonymized answers
  const { data: answers } = await supabaseAdmin
    .from('answers')
    .select('anonymized_text')
    .eq('question_id', question_id)

  if (!answers || answers.length === 0) {
    return NextResponse.json({ error: 'No answers to synthesize' }, { status: 400 })
  }

  const answerTexts = answers.map((a) => a.anonymized_text)
  const insight_text = await synthesize(answerTexts)

  // Extras — themes + suggestions. Fail-safe: if Claude trips, persist empty
  // arrays so the insight reveal still lands and the UI degrades gracefully.
  let themes: string[] = []
  let suggestions: string[] = []
  try {
    const extras = await generateInsightExtras(insight_text, answerTexts)
    themes = extras.themes
    suggestions = extras.suggestions
  } catch {
    // swallow — insight > extras
  }

  // Save insight
  await supabaseAdmin
    .from('synthesis')
    .insert({ question_id, insight_text, themes, suggestions })

  // Close the question
  const { data: closed } = await supabaseAdmin
    .from('questions')
    .update({ status: 'closed' })
    .eq('id', question_id)
    .select('team_id')
    .single()

  if (closed?.team_id) {
    // Refresh the cached team summary with this new insight folded in.
    await refreshTeamSummary(closed.team_id)
    // Momentum: as one thread closes, drop in a contextual follow-up question
    // that deepens the insight the team just revealed.
    await insertSeedQuestion(closed.team_id, insight_text)
  }

  return NextResponse.json({ ok: true, insight_text })
}
