-- UNSAID — Demo Seed Data
-- Team: "Nexus Labs" | Code: DEMO01 | 4 members
-- 12 closed questions (May 2025 → Mar 2026) + 2 open (Apr 2026)
-- Safe to re-run: deletes DEMO01 team first (cascades to all related rows)
--
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New query → paste → Run

DELETE FROM teams WHERE code = 'DEMO01';

DO $$
DECLARE
  tid uuid;
  q1 uuid; q2 uuid; q3 uuid; q4 uuid; q5 uuid; q6 uuid; q7 uuid;
  q8 uuid; q9 uuid; q10 uuid; q11 uuid; q12 uuid; q13 uuid; q14 uuid;
BEGIN

-- ─────────────────────────────────────────────────────────────
-- TEAM
-- ─────────────────────────────────────────────────────────────
INSERT INTO teams (
  code, name, member_count,
  summary_text, summary_themes,
  summary_generated_at, summary_source_count
) VALUES (
  'DEMO01', 'Nexus Labs', 4,
  'Nexus Labs is a team that moves fast and cares deeply about the work. Across twelve conversations, a consistent picture emerges: strong execution instincts, genuine care for each other, and a quiet hunger for more strategic clarity and psychological safety to push harder. The themes that surface most — communication loops, ownership ambiguity, data-informed decisions — are not signs of dysfunction. They are signs of a team ready for the next level of operating maturity.',
  ARRAY['Communication', 'Ownership', 'Trust', 'Data', 'Sustainability'],
  now(),
  12
) RETURNING id INTO tid;


-- ─────────────────────────────────────────────────────────────
-- Q1 — May 2025 | Communication gaps (human)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'What aspects of the team''s communication style are working well, and where do gaps most often occur?',
  'closed', 4, false, '2025-05-08 09:12:00+00'
) RETURNING id INTO q1;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q1, 'Async feels fast and low-friction — a real strength. The breakdowns happen when something needs a decision. It floats in the group chat indefinitely, and nobody owns the close.', '2025-05-08 11:30:00+00'),
  (q1, 'The team is good at sharing context but not at closing loops. Things get discussed and then nothing. No one marks anything as resolved.', '2025-05-09 08:55:00+00'),
  (q1, 'Honest feedback is easier one-on-one than in the full group. Some things never make it to where they''d actually matter.', '2025-05-09 14:20:00+00'),
  (q1, 'The sync time we do have is high quality. The gaps are async — long threads that could have been a 5-minute call.', '2025-05-10 09:05:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q1,
  'The team values the speed and directness of async communication. Gaps emerge most around ambiguous decisions — people assume someone else is driving, and by the time it surfaces it is already late. Good at broadcasting, weak at closing loops.',
  ARRAY['Communication', 'Decision-making'],
  ARRAY['Introduce a 24-hour async decision window — if no one objects, the decision is made', 'Add a ''needs resolution'' tag in your task tracker so nothing important goes quiet'],
  '2025-05-10 15:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q2 — Jul 2025 | Sustainable pace (human)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'How well does the current pace of work align with what feels sustainable over the long term?',
  'closed', 4, false, '2025-07-17 10:00:00+00'
) RETURNING id INTO q2;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q2, 'The pace is manageable, but only because I''ve stopped expecting to finish a day cleanly. That''s not something I can keep doing.', '2025-07-17 12:40:00+00'),
  (q2, 'It feels okay right now. The worry is what happens when the next push starts. There''s no recovery time built in anywhere.', '2025-07-18 09:15:00+00'),
  (q2, 'Hours are fine. Context-switching is what kills the energy. Finishing one thing just reveals five more.', '2025-07-18 14:55:00+00'),
  (q2, 'Sustainable for now. I keep wondering if the next milestone will feel even harder than this one.', '2025-07-19 10:30:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q2,
  'There is a shared sense that the current pace is sustainable, but just barely. The concern is not hours — it is context-switching and the compounding feeling that finishing one thing reveals three more. There is unspoken anxiety about whether the next milestone will feel harder.',
  ARRAY['Sustainability', 'Workload'],
  ARRAY['Try a weekly ''one big thing'' commitment — one protected priority per person per week, untouchable by interrupts', 'Run a mini retro after the next milestone focused only on pace, not output'],
  '2025-07-19 16:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q3 — Sep 2025 | Process friction (human)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'What parts of the product development process feel unnecessarily slow or painful?',
  'closed', 4, false, '2025-09-03 09:30:00+00'
) RETURNING id INTO q3;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q3, 'Design-to-engineering handoffs. By the time it reaches me, the intent has blurred and I''m guessing at half the interactions.', '2025-09-03 11:00:00+00'),
  (q3, 'QA cycles feel long because acceptance criteria were never fully agreed on. Features bounce back for reasons nobody flagged upfront.', '2025-09-04 08:45:00+00'),
  (q3, 'The slowness is in agreeing on what ''done'' means. Every person has a different threshold and nobody has said it out loud.', '2025-09-04 15:30:00+00'),
  (q3, 'Getting sign-off. It''s not slow because people are unavailable — it''s slow because the review criteria shift depending on who''s reviewing.', '2025-09-05 09:20:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q3,
  'Design handoffs and QA cycles are the two friction points most people feel but nobody has named directly. Underneath both is the same issue: undefined ''done''. Features bounce not from malice but from misaligned expectations baked in at the start.',
  ARRAY['Process', 'Product development'],
  ARRAY['Define a lightweight ''definition of done'' together — even five bullet points changes the dynamic entirely', 'Try a brief handoff call before any feature hits QA — 15 minutes upfront saves days later'],
  '2025-09-05 14:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q4 — Sep 2025 | Unspoken conversations (AI-generated)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'What does the team most need to discuss but hasn''t found the right moment to?',
  'closed', 4, true, '2025-09-18 10:00:00+00'
) RETURNING id INTO q4;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q4, 'Where we''re actually going in six months. We talk about the next sprint but I don''t know what we''re building toward at any larger scale.', '2025-09-18 12:10:00+00'),
  (q4, 'Whether the current team structure is set up right for where we want to go. Some things feel owned by everyone and therefore by nobody.', '2025-09-19 09:30:00+00'),
  (q4, 'The strategy conversation that keeps getting pushed. Every time it comes up in standup, someone says ''let''s take it offline'' and we never do.', '2025-09-19 14:05:00+00'),
  (q4, 'What winning actually looks like for us right now. We''re all working hard but I''m not sure we''d agree on what success is.', '2025-09-20 10:45:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q4,
  'Strategy-level conversations keep getting deferred in favor of execution. The team feels aligned on the immediate roadmap but uncertain about the six-month picture. There is a shared desire for a dedicated space to step back — not a retrospective, something more forward-looking.',
  ARRAY['Strategy', 'Alignment'],
  ARRAY['Schedule a quarterly ''north star'' session — two hours, no laptops, just a whiteboard and the honest question of where you''re going', 'Create a living ''why we''re building this'' doc that anyone can add to and anyone can challenge'],
  '2025-09-20 16:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q5 — Nov 2025 | Psychological safety (human)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'How supported does the team feel in taking creative risks or trying unconventional approaches?',
  'closed', 4, false, '2025-11-12 10:00:00+00'
) RETURNING id INTO q5;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q5, 'In theory, very supported. In practice, when timelines tighten, the safe option always wins. The space for experimentation collapses under pressure.', '2025-11-12 11:50:00+00'),
  (q5, 'I''ve never been told not to try something. But I''ve also never been explicitly encouraged to. It just doesn''t come up.', '2025-11-13 09:00:00+00'),
  (q5, 'The risk isn''t in trying — it''s in failing publicly and having that define the project outcome. I need to know failure is recoverable first.', '2025-11-13 14:40:00+00'),
  (q5, 'More supported than I expected, honestly. But the support is passive — nobody says no, but nobody''s actively making space for it either.', '2025-11-14 10:15:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q5,
  'The team feels more supported in theory than in practice. The intent to encourage experimentation is genuine, but when timelines tighten the safer option wins every time. The gap between ''we should try things'' and ''we have real space to try things'' is felt clearly.',
  ARRAY['Psychological safety', 'Innovation'],
  ARRAY['Protect one spike day per sprint for experiments — no deliverable required, just exploration and a one-paragraph share-out', 'Celebrate failed experiments explicitly in retros alongside successes — make failure survivable and visible'],
  '2025-11-14 15:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q6 — Dec 2025 | New year confidence (human)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'What would make the team feel more confident heading into the new year?',
  'closed', 4, false, '2025-12-08 09:00:00+00'
) RETURNING id INTO q6;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q6, 'Knowing what we''re actually prioritizing and what we''re allowed to deprioritize. Without that, everything feels urgent and nothing gets real attention.', '2025-12-08 11:30:00+00'),
  (q6, 'A clear sense of what success looks like for the first quarter. Not a roadmap — just an honest direction.', '2025-12-08 16:00:00+00'),
  (q6, 'Less ambiguity about where we''re headed. There''s energy here, it just needs somewhere real to go.', '2025-12-09 09:40:00+00'),
  (q6, 'Clarity on what we can say no to. That would give me the confidence to actually commit to what we''re saying yes to.', '2025-12-10 10:00:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q6,
  'Clarity tops the list — on priorities, on what success looks like, and on what can be safely deprioritized. There is energy and genuine optimism in the team, but it feels contingent. People want to know where they are actually going, not just what they are building next.',
  ARRAY['Clarity', 'Direction'],
  ARRAY['Share a 90-day snapshot in early January — not a roadmap, a 3-sentence direction statement the whole team can react to', 'Run a team start/stop/keep before the quarter begins — 30 minutes, huge signal'],
  '2025-12-10 15:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q7 — Dec 2025 | Healthy disagreement (AI-generated)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'What does healthy disagreement look like on this team, and how close are we to that?',
  'closed', 4, true, '2025-12-22 10:00:00+00'
) RETURNING id INTO q7;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q7, 'We can push back on execution details but not on direction. Direction feels set and I''m not sure I''m supposed to question it.', '2025-12-22 12:20:00+00'),
  (q7, 'Disagreements happen in one-on-ones, not in the room. By the time a decision is made it looks unanimous — but it isn''t, and people know it.', '2025-12-23 09:15:00+00'),
  (q7, 'I think we''re closer than we were. But there are still topics where I feel the weight of not rocking the boat.', '2025-12-23 14:00:00+00'),
  (q7, 'Healthy disagreement looks like: someone names a concern, it gets heard, the team adjusts or commits. We''re maybe 60% of the way there.', '2025-12-23 17:30:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q7,
  'The team can disagree on execution details but struggles with disagreement on direction or priorities. Concerns get aired in one-on-ones but rarely reach the full group. Decisions look unanimous on the surface — but often are not, and everyone knows it.',
  ARRAY['Conflict', 'Communication'],
  ARRAY['Try a pre-mortem before major decisions — surface risks before committing, not after', 'Normalise ''disagree and commit'' language so dissent has a named, respected role in team decisions'],
  '2025-12-24 10:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q8 — Jan 2026 | Role ownership (human)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'How clear is each person on what they own and where the boundaries of their role are?',
  'closed', 4, false, '2026-01-13 10:00:00+00'
) RETURNING id INTO q8;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q8, 'Clear on my core responsibilities. Much less clear on cross-functional decisions — who leads those is decided in the moment and it changes.', '2026-01-13 12:30:00+00'),
  (q8, 'The ambiguity doesn''t bother me day to day, but it slows things down when something spans more than one person''s domain.', '2026-01-14 09:00:00+00'),
  (q8, 'Mostly intuitive. I know my area, but edge cases are fuzzy enough that I sometimes hold back rather than accidentally step on someone else''s ownership.', '2026-01-14 14:50:00+00'),
  (q8, 'Role clarity is fine. Decision-making clarity is not. We need less of a RACI chart and more of a ''who is the deciding voice'' agreement.', '2026-01-15 10:30:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q8,
  'Ownership is mostly intuitive rather than explicit. People generally know their domain, but cross-functional decisions create friction — not enough to raise formally, but enough to slow things down. There is a desire for light clarity without heavy process.',
  ARRAY['Ownership', 'Roles'],
  ARRAY['Run a quick ''who leads what'' mapping session — 30 minutes, a shared doc, one decision-maker named per domain', 'When starting any new project, name the decision-maker on day one — before the ambiguity has time to compound'],
  '2026-01-15 16:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q9 — Jan 2026 | Quality improvement (human)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'What one change to how the team builds would have the biggest impact on quality?',
  'closed', 4, false, '2026-01-28 10:00:00+00'
) RETURNING id INTO q9;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q9, 'Testing discipline. Not a formal mandate — just a cultural shift toward ''I don''t ship what I wouldn''t trust.''', '2026-01-28 12:00:00+00'),
  (q9, 'Catching design inconsistencies earlier. By the time I see something in implementation, undoing it costs real time.', '2026-01-29 09:10:00+00'),
  (q9, 'Peer review with a real turnaround expectation. Right now reviews happen when someone gets around to it.', '2026-01-29 14:35:00+00'),
  (q9, 'Agreeing on what a ''good enough'' threshold looks like before we start, not after. We keep polishing the wrong things.', '2026-01-29 17:00:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q9,
  'Testing discipline surfaces as the highest-leverage cultural shift — not a process mandate, but a shared standard: don''t ship what you wouldn''t trust. There is also a consistent thread about catching design gaps upstream, before implementation rather than after.',
  ARRAY['Quality', 'Engineering'],
  ARRAY['Introduce peer code review with a 24-hour turnaround SLA — speed matters as much as rigor', 'Add a 5-minute design walkthrough to the sprint kickoff so gaps surface before anyone writes a line of code'],
  '2026-01-30 10:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q10 — Feb 2026 | Data vs instincts (human)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'How effectively is the team using data to make decisions, and where do instincts take over when they shouldn''t?',
  'closed', 4, false, '2026-02-18 10:00:00+00'
) RETURNING id INTO q10;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q10, 'Data exists but it doesn''t flow into decisions naturally. I check metrics when I think to, not as a reflex.', '2026-02-18 12:40:00+00'),
  (q10, 'I trust my instincts more than the data because the data isn''t always reliable. Until I trust the source, I won''t lean on it.', '2026-02-19 09:25:00+00'),
  (q10, 'We have dashboards. Nobody owns the story they tell. So they become wallpaper.', '2026-02-19 14:00:00+00'),
  (q10, 'Gut calls are fine for small decisions. The problem is they also drive medium decisions. We''ve never agreed on what threshold requires evidence.', '2026-02-20 10:15:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q10,
  'Data exists but does not flow naturally into decisions. People trust instincts because the data is not always accessible or fully trusted. The gap between having metrics and using them as a team is real — partly tooling, partly habit, partly nobody owning the narrative.',
  ARRAY['Data', 'Decision-making'],
  ARRAY['Appoint a rotating ''data owner'' each sprint to pull and share one key metric with context — not a report, a story', 'Add a ''what does the data say?'' question to your design review template so it becomes a natural reflex'],
  '2026-02-20 16:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q11 — Mar 2026 | Leadership understanding (human)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'What does the team wish leadership understood better about the day-to-day reality of building?',
  'closed', 4, false, '2026-03-11 10:00:00+00'
) RETURNING id INTO q11;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q11, 'Context-switching has costs that don''t show up in velocity. Every ''quick thing'' requires 30 minutes of recovery that the metrics never capture.', '2026-03-11 12:00:00+00'),
  (q11, 'That the tradeoffs we make are real and deliberate. When decisions get second-guessed after the fact, it makes me hesitate before making the next call.', '2026-03-12 09:30:00+00'),
  (q11, 'How much energy goes into navigating ambiguity, not just building. If the inputs were clearer the outputs would be too.', '2026-03-12 14:20:00+00'),
  (q11, 'We move fast because we trust each other, not because we''re tracking outputs. That trust is worth protecting.', '2026-03-12 17:00:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q11,
  'The team wants leadership to see that context-switching and interrupt culture carry hidden costs that don''t appear in output metrics. There is also a quiet wish for more trust: decisions second-guessed after the fact create caution about taking initiative in the first place.',
  ARRAY['Leadership', 'Trust'],
  ARRAY['Share a ''what we navigated this sprint'' note with leadership — not just outputs, but the tradeoffs made and why', 'Propose a protected no-interrupt window respected across all levels, including leadership asks'],
  '2026-03-12 19:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q12 — Mar 2026 | Six months from now (AI-generated)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'What would this team look like in six months if everything went right?',
  'closed', 4, true, '2026-03-25 10:00:00+00'
) RETURNING id INTO q12;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q12, 'Shipping something I''m genuinely proud of. Not just done — actually good.', '2026-03-25 12:10:00+00'),
  (q12, 'Feeling like we''ve grown together, not just worked together. There''s a difference and I want to feel it.', '2026-03-26 09:00:00+00'),
  (q12, 'Enough breathing room to actually enjoy the work. The ambition isn''t the problem — the constant pressure is.', '2026-03-26 14:30:00+00'),
  (q12, 'A team that doesn''t need a tool like this to surface hard truths, because we''ve learned to say them directly.', '2026-03-27 10:00:00+00');

INSERT INTO synthesis (question_id, insight_text, themes, suggestions, created_at) VALUES
  (q12,
  'The team''s version of six months from now is surprisingly consistent: shipping something they''re proud of, feeling like they''ve grown together, and having enough breathing room to actually enjoy the work. The ambition is not outsized — it is meaningful. The desire is not recognition; it is mattering.',
  ARRAY['Growth', 'Vision'],
  ARRAY['Write a one-paragraph ''team memo from the future'' together — what did you ship and how did it feel to get there?', 'Set one non-output goal for the next quarter alongside the roadmap — about how you work, not just what you deliver'],
  '2026-03-27 15:00:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q13 — Apr 2026 | Remote trust (human, OPEN, 2/4 answered)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'In what ways has remote collaboration changed how the team builds trust with each other?',
  'open', 2, false, '2026-04-17 09:30:00+00'
) RETURNING id INTO q13;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q13, 'Trust has become more about consistency than visibility. I trust the people who always follow through, regardless of when or where they work.', '2026-04-17 14:00:00+00'),
  (q13, 'Remote made the implicit explicit. You have to actually say ''I''m swamped'' or ''I need input here'' — you can''t read the room anymore.', '2026-04-18 10:20:00+00');


-- ─────────────────────────────────────────────────────────────
-- Q14 — Apr 2026 | The avoided conversation (AI-generated, OPEN, 1/4 answered)
-- ─────────────────────────────────────────────────────────────
INSERT INTO questions (team_id, anonymized_text, status, answer_count, is_ai_generated, created_at)
VALUES (tid,
  'What is something the team has avoided talking about that, if addressed, could meaningfully improve how things feel day to day?',
  'open', 1, true, '2026-04-22 10:00:00+00'
) RETURNING id INTO q14;

INSERT INTO answers (question_id, anonymized_text, created_at) VALUES
  (q14, 'How we decide what''s urgent versus what just feels urgent. Right now everything competes for the same attention and nothing wins clearly.', '2026-04-22 13:30:00+00');


END $$;
