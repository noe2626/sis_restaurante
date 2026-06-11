import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class VentasService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  registrarVenta(venta:any){
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.post(`${this.apiUrl}ventas`, venta, header);
  }

  listarVentas(){
    let token = localStorage.getItem('userToken');
    let idSucursal = localStorage.getItem('idSucursal');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.get(`${this.apiUrl}ventas/${idSucursal}`, header);
  }

  obtenerDetalleVenta(id: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.get(`${this.apiUrl}ventas/detalle/${id}`, header);
  }

  cancelarVenta(id: number) {
    let token = localStorage.getItem('userToken');
    const header = {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
    return this.http.post(`${this.apiUrl}ventas/cancelar/${id}`, {}, header);
  }

}
