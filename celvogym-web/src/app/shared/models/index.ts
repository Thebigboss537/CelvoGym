// Auth
export interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
  permissions: string[];
  userType: 'operator' | 'enduser';
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
  createdAt: string;
  updatedAt: string;
}

export interface RoutineDetailDto {
  id: string;
  name: string;
  description: string | null;
  days: DayDto[];
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

// Comments
export interface CommentDto {
  id: string;
  authorType: 'Trainer' | 'Student';
  authorName: string;
  text: string;
  createdAt: string;
}
