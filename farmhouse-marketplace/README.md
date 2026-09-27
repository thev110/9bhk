# Farmhouse Rental Marketplace — Codex Build Pack

## Product
A mobile-first marketplace dedicated exclusively to farmhouse rentals. Guests discover and book farmhouses; hosts list and manage farmhouses; admins verify listings, users and bookings.

## Technical baseline
- Next.js App Router
- React + TypeScript
- Tailwind CSS
- shadcn/ui + Radix UI
- Lucide icons
- Supabase PostgreSQL
- Supabase Auth (Google first)
- Supabase Storage
- Supabase Realtime where useful
- Vercel
- Zod
- TanStack Query where client caching/interactivity is useful
- Motion only for restrained interaction feedback

## Product direction
Modern countryside luxury. Photography-first. Warm cream + deep forest palette. Premium but approachable. Do not copy Airbnb or other products directly; use the supplied reference images for information architecture and interaction patterns only.

## Reference assets
- `references/01-ui-reference.jpg` — reference mobile UI collage
- `references/02-user-flow.png` — guest flow reference
- `references/03-wireframe-master.png` — generated master sitemap/wireframe

## Build rule
Execute prompt files in numerical order. Each prompt is a self-contained implementation task. Do not jump ahead and do not redesign previous work unless required to fix a bug or establish a shared primitive.

At the end of every task:
1. run typecheck/lint/tests relevant to the change
2. summarize files changed
3. list anything intentionally deferred
4. stop and wait for the next prompt
