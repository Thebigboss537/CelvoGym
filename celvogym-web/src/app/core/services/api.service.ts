import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  get<T>(path: string) {
    return this.http.get<T>(`${this.base}${path}`, { withCredentials: true });
  }

  post<T>(path: string, body: unknown) {
    return this.http.post<T>(`${this.base}${path}`, body, { withCredentials: true });
  }

  put<T>(path: string, body: unknown) {
    return this.http.put<T>(`${this.base}${path}`, body, { withCredentials: true });
  }

  delete<T>(path: string) {
    return this.http.delete<T>(`${this.base}${path}`, { withCredentials: true });
  }

  upload<T>(path: string, formData: FormData) {
    return this.http.post<T>(`${this.base}${path}`, formData, { withCredentials: true });
  }
}
