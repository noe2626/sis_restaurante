import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ComprasService {

  
    private apiUrl = environment.urlApi;
  
    constructor(private http: HttpClient) { }
  
    registrarCompra(compra:any){
      let token = localStorage.getItem('userToken');
      const header = {
        headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
      };
      return this.http.post(`${this.apiUrl}compras`, compra, header);
    }
}
