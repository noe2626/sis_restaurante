import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PreciosClienteService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  listarPreciosCliente(idSucursal?: number) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    const url = idSucursal ? `${this.apiUrl}precios-cliente?idSucursal=${idSucursal}` : `${this.apiUrl}precios-cliente`;
    return this.http.get(url, header);
  }

  guardarPrecioCliente(precioCliente: any) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    if (precioCliente.id) {
      return this.http.put(`${this.apiUrl}precios-cliente/${precioCliente.id}`, precioCliente, header);
    } else {
      return this.http.post(`${this.apiUrl}precios-cliente`, precioCliente, header);
    }
  }

  eliminarPrecioCliente(id: number) {
    const token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.delete(`${this.apiUrl}precios-cliente/${id}`, header);
  }
}
