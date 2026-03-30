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
