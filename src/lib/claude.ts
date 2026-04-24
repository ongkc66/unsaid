import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const QUESTION_LABELS = ['Culture', 'Leadership', 'Process', 'Wellbeing', 'Growth', 'Recognition', 'Communication'] as const
export type QuestionLabel = typeof QUESTION_LABELS[number]

export async function anonymizeQuestion(raw: string): Promise<{ text: string; label: QuestionLabel }> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 320,
    system: [
      'You rewrite questions to be completely anonymous AND classify them.',
      '',
      'Output JSON only (no code fences, no explanation):',
      '{ "text": "rewritten question", "label": "one label" }',
      '',
      'Rules for "text":',
      '- Remove all identifying tone, writing style, and personal markers.',
      '- Neutral, third-person question that preserves the original meaning.',
      '',
      'Rules for "label" — pick exactly one from:',
      'Culture (team norms, belonging, psychological safety)',
      'Leadership (managers, direction, trust in leadership)',
      'Process (how work gets done, meetings, tools, workflows)',
      'Wellbeing (energy, stress, burnout, work-life balance)',
      'Growth (learning, career, skills, development)',
      'Recognition (appreciation, fairness, visibility)',
      'Communication (clarity, transparency, information sharing)',
    ].join('\n'),
    messages: [{ role: 'user', content: raw }],
  })
  const raw_out = extractText(msg)
  const cleaned = stripCodeFences(raw_out)
  try {
    const parsed = JSON.parse(cleaned)
    const text = typeof parsed.text === 'string' ? parsed.text.trim() : raw
    const label = (QUESTION_LABELS as readonly string[]).includes(parsed.label) ? parsed.label as QuestionLabel : 'Culture'
    return { text, label }
  } catch {
    return { text: raw, label: 'Culture' }
  }
}

export async function anonymizeAnswer(raw: string): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system:
      'You rewrite answers to be completely anonymous. Remove all identifying tone, writing style, and personal markers. Preserve the core meaning in neutral, third-person language. Output only the rewritten answer — no explanation, no quotes.',
    messages: [{ role: 'user', content: raw }],
  })
  return extractText(msg)
}

export async function seedQuestion(context: {
  teamName: string
  memberCount: number
  priorQuestions: string[]
  insightContext?: string
}): Promise<string> {
  const { teamName, memberCount, priorQuestions, insightContext } = context
  const recent = priorQuestions.slice(0, 5).map((q) => `- ${q}`).join('\n')

  const baseSystem =
    'You generate a single question for a small team of 2–8 people that surfaces something they think but do not say out loud — quiet frustrations, unspoken wishes, avoided conversations, hidden friction. The question must be neutral, third-person, anonymous in tone, and open-ended (no yes/no). Output only the question — one sentence, no preamble, no quotes, no explanation.'

  const followUpSystem =
    [
      'You generate a follow-up question after a team has just revealed an insight together.',
      'Your goal is to deepen shared understanding — build tacit trust by asking what the insight hints at but does not say.',
      '',
      'Rules:',
      '- Do NOT restate or rephrase the insight. That is lazy and the team will notice.',
      '- Go one layer deeper, or sideways into an adjacent unsaid thing. Example: insight = "meetings feel too long" → good follow-up = "what would you rather be doing during that hour?", bad follow-up = "how do you feel about meetings?".',
      '- Neutral, third-person, anonymous in tone. Open-ended (no yes/no).',
      '- Plain, everyday words — no corporate or therapy language.',
      '- Output only the question. One sentence. No preamble, no quotes.',
    ].join('\n')

  const userContent = insightContext
    ? `Team: ${teamName} (${memberCount} members)\n\nThe team just revealed this insight together:\n"${insightContext}"\n\nAsk the follow-up question that builds on it — go deeper or sideways, never restate.`
    : recent
    ? `Team: ${teamName} (${memberCount} members)\n\nRecently asked (avoid repeating these themes):\n${recent}`
    : `Team: ${teamName} (${memberCount} members)\n\nNo prior questions yet — ask something that surfaces an unspoken team tension or wish.`

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 128,
    system: insightContext ? followUpSystem : baseSystem,
    messages: [{ role: 'user', content: userContent }],
  })
  return extractText(msg)
}

export async function synthesize(answers: string[]): Promise<string> {
  // Inject 1 AI-generated decoy to protect anonymity in small teams
  const decoyPrompt = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 128,
    system:
      'Generate one plausible, neutral team member response to blend with the following answers. It should sound realistic but be clearly a single short perspective. Output only the response text.',
    messages: [{ role: 'user', content: answers.join('\n') }],
  })
  const decoy = extractText(decoyPrompt)
  const allAnswers = [...answers, decoy]

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system:
      [
        'You read anonymous answers from a small team and write back what the team is really saying — in plain, everyday words.',
        '',
        'Rules:',
        '- Write like you are telling a friend what the team thinks. Short sentences.',
        '- Target an 8th-grade reading level. A teenager should understand it on the first read.',
        '- Use concrete, everyday words. Avoid corporate and therapy language: no "alignment", "tensions", "dynamics", "patterns", "themes", "cohesion", "friction", "synergy", "stakeholders", "reflect".',
        '- Do not point at anyone. No "some people" vs "others" framing that would let the team guess who said what.',
        '- 2 to 3 sentences. No preamble, no bullet points, no headings.',
        '- Lead with the feeling or the thing, not with "The team feels…" or "It seems…".',
      ].join('\n'),
    messages: [{ role: 'user', content: allAnswers.join('\n\n') }],
  })
  return extractText(msg)
}

export async function generateTeamSummary(context: {
  teamName: string
  insights: { insight_text: string; themes: string[] }[]
}): Promise<{ summary: string; themes: string[] }> {
  const { teamName, insights } = context

  const body = insights
    .map((ins, i) => {
      const themeLine = ins.themes.length ? ` [themes: ${ins.themes.join(', ')}]` : ''
      return `${i + 1}. ${ins.insight_text}${themeLine}`
    })
    .join('\n')

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 768,
    system:
      [
        'You read every insight a small team has uncovered about itself, then write back a short portrait of what this team is really like.',
        '',
        'Output JSON shape (no other text, no code fences):',
        '{ "summary": "2–4 sentences describing the team character and what they keep circling back to", "themes": ["enduring theme one", "enduring theme two", "enduring theme three"] }',
        '',
        'Rules for "summary":',
        '- 2 to 4 sentences. Plain everyday words. 8th-grade reading level.',
        '- Write like you are describing the team to a new member: "This team seems to…", "You keep coming back to…".',
        '- No corporate or therapy language: no "alignment", "dynamics", "cohesion", "synergy", "stakeholders", "reflect".',
        '- Name what is unresolved or recurring, not just what is positive. If the team keeps circling the same tension, say so.',
        '- Never attribute anything to an individual — team-level only.',
        '',
        'Rules for "themes":',
        '- 3 to 5 entries. Each is 1–3 words, lowercase unless proper noun.',
        '- These are the ENDURING threads — the things the team keeps returning to across multiple insights. Not single-incident topics.',
        '- Abstract enough that no single insight is identifiable.',
        '',
        'If fewer than 2 insights are provided, return { "summary": "", "themes": [] } — there is not yet enough signal for a portrait.',
      ].join('\n'),
    messages: [
      {
        role: 'user',
        content: `Team: ${teamName}\n\nInsights uncovered so far (most recent first):\n${body}`,
      },
    ],
  })

  const raw = extractText(msg)
  const text = stripCodeFences(raw)
  try {
    const parsed = JSON.parse(text)
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : ''
    const themes = Array.isArray(parsed.themes) ? parsed.themes.slice(0, 5).map(String) : []
    console.log('[generateTeamSummary] ok', { summaryLen: summary.length, themes: themes.length })
    return { summary, themes }
  } catch (err) {
    console.error('[generateTeamSummary] parse failed', { raw, err })
    return { summary: '', themes: [] }
  }
}

function stripCodeFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

export async function generateInsightExtras(
  insight: string,
  answers: string[],
): Promise<{ themes: string[]; suggestions: string[] }> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system:
      [
        'You read a team-level insight and the anonymous answers it was distilled from, then return two short lists as JSON.',
        '',
        'Output JSON shape (no other text, no code fences):',
        '{ "themes": ["theme one", "theme two"], "suggestions": ["action one", "action two", "action three"] }',
        '',
        'Rules for "themes":',
        '- 1 or 2 entries. Never more.',
        '- Each is 1–3 words. Lowercase unless proper noun. Abstract enough that no single answer is identifiable.',
        '- Good: "meeting pace", "unspoken friction". Bad: a direct quote or anything naming a person.',
        '',
        'Rules for "suggestions":',
        '- 2 or 3 entries. Each is ONE short sentence.',
        '- Concrete, small, testable this week. Not advice, not platitudes.',
        '- Plain everyday words. No "alignment", "synergy", "stakeholders", "reflect", "cohesion".',
        '- Each suggestion is an action the whole team could try together — not pointed at any individual.',
        '- Good: "Try 25-minute default meetings for a week." Bad: "Communicate more openly."',
        '',
        'If nothing meaningful can be extracted, return empty arrays. Never invent attribution.',
      ].join('\n'),
    messages: [
      {
        role: 'user',
        content: `Insight: ${insight}\n\nAnonymized answers:\n${answers.map((a) => `- ${a}`).join('\n')}`,
      },
    ],
  })

  const text = extractText(msg)
  try {
    const parsed = JSON.parse(text)
    const themes = Array.isArray(parsed.themes) ? parsed.themes.slice(0, 2).map(String) : []
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3).map(String) : []
    return { themes, suggestions }
  } catch {
    return { themes: [], suggestions: [] }
  }
}

function extractText(msg: Anthropic.Message): string {
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Claude response type')
  return block.text.trim()
}
