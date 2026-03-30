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
        path: 'students',
        loadComponent: () => import('./students/feature/student-list').then(m => m.StudentList),
      },
      { path: '', redirectTo: 'routines', pathMatch: 'full' },
    ],
  },
];
