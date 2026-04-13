import { Routes } from '@angular/router';
import { StudentShell } from '../../shared/layouts/student-shell';

export const STUDENT_ROUTES: Routes = [
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
