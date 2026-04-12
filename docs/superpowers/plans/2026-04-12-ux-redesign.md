# CelvoGym UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire CelvoGym frontend from scratch — immersive mobile workout mode for students, desktop workspace with sidebar for trainers — while keeping the same backend API, auth, and dark+crimson color palette.

**Architecture:** Angular 21 standalone components with signal inputs, Tailwind 4 with @theme tokens, Lucide icons. Two layout shells (StudentShell with bottom nav, TrainerShell with sidebar) wrap their respective feature routes. Workout mode uses full-screen routes outside the shell navigation. No new backend endpoints needed.

**Tech Stack:** Angular 21.2.6, Tailwind 4.2.2, NgRx Signals 21.1.0, Lucide Angular, TypeScript 5.9

**Spec:** `docs/superpowers/specs/2026-04-12-ux-redesign-design.md`
**Mockups:** `.superpowers/brainstorm/327-1776013152/content/*.html`

---

## File Map

### New Shared Components (`src/app/shared/ui/`)

| File | Responsibility |
|------|---------------|
| `bottom-nav.ts` | Bottom tab navigation for student (4 tabs) and trainer mobile (5 tabs) |
| `sidebar.ts` | Collapsible sidebar for trainer desktop/tablet |
| `stat-card.ts` | Reusable stat card (value, label, optional trend) |
| `progress-bar.ts` | Crimson gradient progress bar with label |
| `badge.ts` | Status badge (Active, Completed, Warning, etc.) |
| `segmented-control.ts` | Pill-style tab switcher |
| `timeline.ts` | Vertical timeline with colored dots |
| `day-cell.ts` | Calendar day cell with states (completed, today, scheduled, rest) |
| `rest-timer.ts` | Countdown timer with ±15s controls |
| `set-row.ts` | Single set row with KG/Reps/RPE inputs and check button |
| `wizard-stepper.ts` | Step indicator (step X of Y + progress bar) |
| `hero-card.ts` | Hero card for today's workout |
| `student-card.ts` | Student card with avatar, status dot, info |

### New Layout Shells (`src/app/shared/layouts/`)

| File | Responsibility |
|------|---------------|
| `student-shell.ts` | Bottom nav + router-outlet for student routes |
| `trainer-shell.ts` | Sidebar (desktop) / bottom nav (mobile) + router-outlet for trainer |

### New/Rewritten Student Pages (`src/app/features/student/feature/`)

| File | Status | Replaces |
|------|--------|----------|
| `home.ts` | New | — (new default page) |
| `calendar.ts` | Rewrite | Old calendar.ts |
| `day-detail.ts` | New | — |
| `workout-overview.ts` | New | Old workout.ts (partial) |
| `exercise-logging.ts` | New | Old workout.ts (partial) |
| `workout-complete.ts` | New | — |
| `progress.ts` | New | Replaces my-records.ts + body-tracking.ts |
| `profile.ts` | New | — |

### Rewritten Trainer Pages

| File | Status |
|------|--------|
| `trainer/feature/dashboard.ts` | Rewrite |
| `trainer/routines/feature/routine-list.ts` | Rewrite |
| `trainer/routines/feature/routine-wizard.ts` | New (replaces routine-form.ts) |
| `trainer/routines/feature/routine-detail.ts` | Rewrite |
| `trainer/programs/feature/program-list.ts` | Rewrite |
| `trainer/programs/feature/program-form.ts` | Rewrite |
| `trainer/programs/feature/program-detail.ts` | Rewrite |
| `trainer/students/feature/student-list.ts` | Rewrite |
| `trainer/students/feature/student-detail.ts` | Rewrite |
| `trainer/catalog/feature/catalog-list.ts` | Rewrite |

### Modified Files

| File | Changes |
|------|---------|
| `src/styles.css` | Add new @theme tokens, status colors, sidebar colors |
| `src/app/app.routes.ts` | Update route structure for new shells and pages |
| `src/app/shared/ui/index.ts` | Add exports for all new components |
| `src/app/shared/ui/avatar.ts` | Add gradient color support |
| `src/app/shared/ui/empty-state.ts` | Update with Lucide icon support |
| `src/app/shared/ui/page-header.ts` | Add breadcrumb and actions support |
| `src/app/features/student/student.routes.ts` | Rewrite for new page structure |
| `src/app/features/trainer/trainer.routes.ts` | Rewrite for new page structure |

### Files to Delete (Phase 8)

| File | Replaced by |
|------|------------|
| `student/feature/student-layout.ts` | `shared/layouts/student-shell.ts` |
| `student/feature/workout.ts` | `workout-overview.ts` + `exercise-logging.ts` |
| `student/feature/my-routines.ts` | Absorbed into `home.ts` + `calendar.ts` |
| `student/feature/my-records.ts` | Absorbed into `progress.ts` |
| `student/feature/body-tracking.ts` | Absorbed into `progress.ts` |
| `trainer/feature/trainer-layout.ts` | `shared/layouts/trainer-shell.ts` |
| `trainer/routines/feature/routine-form.ts` | `routine-wizard.ts` |

---

## Phase 1: Foundation

### Task 1: Install Lucide and update design tokens

**Files:**
- Modify: `celvogym-web/package.json`
- Modify: `celvogym-web/src/styles.css`

- [ ] **Step 1: Install lucide-angular**

```bash
cd celvogym-web && npm install lucide-angular
```

- [ ] **Step 2: Add new design tokens to styles.css**

Add these tokens inside the existing `@theme` block in `src/styles.css`:

```css
/* Add after existing set-type color tokens */
--color-bg-sidebar: #111113;
--color-border-active: rgba(230, 38, 57, 0.3);
--color-bg-active: rgba(230, 38, 57, 0.08);

--color-status-training: #22C55E;
--color-status-resting: #71717A;
--color-status-warning: #F59E0B;
--color-status-no-program: #A78BFA;
```

- [ ] **Step 3: Verify the app compiles**

```bash
cd celvogym-web && npx ng build --configuration=development 2>&1 | head -5
```

Expected: Build succeeds without errors.

- [ ] **Step 4: Commit**

```bash
cd celvogym-web && git add package.json package-lock.json src/styles.css
git commit -m "chore: install lucide-angular and add design tokens for redesign"
```

---

### Task 2: Create core shared components — stat-card, progress-bar, badge

**Files:**
- Create: `src/app/shared/ui/stat-card.ts`
- Create: `src/app/shared/ui/progress-bar.ts`
- Create: `src/app/shared/ui/badge.ts`
- Modify: `src/app/shared/ui/index.ts`

- [ ] **Step 1: Create stat-card component**

Create `src/app/shared/ui/stat-card.ts`:

```typescript
import { Component, input } from '@angular/core';

@Component({
  selector: 'cg-stat-card',
  template: `
    <div class="bg-card border border-border rounded-2xl p-5 text-center">
      <p class="text-text-muted text-[11px] font-semibold tracking-wide uppercase">{{ label() }}</p>
      <p class="text-2xl font-extrabold mt-2" [class]="valueColor()">{{ value() }}</p>
      @if (trend()) {
        <p class="text-xs mt-1" [class]="trendPositive() ? 'text-success' : 'text-text-secondary'">{{ trend() }}</p>
      }
    </div>
  `,
})
export class CgStatCard {
  value = input.required<string>();
  label = input.required<string>();
  trend = input<string>();
  valueColor = input<string>('text-text');
  trendPositive = input<boolean>(true);
}
```

- [ ] **Step 2: Create progress-bar component**

Create `src/app/shared/ui/progress-bar.ts`:

```typescript
import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'cg-progress-bar',
  template: `
    <div>
      @if (showLabel()) {
        <div class="flex justify-between mb-1.5">
          <span class="text-text-secondary text-xs font-semibold">{{ label() }}</span>
          <span class="text-primary text-xs font-bold">{{ percentage() }}%</span>
        </div>
      }
      <div class="h-1.5 bg-border rounded-full overflow-hidden" [class]="sizeClass()">
        <div class="h-full rounded-full transition-all duration-500"
             style="background: linear-gradient(90deg, #B31D2C, #E62639)"
             [style.width.%]="percentage()">
        </div>
      </div>
    </div>
  `,
})
export class CgProgressBar {
  percentage = input.required<number>();
  label = input<string>('');
  showLabel = input<boolean>(true);
  size = input<'sm' | 'md'>('sm');
  sizeClass = computed(() => this.size() === 'md' ? 'h-1.5' : 'h-1');
}
```

- [ ] **Step 3: Create badge component**

Create `src/app/shared/ui/badge.ts`:

```typescript
import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'cg-badge',
  template: `
    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold" [class]="variantClass()">
      @if (dot()) {
        <span class="w-1.5 h-1.5 rounded-full" [class]="dotClass()"></span>
      }
      {{ text() }}
    </span>
  `,
})
export class CgBadge {
  text = input.required<string>();
  variant = input<'success' | 'warning' | 'danger' | 'info' | 'neutral'>('neutral');
  dot = input<boolean>(false);

  variantClass = computed(() => {
    const map: Record<string, string> = {
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      danger: 'bg-danger/10 text-danger',
      info: 'bg-primary/10 text-primary',
      neutral: 'bg-border text-text-muted',
    };
    return map[this.variant()];
  });

  dotClass = computed(() => {
    const map: Record<string, string> = {
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      info: 'bg-primary',
      neutral: 'bg-text-muted',
    };
    return map[this.variant()];
  });
}
```

- [ ] **Step 4: Update barrel exports**

Add to `src/app/shared/ui/index.ts`:

```typescript
export { CgStatCard } from './stat-card';
export { CgProgressBar } from './progress-bar';
export { CgBadge } from './badge';
```

- [ ] **Step 5: Verify compilation**

```bash
cd celvogym-web && npx ng build --configuration=development 2>&1 | head -5
```

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/ui/stat-card.ts src/app/shared/ui/progress-bar.ts src/app/shared/ui/badge.ts src/app/shared/ui/index.ts
git commit -m "feat: add stat-card, progress-bar, badge shared components"
```

---

### Task 3: Create bottom-nav component

**Files:**
- Create: `src/app/shared/ui/bottom-nav.ts`
- Modify: `src/app/shared/ui/index.ts`

- [ ] **Step 1: Create bottom-nav component**

Create `src/app/shared/ui/bottom-nav.ts`:

```typescript
import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

export interface NavTab {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'cg-bottom-nav',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-bg-sidebar border-t border-border-light
                flex justify-around items-center px-3 pb-[env(safe-area-inset-bottom)] pt-2">
      @for (tab of tabs(); track tab.route) {
        <a [routerLink]="tab.route" routerLinkActive="active-tab" [routerLinkActiveOptions]="{ exact: tab.route === '.' }"
           class="flex flex-col items-center gap-1 flex-1 py-1.5 text-text-muted transition-colors
                  [&.active-tab]:text-primary">
          <lucide-icon [name]="tab.icon" [size]="22" [strokeWidth]="1.5"></lucide-icon>
          <span class="text-[10px] font-semibold">{{ tab.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    :host { display: block; }
  `,
})
export class CgBottomNav {
  tabs = input.required<NavTab[]>();
}
```

- [ ] **Step 2: Export from barrel**

Add to `src/app/shared/ui/index.ts`:

```typescript
export { CgBottomNav, type NavTab } from './bottom-nav';
```

- [ ] **Step 3: Verify compilation**

```bash
cd celvogym-web && npx ng build --configuration=development 2>&1 | head -5
```

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/ui/bottom-nav.ts src/app/shared/ui/index.ts
git commit -m "feat: add bottom-nav component with RouterLinkActive"
```

---

### Task 4: Create sidebar component

**Files:**
- Create: `src/app/shared/ui/sidebar.ts`
- Modify: `src/app/shared/ui/index.ts`

- [ ] **Step 1: Create sidebar component**

Create `src/app/shared/ui/sidebar.ts`. This is the trainer's desktop sidebar with:
- Logo + app name at top
- Navigation items with icons, labels, and optional count badges
- Active item highlight with crimson background
- "Crear nuevo" CTA button
- User profile at bottom
- Collapsible: full (≥1024px) or icon-only (768-1023px)

Component inputs:
- `items: SidebarItem[]` — nav items with `label`, `route`, `icon`, `count?`
- `userName: string` — trainer name
- `userInitials: string` — for avatar

Use `RouterLink`, `RouterLinkActive`, and `LucideAngularModule`. The sidebar should be a `<aside>` with fixed width (240px full, 56px collapsed) using Tailwind responsive classes: `w-14 lg:w-60`.

The "Crear nuevo" button emits an `(create)` output event.

- [ ] **Step 2: Export from barrel**

Add to `src/app/shared/ui/index.ts`:

```typescript
export { CgSidebar, type SidebarItem } from './sidebar';
```

- [ ] **Step 3: Verify compilation**

```bash
cd celvogym-web && npx ng build --configuration=development 2>&1 | head -5
```

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/ui/sidebar.ts src/app/shared/ui/index.ts
git commit -m "feat: add collapsible sidebar component for trainer layout"
```

---

### Task 5: Create layout shells and update routing

**Files:**
- Create: `src/app/shared/layouts/student-shell.ts`
- Create: `src/app/shared/layouts/trainer-shell.ts`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/features/student/student.routes.ts`
- Modify: `src/app/features/trainer/trainer.routes.ts`

- [ ] **Step 1: Create student shell**

Create `src/app/shared/layouts/student-shell.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CgBottomNav, NavTab } from '../ui/bottom-nav';

@Component({
  selector: 'cg-student-shell',
  imports: [RouterOutlet, CgBottomNav],
  template: `
    <main class="min-h-screen bg-bg pb-20 max-w-lg mx-auto">
      <router-outlet />
    </main>
    <cg-bottom-nav [tabs]="tabs" />
  `,
})
export class StudentShell {
  tabs: NavTab[] = [
    { label: 'Hoy', route: 'home', icon: 'home' },
    { label: 'Calendario', route: 'calendar', icon: 'calendar' },
    { label: 'Progreso', route: 'progress', icon: 'trending-up' },
    { label: 'Perfil', route: 'profile', icon: 'user' },
  ];
}
```

- [ ] **Step 2: Create trainer shell**

Create `src/app/shared/layouts/trainer-shell.ts`:

The trainer shell has two layouts depending on viewport:
- **Desktop (≥768px):** Sidebar on the left + `<router-outlet>` on the right
- **Mobile (<768px):** Bottom nav + `<router-outlet>` full width + FAB button

Use `@media` via Tailwind responsive classes. The sidebar is `hidden md:flex`. The bottom nav is `md:hidden`.

Component fetches trainer info from AuthStore to display in sidebar.

Sidebar items:
```typescript
sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', route: '.', icon: 'layout-dashboard' },
  { label: 'Rutinas', route: 'routines', icon: 'clipboard-list' },
  { label: 'Programas', route: 'programs', icon: 'package' },
  { label: 'Alumnos', route: 'students', icon: 'users' },
  { label: 'Catálogo', route: 'catalog', icon: 'dumbbell' },
];
```

Mobile bottom tabs:
```typescript
mobileTabs: NavTab[] = [
  { label: 'Inicio', route: '.', icon: 'layout-dashboard' },
  { label: 'Rutinas', route: 'routines', icon: 'clipboard-list' },
  { label: 'Programas', route: 'programs', icon: 'package' },
  { label: 'Alumnos', route: 'students', icon: 'users' },
  { label: 'Más', route: 'catalog', icon: 'menu' },
];
```

- [ ] **Step 3: Update student routes**

Rewrite `src/app/features/student/student.routes.ts` to use the new shell and pages. For now, use placeholder components that just show the page name — the real implementations come in later tasks.

```typescript
import { Routes } from '@angular/router';
import { StudentShell } from '../../shared/layouts/student-shell';

export const studentRoutes: Routes = [
  {
    path: '',
    component: StudentShell,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./feature/home').then(m => m.Home) },
      { path: 'calendar', loadComponent: () => import('./feature/calendar').then(m => m.Calendar) },
      { path: 'calendar/:date', loadComponent: () => import('./feature/day-detail').then(m => m.DayDetail) },
      { path: 'progress', loadComponent: () => import('./feature/progress').then(m => m.Progress) },
      { path: 'profile', loadComponent: () => import('./feature/profile').then(m => m.Profile) },
    ],
  },
  // Workout mode routes — OUTSIDE the shell (no bottom nav)
  { path: 'session/overview', loadComponent: () => import('./feature/workout-overview').then(m => m.WorkoutOverview) },
  { path: 'session/exercise/:index', loadComponent: () => import('./feature/exercise-logging').then(m => m.ExerciseLogging) },
  { path: 'session/complete', loadComponent: () => import('./feature/workout-complete').then(m => m.WorkoutComplete) },
];
```

**Important:** Workout mode routes are OUTSIDE the `StudentShell` children so they don't show the bottom nav.

- [ ] **Step 4: Update trainer routes**

Rewrite `src/app/features/trainer/trainer.routes.ts` similarly with TrainerShell and lazy-loaded pages.

```typescript
import { Routes } from '@angular/router';
import { TrainerShell } from '../../shared/layouts/trainer-shell';

export const trainerRoutes: Routes = [
  {
    path: '',
    component: TrainerShell,
    children: [
      { path: '', loadComponent: () => import('./feature/dashboard').then(m => m.Dashboard) },
      { path: 'routines', loadComponent: () => import('./routines/feature/routine-list').then(m => m.RoutineList) },
      { path: 'routines/new', loadComponent: () => import('./routines/feature/routine-wizard').then(m => m.RoutineWizard) },
      { path: 'routines/:id', loadComponent: () => import('./routines/feature/routine-detail').then(m => m.RoutineDetail) },
      { path: 'routines/:id/edit', loadComponent: () => import('./routines/feature/routine-wizard').then(m => m.RoutineWizard) },
      { path: 'programs', loadComponent: () => import('./programs/feature/program-list').then(m => m.ProgramList) },
      { path: 'programs/new', loadComponent: () => import('./programs/feature/program-form').then(m => m.ProgramForm) },
      { path: 'programs/:id', loadComponent: () => import('./programs/feature/program-detail').then(m => m.ProgramDetail) },
      { path: 'programs/:id/edit', loadComponent: () => import('./programs/feature/program-form').then(m => m.ProgramForm) },
      { path: 'students', loadComponent: () => import('./students/feature/student-list').then(m => m.StudentList) },
      { path: 'students/:id', loadComponent: () => import('./students/feature/student-detail').then(m => m.StudentDetail) },
      { path: 'catalog', loadComponent: () => import('./catalog/feature/catalog-list').then(m => m.CatalogList) },
    ],
  },
];
```

- [ ] **Step 5: Create placeholder components for new pages**

Create minimal placeholder components for pages that don't exist yet so routing compiles. Each is a simple component with just a title. Create these files:
- `src/app/features/student/feature/home.ts`
- `src/app/features/student/feature/day-detail.ts`
- `src/app/features/student/feature/progress.ts`
- `src/app/features/student/feature/profile.ts`
- `src/app/features/student/feature/workout-overview.ts`
- `src/app/features/student/feature/exercise-logging.ts`
- `src/app/features/student/feature/workout-complete.ts`
- `src/app/features/trainer/routines/feature/routine-wizard.ts`

Each placeholder follows this pattern:

```typescript
import { Component } from '@angular/core';

@Component({
  template: `<div class="p-6"><h1 class="text-h1 text-text">Nombre de la Página</h1><p class="text-text-muted mt-2">En construcción...</p></div>`,
})
export class ComponentName {}
```

- [ ] **Step 6: Verify full app compiles and routes work**

```bash
cd celvogym-web && npx ng build --configuration=development 2>&1 | head -5
```

- [ ] **Step 7: Commit**

```bash
git add src/app/shared/layouts/ src/app/features/student/ src/app/features/trainer/ src/app/app.routes.ts
git commit -m "feat: add layout shells (StudentShell, TrainerShell) and update routing"
```

---

## Phase 2: Student Home + Calendar

### Task 6: Create hero-card component

**Files:**
- Create: `src/app/shared/ui/hero-card.ts`
- Modify: `src/app/shared/ui/index.ts`

- [ ] **Step 1: Create hero-card component**

Create `src/app/shared/ui/hero-card.ts`. This is the "Tu entreno de hoy" card from the Home screen mockup (`student-nav-home.html`).

Inputs:
- `routineName: string` — e.g., "Push — Pecho y Tríceps"
- `exerciseCount: number`
- `estimatedMinutes: number`
- `routineLabel: string` — e.g., "Rutina A"
- `week: string` — e.g., "3/8"
- `session: number`
- `streak: number`
- `loading: boolean` (default false)

Output:
- `start: EventEmitter<void>`

Template: Crimson-tinted card with gradient background, routine info, 3 mini stat boxes (Semana, Sesión, Racha), and full-width "Empezar Entreno →" button. Refer to `student-nav-home.html` mockup for exact visual structure.

When `loading` is true, show a skeleton placeholder instead of the content.

- [ ] **Step 2: Export and verify**

Add to barrel exports. Run `npx ng build --configuration=development`.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/ui/hero-card.ts src/app/shared/ui/index.ts
git commit -m "feat: add hero-card component for student home"
```

---

### Task 7: Implement student Home page

**Files:**
- Modify: `src/app/features/student/feature/home.ts`

- [ ] **Step 1: Implement the Home page**

Replace the placeholder in `home.ts` with the full implementation. Refer to `student-nav-home.html` mockup.

The component should:
1. Inject `ApiService` and call these endpoints on init:
   - `GET /public/my/next-workout` → returns today's workout info (routine name, exercises, etc.)
   - `GET /public/my/program` → returns active program (week, total weeks, etc.)
   - `GET /public/my/records?limit=3` → returns recent PRs
2. Use signals for state: `loading`, `workout`, `program`, `records`, `weeklyStats`
3. Template structure (top to bottom):
   - Header: Date (formatted) + "Hola, {name}" greeting + avatar (from AuthStore)
   - `<cg-hero-card>` with data from next-workout endpoint
   - "Esta semana" section: 3 `<cg-stat-card>` (Entrenos, PRs nuevos, Volumen)
   - "PRs recientes" section: List of recent PR cards
4. When no workout today: Show `<cg-empty-state>` with motivational message and link to calendar
5. When no program assigned: Show `<cg-empty-state>` informing that the trainer hasn't assigned a program
6. The "Empezar Entreno" button navigates to `/workout/session/overview`

Use `Router` to navigate. Import `CgHeroCard`, `CgStatCard`, `CgEmptyState`, `CgSpinner`, `CgAvatar` from shared/ui.

- [ ] **Step 2: Verify in browser**

```bash
cd celvogym-web && npx ng serve
```

Open http://localhost:4200/workout/home. Check that the page loads, shows loading state, and renders data or empty state.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/student/feature/home.ts
git commit -m "feat: implement student home page with hero card and weekly stats"
```

---

### Task 8: Implement student Calendar page

**Files:**
- Modify: `src/app/features/student/feature/calendar.ts`
- Create: `src/app/shared/ui/day-cell.ts`

- [ ] **Step 1: Create day-cell component**

Create `src/app/shared/ui/day-cell.ts`. This is a single calendar day cell.

Inputs:
- `day: number`
- `state: 'completed' | 'today' | 'scheduled' | 'rest' | 'other-month'`
- `isToday: boolean` (default false)

Output:
- `select: EventEmitter<void>`

Template: Square cell (aspect-ratio: 1) with:
- `completed`: green background, green dot, bold green number
- `today`: crimson border with glow, crimson dot
- `scheduled`: neutral bg, faint crimson dot
- `rest`: neutral bg, gray number
- `other-month`: reduced opacity

Export from barrel.

- [ ] **Step 2: Rewrite calendar.ts**

Replace the current `calendar.ts` with new implementation. Refer to `student-calendar.html` mockup.

The component should:
1. Inject `ApiService` and `Router`
2. Call `GET /public/my/calendar?year={year}&month={month}` to get the month's data
3. Call `GET /public/my/program` for program progress info
4. State signals: `year`, `month`, `calendarDays`, `program`, `loading`
5. Computed: `monthName`, `daysGrid` (7×N grid with padding days from prev/next month)
6. Methods: `prevMonth()`, `nextMonth()`, `selectDay(date: string)` → navigates to `/workout/calendar/{date}`
7. Template:
   - Page header with title "Calendario" + program info
   - `<cg-progress-bar>` for program progress
   - Month navigation (← month →)
   - Day-of-week headers (LUN-DOM)
   - Grid of `<cg-day-cell>` components
   - Legend row (Completado, Hoy, Programado, Descanso)

- [ ] **Step 3: Verify in browser**

Open http://localhost:4200/workout/calendar. Check month navigation, day states, and tap on a day navigates correctly.

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/ui/day-cell.ts src/app/shared/ui/index.ts src/app/features/student/feature/calendar.ts
git commit -m "feat: implement calendar page with day-cell component and program progress"
```

---

### Task 9: Implement Day Detail page

**Files:**
- Modify: `src/app/features/student/feature/day-detail.ts`

- [ ] **Step 1: Implement day-detail.ts**

Replace the placeholder. Refer to `student-calendar.html` mockup (right panel).

The component should:
1. Read `:date` param from route using `input()` (Angular 21 route input binding)
2. Call `GET /public/my/calendar/{date}` or derive from calendar data — check what endpoint returns the routine assigned for a specific day. If the API returns calendar data per month, compute the day's routine from that data. Otherwise call the next-workout endpoint with a date parameter.
3. Display:
   - Header: Full date name + week of program
   - Assignment mode badges (Rotación/Fijo + Rutina position)
   - Routine card: name, program name, stats (exercises, sets, estimated time), muscle group tags, "Empezar Entreno →" CTA
   - Exercise preview list: each exercise with set type badge + previous weight
   - Last session reference: date, duration, total volume
4. Navigate to `/workout/session/overview` on CTA click
5. If day is completed: show session summary instead of CTA
6. If rest day: show simple empty state

- [ ] **Step 2: Verify in browser**

Navigate from calendar → tap a day → day detail loads.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/student/feature/day-detail.ts
git commit -m "feat: implement day detail page with routine preview and start CTA"
```

---

## Phase 3: Workout Mode

### Task 10: Create set-row and rest-timer components

**Files:**
- Create: `src/app/shared/ui/set-row.ts`
- Create: `src/app/shared/ui/rest-timer.ts`
- Modify: `src/app/shared/ui/index.ts`

- [ ] **Step 1: Create set-row component**

Create `src/app/shared/ui/set-row.ts`. Refer to `student-workout.html` mockup (set table).

Inputs:
- `setNumber: number`
- `setType: 'Warmup' | 'Effective' | 'DropSet' | 'RestPause' | 'AMRAP'`
- `state: 'completed' | 'active' | 'pending'`
- `kg: number | null`
- `reps: number | null`
- `rpe: number | null`
- `previousKg: number | null` — pre-fill suggestion from last session

Outputs:
- `complete: EventEmitter<{ kg: number; reps: number; rpe: number | null }>`
- `kgChange: EventEmitter<number>`
- `repsChange: EventEmitter<number>`
- `rpeChange: EventEmitter<number>`

Template: Grid row with 5 columns (SET | KG | REPS | RPE | CHECK). Set type badge uses colors from `--color-set-*` tokens. Active row has crimson border. Completed row has reduced opacity + green check. Input fields use `type="number"` with `inputmode="decimal"` for mobile numeric keyboard. Check button is a circle that fills on click.

- [ ] **Step 2: Create rest-timer component**

Create `src/app/shared/ui/rest-timer.ts`. Refer to `student-workout.html` mockup (rest timer section).

Inputs:
- `durationSeconds: number` — initial rest time (e.g., 90)
- `active: boolean` — whether timer is running

Outputs:
- `skip: EventEmitter<void>`
- `finished: EventEmitter<void>`

Behavior:
- When `active` becomes true, start counting down from `durationSeconds`
- Display time as `M:SS` in large text
- Buttons: -15s, +15s, "Saltar →"
- When timer reaches 0, emit `finished` and trigger vibration if `navigator.vibrate` is available
- Use `setInterval` in an `effect()` or `afterNextRender()` to avoid SSR issues (though this app is client-only)

- [ ] **Step 3: Export from barrel**

Add both to `src/app/shared/ui/index.ts`.

- [ ] **Step 4: Verify compilation**

```bash
cd celvogym-web && npx ng build --configuration=development 2>&1 | head -5
```

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/ui/set-row.ts src/app/shared/ui/rest-timer.ts src/app/shared/ui/index.ts
git commit -m "feat: add set-row and rest-timer components for workout logging"
```

---

### Task 11: Implement Workout Overview page

**Files:**
- Modify: `src/app/features/student/feature/workout-overview.ts`

- [ ] **Step 1: Implement workout-overview.ts**

Replace the placeholder. Refer to `student-workout.html` mockup (left panel — exercise list).

The component should:
1. Load the active session data. Check if there's an active session via `GET /public/my/sessions/active`. If not, create one by calling `POST /public/my/sessions` (or whatever the current API uses to start a workout).
2. Maintain state signals: `exercises`, `completedCount`, `totalCount`, `elapsedTime`, `loading`
3. Start a timer that counts up (total workout duration)
4. Template:
   - Top bar: "✕ Salir" (left, navigates back with confirmation), routine name + week (center), elapsed timer (right)
   - Progress bar: `<cg-progress-bar>` with `completedCount / totalCount * 100`
   - Exercise list: cards for each exercise with states:
     - Completed: green bg, check, weight + PR badge if applicable
     - Current: crimson bg with glow, "En curso →", sets X/Y
     - Pending: neutral, progressive opacity
   - Bottom CTA: "Continuar ejercicio →" navigates to `/workout/session/exercise/{currentIndex}`
5. The "Salir" button should show `<cg-confirm-dialog>` before navigating away

- [ ] **Step 2: Verify in browser**

Navigate from home → "Empezar Entreno" → workout overview loads with exercise list.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/student/feature/workout-overview.ts
git commit -m "feat: implement workout overview page with exercise states and progress"
```

---

### Task 12: Implement Exercise Logging page

**Files:**
- Modify: `src/app/features/student/feature/exercise-logging.ts`

- [ ] **Step 1: Implement exercise-logging.ts**

Replace the placeholder. Refer to `student-workout.html` mockup (right panel — set logging).

The component should:
1. Read `:index` from route params — this is the exercise index within the current session
2. Load the exercise data from the active session (already fetched or re-fetch)
3. Load previous session data for this exercise for pre-fill suggestions
4. State signals: `exercise`, `sets`, `showRestTimer`, `restDuration`, `loading`
5. Template:
   - Top bar: "← Volver" (back to overview), "Ejercicio X/Y" (center), info button (right)
   - Exercise name (large, centered) + muscle group subtitle
   - Video thumbnail (if exercise has video URL) — tap opens video in modal/expanded
   - Trainer notes: crimson left-border quote block (if exercise has notes from trainer)
   - Previous session reference: "Sesión anterior: 30kg × 10, 10, 8, 7"
   - Set table header: SET | KG | REPS | RPE | ✓
   - `@for` loop of `<cg-set-row>` components for each set
   - `<cg-rest-timer>` shown when `showRestTimer` is true
6. Behavior:
   - When a set is completed (check tapped): call `PUT /public/my/sets/{setId}` with kg, reps, rpe
   - After completing a set: show rest timer
   - When rest timer finishes or is skipped: hide timer, focus next set
   - When all sets completed: auto-navigate to next exercise or back to overview
   - Pre-fill kg field with previous session's value for the same set position

- [ ] **Step 2: Verify in browser**

Navigate through: overview → tap exercise → logging page shows sets.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/student/feature/exercise-logging.ts
git commit -m "feat: implement exercise logging page with set tracking and rest timer"
```

---

### Task 13: Implement Workout Complete page

**Files:**
- Modify: `src/app/features/student/feature/workout-complete.ts`

- [ ] **Step 1: Implement workout-complete.ts**

Replace the placeholder. This is the celebration screen shown after completing all exercises.

The component should:
1. Load session summary data (the active session should now be complete)
2. Template:
   - Celebration animation: use existing `.animate-complete` and `.animate-badge` CSS classes. Add a confetti-like glow effect using crimson gradient.
   - "¡Entreno Completado!" title with large check animation
   - Summary cards: Duración total, Volumen total (kg), Sets completados
   - PRs logrados section: list any new PRs with exercise name + weight + "🏆 Nuevo PR" badge
   - Comparison vs. last session: volume change (+/- percentage)
   - "Volver al inicio" CTA → navigates to `/workout/home`
3. Mark the session as complete via API if not already done

- [ ] **Step 2: Verify in browser**

Complete a mock workout flow and verify the celebration screen renders.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/student/feature/workout-complete.ts
git commit -m "feat: implement workout complete page with celebration and summary"
```

---

## Phase 4: Student Progress + Profile

### Task 14: Create segmented-control component

**Files:**
- Create: `src/app/shared/ui/segmented-control.ts`
- Modify: `src/app/shared/ui/index.ts`

- [ ] **Step 1: Create segmented-control component**

Create `src/app/shared/ui/segmented-control.ts`. Pill-style tab switcher.

Inputs:
- `options: string[]` — tab labels (e.g., ['Records', 'Medidas', 'Fotos'])
- `selected: string` — currently selected

Output:
- `selectedChange: EventEmitter<string>`

Template: Container with `bg-card border border-border rounded-xl p-1`, each option is a button that gets `bg-primary text-white` when selected, `bg-transparent text-text-muted` when not.

- [ ] **Step 2: Export and commit**

```bash
git add src/app/shared/ui/segmented-control.ts src/app/shared/ui/index.ts
git commit -m "feat: add segmented-control component for tab switching"
```

---

### Task 15: Implement student Progress page

**Files:**
- Modify: `src/app/features/student/feature/progress.ts`

- [ ] **Step 1: Implement progress.ts**

Replace the placeholder. Refer to `student-progress-profile.html` mockup (left panel).

The component unifies Records, Medidas, and Fotos in one page with `<cg-segmented-control>`.

Signal: `activeTab = signal('Records')`

**Records tab:**
1. Call `GET /public/my/records` for PR list
2. Show 3 `<cg-stat-card>` (PRs totales, Este mes, Tendencia volumen)
3. List of exercise PR cards: name, best mark, progress badge (+kg / = Igual), mini `<cg-line-chart>` sparkline

**Medidas tab:**
1. Call `GET /public/my/body-metrics` for measurement history
2. Weight trend chart using `<cg-line-chart>`
3. Body fat percentage chart
4. List of circumference measurements
5. "Registrar medida" button → shows inline form (reuse existing body-tracking form logic)

**Fotos tab:**
1. Call `GET /public/my/body-metrics` (photos are part of body metrics)
2. Photo gallery by date
3. "Nueva foto" button → file input
4. Simple before/after comparison (two photos side by side with date labels)

Use `@switch (activeTab())` to render the active tab content.

- [ ] **Step 2: Verify in browser**

Open http://localhost:4200/workout/progress. Switch between tabs. Verify data loads.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/student/feature/progress.ts
git commit -m "feat: implement progress page unifying records, measurements, and photos"
```

---

### Task 16: Implement student Profile page

**Files:**
- Modify: `src/app/features/student/feature/profile.ts`

- [ ] **Step 1: Implement profile.ts**

Replace the placeholder. Refer to `student-progress-profile.html` mockup (right panel).

The component should:
1. Get user info from `AuthStore`
2. Call `GET /public/my/program` for active program
3. Template:
   - Avatar with crimson glow + name + "Miembro desde {date}"
   - 3 stat cards: Sesiones totales, Racha actual, PRs totales
   - "Mi Entrenador" section: trainer card with avatar, name, 💬 button
   - "Programa Actual" section: program card with name, mode, routines, `<cg-progress-bar>`
   - Menu items: Configuración →, Notificaciones →, Cerrar sesión → (red, calls logout)
4. Logout calls the CelvoGuard logout endpoint and redirects to `/auth`

- [ ] **Step 2: Verify in browser**

- [ ] **Step 3: Commit**

```bash
git add src/app/features/student/feature/profile.ts
git commit -m "feat: implement student profile page with trainer info and program status"
```

---

## Phase 5: Trainer Dashboard

### Task 17: Create student-card and timeline components

**Files:**
- Create: `src/app/shared/ui/student-card.ts`
- Create: `src/app/shared/ui/timeline.ts`
- Modify: `src/app/shared/ui/index.ts`

- [ ] **Step 1: Create student-card component**

Create `src/app/shared/ui/student-card.ts`.

Inputs:
- `name: string`
- `initials: string`
- `gradientFrom: string` — start color for avatar gradient
- `gradientTo: string` — end color
- `subtitle: string` — e.g., "Hipertrofia 8 sem · S3"
- `status: 'training' | 'completed' | 'warning' | 'resting' | 'no-program'`
- `statusText: string` — e.g., "Entrenando", "3 días sin entrenar"
- `selected: boolean` (default false)

Output:
- `select: EventEmitter<void>`

Template: Card with avatar (gradient bg), name, subtitle, and status dot/text. When `selected`, add crimson background.

- [ ] **Step 2: Create timeline component**

Create `src/app/shared/ui/timeline.ts`.

Input:
- `items: TimelineItem[]`

```typescript
export interface TimelineItem {
  color: 'success' | 'info' | 'neutral';
  title: string;
  subtitle: string;
}
```

Template: Vertical line with colored dots and text entries. Refer to trainer student-detail mockup.

- [ ] **Step 3: Export from barrel and commit**

```bash
git add src/app/shared/ui/student-card.ts src/app/shared/ui/timeline.ts src/app/shared/ui/index.ts
git commit -m "feat: add student-card and timeline components"
```

---

### Task 18: Rewrite trainer Dashboard

**Files:**
- Modify: `src/app/features/trainer/feature/dashboard.ts`

- [ ] **Step 1: Rewrite dashboard.ts**

Replace the current dashboard with the new design. Refer to `trainer-nav-dashboard.html` mockup.

The component should:
1. Call `GET /dashboard` (existing endpoint) for stats + recent activity
2. Template:
   - Header: date + "Buenos días, {name}" + notification bell with badge
   - 4 `<cg-stat-card>` in grid: Alumnos activos, Entrenos hoy, Programas activos, Adherencia semanal %
   - Two-column layout (desktop), stacked (mobile):
     - **Left (lg:col-span-7):** "Actividad de alumnos" — list of `<cg-student-card>` components with live status. "Ver todos →" link to /trainer/students
     - **Right (lg:col-span-5):** "Alertas" section (warning cards for expiring programs, new PRs, accepted invites) + "Acciones rápidas" (Crear rutina, Crear programa, Invitar alumno — buttons that navigate to respective pages)
3. Use Tailwind `grid grid-cols-1 lg:grid-cols-12` for responsive layout

- [ ] **Step 2: Verify in browser**

Open http://localhost:4200/trainer. Dashboard should render with stats and activity.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/trainer/feature/dashboard.ts
git commit -m "feat: rewrite trainer dashboard with activity feed and alerts"
```

---

## Phase 6: Trainer Routine Builder

### Task 19: Create wizard-stepper component

**Files:**
- Create: `src/app/shared/ui/wizard-stepper.ts`
- Modify: `src/app/shared/ui/index.ts`

- [ ] **Step 1: Create wizard-stepper component**

Create `src/app/shared/ui/wizard-stepper.ts`.

Inputs:
- `currentStep: number`
- `totalSteps: number`
- `stepLabel: string` — e.g., "Paso 1 de 4"

Template: Crimson pill badge showing step label + progress bar showing `currentStep / totalSteps * 100`.

- [ ] **Step 2: Export and commit**

```bash
git add src/app/shared/ui/wizard-stepper.ts src/app/shared/ui/index.ts
git commit -m "feat: add wizard-stepper component"
```

---

### Task 20: Implement Routine Wizard

**Files:**
- Create: `src/app/features/trainer/routines/feature/routine-wizard.ts`

- [ ] **Step 1: Implement routine-wizard.ts**

This is the most complex component. Refer to `trainer-routine-builder.html` mockup.

The component manages 4 steps using a signal `currentStep = signal(1)`.

**Data model (local signals):**
```typescript
routineName = signal('');
category = signal('');
description = signal('');
days = signal<WizardDay[]>([]);
```

```typescript
interface WizardDay {
  name: string;
  exercises: WizardExercise[];
}

interface WizardExercise {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  groupType: string;
  sets: WizardSet[];
  videoUrl: string;
  notes: string;
}

interface WizardSet {
  type: 'Warmup' | 'Effective' | 'DropSet' | 'RestPause' | 'AMRAP';
  targetReps: string;
  restSeconds: number;
  notes: string;
}
```

**Step 1 template:** Name input, category chips, description textarea, navigation buttons.

**Step 2 template:** List of days with name inputs, reorder/delete buttons, "Agregar día" button.

**Step 3 template:** Left panel with day tabs. Right panel with exercise list for the selected day. Each exercise is an accordion — expandable to show the set configuration table. "Agregar ejercicio del catálogo" button opens a modal/drawer with the catalog list for selection.

**Step 4 template:** Read-only summary of the entire routine for review. "Guardar rutina" button calls the API.

**Edit mode:** If route has `:id` param, load the existing routine via `GET /routines/{id}` and populate all signals. The API call on save is `PUT /routines/{id}` instead of `POST /routines`.

**Save logic:** Transform the local wizard data model into the API's `CreateRoutineRequest` DTO and call `POST /routines` (or `PUT /routines/{id}` for edit). On success, navigate to `/trainer/routines/{id}`.

- [ ] **Step 2: Verify in browser**

Navigate to /trainer/routines/new. Step through all 4 wizard steps.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/trainer/routines/feature/routine-wizard.ts
git commit -m "feat: implement 4-step routine wizard builder"
```

---

### Task 21: Rewrite Routine List and Detail

**Files:**
- Modify: `src/app/features/trainer/routines/feature/routine-list.ts`
- Modify: `src/app/features/trainer/routines/feature/routine-detail.ts`

- [ ] **Step 1: Rewrite routine-list.ts**

Redesign with:
1. Header: "Rutinas" + "+ Nueva rutina" button (navigates to `routines/new`)
2. Category filter chips: Todas, Hipertrofia, Fuerza, Resistencia, Funcional
3. Routine cards: name, category badge, exercise count, day count, last edit date
4. Context menu (⋯): Editar → `routines/{id}/edit`, Duplicar → `POST /routines/{id}/duplicate`, Eliminar → confirm dialog + `DELETE /routines/{id}`

- [ ] **Step 2: Rewrite routine-detail.ts**

Redesign with:
1. Breadcrumb: Rutinas / {routine name}
2. Header: routine name + category badge + action buttons (Editar, Duplicar, Eliminar)
3. Description (if any)
4. For each day: collapsible section with exercise list and set details (read-only)

- [ ] **Step 3: Verify in browser**

- [ ] **Step 4: Commit**

```bash
git add src/app/features/trainer/routines/feature/routine-list.ts src/app/features/trainer/routines/feature/routine-detail.ts
git commit -m "feat: redesign routine list and detail pages"
```

---

## Phase 7: Trainer Programs, Students, Catalog

### Task 22: Rewrite Program List and Form

**Files:**
- Modify: `src/app/features/trainer/programs/feature/program-list.ts`
- Modify: `src/app/features/trainer/programs/feature/program-form.ts`
- Modify: `src/app/features/trainer/programs/feature/program-detail.ts`

- [ ] **Step 1: Rewrite program-list.ts**

Redesign with:
1. Header + "+ Nuevo programa" button
2. Filter chips: Todos, Activos, Completados
3. Grid of program cards (2 cols desktop, 1 mobile):
   - Status badge (Activo/Completado)
   - Name, info (routines, mode, duration)
   - Assigned student avatars + count
   - Progress bar (active only)
   - Context menu

- [ ] **Step 2: Rewrite program-form.ts**

Redesign with:
1. Name input
2. Duration (number + "semanas")
3. Mode toggle: Rotación | Fijo
4. Routine selection with ordered labels (A, B, C...) and reorder
5. Training days: 7-button weekday toggle (LUN-DOM)
6. Cancel / Create buttons

Edit mode: load existing program data if `:id` is present.

- [ ] **Step 3: Rewrite program-detail.ts**

Redesign with:
1. Header with status badge + actions
2. Program info: duration, mode, training days
3. Routine list with order labels
4. Assigned students list
5. Action: "Asignar a alumno" button

- [ ] **Step 4: Verify in browser**

- [ ] **Step 5: Commit**

```bash
git add src/app/features/trainer/programs/feature/
git commit -m "feat: redesign program list, form, and detail pages"
```

---

### Task 23: Rewrite Student List (master-detail) and Detail

**Files:**
- Modify: `src/app/features/trainer/students/feature/student-list.ts`
- Modify: `src/app/features/trainer/students/feature/student-detail.ts`

- [ ] **Step 1: Rewrite student-list.ts**

Redesign as master-detail layout. Refer to `trainer-students-programs-catalog.html` mockup.

**Desktop (≥1024px):** Two panels side by side:
- Left panel (320px): search input + list of `<cg-student-card>` components
- Right panel (flex:1): `<cg-student-detail>` for selected student (inline, not routed)

**Mobile (<1024px):** Only the list. Tap navigates to `/trainer/students/{id}`.

Use a `selectedStudentId` signal. When a student card is clicked on desktop, update the signal and load detail data inline. On mobile, navigate via router.

- [ ] **Step 2: Rewrite student-detail.ts**

This serves as both:
- The right panel content on desktop (embedded in student-list)
- A standalone page on mobile (via routing)

Redesign with:
1. Student header: large avatar, name, email, date, action buttons
2. 4 stat cards: Sesiones, Adherencia %, Racha, PRs
3. Current program card with progress bar
4. Activity `<cg-timeline>`: recent sessions, body measurements, etc.

The component should accept either a student ID via route param (mobile) or via input signal (desktop embedding).

- [ ] **Step 3: Verify in browser**

- [ ] **Step 4: Commit**

```bash
git add src/app/features/trainer/students/feature/
git commit -m "feat: redesign student list as master-detail and student detail with timeline"
```

---

### Task 24: Rewrite Catalog List

**Files:**
- Modify: `src/app/features/trainer/catalog/feature/catalog-list.ts`

- [ ] **Step 1: Rewrite catalog-list.ts**

Redesign with:
1. Header + "+ Nuevo ejercicio" button
2. Search input + muscle group filter chips
3. Exercise grid (4 cols desktop, 2 mobile): thumbnail placeholder, name, muscle group, type (Compuesto/Aislado)
4. Tap opens edit/view. Create new opens inline form or modal.

Refer to `trainer-students-programs-catalog.html` mockup (bottom section).

- [ ] **Step 2: Verify in browser**

- [ ] **Step 3: Commit**

```bash
git add src/app/features/trainer/catalog/feature/catalog-list.ts
git commit -m "feat: redesign exercise catalog with grid layout and muscle group filters"
```

---

## Phase 8: Cleanup and Polish

### Task 25: Update avatar component with gradient support

**Files:**
- Modify: `src/app/shared/ui/avatar.ts`

- [ ] **Step 1: Add gradient color input**

Update `avatar.ts` to support a `gradient` input with predefined color pairs. If no gradient is provided, use the existing solid color behavior.

```typescript
gradient = input<'crimson' | 'purple' | 'amber' | 'cyan' | 'pink' | 'blue'>();
```

Map each to a `background: linear-gradient(135deg, from, to)` style. Update the template to use `[style.background]` when gradient is set.

- [ ] **Step 2: Commit**

```bash
git add src/app/shared/ui/avatar.ts
git commit -m "feat: add gradient color support to avatar component"
```

---

### Task 26: Update empty-state and page-header components

**Files:**
- Modify: `src/app/shared/ui/empty-state.ts`
- Modify: `src/app/shared/ui/page-header.ts`

- [ ] **Step 1: Update empty-state with Lucide icon support**

Add an `icon` input (Lucide icon name string). When provided, render a `<lucide-icon>` instead of the current SVG. Import `LucideAngularModule`.

- [ ] **Step 2: Update page-header with breadcrumb support**

Add a `breadcrumbs` input: `{ label: string; route?: string }[]`. When provided, render a breadcrumb trail above the title using `<a routerLink>` for items with a route.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/ui/empty-state.ts src/app/shared/ui/page-header.ts
git commit -m "feat: enhance empty-state with Lucide icons and page-header with breadcrumbs"
```

---

### Task 27: Delete old files and final cleanup

**Files:**
- Delete: `src/app/features/student/feature/student-layout.ts`
- Delete: `src/app/features/student/feature/workout.ts`
- Delete: `src/app/features/student/feature/my-routines.ts`
- Delete: `src/app/features/student/feature/my-records.ts`
- Delete: `src/app/features/student/feature/body-tracking.ts`
- Delete: `src/app/features/trainer/feature/trainer-layout.ts`
- Delete: `src/app/features/trainer/routines/feature/routine-form.ts`

- [ ] **Step 1: Verify no imports reference old files**

```bash
cd celvogym-web && grep -r "student-layout\|workout'\|my-routines\|my-records\|body-tracking\|trainer-layout\|routine-form" src/app/ --include="*.ts" -l
```

Fix any remaining imports found. The routes files should already be updated from Task 5. Check `app.routes.ts` to make sure it doesn't reference old layout components.

- [ ] **Step 2: Delete old files**

```bash
cd celvogym-web
rm src/app/features/student/feature/student-layout.ts
rm src/app/features/student/feature/workout.ts
rm src/app/features/student/feature/my-routines.ts
rm src/app/features/student/feature/my-records.ts
rm src/app/features/student/feature/body-tracking.ts
rm src/app/features/trainer/feature/trainer-layout.ts
rm src/app/features/trainer/routines/feature/routine-form.ts
```

- [ ] **Step 3: Verify full build passes**

```bash
cd celvogym-web && npx ng build --configuration=development 2>&1 | tail -3
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old layout and page files replaced by redesign"
```

---

### Task 28: Full browser testing with Playwright MCP

- [ ] **Step 1: Start the dev server**

```bash
cd celvogym-web && npx ng serve
```

- [ ] **Step 2: Test student flows**

Using Playwright MCP browser tools, test:
1. Login as student → redirects to /workout/home
2. Home page shows hero card (or empty state if no program)
3. Bottom nav: tap each tab (Hoy, Calendario, Progreso, Perfil)
4. Calendar: month view renders, tap a day → day detail loads
5. Day detail: routine info shows, tap "Empezar Entreno" → workout overview
6. Workout overview: exercise list renders with states
7. Tap exercise → exercise logging page with set table
8. Complete a set → rest timer appears
9. Navigate between exercises
10. Progress page: switch between Records/Medidas/Fotos tabs
11. Profile page: trainer info, program, logout works

- [ ] **Step 3: Test trainer flows**

Using Playwright MCP browser tools, test:
1. Login as trainer → redirects to /trainer
2. Dashboard: stats, student activity, alerts render
3. Sidebar navigation: click each item
4. Routines: list renders, click "+ Nueva rutina" → wizard step 1
5. Wizard: navigate all 4 steps, verify step progress indicator
6. Programs: list, create new, assignment mode toggle
7. Students: master-detail layout on desktop, search works
8. Catalog: grid renders, search/filter works
9. Mobile: resize browser → sidebar collapses to bottom tabs
10. Mobile: FAB button visible on mobile trainer view

- [ ] **Step 4: Fix any issues found**

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix: address issues found during full browser testing"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1: Foundation | 1-5 | Lucide, design tokens, shared components, layout shells, routing |
| 2: Student Home + Calendar | 6-9 | Home with hero card, calendar with day detail |
| 3: Workout Mode | 10-13 | Full-screen workout logging, exercise by exercise, rest timer |
| 4: Student Progress + Profile | 14-16 | Unified progress page, student profile |
| 5: Trainer Dashboard | 17-18 | Dashboard with activity feed and alerts |
| 6: Trainer Routine Builder | 19-21 | 4-step wizard, routine list/detail redesign |
| 7: Trainer Programs/Students/Catalog | 22-24 | All remaining trainer pages |
| 8: Cleanup + Polish | 25-28 | Component enhancements, old file removal, full testing |

**Total: 28 tasks across 8 phases. Each phase produces working, testable software.**
