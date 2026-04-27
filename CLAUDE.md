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
- **Program structure**: Program → ProgramRoutine (ordered) → Routine
- **Assignment model**: Programs are the assignment unit (not individual routines)
- **Assignment modes**: Rotation (routines cycle A→B→C→A) or Fixed (routine mapped to specific weekdays)
- **Program lifecycle**: Active → Completed/Cancelled, with duration in weeks and training day schedule
- **RotationIndex**: Tracks which routine is next in rotation mode, incremented on session complete
- **Set types**: Warmup, Effective, DropSet, RestPause, AMRAP
- **Exercise grouping**: Single, Superset, Triset, Circuit
- **Videos**: YouTube embed or trainer upload (MinIO bucket `kondix-videos`)
- **Routine updates**: Full replace (delete old days/exercises, recreate)

## API Routes

- Trainer (operator): `/api/v1/routines`, `/api/v1/students`, `/api/v1/programs`, `/api/v1/program-assignments`
- Student (end-user): `/api/v1/public/my/program`, `/api/v1/public/my/next-workout`, `/api/v1/public/my/routines/{id}`, `/api/v1/public/my/sets/*`
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
- **CompleteSession is idempotent**: re-calls update mood/notes without re-advancing rotation. Mitigates the "Session already completed" middleware spam noted in Known Bugs above.
- **Recovery sessions advance the rotation index** the same as normal sessions. `WorkoutSession.IsRecovery` (Phase 4) only affects how the calendar paints them and how the home-screen recovery banner appears. The stale `RecoversSessionId` column is intentionally vestigial — XML-doc'd, not used in MVP.
- **Recovery model uses `RecoversPlannedDate: DateOnly?`** on `StartSessionCommand`, not `RecoversSessionId: Guid?` — there's no `WorkoutSession` row for a missed-but-never-started day. The "Recuperar" button navigates to `/workout/session/overview?sessionId=...&routineId=...&dayId=...` which short-circuits the `GET /next-workout` call.
- **Trainer ownership scoping is the most-frequently-missed Application-layer gate.** Every new MediatR command/query that takes a `Guid` resource id (programId, studentId, sessionId, etc.) MUST accept `TrainerId` and verify ownership at the top of the handler (`db.<Resource>.AnyAsync(r => r.Id == id && r.TrainerId == trainerId)` → throw `"<Resource> not found"`). Phase 3 leak (recent-feedback / mark-read) and Phase 5 leak (program week-overrides) were the same class of bug.
- **`kondix-videos` MinIO bucket still not provisioned in prod** (verified 2026-04-27) — YouTube embeds remain the only video source. `<kx-video-demo-overlay>` only handles YouTube; the "Ver demo" pill in the student logger is gated on `videoSource === 'YouTube' && videoUrl` for that reason.
- **`@angular/cdk` (Phase 5)** lives in the lazy `program-form` chunk only (~16.7 kB transfer). Don't import `DragDropModule` in eagerly-loaded shells.
- **Three v2 migrations pending on prod (as of 2026-04-27)**: `20260426234130_AddSessionAndSetFeedbackFields`, `20260427011850_AddSessionRecoveryFields`, `20260427024952_AddProgramWeekOverrides`. All additive, no backfill — apply together on next `dotnet ef database update`.
- **Per-week notes (Phase 5)**: `GET/PUT /api/v1/programs/{id}/week-overrides[/{weekIndex}]`. Empty/whitespace `notes` deletes the row server-side. Frontend `program-form.ts` PUTs on blur with a per-week sequence (`overrideSeq`) to suppress out-of-order responses. The CDK weekly grid is a planning visualization only — `ProgramRoutine[]` persistence stays in the existing rotation-slots editor.
- **`Permissions.GymManage = "kondix:manage"`** is the only trainer permission constant; `Permissions.GymWorkout = "kondix:workout"` is the only end-user one. There is NO `kondix:programs:read|write` etc. — gate every new trainer endpoint on `GymManage` and rely on inline ownership scoping for resource-level isolation.
- **`ICelvoGymDbContext.cs` was renamed to `IKondixDbContext.cs` in v2 Phase 5** (interface name was always correct; just the file). Old historical migrations still reference `gym` schema in their snapshots — those are frozen, do not touch.
