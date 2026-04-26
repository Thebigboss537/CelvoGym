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
| Task 1.1 | decision | Plan asked for Vitest util tests, but the project uses Karma + Jasmine via `ng test` (the `frontend-angular.md` rule mentioning Vitest is aspirational; vitest is not in `devDependencies`). Spec was written with Jasmine globals so `npm test` works on a clean clone. | Resolved in commit (post-`dbb01109`); future Phase 1+ specs follow the same pattern until vitest is wired up properly as its own task. |
| Task 1.1 | deviation | Plan listed 5 vitest cases for `youtubeEmbedUrl`. Added 2 more: one for `youtube.com/shorts/` (preserves prior inline behavior in `extractYouTubeId`) and one for `watch?v=` URLs with leading query params (covers YouTube "Share" output). | Resolved (commits `dbb01109` + post-fix). |
| Task 1.1 | deviation | Plan said replace the iframe `[src]` with `youtubeEmbedUrl(url)` directly via `DomSanitizer`. Used a `computed<SafeResourceUrl \| null>` instead, per the project's documented OnPush+signals convention. Added an `@if (embedUrl())` guard so non-matching URLs don't render an empty-src iframe. | Resolved (commits `a6d24b8b` + post-fix). |

