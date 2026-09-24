## Summary

- 

## Verification

- [ ] Unit/component tests pass
- [ ] Typecheck, lint, production build, and `git diff --check` pass
- [ ] pgTAP and Supabase DB lint pass (when DB changes)
- [ ] PR head SHA matches the Vercel Preview deployment
- [ ] Preview environment points to the intended Supabase project
- [ ] `pnpm audit:remote` passes from a secure operator environment
- [ ] Authenticated business routes were tested on the exact protected Preview URL
- [ ] At least one safe Preview mutation was verified by remote DB read-back
- [ ] Browser console and HTTP responses contain no unexpected errors
- [ ] Mobile 390px QA has no horizontal overflow or bottom-nav overlap

## Important

CI/build, `supabase db push`, Vercel `READY`, and `/login` HTTP 200 are necessary but are **not** end-to-end evidence. Follow `ops/PREVIEW_RELEASE_RUNBOOK.md` for Supabase/Auth/RLS/schedule changes.
