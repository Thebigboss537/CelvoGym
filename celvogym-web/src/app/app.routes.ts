import { Routes } from '@angular/router';
import { trainerGuard, studentGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'invite/:token',
    loadComponent: () => import('./features/invite/feature/accept-invite').then(m => m.AcceptInvite),
  },
  {
    path: 'trainer',
    loadChildren: () => import('./features/trainer/trainer.routes').then(m => m.TRAINER_ROUTES),
    canActivate: [trainerGuard],
  },
  {
    path: 'workout',
    loadChildren: () => import('./features/student/student.routes').then(m => m.STUDENT_ROUTES),
    canActivate: [studentGuard],
  },
  { path: '', redirectTo: 'workout', pathMatch: 'full' },
  { path: '**', redirectTo: 'workout' },
];
