import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { anonymizeQuestion } from '@/lib/claude'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase()
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const { data: team } = await supabaseAdmin
    .from('teams').select('id').eq('code', code).single()
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('id, team_id, anonymized_text, status, answer_count, created_at')
    .eq('team_id', team.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { raw_text, team_code } = await req.json()

  if (!raw_text?.trim()) return NextResponse.json({ error: 'Empty question' }, { status: 400 })

  const { data: team } = await supabaseAdmin
    .from('teams').select('id').eq('code', team_code.toUpperCase()).single()
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const anonymized_text = await anonymizeQuestion(raw_text)

  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert({ team_id: team.id, anonymized_text })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
