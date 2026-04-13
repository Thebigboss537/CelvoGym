# KONDIX — Resumen para Investigación de Modelo de Negocio

## Qué es KONDIX

Plataforma web para entrenadores personales que les permite crear rutinas de entrenamiento y asignarlas a sus alumnos. Los alumnos siguen las rutinas desde su celular, registran su progreso serie por serie, y se comunican con su entrenador a través de comentarios.

**Dominio**: kondix.celvo.dev
**Parte del ecosistema Celvo** (auth centralizada via CelvoGuard).

---

## Usuarios

### Entrenador (operador)
- Se registra con email+contraseña
- Su cuenta requiere **aprobación de admin** antes de poder usarla
- Crea rutinas, invita alumnos, asigna rutinas, ve progreso de sus alumnos
- Cada entrenador es un **tenant independiente** (no hay concepto de gimnasio)

### Alumno (end-user)
- Es invitado por su entrenador (via email o código QR en persona)
- Se registra con email+contraseña
- Ve sus rutinas asignadas, registra peso/reps/RPE por serie, usa el timer de descanso
- Relación 1:1 con un entrenador (MVP), extensible a múltiples

---

## Features del MVP

### Para el entrenador
- **CRUD de rutinas** con estructura: Rutina → Días → Grupos de ejercicios → Ejercicios → Series
- **Tipos de serie**: Warmup, Efectiva, Drop Set, Rest-Pause, AMRAP
- **Supersets**: Agrupar 2+ ejercicios (Superset, Triset, Circuito)
- **Tempo**: Notación eccéntrica-pausa-concéntrica (ej: 3-1-2-0)
- **RPE/RIR**: Rate of Perceived Exertion por serie (1-10)
- **Videos**: YouTube embed o video propio subido por el entrenador (reproducción inline)
- **Series individuales**: Cada serie configurable (peso, reps, tipo, descanso) — permite pirámides, drop sets, etc.
- **Gestión de alumnos**: Invitar por email/QR, ver lista, desactivar relación
- **Asignación de rutinas**: Asignar/desasignar rutinas a alumnos
- **Comentarios**: Dejar notas en cualquier día o ejercicio

### Para el alumno
- **Ver rutinas asignadas** con barra de progreso general
- **Ejecutar rutina**: Vista por días (colapsables), ejercicios con series
- **Registrar progreso**: Checkbox por serie + inputs de peso/reps reales
- **Timer de descanso**: Cuenta regresiva con vibración al terminar
- **Comentarios**: Comunicarse con el entrenador por día o ejercicio
- **Progreso visual**: Porcentaje por día y total, badge "LISTO" al completar

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Backend | .NET 10, PostgreSQL 17, Redis 8, MinIO |
| Frontend | Angular SPA, Tailwind CSS |
| Auth | CelvoGuard (JWT + cookies, compartido con otros apps Celvo) |
| Infra | Docker (ARM64), Caddy, Oracle Cloud |
| Videos | MinIO (uploads) + YouTube (embeds) |

---

## Modelo de Datos Simplificado

```
Entrenador
  └── Rutinas
        └── Días
              └── Grupos de ejercicios (Single/Superset/Triset/Circuito)
                    └── Ejercicios (nombre, notas, video, tempo)
                          └── Series (tipo, reps objetivo, peso, RPE, descanso)

Entrenador ←→ Alumnos (M:N, 1:1 en MVP)

Alumno
  └── Rutinas asignadas
        └── Logs por serie (completado, peso real, reps reales, RPE real)
        └── Comentarios por día/ejercicio
```

---

## Qué NO tiene el MVP

- **No hay biblioteca de ejercicios reutilizable** (se escriben inline, se agregará después)
- **No hay planes de nutrición**
- **No hay métricas corporales** (peso, medidas, fotos de progreso)
- **No hay chat en tiempo real** (solo comentarios asíncronos)
- **No hay calendario/programación** (rutinas sin fecha, el alumno las ejecuta cuando quiera)
- **No hay analytics/reportes** para el entrenador
- **No hay pagos/suscripciones** integrados
- **No hay app móvil nativa** (solo web responsive)
- **No hay registro público de entrenadores** (sin marketplace/directorio)

---

## Preguntas Clave para el Modelo de Negocio

### Monetización
1. **¿Quién paga?** ¿El entrenador (SaaS B2B) o el alumno (B2C)?
2. **¿Freemium?** ¿Cuántos alumnos gratis antes de cobrar? ¿Cuántas rutinas?
3. **¿Precio?** ¿Mensual? ¿Por alumno? ¿Por entrenador?
4. **¿Comisión?** ¿Cobrar % de lo que el entrenador cobra a sus alumnos?

### Crecimiento
5. **¿Cómo llegan los entrenadores?** (marketing, referidos, partnerships con gimnasios)
6. **¿Los alumnos atraen otros alumnos?** (efecto red)
7. **¿Se expande a gimnasios?** (modelo multi-entrenador bajo un gimnasio)
8. **¿Se integra con wearables?** (Apple Watch, Garmin, Fitbit)

### Competencia
9. **Competidores directos**: Trainerize, TrueCoach, PT Distinction, Everfit, Hevy Coach
10. **Diferenciadores potenciales**: Ecosistema Celvo (auth compartida), precio más accesible para LATAM, español nativo, features avanzadas (supersets, tempo, RPE) incluidas en plan base

### Retención
11. **¿Qué hace que el entrenador se quede?** (sus datos, historial de alumnos, facilidad de uso)
12. **¿Qué hace que el alumno se quede?** (historial de progreso, relación con entrenador)
13. **¿Lock-in vs portabilidad?** (exportar datos, migrar)

### Expansión del producto
14. **Nutrición**: ¿Planes alimenticios + tracking de macros?
15. **Métricas corporales**: ¿Peso, medidas, fotos de progreso?
16. **Marketplace**: ¿Directorio público de entrenadores?
17. **Templates**: ¿Vender/compartir rutinas prefabricadas?
18. **White-label**: ¿El entrenador pone su marca?

---

## Contexto del Ecosistema Celvo

KONDIX es la 4ª app del ecosistema:

| App | Propósito | Estado |
|-----|-----------|--------|
| CelvoGuard | Auth centralizada | Producción |
| Fidly | Tarjetas de fidelización SaaS | Producción |
| CelvoView | Portal inmobiliario 360° | Producción |
| **KONDIX** | **Gestión de rutinas gym** | **MVP en desarrollo** |

Todas comparten infraestructura (PostgreSQL, Redis, MinIO, Caddy) y auth (CelvoGuard). Un usuario de Fidly que también entrena podría usar KONDIX con la misma cuenta.
