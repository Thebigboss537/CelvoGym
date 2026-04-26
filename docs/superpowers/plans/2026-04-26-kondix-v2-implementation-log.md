# KONDIX v2 — Implementation Log

> Live log of issues, decisions, deviations, and gotchas encountered while executing the consolidated plan at `docs/superpowers/plans/2026-04-26-kondix-v2-implementation.md`. Updated during execution. Commits at end of each phase.

## Conventions

- **Tarea:** identificador del plan (e.g., `Task 1.1`).
- **Tipo:** `incident` | `deviation` | `decision` | `note`.
- **Estado:** ¿se resolvió en esta sesión, queda pendiente, o se diferió a una fase posterior?

## Phase 1 — Foundation

_Branch:_ `feat/v2-phase-1`
_Started:_ 2026-04-26

| Tarea | Tipo | Descripción | Resolución |
|---|---|---|---|
| Task 1.1 | decision | Plan asked for Vitest util tests, but the project uses Karma + Jasmine via `ng test` (the `frontend-angular.md` rule mentioning Vitest is aspirational; vitest is not in `devDependencies`). Spec was written with Jasmine globals so `npm test` works on a clean clone. | Resolved in commit `c41c3b34`; future Phase 1+ specs follow the same pattern until vitest is wired up properly as its own task. |
| Task 1.1 | deviation | Plan listed 5 vitest cases for `youtubeEmbedUrl`. Added 2 more: one for `youtube.com/shorts/` (preserves prior inline behavior in `extractYouTubeId`) and one for `watch?v=` URLs with leading query params (covers YouTube "Share" output). | Resolved (commits `dbb01109` + post-fix). |
| Task 1.1 | deviation | Plan said replace the iframe `[src]` with `youtubeEmbedUrl(url)` directly via `DomSanitizer`. Used a `computed<SafeResourceUrl \| null>` instead, per the project's documented OnPush+signals convention. Added an `@if (embedUrl())` guard so non-matching URLs don't render an empty-src iframe. | Resolved (commits `a6d24b8b` + post-fix). |
| Task 1.5 | deviation | Plan said `size="lg"` (72px) for catalog cards. Reviewer flagged this produces a small square inside a large card, breaking the v2 handoff §4.3 ("Card con foto cuadrada 1:1" — full card width). Extended `<kx-exercise-thumb>` with a `'fill'` size variant (`w-full aspect-square`) and used it in the catalog grid. Other consumers (pickers, list rows, trainer timeline) keep the fixed pixel sizes. | Resolved (post-`79052419` commit). |

---

**Phase 1 closeout (2026-04-26):**
- 7 tasks complete in 12 commits across `feat/v2-phase-1`.
- 4 deviations logged above (all approved by per-task and final phase reviews).
- Tests green: .NET 16 unit + 8 arch + 5 integration; Angular Karma 7 (youtube) + 3 (toast.showPR after this commit) = 39 specs.
- Final phase review flagged 2 carryover items to address opportunistically: extract `MUSCLE_TOKEN` to a shared util when a second consumer needs it (Phase 3+); migrate `[class.X]` toast bindings to ternary string form (Phase 6).
- Branch ready to merge to main with `--no-ff`.

## Phase 1.5 — Trainer approval & auto-seed

_Branch:_ `feat/v2-phase-1-5`
_Started:_ 2026-04-26

| Tarea | Tipo | Descripción | Resolución |
|---|---|---|---|
| Task 1.5.2 | deviation | Plan's test fixture used `Trainer { UserId = ... }`; the actual entity field is `CelvoGuardUserId`. Tests adapted; entity untouched. | Resolved in commit `18fb1723`. |
| Task 1.5.3 | deviation | Plan's `PendingTrainerDto` had `Email: string`, but `Trainer` has NO `Email` field — emails live cross-schema in CelvoGuard's user record. DTO replaced `Email` with `CelvoGuardUserId: Guid` so CelvoAdmin (which has read access to the celvoguard schema) cross-resolves emails locally. | Resolved in commit `95657334`. Downstream impact: CelvoAdmin's spec/plan must include the join. |
| Task 1.5.4 | incident | Plan defect: `Program.cs` middleware bypass excluded `/api/v1/internal/test` only; `/api/v1/internal/trainers` was unreachable in prod (would 401 from `CelvoGuardMiddleware` before `AuthorizeInternal()` ran). Caught by code review. Fix widened the bypass to `/api/v1/internal` (covers both controllers and any future internal endpoints). | Resolved in commit `9e8e8da8`. |
| Task 1.5.4 | decision | "Trainer not found" magic string was duplicated between handler `throw` and controller `catch when`. Extracted to `ApproveTrainerCommand.TrainerNotFoundMessage` const referenced from both sides. Test keeps the literal `WithMessage(...)` assertion (proves the public contract). | Resolved in commit `9e8e8da8`. |
| Task 1.5.5 | incident | Two test classes both using `WebApplicationFactory<Program>` raced on `HostFactoryResolver` under xUnit's default cross-class parallelism, deterministically failing `Approve_AlreadyApproved_IsNoOp`. Fix added assembly-level `[CollectionBehavior(DisableTestParallelization = true)]` in a new `tests/Kondix.IntegrationTests/AssemblyInfo.cs` (additive — doesn't touch existing test files). | Resolved in commit `0692592f`. Follow-up: switch to `[Collection]` attributes if a third factory is ever added. |
| Task 1.5.5 | deviation | Plan listed only 4 integration tests; reviewer flagged that the `ListPending` happy path was uncovered (only the 401 path was tested). Added 5th test `ListPending_WithKey_ReturnsOnlyUnapproved`. Also tightened seed-count assertion from `BeGreaterThan(40)` to `BeInRange(40, 100)` to catch accidental duplication. | Resolved in commit `575a470e`. |
| Task 1.5.6 | note | Plan referenced `setup/03-deploy-checklist.md`; actual file is `setup/04-deploy-checklist.md` (slot 03 is `minio-bucket.sh`). Implementer used the right file. | Resolved in commit `2fc550ce`. Plan path reference is stale; fix opportunistically. |

---

**Phase 1.5 closeout (2026-04-26):**
- 6 tasks complete in 9 commits across `feat/v2-phase-1-5`.
- 7 deviations logged above (all approved by per-task and final phase reviews).
- Tests green: .NET 19 unit + 8 arch + 9 integration (was 5; added 4 in Task 1.5.5) = 36 backend specs. Frontend test counts unchanged (this phase is backend-only).
- New endpoints reachable: `POST /api/v1/internal/trainers/{id}/approve` and `GET /api/v1/internal/trainers/pending`, both gated by `X-Internal-Key` against `Internal:ApiKey` config (env var `Internal__ApiKey` in prod).
- Auto-seed wired: `ApproveTrainerCommand` dispatches `SeedCatalogCommand` on first approval; idempotent on re-call (no double-seed).
- CelvoAdmin-side work (UI + proxy controller) is OUT OF SCOPE for this plan. The CelvoAdmin spec/plan in its own repo must consume `Internal__ApiKey` as `Kondix__InternalApiKey` and resolve emails by joining `celvoguard.users` on the returned `CelvoGuardUserId`.
- Branch ready to merge to main with `--no-ff`.

## Phase 2 — Video demo overlay

_Branch:_ `feat/v2-phase-2`
_Started:_ 2026-04-26

| Tarea | Tipo | Descripción | Resolución |
|---|---|---|---|
| Task 2.1 | decision | Tightened backdrop click handler to compare `event.target === event.currentTarget` so events bubbling from the inner iframe (which can vary across browsers) don't accidentally close the overlay. | Resolved in commit `1c8a6e37`. |
| Task 2.2 | deviation | Plan said gate the "Ver demo" pill on `exercise.videoUrl` only. The overlay only handles YouTube URLs — exposing the pill for `videoSource === 'Upload'` would render "No se pudo cargar el vídeo." Tightened the gate to `videoSource === 'YouTube' && videoUrl` so the surface matches actual capability. Latent regression — Upload not enabled in prod today (MinIO bucket `kondix-videos` not provisioned). | Resolved in commit (post-`f53150ea`). |

