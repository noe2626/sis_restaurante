import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, EMPTY } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private apiUrl = environment.urlApi;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  guardarProducto(producto:any){
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization',  `Bearer ${token}`)
    }
    if(producto.id){
      return this.http.put(`${this.apiUrl}inventario/productos/${producto.id}`, producto, header);
    }else{
      return this.http.post(`${this.apiUrl}inventario/productos`, producto, header);
    }
    
  }

  listarProductos(){
      let token = localStorage.getItem('userToken');
      var header = {
        headers: new HttpHeaders()
          .set('Authorization',  `Bearer ${token}`)
      }
      return this.http.get(`${this.apiUrl}inventario/productos`, header);
  }

  listarInventario(idSucursal:any){
      let token = localStorage.getItem('userToken');
      var header = {
        headers: new HttpHeaders()
          .set('Authorization',  `Bearer ${token}`)
      }
      return this.http.get(`${this.apiUrl}inventario/inventario/${idSucursal}`, header);
    
  }

  getInventarioProducto(idSucursal:any, idProducto: number){
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization',  `Bearer ${token}`)
    }
    return this.http.get(`${this.apiUrl}inventario/${idSucursal}/${idProducto}`, header);
  }

  modificarInventario(data:any, idSucursal:any){
      let token = localStorage.getItem('userToken');
      var header = {
        headers: new HttpHeaders()
          .set('Authorization',  `Bearer ${token}`)
      }
      return this.http.put(`${this.apiUrl}inventario/inventario/${idSucursal}`, data, header);
    
  }

  setInventarioProducto(data:any){
    let token = localStorage.getItem('userToken');
      var header = {
        headers: new HttpHeaders()
          .set('Authorization',  `Bearer ${token}`)
      }
      return this.http.put(`${this.apiUrl}inventario/productos`, data, header);
  }

  

}
