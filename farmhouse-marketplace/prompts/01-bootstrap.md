# Prompt 01 — Bootstrap the Product

You are building a production-grade mobile-first farmhouse rental marketplace.

Read these files first:
- ../README.md
- ../PRODUCT_SPEC.md
- ../DESIGN_SYSTEM.md
- ../DATABASE_PLAN.md
- ../references/01-ui-reference.jpg
- ../references/02-user-flow.png
- ../references/03-wireframe-master.png

## Task
Create the application foundation only. Do not build the full product yet.

### Do
- Initialize/normalize the Next.js App Router project.
- TypeScript strict mode.
- Tailwind CSS.
- shadcn/ui and Radix primitives where useful.
- Lucide icons.
- Establish `/app`, `/components`, `/features`, `/lib`, `/schemas`, `/types`, `/supabase` conventions.
- Add environment variable validation.
- Add a safe Supabase browser/server client structure.
- Add a root layout with the correct fonts and metadata.
- Add a basic mobile shell component and desktop shell component.
- Add a `cn()` utility if not already present.
- Create the initial design tokens from DESIGN_SYSTEM.md.
- Ensure the app runs on Vercel without local-only assumptions.

### Do not
- Implement booking logic.
- Implement payment logic.
- Implement host CRUD.
- Create fake APIs.
- Put secret keys in client code.

### Acceptance
- `npm run build` succeeds.
- Typecheck succeeds.
- The root route renders a minimal branded shell.
- No broken imports.

Stop after completing this task and summarize the files changed.
