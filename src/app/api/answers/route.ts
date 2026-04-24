import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { anonymizeAnswer } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const { raw_text, question_id } = await req.json()

  if (!raw_text?.trim()) return NextResponse.json({ error: 'Empty answer' }, { status: 400 })
  if (!question_id) return NextResponse.json({ error: 'Missing question_id' }, { status: 400 })

  // Fetch question + team in one go
  const { data: question } = await supabaseAdmin
    .from('questions')
    .select('id, status, answer_count, team_id')
    .eq('id', question_id)
    .single()

  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  if (question.status === 'closed') return NextResponse.json({ error: 'Question is closed' }, { status: 400 })

  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('member_count')
    .eq('id', question.team_id)
    .single()

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  // Anonymize before storing
  const anonymized_text = await anonymizeAnswer(raw_text)

  // Insert answer
  const { error: insertError } = await supabaseAdmin
    .from('answers')
    .insert({ question_id, anonymized_text })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Increment answer_count
  const newCount = question.answer_count + 1
  await supabaseAdmin
    .from('questions')
    .update({ answer_count: newCount })
    .eq('id', question_id)

  // Trigger synthesis if everyone has answered
  if (newCount >= team.member_count) {
    await fetch(`${req.nextUrl.origin}/api/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id }),
    })
  }

  return NextResponse.json({ ok: true, answer_count: newCount })
}
