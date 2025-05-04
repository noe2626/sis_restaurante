import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private apiUrl = environment.urlApi;
  
  constructor(private http: HttpClient) {}

  guardarProveedor(proveedor:any){
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
        .set('Authorization',  `Bearer ${token}`)
    }
    if(proveedor.id){
      return this.http.put(`${this.apiUrl}proveedores/${proveedor.id}`, proveedor, header);
    }else{
      return this.http.post(`${this.apiUrl}proveedores`, proveedor, header);
    }
    
  }

  listarProveedores(){
    let token = localStorage.getItem('userToken');
    var header = {
      headers: new HttpHeaders()
      .set('Authorization',  `Bearer ${token}`)
    }
    return this.http.get(`${this.apiUrl}proveedores`, header);
  }

}
