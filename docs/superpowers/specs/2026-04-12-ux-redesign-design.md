# CelvoGym — Rediseño UX Completo

**Fecha:** 2026-04-12
**Enfoque:** Hybrid Premium — experiencia immersiva para estudiantes + workspace potente para entrenadores
**Alcance:** Rediseño desde cero de toda la interfaz web (ambos roles)
**Conservar:** Paleta de colores (dark theme + crimson #E62639), tipografía (Syne + Outfit), tema dark-only

---

## 1. Arquitectura de Información

### 1.1 Estudiante (Mobile-first)

**Navegación:** Bottom tabs con 4 secciones. Se ocultan durante Workout Mode.

| Tab | Icono | Contenido principal |
|-----|-------|-------------------|
| Hoy | Home | Hero card del entreno de hoy, stats semanales, PRs recientes |
| Calendario | Calendar | Vista mensual, detalle del día, progreso del programa |
| Progreso | TrendingUp | Sub-tabs: Records, Medidas, Fotos |
| Perfil | User | Info personal, entrenador, programa actual, config |

### 1.2 Entrenador (Desktop-first)

**Navegación:** Sidebar colapsable (desktop/tablet) → Bottom tabs (móvil).

| Sección | Icono | Contenido principal |
|---------|-------|-------------------|
| Dashboard | LayoutDashboard | Stats, actividad alumnos, alertas, acciones rápidas |
| Rutinas | ClipboardList | Lista, wizard builder 4 pasos, detalle |
| Programas | Package | Lista con estados, crear/editar, asignar |
| Alumnos | Users | Master-detail, timeline, stats, programa |
| Catálogo | Dumbbell | Grid de ejercicios, búsqueda, filtros |

**Breakpoints responsive del entrenador:**
- Desktop (≥1024px): Sidebar fija con labels + contadores
- Tablet (768-1023px): Sidebar colapsada (solo iconos)
- Móvil (<768px): Bottom tabs (Inicio, Rutinas, Programas, Alumnos, Más) + FAB flotante

---

## 2. Estudiante — Pantallas

### 2.1 Home ("Hoy")

La pantalla principal del estudiante. Muestra qué hacer HOY y motiva a empezar.

**Estructura:**
1. **Header:** Saludo con fecha ("Hola, Carlos 👋") + avatar
2. **Hero card "Tu entreno de hoy":**
   - Nombre de la rutina + grupo muscular
   - Info: N ejercicios, ~X min, nombre de rutina dentro del programa
   - Stats compactos: Semana X/Y, Sesión N, Racha 🔥
   - CTA prominente: "Empezar Entreno →" (botón crimson full-width)
3. **Stats de la semana:** 3 cards (Entrenos X/Y, PRs nuevos, Volumen total)
4. **PRs recientes:** Card con ejercicio, marca, y fecha

**Sin entreno hoy:** Empty state motivacional con enlace al calendario.

**Sin programa asignado:** Empty state informando que su entrenador aún no asignó programa.

### 2.2 Calendario

Vista mensual con los días de entrenamiento marcados según la asignación del programa.

**Estructura:**
1. **Header:** Título + info del programa activo
2. **Barra de progreso del programa:** Semana X de Y, porcentaje
3. **Navegación de mes:** Flechas izquierda/derecha + nombre del mes
4. **Grid del calendario:** 7 columnas (Lun-Dom)
   - **Día completado:** Fondo verde sutil, dot verde, número en bold verde
   - **Hoy con entreno:** Borde crimson con glow, dot crimson
   - **Día programado (futuro):** Dot crimson tenue
   - **Día de descanso:** Fondo neutro, número gris
   - **Días de otro mes:** Opacidad reducida
5. **Leyenda:** Completado, Hoy, Programado, Descanso

### 2.3 Detalle del Día

Se abre al hacer tap en un día del calendario. Muestra qué rutina toca y permite empezar.

**Estructura:**
1. **Header:** Nombre del día completo + semana del programa
2. **Badges de asignación:** Modo (Rotación/Fijo) + posición ("Rutina A de 3")
3. **Routine card:**
   - Nombre de la rutina + programa al que pertenece
   - Stats: N ejercicios, N sets totales, ~X min
   - Muscle group tags
   - CTA: "Empezar Entreno →"
4. **Preview de ejercicios:** Lista resumida con tipo de sets y peso anterior
5. **Referencia última sesión:** Fecha, duración, volumen total de la vez anterior

**Día completado:** En lugar del CTA, muestra resumen de la sesión (duración, volumen, PRs).

**Día sin entreno:** Muestra "Día de descanso" con un estado vacío simple.

### 2.4 Workout Mode (Full-Screen)

Experiencia immersiva sin navegación. Se activa al tap "Empezar Entreno".

#### 2.4.1 Workout Overview

Lista de todos los ejercicios de la rutina con estado visual.

**Estructura:**
1. **Top bar:** Botón "✕ Salir" (izquierda), nombre rutina + semana (centro), timer ⏱ (derecha)
2. **Progress bar:** Barra crimson que avanza con cada ejercicio completado
3. **Lista de ejercicios:**
   - **Completado:** Fondo verde sutil, check verde, peso logrado + badge PR si aplica
   - **En curso:** Fondo crimson sutil, borde crimson con glow, "En curso →", sets X/Y completados
   - **Pendiente:** Fondo neutro, opacidad progresiva (más lejano = más tenue)
4. **CTA inferior:** "Continuar ejercicio →" (navega al ejercicio activo)

#### 2.4.2 Exercise Logging

Pantalla dedicada por ejercicio para registrar sets.

**Estructura:**
1. **Top bar:** "← Volver" (izquierda), "Ejercicio X/Y" (centro), botón info (derecha)
2. **Nombre del ejercicio:** Grande, centrado, con grupo muscular
3. **Video de técnica:** Thumbnail expandible con play
4. **Notas del entrenador:** Cita inline con borde crimson izquierdo, siempre visible
5. **Referencia sesión anterior:** Peso × reps de cada set anterior
6. **Tabla de sets:**
   - Columnas: SET | KG | REPS | RPE | ✓
   - **Set completado:** Opacidad reducida, check verde
   - **Set activo:** Borde crimson, inputs editables, campo de peso pre-rellenado con valor anterior
   - **Set pendiente:** Opacidad baja, campos vacíos
   - **Tipos de set:** Badge de color (W = warmup amarillo, E = efectivo crimson, D = dropset púrpura, etc.)
   - **Botón check:** Círculo que se llena al tap para completar el set
7. **Rest timer:** Aparece después de completar un set
   - Countdown grande (1:32)
   - Botones: -15s, +15s, "Saltar →"
   - Vibración al terminar (si PWA lo soporta)

**Inputs táctiles:** Campos grandes (mínimo 44px touch target), numeric keyboard en móvil.

#### 2.4.3 Workout Complete (Resumen)

Pantalla de celebración al completar todos los ejercicios.

**Estructura:**
1. **Animación de celebración:** Confetti/glow
2. **Resumen:** Duración total, volumen total, sets completados
3. **PRs logrados:** Destacados con badge dorado
4. **Comparación vs. sesión anterior:** +/- en volumen, peso promedio
5. **CTA:** "Volver al inicio"

### 2.5 Progreso

Unifica Records, Medidas y Fotos en 3 sub-tabs dentro de la misma pestaña.

**Sub-tab switcher:** Pill-style segmented control (Records | Medidas | Fotos).

#### 2.5.1 Records

1. **Stats resumen:** 3 cards (PRs totales, Este mes, Tendencia volumen %)
2. **Lista de PRs por ejercicio:**
   - Nombre del ejercicio + mejor marca (Xkg × Y reps)
   - Badge de progreso: "+Xkg ↑" (verde) o "= Igual" (naranja)
   - Mini sparkline chart de evolución
   - Tap → gráfico completo de evolución del ejercicio

#### 2.5.2 Medidas

1. **Peso corporal:** Trend chart con selector de periodo (1m, 3m, 6m, 1a)
2. **% grasa corporal:** Trend chart
3. **Circunferencias:** Lista de medidas (pecho, brazo, cintura, cadera, muslo, pantorrilla, etc.)
4. **CTA:** "Registrar medida" → formulario rápido con los 13 tipos de medida

#### 2.5.3 Fotos

1. **Galería:** Timeline por fecha, cada entrada muestra las fotos del día
2. **Categorías:** Filtrar por frente, lateral, espalda
3. **Comparador before/after:** Slider horizontal para comparar dos fechas
4. **CTA:** "Nueva foto" → cámara o galería del dispositivo

### 2.6 Perfil

1. **Header:** Avatar grande con glow, nombre, fecha de registro
2. **Stats lifetime:** 3 cards (Sesiones totales, Racha actual, PRs totales)
3. **Mi entrenador:** Card con avatar, nombre, botón de contacto 💬
4. **Programa actual:** Nombre, rutinas, modo, progreso con barra
5. **Menú:** Configuración, Notificaciones, Cerrar sesión

---

## 3. Entrenador — Pantallas

### 3.1 Dashboard

Centro de control con visión general de la actividad.

**Estructura:**
1. **Header:** Fecha + saludo personalizado + botón de notificaciones (con badge)
2. **Stats cards (4 columnas):** Alumnos activos, Entrenos hoy, Programas activos, Adherencia semanal %
3. **Dos columnas:**
   - **Izquierda (60%): Actividad de alumnos**
     - Cards por alumno con avatar, nombre, estado actual
     - Estados: "Entrenando" (dot verde pulsante), "✓ Hecho" (completó hoy), "⚠ X días sin entrenar" (warning), "Descansando" (neutro)
     - Botón 💬 en alumnos con warning para contactar
   - **Derecha (40%): Alertas + Acciones rápidas**
     - Alertas: Programa por vencer, Nuevo PR de alumno, Invitación aceptada
     - Acciones: Crear rutina, Crear programa, Invitar alumno

**Responsive (móvil):** Stats en grid 2×1, actividad y alertas stacked, FAB para crear.

### 3.2 Rutinas

#### 3.2.1 Lista de Rutinas

1. **Header:** Título + botón "+ Nueva rutina"
2. **Filtros:** Por categoría (chips: Todas, Hipertrofia, Fuerza, Resistencia, Funcional)
3. **Lista de rutinas:** Cards con nombre, categoría badge, N ejercicios, N días, última edición
4. **Acciones por rutina:** Editar, Duplicar, Eliminar (menú contextual ⋯)

#### 3.2.2 Routine Builder (Wizard 4 Pasos)

**Paso 1 — Info básica:**
- Nombre de la rutina (required)
- Categoría (chips seleccionables: Hipertrofia, Fuerza, Resistencia, Funcional, Otro)
- Descripción (opcional, textarea)
- Navegación: Cancelar | Siguiente: Días →

**Paso 2 — Días:**
- Lista de días con nombre editable
- Cada día: número, input de nombre, botón reordenar (↕), botón eliminar (✕)
- Botón "+ Agregar día" (dashed border)
- Navegación: ← Anterior | Siguiente: Ejercicios →

**Paso 3 — Ejercicios (por día):**
- **Panel lateral izquierdo:** Tabs verticales por día con nombre y conteo de ejercicios. El día activo tiene borde crimson.
- **Panel principal:** Editor del día seleccionado
  - Ejercicios expandibles (accordion, solo uno abierto a la vez)
  - **Ejercicio expandido:**
    - Header: número, nombre, grupo muscular, botones reordenar/eliminar
    - Tabla de sets: columnas SET | TIPO | REPS | DESCANSO | NOTAS | ✕
    - Tipos de set: Warmup, Efectivo, DropSet, RestPause, AMRAP (select con colores)
    - Botón "+ Agregar set"
    - Acciones extra: 🎥 Video, 💬 Nota para alumno, 🔗 Superset/Triset/Circuit
  - **Ejercicio colapsado:** Una línea con nombre, resumen de sets, flecha expand
  - Botón "+ Agregar ejercicio del catálogo" (abre modal/drawer con el catálogo)
- Navegación: ← Días | Siguiente: Revisar →

**Paso 4 — Revisar:**
- Resumen completo read-only de toda la rutina
- Nombre, categoría, descripción
- Por cada día: lista de ejercicios con sets configurados
- Navegación: ← Ejercicios | Guardar rutina ✓

#### 3.2.3 Detalle de Rutina (Read-only)

Vista de la rutina guardada con acciones: Editar, Duplicar, Eliminar.
Estructura similar al Paso 4 del wizard pero con botones de acción.

### 3.3 Programas

#### 3.3.1 Lista de Programas

1. **Header:** Título + botón "+ Nuevo programa"
2. **Filtros:** Chips por estado (Todos, Activos, Completados)
3. **Grid de cards (2 columnas):**
   - Badge de estado (Activo verde, Completado gris)
   - Nombre del programa
   - Info: N rutinas, modo (Rotación/Fijo), duración en semanas
   - Avatares de alumnos asignados + conteo
   - Barra de progreso (solo para activos)
   - Menú contextual ⋯ (Editar, Duplicar, Eliminar)
4. **Completados:** Opacidad reducida

#### 3.3.2 Crear/Editar Programa

Formulario en una sola pantalla (no wizard, es más simple que rutinas).

1. **Nombre** (input text, required)
2. **Duración** (input number + "semanas")
3. **Modo** (toggle: Rotación | Fijo)
4. **Rutinas:**
   - **Modo Rotación:** Lista ordenada con labels A, B, C... Reordenables con drag.
   - **Modo Fijo:** Mapeo rutina → día de la semana
   - Botón "+ Agregar rutina" (seleccionar del listado existente)
5. **Días de entrenamiento:** Selector de días de la semana (7 botones toggle: LUN-DOM)
6. **Acciones:** Cancelar | Crear programa

#### 3.3.3 Asignación de Programa

Flujo para asignar un programa a un alumno:
1. Desde la pantalla del alumno: botón "Asignar programa"
2. Modal/drawer: seleccionar programa de la lista
3. Confirmar fecha de inicio
4. El programa se activa y aparece en el calendario del estudiante

### 3.4 Alumnos

#### 3.4.1 Lista de Alumnos (Master-Detail)

**Panel izquierdo (lista):**
1. Header: "Alumnos" + botón "+ Invitar"
2. Búsqueda: Input con ícono 🔍
3. Cards de alumno: Avatar con gradiente, nombre, programa actual + semana, indicador de estado (dot de color)
4. Estados por color: Verde (activo/entrenando), Gris (descansando), Amarillo (warning inactividad), Púrpura (sin programa)

**Panel derecho (detalle del alumno seleccionado):**
1. **Header:** Avatar grande, nombre, email, fecha de registro, botones (Comentar, Config)
2. **Stats:** 4 cards (Sesiones, Adherencia %, Racha, PRs)
3. **Programa actual:** Card con nombre, estado, modo, progreso
4. **Timeline de actividad:** Línea vertical con dots de color
   - Verde: Sesión completada (con duración, volumen, PRs)
   - Azul: Evento de seguimiento (medidas, fotos)
   - Gris: Otros eventos

**Responsive (móvil):** Solo la lista; tap en alumno navega a pantalla de detalle.

#### 3.4.2 Invitar Alumno

Modal/drawer con dos opciones:
1. **Por email:** Input de email + botón enviar invitación
2. **Por QR/Link:** Genera código QR + link copiable para compartir

### 3.5 Catálogo de Ejercicios

1. **Header:** Título + botón "+ Nuevo ejercicio"
2. **Búsqueda + filtros:** Input de búsqueda + chips por grupo muscular (Todos, Pecho, Espalda, Piernas, Hombro, Brazos, Core, Más ▾)
3. **Grid de ejercicios (4 columnas desktop, 2 móvil):**
   - Thumbnail de video (o placeholder si no tiene)
   - Nombre del ejercicio
   - Grupo muscular + tipo (Compuesto/Aislado)
4. **Crear/Editar ejercicio:** Nombre, grupo muscular, tipo, video (YouTube URL o upload), instrucciones

---

## 4. Componentes del Design System

### 4.1 Componentes existentes a actualizar

| Componente | Cambios |
|-----------|---------|
| `<cg-spinner>` | Sin cambios, funciona bien |
| `<cg-empty-state>` | Mejorar visual con ícono Lucide + mensaje motivacional |
| `<cg-page-header>` | Actualizar para soportar breadcrumbs y acciones |
| `<cg-toast>` | Sin cambios |
| `<cg-avatar>` | Agregar gradientes de color por usuario |
| `<cg-confirm-dialog>` | Sin cambios |
| `<cg-line-chart>` | Mejorar con sparkline variant para PRs |
| `<cg-logo>` | Sin cambios |

### 4.2 Componentes nuevos necesarios

| Componente | Propósito |
|-----------|----------|
| `<cg-bottom-nav>` | Bottom tabs para estudiante (4 tabs) y trainer móvil (5 tabs) |
| `<cg-sidebar>` | Sidebar colapsable del trainer con logo, nav items, user section |
| `<cg-stat-card>` | Card de estadística reutilizable (valor, label, trend) |
| `<cg-progress-bar>` | Barra de progreso con gradiente crimson |
| `<cg-badge>` | Badge de estado (Activo, Completado, Warning, etc.) |
| `<cg-segmented-control>` | Pill-style tabs (para sub-tabs de Progreso) |
| `<cg-timeline>` | Timeline vertical con dots de colores |
| `<cg-day-cell>` | Celda del calendario con estados visuales |
| `<cg-rest-timer>` | Timer de descanso con countdown y controles |
| `<cg-exercise-card>` | Card de ejercicio expandible para el workout |
| `<cg-set-row>` | Fila de set con inputs de KG/Reps/RPE |
| `<cg-wizard-stepper>` | Indicador de pasos del wizard (paso X de Y + progress bar) |
| `<cg-hero-card>` | Card hero del entreno de hoy |
| `<cg-student-card>` | Card de alumno con avatar, estado, y info |

### 4.3 Tokens de diseño a agregar

```css
/* Nuevos tokens en @theme */
--color-bg-sidebar: #111113;
--color-border-active: rgba(230, 38, 57, 0.3);
--color-bg-active: rgba(230, 38, 57, 0.08);

/* Status dots */
--color-status-training: #22C55E;
--color-status-resting: #71717A;
--color-status-warning: #F59E0B;
--color-status-no-program: #A78BFA;
```

---

## 5. Flujos Críticos

### 5.1 Estudiante: Abrir app → Completar entreno

```
Home (hero card) → tap "Empezar" → Workout Overview → tap ejercicio →
Exercise Logging → completar set → Rest Timer → siguiente set →
... → completar ejercicio → siguiente ejercicio → ... →
Workout Complete (resumen + celebración) → Home
```

### 5.2 Estudiante: Calendario → Entreno de otro día

```
Calendario → tap día → Detalle del Día (rutina asignada según rotación/fijo) →
tap "Empezar" → Workout Overview → ... → Workout Complete
```

### 5.3 Entrenador: Crear rutina completa

```
Sidebar "Rutinas" → "+ Nueva rutina" → Paso 1 (info) → Paso 2 (días) →
Paso 3 (ejercicios por día, desde catálogo) → Paso 4 (revisar) → Guardar
```

### 5.4 Entrenador: Crear programa y asignar

```
Sidebar "Programas" → "+ Nuevo programa" → Configurar (nombre, duración,
modo, rutinas, días) → Crear → Ir a Alumnos → Seleccionar alumno →
"Asignar programa" → Seleccionar programa → Confirmar
```

---

## 6. Consideraciones Técnicas

### 6.1 Dependencias nuevas

- **Lucide Angular** (`lucide-angular`): Iconografía consistente, 1.5px stroke
- No se agregan más dependencias. Todo custom con Tailwind.

### 6.2 Estructura de archivos propuesta

```
src/app/
├── core/                          (sin cambios)
├── shared/
│   ├── ui/
│   │   ├── bottom-nav.ts         (nuevo)
│   │   ├── sidebar.ts            (nuevo)
│   │   ├── stat-card.ts          (nuevo)
│   │   ├── progress-bar.ts       (nuevo)
│   │   ├── badge.ts              (nuevo)
│   │   ├── segmented-control.ts  (nuevo)
│   │   ├── timeline.ts           (nuevo)
│   │   ├── day-cell.ts           (nuevo)
│   │   ├── rest-timer.ts         (nuevo)
│   │   ├── exercise-card.ts      (nuevo)
│   │   ├── set-row.ts            (nuevo)
│   │   ├── wizard-stepper.ts     (nuevo)
│   │   ├── hero-card.ts          (nuevo)
│   │   ├── student-card.ts       (nuevo)
│   │   ├── ... (existentes)
│   ├── layouts/
│   │   ├── student-shell.ts      (nuevo — bottom nav + router outlet)
│   │   └── trainer-shell.ts      (nuevo — sidebar + router outlet)
├── features/
│   ├── auth/                      (sin cambios mayores, pulir visualmente)
│   ├── student/
│   │   ├── feature/
│   │   │   ├── home.ts            (nuevo — reemplaza calendar como default)
│   │   │   ├── calendar.ts        (rediseño completo)
│   │   │   ├── day-detail.ts      (nuevo)
│   │   │   ├── workout-overview.ts (nuevo — reemplaza workout.ts)
│   │   │   ├── exercise-logging.ts (nuevo — pantalla por ejercicio)
│   │   │   ├── workout-complete.ts (nuevo)
│   │   │   ├── progress.ts        (nuevo — unifica records + body)
│   │   │   ├── profile.ts         (nuevo)
│   │   │   ├── my-routines.ts     (eliminar — absorbido por calendar/home)
│   │   │   ├── my-records.ts      (eliminar — absorbido por progress)
│   │   │   ├── body-tracking.ts   (eliminar — absorbido por progress)
│   ├── trainer/
│   │   ├── feature/
│   │   │   ├── dashboard.ts       (rediseño completo)
│   │   ├── routines/
│   │   │   ├── feature/
│   │   │   │   ├── routine-list.ts    (rediseño)
│   │   │   │   ├── routine-wizard.ts  (nuevo — reemplaza routine-form.ts)
│   │   │   │   ├── routine-detail.ts  (rediseño)
│   │   │   │   ├── routine-form.ts    (eliminar — reemplazado por wizard)
│   │   ├── programs/
│   │   │   ├── feature/
│   │   │   │   ├── program-list.ts    (rediseño)
│   │   │   │   ├── program-form.ts    (rediseño)
│   │   │   │   ├── program-detail.ts  (rediseño)
│   │   ├── students/
│   │   │   ├── feature/
│   │   │   │   ├── student-list.ts    (rediseño — master-detail)
│   │   │   │   ├── student-detail.ts  (rediseño — timeline + stats)
│   │   ├── catalog/
│   │   │   ├── feature/
│   │   │   │   ├── catalog-list.ts    (rediseño — grid con thumbnails)
```

### 6.3 Routing actualizado

```typescript
// Estudiante
{ path: 'workout', component: StudentShell, children: [
  { path: '', redirectTo: 'home' },
  { path: 'home', component: Home },
  { path: 'calendar', component: Calendar },
  { path: 'calendar/:date', component: DayDetail },
  { path: 'progress', component: Progress },
  { path: 'profile', component: Profile },
  { path: 'session/overview', component: WorkoutOverview },
  { path: 'session/exercise/:index', component: ExerciseLogging },
  { path: 'session/complete', component: WorkoutComplete },
]}

// Entrenador
{ path: 'trainer', component: TrainerShell, children: [
  { path: '', component: Dashboard },
  { path: 'routines', component: RoutineList },
  { path: 'routines/new', component: RoutineWizard },
  { path: 'routines/:id', component: RoutineDetail },
  { path: 'routines/:id/edit', component: RoutineWizard },
  { path: 'programs', component: ProgramList },
  { path: 'programs/new', component: ProgramForm },
  { path: 'programs/:id', component: ProgramDetail },
  { path: 'programs/:id/edit', component: ProgramForm },
  { path: 'students', component: StudentList },
  { path: 'students/:id', component: StudentDetail },
  { path: 'catalog', component: CatalogList },
]}
```

### 6.4 Lo que NO cambia

- Backend API: No hay cambios en endpoints, modelos, ni lógica de negocio
- Auth flow: CelvoGuard, guards, interceptors se mantienen
- NgRx AuthStore: Se mantiene tal cual
- ApiService: Se mantiene tal cual
- Modelos TypeScript: Se mantienen (pueden agregar interfaces para nuevos DTOs de dashboard)
- Infraestructura: Docker, CI/CD, deploy sin cambios

---

## 7. Mockups de Referencia

Los mockups interactivos del brainstorming están guardados en:
`.superpowers/brainstorm/327-1776013152/content/`

- `student-nav-home.html` — Home del estudiante
- `student-workout.html` — Workout mode (overview + logging)
- `student-calendar.html` — Calendario + detalle del día
- `student-progress-profile.html` — Progreso y perfil
- `trainer-nav-dashboard.html` — Sidebar + dashboard
- `trainer-routine-builder.html` — Wizard de rutinas (4 pasos)
- `trainer-students-programs-catalog.html` — Alumnos, programas, catálogo
