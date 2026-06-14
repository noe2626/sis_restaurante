import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PromocionesService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  listarPromociones(idSucursal?: number){
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    const url = idSucursal ? `${this.apiUrl}promociones?idSucursal=${idSucursal}` : `${this.apiUrl}promociones`;
    return this.http.get(url, header);
  }

  guardarPromocion(promocion: any) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    if (promocion.id) {
      return this.http.put(`${this.apiUrl}promociones/${promocion.id}`, promocion, header);
    } else {
      return this.http.post(`${this.apiUrl}promociones`, promocion, header);
    }
  }

  eliminarPromocion(id: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.delete(`${this.apiUrl}promociones/${id}`, header);
  }
}
