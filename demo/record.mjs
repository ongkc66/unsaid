import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:3000'
const TEAM_CODE = 'DEMO01'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function postQuestion(raw_text) {
  const res = await fetch(`${BASE}/api/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text, team_code: TEAM_CODE }),
  })
  return res.json()
}

async function postAnswer(raw_text, question_id) {
  const res = await fetch(`${BASE}/api/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text, question_id }),
  })
  return res.json()
}

// ── Setup — runs before the camera rolls ─────────────────────────────────────

async function setup() {
  console.log('\n📋 Setup phase — seeding questions + answers…\n')

  // Submit 3 questions that will be assigned distinct labels by Claude
  console.log('  → Submitting Leadership question…')
  const q1 = await postQuestion(
    "Why do leadership decisions feel so disconnected from the day-to-day reality of our work?"
  )
  console.log(`     label: ${q1.label} | id: ${q1.id?.slice(0, 8)}`)

  console.log('  → Submitting Process question…')
  const q2 = await postQuestion(
    "What single change to how we run our weekly sync would make it actually worth everyone's time?"
  )
  console.log(`     label: ${q2.label} | id: ${q2.id?.slice(0, 8)}`)

  console.log('  → Submitting Wellbeing question (this is the synthesis target)…')
  const q3 = await postQuestion(
    "What's been draining your energy at work lately that you haven't mentioned to anyone?"
  )
  console.log(`     label: ${q3.label} | id: ${q3.id?.slice(0, 8)}`)

  if (!q3.id) {
    console.error('❌ Failed to create synthesis target question:', q3)
    process.exit(1)
  }

  // Pre-seed 3 answers to q3 → 3/4 answered; live answer triggers synthesis
  console.log('\n  → Pre-seeding 3 answers to Wellbeing question…')
  const a1 = await postAnswer(
    "I've been staying late to cover for gaps in the team but haven't said anything because I don't want to seem like I'm complaining.",
    q3.id
  )
  console.log(`     answer 1 → count: ${a1.answer_count}`)

  const a2 = await postAnswer(
    "The constant context switching between projects is exhausting. I finish the day feeling busy but not like I've actually moved anything forward.",
    q3.id
  )
  console.log(`     answer 2 → count: ${a2.answer_count}`)

  const a3 = await postAnswer(
    "Unclear expectations. I never quite know if what I'm doing is the right priority, so there's always a background anxiety that I'm working on the wrong thing.",
    q3.id
  )
  console.log(`     answer 3 → count: ${a3.answer_count}`)

  if (a3.answer_count !== 3) {
    console.warn(`⚠️  Expected 3/4 — got ${a3.answer_count}`)
  } else {
    console.log('\n✅ Setup complete — question at 3/4, ready for live synthesis trigger')
  }

  return q3.id
}

// ── Recording ─────────────────────────────────────────────────────────────────

async function record(targetQId) {
  console.log('\n🎬 Recording — 2-minute desktop demo…\n')

  const browser = await chromium.launch({ headless: false, slowMo: 50 })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: __dirname, size: { width: 1440, height: 900 } },
  })
  const page = await context.newPage()

  // ── 0–5s: Home — orbs drifting, 2 prompts cycle ──────────────────────────
  await page.goto(BASE)
  await page.waitForSelector('text=Teams are asking', { timeout: 6000 })
  await page.waitForTimeout(5500)

  // ── 5–12s: Join DEMO01 ────────────────────────────────────────────────────
  await page.click('text=Already have a code? Join instead')
  await page.waitForTimeout(500)
  await page.locator('input[placeholder="XXXXXX"]').type(TEAM_CODE, { delay: 130 })
  await page.waitForTimeout(600)
  await page.click('button:has-text("Join team")')
  await page.waitForURL(`**/${TEAM_CODE}`, { timeout: 10000 })
  await page.waitForSelector('text=answered', { timeout: 10000 })
  await page.waitForTimeout(2500)

  // ── 12–22s: Filter bar interaction — filter → browse → clear ─────────────
  // Wait for filter bar to appear (needs ≥2 distinct labels)
  await page.waitForSelector('button:has-text("All")', { timeout: 8000 })
  await page.waitForTimeout(800)

  // Click Leadership filter
  const leadershipBtn = page.locator('button', { hasText: 'Leadership' }).first()
  await leadershipBtn.click()
  await page.waitForTimeout(2500)

  // Click Wellbeing filter
  const wellbeingBtn = page.locator('button', { hasText: 'Wellbeing' }).first()
  await wellbeingBtn.click()
  await page.waitForTimeout(2000)

  // Clear back to All
  await page.click('button:has-text("All")')
  await page.waitForTimeout(1500)

  // ── 22–32s: Submit a new question via FAB ─────────────────────────────────
  await page.click('button[aria-label="Ask the team a question"]')
  await page.waitForTimeout(700)
  await page.locator('textarea:visible').type(
    "What would it take for this team to feel genuinely proud of how we work together?",
    { delay: 48 }
  )
  await page.waitForTimeout(900)
  await page.click('button:has-text("Submit question")')
  // Wait for Claude anonymization + card appearing with label pill
  await page.waitForTimeout(4000)
  await page.waitForSelector('text=0 of 4 answered', { timeout: 12000 }).catch(() => {})
  await page.waitForTimeout(1800)

  // ── 32–40s: Open the 3/4 Wellbeing question ───────────────────────────────
  await page.locator(`a[href*="${targetQId}"]`).click()
  await page.waitForSelector('text=3 of 4 answered', { timeout: 8000 })
  await page.waitForTimeout(1500)

  // ── 40–50s: Submit final answer → triggers synthesis ──────────────────────
  await page.click('button:has-text("Answer this question")')
  await page.waitForTimeout(700)
  await page.locator('textarea:visible').type(
    "Honestly, just not feeling like I have to guess what actually matters. When the work is clear, the energy comes back.",
    { delay: 48 }
  )
  await page.waitForTimeout(900)
  await page.click('button:has-text("Submit answer")')

  // ── 50–65s: Synthesis fires — word-by-word reveal ─────────────────────────
  await page.waitForSelector('text=Generating insight', { timeout: 12000 }).catch(() => {})
  await page.waitForSelector('.reveal-word', { timeout: 25000 })
  await page.waitForTimeout(9000) // let animation breathe fully

  // Scroll down to see themes + suggestions
  await page.mouse.wheel(0, 200)
  await page.waitForTimeout(2500)
  await page.mouse.wheel(0, 200)
  await page.waitForTimeout(2000)

  // ── 65–75s: Back to feed → glowing Insight ready card ────────────────────
  await page.click('text=Back to feed')
  await page.waitForSelector('text=Insight ready', { timeout: 8000 })
  await page.waitForTimeout(2500)

  // ── 75–95s: Insights tab — team portrait + insight history ───────────────
  await page.click('button[aria-label="Insights"]')
  await page.waitForTimeout(2000)
  // Scroll through insights
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(2000)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(2000)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(1500)

  // ── 95–120s: Pulse tab — heatmap → ring → themes → suggestions ───────────
  await page.click('button[aria-label="Pulse"]')
  await page.waitForTimeout(2000)

  // Pause on heatmap
  await page.waitForTimeout(3000)

  // Scroll to completion ring
  await page.mouse.wheel(0, 320)
  await page.waitForTimeout(2500)

  // Scroll to theme frequency
  await page.mouse.wheel(0, 320)
  await page.waitForTimeout(2500)

  // Scroll to suggestion tracker
  await page.mouse.wheel(0, 350)
  await page.waitForTimeout(3000)

  // ── 120s: End ─────────────────────────────────────────────────────────────
  await context.close()
  await browser.close()

  // Rename to stable filename
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.webm'))
  if (files.length) {
    const latest = files.sort().at(-1)
    const dest = path.join(__dirname, 'unsaid-demo.webm')
    fs.renameSync(path.join(__dirname, latest), dest)
    console.log('\n✅ Recording saved → demo/unsaid-demo.webm')
  } else {
    console.warn('⚠️  No .webm found')
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

setup()
  .then(record)
  .catch((err) => {
    console.error('❌', err)
    process.exit(1)
  })
