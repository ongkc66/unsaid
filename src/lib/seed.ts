import { supabaseAdmin } from './supabase-admin'
import { seedQuestion } from './claude'

/**
 * Generate and insert one AI-seeded question for a team.
 * Safe to call anywhere on the server — pulls team context and prior questions itself.
 * Pass `insightContext` after a synthesis to get a contextual follow-up (deeper / sideways)
 * instead of a cold-start seed.
 * Returns the inserted question id, or null if generation / insert failed.
 */
export async function insertSeedQuestion(
  teamId: string,
  insightContext?: string,
): Promise<string | null> {
  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('name, member_count')
    .eq('id', teamId)
    .single()
  if (!team) return null

  const { data: prior } = await supabaseAdmin
    .from('questions')
    .select('anonymized_text')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(5)

  try {
    const anonymized_text = await seedQuestion({
      teamName: team.name,
      memberCount: team.member_count,
      priorQuestions: (prior ?? []).map((q) => q.anonymized_text),
      insightContext,
    })

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert({ team_id: teamId, anonymized_text, is_ai_generated: true })
      .select('id')
      .single()

    if (error) return null
    return data.id
  } catch {
    return null
  }
}
