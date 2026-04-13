# CelvoGym — Inventario Completo de Producto

> Documento base para análisis de modelo de negocio, competencia y roadmap de features.
> Actualizado: 2026-04-07

---

## 1. Resumen del Producto

**CelvoGym** es una plataforma SaaS de gestión de entrenamiento personal que conecta entrenadores con sus alumnos. Los entrenadores diseñan rutinas, las organizan en programas y las asignan a alumnos. Los alumnos ejecutan sus entrenamientos, registran progreso y se comunican con su entrenador.

- **Dominio**: gym.celvo.dev
- **Stack**: .NET 10 (API) + Angular 21 (SPA) + PostgreSQL + Redis + MinIO
- **Auth**: CelvoGuard (sistema propio de auth multi-tenant)
- **Modelo de tenancy**: 1 entrenador = 1 tenant

---

## 2. Roles y Permisos

| Rol | Permiso | Descripción |
|-----|---------|-------------|
| **Entrenador** (Operator) | `gym:manage` | Gestión completa: rutinas, programas, alumnos, analytics |
| **Alumno** (EndUser) | `gym:workout` | Ejecutar entrenamientos, registrar progreso, comentar |

- Entrenadores se registran y requieren **aprobación de admin** (`IsApproved`)
- Alumnos solo acceden por **invitación** del entrenador (email o QR)
- Relación M:N entre entrenador-alumno, pero 1:1 en MVP (un alumno = un entrenador activo)

---

## 3. Features por Rol

### 3.1 Entrenador

#### Dashboard
- Resumen: total de alumnos, activos esta semana
- Alertas: alumnos inactivos (5+ días), programas por vencer
- Feed de actividad reciente (sesiones completadas/en progreso)
- Notas fijadas (pinned) de alumnos

#### Gestión de Rutinas
- **CRUD completo** de rutinas con estructura anidada:
  - Rutina → Días → Grupos de ejercicios → Ejercicios → Series
- **Tipos de grupo**: Individual, Biserie (Superset), Triserie, Circuito
- **Tipos de serie**: Warmup, Effective, DropSet, RestPause, AMRAP
- **Videos por ejercicio**: YouTube embed o upload directo (MP4/WebM/MOV, 50MB max)
- **Tempo**: notación de tempo por ejercicio
- **Duplicar rutinas**: copia profunda con sufijo "(copia)"
- **Categorías y tags** para organización
- Filtrado por categoría en el listado

#### Catálogo de Ejercicios
- Biblioteca personal de ejercicios del entrenador
- Búsqueda en tiempo real
- Campos: nombre, grupo muscular, notas/instrucciones
- Se usa como **autocomplete** al crear rutinas

#### Gestión de Programas
- **CRUD completo** de programas
- Programa = colección ordenada de rutinas con duración en semanas (1-52)
- Labels opcionales por rutina dentro del programa
- Ordenamiento de rutinas

#### Asignación de Programas
- **Asignación individual** o **masiva** (bulk) a múltiples alumnos
- **Dos modos de asignación**:
  - **Rotación**: las rutinas rotan en orden (A→B→C→A). Se definen días de entrenamiento por semana
  - **Días fijos**: cada rutina se mapea a días específicos de la semana
- **Lifecycle**: Active → Completed / Cancelled
- Auto-completado cuando se alcanza la fecha de fin
- Templates de asignación reutilizables

#### Gestión de Alumnos
- **Invitación por email** (token de 7 días de validez)
- **Invitación por QR code** (genera link + código QR)
- **Link de login** personalizado con tenant ID para compartir
- **Desactivación** de alumnos (soft-delete)
- **Notas privadas** por alumno:
  - Crear, editar, eliminar
  - Fijar/desfijar notas (pinned)
  - Se muestran en dashboard si están fijadas

#### Analytics por Alumno
- **Overview**: total de sesiones, sesiones esta semana, % de adherencia
- **Gráfico de volumen semanal**: sesiones completadas por semana (8 semanas)
- **Gráfico de peso corporal**: evolución del peso en el tiempo
- **Records personales**: PRs por ejercicio (peso máximo)
- **Progreso por ejercicio**: evolución de peso/rendimiento para un ejercicio específico
- **Métricas corporales**: historial de peso, grasa corporal, medidas
- **Fotos de progreso**: galería con ángulos y fechas

#### Comentarios
- Sistema de comentarios por rutina/día
- Trainer ve y responde comentarios de alumnos
- Diferenciación visual trainer vs alumno

---

### 3.2 Alumno

#### Calendario
- Vista mensual con navegación prev/next
- Días coloreados según estado:
  - Verde = completado
  - Amarillo = en progreso
  - Borde punteado = sugerido
  - Anillo = hoy
- Leyenda explicativa
- Click en día → detalle de sesión (fecha, estado, series completadas, duración)
- Info del programa activo: nombre, semana actual, barra de progreso
- **Prompt inteligente**: "Siguiente entrenamiento" con la rutina del día
- **Banner de sesión activa**: si hay entrenamiento en progreso, se muestra con animación

#### Ejecución de Entrenamiento
- **Inicio de sesión**: se crea automáticamente al marcar la primera serie
- **Vista por días** colapsables con progreso individual
- **Grupos de ejercicios** con etiqueta de tipo
- **Por ejercicio**:
  - Nombre, tempo
  - Video toggle (ver/ocultar video embebido)
  - Botón de timer de descanso
- **Registro de series**:
  - Checkbox de completado (con animación bounce)
  - Colores semánticos por tipo de serie
  - Target: reps, peso, RPE
  - Campos de input: peso real + reps reales
- **Timer de descanso**:
  - Modal fullscreen con countdown
  - Animación de anillo pulsante
  - Mensaje "¡YA!" al completar con vibración
- **Detección automática de PRs**:
  - Al completar sesión, detecta si algún set superó el record anterior
  - Toast de notificación: "Nuevo PR en [Ejercicio]!"
  - Parsea múltiples formatos de peso: "100kg", "100.5", "100,5", "100lbs"
- **Completar entrenamiento**: botón para finalizar sesión
- Avance automático de rotation index al completar

#### Mis Rutinas
- Lista de rutinas asignadas
- Por cada rutina: nombre, descripción, % progreso, barra de progreso, días y series
- Info del programa: nombre, modo (Rotación/Fijos), semana actual

#### Records Personales
- Lista de PRs por ejercicio
- Fecha de logro, peso (destacado), repeticiones

#### Seguimiento Corporal
- **Registrar medidas**: peso (kg), grasa corporal (%), notas
- **13 tipos de medición**: pecho, cintura, cadera, bíceps (L/R), muslos (L/R), pantorrillas (L/R), cuello, hombros, antebrazos (L/R)
- **Historial** en orden cronológico inverso
- **Fotos de progreso**:
  - Upload (jpg/png/webp, 10MB max)
  - Galería en grid de 3 columnas
  - Ángulos: Frente, Lateral, Espalda
  - Fecha y ángulo sobre la foto

#### Comentarios
- Comentarios por rutina/día
- Ver comentarios del entrenador
- Escribir comentarios (enter para enviar)
- Timestamps relativos (hace Xm, Xh, Xd)

#### Analytics del Alumno
- Progreso por ejercicio (gráfico de evolución)

---

## 4. Onboarding

### Entrenador
1. Registro (nombre, email, contraseña) → CelvoGuard
2. Setup inicial (displayName, bio) → CelvoGym
3. Estado "pendiente de aprobación"
4. Admin aprueba → acceso completo

### Alumno
1. Entrenador envía invitación (email o QR/link)
2. Alumno accede al link `/invite?token=X`
3. Valida token → registro (nombre, email pre-llenado, contraseña)
4. Se registra en CelvoGuard como end-user con contexto de tenant
5. Acepta invitación → se crea relación trainer-student
6. Redirect automático a `/workout`

---

## 5. Comunicación Trainer-Alumno

| Canal | Estado | Detalle |
|-------|--------|---------|
| Comentarios por rutina/día | Implementado | Bidireccional, tiempo real en refresh |
| Notas privadas del trainer | Implementado | Solo visible para el trainer, fijables |
| Email de invitación | Implementado | Via Resend API, HTML |
| Notificaciones push | No implementado | — |
| Chat directo | No implementado | — |
| Email de seguimiento | No implementado | — |

---

## 6. Modelo de Datos

### Entidades principales (22 tablas)

```
USUARIOS
├── Trainer (id, tenant_id, display_name, bio, avatar_url, is_active, is_approved)
├── Student (id, active_trainer_id, display_name, email)
├── TrainerStudent (trainer_id, student_id) — M:N junction
└── StudentInvitation (email, token_hash, expires_at, status)

RUTINAS
├── Routine (id, trainer_id, name, description, category, tags[])
├── Day (id, routine_id, name, sort_order)
├── ExerciseGroup (id, day_id, group_type, rest_seconds, sort_order)
├── Exercise (id, group_id, name, tempo, video_source, video_url, sort_order)
└── ExerciseSet (id, exercise_id, set_type, target_reps, target_weight, target_rpe, sort_order)

PROGRAMAS
├── Program (id, trainer_id, name, description, duration_weeks)
├── ProgramRoutine (program_id, routine_id, label, sort_order)
├── ProgramAssignment (id, program_id, student_id, mode, status, rotation_index, schedule_json, start_date, end_date)
└── AssignmentTemplate (id, trainer_id, name, scheduled_days)

TRACKING
├── WorkoutSession (id, student_id, routine_id, day_id, assignment_id, started_at, completed_at, notes)
├── SetLog (id, session_id, exercise_set_id, is_completed, actual_weight, actual_reps, actual_rpe, snapshot_*)
├── PersonalRecord (id, student_id, exercise_name, weight, reps, achieved_at)
├── BodyMetric (id, student_id, date, weight, body_fat_pct, notes)
├── BodyMeasurement (id, body_metric_id, measurement_type, value_cm)
└── ProgressPhoto (id, student_id, photo_url, angle, date, notes)

CATÁLOGO
└── CatalogExercise (id, trainer_id, name, muscle_group, notes, video_url)

SOCIAL
├── Comment (id, routine_id, day_id, author_id, author_type, text)
└── TrainerNote (id, trainer_id, student_id, text, is_pinned)
```

---

## 7. Integraciones y Servicios

| Servicio | Tecnología | Uso |
|----------|-----------|-----|
| **Autenticación** | CelvoGuard (propio) | JWT + refresh + CSRF cookies, multi-tenant |
| **Email transaccional** | Resend API | Invitaciones de alumnos |
| **Almacenamiento de archivos** | MinIO (S3-compatible) | Fotos de progreso (10MB), videos de ejercicios (50MB) |
| **Base de datos** | PostgreSQL 17 | Schema `gym` en DB compartida `celvo` |
| **Caché/Sesiones** | Redis 8 | Sesiones CelvoGuard, caché de manifests |
| **Reverse proxy** | Caddy | Auto-TLS, gzip, routing |

---

## 8. Capacidades Técnicas

### PWA (Progressive Web App)
- Instalable en pantalla de inicio (standalone, portrait)
- Service worker con caché de app shell (prefetch)
- Caché de assets (lazy load)
- Caché de API: estrategia freshness para `/api/v1/public/my/**` (1h, timeout 5s)
- Manifest dinámico por trainer
- Iconos 192px y 512px (maskable)

### UX/UI
- Tema oscuro exclusivo (blue-black premium #09090B)
- Color primario: Crimson #E62639
- Tipografía: Syne (display) + Outfit (body)
- Iconos: Lucide (outline, 1.5px)
- Animaciones: fade-up, check bounce, badge pop, ring pulse, stagger, press effect
- Soporte `prefers-reduced-motion`
- Timer de descanso con vibración
- Autocomplete en búsqueda de ejercicios
- Colores semánticos por tipo de serie
- Accesibilidad: ARIA labels, focus rings, keyboard nav, contraste WCAG AA+

### Seguridad
- CSRF double-submit pattern
- Headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- CORS configurado por origen
- Tokens de invitación hasheados (no plaintext en DB)
- Permisos verificados en cada endpoint

### CI/CD
- Build automático en PR y push a main
- Deploy automático: build Docker ARM64 → push GHCR → SSH pull en VM → health check
- Health check post-deploy: `GET /api/v1/health`

---

## 9. Lo que NO tiene (Gaps identificados)

### Monetización y Negocio
- [ ] Sistema de pagos/suscripciones
- [ ] Planes (free/pro/premium)
- [ ] Facturación
- [ ] Trial period
- [ ] Límites por plan (alumnos, rutinas, storage)

### Comunicación
- [ ] Notificaciones push (PWA ready pero no implementado)
- [ ] Chat directo trainer-alumno
- [ ] Emails automáticos (recordatorios, resúmenes semanales)
- [ ] SMS/WhatsApp

### Contenido y Social
- [ ] Marketplace de rutinas/programas
- [ ] Rutinas públicas/compartibles
- [ ] Perfil público del entrenador
- [ ] Reviews/valoraciones de entrenadores
- [ ] Feed social / comunidad

### Analytics Avanzados
- [ ] Dashboard del alumno (resumen propio)
- [ ] Comparativas entre períodos
- [ ] Reportes exportables (PDF/CSV)
- [ ] Gráficos de progreso por grupo muscular
- [ ] Predicciones / recomendaciones con IA
- [ ] Heatmap de consistencia (estilo GitHub)

### Entrenamiento
- [ ] Timer de entrenamiento global (duración de sesión en vivo)
- [ ] Drag & drop para reordenar ejercicios/días
- [ ] Plantillas de rutinas prediseñadas
- [ ] Importar/exportar rutinas
- [ ] Warm-up generator automático
- [ ] Deload weeks automáticos
- [ ] Progressive overload automático (sugerir incrementos)
- [ ] Historial de pesos anteriores visible durante entrenamiento
- [ ] Rest timer configurable por tipo de serie

### Gestión del Negocio (Trainer)
- [ ] Agenda/calendario del entrenador
- [ ] Gestión de horarios y citas
- [ ] Seguimiento de asistencia presencial
- [ ] Métricas del negocio (retención, churn, ingresos)
- [ ] Multi-trainer (gym/equipo)
- [ ] Roles dentro de un gym (admin, trainer, recepción)

### Nutrición
- [ ] Planes nutricionales
- [ ] Seguimiento de macros/calorías
- [ ] Recetas
- [ ] Integración con apps de nutrición

### Integraciones
- [ ] Wearables (Apple Watch, Garmin, Fitbit)
- [ ] Google Fit / Apple Health
- [ ] Strava
- [ ] Integración con redes sociales (compartir logros)

### Técnico
- [ ] Modo offline real (sync cuando vuelve conexión)
- [ ] Notificaciones in-app
- [ ] Internacionalización (solo español actualmente)
- [ ] App nativa (iOS/Android)
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Audit log
- [ ] Backups automatizados de datos del usuario

---

## 10. Métricas del Producto (Snapshot técnico)

| Métrica | Valor |
|---------|-------|
| Controllers (API) | 15 |
| Endpoints totales | ~55 |
| Entidades de dominio | 22 |
| Commands (escritura) | ~25 |
| Queries (lectura) | ~24 |
| Páginas del alumno | 5 (calendario, workout, rutinas, records, cuerpo) |
| Páginas del entrenador | 8+ (dashboard, rutinas CRUD, programas CRUD, catálogo, alumnos, analytics) |
| Componentes compartidos | 8 (logo, avatar, spinner, empty-state, toast, confirm-dialog, line-chart, page-header) |
| Formularios distintos | 7+ |
| Animaciones custom | 8+ |
| Migraciones de DB | 7 |

---

## 11. Flujos Clave (User Journeys)

### Trainer: Crear y asignar programa
```
Crear ejercicios en catálogo
  → Crear rutina (días, ejercicios, series, videos)
    → Crear programa (agrupar rutinas en orden)
      → Asignar programa a alumno(s) (modo rotación o fijo)
        → Monitorear desde dashboard + analytics
```

### Alumno: Entrenar
```
Abrir app → Calendario
  → Ver "Siguiente entrenamiento"
    → Entrar a rutina → Expandir día
      → Marcar series (peso real, reps reales)
        → Timer de descanso entre series
          → Ver video si necesita referencia
            → Completar entrenamiento
              → Detección automática de PRs
```

### Alumno: Tracking corporal
```
Ir a "Cuerpo"
  → Registrar medidas (peso, grasa, 13 mediciones)
    → Subir foto de progreso (frente/lateral/espalda)
      → Ver historial y evolución
```
