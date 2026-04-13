# CelvoGym Brand Guidelines

## Brand Essence

**Tagline:** Tu progreso, tu fuerza.
**Personality:** Motivacional, profesional, confiable.
**Position:** La herramienta que conecta entrenadores con sus alumnos para lograr resultados reales.

---

## Logo — "The Lift"

The mark combines an **upward chevron** (progress, growth) with a **horizontal bar** (strength, foundation). Together they read as "rise from a strong foundation" — the trainer-student value proposition.

### Variants
| Variant | Use |
|---------|-----|
| **Mark only** (`logo-mark.svg`) | Favicon, app icon, small spaces |
| **Mark + wordmark** (`<cg-logo>`) | Headers, navigation, marketing |
| **Wordmark only** (`<cg-logo [showText]="true" [size]="0">`) | Text-heavy contexts |

### Wordmark Treatment
- "Celvo" in **text color** (Syne Bold 700)
- "Gym" in **primary red** (Syne Bold 700)
- This subtly references the Celvo ecosystem while giving Gym its own identity

### Usage Rules
- Minimum size: 24px (mark), 120px (full logo)
- Always maintain clear space equal to the mark's height
- Do not rotate, distort, or add effects
- On dark backgrounds: use primary red or white mark
- On light backgrounds: use primary red or dark mark

---

## Color Palette

### Primary — CelvoGym Crimson

A warm, vibrant red that conveys energy and determination. Shifted from generic Tailwind red-600 to a distinctive owned hue (HSL 354, 79%, 53%).

| Token | Value | Use |
|-------|-------|-----|
| `--color-primary` | `#E62639` | Buttons, links, active states, brand elements |
| `--color-primary-hover` | `#CF2233` | Hover states |
| `--color-primary-active` | `#B31D2C` | Pressed/active states |
| `--color-primary-subtle` | `#2A0F14` | Tinted backgrounds, selected items |
| `--color-primary-glow` | `rgba(230,38,57,0.15)` | Glow effects, focus rings |

### Backgrounds — Blue-Black Premium

Subtle blue undertones elevate the dark theme from "dark mode" to "premium dark."

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg` | `#09090B` | Page background |
| `--color-bg-raised` | `#111113` | Raised surfaces, modals |
| `--color-card` | `#16161A` | Cards, panels |
| `--color-card-hover` | `#1E1E24` | Card hover states |

### Text

| Token | Value | WCAG on bg | Use |
|-------|-------|------------|-----|
| `--color-text` | `#F4F4F5` | AAA | Headings, primary text |
| `--color-text-secondary` | `#A1A1AA` | AA | Descriptions, labels |
| `--color-text-muted` | `#71717A` | AA | Timestamps, hints, disabled |

### Borders

| Token | Value | Use |
|-------|-------|-----|
| `--color-border` | `#27272A` | Card borders, dividers |
| `--color-border-light` | `#1E1E22` | Subtle separators |

### Semantic

| Token | Value | Dark variant | Use |
|-------|-------|-------------|-----|
| `--color-success` | `#22C55E` | `#0D3320` | Completed sets, success states |
| `--color-warning` | `#F59E0B` | `#3D2800` | Pending, attention needed |
| `--color-danger` | `#EF4444` | — | Errors, destructive actions |

---

## Typography

### Font Pairing: Syne + Outfit

| Font | Role | Weights | Why |
|------|------|---------|-----|
| **Syne** | Display (headings, brand) | 600, 700, 800 | Geometric, energetic, modern. Conveys confidence and structure. |
| **Outfit** | Body (UI text, forms) | 300, 400, 500, 600, 700 | Clean, highly readable, friendly. Scales well from captions to paragraphs. |

### Type Scale (to implement)

| Level | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| Display | Syne | 2rem (32px) | 800 | Hero headings, celebration screens |
| H1 | Syne | 1.5rem (24px) | 700 | Page titles |
| H2 | Syne | 1.25rem (20px) | 700 | Section headings |
| H3 | Outfit | 1.125rem (18px) | 600 | Card titles, group labels |
| Body | Outfit | 1rem (16px) | 400 | Default text |
| Body small | Outfit | 0.875rem (14px) | 400 | Descriptions, secondary content |
| Caption | Outfit | 0.75rem (12px) | 400 | Timestamps, badges, metadata |
| Overline | Outfit | 0.75rem (12px) | 600 | Labels, category tags (uppercase tracking-wide) |

---

## Iconography

### Recommended: Lucide Icons (outline style)

- **Package:** `lucide-angular`
- **Style:** 1.5px stroke, round caps and joins
- **Size standard:** 20px in UI, 16px inline with text, 24px in navigation
- **Color:** `currentColor` (inherits from text color)

**Why Lucide:**
- Clean outline style matches the mark's stroke-based design
- MIT licensed, tree-shakeable
- Angular-native package
- 1500+ icons covering all UI needs
- Consistent stroke width across all icons

### Key Icons for CelvoGym

| Context | Icon | Name |
|---------|------|------|
| Routines | clipboard-list | `clipboard-list` |
| Students | users | `users` |
| Add/Create | plus | `plus` |
| Back | arrow-left | `arrow-left` |
| Edit | pencil | `pencil` |
| Delete | trash-2 | `trash-2` |
| Video | play-circle | `play-circle` |
| Timer | timer | `timer` |
| Progress | trending-up | `trending-up` |
| Complete | check-circle-2 | `check-circle-2` |
| Comment | message-circle | `message-circle` |
| QR Code | qr-code | `qr-code` |
| Logout | log-out | `log-out` |
| Copy | copy | `copy` |
| Invite | mail-plus | `mail-plus` |
| Settings | settings | `settings` |

---

## Brand Voice (Spanish)

### Tone: Motivacional pero directo

Like a good trainer: encouraging, clear, never condescending.

| Attribute | Do | Don't |
|-----------|-----|-------|
| **Directo** | "Crea tu primera rutina" | "Para comenzar, deberá crear una nueva rutina" |
| **Motivacional** | "¡Tu rutina te espera!" | "No se encontraron rutinas asignadas" |
| **Personal** | "Tu progreso" / "Tus alumnos" | "El progreso del usuario" |
| **Confiable** | "Guardado" / "Listo" | "La operación se completó exitosamente" |

### Grammar Rules
- Use **"tú"** (not "usted") — personal, direct
- Use **imperative mood** for CTAs: "Crea", "Invita", "Empieza"
- Use **active voice**: "Registra tu peso" not "El peso debe ser registrado"
- Keep sentences short: max 8-10 words for UI labels and empty states

### Error Messages Pattern
- **What happened** + **What to do**: "No pudimos guardar. Intentá de nuevo."
- Never blame the user: "Algo salió mal" not "Ingresaste datos incorrectos"

### Empty States Pattern
- **Motivational headline** + **Action CTA**
- "Aún no hay rutinas. ¡Crea la primera!" (not "No se encontraron registros")
- "Sin alumnos todavía. Invitá al primero." (not "Lista vacía")

### Success States Pattern  
- Short, celebratory: "¡Guardado!", "¡Serie completa!", "¡Día terminado!"
- Use "!" sparingly but intentionally for achievement moments

---

## Motion & Effects (existing, to refine in later phases)

| Effect | Use | Duration |
|--------|-----|----------|
| `fade-up` | Page entrance, list items | 400ms ease-out |
| `check-bounce` | Set completion checkbox | 300ms spring |
| `pulse-glow` | Completed items ambient | 2s infinite |
| `stagger` | List item cascade (60ms increment) | 400ms per item |
| `press` | Interactive elements tactile feedback | 100ms (scale 0.96) |
| `glow-red` | Hover emphasis on cards | — |
| `glow-complete` | Completion celebration | — |
| `progress-fill` | Progress bar gradient | — |

---

## File Structure

```
public/
├── favicon.svg          # SVG favicon (mark in primary)
├── favicon.ico          # ICO fallback
├── logo-mark.svg        # Mark only (primary red)
└── logo-mark-white.svg  # Mark only (white for dark bg)

src/app/shared/ui/
└── logo.ts              # <cg-logo> Angular component
```
