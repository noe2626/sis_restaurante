import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CanalesVentaService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  listarCanalesVenta(idSucursal?: number) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    const url = idSucursal ? `${this.apiUrl}canales-venta?idSucursal=${idSucursal}` : `${this.apiUrl}canales-venta`;
    return this.http.get(url, header);
  }

  guardarCanalVenta(canal: any) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    if (canal.id) {
      return this.http.put(`${this.apiUrl}canales-venta/${canal.id}`, canal, header);
    } else {
      return this.http.post(`${this.apiUrl}canales-venta`, canal, header);
    }
  }

  eliminarCanalVenta(id: number) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.delete(`${this.apiUrl}canales-venta/${id}`, header);
  }
}
