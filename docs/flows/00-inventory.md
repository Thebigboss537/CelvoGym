# Flow Inventory

Matrix of every user-facing surface in Kondix, grouped by role. Each row
becomes (eventually) a diagram in `docs/flows/` and a spec in
`kondix-web/e2e/specs/`. Flows marked **Pending** are not yet authored.

## Legend

- **Role:** public | trainer | student | onboarding | admin (cross-app)
- **Flow file:** path under `docs/flows/`
- **Spec file:** path under `kondix-web/e2e/specs/`

## Public & Auth

| Flow                                   | Role      | Flow file          | Spec file               | Status  |
|----------------------------------------|-----------|--------------------|-------------------------|---------|
| Trainer registration                   | public    | `01-auth.md`       | `01-auth.spec.ts`       | Done |
| Trainer login                          | public    | `01-auth.md`       | `01-auth.spec.ts`       | Done |
| Student login (tenant-scoped via `?t=`)| public    | `01-auth.md`       | `01-auth.spec.ts`       | Done |
| Logout (trainer + student)             | auth      | `01-auth.md`       | `01-auth.spec.ts`       | Done |
| Protected route redirect to /auth/login| auth      | `01-auth.md`       | `01-auth.spec.ts`       | Done |
| Token refresh (transparent)            | auth      | `01-auth.md`       | `01-auth.spec.ts`       | Done |

## Onboarding (Trainer)

| Flow                                   | Role        | Flow file                  | Spec file                    | Status  |
|----------------------------------------|-------------|----------------------------|------------------------------|---------|
| Trainer fills setup (display name, bio)| onboarding  | `02-onboarding-trainer.md` | `02-onboarding-trainer.spec.ts` | Done |
| Trainer sees pending-approval screen   | onboarding  | `02-onboarding-trainer.md` | `02-onboarding-trainer.spec.ts` | Done |
| Trainer becomes active after approval  | onboarding  | `02-onboarding-trainer.md` | `02-onboarding-trainer.spec.ts` | Done |

## Trainer Area

| Flow                                        | Role     | Flow file                | Spec file                     | Status  |
|---------------------------------------------|----------|--------------------------|-------------------------------|---------|
| Dashboard: view metrics + CTAs              | trainer  | `03-trainer-dashboard.md`| `03-trainer-dashboard.spec.ts`| Done |
| Routines: list + filter                     | trainer  | `04-trainer-routines.md` | `04-trainer-routines.spec.ts` | Done |
| Routines: create via wizard (days + exercises + sets) | trainer  | `04-trainer-routines.md` | `04-trainer-routines.spec.ts` | Done |
| Routines: view detail                       | trainer  | `04-trainer-routines.md` | `04-trainer-routines.spec.ts` | Done |
| Routines: edit (full replace)               | trainer  | `04-trainer-routines.md` | `04-trainer-routines.spec.ts` | Done |
| Routines: delete + warn if in use           | trainer  | `04-trainer-routines.md` | `04-trainer-routines.spec.ts` | Done |
| Programs: list                              | trainer  | `05-trainer-programs.md` | `05-trainer-programs.spec.ts` | Pending |
| Programs: create (ordered routines)         | trainer  | `05-trainer-programs.md` | `05-trainer-programs.spec.ts` | Pending |
| Programs: edit + warn if active assignments | trainer  | `05-trainer-programs.md` | `05-trainer-programs.spec.ts` | Pending |
| Programs: assign to student                 | trainer  | `05-trainer-programs.md` | `05-trainer-programs.spec.ts` | Pending |
| Students: list                              | trainer  | `06-trainer-students.md` | `06-trainer-students.spec.ts` | Pending |
| Students: invite via email                  | trainer  | `06-trainer-students.md` | `06-trainer-students.spec.ts` | Pending |
| Students: invite via QR                     | trainer  | `06-trainer-students.md` | `06-trainer-students.spec.ts` | Pending |
| Students: view detail + history             | trainer  | `06-trainer-students.md` | `06-trainer-students.spec.ts` | Pending |
| Students: cancel active program             | trainer  | `06-trainer-students.md` | `06-trainer-students.spec.ts` | Pending |
| Catalog: list + add exercise                | trainer  | `07-trainer-catalog.md`  | `07-trainer-catalog.spec.ts`  | Done |

## Invite Acceptance (Student)

| Flow                                   | Role     | Flow file               | Spec file                  | Status  |
|----------------------------------------|----------|-------------------------|----------------------------|---------|
| Student opens invite link              | public   | `08-invite-acceptance.md` | `08-invite-acceptance.spec.ts` | Done |
| Student creates end-user account       | public   | `08-invite-acceptance.md` | `08-invite-acceptance.spec.ts` | Done |
| Student lands on `/workout/home`       | student  | `08-invite-acceptance.md` | `08-invite-acceptance.spec.ts` | Done |

## Student Area

| Flow                                     | Role     | Flow file                      | Spec file                         | Status  |
|------------------------------------------|----------|--------------------------------|-----------------------------------|---------|
| Home: see next workout + stats           | student  | `09-student-home.md`           | `09-student-home.spec.ts`         | Pending |
| Calendar: month view                     | student  | `10-student-calendar.md`       | `10-student-calendar.spec.ts`     | Pending |
| Calendar: tap day → day-detail           | student  | `10-student-calendar.md`       | `10-student-calendar.spec.ts`     | Pending |
| Progress: charts                         | student  | `11-student-progress.md`       | `11-student-progress.spec.ts`     | Pending |
| Profile: view + logout                   | student  | `12-student-profile.md`        | `12-student-profile.spec.ts`      | Pending |
| Workout: overview screen (start session) | student  | `13-student-workout-mode.md`   | `13-student-workout-mode.spec.ts` | Pending |
| Workout: log sets (weight/reps/RPE)      | student  | `13-student-workout-mode.md`   | `13-student-workout-mode.spec.ts` | Pending |
| Workout: rest timer                      | student  | `13-student-workout-mode.md`   | `13-student-workout-mode.spec.ts` | Pending |
| Workout: complete + rotation advances    | student  | `13-student-workout-mode.md`   | `13-student-workout-mode.spec.ts` | Pending |
| Comments: student reads comment from trainer | student  | `14-student-comments.md`   | `14-student-comments.spec.ts`     | Pending |
| Comments: student replies                | student  | `14-student-comments.md`       | `14-student-comments.spec.ts`     | Pending |

## Cross-App

| Flow                                        | Role            | Flow file                | Spec file                     | Status  |
|---------------------------------------------|-----------------|--------------------------|-------------------------------|---------|
| Admin approves trainer in CelvoAdmin        | admin cross-app | `99-admin-approval.md`   | `99-admin-approval.spec.ts`   | Pending |

## Build order

1. This plan: inventory + infra + `01-auth` (planned).
2. Next plan: `02-onboarding-trainer` + `08-invite-acceptance`.
3. Trainer flows (03–07), one plan.
4. Student flows (09–14), one plan.
5. Cross-app admin approval (99), one plan (requires CelvoAdmin running).
