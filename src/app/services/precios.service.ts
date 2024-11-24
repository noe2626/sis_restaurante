import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PreciosService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient) { }

  setPreciosSucursal(data:any){
    let token = localStorage.getItem('userToken');
      var header = {
        headers: new HttpHeaders()
          .set('Authorization',  `Bearer ${token}`)
      }
    return this.http.post(this.apiUrl+'precioSucursal',data, header);
  }

  getPrecioProducto(idSucursal:any, idProducto:any){
    let token = localStorage.getItem('userToken');
      var header = {
        headers: new HttpHeaders()
          .set('Authorization',  `Bearer ${token}`)
      }
    return this.http.get(this.apiUrl+'precioProducto/'+idSucursal+'/'+idProducto, header);
  }
}
