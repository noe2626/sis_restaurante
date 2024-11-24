import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, EMPTY } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SucursalesService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  getSucursalesByUsuario(){
    
    if (isPlatformBrowser(this.platformId)) { 
      let token = localStorage.getItem('userToken');
      let user = localStorage.getItem('idUsuario');
      var header = {
        headers: new HttpHeaders()
          .set('Authorization',  `Bearer ${token}`)
      }
      return this.http.get(`${this.apiUrl}userSucursal/${user}`, header);
    }
    return EMPTY;
  }
}
