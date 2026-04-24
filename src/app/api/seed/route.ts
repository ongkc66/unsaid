import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// DELETE-guarded demo seed — wipes and recreates the DEMO01 team
// GET /api/seed  (dev only — remove before production)
export async function GET() {
  // ── 1. Wipe existing demo team (cascades to questions/answers/synthesis)
  await supabaseAdmin.from('teams').delete().eq('code', 'DEMO01')

  // ── 2. Create team
  const { data: team, error: teamErr } = await supabaseAdmin
    .from('teams')
    .insert({
      code: 'DEMO01',
      name: 'Nexus Labs',
      member_count: 4,
      summary_text:
        'Nexus Labs is a team that moves fast and cares deeply about the work. Across twelve conversations, a consistent picture emerges: strong execution instincts, genuine care for each other, and a quiet hunger for more strategic clarity and psychological safety to push harder. The themes that surface most — communication loops, ownership ambiguity, data-informed decisions — are not signs of dysfunction. They are signs of a team ready for the next level of operating maturity.',
      summary_themes: ['Communication', 'Ownership', 'Trust', 'Data', 'Sustainability'],
      summary_generated_at: new Date().toISOString(),
      summary_source_count: 12,
    })
    .select('id')
    .single()

  if (teamErr || !team) {
    return NextResponse.json({ error: teamErr?.message ?? 'team insert failed' }, { status: 500 })
  }

  const tid = team.id

  // ── helper ────────────────────────────────────────────────────────────────
  async function addQuestion(
    text: string,
    status: 'open' | 'closed',
    answerCount: number,
    isAi: boolean,
    createdAt: string,
  ) {
    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert({
        team_id: tid,
        anonymized_text: text,
        status,
        answer_count: answerCount,
        is_ai_generated: isAi,
        created_at: createdAt,
      })
      .select('id')
      .single()
    if (error) throw new Error(`question insert: ${error.message}`)
    return data.id as string
  }

  async function addAnswers(qid: string, rows: { text: string; at: string }[]) {
    const { error } = await supabaseAdmin.from('answers').insert(
      rows.map((r) => ({ question_id: qid, anonymized_text: r.text, created_at: r.at })),
    )
    if (error) throw new Error(`answer insert: ${error.message}`)
  }

  async function addSynthesis(
    qid: string,
    insight: string,
    themes: string[],
    suggestions: string[],
    at: string,
  ) {
    const { error } = await supabaseAdmin
      .from('synthesis')
      .insert({ question_id: qid, insight_text: insight, themes, suggestions, created_at: at })
    if (error) throw new Error(`synthesis insert: ${error.message}`)
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    // ── Q1 May 2025 — Communication gaps (human, closed) ──────────────────
    const q1 = await addQuestion(
      "What aspects of the team's communication style are working well, and where do gaps most often occur?",
      'closed', 4, false, '2025-05-08T09:12:00Z',
    )
    await addAnswers(q1, [
      { text: "Async feels fast and low-friction — a real strength. The breakdowns happen when something needs a decision. It floats in the group chat indefinitely, and nobody owns the close.", at: '2025-05-08T11:30:00Z' },
      { text: "The team is good at sharing context but not at closing loops. Things get discussed and then nothing. No one marks anything as resolved.", at: '2025-05-09T08:55:00Z' },
      { text: "Honest feedback is easier one-on-one than in the full group. Some things never make it to where they'd actually matter.", at: '2025-05-09T14:20:00Z' },
      { text: "The sync time we do have is high quality. The gaps are async — long threads that could have been a 5-minute call.", at: '2025-05-10T09:05:00Z' },
    ])
    await addSynthesis(q1,
      "The team values the speed and directness of async communication. Gaps emerge most around ambiguous decisions — people assume someone else is driving, and by the time it surfaces it is already late. Good at broadcasting, weak at closing loops.",
      ['Communication', 'Decision-making'],
      ['Introduce a 24-hour async decision window — if no one objects, the decision is made', "Add a 'needs resolution' tag in your task tracker so nothing important goes quiet"],
      '2025-05-10T15:00:00Z',
    )

    // ── Q2 Jul 2025 — Sustainable pace (human, closed) ────────────────────
    const q2 = await addQuestion(
      'How well does the current pace of work align with what feels sustainable over the long term?',
      'closed', 4, false, '2025-07-17T10:00:00Z',
    )
    await addAnswers(q2, [
      { text: "The pace is manageable, but only because I've stopped expecting to finish a day cleanly. That's not something I can keep doing.", at: '2025-07-17T12:40:00Z' },
      { text: "It feels okay right now. The worry is what happens when the next push starts. There's no recovery time built in anywhere.", at: '2025-07-18T09:15:00Z' },
      { text: "Hours are fine. Context-switching is what kills the energy. Finishing one thing just reveals five more.", at: '2025-07-18T14:55:00Z' },
      { text: "Sustainable for now. I keep wondering if the next milestone will feel even harder than this one.", at: '2025-07-19T10:30:00Z' },
    ])
    await addSynthesis(q2,
      "There is a shared sense that the current pace is sustainable, but just barely. The concern is not hours — it is context-switching and the compounding feeling that finishing one thing reveals three more. There is unspoken anxiety about whether the next milestone will feel harder.",
      ['Sustainability', 'Workload'],
      ["Try a weekly 'one big thing' commitment — one protected priority per person per week, untouchable by interrupts", 'Run a mini retro after the next milestone focused only on pace, not output'],
      '2025-07-19T16:00:00Z',
    )

    // ── Q3 Sep 2025 — Process friction (human, closed) ────────────────────
    const q3 = await addQuestion(
      'What parts of the product development process feel unnecessarily slow or painful?',
      'closed', 4, false, '2025-09-03T09:30:00Z',
    )
    await addAnswers(q3, [
      { text: "Design-to-engineering handoffs. By the time it reaches me, the intent has blurred and I'm guessing at half the interactions.", at: '2025-09-03T11:00:00Z' },
      { text: "QA cycles feel long because acceptance criteria were never fully agreed on. Features bounce back for reasons nobody flagged upfront.", at: '2025-09-04T08:45:00Z' },
      { text: "The slowness is in agreeing on what 'done' means. Every person has a different threshold and nobody has said it out loud.", at: '2025-09-04T15:30:00Z' },
      { text: "Getting sign-off. It's not slow because people are unavailable — it's slow because the review criteria shift depending on who's reviewing.", at: '2025-09-05T09:20:00Z' },
    ])
    await addSynthesis(q3,
      "Design handoffs and QA cycles are the two friction points most people feel but nobody has named directly. Underneath both is the same issue: undefined 'done'. Features bounce not from malice but from misaligned expectations baked in at the start.",
      ['Process', 'Product development'],
      ["Define a lightweight 'definition of done' together — even five bullet points changes the dynamic entirely", 'Try a brief handoff call before any feature hits QA — 15 minutes upfront saves days later'],
      '2025-09-05T14:00:00Z',
    )

    // ── Q4 Sep 2025 — Unspoken conversations (AI, closed) ─────────────────
    const q4 = await addQuestion(
      "What does the team most need to discuss but hasn't found the right moment to?",
      'closed', 4, true, '2025-09-18T10:00:00Z',
    )
    await addAnswers(q4, [
      { text: "Where we're actually going in six months. We talk about the next sprint but I don't know what we're building toward at any larger scale.", at: '2025-09-18T12:10:00Z' },
      { text: "Whether the current team structure is set up right for where we want to go. Some things feel owned by everyone and therefore by nobody.", at: '2025-09-19T09:30:00Z' },
      { text: "The strategy conversation that keeps getting pushed. Every time it comes up in standup, someone says 'let's take it offline' and we never do.", at: '2025-09-19T14:05:00Z' },
      { text: "What winning actually looks like for us right now. We're all working hard but I'm not sure we'd agree on what success is.", at: '2025-09-20T10:45:00Z' },
    ])
    await addSynthesis(q4,
      "Strategy-level conversations keep getting deferred in favor of execution. The team feels aligned on the immediate roadmap but uncertain about the six-month picture. There is a shared desire for a dedicated space to step back — not a retrospective, something more forward-looking.",
      ['Strategy', 'Alignment'],
      ["Schedule a quarterly 'north star' session — two hours, no laptops, just a whiteboard and the honest question of where you're going", "Create a living 'why we're building this' doc that anyone can add to and anyone can challenge"],
      '2025-09-20T16:00:00Z',
    )

    // ── Q5 Nov 2025 — Psychological safety (human, closed) ────────────────
    const q5 = await addQuestion(
      'How supported does the team feel in taking creative risks or trying unconventional approaches?',
      'closed', 4, false, '2025-11-12T10:00:00Z',
    )
    await addAnswers(q5, [
      { text: "In theory, very supported. In practice, when timelines tighten, the safe option always wins. The space for experimentation collapses under pressure.", at: '2025-11-12T11:50:00Z' },
      { text: "I've never been told not to try something. But I've also never been explicitly encouraged to. It just doesn't come up.", at: '2025-11-13T09:00:00Z' },
      { text: "The risk isn't in trying — it's in failing publicly and having that define the project outcome. I need to know failure is recoverable first.", at: '2025-11-13T14:40:00Z' },
      { text: "More supported than I expected, honestly. But the support is passive — nobody says no, but nobody's actively making space for it either.", at: '2025-11-14T10:15:00Z' },
    ])
    await addSynthesis(q5,
      "The team feels more supported in theory than in practice. The intent to encourage experimentation is genuine, but when timelines tighten the safer option wins every time. The gap between 'we should try things' and 'we have real space to try things' is felt clearly.",
      ['Psychological safety', 'Innovation'],
      ['Protect one spike day per sprint for experiments — no deliverable required, just exploration and a one-paragraph share-out', 'Celebrate failed experiments explicitly in retros alongside successes — make failure survivable and visible'],
      '2025-11-14T15:00:00Z',
    )

    // ── Q6 Dec 2025 — New year confidence (human, closed) ────────────────
    const q6 = await addQuestion(
      'What would make the team feel more confident heading into the new year?',
      'closed', 4, false, '2025-12-08T09:00:00Z',
    )
    await addAnswers(q6, [
      { text: "Knowing what we're actually prioritizing and what we're allowed to deprioritize. Without that, everything feels urgent and nothing gets real attention.", at: '2025-12-08T11:30:00Z' },
      { text: "A clear sense of what success looks like for the first quarter. Not a roadmap — just an honest direction.", at: '2025-12-08T16:00:00Z' },
      { text: "Less ambiguity about where we're headed. There's energy here, it just needs somewhere real to go.", at: '2025-12-09T09:40:00Z' },
      { text: "Clarity on what we can say no to. That would give me the confidence to actually commit to what we're saying yes to.", at: '2025-12-10T10:00:00Z' },
    ])
    await addSynthesis(q6,
      "Clarity tops the list — on priorities, on what success looks like, and on what can be safely deprioritized. There is energy and genuine optimism in the team, but it feels contingent. People want to know where they are actually going, not just what they are building next.",
      ['Clarity', 'Direction'],
      ['Share a 90-day snapshot in early January — not a roadmap, a 3-sentence direction statement the whole team can react to', "Run a team start/stop/keep before the quarter begins — 30 minutes, huge signal"],
      '2025-12-10T15:00:00Z',
    )

    // ── Q7 Dec 2025 — Healthy disagreement (AI, closed) ──────────────────
    const q7 = await addQuestion(
      'What does healthy disagreement look like on this team, and how close are we to that?',
      'closed', 4, true, '2025-12-22T10:00:00Z',
    )
    await addAnswers(q7, [
      { text: "We can push back on execution details but not on direction. Direction feels set and I'm not sure I'm supposed to question it.", at: '2025-12-22T12:20:00Z' },
      { text: "Disagreements happen in one-on-ones, not in the room. By the time a decision is made it looks unanimous — but it isn't, and people know it.", at: '2025-12-23T09:15:00Z' },
      { text: "I think we're closer than we were. But there are still topics where I feel the weight of not rocking the boat.", at: '2025-12-23T14:00:00Z' },
      { text: "Healthy disagreement looks like: someone names a concern, it gets heard, the team adjusts or commits. We're maybe 60% of the way there.", at: '2025-12-23T17:30:00Z' },
    ])
    await addSynthesis(q7,
      "The team can disagree on execution details but struggles with disagreement on direction or priorities. Concerns get aired in one-on-ones but rarely reach the full group. Decisions look unanimous on the surface — but often are not, and everyone knows it.",
      ['Conflict', 'Communication'],
      ['Try a pre-mortem before major decisions — surface risks before committing, not after', "Normalise 'disagree and commit' language so dissent has a named, respected role in team decisions"],
      '2025-12-24T10:00:00Z',
    )

    // ── Q8 Jan 2026 — Role ownership (human, closed) ─────────────────────
    const q8 = await addQuestion(
      'How clear is each person on what they own and where the boundaries of their role are?',
      'closed', 4, false, '2026-01-13T10:00:00Z',
    )
    await addAnswers(q8, [
      { text: "Clear on my core responsibilities. Much less clear on cross-functional decisions — who leads those is decided in the moment and it changes.", at: '2026-01-13T12:30:00Z' },
      { text: "The ambiguity doesn't bother me day to day, but it slows things down when something spans more than one person's domain.", at: '2026-01-14T09:00:00Z' },
      { text: "Mostly intuitive. I know my area, but edge cases are fuzzy enough that I sometimes hold back rather than accidentally step on someone else's ownership.", at: '2026-01-14T14:50:00Z' },
      { text: "Role clarity is fine. Decision-making clarity is not. We need less of a RACI chart and more of a 'who is the deciding voice' agreement.", at: '2026-01-15T10:30:00Z' },
    ])
    await addSynthesis(q8,
      "Ownership is mostly intuitive rather than explicit. People generally know their domain, but cross-functional decisions create friction — not enough to raise formally, but enough to slow things down. There is a desire for light clarity without heavy process.",
      ['Ownership', 'Roles'],
      ["Run a quick 'who leads what' mapping session — 30 minutes, a shared doc, one decision-maker named per domain", 'When starting any new project, name the decision-maker on day one — before the ambiguity has time to compound'],
      '2026-01-15T16:00:00Z',
    )

    // ── Q9 Jan 2026 — Quality improvement (human, closed) ────────────────
    const q9 = await addQuestion(
      'What one change to how the team builds would have the biggest impact on quality?',
      'closed', 4, false, '2026-01-28T10:00:00Z',
    )
    await addAnswers(q9, [
      { text: "Testing discipline. Not a formal mandate — just a cultural shift toward 'I don't ship what I wouldn't trust.'", at: '2026-01-28T12:00:00Z' },
      { text: "Catching design inconsistencies earlier. By the time I see something in implementation, undoing it costs real time.", at: '2026-01-29T09:10:00Z' },
      { text: "Peer review with a real turnaround expectation. Right now reviews happen when someone gets around to it.", at: '2026-01-29T14:35:00Z' },
      { text: "Agreeing on what a 'good enough' threshold looks like before we start, not after. We keep polishing the wrong things.", at: '2026-01-29T17:00:00Z' },
    ])
    await addSynthesis(q9,
      "Testing discipline surfaces as the highest-leverage cultural shift — not a process mandate, but a shared standard: don't ship what you wouldn't trust. There is also a consistent thread about catching design gaps upstream, before implementation rather than after.",
      ['Quality', 'Engineering'],
      ['Introduce peer code review with a 24-hour turnaround SLA — speed matters as much as rigor', 'Add a 5-minute design walkthrough to the sprint kickoff so gaps surface before anyone writes a line of code'],
      '2026-01-30T10:00:00Z',
    )

    // ── Q10 Feb 2026 — Data vs instincts (human, closed) ─────────────────
    const q10 = await addQuestion(
      "How effectively is the team using data to make decisions, and where do instincts take over when they shouldn't?",
      'closed', 4, false, '2026-02-18T10:00:00Z',
    )
    await addAnswers(q10, [
      { text: "Data exists but it doesn't flow into decisions naturally. I check metrics when I think to, not as a reflex.", at: '2026-02-18T12:40:00Z' },
      { text: "I trust my instincts more than the data because the data isn't always reliable. Until I trust the source, I won't lean on it.", at: '2026-02-19T09:25:00Z' },
      { text: "We have dashboards. Nobody owns the story they tell. So they become wallpaper.", at: '2026-02-19T14:00:00Z' },
      { text: "Gut calls are fine for small decisions. The problem is they also drive medium decisions. We've never agreed on what threshold requires evidence.", at: '2026-02-20T10:15:00Z' },
    ])
    await addSynthesis(q10,
      "Data exists but does not flow naturally into decisions. People trust instincts because the data is not always accessible or fully trusted. The gap between having metrics and using them as a team is real — partly tooling, partly habit, partly nobody owning the narrative.",
      ['Data', 'Decision-making'],
      ["Appoint a rotating 'data owner' each sprint to pull and share one key metric with context — not a report, a story", "Add a 'what does the data say?' question to your design review template so it becomes a natural reflex"],
      '2026-02-20T16:00:00Z',
    )

    // ── Q11 Mar 2026 — Leadership understanding (human, closed) ──────────
    const q11 = await addQuestion(
      "What does the team wish leadership understood better about the day-to-day reality of building?",
      'closed', 4, false, '2026-03-11T10:00:00Z',
    )
    await addAnswers(q11, [
      { text: "Context-switching has costs that don't show up in velocity. Every 'quick thing' requires 30 minutes of recovery that the metrics never capture.", at: '2026-03-11T12:00:00Z' },
      { text: "That the tradeoffs we make are real and deliberate. When decisions get second-guessed after the fact, it makes me hesitate before making the next call.", at: '2026-03-12T09:30:00Z' },
      { text: "How much energy goes into navigating ambiguity, not just building. If the inputs were clearer the outputs would be too.", at: '2026-03-12T14:20:00Z' },
      { text: "We move fast because we trust each other, not because we're tracking outputs. That trust is worth protecting.", at: '2026-03-12T17:00:00Z' },
    ])
    await addSynthesis(q11,
      "The team wants leadership to see that context-switching and interrupt culture carry hidden costs that don't appear in output metrics. There is also a quiet wish for more trust: decisions second-guessed after the fact create caution about taking initiative in the first place.",
      ['Leadership', 'Trust'],
      ["Share a 'what we navigated this sprint' note with leadership — not just outputs, but the tradeoffs made and why", 'Propose a protected no-interrupt window respected across all levels, including leadership asks'],
      '2026-03-12T19:00:00Z',
    )

    // ── Q12 Mar 2026 — Six months from now (AI, closed) ──────────────────
    const q12 = await addQuestion(
      'What would this team look like in six months if everything went right?',
      'closed', 4, true, '2026-03-25T10:00:00Z',
    )
    await addAnswers(q12, [
      { text: "Shipping something I'm genuinely proud of. Not just done — actually good.", at: '2026-03-25T12:10:00Z' },
      { text: "Feeling like we've grown together, not just worked together. There's a difference and I want to feel it.", at: '2026-03-26T09:00:00Z' },
      { text: "Enough breathing room to actually enjoy the work. The ambition isn't the problem — the constant pressure is.", at: '2026-03-26T14:30:00Z' },
      { text: "A team that doesn't need a tool like this to surface hard truths, because we've learned to say them directly.", at: '2026-03-27T10:00:00Z' },
    ])
    await addSynthesis(q12,
      "The team's version of six months from now is surprisingly consistent: shipping something they're proud of, feeling like they've grown together, and having enough breathing room to actually enjoy the work. The ambition is not outsized — it is meaningful. The desire is not recognition; it is mattering.",
      ['Growth', 'Vision'],
      ["Write a one-paragraph 'team memo from the future' together — what did you ship and how did it feel to get there?", 'Set one non-output goal for the next quarter alongside the roadmap — about how you work, not just what you deliver'],
      '2026-03-27T15:00:00Z',
    )

    // ── Q13 Apr 2026 — Remote trust (human, OPEN, 2/4) ───────────────────
    const q13 = await addQuestion(
      'In what ways has remote collaboration changed how the team builds trust with each other?',
      'open', 2, false, '2026-04-17T09:30:00Z',
    )
    await addAnswers(q13, [
      { text: "Trust has become more about consistency than visibility. I trust the people who always follow through, regardless of when or where they work.", at: '2026-04-17T14:00:00Z' },
      { text: "Remote made the implicit explicit. You have to actually say 'I'm swamped' or 'I need input here' — you can't read the room anymore.", at: '2026-04-18T10:20:00Z' },
    ])

    // ── Q14 Apr 2026 — The avoided conversation (AI, OPEN, 1/4) ──────────
    const q14 = await addQuestion(
      "What is something the team has avoided talking about that, if addressed, could meaningfully improve how things feel day to day?",
      'open', 1, true, '2026-04-22T10:00:00Z',
    )
    await addAnswers(q14, [
      { text: "How we decide what's urgent versus what just feels urgent. Right now everything competes for the same attention and nothing wins clearly.", at: '2026-04-22T13:30:00Z' },
    ])

    return NextResponse.json({
      ok: true,
      team: 'Nexus Labs',
      code: 'DEMO01',
      questions: 14,
      closed: 12,
      open: 2,
      heatmapSpan: 'May 2025 → Apr 2026',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
