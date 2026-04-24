# Frontend Rules (Next.js + Tailwind)

## Next.js App Router
- Use server components by default — only add `'use client'` when the component needs hooks or browser events
- Prefer server actions for form submissions over client-side fetch where possible
- Keep route handlers thin — business logic belongs in lib/, not in route.ts files
- Dynamic routes use folder notation: `app/team/[code]/page.tsx`

## Tailwind
- Utility classes only — no custom CSS unless absolutely unavoidable
- Use `cn()` helper (from clsx + tailwind-merge) for conditional class merging
- Responsive prefix order: base → sm → md → lg (mobile-first)
- Prefer slate/zinc palette for neutrals; avoid saturated colours in the main UI

## Components
- One component per file
- Props typed with TypeScript interfaces defined in the same file (no separate types file unless shared)
- No default exports for utility functions — named exports only
- Components that fetch data should be async server components; pass data down as props

## Forms
- Use native `<form>` with server actions where possible
- Show loading state during submission — disable submit button, show spinner
- Validate on the server, not just the client

## Error Handling
- Use Next.js `error.tsx` for route-level errors
- API routes return `{ error: string }` with appropriate HTTP status on failure
- Never expose raw error messages to the client
