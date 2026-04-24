import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function anonymizeQuestion(raw: string): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system:
      'You rewrite questions to be completely anonymous. Remove all identifying tone, writing style, and personal markers. Output a neutral, third-person question that preserves the original meaning. Output only the rewritten question — no explanation, no quotes.',
    messages: [{ role: 'user', content: raw }],
  })
  return extractText(msg)
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
      'You synthesize anonymous team responses into a single team-level insight. Identify common themes, tensions, and patterns. Do not attribute anything to individuals. Write 2-4 sentences as a cohesive insight the whole team can reflect on. Output only the insight — no preamble, no bullet points.',
    messages: [{ role: 'user', content: allAnswers.join('\n\n') }],
  })
  return extractText(msg)
}

function extractText(msg: Anthropic.Message): string {
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Claude response type')
  return block.text.trim()
}
