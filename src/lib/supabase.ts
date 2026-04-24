import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser-safe client — for reads and realtime subscriptions from client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Team = {
  id: string
  code: string
  name: string
  member_count: number
  summary_text: string | null
  summary_themes: string[]
  summary_generated_at: string | null
  summary_source_count: number
  created_at: string
}

export type Question = {
  id: string
  team_id: string
  anonymized_text: string
  status: 'open' | 'closed'
  answer_count: number
  is_ai_generated: boolean
  label: string | null
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
  themes: string[]
  suggestions: string[]
  created_at: string
}
