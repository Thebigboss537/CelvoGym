# Prompt inicial para Claude Code

> Copia y pega esto como tu **primer mensaje** a Claude Code después de abrir el repo `CelvoGym`. Adjunta también esta carpeta `design_handoff_kondix_v2/` al contexto.

---

```
Hola. Voy a hacer una iteración mayor sobre KONDIX. Esta no es una migración ni un rediseño desde cero — es una expansión funcional + refresh visual sobre el código existente.

CONTEXTO:
- Stack: .NET 10 (Clean Architecture) + Angular 21 standalone + PostgreSQL + Tailwind 4
- Lee `CLAUDE.md` y `kondix-web/.impeccable.md` para entender convenciones
- En `design_handoff_kondix_v2/` tienes un README detallado + prototipos en HTML/JSX
- Los archivos `.jsx`/`.html` del handoff son SOLO referencia visual y de comportamiento. NO los copies. Reescribe en Angular siguiendo los patrones del repo.

QUÉ SE AÑADE (resumen — el README tiene el detalle):

1. Loop de feedback bidireccional alumno → coach
   - Nota por serie en el logging del alumno
   - Feedback con RPE + nota por ejercicio al terminar el ejercicio
   - Mood (4 estados) + nota de sesión al completar
   - Vista del coach: tab "Progreso" reorganizado con timeline expandible de sesiones, badge numérico con feedback no procesado, banner CTA en "Resumen"

2. Sistema de recovery para sesiones perdidas
   - Banner en Home del alumno cuando ha faltado un día
   - Flujo de logging marcado como recovery
   - Estado visual en calendario

3. Demo de vídeo embebido en logging del alumno
   - Botón "Ver demo" + overlay con iframe YouTube
   - El backend ya soporta videoUrl en exercises

4. Detección de PRs con toast + animación
   - Backend ya detecta. Falta UI: variant 'pr' en kx-toast + vibración

5. Refinamiento visual transversal
   - Drawer de estudiante con 4 tabs reorganizadas
   - Editor de programas con grid semanal D&D
   - Biblioteca con thumbnails coherentes (gradiente por muscle group como fallback)

PRIMERA TAREA:
Lee el README del handoff completo, después dame:
1. Tu plan de implementación en fases (puedes seguir el sugerido o proponer otro)
2. Las preguntas que tengas sobre el modelo de datos / endpoints antes de empezar Fase 1
3. Una lista de los componentes Angular nuevos que vas a crear con su firma de inputs/outputs
4. Riesgos identificados (migraciones, rotura de contratos, etc.)

NO empieces a escribir código todavía. Quiero validar el plan primero.
```

---

## Tips de uso

- **No le pegues los .jsx directamente al chat** — están en el handoff folder, déjale que los lea cuando los necesite, archivo por archivo. Pegarlos todos satura su contexto.
- **Trabaja por fases**, no todo de una vez. La Fase 1 (foundation) es low-risk y te da componentes reutilizables que el resto necesita.
- **Antes de cada migración de DB** pídele que te muestre el SQL y el rollback plan.
- **Después de cada fase** pídele que actualice `PRODUCT-FEATURES.md` y `CLAUDE.md` con lo nuevo.
- **Verifica visualmente** abriendo los `Kondix.html` / `Kondix - Alumno.html` del handoff en paralelo a la implementación Angular.
