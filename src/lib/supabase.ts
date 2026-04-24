import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser client — for reads from client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server client — for writes in API routes (bypasses RLS for inserts)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export type Team = {
  id: string
  code: string
  name: string
  member_count: number
  created_at: string
}

export type Question = {
  id: string
  team_id: string
  anonymized_text: string
  status: 'open' | 'closed'
  answer_count: number
  created_at: string
}

export type Answer = {
  id: string
  question_id: string
  anonymized_text: string
  created_at: string
}

export type Synthesis = {
  id: string
  question_id: string
  insight_text: string
  created_at: string
}
