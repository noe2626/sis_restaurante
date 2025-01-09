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

}
