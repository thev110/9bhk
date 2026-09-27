# Prompt 19 — Vercel Deployment Readiness

Prepare production deployment.

## Verify
- build succeeds
- environment variable names documented
- Supabase URL/key separation is correct
- Google OAuth redirect URLs are documented
- storage policies are present
- RLS is enabled
- server-only secrets are not imported into client modules
- image domains/configuration are correct
- no local filesystem dependency
- no hardcoded localhost URLs

## Output
Create/update:
- `.env.example`
- deployment notes
- README run instructions

Stop after this task.
