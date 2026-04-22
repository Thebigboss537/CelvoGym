# 08 — Invite Acceptance

**Role:** public → student
**Preconditions:** Approved/active trainer exists; they POSTed to `/api/v1/students/invite` which produced an invite token delivered via email.
**Test:** [`specs/08-invite-acceptance.spec.ts`](../../kondix-web/e2e/specs/08-invite-acceptance.spec.ts)

## Flow: open invite link

```mermaid
flowchart TD
  IN1[Visit /invite?token=...] --> IN2[[GET /api/v1/public/invite/:token]]
  IN2 --> IN3{Token valid?}
  IN3 -- No --> IN4[Show "invitación no válida" + link to login]
  IN3 -- Yes --> IN5[Render form with trainerName + readonly email]
```

## Flow: accept invite

```mermaid
flowchart TD
  IN10[Fill displayName + password] --> IN11[Click Aceptar invitación]
  IN11 --> IN12[[POST guard/enduser/register]]
  IN12 --> IN13{Success?}
  IN13 -- No --> IN14[Show guard error]
  IN13 -- Yes --> IN15[[POST /api/v1/public/invite/:token/accept]]
  IN15 --> IN16{Success?}
  IN16 -- No --> IN14
  IN16 -- Yes --> IN17[Show success panel]
  IN17 --> IN18[Click "Ver mis rutinas"]
  IN18 --> IN19[Navigate /workout]
```

## Nodes

| ID   | Type     | Description                                       |
|------|----------|---------------------------------------------------|
| IN1  | Action   | Navigate to `/invite?token=...`                   |
| IN2  | API      | `GET /api/v1/public/invite/:token`                |
| IN3  | Decision | Token valid (not expired, not used)               |
| IN4  | State    | Error panel with "invitación no válida"           |
| IN5  | State    | Form rendered with trainer name + readonly email  |
| IN10 | Action   | Fill displayName + password                       |
| IN11 | Action   | Click "Aceptar invitación"                        |
| IN12 | API      | `POST {guardUrl}/api/v1/enduser/register`         |
| IN13 | Decision | HTTP success                                      |
| IN14 | State    | Error shown                                       |
| IN15 | API      | `POST /api/v1/public/invite/:token/accept`        |
| IN16 | Decision | HTTP success                                      |
| IN17 | State    | Success panel: "ya estás dentro"                  |
| IN18 | Action   | Click "Ver mis rutinas"                           |
| IN19 | Action   | Navigate `/workout`                               |
