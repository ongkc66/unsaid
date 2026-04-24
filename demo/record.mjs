import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:3000'
const TEAM_CODE = 'DEMO01'
// This question has 1/4 answers — we pre-seed it to 3/4, then the live answer triggers synthesis
const TARGET_QID = '2abf2288-f383-4671-8830-d541db079718'

async function postAnswer(text) {
  const res = await fetch(`${BASE}/api/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: text, question_id: TARGET_QID }),
  })
  return res.json()
}

async function preSeed() {
  console.log('⏳ Pre-seeding 2 answers to bring question to 3/4…')
  const a1 = await postAnswer('Remote work has made us better at documentation but worse at reading the room. Trust-building now requires much more intentional effort to create those informal moments.')
  if (a1.error) { console.error('Pre-seed #1 failed:', a1.error); process.exit(1) }
  console.log(`   answer 1 → count: ${a1.answer_count}`)

  const a2 = await postAnswer('We rely heavily on written updates but a lot of nuance gets lost. Shared context feels thinner than it used to be in person.')
  if (a2.error) { console.error('Pre-seed #2 failed:', a2.error); process.exit(1) }
  console.log(`   answer 2 → count: ${a2.answer_count}`)

  if (a2.answer_count !== 3) {
    console.warn(`⚠️  Expected 3/4 — got ${a2.answer_count}. Check answer_count in DB.`)
  } else {
    console.log('✅ Pre-seed done — question is at 3/4')
  }
}

async function record() {
  console.log('🎬 Starting recording…')
  const browser = await chromium.launch({ headless: false, slowMo: 60 })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: __dirname, size: { width: 1440, height: 900 } },
  })
  const page = await context.newPage()

  // ── 0–3s: Home — ambient orbs + rotating prompt ──────────────────────────
  await page.goto(BASE)
  await page.waitForSelector('text=Teams are asking', { timeout: 6000 })
  await page.waitForTimeout(3200)

  // ── 3–7s: Join DEMO01 ─────────────────────────────────────────────────────
  await page.click('text=Already have a code? Join instead')
  await page.waitForTimeout(500)
  await page.locator('input[placeholder="XXXXXX"]').type(TEAM_CODE, { delay: 140 })
  await page.waitForTimeout(700)
  await page.click('button:has-text("Join team")')

  // ── 7–9s: Feed loads with historical questions ────────────────────────────
  await page.waitForURL(`**/${TEAM_CODE}`, { timeout: 10000 })
  await page.waitForSelector('text=answered', { timeout: 10000 })
  await page.waitForTimeout(2200)

  // ── 9–14s: Ask a new question via FAB ────────────────────────────────────
  await page.click('button[aria-label="Ask the team a question"]')
  await page.waitForTimeout(600)
  await page.locator('textarea:visible').type(
    "What's one ritual that would make this team feel more connected every week?",
    { delay: 52 }
  )
  await page.waitForTimeout(900)
  await page.click('button:has-text("Submit question")')

  // Wait for anonymization + new card appearing with label pill
  await page.waitForTimeout(3800)
  await page.waitForSelector('text=0 of 4 answered', { timeout: 12000 })
  await page.waitForTimeout(1600)

  // ── 14–17s: Open the 3/4 question ────────────────────────────────────────
  await page.locator(`a[href*="${TARGET_QID}"]`).click()
  await page.waitForSelector('text=3 of 4 answered', { timeout: 8000 })
  await page.waitForTimeout(1200)

  // ── 17–22s: Submit the final answer → triggers synthesis ──────────────────
  await page.click('button:has-text("Answer this question")')
  await page.waitForTimeout(600)
  await page.locator('textarea:visible').type(
    "We've gotten good at async but something gets lost. The best moments are still when we actually talk things through together in real time.",
    { delay: 48 }
  )
  await page.waitForTimeout(900)
  await page.click('button:has-text("Submit answer")')

  // ── 22–29s: Synthesis fires — wait for word-by-word reveal ────────────────
  // First the "Generating insight…" pulse appears, then reveal-word spans
  await page.waitForSelector('text=Generating insight', { timeout: 12000 }).catch(() => {})
  await page.waitForSelector('.reveal-word', { timeout: 25000 })
  await page.waitForTimeout(7500) // let the animation play to completion

  // ── 29–32s: Back to feed — see glowing Insight ready card ────────────────
  await page.click('text=Back to feed')
  await page.waitForSelector('text=Insight ready', { timeout: 8000 })
  await page.waitForTimeout(2200)

  // ── 32–42s: Pulse tab — heatmap, ring, themes, suggestions ───────────────
  await page.click('button[aria-label="Pulse"]')
  await page.waitForTimeout(1800)
  // Scroll through the page in 4 beats
  await page.mouse.wheel(0, 260)
  await page.waitForTimeout(1200)
  await page.mouse.wheel(0, 280)
  await page.waitForTimeout(1200)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(1300)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(2000)

  // ── Wrap up ───────────────────────────────────────────────────────────────
  await context.close()
  await browser.close()

  // Rename the generated .webm to a stable filename
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.webm'))
  if (files.length) {
    const latest = files.sort().at(-1)
    const dest = path.join(__dirname, 'unsaid-demo.webm')
    fs.renameSync(path.join(__dirname, latest), dest)
    console.log(`\n✅ Recording saved → demo/unsaid-demo.webm`)
  } else {
    console.warn('⚠️  No .webm found — check that recordVideo is supported.')
  }
}

preSeed().then(record).catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
