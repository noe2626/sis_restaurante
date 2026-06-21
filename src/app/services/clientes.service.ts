import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  listarClientes(){
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.get(`${this.apiUrl}clientes`, header);
  }

  guardarCliente(cliente: any) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    if (cliente.id) {
      return this.http.put(`${this.apiUrl}clientes/${cliente.id}`, cliente, header);
    } else {
      return this.http.post(`${this.apiUrl}clientes`, cliente, header);
    }
  }

  eliminarCliente(id: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.delete(`${this.apiUrl}clientes/${id}`, header);
  }

  listarCuentasPendientes(idCliente: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.get(`${this.apiUrl}clientes/${idCliente}/ventas-credito`, header);
  }

  informacionCliente(idCliente: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.get(`${this.apiUrl}clientes/${idCliente}`, header);
  }
}

