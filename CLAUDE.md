# Kondix

Gym training management app for personal trainers. Production at `kondix.celvo.dev`.

> Renombrado desde `gym` a Kondix (abril 2026). Schema DB (`kondix`, migración `20260413184100_RenameSchemaToKondix`), AppSlug CelvoGuard (`kondix`), cookies (`cg-*-kondix`), dominio, imágenes GHCR (`kondix-api`/`kondix-web`) migrados. Caddy mantiene `gym.celvo.dev` como redirect 301 permanente → `kondix.celvo.dev`. Migraciones EF viejas conservan `HasDefaultSchema("gym")` por snapshot histórico (correcto — no tocar).

> See `../CLAUDE.md` for ecosystem-wide conventions, shared infra, and cross-app auth flow.

## What This App Does

Trainers create workout routines, group them into programs, and assign programs to students. Students follow their assigned program, log progress (weight/reps/RPE per set), and communicate with their trainer via comments.

## Architecture

- **Backend**: .NET 10, Clean Architecture (Domain → Application → Infrastructure → Api)
- **Frontend**: Angular 21 SPA (`kondix-web/`), Tailwind CSS 4, dark theme only
- **Auth**: CelvoGuard via NuGet `CelvoGuard.Client 2.0.0` (trainers = operators, students = end-users, both email+password)
- **Database**: PostgreSQL schema `kondix` in shared `celvo` database (same DB as Fidly and Vimor)
- **Domain**: `kondix.celvo.dev` (redirect: `gym.celvo.dev` 301 → kondix)
- **Storage**: MinIO bucket `kondix-videos` planeado (trainer-uploaded exercise videos) — **aún NO creado en prod** (verificado 2026-04-23). Por ahora los trainers usan YouTube embed URLs. El bucket debe crearse en MinIO antes de habilitar uploads.

## Commands

```bash
# Backend
dotnet build Kondix.slnx
dotnet run --project src/Kondix.Api

# Frontend
cd kondix-web && npm install && npx ng serve

# Dev infrastructure
docker compose up -d
```

## Key Design Decisions

- **Tenancy**: Each trainer = 1 tenant (no gym/company concept)
- **Trainer registration**: Requires admin approval (`IsApproved` flag)
- **Student onboarding**: Trainer invites via email or QR code
- **Trainer-Student**: M:N junction table, 1:1 enforced in business logic for MVP
- **Routine structure**: Routine → Day → ExerciseGroup → Exercise → ExerciseSet
- **Program structure (v3)**: Program → ProgramWeek → ProgramSlot (kind: Empty | Rest | RoutineDay)
- **Program modes (v3)**: `Mode: Fixed | Loop` — Fixed has N weeks, Loop has 1 week template that repeats forever
- **Schedule type (v3)**: `ScheduleType: Week | Numbered` (immutable after create) — Week has 7 cells/week (Mon..Sun); Numbered has N cells/week (`DaysPerWeek`), no rest/empty slots, week-bucket scheduling on the student side
- **Assignment model (v3)**: `(StudentId, ProgramId, StartDate, Status)` — schedule lives on the program, not the assignment. Loop assignments are indefinite; Fixed assignments end after `Program.Weeks.Count × 7` days. 1:1 active assignment per student is enforced server-side by cancelling prior active rows on insert.
- **Publish flow (v3)**: programs created as `IsPublished=false`; one-way transition to `IsPublished=true`. Assignment requires a published program.
- **Per-slot overrides** are out of scope for v3.
- **Set types**: Warmup, Effective, DropSet, RestPause, AMRAP
- **Exercise grouping**: Single, Superset, Triset, Circuit
- **Videos**: YouTube embed or trainer upload (MinIO bucket `kondix-videos`)
- **Routine updates**: Full replace (delete old days/exercises, recreate)

## Programs v3 trainer editor (Phase 4) — quick reference

3-column shell at `/trainer/programs/:id`. State lives in `ProgramEditorStore` (NgRx SignalStore, locally provided). After every mutation the store reloads the full `ProgramDetail` (no optimistic merging).

Family of components in `kondix-web/src/app/features/trainer/programs/ui/`:
- `<kx-program-meta-panel>` — left column (name/description/objective/level/mode/notes; debounced on blur)
- `<kx-program-week-row>` — one week (label + cells + duplicate/delete menu, hidden in Loop mode)
- `<kx-program-day-cell>` — single calendar cell (3 visual states with objective accent)
- `<kx-cell-inspector>` — right inspector (Empty / Rest / RoutineDay branches)
- `<kx-create-program-modal>` — creation modal (objective/level/mode/scheduleType/duration)
- `<kx-assign-routine-modal>` — 2-step wizard, Week branch maps days to weekdays via `suggestWeekdayMapping([0,2,4,1,3,5,6])`, Numbered branch picks ordered days
- `<kx-program-card>` — list card (Phase 6)
- `<kx-assign-program-modal>` — minimal student + start date (Phase 6)

## API Routes

- Trainer (operator): `/api/v1/routines`, `/api/v1/students`, `/api/v1/programs` (+ `/{id}/publish`, `/duplicate`, `/weeks`, `/weeks/{w}/duplicate`, `/weeks/{w}`, `/weeks/{w}/slots/{d}`, `/assign-routine`, `/blocks/{blockId}`, `/fill-rest`), `/api/v1/program-assignments` (POST simplified to `{StudentId, ProgramId, StartDate}` in v3)
- Student (end-user): `/api/v1/public/my/program`, `/api/v1/public/my/next-workout` (v3 discriminated `Kind: Routine|Rest|Empty|Numbered|Done`), `/api/v1/public/my/this-week` (numbered only), `/api/v1/public/my/routines/{id}`, `/api/v1/public/my/sets/*`, `/api/v1/public/my/sessions/start` (accepts optional `WeekIndex`/`SlotIndex`)
- Public: `/api/v1/health`, `/api/v1/public/invite/{token}`

## Design Context

### Brand Identity
- **Logo:** "The Lift" — chevron (progress) + bar (strength), stroke-based SVG mark
- **Primary color:** KONDIX Crimson `#E62639` (HSL 354, 79%, 53%)
- **Typography:** Syne (display/headings) + Outfit (body/UI) via Google Fonts
- **Icons:** Lucide (outline, 1.5px stroke)
- **Theme:** Dark only — blue-black premium (#09090B base)
- **Voice:** Spanish (tú), motivational but professional, direct

### Design Principles
1. **Progress is visible** — progress bars, completion states, visual feedback
2. **Gym-practical first** — generous touch targets, glanceable info, fast logging
3. **Structure without clutter** — clear visual nesting via spacing and progressive disclosure
4. **Celebrate achievement** — glow, bounce, pulse for earned completions
5. **Trust through consistency** — every element belongs to the same system

### Reusable Components (`kondix-web/src/app/shared/ui/`)
- `<kx-logo>` — Logo mark + wordmark (inputs: size, showText, href)
- `<kx-spinner>` — Loading spinner (inputs: size, containerClass)
- `<kx-empty-state>` — Empty state with brand mark or Lucide icon (inputs: title, subtitle, icon)
- `<kx-page-header>` — Page header with display font (inputs: title, subtitle, hasBack)
- `<kx-avatar>` — Initial circle avatar with optional gradient (inputs: name, size, gradient)
- `<kx-confirm-dialog>` — Modal confirmation replacing native confirm() (inputs: open, title, message, confirmLabel, variant)
- `<kx-toast>` + `ToastService` — Global toast notifications (placed in app root)
- `<kx-stat-card>` — Stat card (inputs: value, label, trend, valueColor)
- `<kx-progress-bar>` — Crimson gradient progress bar (inputs: percentage, label, showLabel, size)
- `<kx-badge>` — Status badge with optional dot (inputs: text, variant, dot)
- `<kx-bottom-nav>` — Bottom tab navigation (inputs: tabs[]{label, route, icon})
- `<kx-sidebar>` — Collapsible sidebar for trainer (inputs: items, userName, userInitials; outputs: create)
- `<kx-segmented-control>` — Pill-style tab switcher (inputs: options, selected; outputs: selectedChange)
- `<kx-hero-card>` — Today's workout hero card (inputs: routineName, dayName, programName, week, totalWeeks, streak)
- `<kx-set-row>` — Set logging row (inputs: setNumber, setType, state, kg, reps, rpe, note?, showNoteToggle?; outputs: noteChange) — note toggle 💬 added in v2 Phase 3
- `<kx-rest-timer>` — Countdown rest timer (inputs: durationSeconds, active; outputs: skip, finished)
- `<kx-day-cell>` — Calendar day cell with states (inputs: day, state ∈ {idle, today, completed, missed, recovered, future, restDay}; outputs: select) — `recovered` added in v2 Phase 4
- `<kx-wizard-stepper>` — Wizard step indicator (inputs: currentStep, totalSteps)
- `<kx-student-card>` — Student card with avatar and status (inputs: name, initials, status, statusText)
- `<kx-timeline>` — Vertical timeline with colored dots (inputs: items[]{color, title, subtitle})
- `<kx-exercise-thumb>` — Square thumbnail (xs/sm/md/lg/fill) with photoUrl + muscle-tinted gradient fallback + optional video pill (v2 Phase 1)
- `<kx-video-demo-overlay>` — Full-screen YouTube demo player with backdrop click-to-close (v2 Phase 2)
- `<kx-mood-picker>` — 4-option mood selector (Great|Good|Ok|Tough) (v2 Phase 3)
- `<kx-rpe-stepper>` — 1–10 RPE selector with green→amber→red color scale (v2 Phase 3)
- `<kx-set-chip>` — Compact historical set chip (weight × reps, PR badge, note tooltip) (v2 Phase 3)
- `<kx-session-row>` — Expandable trainer-timeline row with mood + RPE chips + set chips + notes (v2 Phase 3)
- `<kx-exercise-feedback-modal>` — RPE + notes capture after the last set of an exercise (v2 Phase 3)
- `<kx-recovery-banner>` — Amber home banner for recoverable missed sessions (v2 Phase 4)
- `<kx-program-day-cell>` — Program editor calendar cell, 3 visual states (v3 Phase 4)
- `<kx-program-week-row>` — Program editor week row (v3 Phase 4)
- `<kx-program-meta-panel>` — Program editor left column (v3 Phase 4)
- `<kx-cell-inspector>` — Program editor right inspector (v3 Phase 4)
- `<kx-create-program-modal>` — Program creation modal (v3 Phase 3)
- `<kx-assign-routine-modal>` — 2-step wizard, picker + mapping (v3 Phase 4)
- `<kx-program-card>` — Program list card with timeline preview + badges + menu (v3 Phase 6)
- `<kx-assign-program-modal>` — Minimal assign-to-student modal (v3 Phase 6)

Full design context: `kondix-web/.impeccable.md`

## Frontend Conventions (Angular)

- **Lucide icons in standalone components**: Use `LucideAngularModule` in imports + `{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) }` in providers. `LucideAngularModule.pick()` returns ModuleWithProviders which Angular 21 rejects in standalone imports.
- **Lucide icon names**: Use kebab-case (`clipboard-list`, `trending-up`). Note: "home" was renamed to `house` in Lucide.
- **Layout shells**: `StudentShell` (bottom nav, 4 tabs) and `TrainerShell` (sidebar desktop / bottom nav mobile). Workout mode routes are OUTSIDE the shell (no bottom nav).
- **OnPush + signals**: Method calls in OnPush templates don't re-evaluate when signals change. Use `computed()` for derived state, not template methods.
- **Subscription cleanup**: Use `takeUntilDestroyed(inject(DestroyRef))` from `@angular/core/rxjs-interop` for subscriptions in `ngOnInit`.
- **Shared utils**: `shared/utils/display.ts` (GRADIENT_PAIRS, getInitials), `shared/utils/format-date.ts` (relativeDate, formatSpanishDate, parseLocalDate)
- **Tailwind 4 fonts**: Use `font-display` class (not `font-[var(--font-display)]`) — registered in `@theme`
- **Typography utilities**: `.text-display`, `.text-h1`, `.text-h2`, `.text-h3`, `.text-overline` defined in `styles.css`
- **Set type colors**: `--color-set-warmup`, `--color-set-effective`, `--color-set-dropset`, `--color-set-restpause`, `--color-set-amrap` tokens in `@theme`
- **Animations**: `.animate-fade-up`, `.animate-check`, `.animate-complete`, `.animate-badge`, `.stagger`, `.press`, `.skeleton` — all respect `prefers-reduced-motion`
- **Collapse/expand**: Use `.collapse-content` + `.expanded` parent class (CSS grid trick for height:auto transitions)
- **Hover token**: Use `hover:bg-primary-hover` (not `hover:bg-primary-dark`)
- **Select styling**: Use `.select-styled` class for dark-themed native selects (defined in `styles.css`)
- **Shared helpers**: `ProgramWeekHelper.CalculateCurrentWeek()` for week progress calculation — do not inline
- **Brand assets**: SVG logos in `kondix-web/public/`, brand guidelines in `kondix-web/brand-guidelines.md`

## Known Bugs in Prod (2026-04-23)

- **`Session already completed` exception** — `kondix-api` logs show repeated `System.InvalidOperationException: Session already completed` thrown from `ExceptionHandlerMiddleware`. Middleware chain: `CelvoGuardMiddleware` → `StudentContextMiddleware:42` → `CsrfValidationMiddleware:22`. Cause: middleware writing to response after it's already been flushed. Not fatal (endpoints return, logs show successful commands too), but spamming logs. Needs investigation.
- **Healthcheck fails** — container image lacks `curl`, so `curl -sf /api/v1/health` always fails. Container shows `unhealthy` despite working. Fix: add `RUN apt-get install -y curl` to Dockerfile OR switch healthcheck to `dotnet --list-runtimes`.

## Gotchas

- **Redis password in dev**: Docker compose Redis uses `password=dev`. Both `appsettings.json` (Gym API) and CelvoGuard need `"Redis": "localhost:6379,password=dev"`.
- **CelvoGuard app slug**: Frontend sends `X-App-Slug: 'kondix'` — the app in CelvoGuard DB must have slug `kondix` (not `gym`).
- **SetLog race condition**: Concurrent `POST /public/my/sets/update` calls can hit unique constraint `ix_set_logs_session_id_set_id`. Handler catches `DbUpdateException` and retries as update.
- **DateTimeOffset UTC in queries**: PostgreSQL requires offset 0 for timestamptz comparisons. Use `new DateTimeOffset(date, TimeSpan.Zero)`, not `DateTimeOffset.UtcNow.AddDays()`.
- **TrainerContextMiddleware + onboarding**: Unapproved trainers can access `/api/v1/onboarding/*` endpoints — middleware allows this via `isOnboarding` check.
- **Trainer onboarding flow**: Register → /onboarding/setup (public name + bio) → /onboarding/pending (await approval) → /trainer (after admin approves).
- **PR detection inline**: `POST /api/v1/public/my/sets/update` returns `{ setLog, newPr? }` — `DetectNewPRsCommand` is dispatched from `UpdateSetDataCommand` via `IMediator`. Detection failure is intentionally swallowed (toast missing > write loss). Only fires for `Completed=true` set logs.
- **CompleteSession is idempotent**: re-calls update mood/notes. (Mitigates the "Session already completed" middleware spam noted in Known Bugs above; v3 dropped the rotation-index advance since rotation logic is gone.)
- **Recovery is gated to Week-mode programs only (v3 Phase 5).** Numbered programs have no specific missed-day to recover — the home/calendar hide the recovery banner and grid for Numbered students. `WorkoutSession.IsRecovery` only affects how the calendar paints them and how the home-screen banner appears. The stale `RecoversSessionId` column is intentionally vestigial — XML-doc'd, not used in MVP.
- **Recovery model uses `RecoversPlannedDate: DateOnly?`** on `StartSessionCommand`, not `RecoversSessionId: Guid?` — there's no `WorkoutSession` row for a missed-but-never-started day. The "Recuperar" button navigates to `/workout/session/overview?sessionId=...&routineId=...&dayId=...` which short-circuits the `GET /next-workout` call.
- **Trainer ownership scoping is the most-frequently-missed Application-layer gate.** Every new MediatR command/query that takes a `Guid` resource id (programId, studentId, sessionId, etc.) MUST accept `TrainerId` and verify ownership at the top of the handler (`db.<Resource>.AnyAsync(r => r.Id == id && r.TrainerId == trainerId)` → throw `"<Resource> not found"`). Phase 3 leak (recent-feedback / mark-read) and Phase 5 leak (program week-overrides) were the same class of bug.
- **`kondix-videos` MinIO bucket still not provisioned in prod** (verified 2026-04-27) — YouTube embeds remain the only video source. `<kx-video-demo-overlay>` only handles YouTube; the "Ver demo" pill in the student logger is gated on `videoSource === 'YouTube' && videoUrl` for that reason.
- **Programs v3 destructive migration (`20260428201329_ProgramsV3Refactor`)** wipes `programs/program_routines/program_assignments/program_week_overrides/workout_sessions/set_logs/personal_records` on the next `dotnet ef database update`. Trainers + students + routines are preserved. Notify any test users before pulling the trigger; old programs are gone.
- **Programs v3 routes**: trainer creates via `<kx-create-program-modal>` from the program list (no `/programs/new` route — removed in Phase 4). The editor at `/trainer/programs/:id` (and `:id/edit` alias) loads `ProgramEditorPage`. Legacy `program-detail.ts` is on disk but unreachable.
- **Programs v3 invariants enforced server-side**: `Mode=Loop` ⇒ exactly 1 ProgramWeek; `ScheduleType` is immutable after create; `Publish` is one-way; assigning requires `IsPublished=true`.
- **Tailwind classes that DON'T exist** in `kondix-web/src/styles.css`: `btn-primary`/`btn-outline`/`btn-ghost`/`btn-sm`, `class="input"`, `bg-primary-subtle`, `scroll-thin`, `bg-bg-deep`. Inline the equivalent utility classes (matching `assign-routine-modal.ts` / `assign-program-modal.ts` patterns). The token `--color-primary-light: #2A0F14` IS defined and is the subtle variant.
- **CSS `var(--color-X)55` hex-alpha is invalid** — use `color-mix(in srgb, var(--color-X) 33%, transparent)` instead. Browser support fine for evergreen targets.
- **`Permissions.GymManage = "kondix:manage"`** is the only trainer permission constant; `Permissions.GymWorkout = "kondix:workout"` is the only end-user one. There is NO `kondix:programs:read|write` etc. — gate every new trainer endpoint on `GymManage` and rely on inline ownership scoping for resource-level isolation.
- **`ICelvoGymDbContext.cs` was renamed to `IKondixDbContext.cs` in v2 Phase 5** (interface name was always correct; just the file). Old historical migrations still reference `gym` schema in their snapshots — those are frozen, do not touch.
