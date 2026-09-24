# Preview Release Verification Runbook

Use this runbook for every change that touches Supabase schema, seed data, RLS, authentication, schedules, or business routes.

## Non-evidence

The following do **not** prove the deployment works end to end:

- CI/build is green.
- `supabase db push` exits 0.
- `/login` returns HTTP 200.
- Local Supabase/browser QA passes.
- Vercel reports `READY`.

## Required gates

1. **Deployment identity**
   - Confirm the PR head SHA.
   - Confirm Vercel deployed that SHA, not a stale deployment.
   - Use the configured Automation Bypass when Preview Protection is enabled; otherwise a 200 response may be Vercel's login page.

2. **Environment identity**
   - Pull Preview environment variables without logging values.
   - Validate `NEXT_PUBLIC_SUPABASE_URL` resolves to the expected project reference.
   - Never expose or add `SUPABASE_SERVICE_ROLE_KEY` to browser code or Vercel public variables.

3. **Remote schema and reference data**
   - Run `supabase migration list`; local and remote migrations must match.
   - Run `pnpm audit:remote` from a secure operator environment.
   - The audit must confirm five operational locations, equipment counts `9/8/4/4`, 25 total machines, six published versions, 25 BM.06 snapshot rows, and at least one active Auth user/profile/business scope.
   - Remember: `supabase db push` does not execute `supabase/seed.sql`. Remote-required reference data belongs in idempotent migrations.

4. **Authenticated Preview read path**
   - Log in through the exact protected Preview URL.
   - Verify five areas and counts `9/8/4/4/0`.
   - Verify current shift and BM.06 exactly 25 machines.
   - Verify Today/Calendar occurrences render.
   - Check browser console and all responses `>=400`.

5. **Mutation and database read-back**
   - Submit one safe draft through Preview.
   - Read back the exact record/status from remote Supabase.
   - Assert actor/timestamp audit fields are populated.
   - Remove disposable data or document the retained QA fixture.

6. **Mobile QA**
   - Test at `390x844`.
   - Assert no horizontal overflow.
   - At the bottom of the page, assert the final content ends above the fixed bottom navigation.
   - Verify validation errors render in-page with `role="alert"`.

7. **Closeout**
   - Run frontend tests, typecheck, lint, build, pgTAP, DB lint, and `git diff --check`.
   - Obtain an independent fail-closed review.
   - Record exact counts and deployment SHA in the PR. Never claim completion from redirects/status codes alone.
