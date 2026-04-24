import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(req: NextRequest) {
  const { name, member_count } = await req.json()

  if (!name?.trim() || !member_count || member_count < 2) {
    return NextResponse.json({ error: 'Invalid team name or size' }, { status: 400 })
  }

  // Generate a unique 6-char code
  let code = generateCode()
  let attempts = 0
  while (attempts < 5) {
    const { data } = await supabaseAdmin.from('teams').select('id').eq('code', code).single()
    if (!data) break
    code = generateCode()
    attempts++
  }

  const { data, error } = await supabaseAdmin
    .from('teams')
    .insert({ code, name: name.trim(), member_count })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase()

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('teams')
    .select('id, code, name, member_count, created_at')
    .eq('code', code)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  return NextResponse.json(data)
}
