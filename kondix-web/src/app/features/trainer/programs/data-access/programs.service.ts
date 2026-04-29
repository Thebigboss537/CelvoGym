import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import {
  ProgramDetail,
  ProgramLevel,
  ProgramMode,
  ProgramObjective,
  ProgramScheduleType,
  ProgramSummary,
} from '../../../../shared/models';

@Injectable({ providedIn: 'root' })
export class ProgramsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(filters?: {
    objective?: ProgramObjective;
    level?: ProgramLevel;
    published?: boolean;
    query?: string;
  }) {
    let params = new HttpParams();
    if (filters?.objective) params = params.set('objective', filters.objective);
    if (filters?.level) params = params.set('level', filters.level);
    if (filters?.published !== undefined) params = params.set('published', String(filters.published));
    if (filters?.query) params = params.set('query', filters.query);
    return this.http.get<ProgramSummary[]>(`${this.base}/programs`, { params, withCredentials: true });
  }

  getById(id: string) {
    return this.http.get<ProgramDetail>(`${this.base}/programs/${id}`, { withCredentials: true });
  }

  create(payload: {
    name: string;
    description: string | null;
    objective: ProgramObjective;
    level: ProgramLevel;
    mode: ProgramMode;
    scheduleType: ProgramScheduleType;
    daysPerWeek: number | null;
    durationWeeks: number;
  }) {
    return this.http.post<{ id: string }>(`${this.base}/programs`, payload, { withCredentials: true });
  }

  update(id: string, payload: {
    name: string;
    description: string | null;
    notes: string | null;
    objective: ProgramObjective;
    level: ProgramLevel;
    mode: ProgramMode;
  }) {
    return this.http.put<void>(`${this.base}/programs/${id}`, payload, { withCredentials: true });
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/programs/${id}`, { withCredentials: true });
  }

  publish(id: string) {
    return this.http.post<void>(`${this.base}/programs/${id}/publish`, {}, { withCredentials: true });
  }

  duplicate(id: string) {
    return this.http.post<{ id: string }>(`${this.base}/programs/${id}/duplicate`, {}, { withCredentials: true });
  }

  addWeek(id: string) {
    return this.http.post<void>(`${this.base}/programs/${id}/weeks`, {}, { withCredentials: true });
  }

  duplicateWeek(id: string, weekIndex: number) {
    return this.http.post<void>(`${this.base}/programs/${id}/weeks/${weekIndex}/duplicate`, {}, { withCredentials: true });
  }

  deleteWeek(id: string, weekIndex: number) {
    return this.http.delete<void>(`${this.base}/programs/${id}/weeks/${weekIndex}`, { withCredentials: true });
  }

  setSlot(id: string, weekIndex: number, dayIndex: number, kind: 'Empty' | 'Rest') {
    return this.http.put<void>(
      `${this.base}/programs/${id}/weeks/${weekIndex}/slots/${dayIndex}`,
      { kind }, { withCredentials: true });
  }

  assignRoutine(id: string, payload: {
    routineId: string;
    weeks: number[];
    mapping?: Record<string, number>;
    dayIds?: string[];
  }) {
    return this.http.post<{ blockId: string }>(
      `${this.base}/programs/${id}/assign-routine`, payload, { withCredentials: true });
  }

  removeBlock(id: string, blockId: string) {
    return this.http.delete<void>(`${this.base}/programs/${id}/blocks/${blockId}`, { withCredentials: true });
  }

  fillRest(id: string) {
    return this.http.post<void>(`${this.base}/programs/${id}/fill-rest`, {}, { withCredentials: true });
  }
}
