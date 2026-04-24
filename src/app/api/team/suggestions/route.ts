import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export interface SuggestionGroup {
  questionId: string
  questionText: string
  suggestions: string[]
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase()
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('id')
    .eq('code', code)
    .single()

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const { data: rows, error } = await supabaseAdmin
    .from('questions')
    .select('id, anonymized_text, synthesis(suggestions, created_at)')
    .eq('team_id', team.id)
    .eq('status', 'closed')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const groups: SuggestionGroup[] = (rows ?? [])
    .map((q) => {
      const syn = Array.isArray(q.synthesis) ? q.synthesis[0] : q.synthesis
      return {
        questionId: q.id,
        questionText: q.anonymized_text,
        suggestions: (syn?.suggestions ?? []) as string[],
      }
    })
    .filter((g) => g.suggestions.length > 0)

  return NextResponse.json({ groups })
}
