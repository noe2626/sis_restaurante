import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, EMPTY } from 'rxjs';
import { environment } from '../../environments/environment';
import CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class SucursalesService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  private getHeader() {
    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('userToken') || '';
    }
    return {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
  }

  getSucursalesByUsuario(){
    if (isPlatformBrowser(this.platformId)) { 
      let token = localStorage.getItem('userToken');
      const user = CryptoJS.AES.decrypt(localStorage.getItem('idUsuario'), environment.secretKey).toString(CryptoJS.enc.Utf8);
      var header = {
        headers: new HttpHeaders()
          .set('Authorization',  `Bearer ${token}`)
      }
      return this.http.get(`${this.apiUrl}userSucursal/${user}`, header);
    }
    return EMPTY;
  }

  getAllSucursales() {
    return this.http.get(`${this.apiUrl}sucursales`, this.getHeader());
  }

  createSucursal(sucursal: any) {
    return this.http.post(`${this.apiUrl}sucursales`, sucursal, this.getHeader());
  }

  updateSucursal(id: number, sucursal: any) {
    return this.http.put(`${this.apiUrl}sucursales/${id}`, sucursal, this.getHeader());
  }

  deleteSucursal(id: number) {
    return this.http.delete(`${this.apiUrl}sucursales/${id}`, this.getHeader());
  }
}
