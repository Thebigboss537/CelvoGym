import { Routes } from '@angular/router';
import { TrainerShell } from '../../shared/layouts/trainer-shell';

export const TRAINER_ROUTES: Routes = [
  {
    path: '',
    component: TrainerShell,
    children: [
      { path: '', loadComponent: () => import('./feature/dashboard').then(m => m.Dashboard) },
      { path: 'routines', loadComponent: () => import('./routines/feature/routine-list').then(m => m.RoutineList) },
      { path: 'routines/new', loadComponent: () => import('./routines/feature/routine-editor').then(m => m.RoutineEditor) },
      { path: 'routines/:id', loadComponent: () => import('./routines/feature/routine-detail').then(m => m.RoutineDetail) },
      { path: 'routines/:id/edit', loadComponent: () => import('./routines/feature/routine-editor').then(m => m.RoutineEditor) },
      { path: 'programs', loadComponent: () => import('./programs/feature/program-list').then(m => m.ProgramList) },
      { path: 'programs/:id', loadComponent: () => import('./programs/feature/program-form').then(m => m.ProgramEditorPage) },
      { path: 'programs/:id/edit', loadComponent: () => import('./programs/feature/program-form').then(m => m.ProgramEditorPage) },
      { path: 'students', loadComponent: () => import('./students/feature/student-list').then(m => m.StudentList) },
      { path: 'students/:studentId', loadComponent: () => import('./students/feature/student-detail').then(m => m.StudentDetail) },
      { path: 'catalog', loadComponent: () => import('./catalog/feature/catalog-list').then(m => m.CatalogList) },
    ],
  },
];
