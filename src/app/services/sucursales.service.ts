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
}
