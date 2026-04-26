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
- `<kx-set-row>` — Set logging row with inputs (inputs: setNumber, setType, state, kg, reps, rpe)
- `<kx-rest-timer>` — Countdown rest timer (inputs: durationSeconds, active; outputs: skip, finished)
- `<kx-day-cell>` — Calendar day cell with states (inputs: day, state; outputs: select)
- `<kx-wizard-stepper>` — Wizard step indicator (inputs: currentStep, totalSteps)
- `<kx-student-card>` — Student card with avatar and status (inputs: name, initials, status, statusText)
- `<kx-timeline>` — Vertical timeline with colored dots (inputs: items[]{color, title, subtitle})

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
