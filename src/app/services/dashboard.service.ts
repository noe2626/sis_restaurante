import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  getResumenDashboard(idSucursal: number) {
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization', `Bearer ${token}`)
    }
    return this.http.get(`${this.apiUrl}dashboard/${idSucursal}`, header);
  }
}
