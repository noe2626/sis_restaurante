import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private apiUrl = "http://127.0.0.1:8000/api/";

  constructor(private http: HttpClient) {}

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

}
