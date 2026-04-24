import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { anonymizeQuestion } from '@/lib/claude'
import { insertSeedQuestion } from '@/lib/seed'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase()
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const { data: team } = await supabaseAdmin
    .from('teams').select('id').eq('code', code).single()
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const columns = 'id, team_id, anonymized_text, status, answer_count, is_ai_generated, label, created_at'

  const { data, error } = await supabaseAdmin
    .from('questions')
    .select(columns)
    .eq('team_id', team.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Quiet-team fallback: if no open questions exist, drop in a fresh AI nudge
  // before returning so the feed is never dead.
  const hasOpen = (data ?? []).some((q) => q.status === 'open')
  if (!hasOpen) {
    const seededId = await insertSeedQuestion(team.id)
    if (seededId) {
      const { data: refreshed } = await supabaseAdmin
        .from('questions')
        .select(columns)
        .eq('team_id', team.id)
        .order('created_at', { ascending: false })
      return NextResponse.json(refreshed ?? data)
    }
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { raw_text, team_code } = await req.json()

  if (!raw_text?.trim()) return NextResponse.json({ error: 'Empty question' }, { status: 400 })

  const { data: team } = await supabaseAdmin
    .from('teams').select('id').eq('code', team_code.toUpperCase()).single()
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const { text: anonymized_text, label } = await anonymizeQuestion(raw_text)

  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert({ team_id: team.id, anonymized_text, label })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
