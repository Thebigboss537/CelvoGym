// Onboarding
export type TrainerOnboardingStatus = 'no_profile' | 'pending_approval' | 'active';

export interface TrainerStatusDto {
  status: TrainerOnboardingStatus;
  displayName?: string;
  trainerId?: string;
}

// Auth (matches CelvoGuard /api/v1/auth/me response)
export interface AuthUser {
  id: string;
  tenantId: string;
  email: string | null;
  firstName: string | null;
  permissions: string[];
  userType: string;
}

// Trainer
export interface TrainerDto {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  isApproved: boolean;
  createdAt: string;
}

// Routines
export interface RoutineListDto {
  id: string;
  name: string;
  description: string | null;
  dayCount: number;
  exerciseCount: number;
  tags: string[];
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineDetailDto {
  id: string;
  name: string;
  description: string | null;
  days: DayDto[];
  tags: string[];
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DayDto {
  id: string;
  name: string;
  groups: ExerciseGroupDto[];
}

export type GroupType = 'Single' | 'Superset' | 'Triset' | 'Circuit';
export type SetType = 'Warmup' | 'Effective' | 'DropSet' | 'RestPause' | 'AMRAP';
export type VideoSource = 'None' | 'YouTube' | 'Upload';

export interface ExerciseGroupDto {
  id: string;
  groupType: GroupType;
  restSeconds: number;
  exercises: ExerciseDto[];
}

export interface ExerciseDto {
  id: string;
  name: string;
  notes: string | null;
  videoSource: VideoSource;
  videoUrl: string | null;
  tempo: string | null;
  sets: ExerciseSetDto[];
}

export interface ExerciseSetDto {
  id: string;
  setType: SetType;
  targetReps: string | null;
  targetWeight: string | null;
  targetRpe: number | null;
  restSeconds: number | null;
}

// Students
export interface StudentDto {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface StudentInvitationDto {
  id: string;
  email: string;
  firstName: string | null;
  token: string;
  expiresAt: string;
  isAccepted: boolean;
  createdAt: string;
}

export interface InvitationInfoDto {
  trainerName: string;
  trainerAvatarUrl: string | null;
  email: string;
  tenantId: string;
}

// Assignments
export interface AssignmentDto {
  id: string;
  routineId: string;
  routineName: string;
  studentId: string;
  studentName: string;
  isActive: boolean;
  createdAt: string;
}

// Progress
export interface SetLogDto {
  id: string;
  setId: string;
  completed: boolean;
  completedAt: string | null;
  actualWeight: string | null;
  actualReps: string | null;
  actualRpe: number | null;
}

export interface ProgressSummaryDto {
  totalEffectiveSets: number;
  completedEffectiveSets: number;
  percentage: number;
}

export interface StudentRoutineListDto {
  id: string;
  name: string;
  description: string | null;
  dayCount: number;
  progress: ProgressSummaryDto;
  updatedAt: string;
}

export interface StudentRoutineDetailDto {
  id: string;
  name: string;
  description: string | null;
  days: StudentDayDto[];
  progress: ProgressSummaryDto;
}

export interface StudentDayDto {
  id: string;
  name: string;
  groups: ExerciseGroupDto[];
  setLogs: SetLogDto[];
  progress: ProgressSummaryDto;
}

// Sessions
export interface WorkoutSessionDto {
  id: string;
  routineId: string;
  dayId: string;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
}

export interface SessionSummaryDto {
  id: string;
  date: string;
  dayName: string;
  status: 'completed' | 'in_progress';
  completedSets: number;
  totalSets: number;
  durationMinutes: number | null;
}

// Calendar
export interface CalendarMonthDto {
  sessions: CalendarDayDto[];
  suggestedDays: number[];
  activeProgram: ActiveProgramDto | null;
}

export interface CalendarDayDto {
  date: string;
  dayName: string;
  status: 'completed' | 'in_progress';
  sessionId: string;
  completedSets: number;
  totalSets: number;
  durationMinutes: number | null;
}

export interface ActiveProgramDto {
  name: string;
  currentWeek: number;
  totalWeeks: number;
  mode: ProgramAssignmentMode;
  status: ProgramAssignmentStatus;
}

// Program Assignments
export type ProgramAssignmentMode = 'Rotation' | 'Fixed';
export type ProgramAssignmentStatus = 'Active' | 'Completed' | 'Cancelled';

export interface ProgramAssignmentDto {
  id: string;
  programId: string;
  programName: string;
  studentId: string;
  studentName: string;
  mode: ProgramAssignmentMode;
  status: ProgramAssignmentStatus;
  trainingDays: number[];
  startDate: string;
  endDate: string;
  currentWeek: number;
  totalWeeks: number;
  createdAt: string;
}

export interface FixedScheduleEntry {
  routineId: string;
  days: number[];
}

export interface NextWorkoutDto {
  routineId: string;
  routineName: string;
  dayId: string;
  dayName: string;
  programName: string;
  currentWeek: number;
  totalWeeks: number;
}

export interface MyProgramDto {
  programId: string;
  programName: string;
  description: string | null;
  mode: ProgramAssignmentMode;
  status: ProgramAssignmentStatus;
  currentWeek: number;
  totalWeeks: number;
  routines: StudentRoutineListDto[];
  startDate: string;
  endDate: string;
}

// Programs
export interface ProgramListDto {
  id: string;
  name: string;
  description: string | null;
  durationWeeks: number;
  routineCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramDetailDto {
  id: string;
  name: string;
  description: string | null;
  durationWeeks: number;
  routines: ProgramRoutineDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgramRoutineDto {
  id: string;
  routineId: string;
  routineName: string;
  label: string | null;
  sortOrder: number;
}

// Trainer Notes
export interface TrainerNoteDto {
  id: string;
  text: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// Personal Records
export interface PersonalRecordDto {
  id: string;
  exerciseName: string;
  weight: string;
  reps: string | null;
  achievedAt: string;
}

export interface NewPrDto {
  exerciseName: string;
  weight: string;
  previousWeight: string | null;
}

// Body Metrics
export interface BodyMetricDto {
  id: string;
  recordedAt: string;
  weight: number | null;
  bodyFat: number | null;
  notes: string | null;
  measurements: BodyMeasurementDto[];
}

export interface BodyMeasurementDto {
  type: string;
  value: number;
}

export interface ProgressPhotoDto {
  id: string;
  takenAt: string;
  photoUrl: string;
  angle: 'Front' | 'Side' | 'Back';
  notes: string | null;
}

// Analytics
export interface ExerciseProgressDto {
  exerciseName: string;
  dataPoints: ExerciseDataPointDto[];
}

export interface ExerciseDataPointDto {
  date: string;
  maxWeight: string | null;
  totalReps: string | null;
  sets: number;
}

export interface StudentOverviewDto {
  totalSessions: number;
  sessionsThisWeek: number;
  adherencePercentage: number;
  weeklyVolume: WeeklyVolumeDto[];
}

export interface WeeklyVolumeDto {
  weekStart: string;
  sessions: number;
  completedSets: number;
}

// Comments
export interface CommentDto {
  id: string;
  authorType: 'Trainer' | 'Student';
  authorName: string;
  text: string;
  createdAt: string;
}
