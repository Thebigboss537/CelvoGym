import { Routes } from '@angular/router';

export const ONBOARDING_ROUTES: Routes = [
  {
    path: 'setup',
    loadComponent: () => import('./feature/trainer-setup').then(m => m.TrainerSetup),
  },
  {
    path: 'pending',
    loadComponent: () => import('./feature/pending-approval').then(m => m.PendingApproval),
  },
  { path: '', redirectTo: 'setup', pathMatch: 'full' },
];
