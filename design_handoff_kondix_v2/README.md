# Handoff: KONDIX v2 — UX Refresh & Feature Expansion

> **Para Claude Code, trabajando sobre el repo [`Thebigboss537/CelvoGym`](https://github.com/Thebigboss537/CelvoGym)**

---

## 1. Resumen ejecutivo

Este handoff describe una **iteración mayor de KONDIX** que cubre tanto refinamientos visuales como **funcionalidad nueva** sobre la app ya existente. No es un rediseño desde cero ni un cambio de stack: hay que **integrar incrementalmente sobre el código actual** (.NET 10 backend + Angular 21 frontend).

Las nuevas capacidades clave son:

1. **Loop de feedback bidireccional** trainer ↔ alumno (notas por serie, feedback por ejercicio con RPE, mood + nota de sesión, badges en el detalle del alumno).
2. **Sistema de recovery** para sesiones perdidas (banner, deadline, flujo de recuperación).
3. **Demo de vídeo en logging** del alumno (overlay player).
4. **Refinamiento visual transversal** del trainer (drawer de estudiante reorganizado, biblioteca con thumbnails coherentes, programas con D&D semanal, etc.).
5. **Detección automática y celebración de PRs** integrada con toast + animación.

---

## 2. ⚠️ Naturaleza de los archivos adjuntos

Los archivos `.html` y `.jsx` que viajan con este handoff son **prototipos en React/JSX renderizados en navegador con Babel standalone**. **NO son código de producción y NO deben copiarse al repo**. Son la **referencia visual y funcional** de las decisiones de diseño tomadas. Tu trabajo es **traducirlos a Angular 21 standalone components** siguiendo las convenciones del repo (ver `CLAUDE.md` y `kondix-web/.impeccable.md`).

Mapeo conceptual:

| Prototipo (React/JSX)                            | Producción (Angular 21)                                   |
| ------------------------------------------------ | --------------------------------------------------------- |
| `Kondix.html` + `view-*.jsx`                     | `kondix-web/src/app/features/trainer/**`                  |
| `Kondix - Alumno.html` + `student/screens-*.jsx` | `kondix-web/src/app/features/student/**`                  |
| `ui.jsx` (KExerciseThumb, KBadge, etc.)          | Componentes en `kondix-web/src/app/shared/ui/` (algunos ya existen como `<kx-badge>`, `<kx-stat-card>`) |
| `seed-data.jsx` / `student/data.jsx`             | Existing API endpoints (`/api/v1/...`) — mock se descarta |
| `tweaks-panel.jsx`                               | No portar — solo es para exploración de diseño           |

---

## 3. Fidelidad

**Hi-fi, pixel-aware.** Colores, tipografía, spacing, radios, sombras y animaciones están en su forma final. Reproduce los tokens del prototipo con los `@theme` tokens ya existentes en `kondix-web/src/styles.css` — no introduzcas nuevos colores fuera del sistema. Si ves un color en el prototipo que no está en el theme, normalízalo al token más cercano.

---

## 4. Cambios por archivo / feature

### 4.1 Trainer — Drawer de estudiante (`features/trainer/students/`)

**Estado actual del repo**: existe vista de alumnos con analytics, comentarios, notas privadas pinneables.

**Cambios a aplicar** (ver `view-students.jsx` + `students-progress-tab.jsx`):

- **4 pestañas** en el drawer: `Resumen` · `Programa` · `Progreso` · `Notas`.
- **Pestaña "Resumen"**: KPI grid (Adherencia / Sesiones semana / Última sesión / Peso), gráfico de adherencia 12 semanas, perfil editable inline (Objetivo, Nivel, Peso, Lesiones).
- **Pestaña "Progreso"**: timeline de sesiones colapsable + filtro segmentado (Todas / Hechas / Saltadas / Con notas) + sección PRs + medidas corporales con sparkline + strip de fotos.
- **Banner de feedback reciente** en "Resumen" cuando hay ≥1 sesión con notas en últimos 14 días → CTA abre Progreso con filtro `with-notes` aplicado.
- **Badge numérico rojo** en la tab "Progreso" mostrando feedback no procesado.

**Cómo definir "feedback reciente":** sesiones de últimos 14 días con `status='completed'` que tengan `note != null` o algún `set.note` o `exercise.note` no vacío.

**Componente nuevo a crear**: `<kx-session-row>` (timeline expandible). Pattern: clickable header con fecha pill (día + mes), nombre rutina, mood emoji, pill "Detalle ▾" que rota a "Cerrar ▴" + glow rojo cuando abierta. Body expandido renderiza ejercicios con thumb, RPE chip, lista de `<kx-set-chip>` (peso×reps, isPR badge dorado), y notas por serie/ejercicio/sesión con tratamiento visual diferenciado (borde-izquierdo + fondo sutil).

### 4.2 Trainer — Programas (`features/trainer/programs/`)

**Estado actual**: CRUD básico, asignación con modos rotación/fijo.

**Refinamientos del prototipo**:

- **Editor de programa con grid semanal D&D**: 7 columnas L–D × N semanas, cada celda acepta drop de rutina desde un picker lateral. Reorder dentro de la celda permitido. Ver `view-programs.jsx`.
- **Overrides por semana**: cada semana puede tener una nota de progresión textual ("+5kg en compuestos") sobre la rutina base.
- **Modal de asignación**: lista buscable de alumnos con checkbox + datepicker de fecha de inicio.

### 4.3 Trainer — Biblioteca (`features/trainer/catalog/`)

- **Card con foto cuadrada 1:1** (gradiente del muscle group como fallback). Pill superior derecha si hay vídeo.
- **Editor con `PhotoUpload` cuadrado** + `videoSource` (None / YouTube / Upload). Ver `view-library.jsx`.

### 4.4 Alumno — Logging (`features/student/feature/workout/`)

**Estado actual**: `<kx-set-row>` ya existe.

**Cambios**:

- **Botón "Ver demo"** (pill rojo con icono play) junto a los badges de muscle group / equipment, visible solo si `exercise.videoUrl != null`. Ver `student/screens-more.jsx` línea ~670.
- **Overlay player**: backdrop oscuro click-to-close, card con header (icono, "DEMO DEL COACH", nombre ejercicio, botón ✕), iframe 16:9 YouTube embed con `autoplay=1&rel=0`. Acepta URLs `youtube.com/watch?v=` y `youtu.be/` y las normaliza a `/embed/`.
- **Nota por serie**: `<kx-set-row>` debe exponer un toggle (icono 💬) que abre input de texto inline; persiste en `SetLog.notes` (campo nuevo si no existe).
- **Feedback por ejercicio**: tras completar la última serie de un ejercicio, modal automático con stepper RPE 1-10 + textarea opcional. Bloquea avance hasta confirmar (pero permite "Saltar"). Ver `screens-more.jsx`.
- **Resumen al completar sesión**: pantalla de mood selector (4 opciones: 🔥 great / ✅ good / 😐 ok / 😮‍💨 tough) + textarea "Nota para tu coach". Persiste en `WorkoutSession.mood` (enum nuevo) y `WorkoutSession.notes` (existente).

### 4.5 Alumno — Sistema de recovery

**Concepto nuevo** (no existe en repo):

- Cuando una `WorkoutSession` programada para fecha pasada NO tiene `completed_at` → estado `missed`.
- Si han pasado ≤2 días y la siguiente sesión asignada es para hoy → mostrar **banner amarillo** en Home: *"Recupera el entreno del viernes (vence mañana)"*.
- Click → flujo de logging normal pero con label superior "RECUPERANDO DEL VIERNES" y bandera `is_recovery=true` en la session.
- Si el alumno ya tiene sesión programada para hoy → **bloquear doble entreno**: el banner pregunta cuál hacer, no permite ambas.
- En calendario, día recuperado se muestra con estilo distinto (verde + ícono ↺).

**Modelo de datos sugerido** (a decidir con usuario):

```
ALTER TABLE workout_sessions ADD COLUMN is_recovery BOOLEAN DEFAULT FALSE;
ALTER TABLE workout_sessions ADD COLUMN recovers_session_id UUID NULL REFERENCES workout_sessions(id);
ALTER TABLE workout_sessions ADD COLUMN recovery_deadline DATE NULL;
ALTER TABLE workout_sessions ADD COLUMN mood VARCHAR(20) NULL; -- 'great' | 'good' | 'ok' | 'tough'
```

### 4.6 Alumno — Toast de PR + animación

`PersonalRecord` ya se detecta en backend. Falta el **toast en frontend**:

- Variant `pr` en `<kx-toast>`: fondo dorado/crimson gradient, icono 🏆, título "¡Nuevo record!", mensaje "[Ejercicio] · [peso]kg × [reps]", duración 4s.
- Trigger: tras `POST /public/my/sets/update` si la response indica `isPR=true`.
- Vibración: `navigator.vibrate([100, 60, 100, 60, 200])` si soportado.

---

## 5. Tokens de diseño

**Todos los tokens ya están en `kondix-web/src/styles.css` `@theme`.** Úsalos sin introducir nuevos. Lista de los más importantes:

```css
/* Colors */
--color-primary: #E62639;
--color-primary-hover: #CF2233;
--color-primary-subtle: #2A0F14;
--color-bg: #09090B;
--color-bg-raised: #111113;
--color-card: #16161A;
--color-card-hover: #1E1E24;
--color-text: #F4F4F5;
--color-text-muted: #71717A;
--color-border: #27272A;
--color-border-light: #1E1E22;
--color-success: #22C55E;
--color-warning: #F59E0B;
--color-danger: #EF4444;

/* Set type colors */
--color-set-warmup, --color-set-effective, --color-set-dropset, --color-set-restpause, --color-set-amrap

/* Typography */
--font-display: Syne;  /* h1-h3, hero */
/* body: Outfit (default) */

/* Radii */
6px (chip), 8px (input), 10-12px (card), 999px (pill)
```

**Color por grupo muscular** (usado en thumbnails de ejercicios — añadir si no existe):

| Grupo       | Tinte      |
| ----------- | ---------- |
| Pecho       | `#EF4444`  |
| Espalda     | `#3B82F6`  |
| Hombro      | `#F59E0B`  |
| Bíceps      | `#A855F7`  |
| Tríceps     | `#EC4899`  |
| Cuádriceps  | `#22C55E`  |
| Glúteos     | `#06B6D4`  |
| Femoral     | `#10B981`  |
| Pantorrilla | `#84CC16`  |
| Core        | `#F97316`  |

Usar como gradiente sutil de fondo (~12% opacity) en el placeholder cuadrado del thumbnail cuando `photoUrl` es null.

---

## 6. Componentes nuevos a crear (Angular)

| Componente                      | Ubicación                        | Inputs                                                | Notas                                                                |
| ------------------------------- | -------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| `<kx-exercise-thumb>`           | `shared/ui/exercise-thumb.ts`    | `name`, `muscleGroup`, `photoUrl`, `size`             | Usado en logging, drawer de estudiante, biblioteca, programas        |
| `<kx-session-row>`              | `shared/ui/session-row.ts`       | `session: SessionDto`, `exercises: Map<string, ...>`  | Timeline expandible para drawer del trainer                          |
| `<kx-set-chip>`                 | `shared/ui/set-chip.ts`          | `weight`, `reps`, `isPR`, `note?`                     | Chip compacto para mostrar series en histórico                       |
| `<kx-mood-picker>`              | `shared/ui/mood-picker.ts`       | `value`, `(valueChange)`                              | 4 emojis grandes para fin de sesión                                  |
| `<kx-rpe-stepper>`              | `shared/ui/rpe-stepper.ts`       | `value`, `(valueChange)`                              | 1-10 con escala visual (verde→amarillo→rojo)                         |
| `<kx-video-demo-overlay>`       | `shared/ui/video-demo-overlay.ts`| `url`, `exerciseName`, `(close)`                      | Modal con iframe YouTube embed                                       |
| `<kx-recovery-banner>`          | `shared/ui/recovery-banner.ts`   | `missedSession`, `(recover)`, `(skip)`                | Banner amarillo en Home del alumno                                   |

Componentes ya existentes que **se reutilizan tal cual**: `<kx-set-row>` (extender con prop `showNoteToggle`), `<kx-rest-timer>`, `<kx-toast>` (añadir variant `pr`), `<kx-bottom-nav>`, `<kx-day-cell>` (añadir state `recovered`), `<kx-stat-card>`, `<kx-progress-bar>`, `<kx-empty-state>`.

---

## 7. Cambios de API (.NET) sugeridos

> Estos cambios son **propuestas** — coordina con el usuario antes de añadir migraciones.

### Nuevos campos

```csharp
// Domain/Entities/SetLog.cs
public string? Notes { get; set; } // nota por serie del alumno

// Domain/Entities/WorkoutSession.cs
public string? Mood { get; set; } // 'great' | 'good' | 'ok' | 'tough'
public bool IsRecovery { get; set; } = false;
public Guid? RecoversSessionId { get; set; }
public DateOnly? RecoveryDeadline { get; set; }

// Domain/Entities/ExerciseSetLog.cs (nuevo? o campo en SetLog)
public int? ActualRpe { get; set; } // RPE por ejercicio reportado al final
public string? ExerciseNotes { get; set; }
```

### Nuevos endpoints

```
POST   /api/v1/public/my/sessions/{id}/feedback   { mood, notes }
POST   /api/v1/public/my/sessions/{id}/recover    { fromSessionId }
GET    /api/v1/students/{id}/recent-feedback      → para badge del trainer
```

### Migration plan

1. Migración 8: `add_session_feedback_fields` (mood, notes ya existe, set notes, recovery fields)
2. Backfill: `mood = NULL`, `is_recovery = FALSE` para todas las sesiones existentes
3. Index: `CREATE INDEX ix_sessions_completed_with_feedback ON workout_sessions(student_id, completed_at) WHERE notes IS NOT NULL OR mood IS NOT NULL;`

---

## 8. Convenciones a respetar (recordatorio)

Todo está en `CLAUDE.md` del repo. Resumen crítico:

- **OnPush + signals**: usa `computed()` para derivados, no template methods.
- **Subscriptions**: `takeUntilDestroyed(inject(DestroyRef))` en `ngOnInit`.
- **Lucide icons**: kebab-case, registrados via `LucideIconProvider` en providers.
- **Tailwind 4**: `font-display` (no `font-[var(--font-display)]`).
- **Layout shells**: Workout mode rutas FUERA del shell (sin bottom nav).
- **Animations**: `prefers-reduced-motion` respetado, usa clases existentes (`animate-fade-up`, `animate-check`, etc.).
- **Spanish copy** en todo (tú, motivacional, directo).

---

## 9. Plan de implementación sugerido (fases)

### Fase 1 — Foundation (low risk)
1. Crear `<kx-exercise-thumb>` y migrar todos los lugares del repo que ya muestran ejercicios.
2. Actualizar `<kx-toast>` con variant `pr` y disparar tras detectar PR en backend.
3. Añadir color por muscle group como `--color-muscle-*` tokens en `styles.css`.

### Fase 2 — Loop de feedback (alto impacto)
4. Migración DB con campos `notes` (set), `mood` + `notes` (session).
5. Endpoints de feedback.
6. UI alumno: nota por serie, feedback por ejercicio, mood + nota fin sesión.
7. UI trainer: tab "Progreso" reorganizado con timeline + banner + badge.
8. `<kx-session-row>`, `<kx-set-chip>`, `<kx-rpe-stepper>`, `<kx-mood-picker>`.

### Fase 3 — Vídeo demo
9. `<kx-video-demo-overlay>` + integración en logging.
10. Verificar que el editor de ejercicios del trainer ya guarda `videoUrl` (sí, ya existe).

### Fase 4 — Recovery system
11. Migración DB con `is_recovery`, `recovers_session_id`, `recovery_deadline`.
12. Lógica de detección de sesiones perdidas (job + endpoint).
13. `<kx-recovery-banner>` + flujo de logging marcado como recovery.
14. Estado `recovered` en `<kx-day-cell>` del calendario.

### Fase 5 — Refinamiento programas
15. Editor de programa con grid semanal + D&D (CDK Drag-Drop).
16. Overrides por semana.

---

## 10. Archivos de referencia (en este bundle)

```
prototypes/
├── trainer/
│   ├── Kondix.html                   — Entry point del prototipo trainer
│   ├── Kondix - Crear rutina.html    — Vista alternativa de creación de rutina
│   ├── app.jsx                       — Root del trainer
│   ├── app-shell.jsx                 — Layout shell trainer (sidebar + header)
│   ├── design-canvas.jsx             — Canvas para presentar opciones (no portar)
│   ├── view-students.jsx             — Drawer de estudiante con tabs
│   ├── students-progress-tab.jsx     — Pestaña Progreso con SessionRow
│   ├── view-programs.jsx             — Editor de programas con D&D semanal
│   ├── view-library.jsx              — Biblioteca con thumbnails + editor
│   ├── views-extra.jsx               — Dashboard + vistas auxiliares
│   ├── exercise-card.jsx             — Card de ejercicio
│   ├── exercise-picker.jsx           — Modal selector de ejercicios
│   ├── exercise-row.jsx              — Row de ejercicio en editor de rutina
│   ├── day-panel.jsx                 — Panel de día en editor de rutina
│   ├── days-sidebar.jsx              — Sidebar de días en editor de rutina
│   ├── ui.jsx                        — Componentes compartidos del trainer
│   ├── ui-extras.jsx                 — Componentes auxiliares
│   ├── icons.jsx                     — Set de iconos custom (Lucide-compatible)
│   ├── tokens.css                    — Tokens CSS de referencia
│   ├── data.jsx                      — Datos en runtime
│   └── seed-data.jsx                 — Mock data del trainer (referencia de shape)
└── student/
    ├── Kondix - Alumno.html          — Entry point del prototipo alumno
    ├── app-shell.jsx                 — Layout shell alumno (bottom nav)
    ├── design-canvas.jsx             — Canvas de presentación (no portar)
    ├── ios-frame.jsx                 — Frame iOS para la presentación (no portar)
    ├── data.jsx                      — Mock data del alumno (rutina hoy, sesiones, PRs)
    ├── screens-home.jsx              — Home (3 variantes) + Calendario + Detalle día
    ├── screens-more.jsx              — Overview + Execute + Complete + Progreso + Perfil
    ├── ui.jsx                        — Componentes compartidos del alumno
    └── icons-extra.jsx               — Iconos adicionales (playCircle, mood, etc.)
```

---

## 11. Para empezar

1. Lee `CLAUDE.md` y `kondix-web/.impeccable.md` del repo.
2. Lee este README completo.
3. Abre `Kondix.html` y `Kondix - Alumno.html` localmente para ver los prototipos en vivo (necesita servidor estático cualquiera).
4. Pregúntale al usuario por qué fase quiere empezar (recomiendo Fase 1 → 2).
5. Por cada feature, lee el `.jsx` correspondiente como referencia visual + funcional. **No copies código** — reescribe en Angular.

**Cuando tengas dudas:** los prototipos son la verdad sobre comportamiento (animaciones, copy, estados). El repo es la verdad sobre arquitectura (patrones, layering, naming).
