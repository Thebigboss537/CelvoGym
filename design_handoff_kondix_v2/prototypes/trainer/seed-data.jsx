// Seed: trainers, students, exercises, routines, programs, assignments, activity, PRs

const AVATARS = [
  'https://i.pravatar.cc/80?img=12',
  'https://i.pravatar.cc/80?img=25',
  'https://i.pravatar.cc/80?img=32',
  'https://i.pravatar.cc/80?img=47',
  'https://i.pravatar.cc/80?img=58',
  'https://i.pravatar.cc/80?img=64',
  'https://i.pravatar.cc/80?img=33',
  'https://i.pravatar.cc/80?img=5',
];

const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Hombro', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Femoral', 'Glúteo', 'Gemelo', 'Core', 'Antebrazo'];
const EQUIPMENT = ['Barra', 'Mancuerna', 'Polea', 'Máquina', 'Peso corporal', 'Kettlebell', 'Banda elástica'];
const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];
const OBJECTIVES = ['Perder grasa', 'Ganar masa', 'Mantener', 'Rendimiento', 'Movilidad'];

// Full exercise library
function seedLibrary() {
  const defs = [
    ['Press de banca', 'Pecho', ['Hombro', 'Tríceps'], 'Barra', 'Fuerza', 'Intermedio', 'Acuéstate en el banco, agarra la barra con las manos a ancho de hombros. Baja controlado al pecho, empuja hasta extensión completa.'],
    ['Press inclinado mancuernas', 'Pecho', ['Hombro'], 'Mancuerna', 'Hipertrofia', 'Intermedio', 'Banco inclinado 30-45°. Mancuernas a los lados del pecho, empuja en arco convergente.'],
    ['Aperturas en polea', 'Pecho', [], 'Polea', 'Hipertrofia', 'Intermedio', 'Codos ligeramente flexionados, cruza las manos al frente sintiendo el pecho.'],
    ['Flexiones', 'Pecho', ['Tríceps', 'Core'], 'Peso corporal', 'Funcional', 'Principiante', 'Cuerpo recto, baja el pecho al suelo, empuja hacia arriba.'],
    ['Press de pecho máquina', 'Pecho', [], 'Máquina', 'Hipertrofia', 'Principiante', 'Agarra las palancas, empuja manteniendo control en la bajada.'],
    ['Dominadas', 'Espalda', ['Bíceps'], 'Peso corporal', 'Fuerza', 'Avanzado', 'Agarre prono, tira del pecho hacia la barra, baja con control.'],
    ['Jalón al pecho', 'Espalda', ['Bíceps'], 'Polea', 'Hipertrofia', 'Principiante', 'Tira de la barra al pecho, codos hacia abajo, retrae escápulas.'],
    ['Remo con barra', 'Espalda', ['Bíceps'], 'Barra', 'Fuerza', 'Intermedio', 'Cadera flexionada 45°, tira de la barra al abdomen bajo.'],
    ['Remo sentado', 'Espalda', ['Bíceps'], 'Polea', 'Hipertrofia', 'Principiante', 'Espalda recta, tira del cable al abdomen, junta escápulas.'],
    ['Peso muerto', 'Espalda', ['Cuádriceps', 'Glúteo'], 'Barra', 'Fuerza', 'Avanzado', 'Barra pegada al cuerpo, espalda neutra, empuja el suelo.'],
    ['Press militar', 'Hombro', ['Tríceps'], 'Barra', 'Fuerza', 'Intermedio', 'De pie, barra a nivel de hombros, empuja arriba sin arquear la espalda.'],
    ['Elevaciones laterales', 'Hombro', [], 'Mancuerna', 'Hipertrofia', 'Principiante', 'Codos ligeramente flexionados, sube hasta altura de hombros.'],
    ['Face pull', 'Hombro', [], 'Polea', 'Funcional', 'Principiante', 'Tira de la cuerda al rostro, codos altos, externa los hombros.'],
    ['Press Arnold', 'Hombro', [], 'Mancuerna', 'Hipertrofia', 'Intermedio', 'Comienza con palmas hacia ti, rota mientras empujas.'],
    ['Curl de bíceps', 'Bíceps', [], 'Barra', 'Hipertrofia', 'Principiante', 'Codos pegados al torso, sube controlado, baja en 2s.'],
    ['Curl martillo', 'Bíceps', ['Antebrazo'], 'Mancuerna', 'Hipertrofia', 'Principiante', 'Agarre neutro, enfatiza el braquial.'],
    ['Curl concentrado', 'Bíceps', [], 'Mancuerna', 'Hipertrofia', 'Intermedio', 'Codo apoyado en el muslo, foco total en el bíceps.'],
    ['Extensión tríceps polea', 'Tríceps', [], 'Polea', 'Hipertrofia', 'Principiante', 'Codos pegados, extiende hasta completa contracción.'],
    ['Press francés', 'Tríceps', [], 'Barra', 'Hipertrofia', 'Intermedio', 'Codos fijos, baja la barra a la frente, extiende.'],
    ['Fondos', 'Tríceps', ['Pecho'], 'Peso corporal', 'Fuerza', 'Avanzado', 'Cuerpo ligeramente inclinado para pecho, vertical para tríceps.'],
    ['Sentadilla', 'Cuádriceps', ['Glúteo'], 'Barra', 'Fuerza', 'Intermedio', 'Barra sobre trapecios, baja hasta paralela, empuja a través del talón.'],
    ['Sentadilla frontal', 'Cuádriceps', ['Core'], 'Barra', 'Fuerza', 'Avanzado', 'Barra sobre los deltoides frontales, torso vertical.'],
    ['Prensa de piernas', 'Cuádriceps', ['Glúteo'], 'Máquina', 'Hipertrofia', 'Principiante', 'Pies a ancho de hombros, baja 90° controlado, empuja.'],
    ['Extensión de cuádriceps', 'Cuádriceps', [], 'Máquina', 'Hipertrofia', 'Principiante', 'Extiende hasta contracción completa, baja controlado.'],
    ['Curl femoral', 'Femoral', [], 'Máquina', 'Hipertrofia', 'Principiante', 'Flexiona las rodillas hasta contracción máxima.'],
    ['Peso muerto rumano', 'Femoral', ['Espalda', 'Glúteo'], 'Barra', 'Fuerza', 'Intermedio', 'Cadera atrás, ligera flexión de rodillas, baja hasta media pierna.'],
    ['Hip thrust', 'Glúteo', ['Cuádriceps'], 'Barra', 'Fuerza', 'Intermedio', 'Escápulas en banco, empuja cadera hacia arriba con barra.'],
    ['Elevación de gemelos', 'Gemelo', [], 'Máquina', 'Hipertrofia', 'Principiante', 'Sube sobre la punta de los pies, pausa 1s arriba.'],
    ['Plancha', 'Core', [], 'Peso corporal', 'Funcional', 'Principiante', 'Cuerpo recto, abdomen contraído, mantén la posición.'],
    ['Ab wheel', 'Core', [], 'Máquina', 'Funcional', 'Avanzado', 'Rueda hacia adelante manteniendo core firme, regresa.'],
    ['Zancadas', 'Cuádriceps', ['Glúteo'], 'Mancuerna', 'Funcional', 'Intermedio', 'Paso largo hacia adelante, baja la rodilla trasera, empuja.'],
    ['Burpees', 'Core', ['Pecho', 'Cuádriceps'], 'Peso corporal', 'Funcional', 'Intermedio', 'De pie → sentadilla → plancha → flexión → salto.'],
  ];

  return defs.map(([name, muscleGroup, secondary, equipment, category, level, instructions], i) => ({
    id: 'lib_' + i,
    name, muscleGroup, secondaryMuscles: secondary,
    equipment, category, level, instructions,
    videoSource: i % 4 === 0 ? 'YouTube' : 'None',
    videoUrl: i % 4 === 0 ? 'https://youtu.be/example' : '',
    photoUrl: null,
    timesUsed: Math.floor(Math.random() * 45),
    createdAt: '2026-02-' + String(((i % 28) + 1)).padStart(2, '0'),
  }));
}

// Students
function seedStudents() {
  const names = [
    ['Lucía Martín', 'lucia.martin@email.com', 0, 'Ganar masa', 'Intermedio'],
    ['Diego Fernández', 'diego.f@email.com', 1, 'Perder grasa', 'Principiante'],
    ['Sara Jiménez', 'sara.jim@email.com', 2, 'Mantener', 'Avanzado'],
    ['Raúl Ortega', 'raul.o@email.com', 3, 'Rendimiento', 'Avanzado'],
    ['Carmen López', 'carmen.l@email.com', 4, 'Ganar masa', 'Intermedio'],
    ['Javier Ruiz', 'javi.ruiz@email.com', 5, 'Perder grasa', 'Intermedio'],
    ['Elena Torres', 'e.torres@email.com', 6, 'Movilidad', 'Principiante'],
    ['Pablo Gómez', 'pablo.g@email.com', 7, 'Ganar masa', 'Principiante'],
  ];
  const now = new Date();
  return names.map(([name, email, avIdx, objective, level], i) => {
    const daysSinceLast = [0, 1, 2, 5, 0, 1, 8, 3][i];
    const sessionsThisWeek = [4, 2, 3, 3, 5, 3, 0, 2][i];
    return {
      id: 'stu_' + i,
      name, email,
      avatar: AVATARS[avIdx],
      objective, level,
      startDate: '2026-0' + ((i % 3) + 1) + '-' + String(((i * 3 % 28) + 1)).padStart(2, '0'),
      notes: [],
      phone: '+34 6' + String(10000000 + i * 1234567).slice(0, 8),
      status: i === 6 ? 'inactive' : 'active',
      lastSessionDays: daysSinceLast,
      sessionsThisWeek,
      adherence: [92, 75, 88, 84, 95, 82, 40, 68][i],
      bodyWeight: [62, 85, 58, 78, 55, 90, 64, 72][i],
      activeProgramId: i === 6 ? null : 'prog_' + (i % 3),
      currentWeek: i === 6 ? null : ((i % 6) + 1),
    };
  });
}

function seedPrograms() {
  return [
    {
      id: 'prog_0',
      name: 'Hipertrofia Upper/Lower',
      description: 'Programa de 8 semanas enfocado en hipertrofia con división upper/lower, 4 días a la semana.',
      durationWeeks: 8,
      category: 'Hipertrofia',
      routines: [
        { routineId: 'rut_0', label: 'Semana A · Upper', order: 0 },
        { routineId: 'rut_1', label: 'Semana A · Lower', order: 1 },
        { routineId: 'rut_2', label: 'Semana B · Upper', order: 2 },
        { routineId: 'rut_3', label: 'Semana B · Lower', order: 3 },
      ],
      studentsAssigned: 4,
      createdAt: '2026-01-15',
      status: 'active',
    },
    {
      id: 'prog_1',
      name: 'Fuerza 5x5',
      description: 'Fuerza básica con progresión semanal. 3 días a la semana.',
      durationWeeks: 12,
      category: 'Fuerza',
      routines: [
        { routineId: 'rut_4', label: 'Día A', order: 0 },
        { routineId: 'rut_5', label: 'Día B', order: 1 },
      ],
      studentsAssigned: 2,
      createdAt: '2025-12-03',
      status: 'active',
    },
    {
      id: 'prog_2',
      name: 'Full Body Principiante',
      description: 'Rutina de cuerpo completo para iniciarse. 3 días por semana con énfasis en técnica.',
      durationWeeks: 6,
      category: 'Funcional',
      routines: [
        { routineId: 'rut_6', label: 'Full Body', order: 0 },
      ],
      studentsAssigned: 1,
      createdAt: '2026-02-20',
      status: 'active',
    },
    {
      id: 'prog_3',
      name: 'Push Pull Legs',
      description: 'Clásico PPL para volumen. 6 días a la semana.',
      durationWeeks: 10,
      category: 'Hipertrofia',
      routines: [
        { routineId: 'rut_0', label: 'Push', order: 0 },
        { routineId: 'rut_0', label: 'Pull', order: 1 },
        { routineId: 'rut_1', label: 'Legs', order: 2 },
      ],
      studentsAssigned: 0,
      createdAt: '2026-04-01',
      status: 'draft',
    },
  ];
}

// Simple routines just for programs to reference
function seedRoutinesIndex() {
  return [
    { id: 'rut_0', name: 'Upper A', days: 1, exercises: 7 },
    { id: 'rut_1', name: 'Lower A', days: 1, exercises: 6 },
    { id: 'rut_2', name: 'Upper B', days: 1, exercises: 7 },
    { id: 'rut_3', name: 'Lower B', days: 1, exercises: 6 },
    { id: 'rut_4', name: 'Fuerza A', days: 1, exercises: 5 },
    { id: 'rut_5', name: 'Fuerza B', days: 1, exercises: 5 },
    { id: 'rut_6', name: 'Full Body', days: 1, exercises: 8 },
    { id: 'rut_7', name: 'Hipertrofia — Upper/Lower', days: 4, exercises: 24 },
  ];
}

// ============================================================
// Per-student progress: sessions, PRs, body metrics, photos
// ============================================================
// Deterministic pseudo-random per student so refreshes are stable.
function _hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function _rng(seed) { let x = seed >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 0xffffffff; }; }

function seedStudentProgress(students) {
  const now = new Date();
  const out = {};

  for (const s of students) {
    const rand = _rng(_hash(s.id));
    const sessions = [];
    const prs = [];
    const metrics = [];
    const photos = [];

    // ----- Sessions: last ~10 weeks -----
    const isInactive = s.status === 'inactive';
    const sessionCount = isInactive ? 6 : 24 + Math.floor(rand() * 8);
    const adherenceFactor = (s.adherence || 80) / 100;

    const routinePool = [
      { name: 'Upper A', exercises: ['Press de banca', 'Press inclinado mancuernas', 'Remo con barra', 'Jalón al pecho', 'Press militar', 'Curl de bíceps', 'Extensión tríceps polea'] },
      { name: 'Lower A', exercises: ['Sentadilla', 'Peso muerto rumano', 'Prensa de piernas', 'Curl femoral', 'Hip thrust', 'Elevación de gemelos'] },
      { name: 'Upper B', exercises: ['Press inclinado mancuernas', 'Dominadas', 'Remo sentado', 'Press Arnold', 'Elevaciones laterales', 'Curl martillo', 'Press francés'] },
      { name: 'Lower B', exercises: ['Sentadilla frontal', 'Peso muerto', 'Extensión de cuádriceps', 'Zancadas', 'Hip thrust', 'Elevación de gemelos'] },
      { name: 'Full Body', exercises: ['Sentadilla', 'Press de banca', 'Remo con barra', 'Press militar', 'Plancha'] },
    ];

    let cursor = isInactive ? 8 : (s.lastSessionDays || 0);

    // Simulated baseline weights per exercise (kg) — drift up over time = progress
    const baselineWeights = {
      'Press de banca': [60, 90][Math.floor(rand() * 2)],
      'Sentadilla': [70, 110][Math.floor(rand() * 2)],
      'Peso muerto': [90, 140][Math.floor(rand() * 2)],
      'Press militar': 40, 'Remo con barra': 60, 'Jalón al pecho': 50,
      'Dominadas': 0, 'Press inclinado mancuernas': 22, 'Hip thrust': 80,
      'Prensa de piernas': 120, 'Curl femoral': 30, 'Curl de bíceps': 25,
      'Press Arnold': 14, 'Elevaciones laterales': 8, 'Curl martillo': 12,
      'Extensión tríceps polea': 25, 'Press francés': 20, 'Sentadilla frontal': 60,
      'Peso muerto rumano': 70, 'Extensión de cuádriceps': 40, 'Zancadas': 16,
      'Remo sentado': 50, 'Elevación de gemelos': 60, 'Plancha': 0,
    };

    const moods = ['great', 'good', 'good', 'good', 'ok', 'tough', 'great', 'good', 'ok'];
    const sessionNotePool = [
      'Me sentí fuerte hoy, quizá puedo subir peso la próxima.',
      'Cansancio acumulado, dormí poco esta semana.',
      'Buen entreno, técnica fluida.',
      '',  '',  '',
      'Algo de molestia en el hombro derecho en press, controlable.',
      'Energía top, motivado.',
      'Sesión rápida pero completa.',
      '',
      'Calor en el gym hoy, agotador.',
      'Mejor que la última, técnica más limpia.',
    ];
    const setNotePool = [
      'última con mucho esfuerzo',
      'forma sólida',
      'pude haber hecho una más',
      'pesaba más de lo esperado',
      'sentí el músculo bien activado',
      'fallo técnico en la última rep',
    ];
    const exerciseNotePool = [
      'Subí 2.5kg desde la última sesión.',
      'Bajé un poco para enfocar técnica.',
      'Necesito más calentamiento la próxima.',
      '',
      'Bandas para asistencia en las últimas series.',
    ];

    for (let i = 0; i < sessionCount; i++) {
      // Skip days based on adherence
      const gap = 1 + Math.floor(rand() * 3 / Math.max(0.3, adherenceFactor));
      cursor += gap;
      const date = new Date(now); date.setDate(now.getDate() - cursor);

      const skipped = rand() > adherenceFactor + 0.15;
      const routine = routinePool[Math.floor(rand() * routinePool.length)];

      if (skipped) {
        sessions.push({
          id: 'sess_' + s.id + '_' + i,
          date: date.toISOString().slice(0, 10),
          dayOffset: cursor,
          routineName: routine.name,
          status: 'skipped',
          rpeAvg: null,
          mood: null,
          note: rand() > 0.7 ? 'No pude entrenar hoy.' : '',
          durationMin: 0,
          exercises: [],
          completedSets: 0,
          totalSets: 0,
        });
        continue;
      }

      const totalSets = routine.exercises.length * 4;
      const completionRatio = 0.7 + rand() * 0.3;
      const completedSets = Math.round(totalSets * completionRatio);

      // Exercises
      const progressFactor = 1 + ((sessionCount - i) * 0.005); // older = lighter
      const baseProg = 1 / progressFactor;
      const exerciseDetails = routine.exercises.map(exName => {
        const base = (baselineWeights[exName] ?? 30) * baseProg;
        const setsCount = 3 + Math.floor(rand() * 2);
        const sets = [];
        for (let k = 0; k < setsCount; k++) {
          const reps = exName === 'Plancha'
            ? 30 + Math.floor(rand() * 30)
            : 6 + Math.floor(rand() * 6);
          const weight = exName === 'Dominadas' || exName === 'Plancha'
            ? 0
            : Math.round((base + (rand() - 0.5) * 4) * 2) / 2;
          sets.push({
            reps, weight,
            note: rand() > 0.85 ? setNotePool[Math.floor(rand() * setNotePool.length)] : '',
            isPR: false,
          });
        }
        return {
          name: exName,
          muscleGroup: '', // looked up via library
          sets,
          rpe: 6 + Math.floor(rand() * 4),
          note: rand() > 0.75 ? exerciseNotePool[Math.floor(rand() * exerciseNotePool.length)] : '',
        };
      });

      // Mark a PR on first session about every ~5 sessions on a key lift
      if (i % 5 === 2 && i < sessionCount) {
        const ex = exerciseDetails[Math.floor(rand() * exerciseDetails.length)];
        if (ex && ex.sets.length > 0) {
          const topSet = ex.sets.reduce((a, b) => (a.weight * a.reps > b.weight * b.reps ? a : b));
          topSet.isPR = true;
          prs.push({
            id: 'pr_' + s.id + '_' + i,
            exerciseName: ex.name,
            weight: topSet.weight,
            reps: topSet.reps,
            date: date.toISOString().slice(0, 10),
            dayOffset: cursor,
          });
        }
      }

      const rpes = exerciseDetails.map(e => e.rpe);
      const rpeAvg = rpes.reduce((a, b) => a + b, 0) / rpes.length;

      sessions.push({
        id: 'sess_' + s.id + '_' + i,
        date: date.toISOString().slice(0, 10),
        dayOffset: cursor,
        routineName: routine.name,
        status: 'completed',
        rpeAvg: Math.round(rpeAvg * 10) / 10,
        mood: moods[Math.floor(rand() * moods.length)],
        note: rand() > 0.55 ? sessionNotePool[Math.floor(rand() * sessionNotePool.length)] : '',
        durationMin: 35 + Math.floor(rand() * 35),
        exercises: exerciseDetails,
        completedSets,
        totalSets,
      });
    }

    // Newest first
    sessions.sort((a, b) => a.dayOffset - b.dayOffset);
    prs.sort((a, b) => a.dayOffset - b.dayOffset);

    // ----- Body metrics: weekly for ~12 weeks -----
    const startWeight = s.bodyWeight || 70;
    const goalDir = s.objective === 'Perder grasa' ? -0.3 : s.objective === 'Ganar masa' ? 0.25 : 0.05;
    let curWeight = startWeight - goalDir * 12; // oldest first then drift toward current
    const startBf = 18 + Math.floor(rand() * 12);
    let curBf = startBf + (s.objective === 'Perder grasa' ? 4 : -2);
    for (let w = 12; w >= 0; w -= 1) {
      const date = new Date(now); date.setDate(now.getDate() - w * 7);
      curWeight += goalDir + (rand() - 0.5) * 0.4;
      curBf += (s.objective === 'Perder grasa' ? -0.25 : 0.1) + (rand() - 0.5) * 0.5;
      metrics.push({
        date: date.toISOString().slice(0, 10),
        dayOffset: w * 7,
        weightKg: Math.round(curWeight * 10) / 10,
        bodyFatPct: Math.round(curBf * 10) / 10,
        waistCm: Math.round((75 + (rand() - 0.5) * 10) * 10) / 10,
      });
    }
    // Last entry == current weight
    if (s.bodyWeight) metrics[metrics.length - 1].weightKg = s.bodyWeight;

    // ----- Photos: 4 progress photos -----
    const photoSeeds = [70, 35, 14, 1];
    photoSeeds.forEach((days, idx) => {
      const date = new Date(now); date.setDate(now.getDate() - days);
      photos.push({
        id: 'photo_' + s.id + '_' + idx,
        date: date.toISOString().slice(0, 10),
        dayOffset: days,
        url: `https://picsum.photos/seed/${s.id}-photo-${idx}/300/400`,
        label: idx === 0 ? 'Inicio' : idx === photoSeeds.length - 1 ? 'Actual' : `Semana ${idx * 4}`,
      });
    });

    out[s.id] = { sessions, prs, metrics, photos };
  }

  return out;
}

// Activity feed for dashboard
function seedActivity() {
  return [
    { id: 'a1', studentId: 'stu_0', type: 'session_completed', routine: 'Upper A', time: 'Hace 12 min', detail: '8 ejercicios · 45 min · PR en Press de banca (75kg×8)' },
    { id: 'a2', studentId: 'stu_4', type: 'session_completed', routine: 'Lower A', time: 'Hace 38 min', detail: '6 ejercicios · 52 min' },
    { id: 'a3', studentId: 'stu_3', type: 'pr', routine: null, time: 'Hace 1h', detail: 'Nuevo PR en Peso muerto: 140kg × 3' },
    { id: 'a4', studentId: 'stu_1', type: 'session_started', routine: 'Upper B', time: 'Hace 1h', detail: 'En progreso — 3/7 ejercicios' },
    { id: 'a5', studentId: 'stu_5', type: 'session_completed', routine: 'Fuerza A', time: 'Hace 3h', detail: '5 ejercicios · 58 min' },
    { id: 'a6', studentId: 'stu_2', type: 'comment', routine: 'Lower B', time: 'Hace 5h', detail: 'Comentó en "Peso muerto rumano": "¿Este peso está bien?"' },
    { id: 'a7', studentId: 'stu_7', type: 'session_completed', routine: 'Full Body', time: 'Ayer', detail: '8 ejercicios · 38 min' },
  ];
}

Object.assign(window, {
  AVATARS, MUSCLE_GROUPS, EQUIPMENT, LEVELS, OBJECTIVES,
  seedLibrary, seedStudents, seedPrograms, seedRoutinesIndex, seedActivity, seedStudentProgress,
});
