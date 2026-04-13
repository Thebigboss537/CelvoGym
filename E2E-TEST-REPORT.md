# Reporte E2E Testing - CelvoGym

**Fecha:** 5-6 de abril de 2026  
**Entorno:** Produccion (`gym.celvo.dev`)  
**Metodo:** Playwright MCP (navegacion manual automatizada)  
**Cuentas de prueba:**
- Trainer: `coachtest.e2e@celvo.dev` / `TestE2E2026!`
- Student: `alumno2.e2e@celvo.dev` / `AlumnoE2E2026!`
- TenantId: `7e8b0e87-3abc-4d20-af00-6d251884fb1b`

---

## Re-test (6 abril 2026)

Tras las correcciones aplicadas en el commit `40fe9f5`, se re-testearon los 4 bugs y el warning.

| Bug | Estado | Detalle |
|-----|--------|---------|
| BUG-001: Token con `/` | **CORREGIDO** | Tokens ahora usan base64url (`_` en vez de `/`). Probados 2 tokens, ambos GET /invite/token → 200 |
| BUG-002: Progreso 0% | **CORREGIDO** | Progreso muestra 100% tras completar sets. Badge LISTO visible. Drop set también togglea correctamente |
| BUG-003: CSRF expirado | **NO TESTEABLE** | Requiere esperar 15+ min para JWT expire. Pendiente para sesion dedicada |
| BUG-004: Rate limit ingles | **NO TESTEABLE** | Requiere trigger de rate limit que bloquea la sesion |
| WARN-001: autocomplete password | **PARCIAL** | Warning de `current-password` eliminado. Persiste: `autocomplete="username"` en inputs de email |

### Nuevos hallazgos del re-test

| Issue | Tipo | Detalle |
|-------|------|---------|
| `apple-mobile-web-app-capable` deprecado | Warning | Aparece en todas las paginas. Chrome recomienda usar `mobile-web-app-capable` en su lugar |
| `autocomplete="username"` faltante | Warning DOM | Inputs de email en login, register e invite no tienen `autocomplete="username"` |
| 504 Gateway Timeout en enduser/login | Causado por deploy | CelvoGuard se reinicio (SIGKILL/137) durante el deploy de las correcciones. El login cayo justo en medio del restart. **No es bug de la app**, es downtime momentaneo de deploy. Sin embargo, el frontend muestra "Failed to execute 'json' on 'Response': Unexpected end of JSON input" en vez de un mensaje amigable — eso si es un **bug menor del manejo de errores** al parsear un 504 con body vacio |
| Nota fijada desaparecio | Observacion | La nota "Alumno nuevo, empezar con cargas bajas" ya no aparece en la lista de alumnos (antes estaba fijada) |
| nginx MIME types rotos | Bug de deploy | El deploy del fix rompio los MIME types (Content-Type: application/octet-stream). Causa: bloque `types {}` en nginx.conf reemplazaba los defaults. Fix aplicado: `include /etc/nginx/mime.types;` (commit `27a5e31`) |

---

## Resumen ejecutivo (test original 5 abril)

| Area | Estado | Bugs |
|------|--------|------|
| Auth (login/register/logout) | OK | 1 menor |
| Dashboard trainer | OK | - |
| Catalogo de ejercicios | OK | - |
| Rutinas (CRUD completo) | OK | - |
| Programas (CRUD + asignacion) | OK | - |
| Alumnos (invitar, notas, QR) | OK | 1 critico |
| Invitacion de alumno | Parcial | 1 critico |
| Calendario del alumno | OK | - |
| Workout (sesion de entrenamiento) | Parcial | 2 medios |
| Records personales | OK | - |
| Body tracking | OK | - |

**Total:** 4 bugs encontrados (1 critico, 2 medios, 1 menor)

---

## Bugs encontrados

### BUG-001: Token de invitacion con `/` rompe la URL [CRITICO]

**Donde:** Flujo de invitacion de alumno  
**Pasos para reproducir:**
1. Trainer va a `/trainer/students` y envia invitacion
2. El backend genera un token base64 que puede contener `/` (ej: `GyzOH1GJ99K0KakaxCtjnoD7/3F8TFKs9K1l5fEGbO4=`)
3. El frontend construye la URL: `/invite?token=GyzOH1GJ99K0KakaxCtjnoD7%2F3F8TFKs9K1l5fEGbO4%3D`
4. Al navegar, el componente `AcceptInvite` extrae el token del query param
5. Hace `GET /api/v1/public/invite/{token}` donde el `/` se decodifica como path separator
6. Request real: `GET /api/v1/public/invite/GyzOH1GJ99K0KakaxCtjnoD7/3F8TFKs9K1l5fEGbO4=` → **404**

**Resultado:** El alumno ve "Esta invitacion ya no es valida" y no puede aceptar  
**Frecuencia:** ~25% de invitaciones (depende de si el token base64 contiene `/` o `+`)  
**Console:** `[ERROR] Failed to load resource: 404`  
**Network:** `GET .../invite/GyzOH1GJ99K0KakaxCtjnoD7/3F8TFKs9K1l5fEGbO4= => [404]`

**Solucion sugerida:** Usar base64url encoding (reemplazar `+` con `-`, `/` con `_`) al generar el token en el backend. O pasar el token como query parameter en vez de path parameter en la API.

---

### BUG-002: Progreso de rutina muestra 0% con sets completados [MEDIO]

**Donde:** Vista de workout del alumno (`/workout/:routineId`)  
**Pasos para reproducir:**
1. Alumno abre una rutina con 2 series efectivas (Press banca, Remo con barra)
2. Marca ambas series como completadas (checkbox ✓)
3. El porcentaje de progreso del dia y de la rutina siguen mostrando "0%"

**Resultado esperado:** Deberia mostrar 100% (2/2 series efectivas completadas)  
**Resultado actual:** Muestra 0%  
**Nota:** El `ProgressSummaryDto` que llega del backend al cargar la rutina tiene `percentage: 0`. El frontend no recalcula el progreso localmente despues del toggle — depende del valor del backend que no se refresca.

**Solucion sugerida:** Recalcular el progreso en el frontend al togglear un set, o hacer un refetch del `ProgressSummaryDto` despues de cada toggle.

---

### BUG-003: CSRF validation failed tras expiracion de sesion [MEDIO]

**Donde:** Cualquier accion mutante (POST/PUT/DELETE) despues de inactividad prolongada  
**Pasos para reproducir:**
1. Trainer inicia sesion normalmente
2. Permanece inactivo por ~15+ minutos (JWT expira)
3. Intenta hacer una accion (ej: invitar alumno)
4. El interceptor detecta 401, intenta refresh
5. El refresh funciona pero la cookie `cg-csrf-celvogym` se desincroniza
6. La request reintentada falla con 403 "CSRF validation failed"

**Resultado:** El usuario ve "CSRF validation failed" y debe hacer logout/login manualmente  
**Console:**
```
[ERROR] 401 @ /api/v1/students/invite
[ERROR] 403 @ /api/v1/students/invite
```
**Network:**
```
POST /students/invite => [401]
POST /students/invite => [403]
```

**Solucion sugerida:** Al hacer refresh exitoso, asegurarse de que la cookie CSRF se actualice y el interceptor la lea correctamente antes de reintentar la request original.

---

### BUG-004: Rate limit muestra error en ingles [MENOR]

**Donde:** Login (`/auth/login`)  
**Pasos para reproducir:**
1. Hacer multiples intentos de login rapidamente
2. CelvoGuard responde 429

**Resultado:** Muestra "Too many requests. Please try again later." en ingles  
**Resultado esperado:** Deberia mostrar el mensaje en espanol, consistente con el resto de la UI  
**Console:** `[ERROR] Failed to load resource: 429 @ .../auth/login`

**Nota:** Este error viene del backend (CelvoGuard). El frontend muestra `data.error` tal cual viene. La solucion seria que CelvoGuard devuelva mensajes en espanol o que el frontend mapee el error.

---

## Console Warnings

### WARN-001: Inputs sin atributo `autocomplete` [ACCESIBILIDAD]

**Donde:** Todas las paginas con input de password  
**Paginas afectadas:**
- `/auth/register`
- `/auth/login`
- `/auth/login?t={tenantId}`
- `/invite?token={token}`

**Mensaje:**
```
[DOM] Input elements should have autocomplete attributes (suggested: "current-password")
```

**Impacto:** Los navegadores y password managers no pueden autocompletar correctamente. Afecta UX en mobile.

**Solucion:** Agregar `autocomplete="current-password"` al input de password en login e invite, y `autocomplete="new-password"` en register.

---

## Detalle de tests por area

### 1. Auth (login/register/logout)

| Test | Resultado | Notas |
|------|-----------|-------|
| Register trainer: form visible con campos | PASS | Nombre, Email, Contraseña |
| Register trainer: submit exitoso | PASS | POST /auth/register → 200, POST /onboarding/setup → 201 |
| Register trainer: mensaje de aprobacion pendiente | PASS | "Tu cuenta está pendiente de aprobación" |
| Login trainer: redirect a /trainer/dashboard | PASS | POST /auth/login → 200, GET /auth/me → 200 |
| Login alumno con ?t=: muestra "Acceso alumno" | PASS | Sin link de registro |
| Login alumno: redirect a /workout | PASS | POST /enduser/login → 200 |
| Login con credenciales invalidas: error 429 | PASS | Rate limit funciona (pero mensaje en ingles) |
| Logout: redirect a /auth/login | PASS | |
| Guard: /trainer sin auth redirige a login | PASS | |
| Link "Inicia sesion" desde register | PASS | Navega a /auth/login |
| Link "Registrate aqui" desde login | PASS | Navega a /auth/register |

### 2. Dashboard trainer

| Test | Resultado | Notas |
|------|-----------|-------|
| Carga /trainer/dashboard | PASS | GET /dashboard → 200 |
| Stats: 0 alumnos, 0 activos | PASS | Correcto para cuenta nueva |
| Actividad reciente: empty state | PASS | "Sin actividad reciente" |
| Navegacion: todas las tabs funcionan | PASS | Inicio, Rutinas, Programas, Ejercicios, Alumnos |
| Active state en nav marcado correctamente | PASS | |

### 3. Catalogo de ejercicios

| Test | Resultado | Notas |
|------|-----------|-------|
| Empty state inicial | PASS | "Tu biblioteca está vacía" |
| Crear ejercicio (Press banca) | PASS | POST /catalog → 201 |
| Crear multiples ejercicios | PASS | 4 creados |
| Editar ejercicio (notas de Press banca) | PASS | PUT /catalog/{id} → 200 |
| Busqueda: "sent" filtra a Sentadilla | PASS | GET /catalog?q=sent → 200 |
| Eliminar ejercicio con confirmacion | PASS | Dialog + DELETE → 204 |
| Form pre-llenado al editar | PASS | Nombre, grupo, notas |

### 4. Rutinas

| Test | Resultado | Notas |
|------|-----------|-------|
| Empty state: "Aun no hay rutinas" | PASS | |
| Form: campos nombre, descripcion, categoria, tags | PASS | |
| Agregar tag con Enter | PASS | "hipertrofia" visible con × |
| Agregar dia con nombre | PASS | "Pecho y Espalda" |
| Tipo de grupo: Individual/Superset/Triset/Circuito | PASS | Combo visible |
| Autocomplete de ejercicios desde catalogo | PASS | "Press" → muestra Press banca y Press militar |
| Seleccionar ejercicio del autocomplete | PASS | |
| Tipos de serie: Efectiva, Drop set, etc. | PASS | Combo con 5 opciones |
| Inputs: reps, peso, RPE | PASS | |
| Agregar segunda serie | PASS | |
| Agregar segundo ejercicio | PASS | |
| Guardar rutina | PASS | POST /routines → 201 |
| Lista: tarjeta con metadata | PASS | Nombre, descripcion, dias, tags, ejercicios, categoria, fecha |
| Filtro por categoria | PASS | Botones "Todas" y "Fuerza" |
| Detalle: estructura completa | PASS | Dias, ejercicios, series con reps × peso RPE |
| Duplicar: crea copia con "(copia)" | PASS | Redirige a /edit con nuevo ID |
| Editar: form pre-llenado, "Guardar cambios" | PASS | PUT /routines/{id} |
| Eliminar: dialog de confirmacion | PASS | "Esta accion no se puede deshacer" |
| Eliminar: redirige a lista | PASS | DELETE /routines/{id} → 204 |

### 5. Programas

| Test | Resultado | Notas |
|------|-----------|-------|
| Empty state: "Sin programas" | PASS | |
| Form: nombre, descripcion, duracion, slots de rutinas | PASS | |
| Dropdown de rutinas poblado | PASS | "Dia A - Tren Superior" |
| Etiqueta de slot | PASS | "Semana A" |
| Crear programa | PASS | POST /programs → 201 |
| Detalle: info + rutinas listadas | PASS | "4 semanas", "1 rutina" |
| Rutina linkeada desde detalle | PASS | Click navega a /trainer/routines/{id} |
| Panel de asignacion: modo Rotacion | PASS | Botones Lu-Do |
| Seleccionar dias (Lu, Mi, Vi) | PASS | |
| Checkbox de alumno | PASS | "Alumno Test2" con avatar |
| Asignar bulk | PASS | POST /program-assignments/bulk |
| Alumno asignado visible | PASS | "Semana 1/4 · Rotacion" |
| Boton "Quitar" visible | PASS | |

### 6. Alumnos

| Test | Resultado | Notas |
|------|-----------|-------|
| Empty state: "Aun no hay alumnos" | PASS | |
| Link de acceso con tenantId | PASS | URL completa visible |
| Boton Copiar | PASS | Presente |
| QR de acceso | PASS | Imagen visible |
| Form de invitacion: email + nombre | PASS | |
| Enviar invitacion | PASS | POST /students/invite → 201 |
| Link de invitacion generado | PASS | Con boton "Copiar link" |
| QR de invitacion | PASS | Imagen visible |
| Expandir alumno: notas privadas | PASS | |
| Agregar nota | PASS | POST /students/{id}/notes → 201 |
| Fijar nota (☆ → ★) | PASS | PUT /notes/{id} |
| Link a analytics | PASS | "Ver progreso y analiticas →" |
| Analytics: stats (sesiones, adherencia) | PASS | 0 sesiones, 0%, correcto |

### 7. Invitacion de alumno

| Test | Resultado | Notas |
|------|-----------|-------|
| Pagina muestra nombre del trainer | PASS | "Coach Test E2E te invita a entrenar" |
| Email pre-llenado y disabled | PASS | |
| Campos nombre y contraseña | PASS | |
| Aceptar invitacion exitoso | PASS | Register → Accept → "¡Listo, ya estas dentro!" |
| "Ver mis rutinas" navega a /workout | PASS | Auto-login como student |
| Token con `/` falla | FAIL | **BUG-001** |

### 8. Calendario del alumno

| Test | Resultado | Notas |
|------|-----------|-------|
| Vista mensual con headers Lu-Do | PASS | |
| Mes: "abril de 2026" | PASS | |
| Navegacion mes anterior/siguiente | PASS | Botones presentes |
| "Hoy te toca: Dia A - Tren Superior" | PASS | |
| Click en sugerencia navega a workout | PASS | |
| Programa visible: "Semana 1 de 4" | PASS | |
| Leyenda: Completado / Sugerido | PASS | |

### 9. Workout (sesion de entrenamiento)

| Test | Resultado | Notas |
|------|-----------|-------|
| Rutina cargada con ejercicios y series | PASS | |
| Dia expandido por defecto | PASS | "Pecho y Espalda" |
| Labels de tipo de serie (Efectiva, Drop set) | PASS | |
| Targets visibles (10 × 60 RPE 7) | PASS | |
| Inputs peso/reps por serie | PASS | |
| Toggle set (checkbox ✓) | PASS | POST /sets/toggle → 200 |
| Auto-start sesion al primer toggle | PASS | POST /sessions/start → 200 |
| Boton "Terminar entrenamiento" aparece | PASS | Solo con sesion activa |
| Timer ⏱ 90s visible | PASS | |
| Comentarios: enviar mensaje | PASS | POST /my/comments → 200 |
| Comentario visible con autor y fecha | PASS | "Alumno Test2", "ahora" |
| Completar sesion | PASS | POST /sessions/{id}/complete → 200 |
| Deteccion de PRs | PASS | GET /records/detect → 200 |
| Progreso se actualiza | FAIL | **BUG-002**: Muestra 0% pese a sets completados |

### 10. Records personales

| Test | Resultado | Notas |
|------|-----------|-------|
| Lista de PRs visible | PASS | |
| Press banca: 60 kg, 5 abr 2026 | PASS | |
| Remo con barra: 50 kg, 5 abr 2026 | PASS | |
| Nav "Records" marcado como active | PASS | |

### 11. Body tracking

| Test | Resultado | Notas |
|------|-----------|-------|
| Empty state: "Sin registros" | PASS | |
| Form: peso, grasa, notas | PASS | |
| Guardar metrica | PASS | POST /body-metrics → 201 |
| Registro visible: 78 kg, 15% grasa | PASS | |
| Notas del registro visibles | PASS | "Primera medicion, empezando programa" |
| Seccion "Fotos de progreso" | PASS | "+ Subir foto" visible |

---

## Network: Todos los endpoints testeados

| Endpoint | Metodo | Status | Resultado |
|----------|--------|--------|-----------|
| guard.celvo.dev/api/v1/auth/register | POST | 200 | OK |
| guard.celvo.dev/api/v1/auth/login | POST | 200 | OK |
| guard.celvo.dev/api/v1/auth/me | GET | 200 | OK |
| guard.celvo.dev/api/v1/enduser/login | POST | 200 | OK |
| guard.celvo.dev/api/v1/enduser/register | POST | 200 | OK |
| gym.celvo.dev/api/v1/onboarding/trainer/setup | POST | 201 | OK |
| gym.celvo.dev/api/v1/dashboard | GET | 200 | OK |
| gym.celvo.dev/api/v1/routines | GET/POST | 200/201 | OK |
| gym.celvo.dev/api/v1/routines/{id} | GET/PUT/DELETE | 200/204 | OK |
| gym.celvo.dev/api/v1/routines/{id}/duplicate | POST | 201 | OK |
| gym.celvo.dev/api/v1/programs | GET/POST | 200/201 | OK |
| gym.celvo.dev/api/v1/programs/{id} | GET | 200 | OK |
| gym.celvo.dev/api/v1/program-assignments | GET | 200 | OK |
| gym.celvo.dev/api/v1/program-assignments/bulk | POST | 200 | OK |
| gym.celvo.dev/api/v1/catalog | GET/POST | 200/201 | OK |
| gym.celvo.dev/api/v1/catalog?q={query} | GET | 200 | OK |
| gym.celvo.dev/api/v1/catalog/{id} | PUT/DELETE | 200/204 | OK |
| gym.celvo.dev/api/v1/students | GET | 200 | OK |
| gym.celvo.dev/api/v1/students/invite | POST | 201 | OK |
| gym.celvo.dev/api/v1/students/qr | GET | 200 | OK |
| gym.celvo.dev/api/v1/students/{id}/notes | GET/POST | 200/201 | OK |
| gym.celvo.dev/api/v1/students/{id}/notes/{id} | PUT | 200 | OK |
| gym.celvo.dev/api/v1/trainer/me | GET | 200 | OK |
| gym.celvo.dev/api/v1/analytics/student/{id}/overview | GET | 200 | OK |
| gym.celvo.dev/api/v1/public/invite/{token} | GET | 200 | OK |
| gym.celvo.dev/api/v1/public/invite/{token}/accept | POST | 200 | OK |
| gym.celvo.dev/api/v1/public/my/routines | GET | 200 | OK |
| gym.celvo.dev/api/v1/public/my/routines/{id} | GET | 200 | OK |
| gym.celvo.dev/api/v1/public/my/calendar | GET | 200 | OK |
| gym.celvo.dev/api/v1/public/my/sessions/active | GET | 204 | OK |
| gym.celvo.dev/api/v1/public/my/sessions/start | POST | 200 | OK |
| gym.celvo.dev/api/v1/public/my/sessions/{id}/complete | POST | 200 | OK |
| gym.celvo.dev/api/v1/public/my/sets/toggle | POST | 200 | OK |
| gym.celvo.dev/api/v1/public/my/next-workout | GET | 200 | OK |
| gym.celvo.dev/api/v1/public/my/records | GET | 200 | OK |
| gym.celvo.dev/api/v1/public/my/records/detect | GET | 200 | OK |
| gym.celvo.dev/api/v1/public/my/comments | GET/POST | 200 | OK |
| gym.celvo.dev/api/v1/public/my/body-metrics | GET/POST | 200/201 | OK |

---

## Console: Todos los mensajes capturados

### Errores (6 totales, todos explicados)

| Error | Causa | Bug relacionado |
|-------|-------|-----------------|
| `429 @ guard.celvo.dev/auth/login` (x2) | Rate limit por intentos rapidos post-registro | BUG-004 |
| `401 @ gym.celvo.dev/dashboard` | Sesion JWT expirada (15min inactividad) | BUG-003 |
| `401 @ gym.celvo.dev/students/invite` | Sesion expirada, intento de refresh | BUG-003 |
| `403 @ gym.celvo.dev/students/invite` | CSRF desincronizado post-refresh | BUG-003 |
| `404 @ gym.celvo.dev/public/invite/...` | Token con `/` rompe path | BUG-001 |

### Warnings DOM (8 totales, mismo tipo)

| Warning | Paginas afectadas |
|---------|-------------------|
| `Input elements should have autocomplete attributes (suggested: "current-password")` | `/auth/register`, `/auth/login`, `/auth/login?t=...`, `/invite?token=...` |

**Impacto:** Los password managers no pueden autocompletar. Afecta UX especialmente en mobile.  
**Fix:** Agregar `autocomplete="current-password"` en login/invite y `autocomplete="new-password"` en register.

### Otros errores: Ninguno

No se detectaron errores de JS, excepciones no capturadas, ni warnings de Angular/framework.

---

## Acciones recomendadas por prioridad

1. **[CRITICO] BUG-001:** Cambiar generacion de tokens a base64url encoding en el backend
2. **[MEDIO] BUG-002:** Recalcular progreso en frontend al togglear set, o refetch del ProgressSummaryDto
3. **[MEDIO] BUG-003:** Asegurar que el refresh de sesion actualice la cookie CSRF antes de reintentar
4. **[MENOR] BUG-004:** Traducir mensaje de rate limit a espanol en CelvoGuard o mapear en frontend
5. **[MENOR] WARN-001:** Agregar atributos `autocomplete` a inputs de password
