# 04 — Trainer Routines

**Role:** trainer (operator)
**Preconditions:** Trainer registered, onboarding complete, approved. Cookies set.
**Test:** [`specs/04-trainer-routines.spec.ts`](../../kondix-web/e2e/specs/04-trainer-routines.spec.ts)

## Flow: list + filter

```mermaid
flowchart TD
  RT1[Visit /trainer/routines] --> RT2[[GET /api/v1/routines]]
  RT2 --> RT3{Any routines?}
  RT3 -- No --> RT4[Show empty state with '+ Crear rutina' CTA]
  RT3 -- Yes --> RT5[Render category chips + routine cards]
  RT5 --> RT6[Click chip 'Hipertrofia']
  RT6 --> RT7[Client-side filter narrows cards]
```

## Flow: create via 4-step wizard

```mermaid
flowchart TD
  RT10[Click '+ Nueva rutina' -> /trainer/routines/new] --> RT11[Step 1: type name]
  RT11 --> RT12[Click Siguiente]
  RT12 --> RT13[Step 2: type day name 'Día 1']
  RT13 --> RT14[Click Siguiente]
  RT14 --> RT15[Step 3: expand exercise 0-0]
  RT15 --> RT16[Type exercise name + reps + weight]
  RT16 --> RT17[Click Siguiente]
  RT17 --> RT18[Step 4: review summary]
  RT18 --> RT19[Click Guardar]
  RT19 --> RT20[[POST /api/v1/routines]]
  RT20 --> RT21[Toast 'Rutina creada' + navigate /trainer/routines]
  RT21 --> RT22[New card appears in list]
```

## Flow: view detail

```mermaid
flowchart TD
  RT30[Click card in list] --> RT31[[GET /api/v1/routines/id]]
  RT31 --> RT32[Render header + day accordion]
  RT32 --> RT33[Click day toggle]
  RT33 --> RT34[Day content expands with exercises + sets]
```

## Flow: edit (full replace)

```mermaid
flowchart TD
  RT40[Open detail] --> RT41[Click Editar -> /trainer/routines/id/edit]
  RT41 --> RT42[Wizard loads with populated data]
  RT42 --> RT43[Change name]
  RT43 --> RT44[Advance to step 4]
  RT44 --> RT45[Click Guardar]
  RT45 --> RT46[[PUT /api/v1/routines/id]]
  RT46 --> RT47[Toast 'Rutina actualizada' + navigate /trainer/routines]
  RT47 --> RT48[Card in list reflects new name]
```

## Flow: delete

```mermaid
flowchart TD
  RT50[List view] --> RT51[Click card menu '...']
  RT51 --> RT52[Click Eliminar]
  RT52 --> RT53[Confirm dialog opens]
  RT53 --> RT54{Confirm?}
  RT54 -- Yes --> RT55[[DELETE /api/v1/routines/id]]
  RT55 --> RT56[Toast 'Rutina eliminada' + card disappears]
  RT54 -- No --> RT57[Dialog closes, list unchanged]
```

## Nodes

| ID       | Type     | Description                                        |
|----------|----------|----------------------------------------------------|
| RT1      | Action   | Navigate to `/trainer/routines`                    |
| RT2      | API      | `GET /api/v1/routines`                             |
| RT3      | Decision | List empty?                                        |
| RT4      | State    | Empty-state with '+ Crear rutina' link             |
| RT5      | State    | List rendered with category chips                  |
| RT6-RT7  | Action   | Chip click → client-side filter                    |
| RT10-RT22| Action   | 4-step wizard create happy path                    |
| RT30-RT34| Action   | Detail view with expandable day accordion          |
| RT40-RT48| Action   | Edit flow: wizard pre-populated, full-replace save |
| RT50-RT57| Action   | Delete with confirm dialog                         |

## Notes

- Wizard validates name non-empty to advance from step 1 (Siguiente is disabled). Not explicitly asserted in Phase 3b — happy path always fills it.
- Step 2 requires every day to have a non-empty name; the spec sets it.
- Exercise catalog autocomplete (dropdown on exercise name input) fires on `input`/`focus` but is ignored by the spec — we type a free-form name.
- Superset/Triset/Circuit group types and DropSet/RestPause/AMRAP set types not exercised; happy path uses `Single` group + `Effective` set.
- Video upload (MinIO) not exercised in Phase 3b — deferred.
- Usage banner ("rutina con sesiones") not exercised — requires seeded sessions; Phase 3c or later.
