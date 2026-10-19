# SH103-Lab — Performance Optimization, Form Save Reliability & Production Release P9

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 2 Navigation Performance Optimization, fix save reliability and state retention for all 6 clinical forms, execute comprehensive quality and security testing, and deploy stable branch 9 to Production.

**Architecture:**
- Frontend: Next.js 15 App Router with React Server Components (RSC), client-side error/saved boundaries, and instant route skeletons.
- Auth & Middleware: Deduplicated session check in Edge middleware (only verify session for authenticated routes; profile query restricted to admin routes), with `React.cache()` in Server Components.
- Form Reliability: Unified 5-state lifecycle (`idle` / `dirty` / `saving` / `saved` / `error_pending_sync`), in-flight mutex against duplicate submits, localStorage state preservation on failure, and explicit retry buttons.
- Database: Supabase Postgres in Sydney (`ap-southeast-2`), Vercel functions in `syd1`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase SSR, Vitest / Playwright.

---

## Global Constraints
- Strictly preserve ISO 15189 compliance, all 6 form schemas, RLS policies, and hospital approval hierarchy.
- No historical record alteration or schema migration without explicit approval.
- No hardcoded credentials, JWTs, or passwords in committed files or scripts.
- Never show "Đã lưu" / "Saved" unless confirmed by backend HTTP 200 / RPC success.
- Never drop un-saved user inputs on failure or navigation.

---

## Review Focus
1. **False Save Indication:** UI showing "Saved" or "Bình thường" when backend returned error or request failed.
2. **Data Wipeout on Failure:** Page reload or redirect wiping out technician's unsaved 20-machine entries or checkboxes.
3. **Double Submission:** Repeated clicks causing concurrent RPC calls or duplicate record creation.
4. **Auth Invalidation:** Network flakiness causing false session signouts or redirect loops.
5. **Report Period Deduplication:** Removing `getReportPeriods()` from `/reports` must NOT alter period filtering, tab navigation, or Excel export.

---

### Task 1: P2 — Navigation Performance Optimization & Auth Deduplication
**Files:**
- Modify: `src/lib/supabase/proxy.ts`
- Modify: `src/lib/forms/workflow.ts`
- Modify: `src/app/reports/page.tsx`
- Create: `src/app/temperature/loading.tsx`
- Create: `src/app/equipment/loading.tsx`
- Create: `src/app/reports/loading.tsx`
- Test: `tests/nav-perf-and-auth.test.ts`

- [ ] **Step 1: Write tests for middleware auth optimization and React.cache deduplication**
- [ ] **Step 2: Update `proxy.ts` to only query `profiles` on admin routes and handle invalid refresh tokens gracefully**
- [ ] **Step 3: Wrap `getCurrentAccess()` in `src/lib/forms/workflow.ts` with `React.cache()`**
- [ ] **Step 4: Refactor `src/app/reports/page.tsx` to eliminate duplicate `getReportPeriods()` query**
- [ ] **Step 5: Add route `loading.tsx` skeletons for `/temperature`, `/equipment`, `/reports`**
- [ ] **Step 6: Run tests and verify exit 0**
- [ ] **Step 7: Commit changes**

---

### Task 2: P9 — Form 1 (BM06) Save Reliability & State Retention
**Files:**
- Modify: `src/components/forms/ShiftRegisterForm.tsx`
- Modify: `src/app/equipment/page.tsx`
- Modify: `src/app/api/forms/bm06/route.ts`
- Test: `tests/bm06-save-reliability.test.tsx`

- [ ] **Step 1: Write failing tests for BM06 error retention, duplicate submit prevention, and status badges**
- [ ] **Step 2: Remove default "Saved" badge and implement explicit 5-state lifecycle**
- [ ] **Step 3: Implement client-side fetch submit with local state & localStorage fallback**
- [ ] **Step 4: Update `/equipment/page.tsx` to handle searchParams error/saved alerts**
- [ ] **Step 5: Verify tests pass**
- [ ] **Step 6: Commit changes**

---

### Task 3: P9 — Form 2 (BM01_KNBM) Save Reliability & Error Handling
**Files:**
- Modify: `src/components/forms/DecontaminationForm.tsx`
- Modify: `src/components/forms/DecontaminationWorkspace.tsx`
- Modify: `src/app/decontamination/page.tsx`
- Test: `tests/decontamination-save-reliability.test.tsx`

- [ ] **Step 1: Write failing tests for decontamination save error handling and input preservation**
- [ ] **Step 2: Update `DecontaminationForm` to support async submit with clear error message and state retention**
- [ ] **Step 3: Update `DecontaminationWorkspace` and `DecontaminationPage` to display area-specific error banners**
- [ ] **Step 4: Verify tests pass**
- [ ] **Step 5: Commit changes**

---

### Task 4: P9 — Form 3 (Maintenance BM.02) Save Reliability
**Files:**
- Modify: `src/components/forms/MaintenanceForm.tsx`
- Modify: `src/app/maintenance/[occurrenceId]/page.tsx`
- Modify: `src/app/maintenance/actions.ts`
- Test: `tests/maintenance-save-reliability.test.tsx`

- [ ] **Step 1: Write failing tests for maintenance form state retention and retry mechanism**
- [ ] **Step 2: Update `MaintenanceForm` with in-flight submit guard and state preservation on error**
- [ ] **Step 3: Update maintenance page to show detailed error and retry actions**
- [ ] **Step 4: Verify tests pass**
- [ ] **Step 5: Commit changes**

---

### Task 5: P9 — Forms 4–6 (Temperature & Humidity BM.01, BM.02, BM.03) Save Reliability
**Files:**
- Modify: `src/components/forms/InlineTemperatureCard.tsx`
- Test: `tests/inline-temperature-save-reliability.test.tsx`

- [ ] **Step 1: Write failing tests for temperature card status badge accuracy (never show "Bình thường" when pendingSync/error)**
- [ ] **Step 2: Guard `saveToServer` against concurrent in-flight calls**
- [ ] **Step 3: Update status badge to show amber "Chờ đồng bộ" when pendingSync or saveError is active**
- [ ] **Step 4: Add explicit retry button for pending sync items**
- [ ] **Step 5: Verify tests pass**
- [ ] **Step 6: Commit changes**

---

### Task 6: Comprehensive Testing, Quality Gates & Independent Review
**Files:**
- All tests in `tests/`
- Build artifacts

- [ ] **Step 1: Run complete unit and integration test suite**
- [ ] **Step 2: Run `pnpm lint` and `pnpm build`**
- [ ] **Step 3: Execute independent code and security review subagent**
- [ ] **Step 4: Fix any critical/important review findings**
- [ ] **Step 5: Measure before/after navigation performance benchmark**

---

### Task 7: Release P9 to Production
**Files:**
- Git branch `9`, PR merge to `master`, Production deployment

- [ ] **Step 1: Push commits to `origin/9`**
- [ ] **Step 2: Verify Vercel preview deployment passes**
- [ ] **Step 3: Check all Release Gates (Security, Form Save Reliability, Quality Gates)**
- [ ] **Step 4: Merge PR into `master` and trigger Production deployment**
- [ ] **Step 5: Execute non-destructive Production smoke test**
- [ ] **Step 6: Generate final status report**
