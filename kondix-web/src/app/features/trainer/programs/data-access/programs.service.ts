import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import {
  ProgramDetail,
  ProgramLevel,
  ProgramObjective,
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
}
