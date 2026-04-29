import { ProgramObjective } from '../models';

const OBJECTIVE_COLORS: Record<ProgramObjective, string> = {
  Hipertrofia: '#E62639',
  Fuerza: '#f59e0b',
  Resistencia: '#22c55e',
  Funcional: '#60a5fa',
  Rendimiento: '#a78bfa',
  Otro: '#78787f',
};

export function objectiveColor(objective: ProgramObjective): string {
  return OBJECTIVE_COLORS[objective] ?? OBJECTIVE_COLORS.Otro;
}
