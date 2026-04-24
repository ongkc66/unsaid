import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { synthesize } from '@/lib/claude'

export async function GET(req: NextRequest) {
  const question_id = req.nextUrl.searchParams.get('question_id')
  if (!question_id) return NextResponse.json({ error: 'Missing question_id' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('synthesis')
    .select('id, question_id, insight_text, created_at')
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

  // Save insight
  await supabaseAdmin
    .from('synthesis')
    .insert({ question_id, insight_text })

  // Close the question
  await supabaseAdmin
    .from('questions')
    .update({ status: 'closed' })
    .eq('id', question_id)

  return NextResponse.json({ ok: true, insight_text })
}
