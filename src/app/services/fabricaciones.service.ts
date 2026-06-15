import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FabricacionesService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  listarFabricaciones(idSucursal: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.get(`${this.apiUrl}fabricaciones/${idSucursal}`, header);
  }

  registrarFabricacion(fabricacion: any) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.post(`${this.apiUrl}fabricaciones`, fabricacion, header);
  }

  eliminarFabricacion(id: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.delete(`${this.apiUrl}fabricaciones/${id}`, header);
  }
}
