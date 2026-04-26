// Mock data para la vista de alumno — Lucía Martín
// Programa: Push Pull Legs · Semana 3 de 8 · Modo Rotación

const STUDENT = {
  id: 'u-lucia',
  name: 'Lucía Martín',
  firstName: 'Lucía',
  initials: 'LM',
  email: 'lucia.martin@example.com',
  avatarColor: '#E62639',
  memberSince: '2024-09',
  goal: 'Hipertrofia',
  weight: 58.2,
  bodyFat: 21.4,
  height: 167,
};

const COACH = {
  name: 'Mario Vega',
  initials: 'MV',
  handle: '@mariovega',
};

// Programa asignado: Push Pull Legs (3 rutinas, rotación, 8 semanas)
const PROGRAM = {
  id: 'p-ppl',
  name: 'Push Pull Legs · Hipertrofia',
  mode: 'Rotation',
  totalWeeks: 8,
  currentWeek: 3,
  suggestedDays: [1, 3, 5], // L, Mi, V
  startedAt: '2025-10-13',
  routines: [
    { id: 'r-push', name: 'Push · Pecho & Hombro', letter: 'A', focus: 'Pecho · Hombro · Tríceps' },
    { id: 'r-pull', name: 'Pull · Espalda & Bíceps', letter: 'B', focus: 'Espalda · Bíceps · Trapecio' },
    { id: 'r-legs', name: 'Legs · Cuádriceps & Glúteo', letter: 'C', focus: 'Cuádriceps · Glúteo · Femoral' },
  ],
};

// Rutina del día de hoy — Push (A)
const TODAY_ROUTINE = {
  id: 'r-push',
  name: 'Push · Pecho & Hombro',
  letter: 'A',
  focus: 'Pecho · Hombro · Tríceps',
  estimatedMinutes: 62,
  exercises: [
    {
      id: 'ex-1',
      name: 'Press banca con barra',
      muscleGroup: 'Pecho',
      equipment: 'Barra',
      videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg',
      note: 'Mantén omóplatos retraídos. Tocar pecho, no rebotar.',
      sets: [
        { id: 's1-1', type: 'warmup', targetReps: '10', targetWeight: 20, restSec: 60 },
        { id: 's1-2', type: 'warmup', targetReps: '8',  targetWeight: 35, restSec: 60 },
        { id: 's1-3', type: 'effective', targetReps: '8', targetWeight: 50, restSec: 120, lastSession: { weight: 47.5, reps: 8 } },
        { id: 's1-4', type: 'effective', targetReps: '8', targetWeight: 50, restSec: 120, lastSession: { weight: 47.5, reps: 8 } },
        { id: 's1-5', type: 'effective', targetReps: '8', targetWeight: 50, restSec: 120, lastSession: { weight: 47.5, reps: 7 } },
      ],
    },
    {
      id: 'ex-2',
      name: 'Press inclinado mancuernas',
      muscleGroup: 'Pecho',
      equipment: 'Mancuernas',
      videoUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8',
      note: 'Banco a 30°, no 45°.',
      sets: [
        { id: 's2-1', type: 'effective', targetReps: '10', targetWeight: 16, restSec: 90, lastSession: { weight: 14, reps: 10 } },
        { id: 's2-2', type: 'effective', targetReps: '10', targetWeight: 16, restSec: 90, lastSession: { weight: 14, reps: 10 } },
        { id: 's2-3', type: 'effective', targetReps: '10', targetWeight: 16, restSec: 90, lastSession: { weight: 14, reps: 9 } },
      ],
    },
    {
      id: 'ex-3',
      name: 'Press militar sentada',
      muscleGroup: 'Hombro',
      equipment: 'Barra',
      sets: [
        { id: 's3-1', type: 'effective', targetReps: '8', targetWeight: 25, restSec: 90, lastSession: { weight: 22.5, reps: 8 } },
        { id: 's3-2', type: 'effective', targetReps: '8', targetWeight: 25, restSec: 90, lastSession: { weight: 22.5, reps: 8 } },
        { id: 's3-3', type: 'effective', targetReps: '8', targetWeight: 25, restSec: 90, lastSession: { weight: 22.5, reps: 7 } },
      ],
    },
    {
      id: 'ex-4',
      name: 'Elevaciones laterales',
      muscleGroup: 'Hombro',
      equipment: 'Mancuernas',
      videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
      sets: [
        { id: 's4-1', type: 'effective', targetReps: '12', targetWeight: 7, restSec: 60, lastSession: { weight: 6, reps: 12 } },
        { id: 's4-2', type: 'effective', targetReps: '12', targetWeight: 7, restSec: 60, lastSession: { weight: 6, reps: 12 } },
        { id: 's4-3', type: 'dropset', targetReps: '12+AMRAP', targetWeight: 7, restSec: 60 },
      ],
    },
    {
      id: 'ex-5',
      name: 'Fondos en paralelas',
      muscleGroup: 'Tríceps',
      equipment: 'Peso corporal',
      sets: [
        { id: 's5-1', type: 'effective', targetReps: 'AMRAP', targetWeight: 0, restSec: 90, lastSession: { weight: 0, reps: 10 } },
        { id: 's5-2', type: 'effective', targetReps: 'AMRAP', targetWeight: 0, restSec: 90, lastSession: { weight: 0, reps: 9 } },
        { id: 's5-3', type: 'failure', targetReps: 'Al fallo', targetWeight: 0, restSec: 90 },
      ],
    },
  ],
};

// Historial de sesiones del mes (para calendario)
// currentMonth = noviembre 2025 (pivot de ejemplo)
const SESSIONS = [
  { date: '2025-10-27', routineId: 'r-push', routineName: 'Push',  status: 'completed', completedSets: 17, totalSets: 17, durationMin: 58 },
  { date: '2025-10-29', routineId: 'r-pull', routineName: 'Pull',  status: 'completed', completedSets: 16, totalSets: 16, durationMin: 62 },
  { date: '2025-10-31', routineId: 'r-legs', routineName: 'Legs',  status: 'completed', completedSets: 18, totalSets: 18, durationMin: 71 },
  { date: '2025-11-03', routineId: 'r-push', routineName: 'Push',  status: 'completed', completedSets: 17, totalSets: 17, durationMin: 60 },
  { date: '2025-11-05', routineId: 'r-pull', routineName: 'Pull',  status: 'completed', completedSets: 16, totalSets: 16, durationMin: 59 },
  { date: '2025-11-07', routineId: 'r-legs', routineName: 'Legs',  status: 'completed', completedSets: 18, totalSets: 18, durationMin: 68 },
  { date: '2025-11-10', routineId: 'r-push', routineName: 'Push',  status: 'completed', completedSets: 17, totalSets: 17, durationMin: 56 },
  { date: '2025-11-12', routineId: 'r-pull', routineName: 'Pull',  status: 'completed', completedSets: 16, totalSets: 16, durationMin: 61 },
  { date: '2025-11-14', routineId: 'r-legs', routineName: 'Legs',  status: 'missed', isPendingRecovery: true, recoveryDeadline: '2025-11-16' },
  // Hoy = sábado 15 nov; viernes 14 quedó pendiente de recuperar (deadline domingo 16)
];

// PRs recientes (detectados auto)
const RECORDS = [
  { id: 'pr-1', exerciseName: 'Press banca con barra',  muscleGroup: 'Pecho',      weight: 50,   reps: 8,  achievedAt: '2025-11-10', isNew: true },
  { id: 'pr-2', exerciseName: 'Press militar sentada',  muscleGroup: 'Hombro',     weight: 25,   reps: 8,  achievedAt: '2025-11-10', isNew: true },
  { id: 'pr-3', exerciseName: 'Sentadilla con barra',   muscleGroup: 'Cuádriceps', weight: 70,   reps: 5,  achievedAt: '2025-11-07' },
  { id: 'pr-4', exerciseName: 'Peso muerto rumano',     muscleGroup: 'Femoral',    weight: 65,   reps: 8,  achievedAt: '2025-11-05' },
  { id: 'pr-5', exerciseName: 'Dominadas lastradas',    muscleGroup: 'Espalda',    weight: 5,    reps: 6,  achievedAt: '2025-10-29' },
  { id: 'pr-6', exerciseName: 'Press inclinado mancuer.', muscleGroup: 'Pecho',    weight: 16,   reps: 10, achievedAt: '2025-10-27' },
];

// Medidas corporales (historial)
const METRICS = [
  { id: 'm-1', recordedAt: '2025-11-15', weight: 58.2, bodyFat: 21.4, notes: 'Me siento más fuerte esta semana', measurements: [
    { type: 'Cintura', value: 69 }, { type: 'Cadera', value: 94 }, { type: 'Muslo', value: 54 }, { type: 'Brazo', value: 28 },
  ]},
  { id: 'm-2', recordedAt: '2025-11-01', weight: 58.8, bodyFat: 22.1, notes: '', measurements: [
    { type: 'Cintura', value: 70 }, { type: 'Cadera', value: 94.5 },
  ]},
  { id: 'm-3', recordedAt: '2025-10-15', weight: 59.4, bodyFat: 22.8, notes: 'Inicio del programa', measurements: [
    { type: 'Cintura', value: 71 }, { type: 'Cadera', value: 95 },
  ]},
];

// Fotos de progreso
const PHOTOS = [
  { id: 'ph-1', angle: 'Front', takenAt: '2025-11-15', notes: 'Mes 2' },
  { id: 'ph-2', angle: 'Side',  takenAt: '2025-11-15', notes: 'Mes 2' },
  { id: 'ph-3', angle: 'Back',  takenAt: '2025-11-15', notes: 'Mes 2' },
  { id: 'ph-4', angle: 'Front', takenAt: '2025-10-15', notes: 'Inicio' },
  { id: 'ph-5', angle: 'Side',  takenAt: '2025-10-15', notes: 'Inicio' },
  { id: 'ph-6', angle: 'Back',  takenAt: '2025-10-15', notes: 'Inicio' },
];

// Comentarios del coach en rutinas
const COACH_NOTES = {
  'r-push': 'Lucía, esta semana bajamos el volumen pero subimos la intensidad. En press banca ya deberías poder con 50kg limpios — no dudes.',
  'r-pull': null,
  'r-legs': 'Cuida el rango en sentadilla. Mejor 5kg menos bien hechas que 5kg más a medias.',
};

// Rutina del viernes (perdida — pendiente de recuperar)
const LEGS_ROUTINE = {
  id: 'r-legs',
  name: 'Legs · Cuádriceps & Glúteo',
  letter: 'C',
  focus: 'Cuádriceps · Glúteo · Femoral',
  estimatedMinutes: 68,
  exercises: [
    { id: 'lex-1', name: 'Sentadilla con barra', muscleGroup: 'Cuádriceps', equipment: 'Barra',
      note: 'Profundidad por debajo de paralelo. Pies a la anchura de hombros.',
      sets: [
        { id: 'ls1-1', type: 'warmup', targetReps: '10', targetWeight: 30, restSec: 60 },
        { id: 'ls1-2', type: 'effective', targetReps: '5', targetWeight: 70, restSec: 150, lastSession: { weight: 67.5, reps: 5 } },
        { id: 'ls1-3', type: 'effective', targetReps: '5', targetWeight: 70, restSec: 150, lastSession: { weight: 67.5, reps: 5 } },
        { id: 'ls1-4', type: 'effective', targetReps: '5', targetWeight: 70, restSec: 150, lastSession: { weight: 67.5, reps: 4 } },
      ],
    },
    { id: 'lex-2', name: 'Peso muerto rumano', muscleGroup: 'Femoral', equipment: 'Barra',
      sets: [
        { id: 'ls2-1', type: 'effective', targetReps: '8', targetWeight: 65, restSec: 120, lastSession: { weight: 60, reps: 8 } },
        { id: 'ls2-2', type: 'effective', targetReps: '8', targetWeight: 65, restSec: 120, lastSession: { weight: 60, reps: 8 } },
        { id: 'ls2-3', type: 'effective', targetReps: '8', targetWeight: 65, restSec: 120, lastSession: { weight: 60, reps: 7 } },
      ],
    },
    { id: 'lex-3', name: 'Hip thrust', muscleGroup: 'Glúteo', equipment: 'Barra',
      sets: [
        { id: 'ls3-1', type: 'effective', targetReps: '12', targetWeight: 60, restSec: 90 },
        { id: 'ls3-2', type: 'effective', targetReps: '12', targetWeight: 60, restSec: 90 },
        { id: 'ls3-3', type: 'effective', targetReps: '12', targetWeight: 60, restSec: 90 },
      ],
    },
    { id: 'lex-4', name: 'Curl femoral tumbada', muscleGroup: 'Femoral', equipment: 'Máquina',
      sets: [
        { id: 'ls4-1', type: 'effective', targetReps: '12', targetWeight: 30, restSec: 60 },
        { id: 'ls4-2', type: 'effective', targetReps: '12', targetWeight: 30, restSec: 60 },
        { id: 'ls4-3', type: 'failure', targetReps: 'Al fallo', targetWeight: 25, restSec: 60 },
      ],
    },
  ],
};

window.KONDIX_DATA = {
  STUDENT, COACH, PROGRAM, TODAY_ROUTINE, LEGS_ROUTINE, SESSIONS, RECORDS, METRICS, PHOTOS, COACH_NOTES,
  TODAY_DATE: '2025-11-15', // sábado — viernes 14 quedó pendiente de recuperar
};
