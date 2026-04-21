# 07 — Trainer Catalog

**Role:** trainer
**Preconditions:** Trainer active on /trainer/catalog.
**Test:** [`specs/07-trainer-catalog.spec.ts`](../../kondix-web/e2e/specs/07-trainer-catalog.spec.ts)

## Flow: list + filter

```mermaid
flowchart TD
  CA1[Visit /trainer/catalog] --> CA2[[GET /api/v1/catalog]]
  CA2 --> CA3{Any exercises?}
  CA3 -- No --> CA4[Render empty state Tu biblioteca está vacía]
  CA3 -- Yes --> CA5[Render grid of exercise cards]
  CA5 --> CA6[Click muscle-group chip]
  CA6 --> CA7[Client-side filter by muscleGroup substring]
```

## Flow: create exercise

```mermaid
flowchart TD
  CA10[Click + Nuevo ejercicio] --> CA11[Form expands in create mode]
  CA11 --> CA12[Fill name + muscleGroup + videoUrl + notes]
  CA12 --> CA13[Click Crear ejercicio]
  CA13 --> CA14[[POST /api/v1/catalog]]
  CA14 --> CA15{Success?}
  CA15 -- Yes --> CA16[Form collapses; list reloads; toast success]
  CA15 -- No --> CA17[Toast error]
```

## Flow: edit exercise

```mermaid
flowchart TD
  CA20[Click exercise card] --> CA21[Form opens in edit mode with fields populated]
  CA21 --> CA22[Modify fields]
  CA22 --> CA23[Click Guardar cambios]
  CA23 --> CA24[[PUT /api/v1/catalog/:id]]
  CA24 --> CA25[Form collapses; list reloads]
```

## Flow: delete exercise

```mermaid
flowchart TD
  CA30[Hover card] --> CA31[Click Eliminar]
  CA31 --> CA32[Confirm dialog appears]
  CA32 --> CA33[Click Eliminar in dialog]
  CA33 --> CA34[[DELETE /api/v1/catalog/:id]]
  CA34 --> CA35[Card removed; toast success]
```

## Nodes

| ID   | Type     | Description                                   |
|------|----------|-----------------------------------------------|
| CA1  | Action   | Navigate to `/trainer/catalog`                |
| CA2  | API      | `GET /api/v1/catalog`                         |
| CA3  | Decision | Trainer has any exercises                     |
| CA4  | State    | Empty state rendered                          |
| CA5  | State    | Exercise grid rendered                        |
| CA6  | Action   | Click a muscle-group chip                     |
| CA7  | State    | Grid filtered client-side                     |
| CA10 | Action   | Click "+ Nuevo ejercicio"                     |
| CA11 | State    | Form expanded (create mode)                   |
| CA12 | Action   | Fill form fields                              |
| CA13 | Action   | Click "Crear ejercicio"                       |
| CA14 | API      | `POST /api/v1/catalog`                        |
| CA15 | Decision | HTTP success                                  |
| CA16 | State    | Form collapses; grid refetched                |
| CA17 | State    | Toast error                                   |
| CA20 | Action   | Click existing exercise card                  |
| CA21 | State    | Form opened in edit mode, fields prefilled    |
| CA22 | Action   | Modify any field                              |
| CA23 | Action   | Click "Guardar cambios"                       |
| CA24 | API      | `PUT /api/v1/catalog/:id`                     |
| CA25 | State    | Form collapses; grid refetched                |
| CA30 | Action   | Hover over a card                             |
| CA31 | Action   | Click the Eliminar hover button               |
| CA32 | State    | Confirm dialog open                           |
| CA33 | Action   | Click "Eliminar" inside dialog                |
| CA34 | API      | `DELETE /api/v1/catalog/:id`                  |
| CA35 | State    | Card removed                                  |
