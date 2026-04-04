import { Routes } from '@angular/router';

export const TRAINER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./feature/trainer-layout').then(m => m.TrainerLayout),
    children: [
      {
        path: 'routines',
        loadComponent: () => import('./routines/feature/routine-list').then(m => m.RoutineList),
      },
      {
        path: 'routines/new',
        loadComponent: () => import('./routines/feature/routine-form').then(m => m.RoutineForm),
      },
      {
        path: 'routines/:id',
        loadComponent: () => import('./routines/feature/routine-detail').then(m => m.RoutineDetail),
      },
      {
        path: 'routines/:id/edit',
        loadComponent: () => import('./routines/feature/routine-form').then(m => m.RoutineForm),
      },
      {
        path: 'programs',
        loadComponent: () => import('./programs/feature/program-list').then(m => m.ProgramList),
      },
      {
        path: 'programs/new',
        loadComponent: () => import('./programs/feature/program-form').then(m => m.ProgramForm),
      },
      {
        path: 'programs/:id',
        loadComponent: () => import('./programs/feature/program-form').then(m => m.ProgramForm),
      },
      {
        path: 'catalog',
        loadComponent: () => import('./catalog/feature/catalog-list').then(m => m.CatalogList),
      },
      {
        path: 'students',
        loadComponent: () => import('./students/feature/student-list').then(m => m.StudentList),
      },
      {
        path: 'students/:studentId',
        loadComponent: () => import('./students/feature/student-detail').then(m => m.StudentDetail),
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./feature/dashboard').then(m => m.Dashboard),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
