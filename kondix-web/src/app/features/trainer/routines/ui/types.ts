export type SetType = 'Warmup' | 'Effective' | 'DropSet' | 'RestPause' | 'AMRAP';
export type BlockType = 'Superset' | 'Triset' | 'Circuit';

export interface WizardSet {
  setType: SetType;
  targetReps: string;
  targetWeight: string;
  targetRpe: number | null;
  restSeconds: number | null;
}

export interface WizardExercise {
  name: string;
  notes: string;
  tempo: string;
  catalogExerciseId: string | null;
  catalogImageUrl: string | null;
  catalogVideoUrl: string | null;
  sets: WizardSet[];
}

export interface WizardBlock {
  blockType: BlockType | null;
  restSeconds: number;
  exercises: WizardExercise[];
}

export interface WizardDay {
  name: string;
  blocks: WizardBlock[];
}

export interface WizardRoutine {
  name: string;
  description: string;
  category: string;
  tags: string[];
  days: WizardDay[];
}

export type GroupOption =
  | { kind: 'group'; type: BlockType; direction: 'up' | 'down'; count: number }
  | { kind: 'ungroup' };

export type GroupActionEvent = GroupOption;
