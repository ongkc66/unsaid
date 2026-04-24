# Trigger Checklists

## `ccc` Trigger
Go through all three ACE personas and lay out the full plan before any execution:
1. **Apple Designer lens** — how does this affect UX, spacing, motion, cognitive load?
2. **Stripe Engineer lens** — is this idempotent, self-documenting, reliable?
3. **Product Strategist lens** — does this move the needle, or is it over-engineering?
Present the synthesized plan. Wait for go-ahead before writing any code.

---

## `gxgx` Trigger — End-of-Session Update (~7–8 min)

### Phase 1: Session Insights (1 min, terse)
- New non-obvious pattern discovered? → add to memory
- Bug root cause found? → was it an architectural flaw?
- Token efficiency observation? → doc too bloated? pattern saves tokens?
- New gotcha? → something that will trip us up next time?

### Phase 2: Update Docs (6 updates, 6–7 min)

**1. `docs/conventions.md` → Key Gotchas**
- Add new gotchas discovered this session
- Remove/mark stale ones (move to Deprecated Patterns if resolved)

**2. `docs/conventions.md` → Deprecated Patterns**
- Move stale gotchas here with `[RESOLVED: DD MMM YYYY]` marker
- Format: `- **Pattern Name** [RESOLVED: date] — why it's no longer relevant`
- Reference only; prevents re-learning the same lesson

**3. `docs/architecture.md` → Decision Log**
- Log any architectural choice made this session
- Format: `- **[DATE] Decision:** What? **Why?** Alternatives rejected? **Tradeoff:** What are we accepting?`

**4. `docs/architecture.md` → Quality Signals**
- Update timestamps and status emoji
- Pick ONE 🔴/🟡 area and spot-check it (5 min max)
- Update status based on findings

**5. `docs/progress.md` → Outstanding**
- Tick off completed items
- Add newly discovered tasks

**6. `docs/progress.md` → Recent Changes**
- Append one dated paragraph (under 10 lines) summarizing what shipped
- Lead with outcome, use "You" language
