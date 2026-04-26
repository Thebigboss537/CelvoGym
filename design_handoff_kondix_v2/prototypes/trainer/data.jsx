// Data seed aligned to Kondix's real model (GroupType, SetType, VideoSource)

const GROUP_TYPES = ['Single', 'Superset', 'Triset', 'Circuit'];
const SET_TYPES = ['Warmup', 'Effective', 'DropSet', 'RestPause', 'AMRAP'];
const SET_TYPE_LABELS = {
  Warmup: 'Calent.',
  Effective: 'Efectiva',
  DropSet: 'Drop set',
  RestPause: 'Rest-pause',
  AMRAP: 'AMRAP',
};
const CATEGORIES = ['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Otro'];

const EXERCISE_CATALOG = [
  { id: 'bench-press', name: 'Press de banca', muscleGroup: 'Pecho' },
  { id: 'incline-db-press', name: 'Press inclinado con mancuernas', muscleGroup: 'Pecho' },
  { id: 'cable-fly', name: 'Aperturas en polea', muscleGroup: 'Pecho' },
  { id: 'pushup', name: 'Flexiones', muscleGroup: 'Pecho' },
  { id: 'pullup', name: 'Dominadas', muscleGroup: 'Espalda' },
  { id: 'lat-pulldown', name: 'Jalón al pecho', muscleGroup: 'Espalda' },
  { id: 'barbell-row', name: 'Remo con barra', muscleGroup: 'Espalda' },
  { id: 'seated-row', name: 'Remo sentado', muscleGroup: 'Espalda' },
  { id: 'ohp', name: 'Press militar', muscleGroup: 'Hombros' },
  { id: 'lateral-raise', name: 'Elevaciones laterales', muscleGroup: 'Hombros' },
  { id: 'face-pull', name: 'Face pull', muscleGroup: 'Hombros' },
  { id: 'bicep-curl', name: 'Curl de bíceps', muscleGroup: 'Bíceps' },
  { id: 'hammer-curl', name: 'Curl martillo', muscleGroup: 'Bíceps' },
  { id: 'tricep-pushdown', name: 'Extensión de tríceps en polea', muscleGroup: 'Tríceps' },
  { id: 'skull-crusher', name: 'Press francés', muscleGroup: 'Tríceps' },
  { id: 'squat', name: 'Sentadilla', muscleGroup: 'Piernas' },
  { id: 'front-squat', name: 'Sentadilla frontal', muscleGroup: 'Piernas' },
  { id: 'deadlift', name: 'Peso muerto', muscleGroup: 'Piernas' },
  { id: 'rdl', name: 'Peso muerto rumano', muscleGroup: 'Piernas' },
  { id: 'leg-press', name: 'Prensa de piernas', muscleGroup: 'Piernas' },
  { id: 'leg-curl', name: 'Curl femoral', muscleGroup: 'Piernas' },
  { id: 'leg-extension', name: 'Extensión de cuádriceps', muscleGroup: 'Piernas' },
  { id: 'calf-raise', name: 'Elevación de gemelos', muscleGroup: 'Piernas' },
  { id: 'plank', name: 'Plancha', muscleGroup: 'Core' },
  { id: 'hip-thrust', name: 'Hip thrust', muscleGroup: 'Glúteos' },
];

const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);

function newSet(overrides = {}) {
  return {
    id: uid('s'),
    setType: 'Effective',
    targetReps: '',
    targetWeight: '',
    targetRpe: null,
    restSeconds: 90,
    ...overrides,
  };
}

function newExercise(overrides = {}) {
  return {
    id: uid('e'),
    catalogId: null,
    name: '',
    muscleGroup: null,
    notes: '',
    tempo: '',
    videoSource: 'None',
    videoUrl: '',
    sets: [newSet()],
    ...overrides,
  };
}

function newGroup(overrides = {}) {
  return {
    id: uid('g'),
    groupType: 'Single',
    restSeconds: 90,
    exercises: [],
    ...overrides,
  };
}

function newDay(name = '') {
  return {
    id: uid('d'),
    name,
    groups: [newGroup({ exercises: [newExercise()] })],
  };
}

// Seed routine
function seedRoutine() {
  const benchEx = newExercise({
    catalogId: 'bench-press', name: 'Press de banca', muscleGroup: 'Pecho', tempo: '3-0-1-0',
    notes: 'Codos a 45°. Bajar controlado al esternón.',
    videoSource: 'YouTube', videoUrl: 'https://youtu.be/example',
    sets: [
      newSet({ setType: 'Warmup', targetReps: '10', targetWeight: '40', restSeconds: 60 }),
      newSet({ setType: 'Effective', targetReps: '6-8', targetWeight: '70', targetRpe: 8, restSeconds: 120 }),
      newSet({ setType: 'Effective', targetReps: '6-8', targetWeight: '70', targetRpe: 8, restSeconds: 120 }),
      newSet({ setType: 'Effective', targetReps: '6-8', targetWeight: '70', targetRpe: 9, restSeconds: 120 }),
    ],
  });
  const inclineEx = newExercise({
    catalogId: 'incline-db-press', name: 'Press inclinado con mancuernas', muscleGroup: 'Pecho',
    sets: [
      newSet({ setType: 'Effective', targetReps: '8-10', targetWeight: '22', restSeconds: 90 }),
      newSet({ setType: 'Effective', targetReps: '8-10', targetWeight: '22', restSeconds: 90 }),
      newSet({ setType: 'Effective', targetReps: '8-10', targetWeight: '', restSeconds: 90 }),
    ],
  });
  const flyEx = newExercise({
    catalogId: 'cable-fly', name: 'Aperturas en polea', muscleGroup: 'Pecho',
    sets: [
      newSet({ setType: 'Effective', targetReps: '12-15', targetWeight: '', restSeconds: 60 }),
      newSet({ setType: 'Effective', targetReps: '12-15', targetWeight: '', restSeconds: 60 }),
      newSet({ setType: 'DropSet', targetReps: 'AMRAP', targetWeight: '', restSeconds: 60 }),
    ],
  });
  const tricepEx = newExercise({
    catalogId: 'tricep-pushdown', name: 'Extensión de tríceps en polea', muscleGroup: 'Tríceps',
    sets: [
      newSet({ setType: 'Effective', targetReps: '10-12', targetWeight: '', restSeconds: 45 }),
      newSet({ setType: 'Effective', targetReps: '10-12', targetWeight: '', restSeconds: 45 }),
      newSet({ setType: 'Effective', targetReps: '10-12', targetWeight: '', restSeconds: 45 }),
    ],
  });

  return {
    id: uid('r'),
    name: 'Hipertrofia — Upper / Lower',
    description: 'Rutina de 4 días orientada a hipertrofia, volumen moderado con progresión semanal.',
    category: 'Hipertrofia',
    tags: ['8 semanas', 'Intermedio', '4 días/sem'],
    days: [
      {
        id: uid('d'), name: 'Empuje',
        groups: [
          newGroup({ groupType: 'Single', exercises: [benchEx] }),
          newGroup({ groupType: 'Superset', restSeconds: 75, exercises: [inclineEx, flyEx] }),
          newGroup({ groupType: 'Single', exercises: [tricepEx] }),
        ],
      },
      {
        id: uid('d'), name: 'Tirón',
        groups: [
          newGroup({ exercises: [
            newExercise({ catalogId: 'deadlift', name: 'Peso muerto', muscleGroup: 'Piernas',
              sets: [
                newSet({ setType: 'Warmup', targetReps: '5', targetWeight: '60', restSeconds: 90 }),
                newSet({ setType: 'Effective', targetReps: '3-5', targetWeight: '120', targetRpe: 8, restSeconds: 180 }),
                newSet({ setType: 'Effective', targetReps: '3-5', targetWeight: '120', targetRpe: 8, restSeconds: 180 }),
              ],
            }),
          ]}),
          newGroup({ exercises: [
            newExercise({ catalogId: 'pullup', name: 'Dominadas', muscleGroup: 'Espalda',
              sets: [
                newSet({ setType: 'Effective', targetReps: '6-10', targetWeight: '', restSeconds: 120 }),
                newSet({ setType: 'Effective', targetReps: '6-10', targetWeight: '', restSeconds: 120 }),
                newSet({ setType: 'AMRAP', targetReps: 'AMRAP', targetWeight: '', restSeconds: 120 }),
              ],
            }),
          ]}),
        ],
      },
      { id: uid('d'), name: 'Piernas', groups: [newGroup({ exercises: [
        newExercise({ catalogId: 'squat', name: 'Sentadilla', muscleGroup: 'Piernas',
          sets: [newSet({ setType: 'Effective', targetReps: '6-8', targetWeight: '90', targetRpe: 8, restSeconds: 150 })],
        }),
      ]})]},
      { id: uid('d'), name: 'Accesorios', groups: [newGroup({ exercises: [
        newExercise({ catalogId: 'ohp', name: 'Press militar', muscleGroup: 'Hombros',
          sets: [newSet({ setType: 'Effective', targetReps: '6-8', targetWeight: '40', restSeconds: 120 })],
        }),
      ]})]},
    ],
  };
}

Object.assign(window, {
  GROUP_TYPES, SET_TYPES, SET_TYPE_LABELS, CATEGORIES, EXERCISE_CATALOG,
  uid, newSet, newExercise, newGroup, newDay, seedRoutine,
});
