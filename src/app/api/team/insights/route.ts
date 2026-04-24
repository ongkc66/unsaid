import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export interface InsightEntry {
  questionId: string
  questionText: string
  insightText: string
  themes: string[]
  suggestions: string[]
  createdAt: string
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
    .select('id, anonymized_text, synthesis(insight_text, themes, suggestions, created_at)')
    .eq('team_id', team.id)
    .eq('status', 'closed')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const insights: InsightEntry[] = (rows ?? [])
    .map((q) => {
      const syn = Array.isArray(q.synthesis) ? q.synthesis[0] : q.synthesis
      if (!syn) return null
      return {
        questionId: q.id,
        questionText: q.anonymized_text,
        insightText: syn.insight_text as string,
        themes: (syn.themes ?? []) as string[],
        suggestions: (syn.suggestions ?? []) as string[],
        createdAt: syn.created_at as string,
      }
    })
    .filter(Boolean) as InsightEntry[]

  return NextResponse.json({ insights })
}
