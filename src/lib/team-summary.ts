import { supabaseAdmin } from './supabase-admin'
import { generateTeamSummary } from './claude'

/**
 * (Re)generate and cache the team summary from every prior synthesis.
 * Safe to call from any server route — swallows its own failures so the
 * primary flow never breaks on summary issues.
 *
 * Returns `true` if the summary was freshly written, `false` otherwise
 * (not enough signal, Claude failure, empty output).
 */
export async function refreshTeamSummary(teamId: string): Promise<boolean> {
  const { data: team } = await supabaseAdmin
    .from('teams').select('name').eq('id', teamId).single()
  if (!team) return false

  const { data: syntheses } = await supabaseAdmin
    .from('synthesis')
    .select('insight_text, themes, created_at, questions!inner(team_id)')
    .eq('questions.team_id', teamId)
    .order('created_at', { ascending: false })

  const rows = (syntheses ?? []).map((s) => ({
    insight_text: s.insight_text,
    themes: s.themes ?? [],
  }))

  if (rows.length < 2) return false

  try {
    const { summary, themes } = await generateTeamSummary({
      teamName: team.name,
      insights: rows,
    })
    if (!summary) return false

    await supabaseAdmin
      .from('teams')
      .update({
        summary_text: summary,
        summary_themes: themes,
        summary_generated_at: new Date().toISOString(),
        summary_source_count: rows.length,
      })
      .eq('id', teamId)

    return true
  } catch (err) {
    console.error('[refreshTeamSummary] failed', err)
    return false
  }
}
