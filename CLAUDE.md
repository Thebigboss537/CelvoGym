# CelvoGym

Gym training management app — part of the Celvo ecosystem.

See `../CLAUDE.md` for ecosystem-wide conventions, auth flow, and infrastructure details.

## What This App Does

Trainers create workout routines and assign them to students. Students follow routines, log progress (weight/reps/RPE per set), and communicate with their trainer via comments.

## Architecture

- **Backend**: .NET 10, Clean Architecture (Domain → Application → Infrastructure → Api)
- **Frontend**: Angular SPA (`celvogym-web/`), Tailwind CSS, dark theme
- **Auth**: CelvoGuard (trainers = operators, students = end-users, both email+password)
- **Database**: PostgreSQL schema `gym` in shared `celvo` database
- **Domain**: `gym.celvo.dev`

## Commands

```bash
# Backend
dotnet build CelvoGym.slnx
dotnet run --project src/CelvoGym.Api

# Frontend
cd celvogym-web && npm install && npx ng serve

# Dev infrastructure
docker compose up -d
```

## Key Design Decisions

- **Tenancy**: Each trainer = 1 tenant (no gym/company concept)
- **Trainer registration**: Requires admin approval (`IsApproved` flag)
- **Student onboarding**: Trainer invites via email or QR code
- **Trainer-Student**: M:N junction table, 1:1 enforced in business logic for MVP
- **Routine structure**: Routine → Day → ExerciseGroup → Exercise → ExerciseSet
- **Set types**: Warmup, Effective, DropSet, RestPause, AMRAP
- **Exercise grouping**: Single, Superset, Triset, Circuit
- **Videos**: YouTube embed or trainer upload (MinIO bucket `celvogym-videos`)
- **Routine updates**: Full replace (delete old days/exercises, recreate)

## API Routes

- Trainer (operator): `/api/v1/routines`, `/api/v1/students`, `/api/v1/assignments`
- Student (end-user): `/api/v1/public/my/routines`, `/api/v1/public/my/sets/*`
- Public: `/api/v1/health`, `/api/v1/public/invite/{token}`

## Design Context

### Brand Identity
- **Logo:** "The Lift" — chevron (progress) + bar (strength), stroke-based SVG mark
- **Primary color:** CelvoGym Crimson `#E62639` (HSL 354, 79%, 53%)
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

### Reusable Components (`celvogym-web/src/app/shared/ui/`)
- `<cg-logo>` — Logo mark + wordmark (inputs: size, showText, href)

Full design context: `celvogym-web/.impeccable.md`
